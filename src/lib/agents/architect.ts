import { generateText } from "ai";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyses, documents, executionPrompts } from "@/lib/db/schema";
import { openrouter, ARCHITECT_MODEL, ARCHITECT_FAST_MODEL, callAIWithRetry, callAIStructured } from "@/lib/ai/client";
import { getOpportunityById, getOpportunitiesByScan, getScanById } from "@/actions/scout-actions";
import {
  getTechnologyCatalog,
  getScreenPatternCatalog,
  getSelectedTechFragments,
  getSelectedScreenFragments,
  getTechSynergiesForSlugs,
  getTechSlugs,
  getScreenPatternSlugs,
  getSelectedTechDetails,
} from "@/actions/knowledge-actions";
import {
  buildAiExpectationsPrompt,
  buildStrategicPlanningPrompt,
  buildAiApproachPrompt,
  buildDevTinkeringPrompt,
  buildTechSelectionPrompt,
  buildPrdDocPromptA,
  buildPrdDocPromptB,
  buildExecutionPrompt1,
  buildExecutionPrompt2,
  buildExecutionPrompt3,
  buildVisualStrategyPromptA,
  buildVisualStrategyPromptB,
  buildTechnicalArchitecturePrompt,
  formatSchemaAnchor,
  buildClaudeMdContent,
  buildMcpJsonContent,
  buildEnvExampleContent,
  buildClaudeCommandsContent,
  buildAgentDefinitions,
  buildBuildStrategyContent,
  buildClaudeSettingsContent,
  buildBundledSkills,
  buildSetupWalkthroughContent,
  getIncludedMcpServerNames,
  type ClaudeMdInput,
  type BundledSkillInput,
  aiExpectationsSchema,
  strategicPlanSchema,
  aiApproachSchema,
  devPlanSchema,
  techSelectionSchema,
  visualStrategySchemaA,
  visualStrategySchemaB,
  type ArchitectContext,
  type ExecutionPromptInput,
  type ExecutionPromptScreen,
} from "@/lib/ai/architect-prompts";
import { CancelledError } from "@/lib/errors";
import type {
  AnalysisStep,
  ArchitectSSEEvent,
  AnalysisDocument,
  MasterIdea,
  Opportunity,
} from "@/lib/types";

// --- Structured Warning Taxonomy (Phase 2) ---
interface PipelineWarning {
  category: "validation" | "consistency" | "quality" | "truncation" | "missing" | "failure";
  severity: "info" | "warning" | "error";
  document: string;
  message: string;
  suggestedFix?: string;
}

function addWarning(
  warnings: PipelineWarning[],
  category: PipelineWarning["category"],
  severity: PipelineWarning["severity"],
  document: string,
  message: string,
  suggestedFix?: string
) {
  warnings.push({ category, severity, document, message, suggestedFix });
}

// --- Complexity Classifier (Phase 2) ---
type AppComplexity = "simple" | "moderate" | "complex";

function classifyComplexity(ctx: ArchitectContext): AppComplexity {
  let screenEstimate = 0;
  let hasMultipleAIFeatures = false;

  if (ctx.type === "masterIdea") {
    // Estimate screens from feature count
    const featureCount = ctx.masterIdea.competitorFlaws?.length ?? 0;
    screenEstimate = Math.max(5, Math.min(featureCount + 3, 20));
    hasMultipleAIFeatures = (ctx.masterIdea.coreFeatures?.length ?? 0) > 3;
  } else {
    // Single opportunity — estimate from pain points and feature requests
    const painPoints = ctx.opportunity.sentiment?.painPoints?.length ?? 0;
    const featureRequests = ctx.opportunity.sentiment?.featureRequests?.length ?? 0;
    screenEstimate = Math.max(4, Math.min(painPoints + featureRequests + 2, 15));
    hasMultipleAIFeatures = featureRequests > 5;
  }

  if (screenEstimate <= 5 && !hasMultipleAIFeatures) return "simple";
  if (screenEstimate > 10 || hasMultipleAIFeatures) return "complex";
  return "moderate";
}

// --- Output Validation Gate (Phase 2) ---
function validateOutputCoherence(
  techSelectionData: Record<string, unknown>,
  epDocuments: { ep1: string; ep2: string; ep3: string },
  warnings: PipelineWarning[]
) {
  try {
    const selectedTechs = (techSelectionData.selectedTechnologies as Array<{ techSlug: string }>) ?? [];
    const appScreens = (techSelectionData.appScreens as Array<{ screenName: string; promptOrder: number }>) ?? [];
    const allEPContent = [epDocuments.ep1, epDocuments.ep2, epDocuments.ep3].filter(Boolean).join(" ");
    const allEPLower = allEPContent.toLowerCase();

    // Check: every tech in selectedTechnologies appears in at least one EP
    for (const tech of selectedTechs) {
      const slugWords = tech.techSlug.split("-");
      const found = slugWords.some(word => word.length > 2 && allEPLower.includes(word));
      if (!found) {
        addWarning(warnings, "validation", "warning", "coherence",
          `Tech "${tech.techSlug}" not referenced in any EP`,
          "Verify this technology is used in the implementation");
      }
    }

    // Check: every screen appears in exactly one EP
    for (const screen of appScreens) {
      const screenLower = screen.screenName.toLowerCase();
      const epMatches = [epDocuments.ep1, epDocuments.ep2, epDocuments.ep3]
        .filter(Boolean)
        .filter(ep => ep.toLowerCase().includes(screenLower));
      if (epMatches.length === 0) {
        addWarning(warnings, "validation", "warning", "coherence",
          `Screen "${screen.screenName}" not found in any EP`,
          "Check if the screen name was paraphrased differently in the EP");
      }
    }
  } catch (e) {
    console.warn("[architect] Output coherence validation failed:", e);
  }
}

// Tiered timeouts — Sonnet steps are fast, Opus steps/EPs need more headroom
const STEP_FAST_TIMEOUT_MS = 180_000;  // 3 min — Sonnet steps 1-4
const STEP_OPUS_TIMEOUT_MS = 360_000;  // 6 min — Opus step 5 (complex schema + 16k tokens)
const DOC_FAST_TIMEOUT_MS = 480_000;   // 8 min — Sonnet PRD/VS/TechArch (PRD can take ~300s for 16k tokens via OpenRouter)
const EP_TIMEOUT_MS = 480_000;         // 8 min — Opus EPs

export type ArchitectInput =
  | { type: "opportunity"; opportunityId: string }
  | { type: "masterIdea"; scanId: string };

// --- Cancel support ---
const activeAnalysisControllers = new Map<string, AbortController>();

export function cancelArchitectPipeline(analysisId: string): boolean {
  const controller = activeAnalysisControllers.get(analysisId);
  if (controller) {
    controller.abort();
    return true;
  }
  return false;
}


export function isAnalysisActive(analysisId: string): boolean {
  return activeAnalysisControllers.has(analysisId);
}

function checkCancelled(signal: AbortSignal) {
  if (signal.aborted) throw new CancelledError("Analysis was cancelled");
}

// --- Post-generation validation helpers ---

/**
 * Check VS Parts A and B for internal financial consistency.
 * Compares monthly projection sums to yearly projection, and
 * recalculates Go/No-Go weightedScore from actual scores*weights.
 * Also clamps MRR, conversion rates, YoY growth, and competitive self-scores.
 */
