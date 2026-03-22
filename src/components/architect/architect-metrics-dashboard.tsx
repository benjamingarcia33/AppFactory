"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { verdictConfig as sharedVerdictConfig } from "@/lib/ui-constants";
import type { VisualStrategy, GoNoGoScorecard as GoNoGoScorecardType } from "@/lib/types";

interface ArchitectMetricsDashboardProps {
  visualStrategy: VisualStrategy | null;
}

const dashboardVerdictConfig: Record<GoNoGoScorecardType["overallVerdict"], { label: string; color: string }> = {
  strong_go: {
    label: "STRONG GO",
    color: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  go: {
    label: "GO",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  conditional_go: {
    label: "CONDITIONAL GO",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
  no_go: {
    label: "NO GO",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
  },
};

export function ArchitectMetricsDashboard({ visualStrategy }: ArchitectMetricsDashboardProps) {
  if (!visualStrategy) return null;

  const scorecard = visualStrategy.goNoGoScorecard;
  const projections = visualStrategy.revenueProjections;

  // If we have nothing to show, return null
  if (!scorecard && !projections) return null;

  const verdict = scorecard ? dashboardVerdictConfig[scorecard.overallVerdict] ?? dashboardVerdictConfig.conditional_go : null;
  const weightedScore = scorecard?.weightedScore ?? 0;

  const kpis = projections
    ? [
        { label: "CAC", value: projections.cac ?? "N/A" },
        { label: "LTV", value: projections.ltv ?? "N/A" },
        { label: "LTV:CAC", value: `${projections.ltvCacRatio ?? 0}x` },
        { label: "Churn", value: projections.monthlyChurnRate ?? "N/A" },
        { label: "Margin", value: projections.grossMargin ?? "N/A" },
        { label: "B.Even", value: `M${projections.breakEvenMonth ?? "?"}` },
      ]
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-3">
      {/* Verdict row */}
      {verdict && scorecard && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Badge variant="outline" className={cn("text-sm font-bold px-3 py-1", verdict.color)}>
            {verdict.label}
          </Badge>
          <p className="text-sm font-medium text-muted-foreground">
            Weighted Score: <span className="text-foreground font-bold">{typeof weightedScore === "number" ? weightedScore.toFixed(1) : weightedScore}/10</span>
          </p>
        </div>
      )}

      {/* KPI grid */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {kpis.map((kpi, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-surface-0 border border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </p>
              <p className="text-lg font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
