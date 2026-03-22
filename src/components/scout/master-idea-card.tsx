"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OpportunityDetailModal } from "./opportunity-detail-modal";
import {
  Sparkles,
  Target,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Shield,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  priorityColors,
  verdictConfig,
  assessmentConfig,
  scoreColor,
  CHART_COLORS,
} from "@/lib/ui-constants";
import type { MasterIdea, Opportunity } from "@/lib/types";

interface MasterIdeaCardProps {
  masterIdea: MasterIdea;
  scanId: string;
  opportunities?: Opportunity[];
  hideExecutiveSummary?: boolean;
}

const assessmentIcons: Record<string, typeof CheckCircle2> = {
  go: CheckCircle2,
  caution: AlertTriangle,
  no_go: XCircle,
};

export function MasterIdeaCard({ masterIdea, scanId, opportunities = [], hideExecutiveSummary = false }: MasterIdeaCardProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const rec = masterIdea.aiRecommendation;
  const feas = masterIdea.feasibilityAssessment;
  const viab = masterIdea.marketViability;
  const diff = masterIdea.difficultyBreakdown;

  // Map competitor app IDs to actual opportunity objects for click-through
  const competitorOpportunityMap = useMemo(() => {
    const map = new Map<string, Opportunity>();
    for (const opp of opportunities) {
      map.set(opp.scrapedApp.id, opp);
    }
    return map;
  }, [opportunities]);

  // Map competitor app ID -> name
  const competitorNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cf of masterIdea.competitorFlaws) {
      map.set(cf.competitorAppId, cf.competitorName);
    }
    return map;
  }, [masterIdea.competitorFlaws]);

  // Flaw text -> competitor name for cross-referencing
  const flawToCompetitorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cf of masterIdea.competitorFlaws) {
      for (const flaw of cf.flaws) map.set(flaw.toLowerCase(), cf.competitorName);
      for (const gap of cf.featureGaps) map.set(gap.toLowerCase(), cf.competitorName);
    }
    return map;
  }, [masterIdea.competitorFlaws]);

  function findCompetitorForFlaw(flaw: string): string | undefined {
    const lower = flaw.toLowerCase();
    const exact = flawToCompetitorMap.get(lower);
    if (exact) return exact;
    for (const [key, name] of flawToCompetitorMap) {
      if (lower.includes(key) || key.includes(lower)) return name;
    }
    return undefined;
  }

  function getFeaturesForCompetitor(competitorAppId: string): string[] {
    return masterIdea.coreFeatures
      .filter((f) => f.evidenceAppIds.includes(competitorAppId))
      .map((f) => f.name);
  }

  function getFeatureCompetitorNames(evidenceAppIds: string[]): string[] {
    const names = new Set<string>();
    for (const appId of evidenceAppIds) {
      const name = competitorNameMap.get(appId);
      if (name) names.add(name);
    }
    return Array.from(names);
  }

  function handleCompetitorClick(competitorAppId: string) {
    const opp = competitorOpportunityMap.get(competitorAppId);
    if (opp) {
      setSelectedOpportunity(opp);
      setModalOpen(true);
    }
  }

  // Build gap chart data from competitor flaws
  const gapChartData = useMemo(() => {
    return masterIdea.competitorFlaws.map((cf) => {
      const gapSize = cf.flaws.length + cf.featureGaps.length;
      return {
        name: cf.competitorName.length > 15 ? cf.competitorName.slice(0, 14) + "..." : cf.competitorName,
        fullName: cf.competitorName,
        flaws: cf.flaws.length,
        gaps: cf.featureGaps.length,
        total: gapSize,
        rating: cf.marketData.rating,
      };
    }).sort((a, b) => b.total - a.total);
  }, [masterIdea.competitorFlaws]);

  const verdictCfg = rec ? verdictConfig[rec.verdict] : null;

  return (
    <>
      <Card className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-surface-0">
        {/* Header: Name + Tagline (hidden when hideExecutiveSummary) */}
        {!hideExecutiveSummary && (
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">{masterIdea.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  {masterIdea.tagline}
                </p>
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent className="space-y-6">
          {/* Verdict badge (hidden when hideExecutiveSummary) */}
          {!hideExecutiveSummary && rec && (
            <div className="flex items-center gap-2 flex-wrap">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className={`text-sm font-bold px-3 py-1 ${verdictCfg?.bgClass ?? ""} ${verdictCfg?.color ?? ""}`}
              >
                {verdictCfg?.label ?? rec.verdict}
              </Badge>
              <span className="text-sm text-muted-foreground truncate">{rec.summary}</span>
            </div>
          )}

          {/* Section 1: Description */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {masterIdea.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Target Audience
                </p>
                <p className="text-xs text-foreground">{masterIdea.targetAudience}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Market Opportunity
                </p>
                <p className="text-xs text-foreground">{masterIdea.marketOpportunity}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Market Gap Chart */}
          {gapChartData.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-0 border border-border space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" />
                Market Gap by Competitor
              </h3>
              <p className="text-xs text-muted-foreground">More flaws + feature gaps = bigger opportunity for us</p>
              <div style={{ width: "100%", height: Math.max(gapChartData.length * 40 + 40, 160) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gapChartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(value, name) => [value, name === "flaws" ? "Flaws" : "Feature Gaps"]}
                      labelFormatter={(label) => {
                        const item = gapChartData.find((d) => d.name === label);
                        return item ? `${item.fullName} (${item.rating}/5)` : String(label);
                      }}
                    />
                    <Bar dataKey="flaws" stackId="gap" name="flaws" radius={[0, 0, 0, 0]}>
                      {gapChartData.map((_, i) => (<Cell key={i} fill={CHART_COLORS.red} />))}
                    </Bar>
                    <Bar dataKey="gaps" stackId="gap" name="gaps" radius={[0, 4, 4, 0]}>
                      {gapChartData.map((_, i) => (<Cell key={i} fill={CHART_COLORS.orange} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground justify-center">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Flaws</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-orange-500" /> Feature Gaps</span>
              </div>
            </div>
          )}

          {/* Section 3: AI Verdict & Go/No-Go (Collapsible, default open) */}
          {rec && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  AI Verdict & Go/No-Go
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className={`p-4 rounded-xl border-2 ${verdictCfg?.bgClass ?? "border-muted"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5" />
                    <span className="text-base font-bold">Should You Build This?</span>
                  </div>
                  <p className="text-sm text-foreground mb-3">{rec.summary}</p>

                  {rec.warnings.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {rec.warnings.map((warning, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-red-400">{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {rec.goNoGoFactors.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rec.goNoGoFactors.map((factor, i) => {
                        const cfg = assessmentConfig[factor.assessment] ?? assessmentConfig.caution;
                        const Icon = assessmentIcons[factor.assessment] ?? AlertTriangle;
                        return (
                          <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${cfg.bg}`}>
                            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold">{factor.factor}</span>
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${cfg.bg} ${cfg.color}`}>
                                  {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{factor.explanation}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Section 4: Feasibility & Difficulty */}
          {(feas || diff) && (
            <div className="p-4 rounded-xl bg-surface-0 border border-border space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                Feasibility & Difficulty
              </h3>

              {diff && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`text-xs ${
                    diff.technicalComplexity === "low" ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : diff.technicalComplexity === "medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {diff.technicalComplexity} complexity
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    MVP: {diff.timeToMvp}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {diff.teamSize}
                  </Badge>
                </div>
              )}

              {feas && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Assessment</p>
                    <p className="text-xs">{feas.reasoning}</p>
                    {feas.costEstimate && (
                      <p className="text-xs text-muted-foreground">
                        Est. infrastructure: <span className="font-medium text-foreground">{feas.costEstimate}</span>
                      </p>
                    )}
                  </div>
                  {feas.majorBlockers.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Blockers</p>
                      {feas.majorBlockers.map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-xs">{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {diff && diff.keyTechnicalChallenges.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Key Challenges</p>
                  <div className="flex flex-wrap gap-1">
                    {diff.keyTechnicalChallenges.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px] font-normal">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {diff && diff.requiredExpertise.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Required Expertise</p>
                  <div className="flex flex-wrap gap-1">
                    {diff.requiredExpertise.map((e, i) => (
                      <Badge key={i} variant="outline" className="text-[11px] font-normal bg-blue-500/5 border-blue-500/20">{e}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {viab && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Market Strategy</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-surface-1 border">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Revenue</p>
                      <p className="text-xs font-medium">{viab.revenueModel}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">User Acquisition</p>
                      <p className="text-xs font-medium">{viab.userAcquisitionStrategy}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-1 border">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Advantage</p>
                      <p className="text-xs font-medium capitalize">{viab.competitiveAdvantageType}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 5: Core Features */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" />
              Core Features
            </h3>
            <div className="space-y-0">
              {masterIdea.coreFeatures.map((feature, i) => {
                const competitorNames = getFeatureCompetitorNames(feature.evidenceAppIds);
                return (
                  <div key={i}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="p-2.5 rounded-lg bg-surface-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[11px] ${priorityColors[feature.priority] ?? ""}`}>
                          {feature.priority}
                        </Badge>
                        <span className="text-sm font-medium">{feature.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      {feature.addressesFlaws.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {feature.addressesFlaws.map((flaw, j) => {
                            const compName = findCompetitorForFlaw(flaw);
                            return (
                              <Badge key={j} variant="destructive" className="text-[11px] font-normal">
                                {compName ? `${compName}: ` : "fixes: "}{flaw}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      {competitorNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {competitorNames.map((name, j) => (
                            <Badge key={j} variant="outline" className="text-[11px] font-normal bg-primary/5 border-primary/20">
                              vs {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Unique Value Props */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-primary" />
              Unique Value Propositions
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {masterIdea.uniqueValueProps.map((prop, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal bg-primary/5 border-primary/20">
                  {prop}
                </Badge>
              ))}
            </div>
          </div>

          {/* Section 7: Competitor Deep-Dive (per-competitor Collapsibles) */}
          {masterIdea.competitorFlaws.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" />
                Competitor Deep-Dive ({masterIdea.competitorFlaws.length} competitors)
              </h3>
              <div className="space-y-2">
                {masterIdea.competitorFlaws.map((cf, i) => {
                  const ourFeatures = getFeaturesForCompetitor(cf.competitorAppId);
                  const opp = competitorOpportunityMap.get(cf.competitorAppId);
                  const isClickable = !!opp;

                  return (
                    <Collapsible key={i}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-surface-0 hover:bg-surface-1 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0">
                          {opp?.scrapedApp.icon && (
                            <div className="relative size-6 rounded-md overflow-hidden shrink-0 border">
                              <Image src={opp.scrapedApp.icon} alt={cf.competitorName} fill className="object-cover" sizes="24px" />
                            </div>
                          )}
                          <span className="text-sm font-medium truncate">{cf.competitorName}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {cf.marketData.rating}/5
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground">
                            {cf.flaws.length} flaws, {cf.featureGaps.length} gaps
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 pl-3 pr-3 pb-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{cf.marketData.installs}</span>
                          {isClickable && (
                            <Badge
                              variant="outline"
                              className="text-[9px] text-primary border-primary/30 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompetitorClick(cf.competitorAppId);
                              }}
                            >
                              View details
                            </Badge>
                          )}
                        </div>
                        {cf.flaws.length > 0 && (
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Flaws</p>
                            <div className="flex flex-wrap gap-1">
                              {cf.flaws.map((flaw, j) => (
                                <Badge key={j} variant="destructive" className="text-[11px] font-normal">{flaw}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {cf.featureGaps.length > 0 && (
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Feature Gaps</p>
                            <div className="flex flex-wrap gap-1">
                              {cf.featureGaps.map((gap, j) => (
                                <Badge key={j} variant="outline" className="text-[11px] font-normal bg-orange-500/10 text-orange-400 border-orange-500/20">{gap}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {cf.strengths.length > 0 && (
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Strengths to Match</p>
                            <div className="flex flex-wrap gap-1">
                              {cf.strengths.map((s, j) => (
                                <Badge key={j} variant="secondary" className="text-[11px] font-normal">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {ourFeatures.length > 0 && (
                          <div className="pt-1 border-t border-border/50">
                            <p className="text-[11px] text-green-400 uppercase tracking-wider mb-0.5 font-semibold">Our Answer</p>
                            <div className="flex flex-wrap gap-1">
                              {ourFeatures.map((name, j) => (
                                <Badge key={j} variant="outline" className="text-[11px] font-normal bg-green-500/10 text-green-400 border-green-500/20">{name}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 8: Search Strategy (Collapsible, default closed) */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Search className="h-4 w-4 text-primary" />
                Search Strategy
              </h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              <p className="text-xs text-muted-foreground">{masterIdea.searchStrategy.reasoning}</p>
              <div className="flex flex-wrap gap-1">
                {masterIdea.searchStrategy.queries.map((q, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-normal">{q}</Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* CTA */}
          <Button asChild size="lg" className="w-full gap-2">
            <Link href={`/architect?scanId=${scanId}`}>
              <Sparkles className="h-4 w-4" />
              Architect this Idea
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Opportunity detail modal for clicking on competitor apps */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        allOpportunities={opportunities}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setSelectedOpportunity(null);
        }}
      />
    </>
  );
}