function checkVSConsistency(vsA: unknown, vsB: unknown, warnings: string[]) {
  try {
    const partA = vsA as Record<string, unknown> | null;
    const partB = vsB as Record<string, unknown> | null;

    // --- Clamp monthly projections: MRR ≤ $8,000 ---
    if (partA) {
      const revenueModel = partA.revenueModel as Record<string, unknown> | undefined;
      const monthlyProjections = revenueModel?.monthlyProjections as Array<{ month?: number; users?: number; revenue?: number }> | undefined;

      if (Array.isArray(monthlyProjections)) {
        for (const mp of monthlyProjections) {
          if (typeof mp.revenue === "number" && mp.revenue > 8000) {
            warnings.push(`VS monthly projection month ${mp.month ?? "?"}: MRR $${mp.revenue.toLocaleString()} clamped to $8,000`);
            mp.revenue = 8000;
          }
          // Clamp Month 12 users to 5,000
          if (typeof mp.month === "number" && mp.month >= 12 && typeof mp.users === "number" && mp.users > 5000) {
            warnings.push(`VS monthly projection month ${mp.month}: users ${mp.users.toLocaleString()} clamped to 5,000`);
            mp.users = 5000;
          }
        }
      }

      // --- Clamp competitive matrix self-scores (isOurs=true: max 7/10, enforce variation) ---
      const competitiveMatrix = partA.competitiveMatrix as Array<{ name?: string; isOurs?: boolean; scores?: Array<{ category?: string; score?: number }> }> | undefined;
      if (Array.isArray(competitiveMatrix)) {
        for (const entry of competitiveMatrix) {
          if (entry.isOurs && Array.isArray(entry.scores)) {
            for (const s of entry.scores) {
              if (typeof s.score === "number" && s.score > 7) {
                warnings.push(`VS competitive matrix: ${entry.name} self-score "${s.category}" ${s.score}/10 clamped to 7 (unreleased app)`);
                s.score = 7;
              }
            }
            // Enforce variation: if all scores are identical, force differentiation
            const numericScores = entry.scores.filter(s => typeof s.score === "number").map(s => s.score!);
            const allSame = numericScores.length >= 3 && numericScores.every(s => s === numericScores[0]);
            if (allSame && numericScores.length >= 3) {
              warnings.push(`VS competitive matrix: ${entry.name} has flat self-scores (${numericScores.join("/")}). Forcing variation.`);
              // Set the weakest category (last one) to 5, second-weakest to 6
              entry.scores[entry.scores.length - 1]!.score = 5;
              if (entry.scores.length >= 4) {
                entry.scores[entry.scores.length - 2]!.score = 6;
              }
            }
          }
        }
      }

      // --- Revenue arithmetic check: revenue ≈ users × conversion × ARPU ---
      const projectedArpu = revenueModel?.projectedArpu as string | undefined;
      const arpu = projectedArpu ? parseFloat(String(projectedArpu).replace(/[^0-9.]/g, '')) : 0;

      // Try to extract conversion rate from multiple locations:
      // 1. revenueModel.strategy text (Part A)
      // 2. Part B revenueProjections.freemiumConversionRate (AI often adds this extra field)
      // 3. Any string field in revenueModel containing a % pattern
      let convRate = 0;
      const strategyText = typeof revenueModel?.strategy === 'string' ? revenueModel.strategy : '';
      const convMatch = strategyText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:conversion|free.to.paid|freemium)/i);
      if (convMatch) {
        convRate = parseFloat(convMatch[1]) / 100;
      }
      // Fallback: check Part B revenueProjections for freemiumConversionRate or similar fields
      if (convRate === 0 && partB) {
        const revProj = (partB as Record<string, unknown>).revenueProjections as Record<string, unknown> | undefined;
        if (revProj) {
          // Check common field names the AI uses for conversion rate
          for (const key of ['freemiumConversionRate', 'conversionRate', 'freeToProConversion', 'conversion']) {
            const val = revProj[key];
            if (typeof val === 'string') {
              const m = val.match(/(\d+(?:\.\d+)?)\s*%/);
              if (m) { convRate = parseFloat(m[1]) / 100; break; }
            } else if (typeof val === 'number' && val > 0 && val < 1) {
              convRate = val; break;
            }
          }
        }
      }

      // Use fallback values if extraction failed — arithmetic check is too important to skip
      // Clamp extracted conversion rate to max 10% — anything higher is unrealistic for indie freemium apps
      // (industry average is 2-5%, top performers reach 7-10%)
      if (convRate > 0.10) {
        warnings.push(`VS consistency: AI-stated conversion rate ${(convRate * 100).toFixed(1)}% exceeds 10% maximum — clamped to 5% for validation`);
        convRate = 0.05;
      }
      const effectiveConvRate = convRate > 0 ? convRate : 0.04; // 4% fallback (midpoint of 2-5%)
      const effectiveArpu = arpu > 0 ? arpu : 9.99; // $9.99 fallback (typical indie app)
      if (convRate === 0) {
        warnings.push('VS consistency: Could not extract conversion rate from AI output — using 4% fallback for arithmetic validation');
      }
      if (arpu === 0) {
        warnings.push('VS consistency: Could not extract ARPU from AI output — using $9.99 fallback for arithmetic validation');
      }

      if (Array.isArray(monthlyProjections)) {
        for (const mp of monthlyProjections) {
          if (typeof mp.users === 'number' && typeof mp.revenue === 'number' && mp.users > 0) {
            const expectedRevenue = Math.round(mp.users * effectiveConvRate * effectiveArpu);
            const maxAcceptable = Math.round(expectedRevenue * 1.5); // 1.5x tolerance (tightened from 2x)
            if (mp.revenue > maxAcceptable && mp.revenue > 200) {
              warnings.push(
                `VS month ${mp.month ?? '?'}: revenue $${mp.revenue} exceeds 1.5x expected ($${expectedRevenue} = ${mp.users} users × ${(effectiveConvRate * 100).toFixed(0)}% × $${effectiveArpu.toFixed(2)} ARPU). Clamped to $${maxAcceptable}.`
              );
              mp.revenue = maxAcceptable;
            }

            // Explicit implied conversion rate check — catch projections where revenue/users implies > 10%
            const impliedConvRate = mp.revenue / (mp.users * effectiveArpu);
            if (impliedConvRate > 0.10 && mp.revenue > 200) {
              const clampedRevenue = Math.round(mp.users * 0.05 * effectiveArpu); // Clamp to 5% conversion
              warnings.push(
                `VS month ${mp.month ?? '?'}: implied conversion rate ${(impliedConvRate * 100).toFixed(1)}% exceeds 10% (revenue $${mp.revenue} / ${mp.users} users / $${effectiveArpu.toFixed(2)} ARPU). Revenue clamped to $${clampedRevenue} (5% rate).`
              );
              mp.revenue = clampedRevenue;
            }
          }
        }
      }

      // --- Arithmetic cross-check: Month 12 revenue ≈ users × conversionRate × price ---
      if (Array.isArray(monthlyProjections) && monthlyProjections.length >= 12) {
        const m12 = monthlyProjections[monthlyProjections.length - 1];
        if (m12 && typeof m12.users === 'number' && typeof m12.revenue === 'number' && m12.users > 0) {
          const expectedM12Revenue = Math.round(m12.users * effectiveConvRate * effectiveArpu);
          const diff = Math.abs(m12.revenue - expectedM12Revenue);
          const threshold = expectedM12Revenue * 0.20; // 20% tolerance
          if (diff > threshold && expectedM12Revenue > 0) {
            warnings.push(
              `VS Month 12 arithmetic cross-check: projected revenue $${m12.revenue} differs from expected $${expectedM12Revenue} (${m12.users} users × ${(effectiveConvRate * 100).toFixed(1)}% × $${effectiveArpu.toFixed(2)}) by >${((diff / expectedM12Revenue) * 100).toFixed(0)}%. Clamping to formula result.`
            );
            m12.revenue = expectedM12Revenue;
          }
        }
      }
    }

    // --- Clamp yearly projections: YoY ≤ 80%, revenue caps ---
    if (partB) {
      const revenueProjections = (partB as Record<string, unknown>).revenueProjections as Record<string, unknown> | undefined;
      const yearlyProjections = revenueProjections?.yearlyProjections as Array<{ year?: number; users?: number; revenue?: number }> | undefined;

      if (Array.isArray(yearlyProjections)) {
        // Year 1 revenue cap: $50,000
        if (yearlyProjections[0] && typeof yearlyProjections[0].revenue === "number" && yearlyProjections[0].revenue > 50000) {
          warnings.push(`VS Year 1 revenue $${yearlyProjections[0].revenue.toLocaleString()} clamped to $50,000`);
          yearlyProjections[0].revenue = 50000;
        }

        // Year 2+: enforce 50-80% YoY growth cap
        for (let i = 1; i < yearlyProjections.length; i++) {
          const prev = yearlyProjections[i - 1];
          const curr = yearlyProjections[i];
          if (typeof prev.revenue === "number" && typeof curr.revenue === "number" && prev.revenue > 0) {
            const maxRevenue = Math.round(prev.revenue * 1.8); // 80% YoY max
            if (curr.revenue > maxRevenue) {
              warnings.push(`VS Year ${curr.year ?? i + 1} revenue $${curr.revenue.toLocaleString()} exceeds 80% YoY growth, clamped to $${maxRevenue.toLocaleString()}`);
              curr.revenue = maxRevenue;
            }
          }
        }

        // Year 3 revenue cap: $120,000
        if (yearlyProjections[2] && typeof yearlyProjections[2].revenue === "number" && yearlyProjections[2].revenue > 120000) {
          warnings.push(`VS Year 3 revenue $${yearlyProjections[2].revenue.toLocaleString()} clamped to $120,000`);
          yearlyProjections[2].revenue = 120000;
        }
      }

      // Validate conversion rate text if present
      const monthlyChurnRate = revenueProjections?.monthlyChurnRate;
      if (typeof monthlyChurnRate === "string") {
        const churnMatch = monthlyChurnRate.match(/(\d+(?:\.\d+)?)\s*%/);
        if (churnMatch && parseFloat(churnMatch[1]) > 15) {
          warnings.push(`VS churn rate ${monthlyChurnRate} unusually high for subscription app`);
        }
      }
    }

    // --- Monthly vs yearly consistency check ---
    if (partA && partB) {
      const revenueModel = partA.revenueModel as Record<string, unknown> | undefined;
      const monthlyProjections = revenueModel?.monthlyProjections as Array<{ revenue?: number }> | undefined;
      const revenueProjections = (partB as Record<string, unknown>).revenueProjections as Record<string, unknown> | undefined;
      const yearlyProjections = revenueProjections?.yearlyProjections as Array<{ revenue?: number }> | undefined;

      if (Array.isArray(monthlyProjections) && monthlyProjections.length > 0 && Array.isArray(yearlyProjections) && yearlyProjections.length > 0) {
        const monthlySum = monthlyProjections
          .slice(0, 12)
          .reduce((sum, m) => sum + (typeof m.revenue === "number" ? m.revenue : 0), 0);
        const yearlyRevenue = typeof yearlyProjections[0].revenue === "number" ? yearlyProjections[0].revenue : 0;

        if (yearlyRevenue > 0 && monthlySum > 0) {
          const diff = Math.abs(monthlySum - yearlyRevenue);
          const threshold = yearlyRevenue * 0.25;
          if (diff > threshold) {
            warnings.push(
              `VS monthly projections sum ($${monthlySum.toLocaleString()}) differs from yearly projection ($${yearlyRevenue.toLocaleString()}) by >25%`
            );
          }
        }
      }
    }

    // Recalculate Go/No-Go weightedScore from actual score*weight pairs
    if (partB) {
      const goNoGo = (partB as Record<string, unknown>)?.goNoGoScorecard as Record<string, unknown> | undefined;
      const scores = goNoGo?.scores as Array<{ score?: number; weight?: number }> | undefined;

      if (Array.isArray(scores) && scores.length > 0 && goNoGo) {
        const weightSum = scores.reduce((s, item) => s + (typeof item.weight === "number" ? item.weight : 0), 0);
        const normalizer = (weightSum > 0.95 && weightSum < 1.05) ? 1 : (weightSum > 0 ? 1 / weightSum : 1);

        const calculatedScore = scores.reduce((s, item) => {
          const sc = typeof item.score === "number" ? item.score : 0;
          const wt = typeof item.weight === "number" ? item.weight : 0;
          return s + sc * wt * normalizer;
        }, 0);

        goNoGo.weightedScore = Math.round(calculatedScore * 100) / 100;
      }
    }
  } catch (e) {
    console.warn("[architect] VS consistency check failed:", e);
  }
}

/** Scan EP3 content for fabricated social proof patterns. */
function checkEP3SocialProof(ep3Content: string, warnings: string[]) {
  const fabricatedPatterns = [
    /join\s+\d[\d,]*\+?\s*(users|customers|people|members)/i,
    /rated\s+#?\d/i,
    /"?\d[\d,]*\+?\s*(downloads|installs)/i,
  ];
  for (const pattern of fabricatedPatterns) {
    if (pattern.test(ep3Content)) {
      warnings.push("EP3 may contain fabricated social proof — review before use");
      break;
    }
  }
}

/**
 * Post-pipeline quality checks across all execution prompts.
 * Detects code blocks, verifies tech slug references, checks pricing in EP3.
 */
function runQualityChecks(
  epDocuments: { ep1: string; ep2: string; ep3: string },
  selectedTechSlugs: string[],
  warnings: string[]
) {
  try {
    const allEPContent = [epDocuments.ep1, epDocuments.ep2, epDocuments.ep3].filter(Boolean);

    // Check for triple-backtick code blocks in any EP
    for (const content of allEPContent) {
      if (content.includes("```")) {
        warnings.push("Execution prompt contains code blocks — should use prose format");
        break;
      }
    }

    // Verify tech slugs are referenced somewhere in EPs
    if (selectedTechSlugs.length > 0) {
      const combined = allEPContent.join(" ").toLowerCase();
      const missingTechs = selectedTechSlugs.filter(slug => !combined.includes(slug.toLowerCase()));
      if (missingTechs.length > 0) {
        warnings.push(`Tech slugs not referenced in any EP: ${missingTechs.join(", ")}`);
      }
    }

    // Check that pricing appears in EP3
    if (epDocuments.ep3) {
      const ep3Lower = epDocuments.ep3.toLowerCase();
      const hasPricing = ep3Lower.includes("$") || ep3Lower.includes("price") || ep3Lower.includes("pricing");
      if (!hasPricing) {
        warnings.push("EP3 does not mention pricing — pricing/monetization section may be missing");
      }
    }
  } catch (e) {
    console.warn("[architect] Quality check failed:", e);
  }
}

/**
 * Post-generation schema validation: check if EP content uses table/field names
 * that match the canonical schema anchor from TechArch.
 * Reports warnings for any detected name drift (e.g., "users_profile" vs "user_profiles").
 */
