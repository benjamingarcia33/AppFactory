"use client";

import { useMemo, useState } from "react";
import { DocumentViewer } from "@/components/architect/document-viewer";
import { VisualStrategy } from "@/components/architect/visual-strategy";
import { StrategySidebarNav } from "@/components/architect/strategy-sidebar-nav";
import { ExecutionPromptViewer } from "@/components/architect/execution-prompt-viewer";
import { ClaudeMdViewer } from "@/components/architect/claude-md-viewer";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnalysisDocument, VisualStrategy as VisualStrategyType } from "@/lib/types";

interface DocumentTabsProps {
  documents: AnalysisDocument[];
  executionPrompts?: AnalysisDocument[];
}

/**
 * Normalize raw AI JSON to match the expected VisualStrategy interface.
 * The AI often returns variant field names (e.g. pricingTiers vs tiers).
 */
export function normalizeVisualStrategy(raw: Record<string, unknown>): VisualStrategyType | null {
  const rm = raw.revenueModel ?? raw.revenue_model;
  if (rm && typeof rm === "object" && !Array.isArray(rm)) {
    const rmo = rm as Record<string, unknown>;
    // Normalize tiers field name
    if (!rmo.tiers && (rmo.pricingTiers || rmo.pricing_tiers)) {
      rmo.tiers = rmo.pricingTiers ?? rmo.pricing_tiers;
    }
    // Normalize monthlyProjections field name
    if (!rmo.monthlyProjections && (rmo.monthly_projections || rmo.projections)) {
      rmo.monthlyProjections = rmo.monthly_projections ?? rmo.projections;
    }
    // Normalize projectedArpu field name
    if (!rmo.projectedArpu && (rmo.projected_arpu || rmo.arpu)) {
      rmo.projectedArpu = rmo.projected_arpu ?? rmo.arpu;
    }
    raw.revenueModel = rmo;
  }

  // Normalize top-level field names
  if (!raw.competitiveMatrix && (raw.competitive_matrix || raw.competitors)) {
    raw.competitiveMatrix = raw.competitive_matrix ?? raw.competitors;
  }
  if (!raw.marketData && (raw.market_data || raw.marketSegments || raw.market_segments)) {
    raw.marketData = raw.market_data ?? raw.marketSegments ?? raw.market_segments;
  }
  if (!raw.revenueModel && raw.revenue_model) {
    raw.revenueModel = raw.revenue_model;
  }

  // Normalize timeline keyDeliverables field name
  if (Array.isArray(raw.timeline)) {
    for (const phase of raw.timeline as Record<string, unknown>[]) {
      if (!phase.keyDeliverables && (phase.deliverables || phase.key_deliverables)) {
        phase.keyDeliverables = phase.deliverables ?? phase.key_deliverables;
      }
    }
  }

  // Ensure tiers is an array (guard against undefined access in child components)
  const finalRm = raw.revenueModel as Record<string, unknown> | undefined;
  if (finalRm && !Array.isArray(finalRm.tiers)) {
    finalRm.tiers = [];
  }

  // --- Normalize new enhanced sections ---

  // Market Gap Analysis
  if (!raw.marketGapAnalysis && (raw.market_gap_analysis || raw.marketGaps || raw.market_gaps)) {
    raw.marketGapAnalysis = raw.market_gap_analysis ?? raw.marketGaps ?? raw.market_gaps;
  }
  if (Array.isArray(raw.marketGapAnalysis)) {
    for (const item of raw.marketGapAnalysis as Record<string, unknown>[]) {
      if (!item.currentAlternatives && (item.current_alternatives || item.alternatives)) {
        item.currentAlternatives = item.current_alternatives ?? item.alternatives;
      }
      if (!item.opportunitySize && (item.opportunity_size || item.size)) {
        item.opportunitySize = item.opportunity_size ?? item.size;
      }
      if (!item.difficultyToAddress && (item.difficulty_to_address || item.difficulty)) {
        item.difficultyToAddress = item.difficulty_to_address ?? item.difficulty;
      }
      if (!item.ourApproach && (item.our_approach || item.approach)) {
        item.ourApproach = item.our_approach ?? item.approach;
      }
    }
  }

  // Competitive Details
  if (!raw.competitiveDetails && (raw.competitive_details || raw.competitorDetails || raw.competitor_details)) {
    raw.competitiveDetails = raw.competitive_details ?? raw.competitorDetails ?? raw.competitor_details;
  }
  if (Array.isArray(raw.competitiveDetails)) {
    for (const item of raw.competitiveDetails as Record<string, unknown>[]) {
      if (!item.isOurs && item.is_ours !== undefined) {
        item.isOurs = item.is_ours;
      }
      if (!item.marketPosition && (item.market_position || item.position)) {
        item.marketPosition = item.market_position ?? item.position;
      }
      if (!item.userBase && (item.user_base || item.users)) {
        item.userBase = item.user_base ?? item.users;
      }
    }
  }

  // Revenue Projections
  if (!raw.revenueProjections && (raw.revenue_projections || raw.unitEconomics || raw.unit_economics)) {
    raw.revenueProjections = raw.revenue_projections ?? raw.unitEconomics ?? raw.unit_economics;
  }
  if (raw.revenueProjections && typeof raw.revenueProjections === "object" && !Array.isArray(raw.revenueProjections)) {
    const rp = raw.revenueProjections as Record<string, unknown>;
    if (!rp.ltvCacRatio && (rp.ltv_cac_ratio || rp.ltvCACRatio)) {
      rp.ltvCacRatio = rp.ltv_cac_ratio ?? rp.ltvCACRatio;
    }
    if (!rp.monthlyChurnRate && (rp.monthly_churn_rate || rp.churnRate || rp.churn_rate)) {
      rp.monthlyChurnRate = rp.monthly_churn_rate ?? rp.churnRate ?? rp.churn_rate;
    }
    if (!rp.grossMargin && (rp.gross_margin || rp.margin)) {
      rp.grossMargin = rp.gross_margin ?? rp.margin;
    }
    if (!rp.breakEvenMonth && (rp.break_even_month || rp.breakeven_month || rp.breakevenMonth)) {
      rp.breakEvenMonth = rp.break_even_month ?? rp.breakeven_month ?? rp.breakevenMonth;
    }
    if (!rp.unitEconomics && rp.unit_economics) {
      rp.unitEconomics = rp.unit_economics;
    }
    if (!rp.yearlyProjections && (rp.yearly_projections || rp.projections)) {
      rp.yearlyProjections = rp.yearly_projections ?? rp.projections;
    }
    raw.revenueProjections = rp;
  }

  // Data Model
  if (!raw.dataModel && (raw.data_model || raw.entities || raw.dataEntities || raw.data_entities)) {
    raw.dataModel = raw.data_model ?? raw.entities ?? raw.dataEntities ?? raw.data_entities;
  }
  if (Array.isArray(raw.dataModel)) {
    for (const item of raw.dataModel as Record<string, unknown>[]) {
      if (!item.keyAttributes && (item.key_attributes || item.attributes)) {
        item.keyAttributes = item.key_attributes ?? item.attributes;
      }
      if (Array.isArray(item.relationships)) {
        for (const rel of item.relationships as Record<string, unknown>[]) {
          if (!rel.relatedEntity && (rel.related_entity || rel.entity || rel.target)) {
            rel.relatedEntity = rel.related_entity ?? rel.entity ?? rel.target;
          }
        }
      }
    }
  }

  // Go/No-Go Scorecard
  if (!raw.goNoGoScorecard && (raw.go_no_go_scorecard || raw.go_no_go || raw.goNoGo || raw.scorecard)) {
    raw.goNoGoScorecard = raw.go_no_go_scorecard ?? raw.go_no_go ?? raw.goNoGo ?? raw.scorecard;
  }
  if (raw.goNoGoScorecard && typeof raw.goNoGoScorecard === "object" && !Array.isArray(raw.goNoGoScorecard)) {
    const sc = raw.goNoGoScorecard as Record<string, unknown>;
    if (!sc.overallVerdict && (sc.overall_verdict || sc.verdict)) {
      sc.overallVerdict = sc.overall_verdict ?? sc.verdict;
    }
    if (!sc.investmentThesis && (sc.investment_thesis || sc.thesis)) {
      sc.investmentThesis = sc.investment_thesis ?? sc.thesis;
    }
    if (!sc.weightedScore && (sc.weighted_score || sc.totalScore || sc.total_score)) {
      sc.weightedScore = sc.weighted_score ?? sc.totalScore ?? sc.total_score;
    }
    if (!sc.keyRisks && (sc.key_risks || sc.risks)) {
      sc.keyRisks = sc.key_risks ?? sc.risks;
    }
    if (!sc.keyOpportunities && (sc.key_opportunities || sc.opportunities)) {
      sc.keyOpportunities = sc.key_opportunities ?? sc.opportunities;
    }
    raw.goNoGoScorecard = sc;
  }

  return raw as unknown as VisualStrategyType;
}

