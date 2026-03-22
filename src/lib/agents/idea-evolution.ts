import { generateText } from "ai";
import { v4 as uuid } from "uuid";
import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { ideaEvolutions, analyses, technologies } from "@/lib/db/schema";
import {
  openrouter,
  ARCHITECT_MODEL,
  ARCHITECT_FAST_MODEL,
  callAIWithRetry,
  callAIStructured,
} from "@/lib/ai/client";
import {
  impactAnalysisSchema,
  buildImpactAnalysisPrompt,
  buildIncrementalEPPrompt,
  formatSchemaAnchor,
  stripCodeBlocks,
} from "@/lib/ai/architect-prompts";
import { CancelledError } from "@/lib/errors";
import type {
  IdeaEvolutionInput,
  IdeaEvolutionSSEEvent,
  IdeaEvolution,
  ImpactAnalysis,
  AnalysisStep,
} from "@/lib/types";

// ============================================
// Idea Evolution Pipeline
// Adds incremental features to an existing Architect blueprint
// ============================================

// --- Cancel support ---
const activeEvolutionControllers = new Map<string, AbortController>();

export function cancelIdeaEvolution(evolutionId: string): boolean {
  const controller = activeEvolutionControllers.get(evolutionId);
  if (controller) {
    controller.abort();
    return true;
  }
  return false;
}

export function isEvolutionActive(evolutionId: string): boolean {
  return activeEvolutionControllers.has(evolutionId);
}

function checkCancelled(signal: AbortSignal) {
  if (signal.aborted) throw new CancelledError("Idea evolution was cancelled");
}

// ============================================
// Context Extraction Helpers
// ============================================

interface Step5Data {
  appScreens: Array<{ screenName: string }>;
  databaseSchema: Array<{ tableName: string }>;
  selectedTechnologies: Array<{ slug: string }>;
  platform: string;
  promptPlan: Record<string, unknown>;
  synergyNotes: string[];
}

interface Anchors {
  pricingAnchor: string;
  freeTierAnchor: string;
  deferredFeatures: string[];
}

/**
 * Parse stepsJson (JSON array of AnalysisStep), truncate each step's content
 * to ~200 tokens (~800 chars) and return a formatted summary string.
 */
function extractCompactStepSummaries(stepsJson: string): string {
  let steps: AnalysisStep[];
  try {
    steps = JSON.parse(stepsJson) as AnalysisStep[];
  } catch {
    return "(Unable to parse steps)";
  }

  const summaries: string[] = [];
  for (const step of steps) {
    if (!step.content) continue;
    const truncated =
      step.content.length > 800
        ? step.content.slice(0, 800) + "..."
        : step.content;
    summaries.push(`Step ${step.step} (${step.title}): ${truncated}`);
  }
  return summaries.join("\n\n");
}

/**
 * Parse the content of step 5 and extract structured data:
 * appScreens, databaseSchema, selectedTechnologies, platform, promptPlan, synergyNotes.
 */
function extractStep5Data(steps: AnalysisStep[]): Step5Data {
  const step5 = steps.find((s) => s.step === 5);
  const empty: Step5Data = {
    appScreens: [],
    databaseSchema: [],
    selectedTechnologies: [],
    platform: "web",
    promptPlan: {},
    synergyNotes: [],
  };

  if (!step5?.content) return empty;

  try {
    const data = JSON.parse(step5.content) as Record<string, unknown>;
    return {
      appScreens: (data.appScreens as Step5Data["appScreens"]) ?? [],
      databaseSchema:
        (data.databaseSchema as Step5Data["databaseSchema"]) ?? [],
      selectedTechnologies:
        (data.selectedTechnologies as Step5Data["selectedTechnologies"]) ?? [],
      platform: (data.platform as string) ?? "web",
      promptPlan: (data.promptPlan as Record<string, unknown>) ?? {},
      synergyNotes: (data.synergyNotes as string[]) ?? [],
    };
  } catch (e) {
    console.warn("[idea-evolution] Failed to parse step 5 content:", e);
    return empty;
  }
}