function validateEPSchemaConsistency(
  epContent: string,
  schemaAnchor: string,
  epLabel: string,
  warnings: string[]
) {
  if (!schemaAnchor || !epContent) return;

  try {
    // Parse canonical table names from schema anchor
    const canonicalTables: string[] = [];
    for (const line of schemaAnchor.split("\n")) {
      const match = line.match(/^-\s+(\w+):/);
      if (match) canonicalTables.push(match[1]);
    }

    if (canonicalTables.length === 0) return;

    // Look for common drift patterns: table names that are close but not exact matches
    const epLower = epContent.toLowerCase();
    const driftPatterns: [string, string[]][] = [
      // [canonical, common AI alternatives]
      ["user_profiles", ["users_profile", "userprofile", "userprofiles", "profile_table"]],
      ["routines", ["routine_table", "user_routines"]],
      ["routine_steps", ["routine_step", "steps"]],
      ["skin_logs", ["skinlog", "skin_log_entries", "log_entries"]],
      ["products", ["product_table", "user_products"]],
      ["completed_steps", ["completed_step_ids", "step_completions"]],
    ];

    for (const [canonical, alternatives] of driftPatterns) {
      // Only check if canonical name is in our schema anchor
      if (!canonicalTables.some(t => t.toLowerCase() === canonical)) continue;

      for (const alt of alternatives) {
        // Check for the alternative being used (case insensitive, word boundary via underscore/space context)
        if (epLower.includes(alt) && !epLower.includes(canonical)) {
          warnings.push(`${epLabel} uses "${alt}" instead of canonical table name "${canonical}" — schema drift detected`);
        }
      }
    }
  } catch (e) {
    console.warn(`[architect] ${epLabel} schema validation failed:`, e);
  }
}

/**
 * Post-generation pricing validation: check if EP content uses prices that match
 * the pricing anchor from Step 2.
 * Reports warnings when EP references different prices than the anchor.
 */
function validateEPPricingConsistency(
  epContent: string,
  pricingAnchor: string,
  epLabel: string,
  warnings: string[]
) {
  if (!pricingAnchor || !epContent) return;

  try {
    // Extract price values from the anchor (e.g., "$5.99", "$47.99", "$79.99")
    const anchorPrices = pricingAnchor.match(/\$\d+(?:\.\d{2})?/g) ?? [];
    if (anchorPrices.length === 0) return;

    // Extract price values from EP content
    const epPrices = epContent.match(/\$\d+(?:\.\d{2})?/g) ?? [];
    if (epPrices.length === 0) return;

    // Find prices in EP that aren't in the anchor (potential drift)
    const anchorSet = new Set(anchorPrices);
    const driftedPrices = [...new Set(epPrices)].filter(p => {
      // Skip very small amounts ($0, $1) or very large amounts ($1000+) that aren't subscription prices
      const val = parseFloat(p.replace('$', ''));
      if (val === 0 || val >= 1000) return false;
      return !anchorSet.has(p);
    });

    if (driftedPrices.length > 0) {
      warnings.push(
        `${epLabel} pricing drift: EP uses ${driftedPrices.join(', ')} which are not in pricing anchor (${anchorPrices.join(', ')})`
      );
    }
  } catch (e) {
    console.warn(`[architect] ${epLabel} pricing validation failed:`, e);
  }
}

/**
 * Extract canonical table names and key fields from Technical Architecture markdown.
 * Returns a compact multi-line string for injection into EP prompts as a schema anchor.
 */