function tryParseVisualStrategy(content: string): VisualStrategyType | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      (Array.isArray(parsed.personas) || parsed.revenueModel || parsed.revenue_model)
    ) {
      return normalizeVisualStrategy(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

function parsePrdSections(content: string): { vision: string; features: string; requirements: string } | null {
  // Split by ## followed by a number and period (e.g., "## 1.", "## 6.")
  const sectionRegex = /^## (\d+)\./gm;
  const matches = [...content.matchAll(sectionRegex)];

  if (matches.length < 3) return null; // Not enough sections to split

  // Find section boundaries, parsing the actual section number from the heading
  const sections: { num: number; text: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const num = parseInt(matches[i][1], 10);
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    sections.push({ num, text: content.slice(start, end).trim() });
  }

  // Group by actual section number:
  // 1-2 = Vision & Mission + User Personas
  // 3-5 = Core UX + Feature Specs + Anti-Competitor
  // 6-9 = Data Reqs + Non-Functional + Success Criteria + Anti-Patterns
  const vision = sections.filter(s => s.num <= 2).map(s => s.text).join("\n\n");
  const features = sections.filter(s => s.num >= 3 && s.num <= 5).map(s => s.text).join("\n\n");
  const requirements = sections.filter(s => s.num >= 6).map(s => s.text).join("\n\n");

  if (!vision && !features && !requirements) return null;

  return { vision, features, requirements };
}

function PrdSections({ document: doc }: { document: AnalysisDocument }) {
  const sections = useMemo(() => parsePrdSections(doc.content), [doc.content]);
  const [copied, setCopied] = useState(false);

  if (!sections) {
    return <DocumentViewer document={doc} copyLabel="Copy for AI Agent" />;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => scrollTo("prd-vision")} className="text-xs text-muted-foreground hover:text-primary">Vision</button>
          <span className="text-muted-foreground">·</span>
          <button onClick={() => scrollTo("prd-features")} className="text-xs text-muted-foreground hover:text-primary">Features</button>
          <span className="text-muted-foreground">·</span>
          <button onClick={() => scrollTo("prd-requirements")} className="text-xs text-muted-foreground hover:text-primary">Requirements</button>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {copied ? "Copied!" : "Copy Full PRD for AI Agent"}
        </button>
      </div>

      <div className="space-y-8">
        <section id="prd-vision">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Product Vision</h3>
          <DocumentViewer document={{ ...doc, content: sections.vision }} />
        </section>
        <section id="prd-features">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Features & UX</h3>
          <DocumentViewer document={{ ...doc, content: sections.features }} />
        </section>
        <section id="prd-requirements">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Requirements</h3>
          <DocumentViewer document={{ ...doc, content: sections.requirements }} />
        </section>
      </div>
    </div>
  );
}

function parseTechArchSections(content: string): { architecture: string; integration: string; operations: string } | null {
  const sectionRegex = /^## (\d+)\./gm;
  const matches = [...content.matchAll(sectionRegex)];

  if (matches.length < 3) return null;

  const sections: { num: number; text: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const num = parseInt(matches[i][1], 10);
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    sections.push({ num, text: content.slice(start, end).trim() });
  }

  // Group by actual section number:
  // 1-3 = Architecture (Stack, System Overview, Data Model)
  // 4-5 = Integration (AI Integration, APIs)
  // 6-9 = Operations (Infrastructure, Security, Synergies, Risks)
  const architecture = sections.filter(s => s.num <= 3).map(s => s.text).join("\n\n");
  const integration = sections.filter(s => s.num >= 4 && s.num <= 5).map(s => s.text).join("\n\n");
  const operations = sections.filter(s => s.num >= 6).map(s => s.text).join("\n\n");

  if (!architecture && !integration && !operations) return null;

  return { architecture, integration, operations };
}

function TechArchSections({ document: doc }: { document: AnalysisDocument }) {
  const sections = useMemo(() => parseTechArchSections(doc.content), [doc.content]);
  const [copied, setCopied] = useState(false);

  if (!sections) {
    return <DocumentViewer document={doc} copyLabel="Copy Architecture Doc" />;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => scrollTo("arch-architecture")} className="text-xs text-muted-foreground hover:text-primary">Architecture</button>
          <span className="text-muted-foreground">·</span>
          <button onClick={() => scrollTo("arch-integration")} className="text-xs text-muted-foreground hover:text-primary">Integration</button>
          <span className="text-muted-foreground">·</span>
          <button onClick={() => scrollTo("arch-operations")} className="text-xs text-muted-foreground hover:text-primary">Operations</button>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {copied ? "Copied!" : "Copy Full Architecture Doc"}
        </button>
      </div>

      <div className="space-y-8">
        <section id="arch-architecture">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Architecture</h3>
          <DocumentViewer document={{ ...doc, content: sections.architecture }} />
        </section>
        <section id="arch-integration">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Integration</h3>
          <DocumentViewer document={{ ...doc, content: sections.integration }} />
        </section>
        <section id="arch-operations">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Operations</h3>
          <DocumentViewer document={{ ...doc, content: sections.operations }} />
        </section>
      </div>
    </div>
  );
}