/**
 * Extract pricing/free-tier anchors from Step 2 and deferred features from Step 4.
 */
function extractAnchors(steps: AnalysisStep[]): Anchors {
  let pricingAnchor = "";
  let freeTierAnchor = "";
  const deferredFeatures: string[] = [];

  // Step 2 — Strategic Planning: extract revenueModel.tiers and go-to-market
  const step2 = steps.find((s) => s.step === 2);
  if (step2?.content) {
    try {
      const data = JSON.parse(step2.content) as Record<string, unknown>;

      // Build pricing anchor from revenue model tiers
      const revenueModel = data.revenueModel as Record<string, unknown> | undefined;
      if (revenueModel?.tiers && Array.isArray(revenueModel.tiers)) {
        const tierStrings = (revenueModel.tiers as Array<{ name?: string; price?: string }>)
          .map((t) => `${t.name ?? "?"}: ${t.price ?? "?"}`)
          .join(", ");
        pricingAnchor = tierStrings;
      }

      // Extract free tier anchor from goToMarket or first90Days
      if (typeof data.goToMarket === "string") {
        freeTierAnchor = data.goToMarket;
      } else if (typeof data.first90Days === "string") {
        freeTierAnchor = data.first90Days;
      } else if (data.goToMarket && typeof data.goToMarket === "object") {
        freeTierAnchor = JSON.stringify(data.goToMarket).slice(0, 300);
      }
    } catch (e) {
      console.warn("[idea-evolution] Failed to parse step 2 content:", e);
    }
  }

  // Step 4 — Dev Tinkering Plan: extract deferred features from later phases
  const step4 = steps.find((s) => s.step === 4);
  if (step4?.content) {
    try {
      const data = JSON.parse(step4.content) as Record<string, unknown>;

      // Look for phases array, take items from later phases as deferred
      const phases = data.phases as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(phases) && phases.length > 1) {
        // Skip the first phase (MVP), collect features from subsequent phases
        for (let i = 1; i < phases.length; i++) {
          const phase = phases[i];
          const features = (phase.features ?? phase.items ?? phase.tasks) as
            | string[]
            | Array<{ name?: string; feature?: string; title?: string }>
            | undefined;
          if (Array.isArray(features)) {
            for (const f of features) {
              if (typeof f === "string") {
                deferredFeatures.push(f);
              } else if (typeof f === "object" && f !== null) {
                deferredFeatures.push(f.name ?? f.feature ?? f.title ?? JSON.stringify(f));
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("[idea-evolution] Failed to parse step 4 content:", e);
    }
  }

  return { pricingAnchor, freeTierAnchor, deferredFeatures };
}

/**
 * Build a compact summary of previous evolutions for context injection.
 * Takes up to 10 most recent and summarizes each in one line.
 */
function buildPreviousEvolutionsSummary(
  evolutions: Array<{
    ideaText: string;
    impactAnalysis: string | null;
    epContent: string | null;
  }>
): string {
  if (evolutions.length === 0) return "";

  const lines = evolutions.slice(0, 10).map((evo) => {
    const truncatedIdea =
      evo.ideaText.length > 80
        ? evo.ideaText.slice(0, 80) + "..."
        : evo.ideaText;

    let feasibility = "unknown";
    let screenCount = 0;
    let tableCount = 0;

    if (evo.impactAnalysis) {
      try {
        const impact = JSON.parse(evo.impactAnalysis) as ImpactAnalysis;
        feasibility = impact.feasibility ?? "unknown";
        screenCount = impact.affectedScreens?.length ?? 0;
        tableCount = impact.affectedTables?.length ?? 0;
      } catch {
        // ignore parse errors
      }
    }

    return `- ${truncatedIdea}: ${feasibility}, ${screenCount} screens, ${tableCount} tables`;
  });

  return lines.join("\n");
}

/**
 * Build an EP cross-reference string from step5Data's promptPlan.
 * Format: "EP[number]: [title] — screens: [screen list]"
 */
function buildEPCrossRefFromStep5(step5Data: Step5Data): string {
  const { promptPlan } = step5Data;
  if (!promptPlan || typeof promptPlan !== "object") return "(No prompt plan available)";

  const lines: string[] = [];

  // promptPlan can be an object with EP entries keyed by number or name
  for (const [key, value] of Object.entries(promptPlan)) {
    if (!value || typeof value !== "object") continue;
    const entry = value as Record<string, unknown>;

    const title = (entry.title as string) ?? key;
    const screens = entry.screens as Array<string | { screenName?: string }> | undefined;

    let screenList = "(no screens)";
    if (Array.isArray(screens) && screens.length > 0) {
      screenList = screens
        .map((s) => (typeof s === "string" ? s : s.screenName ?? "?"))
        .join(", ");
    }

    // Extract EP number from key (e.g., "ep1", "1", "EP 1")
    const numMatch = key.match(/(\d+)/);
    const epNum = numMatch ? numMatch[1] : key;

    lines.push(`EP${epNum}: ${title} — screens: ${screenList}`);
  }

  return lines.length > 0 ? lines.join("\n") : "(No prompt plan entries found)";
}

// ============================================
// Main Pipeline
// ============================================

export async function runIdeaEvolutionPipeline(
  input: IdeaEvolutionInput,
  sendEvent: (event: IdeaEvolutionSSEEvent) => void,
  externalSignal?: AbortSignal
): Promise<string> {
  const pipelineStart = Date.now();
  const logTiming = (label: string) =>
    console.log(
      `[idea-evolution] ${label} — ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s elapsed`
    );

  // ==============================
  // Step 0: Load context (DB reads only)
  // ==============================
  logTiming("Loading context");

  // Fetch analysis and validate status
  const [analysisRow] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, input.analysisId))
    .limit(1);

  if (!analysisRow) {
    throw new Error(`Analysis ${input.analysisId} not found`);
  }

  if (
    analysisRow.status !== "completed" &&
    analysisRow.status !== "completed_with_warnings"
  ) {
    throw new Error(
      `Analysis ${input.analysisId} has status "${analysisRow.status}" — must be "completed" or "completed_with_warnings"`
    );
  }

  // Parse steps and extract context
  const parsedSteps: AnalysisStep[] = JSON.parse(analysisRow.stepsJson);
  const stepSummaries = extractCompactStepSummaries(analysisRow.stepsJson);
  const step5Data = extractStep5Data(parsedSteps);
  const anchors = extractAnchors(parsedSteps);
  logTiming("Context extracted from analysis steps");

  // Fetch previous completed evolutions for this analysis
  const previousEvolutions = await db
    .select()
    .from(ideaEvolutions)
    .where(
      and(
        eq(ideaEvolutions.analysisId, input.analysisId),
        eq(ideaEvolutions.status, "completed")
      )
    )
    .orderBy(desc(ideaEvolutions.createdAt))
    .limit(10);

  const previousEvolutionsSummary = buildPreviousEvolutionsSummary(
    previousEvolutions.map((e) => ({
      ideaText: e.ideaText,
      impactAnalysis: e.impactAnalysis,
      epContent: e.epContent,
    }))
  );
  logTiming(`Found ${previousEvolutions.length} previous evolutions`);

  // Create evolution record
  const evolutionId = uuid();
  const now = new Date().toISOString();

  await db.insert(ideaEvolutions).values({
    id: evolutionId,
    analysisId: input.analysisId,
    ideaText: input.ideaText,
    status: "analyzing",
    createdAt: now,
  });
  logTiming("Evolution record created");

  // Set up cancellation
  const abortController = new AbortController();
  activeEvolutionControllers.set(evolutionId, abortController);
  const { signal } = abortController;

  // Send idea_started event immediately for fast UI feedback
  sendEvent({ type: "idea_started", evolutionId });

  // Wire external signal if provided
  if (externalSignal) {
    if (externalSignal.aborted) {
      abortController.abort();
    } else {
      externalSignal.addEventListener(
        "abort",
        () => abortController.abort(),
        { once: true }
      );
    }
  }

  try {
    // ==============================
    // Step 1: Impact Analysis (~30s)
    // ==============================
    checkCancelled(signal);
    logTiming("Step 1: Impact Analysis starting");

    const impactPrompt = buildImpactAnalysisPrompt(
      input.ideaText,
      stepSummaries,
      step5Data.appScreens.map((s) => s.screenName),
      step5Data.databaseSchema.map((t) => t.tableName),
      step5Data.selectedTechnologies.map((t) => t.slug),
      anchors.pricingAnchor,
      anchors.freeTierAnchor,
      anchors.deferredFeatures,
      previousEvolutionsSummary
    );

    const impactResult = await callAIStructured(
      impactPrompt,
      impactAnalysisSchema,
      "impactAnalysis",
      "Analysis of how a new feature idea impacts the existing app blueprint",
      signal,
      ARCHITECT_FAST_MODEL,
      4096,
      60_000
    );

    const impact = impactResult as ImpactAnalysis;
    logTiming("Step 1: Impact Analysis raw result received");

    // Quality gate: validate "modify" entries reference existing screens/tables
    const existingScreenNames = new Set(
      step5Data.appScreens.map((s) => s.screenName.toLowerCase())
    );
    const existingTableNames = new Set(
      step5Data.databaseSchema.map((t) => t.tableName.toLowerCase())
    );

    if (impact.affectedScreens) {
      const validScreens = impact.affectedScreens.filter((s) => {
        if (s.action === "modify" && !existingScreenNames.has(s.screenName.toLowerCase())) {
          console.warn(
            `[idea-evolution] Quality gate: removing invalid "modify" screen "${s.screenName}" — not found in existing screens`
          );
          return false;
        }
        return true;
      });
      impact.affectedScreens = validScreens;
    }

    if (impact.affectedTables) {
      const validTables = impact.affectedTables.filter((t) => {
        if (t.action === "modify" && !existingTableNames.has(t.tableName.toLowerCase())) {
          console.warn(
            `[idea-evolution] Quality gate: removing invalid "modify" table "${t.tableName}" — not found in existing tables`
          );
          return false;
        }
        return true;
      });
      impact.affectedTables = validTables;
    }

    // Update DB with impact analysis
    await db
      .update(ideaEvolutions)
      .set({
        impactAnalysis: JSON.stringify(impact),
        status: "generating",
      })
      .where(eq(ideaEvolutions.id, evolutionId));

    sendEvent({
      type: "impact_analysis_complete",
      evolutionId,
      impactAnalysis: impact,
    });
    logTiming("Step 1: Impact Analysis complete");

    checkCancelled(signal);

    // ==============================
    // Step 2: EP+ Generation (~90s)
    // ==============================
    logTiming("Step 2: EP+ Generation starting");
    sendEvent({ type: "ep_generation_started", evolutionId });

    // Fetch prompt fragments for any new technologies
    const newTechFragments = new Map<string, string>();
    if (impact.newTechnologies && impact.newTechnologies.length > 0) {
      const slugs = impact.newTechnologies.map((t) => t.slug);
      const techRows = await db
        .select()
        .from(technologies)
        .where(inArray(technologies.slug, slugs));

      for (const row of techRows) {
        newTechFragments.set(row.slug, row.promptFragment);
      }
      logTiming(`Fetched ${techRows.length} new technology prompt fragments`);
    }

    // Build schema anchor from step 5 database schema
    const schemaAnchor = formatSchemaAnchor(
      step5Data.databaseSchema as Array<{
        tableName: string;
        description: string;
        columns: Array<{ name: string; type: string; constraints: string }>;
      }>
    );

    // Build EP cross-reference from step 5 prompt plan
    const epCrossRef = buildEPCrossRefFromStep5(step5Data);

    const epPrompt = buildIncrementalEPPrompt(
      input.ideaText,
      JSON.stringify(impact),
      stepSummaries,
      step5Data.appScreens.map((s) => s.screenName),
      step5Data.databaseSchema.map((t) => t.tableName),
      step5Data.selectedTechnologies.map((t) => t.slug),
      newTechFragments,
      schemaAnchor,
      anchors.pricingAnchor,
      step5Data.platform,
      epCrossRef,
      anchors.deferredFeatures,
      previousEvolutionsSummary
    );

    const epResult = await callAIWithRetry(
      async () => {
        const { text } = await generateText({
          model: openrouter(ARCHITECT_MODEL),
          prompt: epPrompt,
          maxOutputTokens: 8192,
          abortSignal: signal,
        });
        return text;
      },
      3,
      signal,
      180_000
    );

    const epContent = stripCodeBlocks(epResult);

    // Quality gate: warn on suspicious length
    if (epContent.length < 1000) {
      console.warn(
        `[idea-evolution] Quality gate: EP+ content is suspiciously short (${epContent.length} chars)`
      );
    }
    if (epContent.length > 15000) {
      console.warn(
        `[idea-evolution] Quality gate: EP+ content is unusually long (${epContent.length} chars)`
      );
    }

    checkCancelled(signal);

    sendEvent({ type: "ep_generated", evolutionId, epContent });
    logTiming("Step 2: EP+ Generation complete");

    // ==============================
    // Step 3: Document updates summary (deterministic)
    // ==============================
    logTiming("Step 3: Building document updates summary");

    // Build documentUpdates based on impact analysis
    const documentUpdates: string[] = [];

    const hasAffectedScreens =
      impact.affectedScreens && impact.affectedScreens.length > 0;
    const hasPricingImpact =
      impact.pricingImpact && impact.pricingImpact !== "none";
    const hasNewTables =
      impact.affectedTables &&
      impact.affectedTables.some((t) => t.action === "new");
    const hasNewTechnologies =
      impact.newTechnologies && impact.newTechnologies.length > 0;

    if (hasAffectedScreens) {
      documentUpdates.push("Update Technical Architecture document");
    }
    if (hasPricingImpact) {
      documentUpdates.push("Update PRD pricing section");
    }
    if (hasNewTables) {
      documentUpdates.push("Update database schema documentation");
    }
    if (hasNewTechnologies) {
      documentUpdates.push("Update technology stack references");
    }

    // Extract new/modified screens and tables from impact analysis
    const newScreens = impact.affectedScreens
      ? impact.affectedScreens
          .filter((s) => s.action === "new")
          .map((s) => ({ screenName: s.screenName, description: s.changes }))
      : [];

    const modifiedScreens = impact.affectedScreens
      ? impact.affectedScreens
          .filter((s) => s.action === "modify")
          .map((s) => ({ screenName: s.screenName, changes: s.changes }))
      : [];

    const newTables = impact.affectedTables
      ? impact.affectedTables
          .filter((t) => t.action === "new")
          .map((t) => ({ tableName: t.tableName, description: t.changes }))
      : [];

    const modifiedTables = impact.affectedTables
      ? impact.affectedTables
          .filter((t) => t.action === "modify")
          .map((t) => ({ tableName: t.tableName, changes: t.changes }))
      : [];

    // Extract newDependencies from EP content (best-effort, not critical)
    const newDependencies: string[] = [];
    const depMatches = epContent.match(/`([a-z@][a-z0-9\-_@/]*)`/gi);
    if (depMatches) {
      for (const match of depMatches) {
        const pkg = match.replace(/`/g, "");
        // Filter to likely npm package names
        if (
          pkg.includes("/") ||
          (pkg.startsWith("@") && pkg.length > 2) ||
          (!pkg.includes(" ") && pkg.length > 2 && pkg.length < 60)
        ) {
          if (!newDependencies.includes(pkg)) {
            newDependencies.push(pkg);
          }
        }
      }
    }

    // Extract newEnvVars from EP content (best-effort, not critical)
    const newEnvVars: string[] = [];
    const envMatches = epContent.match(/[A-Z][A-Z0-9_]{2,}_(?:KEY|URL|SECRET|TOKEN|ID|API|DSN|URI)/g);
    if (envMatches) {
      for (const match of envMatches) {
        if (!newEnvVars.includes(match)) {
          newEnvVars.push(match);
        }
      }
    }

    // Build setupSteps from implementation order
    const setupSteps = impact.implementationOrder ?? [];

    // Update DB with all final fields
    const completedAt = new Date().toISOString();
    await db
      .update(ideaEvolutions)
      .set({
        epContent,
        documentUpdates: JSON.stringify(documentUpdates),
        newDependencies: JSON.stringify(newDependencies),
        newEnvVars: JSON.stringify(newEnvVars),
        setupSteps: JSON.stringify(setupSteps),
        newScreens: JSON.stringify(newScreens),
        modifiedScreens: JSON.stringify(modifiedScreens),
        newTables: JSON.stringify(newTables),
        modifiedTables: JSON.stringify(modifiedTables),
        status: "completed",
        completedAt,
      })
      .where(eq(ideaEvolutions.id, evolutionId));

    logTiming("Step 3: Document updates summary complete");

    // Fetch the full record back to send in the event
    const [completedRow] = await db
      .select()
      .from(ideaEvolutions)
      .where(eq(ideaEvolutions.id, evolutionId))
      .limit(1);

    const evolution: IdeaEvolution = {
      id: completedRow.id,
      analysisId: completedRow.analysisId,
      ideaText: completedRow.ideaText,
      status: completedRow.status as IdeaEvolution["status"],
      impactAnalysis: completedRow.impactAnalysis
        ? (JSON.parse(completedRow.impactAnalysis) as ImpactAnalysis)
        : null,
      epContent: completedRow.epContent,
      documentUpdates: completedRow.documentUpdates
        ? (JSON.parse(completedRow.documentUpdates) as string[])
        : null,
      newDependencies: completedRow.newDependencies
        ? (JSON.parse(completedRow.newDependencies) as string[])
        : null,
      newEnvVars: completedRow.newEnvVars
        ? (JSON.parse(completedRow.newEnvVars) as string[])
        : null,
      setupSteps: completedRow.setupSteps
        ? (JSON.parse(completedRow.setupSteps) as string[])
        : null,
      newScreens: completedRow.newScreens
        ? (JSON.parse(completedRow.newScreens) as Array<{
            screenName: string;
            description: string;
          }>)
        : null,
      modifiedScreens: completedRow.modifiedScreens
        ? (JSON.parse(completedRow.modifiedScreens) as Array<{
            screenName: string;
            changes: string;
          }>)
        : null,
      newTables: completedRow.newTables
        ? (JSON.parse(completedRow.newTables) as Array<{
            tableName: string;
            description: string;
          }>)
        : null,
      modifiedTables: completedRow.modifiedTables
        ? (JSON.parse(completedRow.modifiedTables) as Array<{
            tableName: string;
            changes: string;
          }>)
        : null,
      createdAt: completedRow.createdAt,
      completedAt: completedRow.completedAt,
    };

    sendEvent({ type: "idea_complete", evolutionId, evolution });
    logTiming("Pipeline complete");

    return evolutionId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[idea-evolution] Pipeline error:`, errorMsg);
    if (errorStack) console.error(`[idea-evolution] Stack:`, errorStack);

    if (error instanceof CancelledError || signal.aborted) {
      try {
        await db
          .update(ideaEvolutions)
          .set({
            status: "cancelled",
            completedAt: new Date().toISOString(),
          })
          .where(eq(ideaEvolutions.id, evolutionId));
      } catch (dbErr) {
        console.error(
          `[idea-evolution] Failed to save cancelled state:`,
          dbErr
        );
      }

      sendEvent({ type: "idea_cancelled", evolutionId });
    } else {
      try {
        await db
          .update(ideaEvolutions)
          .set({
            status: "failed",
            completedAt: new Date().toISOString(),
          })
          .where(eq(ideaEvolutions.id, evolutionId));
      } catch (dbErr) {
        console.error(
          `[idea-evolution] Failed to save failed state:`,
          dbErr
        );
      }

      sendEvent({ type: "idea_error", evolutionId, message: errorMsg });
    }

    return evolutionId;
  } finally {
    activeEvolutionControllers.delete(evolutionId);
  }
}