function extractSchemaAnchor(techArchContent: string): string {
  try {
    const lines = techArchContent.split("\n");
    const tables: string[] = [];
    let currentTable = "";
    let currentFields: string[] = [];

    for (const line of lines) {
      // Match table definitions: lines like "### `table_name`" or "**table_name**" or "- `table_name`:"
      const tableMatch = line.match(/(?:#{2,4}\s+`(\w+)`|^\*\*(\w+)\*\*|\-\s+`(\w+)`\s*[:\(])/);
      if (tableMatch) {
        // Save previous table if any
        if (currentTable && currentFields.length > 0) {
          tables.push(`- ${currentTable}: ${currentFields.join(", ")}`);
        }
        currentTable = tableMatch[1] || tableMatch[2] || tableMatch[3];
        currentFields = [];
        continue;
      }

      // Match field definitions within a table: "- `field_name`" or "  - field_name (type)" or "| field_name |"
      if (currentTable) {
        const fieldMatch = line.match(/(?:\-\s+`(\w+)`|\-\s+(\w+)\s*[\(:]|\|\s*(\w+)\s*\|)/);
        if (fieldMatch) {
          const field = fieldMatch[1] || fieldMatch[2] || fieldMatch[3];
          if (field && !["table", "column", "type", "description", "constraint", "index", "default", "notes"].includes(field.toLowerCase())) {
            currentFields.push(field);
          }
        }
      }
    }

    // Save last table
    if (currentTable && currentFields.length > 0) {
      tables.push(`- ${currentTable}: ${currentFields.join(", ")}`);
    }

    if (tables.length === 0) return "";

    return `Tables and canonical field names:\n${tables.join("\n")}`;
  } catch {
    return "";
  }
}

/** Build a blue ocean low-confidence caveat for Step 1 prompt. */
function getBlueOceanCaveat(ctx: ArchitectContext): string {
  try {
    if (ctx.type === "masterIdea") {
      for (const opp of ctx.opportunities) {
        if (opp.blueOcean && opp.blueOcean.confidence < 40) {
          return `\n\nNOTE: Blue ocean assessment has low confidence (${opp.blueOcean.confidence}%). Treat the 'no competitors' claim with skepticism — competitors may exist but were not found by search queries.`;
        }
      }
    } else if (ctx.type === "opportunity") {
      if (ctx.opportunity.blueOcean && ctx.opportunity.blueOcean.confidence < 40) {
        return `\n\nNOTE: Blue ocean assessment has low confidence (${ctx.opportunity.blueOcean.confidence}%). Treat the 'no competitors' claim with skepticism — competitors may exist but were not found by search queries.`;
      }
    }
  } catch {
    // Silently ignore — caveat is best-effort
  }
  return "";
}

// ============================================
// Architect Agent - Pipeline Runner
// Orchestrates the 4-step analysis + document generation
// ============================================

const STEP_DEFINITIONS: { step: number; title: string }[] = [
  { step: 1, title: "AI Expectations Analysis" },
  { step: 2, title: "Strategic Planning" },
  { step: 3, title: "AI Approach & Architecture" },
  { step: 4, title: "Development & Tinkering Plan" },
  { step: 5, title: "Technology Selection & Screen Mapping" },
];

function createInitialSteps(): AnalysisStep[] {
  return STEP_DEFINITIONS.map(({ step, title }) => ({
    step,
    title,
    status: "pending" as const,
    content: "",
  }));
}

function updateStep(
  steps: AnalysisStep[],
  stepNumber: number,
  update: Partial<AnalysisStep>
): AnalysisStep[] {
  return steps.map((s) =>
    s.step === stepNumber ? { ...s, ...update } : s
  );
}

async function saveSteps(analysisId: string, steps: AnalysisStep[]) {
  await db
    .update(analyses)
    .set({ stepsJson: JSON.stringify(steps) })
    .where(eq(analyses.id, analysisId));
}

async function callAIText(
  prompt: string,
  signal?: AbortSignal,
  maxOutputTokens: number = 16384,
  timeoutMs?: number,
  label?: string,
  model: string = ARCHITECT_MODEL,
): Promise<string> {
  if (label) {
    console.log(`[ai] callAIText: ${label} via ${model} (maxTokens=${maxOutputTokens})`);
  }
  return callAIWithRetry(async () => {
    const { text } = await generateText({
      model: openrouter(model),
      prompt,
      maxOutputTokens,
      abortSignal: signal,
    });
    return text;
  }, 3, signal, timeoutMs);
}

function formatStructuredContent(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Create a compact summary of step output for passing to subsequent steps.
 * Truncates strings, limits array sizes, and removes verbose nested data
 * to reduce token count while preserving key decisions.
 */
function formatStepSummary(data: unknown, consumer: "default" | "step5" = "default"): string {
  const maxChars = consumer === "step5" ? 500 : 300;
  const maxItems = consumer === "step5" ? 6 : 4;
  const truncated = truncateDeep(data, 2, 0, maxChars, maxItems);
  return JSON.stringify(truncated, null, 2);
}

function truncateDeep(obj: unknown, maxDepth: number, depth: number = 0, maxChars: number = 300, maxItems: number = 4): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj === "string") {
    return obj.length > maxChars ? obj.slice(0, maxChars) + "..." : obj;
  }
  if (depth > maxDepth) return "[...]";
  if (Array.isArray(obj)) {
    return obj.slice(0, maxItems).map((item) => truncateDeep(item, maxDepth, depth + 1, maxChars, maxItems));
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Skip sample quotes and verbose example arrays
      const lk = key.toLowerCase();
      if (lk.includes("quote") || lk.includes("sample")) continue;
      result[key] = truncateDeep(value, maxDepth, depth + 1, maxChars, maxItems);
    }
    return result;
  }
  return obj;
}

export async function runArchitectPipeline(
  input: ArchitectInput,
  sendEvent: (event: ArchitectSSEEvent) => void
) {
  const pipelineStart = Date.now();
  const logTiming = (label: string) =>
    console.log(`[architect] ${label} — ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s elapsed`);

  // 1. Resolve context based on input type
  logTiming("Resolving context");
  let ctx: ArchitectContext;
  let dbOpportunityId: string | null = null;
  let dbScanId: string | null = null;
  let docLabel: string;

  if (input.type === "opportunity") {
    const opportunity = await getOpportunityById(input.opportunityId);
    if (!opportunity) {
      sendEvent({ type: "error", message: "Opportunity not found" });
      return;
    }
    ctx = { type: "opportunity", opportunity };
    dbOpportunityId = input.opportunityId;
    docLabel = opportunity.scrapedApp.title;
  } else {
    const scan = await getScanById(input.scanId);
    if (!scan || !scan.masterIdea) {
      sendEvent({ type: "error", message: "Scan or Master Idea not found" });
      return;
    }
    const opportunities = await getOpportunitiesByScan(input.scanId);
    ctx = { type: "masterIdea", masterIdea: scan.masterIdea, opportunities };
    dbScanId = input.scanId;
    docLabel = scan.masterIdea.name;
  }
  logTiming("Context resolved");

  // Classify complexity to adjust token budgets (Phase 2)
  const complexity = classifyComplexity(ctx);
  logTiming(`Complexity classified: ${complexity}`);

  // 2. Create analysis record
  const analysisId = uuid();
  const now = new Date().toISOString();
  let steps = createInitialSteps();

  // Set up cancellation
  const abortController = new AbortController();
  activeAnalysisControllers.set(analysisId, abortController);
  const { signal } = abortController;

  // Emit analysis_started IMMEDIATELY — before DB write — for fast UI feedback
  sendEvent({ type: "analysis_started", analysisId });

  await db.insert(analyses).values({
    id: analysisId,
    opportunityId: dbOpportunityId,
    scanId: dbScanId,
    status: "running",
    stepsJson: JSON.stringify(steps),
    createdAt: now,
  });
  logTiming("Analysis record created");

  // Pre-fetch knowledge base catalogs (used by Steps 3 and 5) — Phase 3 optimization
  const [techCatalog, screenCatalog] = await Promise.all([
    getTechnologyCatalog(),
    getScreenPatternCatalog(),
  ]);
  logTiming("Knowledge base catalogs pre-fetched");

  try {
    // ==============================
    // Step 1: AI Expectations
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 1, { status: "running" });
    // Send SSE first for instant UI update, then persist
    sendEvent({
      type: "progress",
      step: 1,
      title: STEP_DEFINITIONS[0].title,
      status: "running",
    });
    await saveSteps(analysisId, steps).catch((err) =>
      console.warn(`[architect] Failed to save running status for step 1:`, err)
    );
    logTiming("Step 1 started");

    // Fix 3D: Append blue ocean low-confidence caveat to Step 1 prompt
    const step1Prompt = buildAiExpectationsPrompt(ctx) + getBlueOceanCaveat(ctx);

    const aiExpectationsData = await callAIStructured(
      step1Prompt,
      aiExpectationsSchema,
      "aiExpectations",
      "User expectations analysis for an AI-powered app alternative",
      signal,
      ARCHITECT_FAST_MODEL,
      complexity === "simple" ? 6144 : 8192,
      STEP_FAST_TIMEOUT_MS,
    );
    checkCancelled(signal);
    logTiming("Step 1 AI call completed");
    const aiExpectations = formatStructuredContent(aiExpectationsData);
    const aiExpectationsSummary = formatStepSummary(aiExpectationsData);
    const ageRating = (aiExpectationsData as Record<string, unknown>)?.ageRating as string ?? "12+";

    steps = updateStep(steps, 1, {
      status: "completed",
      content: aiExpectations,
    });
    sendEvent({
      type: "progress",
      step: 1,
      title: STEP_DEFINITIONS[0].title,
      status: "completed",
      content: aiExpectations,
    });
    await saveSteps(analysisId, steps);

    // ==============================
    // Step 2: Strategic Planning
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 2, { status: "running" });
    sendEvent({
      type: "progress",
      step: 2,
      title: STEP_DEFINITIONS[1].title,
      status: "running",
    });
    await saveSteps(analysisId, steps).catch((err) =>
      console.warn(`[architect] Failed to save running status for step 2:`, err)
    );
    logTiming("Step 2 started");

    const strategicPlanData = await callAIStructured(
      buildStrategicPlanningPrompt(ctx, aiExpectationsSummary),
      strategicPlanSchema,
      "strategicPlan",
      "Business strategy and go-to-market plan",
      signal,
      ARCHITECT_FAST_MODEL,
      complexity === "simple" ? 6144 : 8192,
      STEP_FAST_TIMEOUT_MS,
    );
    checkCancelled(signal);
    logTiming("Step 2 AI call completed");
    const strategicPlan = formatStructuredContent(strategicPlanData);
    const strategicPlanSummary = formatStepSummary(strategicPlanData);

    steps = updateStep(steps, 2, {
      status: "completed",
      content: strategicPlan,
    });
    sendEvent({
      type: "progress",
      step: 2,
      title: STEP_DEFINITIONS[1].title,
      status: "completed",
      content: strategicPlan,
    });
    await saveSteps(analysisId, steps);

    // Warnings collected throughout pipeline — reported at the end (Phase 2: structured taxonomy)
    const warnings: PipelineWarning[] = [];

    // Extract pricing anchor from Step 2 for cross-document consistency
    const pricingTiers = (strategicPlanData as Record<string, unknown>)?.revenueModel as { tiers?: Array<{name: string; price: string | number; features?: string[]}> } | undefined;
    const pricingAnchor = pricingTiers?.tiers?.map((t: {name: string; price: string | number}) => {
      const priceStr = typeof t.price === 'number' ? `$${t.price.toFixed(2)}` : String(t.price);
      return `${t.name}: ${priceStr}`;
    }).join(', ') ?? '';

    if (!pricingAnchor) {
      addWarning(warnings, "missing", "warning", "pipeline", "Pricing anchor empty — VS/EP pricing may be inconsistent");
    }

    // Hardcoded conversion rate — Step 2 prompt already constrains to this range
    const conversionRateAnchor = '2-5%';

    // Extract free tier definition for cross-document consistency
    const freeTier = pricingTiers?.tiers?.find((t) => {
      const priceLower = String(t.price).toLowerCase();
      return priceLower.includes('free') || priceLower.includes('$0') || Number(String(t.price).replace(/[^0-9.]/g, '')) === 0 || t.name.toLowerCase().match(/^(free|starter|basic|lite)$/);
    });
    const freeTierAnchor = freeTier
      ? `${freeTier.name}: ${(freeTier.features ?? []).join(', ') || 'basic features'}`
      : '';

    if (!freeTierAnchor) {
      addWarning(warnings, "missing", "warning", "pipeline", "No free tier detected in pricing tiers");
    }

    // Build projection anchor combining pricing + conversion + user caps
    const projectionAnchor = [
      pricingAnchor ? `Pricing: ${pricingAnchor}` : '',
      `Conversion rate: ${conversionRateAnchor}`,
      'Month 12 users: 1,500-5,000 MAX',
      'Month 12 MRR: $2,000-$8,000 MAX',
    ].filter(Boolean).join('. ');

    // Effective pricing anchor — fallback if Step 2 returned empty pricing
    const effectivePricingAnchor = pricingAnchor || 'Freemium: Free tier + $7.99-$9.99/month premium';

    // ==============================
    // Steps 3 & 4: AI Approach + Development Plan (parallel)
    // Step 4 no longer depends on Step 3's aiApproachSummary
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 3, { status: "running" });
    steps = updateStep(steps, 4, { status: "running" });
    sendEvent({
      type: "progress",
      step: 3,
      title: STEP_DEFINITIONS[2].title,
      status: "running",
    });
    sendEvent({
      type: "progress",
      step: 4,
      title: STEP_DEFINITIONS[3].title,
      status: "running",
    });
    await saveSteps(analysisId, steps).catch((err) =>
      console.warn(`[architect] Failed to save running status for steps 3+4:`, err)
    );
    logTiming("Steps 3+4 started (parallel)");

    const [step3Result, step4Result] = await Promise.allSettled([
      callAIStructured(
        buildAiApproachPrompt(ctx, aiExpectationsSummary, strategicPlanSummary, techCatalog),
        aiApproachSchema,
        "aiApproach",
        "Technical AI approach and architecture design",
        signal,
        ARCHITECT_FAST_MODEL,
        complexity === "simple" ? 6144 : 8192,
        STEP_FAST_TIMEOUT_MS,
      ),
      callAIStructured(
        buildDevTinkeringPrompt(ctx, `## Strategic Planning\n${strategicPlanSummary}`),
        devPlanSchema,
        "devPlan",
        "Development plan with MVP scope, tech stack, and timeline",
        signal,
        ARCHITECT_FAST_MODEL,
        complexity === "simple" ? 8192 : 12288,
        STEP_FAST_TIMEOUT_MS,
      ),
    ]);
    checkCancelled(signal);
    logTiming("Steps 3+4 AI calls completed");

    // Process Step 3 result
    let aiApproach = "";
    let aiApproachSummary = "";
    let aiApproachData: unknown = null;
    if (step3Result.status === "fulfilled") {
      aiApproachData = step3Result.value;
      aiApproach = formatStructuredContent(aiApproachData);
      aiApproachSummary = formatStepSummary(aiApproachData);
      steps = updateStep(steps, 3, { status: "completed", content: aiApproach });
      sendEvent({
        type: "progress",
        step: 3,
        title: STEP_DEFINITIONS[2].title,
        status: "completed",
        content: aiApproach,
      });
    } else {
      const errMsg = step3Result.reason instanceof Error ? step3Result.reason.message : String(step3Result.reason);
      console.error("[architect] Step 3 failed:", errMsg);
      steps = updateStep(steps, 3, { status: "failed" });
      sendEvent({ type: "step_failed", step: 3, title: STEP_DEFINITIONS[2].title, message: errMsg });
      throw step3Result.reason;
    }

    // Process Step 4 result
    let devPlan = "";
    let devPlanSummary = "";
    let devPlanData: unknown = null;
    if (step4Result.status === "fulfilled") {
      devPlanData = step4Result.value;
      devPlan = formatStructuredContent(devPlanData);
      devPlanSummary = formatStepSummary(devPlanData);
      steps = updateStep(steps, 4, { status: "completed", content: devPlan });
      sendEvent({
        type: "progress",
        step: 4,
        title: STEP_DEFINITIONS[3].title,
        status: "completed",
        content: devPlan,
      });
    } else {
      const errMsg = step4Result.reason instanceof Error ? step4Result.reason.message : String(step4Result.reason);
      console.error("[architect] Step 4 failed:", errMsg);
      steps = updateStep(steps, 4, { status: "failed" });
      sendEvent({ type: "step_failed", step: 4, title: STEP_DEFINITIONS[3].title, message: errMsg });
      throw step4Result.reason;
    }

    await saveSteps(analysisId, steps);

    // Extract timeline anchor from Step 4 for cross-document consistency
    const devTimeline = (devPlanData as Record<string, unknown>)?.mvpScope as { timeline?: string; coreFeatures?: string[]; deferredFeatures?: string[] } | undefined;
    const timelineAnchor = devTimeline?.timeline ?? '';
    const mvpFeatureCount = (devTimeline?.coreFeatures ?? []).length;
    const deferredFeatures = devTimeline?.deferredFeatures ?? [];

    // Extract free tier limits from Step 4 for EP3 paywall anchoring
    // Look for limit-like patterns in the devPlan JSON (e.g., "20 checks/day", "5 routines")
    const devPlanStr = devPlan.toLowerCase();
    const limitPatterns = devPlanStr.match(/\d+\s*(?:per|\/)\s*(?:day|week|month)|free\s*(?:tier|plan)[^.]*(?:\d+[^.]*)/gi);
    const freeTierLimitsAnchor = limitPatterns ? [...new Set(limitPatterns)].map(l => `- ${l.trim()}`).join('\n') : '';

    // Full summary for document generation
    const allStepsSummary = [
      `## AI Expectations Analysis\nAge Rating: ${ageRating}\n${aiExpectationsSummary}`,
      `## Strategic Planning\n${strategicPlanSummary}`,
      `## AI Approach & Architecture\n${aiApproachSummary}`,
      `## Development & Tinkering Plan\n${devPlanSummary}`,
    ].join("\n\n");

    // Step 5 only needs concrete tech/architecture decisions (Phase 3: expanded summaries)
    const step5Summary = [
      `## AI Approach & Architecture\n${formatStepSummary(aiApproachData, "step5")}`,
      `## Development & Tinkering Plan\n${formatStepSummary(devPlanData, "step5")}`,
    ].join("\n\n");

    // ==============================
    // Step 5: Technology Selection & Screen Mapping
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 5, { status: "running" });
    sendEvent({
      type: "progress",
      step: 5,
      title: STEP_DEFINITIONS[4].title,
      status: "running",
    });
    await saveSteps(analysisId, steps).catch((err) =>
      console.warn(`[architect] Failed to save running status for step 5:`, err)
    );
    logTiming("Step 5 started");

    let techSelectionData: Record<string, unknown> | null = null;
    const STEP5_MAX_RETRIES = 2;
    let step5Attempt = 0;
    let step5LastError: string = "";

    while (step5Attempt <= STEP5_MAX_RETRIES && !techSelectionData) {
      try {
        const rawResult = await callAIStructured(
          buildTechSelectionPrompt(ctx, step5Summary, techCatalog, screenCatalog),
          techSelectionSchema,
          "techSelection",
          "Technology selection and screen mapping for execution prompts",
          signal,
          ARCHITECT_MODEL,
          complexity === "complex" ? 16384 : 12288,
          STEP_OPUS_TIMEOUT_MS,
        ) as Record<string, unknown>;
        checkCancelled(signal);

        // Validate expected shape
        const selectedTechs = rawResult?.selectedTechnologies;
        const appScreens = rawResult?.appScreens;
        if (
          !Array.isArray(selectedTechs) || selectedTechs.length === 0 ||
          !Array.isArray(appScreens) || appScreens.length === 0
        ) {
          throw new Error("Tech selection returned invalid shape: missing selectedTechnologies or appScreens arrays");
        }

        techSelectionData = rawResult;
      } catch (error) {
        if (error instanceof CancelledError || signal.aborted) throw error;
        step5LastError = error instanceof Error ? error.message : String(error);
        step5Attempt++;
        if (step5Attempt <= STEP5_MAX_RETRIES) {
          console.warn(`[architect] Tech selection attempt ${step5Attempt} failed, retrying:`, step5LastError);
        }
      }
    }
    logTiming("Step 5 AI call completed");

    // Validate tech and screen slugs against knowledge base
    if (techSelectionData) {
      const [validTechSlugs, validScreenSlugs] = await Promise.all([
        getTechSlugs(),
        getScreenPatternSlugs(),
      ]);

      // Filter invalid tech slugs
      const selectedTechs = techSelectionData.selectedTechnologies as Array<{ techSlug: string }>;
      const validatedTechs = selectedTechs.filter((t) => {
        if (validTechSlugs.has(t.techSlug)) return true;
        addWarning(warnings, "validation", "warning", "step-5", `Referenced unknown tech slug '${t.techSlug}' — removed`);
        return false;
      });
      techSelectionData.selectedTechnologies = validatedTechs;

      // Filter invalid screen pattern slugs
      const appScreens = techSelectionData.appScreens as Array<{ screenName: string; patternSlug: string; assignedTechSlugs: string[] }>;
      const validatedScreens = appScreens.filter((s) => {
        if (validScreenSlugs.has(s.patternSlug)) return true;
        addWarning(warnings, "validation", "warning", "step-5", `Referenced unknown screen pattern slug '${s.patternSlug}' — removed`);
        return false;
      });
      techSelectionData.appScreens = validatedScreens;

      // Also filter assignedTechSlugs within each screen
      for (const screen of validatedScreens) {
        const before = screen.assignedTechSlugs.length;
        screen.assignedTechSlugs = screen.assignedTechSlugs.filter((slug) => validTechSlugs.has(slug));
        if (screen.assignedTechSlugs.length < before) {
          addWarning(warnings, "validation", "warning", "step-5", `Screen '${screen.screenName}' had ${before - screen.assignedTechSlugs.length} unknown tech slug(s) removed`);
        }
      }

      // If filtering emptied the arrays, null out techSelectionData
      if (validatedTechs.length === 0 || validatedScreens.length === 0) {
        addWarning(warnings, "validation", "error", "step-5", "Slug validation removed all techs or screens — treating as failed");
        techSelectionData = null;
      }
    }

    if (!techSelectionData) {
      // Step 5 exhausted retries
      console.warn(`[architect] Tech selection failed after ${STEP5_MAX_RETRIES + 1} attempts:`, step5LastError);
      addWarning(warnings, "failure", "error", "step-5", `Technology Selection failed: ${step5LastError}. Execution Prompts will not be generated.`);

      sendEvent({
        type: "step_failed",
        step: 5,
        title: STEP_DEFINITIONS[4].title,
        message: `Technology selection failed after ${STEP5_MAX_RETRIES + 1} attempts: ${step5LastError}`,
      });

      steps = updateStep(steps, 5, {
        status: "failed" as const,
        content: "",
      });
      await saveSteps(analysisId, steps);
    } else {
      const techSelectionContent = formatStructuredContent(techSelectionData);
      steps = updateStep(steps, 5, {
        status: "completed",
        content: techSelectionContent,
      });
      await saveSteps(analysisId, steps);
      sendEvent({
        type: "progress",
        step: 5,
        title: STEP_DEFINITIONS[4].title,
        status: "completed",
        content: techSelectionContent,
      });
    }

    // ==============================
    // Generate Documents (PRD + Visual Strategy + Execution Prompts)
    // Uses Promise.allSettled so partial success still saves documents
    // ==============================
    checkCancelled(signal);
    logTiming("Document generation started");
    sendEvent({
      type: "progress",
      step: 6,
      title: "Generating Documents",
      status: "running",
    });

    // Fetch full tech + screen fragments for execution prompts
    const epScreensByPrompt: Map<number, ExecutionPromptScreen[]> = new Map();
    let epPlatform = "web-nextjs";
    let epSynergyNotes: string[] = [];

    if (techSelectionData) {
      try {
        const selectedTechs = (techSelectionData.selectedTechnologies as Array<{ techSlug: string }>) ?? [];
        const appScreens = (techSelectionData.appScreens as Array<{
          screenName: string; patternSlug: string; assignedTechSlugs: string[]; customNotes: string; promptOrder: number;
        }>) ?? [];
        epPlatform = (techSelectionData.platform as string) ?? "web-nextjs";

        // Collect all unique slugs
        const allTechSlugs = [...new Set(selectedTechs.map((t) => t.techSlug))];
        const allPatternSlugs = [...new Set(appScreens.map((s) => s.patternSlug))];

        // Fetch fragments in parallel
        const [techFragments, screenFragments, synergies] = await Promise.all([
          getSelectedTechFragments(allTechSlugs),
          getSelectedScreenFragments(allPatternSlugs),
          getTechSynergiesForSlugs(allTechSlugs),
        ]);

        // Pre-strip code blocks from tech fragments once (Phase 3 optimization)
        for (const [, frag] of techFragments) {
          if (frag.promptFragment) {
            frag.promptFragment = frag.promptFragment.replace(/```[\s\S]*?```/g, '[See technology documentation for implementation details]');
          }
          if (frag.promptFragmentMobile) {
            frag.promptFragmentMobile = frag.promptFragmentMobile.replace(/```[\s\S]*?```/g, '[See technology documentation for implementation details]');
          }
        }

        // Build synergy notes
        epSynergyNotes = synergies
          .filter((s) => s.promptNote)
          .map((s) => s.promptNote!);

        // Also add AI-generated synergy notes from step 5
        const aiSynergyNotes = (techSelectionData.synergyNotes as Array<{ note: string }>) ?? [];
        for (const sn of aiSynergyNotes) {
          epSynergyNotes.push(sn.note);
        }

        // Group screens by promptOrder
        for (const screen of appScreens) {
          const order = screen.promptOrder || 2;
          const patternFrag = screenFragments.get(screen.patternSlug);
          const screenEntry: ExecutionPromptScreen = {
            screenName: screen.screenName,
            patternFragment: patternFrag
              ? `${patternFrag.layoutDescription}\n\n${patternFrag.promptFragment}`
              : screen.customNotes,
            techs: screen.assignedTechSlugs
              .map((slug) => {
                const tf = techFragments.get(slug);
                if (!tf) return null;
                return {
                  name: tf.name,
                  category: tf.category,
                  promptFragment: (epPlatform.includes("mobile") && tf.promptFragmentMobile)
                    ? tf.promptFragmentMobile
                    : tf.promptFragment,
                };
              })
              .filter((t): t is NonNullable<typeof t> => t !== null),
            customNotes: screen.customNotes,
          };

          const list = epScreensByPrompt.get(order) ?? [];
          list.push(screenEntry);
          epScreensByPrompt.set(order, list);
        }
      } catch (e) {
        console.warn("[architect] Failed to fetch tech/screen fragments:", e);
      }
    }

    // Targeted summaries — each document gets only the context it needs
    const prdASummary = [
      `## AI Approach & Architecture\n${aiApproachSummary}`,
      `## Development & Tinkering Plan\n${devPlanSummary}`,
      `## Strategic Planning (market context)\n${strategicPlanSummary}`,
    ].join("\n\n");

    const prdBSummary = [
      `## AI Approach & Architecture\n${aiApproachSummary}`,
      `## Development & Tinkering Plan\n${devPlanSummary}`,
      ...(techSelectionData ? [`## Technology Selection\n${formatStepSummary(techSelectionData)}`] : []),
    ].join("\n\n");

    const vsASummary = [
      `## AI Expectations\n${aiExpectationsSummary}`,
      `## Strategic Planning\n${strategicPlanSummary}`,
    ].join("\n\n");

    const vsBSummary = [
      `## AI Approach\n${aiApproachSummary}`,
      `## Development Plan\n${devPlanSummary}`,
    ].join("\n\n");

    // Technical Architecture needs full (non-truncated) step data for specific tech references
    const techArchSummary = [
      `## AI Approach & Architecture\n${aiApproach}`,
      `## Development & Tinkering Plan\n${devPlan}`,
      ...(techSelectionData ? [`## Technology Selection & Screen Mapping\n${formatStructuredContent(techSelectionData)}`] : []),
    ].join("\n\n");

    const epContextSummary = `## Development Plan\n${devPlanSummary}`;

    // Extract schema anchor from Step 5 structured output (deterministic, no regex)
    let schemaAnchor = "";
    if (techSelectionData?.databaseSchema) {
      schemaAnchor = formatSchemaAnchor(techSelectionData.databaseSchema as Array<{ tableName: string; description: string; columns: Array<{ name: string; type: string; constraints: string }> }>);
      logTiming(`Schema anchor from Step 5 structured output (${(techSelectionData.databaseSchema as unknown[]).length} tables)`);
    }

    // Build EP inputs
    const buildEPInput = (promptNumber: number): ExecutionPromptInput => ({
      ctx,
      allStepsSummary: epContextSummary,
      platform: epPlatform,
      screens: epScreensByPrompt.get(promptNumber) ?? [],
      synergyNotes: epSynergyNotes,
      selectedTechSlugs,
      schemaAnchor,
      freeTierLimits: freeTierLimitsAnchor || undefined,
      deferredFeatures: deferredFeatures.length > 0 ? deferredFeatures : undefined,
      pricingAnchor: effectivePricingAnchor || undefined,
    });

    // Build a compact cross-reference block so each EP knows what the others cover
    // without needing the full 3-16k token content of sibling EPs.
    const buildEPCrossReference = (): string => {
      const promptPlan = techSelectionData?.promptPlan as {
        prompt1Screens?: string[]; prompt1Focus?: string;
        prompt2Screens?: string[]; prompt2Focus?: string;
        prompt3Screens?: string[]; prompt3Focus?: string;
      } | undefined;

      const lines: string[] = [];
      const ep1Screens = promptPlan?.prompt1Screens ?? (epScreensByPrompt.get(1) ?? []).map(s => s.screenName);
      const ep2Screens = promptPlan?.prompt2Screens ?? (epScreensByPrompt.get(2) ?? []).map(s => s.screenName);
      const ep3Screens = promptPlan?.prompt3Screens ?? (epScreensByPrompt.get(3) ?? []).map(s => s.screenName);

      // Extract database tables from techSelectionData
      const dbSchema = techSelectionData?.databaseSchema as Array<{ tableName: string; columns?: Array<{ name: string }> }> | undefined;
      const dbTablesStr = dbSchema?.map(t => t.tableName).join(", ") ?? "see Technical Architecture";

      // Extract selected technologies for context
      const selectedTechs = (techSelectionData?.selectedTechnologies as Array<{ techSlug: string; category: string }>) ?? [];
      const authTechs = selectedTechs.filter(t => t.category === "auth").map(t => t.techSlug).join(", ") || "as configured";

      lines.push("EP1 (Foundation):");
      lines.push(`  Focus: ${promptPlan?.prompt1Focus ?? "Auth, database, navigation, settings, onboarding"}`);
      lines.push(`  Screens: ${ep1Screens.join(", ") || "none"}`);
      lines.push(`  Auth: ${authTechs}`);
      lines.push(`  Database tables: ${dbTablesStr}`);
      lines.push(`  Key artifacts: useAuthStore, useSettingsStore, auth hooks, Supabase client, navigation structure`);
      lines.push("");
      lines.push("EP2 (Core Features):");
      lines.push(`  Focus: ${promptPlan?.prompt2Focus ?? "Main app screens, AI features, primary user flows"}`);
      lines.push(`  Screens: ${ep2Screens.join(", ") || "none"}`);
      lines.push(`  Key artifacts: feature-specific stores, API integration hooks, edge functions for core features`);
      lines.push("");
      lines.push("EP3 (Polish & Production):");
      lines.push(`  Focus: ${promptPlan?.prompt3Focus ?? "Secondary screens, payments, notifications, production readiness"}`);
      lines.push(`  Screens: ${ep3Screens.join(", ") || "none"}`);
      lines.push(`  Key artifacts: payment integration, analytics setup, push notifications, production config`);
      lines.push("");
      lines.push("CRITICAL: Do NOT recreate any component, hook, store, or utility built in a previous EP.");
      lines.push("Import from existing paths. If you need to modify an existing component, edit it — do not create a duplicate.");

      return lines.join("\n");
    };

    const epCrossRef = techSelectionData ? buildEPCrossReference() : "";

    // Collect all selected tech slugs for storage
    const selectedTechSlugs = techSelectionData
      ? ((techSelectionData.selectedTechnologies as Array<{ techSlug: string }>) ?? []).map((t) => t.techSlug)
      : [];

    // ==============================
    // Batch 1: PRD (A+B) + Visual Strategy (A+B) — all Sonnet, parallel
    // ==============================
    logTiming("Batch 1 (PRD + VS + Tech Arch) starting — 5 parallel calls");
    const [prdAResult, prdBResult, vsPartAResult, vsPartBResult, techArchResult] = await Promise.allSettled([
      callAIText(buildPrdDocPromptA(ctx, prdASummary, effectivePricingAnchor, freeTierAnchor), signal, 16384, DOC_FAST_TIMEOUT_MS, "prdA", ARCHITECT_FAST_MODEL),
      callAIText(buildPrdDocPromptB(ctx, prdBSummary, effectivePricingAnchor, freeTierAnchor), signal, 20480, DOC_FAST_TIMEOUT_MS, "prdB", ARCHITECT_FAST_MODEL),
      callAIStructured(
        buildVisualStrategyPromptA(ctx, vsASummary, effectivePricingAnchor, conversionRateAnchor, projectionAnchor, freeTierAnchor),
        visualStrategySchemaA,
        "visualStrategyA",
        "Visual strategy part A: business and market analysis",
        signal,
        ARCHITECT_FAST_MODEL,
        8192,
        DOC_FAST_TIMEOUT_MS,
      ),
      callAIStructured(
        buildVisualStrategyPromptB(ctx, vsBSummary, effectivePricingAnchor, timelineAnchor, mvpFeatureCount, projectionAnchor),
        visualStrategySchemaB,
        "visualStrategyB",
        "Visual strategy part B: technical and financial analysis",
        signal,
        ARCHITECT_FAST_MODEL,
        8192,
        DOC_FAST_TIMEOUT_MS,
      ),
      callAIText(buildTechnicalArchitecturePrompt(ctx, techArchSummary, schemaAnchor), signal, 16384, DOC_FAST_TIMEOUT_MS, "techArch", ARCHITECT_FAST_MODEL),
    ]);
    logTiming("Batch 1 (PRD + VS + Tech Arch) completed");
    console.log(`[architect] Batch 1 results: prdA=${prdAResult.status} prdB=${prdBResult.status} vsA=${vsPartAResult.status} vsB=${vsPartBResult.status} techArch=${techArchResult.status}`);

    // Merge PRD parts A + B and save — retry failed parts once before accepting partial
    let prdA = prdAResult.status === "fulfilled" ? prdAResult.value : null;
    let prdB = prdBResult.status === "fulfilled" ? prdBResult.value : null;
    if (prdAResult.status === "rejected") {
      console.warn("[architect] PRD part A failed, retrying once:", prdAResult.reason);
      try {
        prdA = await callAIText(buildPrdDocPromptA(ctx, prdASummary, effectivePricingAnchor, freeTierAnchor), signal, 16384, DOC_FAST_TIMEOUT_MS, "prdA-retry", ARCHITECT_FAST_MODEL);
      } catch (retryErr) {
        console.warn("[architect] PRD part A retry also failed:", retryErr);
      }
    }
    if (prdBResult.status === "rejected") {
      console.warn("[architect] PRD part B failed, retrying once:", prdBResult.reason);
      try {
        prdB = await callAIText(buildPrdDocPromptB(ctx, prdBSummary, effectivePricingAnchor, freeTierAnchor), signal, 20480, DOC_FAST_TIMEOUT_MS, "prdB-retry", ARCHITECT_FAST_MODEL);
      } catch (retryErr) {
        console.warn("[architect] PRD part B retry also failed:", retryErr);
      }
    }

    if (prdA || prdB) {
      let mergedPrd: string;
      if (prdA && prdB) {
        mergedPrd = `${prdA}\n\n${prdB}`;
        if (!mergedPrd.includes("## 9")) {
          console.warn("[architect] PRD may be incomplete — section 9 header not found");
        }
      } else {
        mergedPrd = (prdA || prdB)!;
        addWarning(warnings, "failure", "error", "prd", `PRD is incomplete: part ${prdA ? "B" : "A"} failed after retry. Only sections ${prdA ? "1-5" : "6-9"} generated.`);
        console.warn(`[architect] PRD incomplete — only part ${prdA ? "A (sections 1-5)" : "B (sections 6-9)"} available`);
      }
      const prdDoc: AnalysisDocument = {
        id: uuid(),
        analysisId,
        type: "app_prd",
        title: `PRD: ${docLabel}`,
        content: mergedPrd,
        createdAt: new Date().toISOString(),
      };
      try {
        await db.insert(documents).values({
          id: prdDoc.id,
          analysisId: prdDoc.analysisId,
          type: prdDoc.type,
          title: prdDoc.title,
          content: prdDoc.content,
          createdAt: prdDoc.createdAt,
        });
      } catch (e) {
        addWarning(warnings, "failure", "error", "prd", "PRD failed to save to database");
        console.warn("[architect] PRD DB insert failed:", e);
      }
      sendEvent({ type: "document", document: prdDoc });
    }

    // Merge Visual Strategy parts A + B and save — retry failed parts once
    let vsA = vsPartAResult.status === "fulfilled" ? vsPartAResult.value : null;
    let vsB = vsPartBResult.status === "fulfilled" ? vsPartBResult.value : null;
    if (vsPartAResult.status === "rejected") {
      console.warn("[architect] Visual Strategy part A failed, retrying once:", vsPartAResult.reason);
      try {
        vsA = await callAIStructured(
          buildVisualStrategyPromptA(ctx, vsASummary, effectivePricingAnchor, conversionRateAnchor, projectionAnchor, freeTierAnchor), visualStrategySchemaA,
          "visualStrategyA-retry", "Visual strategy part A retry", signal,
          ARCHITECT_FAST_MODEL, 8192, DOC_FAST_TIMEOUT_MS,
        );
      } catch (retryErr) {
        console.warn("[architect] Visual Strategy part A retry also failed:", retryErr);
      }
    }
    if (vsPartBResult.status === "rejected") {
      console.warn("[architect] Visual Strategy part B failed, retrying once:", vsPartBResult.reason);
      try {
        vsB = await callAIStructured(
          buildVisualStrategyPromptB(ctx, vsBSummary, effectivePricingAnchor, timelineAnchor, mvpFeatureCount, projectionAnchor), visualStrategySchemaB,
          "visualStrategyB-retry", "Visual strategy part B retry", signal,
          ARCHITECT_FAST_MODEL, 8192, DOC_FAST_TIMEOUT_MS,
        );
      } catch (retryErr) {
        console.warn("[architect] Visual Strategy part B retry also failed:", retryErr);
      }
    }

    // Fix 3A: VS financial consistency check (bridge: collect string warnings, convert to PipelineWarning)
    if (vsA && vsB) {
      const vsWarnings: string[] = [];
      checkVSConsistency(vsA, vsB, vsWarnings);
      for (const w of vsWarnings) {
        addWarning(warnings, "consistency", "warning", "visual-strategy", w);
      }
    }

    // Cross-validate VS pricing against Step 2 pricing anchor (bridge)
    if (vsA && effectivePricingAnchor) {
      const vsStr = JSON.stringify(vsA);
      const vsPricingWarnings: string[] = [];
      validateEPPricingConsistency(vsStr, effectivePricingAnchor, "VS Part A", vsPricingWarnings);
      for (const w of vsPricingWarnings) {
        addWarning(warnings, "consistency", "warning", "visual-strategy", w);
      }
    }

    if (vsA || vsB) {
      if (!vsA || !vsB) {
        addWarning(warnings, "failure", "error", "visual-strategy", `Visual Strategy is incomplete: part ${vsA ? "B" : "A"} failed after retry.`);
      }
      const merged = { ...vsA, ...vsB };
      const strategyDoc: AnalysisDocument = {
        id: uuid(),
        analysisId,
        type: "strategic_analysis",
        title: `Visual Strategy: ${docLabel}`,
        content: JSON.stringify(merged),
        createdAt: new Date().toISOString(),
      };
      try {
        await db.insert(documents).values({
          id: strategyDoc.id,
          analysisId: strategyDoc.analysisId,
          type: strategyDoc.type,
          title: strategyDoc.title,
          content: strategyDoc.content,
          createdAt: strategyDoc.createdAt,
        });
      } catch (e) {
        addWarning(warnings, "failure", "error", "visual-strategy", "Visual Strategy failed to save to database");
        console.warn("[architect] Visual Strategy DB insert failed:", e);
      }
      sendEvent({ type: "document", document: strategyDoc });
    }

    // Save Technical Architecture document — retry once if failed
    let techArchContent: string | null = techArchResult.status === "fulfilled" ? techArchResult.value : null;
    if (techArchResult.status === "rejected") {
      console.warn("[architect] Technical Architecture failed, retrying once:", techArchResult.reason instanceof Error ? techArchResult.reason.message : String(techArchResult.reason));
      try {
        techArchContent = await callAIText(buildTechnicalArchitecturePrompt(ctx, techArchSummary, schemaAnchor), signal, 16384, DOC_FAST_TIMEOUT_MS, "techArch-retry", ARCHITECT_FAST_MODEL);
      } catch (retryErr) {
        console.warn("[architect] Technical Architecture retry also failed:", retryErr);
        addWarning(warnings, "failure", "error", "technical-architecture", "Technical Architecture document failed after retry");
      }
    }
    if (techArchContent) {
      const techArchDoc: AnalysisDocument = {
        id: uuid(),
        analysisId,
        type: "technical_architecture",
        title: `Technical Architecture: ${docLabel}`,
        content: techArchContent,
        createdAt: new Date().toISOString(),
      };
      try {
        await db.insert(documents).values({
          id: techArchDoc.id,
          analysisId: techArchDoc.analysisId,
          type: techArchDoc.type,
          title: techArchDoc.title,
          content: techArchDoc.content,
          createdAt: techArchDoc.createdAt,
        });
      } catch (e) {
        addWarning(warnings, "failure", "error", "technical-architecture", "Technical Architecture failed to save to database");
        console.warn("[architect] Technical Architecture DB insert failed:", e);
      }
      sendEvent({ type: "document", document: techArchDoc });
    }

    // Fallback: if Step 5 didn't produce databaseSchema, try regex extraction from TechArch
    if (!schemaAnchor && techArchContent) {
      schemaAnchor = extractSchemaAnchor(techArchContent);
      if (schemaAnchor) {
        console.warn("[architect] Using regex-extracted schema anchor (Step 5 databaseSchema was empty)");
        logTiming(`Schema anchor extracted via regex fallback (${schemaAnchor.split("\n").length - 1} tables)`);
      }
    }

    // ==============================
    // Batch 2: Execution Prompts (EP1, EP2, EP3) — all Opus, parallel
    // Each EP is independent thanks to the cross-reference block.
    // ==============================
    if (techSelectionData) {
      checkCancelled(signal);
      logTiming("Batch 2 (EPs) started");

      const ep1Tokens = complexity === "simple" ? 16384 : 20480;
      const ep2Tokens = complexity === "simple" ? 20480 : 24576;
      const ep3Tokens = complexity === "simple" ? 16384 : 20480;

      const [ep1Result, ep2Result, ep3Result] = await Promise.allSettled([
        callAIText(buildExecutionPrompt1(buildEPInput(1), epCrossRef), signal, ep1Tokens, EP_TIMEOUT_MS, "ep1"),
        callAIText(buildExecutionPrompt2(buildEPInput(2), epCrossRef), signal, ep2Tokens, EP_TIMEOUT_MS, "ep2"),
        callAIText(buildExecutionPrompt3(buildEPInput(3), epCrossRef), signal, ep3Tokens, EP_TIMEOUT_MS, "ep3"),
      ]);
      logTiming("Batch 2 (EPs) completed");

      // Save EP1
      if (ep1Result.status === "fulfilled" && ep1Result.value) {
        const ep1Content = ep1Result.value;
        const ep1CreatedAt = new Date().toISOString();
        try {
          await db.insert(executionPrompts).values({
            id: uuid(),
            analysisId,
            promptNumber: 1,
            title: `Foundation: ${docLabel}`,
            content: ep1Content,
            techSlugsJson: JSON.stringify(selectedTechSlugs),
            createdAt: ep1CreatedAt,
          });
        } catch (e) {
          addWarning(warnings, "failure", "error", "ep1", "EP1 executionPrompts record failed to save");
          console.warn("[architect] EP1 executionPrompts insert failed:", e);
        }
        const ep1Doc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "execution_prompt_1",
          title: `Execution Prompt 1: Foundation`,
          content: ep1Content,
          createdAt: ep1CreatedAt,
        };
        try {
          await db.insert(documents).values({
            id: ep1Doc.id,
            analysisId: ep1Doc.analysisId,
            type: ep1Doc.type,
            title: ep1Doc.title,
            content: ep1Doc.content,
            createdAt: ep1Doc.createdAt,
          });
        } catch (e) {
          addWarning(warnings, "failure", "error", "ep1", "EP1 document failed to save");
          console.warn("[architect] EP1 document insert failed:", e);
        }
        sendEvent({ type: "document", document: ep1Doc });
      } else if (ep1Result.status === "rejected") {
        console.warn("[architect] Execution Prompt 1 failed (non-fatal):", ep1Result.reason instanceof Error ? ep1Result.reason.message : String(ep1Result.reason));
      }

      // Save EP2
      if (ep2Result.status === "fulfilled" && ep2Result.value) {
        const ep2Content = ep2Result.value;
        const ep2CreatedAt = new Date().toISOString();
        try {
          await db.insert(executionPrompts).values({
            id: uuid(),
            analysisId,
            promptNumber: 2,
            title: `Core Features: ${docLabel}`,
            content: ep2Content,
            techSlugsJson: JSON.stringify(selectedTechSlugs),
            createdAt: ep2CreatedAt,
          });
        } catch (e) {
          addWarning(warnings, "failure", "error", "ep2", "EP2 executionPrompts record failed to save");
          console.warn("[architect] EP2 executionPrompts insert failed:", e);
        }
        const ep2Doc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "execution_prompt_2",
          title: `Execution Prompt 2: Core Features`,
          content: ep2Content,
          createdAt: ep2CreatedAt,
        };
        try {
          await db.insert(documents).values({
            id: ep2Doc.id,
            analysisId: ep2Doc.analysisId,
            type: ep2Doc.type,
            title: ep2Doc.title,
            content: ep2Doc.content,
            createdAt: ep2Doc.createdAt,
          });
        } catch (e) {
          addWarning(warnings, "failure", "error", "ep2", "EP2 document failed to save");
          console.warn("[architect] EP2 document insert failed:", e);
        }
        sendEvent({ type: "document", document: ep2Doc });
      } else if (ep2Result.status === "rejected") {
        console.warn("[architect] Execution Prompt 2 failed (non-fatal):", ep2Result.reason instanceof Error ? ep2Result.reason.message : String(ep2Result.reason));
      }

      // Save EP3
      if (ep3Result.status === "fulfilled" && ep3Result.value) {
        const ep3Content = ep3Result.value;
        // Fix 3B: EP3 social proof detection (bridge)
        {
          const ep3SpWarnings: string[] = [];
          checkEP3SocialProof(ep3Content, ep3SpWarnings);
          for (const w of ep3SpWarnings) {
            addWarning(warnings, "quality", "warning", "ep3", w);
          }
        }
        const ep3CreatedAt = new Date().toISOString();
        try {
          await db.insert(executionPrompts).values({
            id: uuid(),
            analysisId,
            promptNumber: 3,
            title: `Polish & Production: ${docLabel}`,
            content: ep3Content,
            techSlugsJson: JSON.stringify(selectedTechSlugs),
            createdAt: ep3CreatedAt,
          });
        } catch (e) {
          addWarning(warnings, "failure", "error", "ep3", "EP3 executionPrompts record failed to save");
          console.warn("[architect] EP3 executionPrompts insert failed:", e);
        }
        const ep3Doc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "execution_prompt_3",
          title: `Execution Prompt 3: Polish & Production`,
          content: ep3Content,
          createdAt: ep3CreatedAt,
        };
        try {
          await db.insert(documents).values({
            id: ep3Doc.id,
            analysisId: ep3Doc.analysisId,
            type: ep3Doc.type,
            title: ep3Doc.title,
            content: ep3Doc.content,
            createdAt: ep3Doc.createdAt,
          });
        } catch (e) {
          addWarning(warnings, "failure", "error", "ep3", "EP3 document failed to save");
          console.warn("[architect] EP3 document insert failed:", e);
        }
        sendEvent({ type: "document", document: ep3Doc });
      } else if (ep3Result.status === "rejected") {
        console.warn("[architect] Execution Prompt 3 failed (non-fatal):", ep3Result.reason instanceof Error ? ep3Result.reason.message : String(ep3Result.reason));
      }

      // Improved partial failure handling (Phase 2) — detect EP failures
      const epFailures = [
        ep1Result.status === "rejected" ? "EP1 (Foundation)" : null,
        ep2Result.status === "rejected" ? "EP2 (Core Features)" : null,
        ep3Result.status === "rejected" ? "EP3 (Polish)" : null,
      ].filter(Boolean);

      if (epFailures.length > 0 && epFailures.length < 3) {
        addWarning(warnings, "failure", "error", "execution-prompts",
          `Failed EPs: ${epFailures.join(", ")}. Remaining EPs may reference content from failed EPs.`,
          "Re-run the pipeline or manually create the missing EP content");
      }

      // Fix 3C: Post-pipeline quality scan across all EPs (bridge pattern for string[] warnings)
      const qcEp1 = ep1Result.status === "fulfilled" ? (ep1Result.value ?? "") : "";
      const qcEp2 = ep2Result.status === "fulfilled" ? (ep2Result.value ?? "") : "";
      const qcEp3 = ep3Result.status === "fulfilled" ? (ep3Result.value ?? "") : "";
      {
        const qcWarnings: string[] = [];
        runQualityChecks({ ep1: qcEp1, ep2: qcEp2, ep3: qcEp3 }, selectedTechSlugs, qcWarnings);
        for (const w of qcWarnings) {
          addWarning(warnings, "quality", "warning", "execution-prompts", w);
        }
      }

      // Post-generation schema validation — check EP text against canonical table names (bridge)
      if (schemaAnchor) {
        const schemaWarnings: string[] = [];
        if (qcEp1) validateEPSchemaConsistency(qcEp1, schemaAnchor, "EP1", schemaWarnings);
        if (qcEp2) validateEPSchemaConsistency(qcEp2, schemaAnchor, "EP2", schemaWarnings);
        if (qcEp3) validateEPSchemaConsistency(qcEp3, schemaAnchor, "EP3", schemaWarnings);
        for (const w of schemaWarnings) {
          addWarning(warnings, "validation", "warning", "execution-prompts", w);
        }
      }

      // Post-generation pricing validation — check EP text against pricing anchor (bridge)
      if (effectivePricingAnchor) {
        const pricingWarnings: string[] = [];
        if (qcEp3) validateEPPricingConsistency(qcEp3, effectivePricingAnchor, "EP3", pricingWarnings);
        for (const w of pricingWarnings) {
          addWarning(warnings, "consistency", "warning", "execution-prompts", w);
        }
      }

      // Output coherence validation (Phase 2)
      if (techSelectionData) {
        validateOutputCoherence(techSelectionData, { ep1: qcEp1, ep2: qcEp2, ep3: qcEp3 }, warnings);
      }

      // ==============================
      // Generate CLAUDE.md + .mcp.json (deterministic, no AI call)
      // ==============================
      try {
        logTiming("CLAUDE.md generation started");

        const techDetailsMap = await getSelectedTechDetails(selectedTechSlugs);

        const promptPlan = techSelectionData.promptPlan as {
          prompt1Focus?: string; prompt2Focus?: string; prompt3Focus?: string;
        } | undefined;

        const claudeMdAppName = ctx.type === "masterIdea" ? ctx.masterIdea.name : docLabel;
        const claudeMdAppPurpose = ctx.type === "masterIdea" ? ctx.masterIdea.tagline : `AI-powered alternative to ${docLabel}`;
        const claudeMdInput: ClaudeMdInput = {
          appName: claudeMdAppName,
          appPurpose: claudeMdAppPurpose,
          platform: epPlatform,
          selectedTechSlugs,
          selectedTechnologies: (techSelectionData.selectedTechnologies as Array<{ techSlug: string; category: string; justification: string }>),
          techDetails: techDetailsMap,
          appScreens: (techSelectionData.appScreens as Array<{ screenName: string; promptOrder: number }>),
          epSummaries: {
            ep1Focus: promptPlan?.prompt1Focus ?? "Foundation",
            ep2Focus: promptPlan?.prompt2Focus ?? "Core Features",
            ep3Focus: promptPlan?.prompt3Focus ?? "Polish & Production",
          },
        };

        const claudeMdContent = buildClaudeMdContent(claudeMdInput);
        const mcpJsonContent = buildMcpJsonContent(selectedTechSlugs, epPlatform);

        // Save CLAUDE.md document
        const claudeMdDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "claude_md",
          title: `CLAUDE.md: ${docLabel}`,
          content: claudeMdContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: claudeMdDoc.id,
          analysisId: claudeMdDoc.analysisId,
          type: claudeMdDoc.type,
          title: claudeMdDoc.title,
          content: claudeMdDoc.content,
          createdAt: claudeMdDoc.createdAt,
        });
        sendEvent({ type: "document", document: claudeMdDoc });

        // Save .mcp.json document
        const mcpJsonDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "mcp_json",
          title: `.mcp.json: ${docLabel}`,
          content: mcpJsonContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: mcpJsonDoc.id,
          analysisId: mcpJsonDoc.analysisId,
          type: mcpJsonDoc.type,
          title: mcpJsonDoc.title,
          content: mcpJsonDoc.content,
          createdAt: mcpJsonDoc.createdAt,
        });
        sendEvent({ type: "document", document: mcpJsonDoc });

        // Generate .env.example (deterministic)
        const envExampleContent = buildEnvExampleContent(selectedTechSlugs, epPlatform);
        const envExampleDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "env_example",
          title: `.env.example: ${docLabel}`,
          content: envExampleContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: envExampleDoc.id,
          analysisId: envExampleDoc.analysisId,
          type: envExampleDoc.type,
          title: envExampleDoc.title,
          content: envExampleDoc.content,
          createdAt: envExampleDoc.createdAt,
        });
        sendEvent({ type: "document", document: envExampleDoc });

        // Generate Claude Commands (deterministic)
        const claudeCommandsContent = buildClaudeCommandsContent(selectedTechSlugs, epPlatform);
        const claudeCommandsDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "claude_commands",
          title: `Commands: ${docLabel}`,
          content: claudeCommandsContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: claudeCommandsDoc.id,
          analysisId: claudeCommandsDoc.analysisId,
          type: claudeCommandsDoc.type,
          title: claudeCommandsDoc.title,
          content: claudeCommandsDoc.content,
          createdAt: claudeCommandsDoc.createdAt,
        });
        sendEvent({ type: "document", document: claudeCommandsDoc });

        // Generate .claude/agents/ definitions (deterministic)
        const agentDefinitions = buildAgentDefinitions(claudeMdInput);
        const claudeAgentsDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "claude_agents",
          title: `Agents: ${docLabel}`,
          content: JSON.stringify(agentDefinitions),
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: claudeAgentsDoc.id,
          analysisId: claudeAgentsDoc.analysisId,
          type: claudeAgentsDoc.type,
          title: claudeAgentsDoc.title,
          content: claudeAgentsDoc.content,
          createdAt: claudeAgentsDoc.createdAt,
        });
        sendEvent({ type: "document", document: claudeAgentsDoc });

        // Generate BUILD_STRATEGY.md (deterministic)
        const buildStrategyContent = buildBuildStrategyContent(claudeMdInput);
        const buildStrategyDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "build_strategy",
          title: `Build Strategy: ${docLabel}`,
          content: buildStrategyContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: buildStrategyDoc.id,
          analysisId: buildStrategyDoc.analysisId,
          type: buildStrategyDoc.type,
          title: buildStrategyDoc.title,
          content: buildStrategyDoc.content,
          createdAt: buildStrategyDoc.createdAt,
        });
        sendEvent({ type: "document", document: buildStrategyDoc });

        // Generate settings.json (deterministic)
        const claudeSettingsContent = buildClaudeSettingsContent(claudeMdInput);
        const claudeSettingsDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "claude_settings",
          title: `Settings: ${docLabel}`,
          content: claudeSettingsContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: claudeSettingsDoc.id,
          analysisId: claudeSettingsDoc.analysisId,
          type: claudeSettingsDoc.type,
          title: claudeSettingsDoc.title,
          content: claudeSettingsDoc.content,
          createdAt: claudeSettingsDoc.createdAt,
        });
        sendEvent({ type: "document", document: claudeSettingsDoc });

        // Generate bundled skills (deterministic)
        const skillInput: BundledSkillInput = {
          appName: claudeMdAppName,
          platform: epPlatform,
          selectedTechSlugs,
          selectedTechnologies: (techSelectionData.selectedTechnologies as Array<{ techSlug: string; category: string; justification: string }>),
          techDetails: techDetailsMap,
          appScreens: (techSelectionData.appScreens as Array<{ screenName: string; promptOrder: number; patternSlug?: string; techSlugs?: string[] }>),
          schemaAnchor: schemaAnchor || undefined,
          pricingAnchor: effectivePricingAnchor || undefined,
          freeTierLimits: freeTierLimitsAnchor || undefined,
          deferredFeatures: deferredFeatures.length > 0 ? deferredFeatures : undefined,
          epSummaries: {
            ep1Focus: promptPlan?.prompt1Focus ?? "Foundation",
            ep2Focus: promptPlan?.prompt2Focus ?? "Core Features",
            ep3Focus: promptPlan?.prompt3Focus ?? "Polish & Production",
          },
        };
        const bundledSkills = buildBundledSkills(skillInput);
        const claudeSkillsDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "claude_skills",
          title: `Skills: ${docLabel}`,
          content: JSON.stringify(bundledSkills),
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: claudeSkillsDoc.id,
          analysisId: claudeSkillsDoc.analysisId,
          type: claudeSkillsDoc.type,
          title: claudeSkillsDoc.title,
          content: claudeSkillsDoc.content,
          createdAt: claudeSkillsDoc.createdAt,
        });
        sendEvent({ type: "document", document: claudeSkillsDoc });

        // Generate Setup Walkthrough (deterministic)
        const setupWalkthroughContent = buildSetupWalkthroughContent(claudeMdInput.selectedTechSlugs, claudeMdInput.platform);
        const setupWalkthroughDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "setup_walkthrough",
          title: `Setup Walkthrough: ${docLabel}`,
          content: setupWalkthroughContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: setupWalkthroughDoc.id,
          analysisId: setupWalkthroughDoc.analysisId,
          type: setupWalkthroughDoc.type,
          title: setupWalkthroughDoc.title,
          content: setupWalkthroughDoc.content,
          createdAt: setupWalkthroughDoc.createdAt,
        });
        sendEvent({ type: "document", document: setupWalkthroughDoc });

        logTiming("CLAUDE.md + .mcp.json + .env.example + commands + agents + strategy + settings + skills + setup walkthrough generation completed");
      } catch (claudeMdError) {
        console.warn("[architect] CLAUDE.md generation failed (non-fatal):", claudeMdError);
        addWarning(warnings, "failure", "error", "pipeline", "CLAUDE.md / .mcp.json generation failed — these files were not generated");
      }
    }

    // ==============================
    // Mark analysis as completed (even with partial document failures)
    // The 5 analysis steps completed successfully
    // ==============================

    // Token profiling — store timing summary (Phase 3)
    const pipelineDuration = Date.now() - pipelineStart;
    const tokenProfileSummary = {
      totalDurationMs: pipelineDuration,
      complexity,
      stepCount: 5,
      batchCount: 2,
      warningCount: warnings.length,
    };
    console.log(`[architect:profile] Pipeline complete: ${JSON.stringify(tokenProfileSummary)}`);

    // Convert structured warnings to strings for SSE backward compatibility
    const warningStrings = warnings.map(w => `[${w.severity}/${w.category}] ${w.document}: ${w.message}`);
    const finalStatus = warnings.length > 0 ? "completed_with_warnings" : "completed";
    await db
      .update(analyses)
      .set({
        status: finalStatus,
        completedAt: new Date().toISOString(),
      })
      .where(eq(analyses.id, analysisId));

    logTiming(`Pipeline complete (status: ${finalStatus})`);
    sendEvent({
      type: "complete",
      analysisId,
      ...(warningStrings.length > 0 ? { warnings: warningStrings } : {}),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[architect] Pipeline error:`, errorMsg);
    if (errorStack) console.error(`[architect] Stack:`, errorStack);

    if (error instanceof CancelledError || signal.aborted) {
      try {
        await db
          .update(analyses)
          .set({
            status: "cancelled",
            completedAt: new Date().toISOString(),
          })
          .where(eq(analyses.id, analysisId));

        steps = steps.map((s) =>
          s.status === "running" || s.status === "pending"
            ? { ...s, status: "cancelled" as const }
            : s
        );
        await saveSteps(analysisId, steps);
      } catch (dbErr) {
        console.error(`[architect] Failed to save cancelled state:`, dbErr);
      }

      sendEvent({ type: "cancelled", analysisId });
    } else {
      try {
        const completedStepCount = steps.filter(s => s.status === "completed").length;
        const catchFinalStatus = completedStepCount >= 5 ? "completed_with_warnings" : "failed";

        await db
          .update(analyses)
          .set({
            status: catchFinalStatus,
            completedAt: new Date().toISOString(),
          })
          .where(eq(analyses.id, analysisId));

        steps = steps.map((s) =>
          s.status === "running" ? { ...s, status: "failed" as const } : s
        );
        await saveSteps(analysisId, steps);

        if (catchFinalStatus === "completed_with_warnings") {
          // All 5 steps completed but document generation failed — send complete with warnings
          sendEvent({
            type: "complete",
            analysisId,
            warnings: [`Document generation error: ${errorMsg}`],
          });
        } else {
          sendEvent({ type: "error", message: errorMsg });
        }
      } catch (dbErr) {
        console.error(`[architect] Failed to save failed state:`, dbErr);
        sendEvent({ type: "error", message: errorMsg });
      }
    }
  } finally {
    activeAnalysisControllers.delete(analysisId);
  }
}