export function DocumentTabs({ documents, executionPrompts }: DocumentTabsProps) {
  const [activeDoc, setActiveDoc] = useState<string>("strategy");

  const prdDoc = documents.find((d) => d.type === "app_prd");
  const strategyDoc = documents.find((d) => d.type === "strategic_analysis");
  const archDoc = documents.find((d) => d.type === "technical_architecture");
  const claudeMdDoc = documents.find((d) => d.type === "claude_md");
  const mcpJsonDoc = documents.find((d) => d.type === "mcp_json") ?? null;
  const envExampleDoc = documents.find((d) => d.type === "env_example") ?? null;
  const claudeCommandsDoc = documents.find((d) => d.type === "claude_commands") ?? null;
  const claudeAgentsDoc = documents.find((d) => d.type === "claude_agents") ?? null;
  const buildStrategyDoc = documents.find((d) => d.type === "build_strategy") ?? null;
  const claudeSettingsDoc = documents.find((d) => d.type === "claude_settings") ?? null;
  const claudeSkillsDoc = documents.find((d) => d.type === "claude_skills") ?? null;
  const epCount = (executionPrompts ?? []).length;

  const visualData = useMemo(() => {
    if (!strategyDoc) return null;
    return tryParseVisualStrategy(strategyDoc.content);
  }, [strategyDoc]);

  if (!prdDoc && !strategyDoc && !archDoc && !claudeMdDoc && epCount === 0) {
    return null;
  }

  // Always define all 5 sidebar items
  const sidebarItems = [
    { key: "strategy", label: "Visual Strategy", available: !!strategyDoc },
    { key: "prd", label: "Product Brief", available: !!prdDoc },
    { key: "architecture", label: "Technical Architecture", available: !!archDoc },
    { key: "prompts", label: "Execution Prompts", available: epCount > 0, badge: epCount > 0 ? String(epCount) : undefined, disabledHint: "Step 5 required" },
    { key: "claude_md", label: "Project Files", available: !!claudeMdDoc, disabledHint: "Step 5 required" },
  ];

  // Default to the first available doc
  const firstAvailable = sidebarItems.find((i) => i.available)?.key ?? "strategy";
  const currentDoc = activeDoc || firstAvailable;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Generated Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ready-to-use documents generated from the analysis steps.
        </p>
      </div>

      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select value={currentDoc} onValueChange={(v) => { const item = sidebarItems.find((i) => i.key === v); if (item?.available) setActiveDoc(v); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {sidebarItems.map((item) => (
              <SelectItem key={item.key} value={item.key} disabled={!item.available}>
                {item.label}{!item.available ? " (not available)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Sidebar + content */}
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
        {/* Sidebar — always show all 4 items */}
        <nav className="hidden md:flex flex-col gap-1 bg-surface-0 rounded-xl p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => item.available && setActiveDoc(item.key)}
              disabled={!item.available}
              className={cn(
                "text-left text-sm px-3 py-2 rounded-md transition-colors",
                !item.available && "text-muted-foreground/40 cursor-default",
                item.available && currentDoc === item.key && "bg-surface-2 text-foreground font-medium",
                item.available && currentDoc !== item.key && "text-muted-foreground hover:bg-surface-1",
                item.key === "prompts" && "flex items-center"
              )}
            >
              {item.label}
              {!item.available && item.disabledHint && (
                <span className="block text-[11px] text-muted-foreground/40">({item.disabledHint})</span>
              )}
              {!item.available && !item.disabledHint && (
                <span className="block text-[11px] text-muted-foreground/40">(not available)</span>
              )}
              {item.badge && item.available && (
                <Badge variant="secondary" className="ml-1 text-[11px]">{item.badge}</Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {currentDoc === "strategy" && (
            strategyDoc ? (
              visualData ? (
                <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6">
                  <StrategySidebarNav visualStrategy={visualData} />
                  <VisualStrategy data={visualData} />
                </div>
              ) : (
                <DocumentViewer document={strategyDoc} />
              )
            ) : (
              <div className="rounded-xl border border-border bg-surface-0 p-8 text-center">
                <p className="text-sm text-muted-foreground">Visual Strategy was not generated for this analysis.</p>
              </div>
            )
          )}

          {currentDoc === "prd" && (
            prdDoc ? (
              <PrdSections document={prdDoc} />
            ) : (
              <div className="rounded-xl border border-border bg-surface-0 p-8 text-center">
                <p className="text-sm text-muted-foreground">Product Brief was not generated for this analysis.</p>
              </div>
            )
          )}

          {currentDoc === "architecture" && (
            archDoc ? (
              <TechArchSections document={archDoc} />
            ) : (
              <div className="rounded-xl border border-border bg-surface-0 p-8 text-center">
                <p className="text-sm text-muted-foreground">Technical Architecture was not generated for this analysis.</p>
              </div>
            )
          )}

          {currentDoc === "prompts" && (
            epCount > 0 ? (
              <ExecutionPromptViewer prompts={executionPrompts!} />
            ) : (
              <div className="rounded-xl border border-border bg-surface-0 p-8 text-center">
                <p className="text-sm text-muted-foreground">Execution Prompts require Step 5 (Technology Selection) to complete successfully.</p>
              </div>
            )
          )}

          {currentDoc === "claude_md" && (
            claudeMdDoc ? (
              <ClaudeMdViewer claudeMdDoc={claudeMdDoc} mcpJsonDoc={mcpJsonDoc} envExampleDoc={envExampleDoc} claudeCommandsDoc={claudeCommandsDoc} claudeAgentsDoc={claudeAgentsDoc} buildStrategyDoc={buildStrategyDoc} claudeSettingsDoc={claudeSettingsDoc} claudeSkillsDoc={claudeSkillsDoc} />
            ) : (
              <div className="rounded-xl border border-border bg-surface-0 p-8 text-center">
                <p className="text-sm text-muted-foreground">Project Files require Step 5 (Technology Selection) to complete successfully.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
