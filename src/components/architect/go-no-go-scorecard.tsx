"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GoNoGoScorecard as GoNoGoScorecardType } from "@/lib/types";

interface GoNoGoScorecardProps {
  data: GoNoGoScorecardType;
  hideTitle?: boolean;
  compact?: boolean;
}

const goNoGoVerdictConfig: Record<GoNoGoScorecardType["overallVerdict"], { label: string; color: string }> = {
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

function getScoreColor(score: number): string {
  if (score >= 7) return "text-green-400";
  if (score >= 4) return "text-yellow-400";
  return "text-red-400";
}

export function GoNoGoScorecard({ data, hideTitle, compact }: GoNoGoScorecardProps) {
  if (!data) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Scorecard data not available.
      </div>
    );
  }

  const verdict = goNoGoVerdictConfig[data?.overallVerdict] ?? goNoGoVerdictConfig.conditional_go;
  const weightedScore = data?.weightedScore ?? 0;
  const scores = data?.scores ?? [];
  const keyRisks = data?.keyRisks ?? [];
  const keyOpportunities = data?.keyOpportunities ?? [];

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">Go / No-Go Scorecard</h3>}

      {/* Verdict Banner */}
      <div className={cn("rounded-lg border-2 p-4 text-center", verdict.color)}>
        <p className="text-2xl font-bold">{verdict.label}</p>
        <p className="text-sm mt-1 font-medium">
          Weighted Score: {typeof weightedScore === "number" ? weightedScore.toFixed(1) : weightedScore}/10
        </p>
        <p className="text-sm mt-2 opacity-80">{data?.investmentThesis ?? "No investment thesis available"}</p>
      </div>

      {!compact && (
        <>
          {/* Dimension Scores Table */}
          {scores.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-1">
                    <th className="text-left py-2 px-3 font-medium">Dimension</th>
                    <th className="text-center py-2 px-3 font-medium">Score</th>
                    <th className="text-center py-2 px-3 font-medium">Weight</th>
                    <th className="text-left py-2 px-3 font-medium">Reasoning</th>
                  </tr>
                </thead>
                <tbody className="bg-surface-0">
                  {scores.map((item, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-2 px-3 font-medium">{item?.dimension ?? "Unknown"}</td>
                      <td className={cn("py-2 px-3 text-center font-bold", getScoreColor(item?.score ?? 0))}>
                        {item?.score ?? 0}/10
                      </td>
                      <td className="py-2 px-3 text-center text-muted-foreground">
                        {((item?.weight ?? 0) * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{item?.reasoning ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Risks & Opportunities */}
          <div className="grid grid-cols-2 gap-3">
            {keyRisks.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs font-medium text-red-400 mb-2">Key Risks</p>
                  <ul className="space-y-1">
                    {keyRisks.map((risk, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5 shrink-0">-</span>
                        <span>{risk ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {keyOpportunities.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs font-medium text-green-400 mb-2">Key Opportunities</p>
                  <ul className="space-y-1">
                    {keyOpportunities.map((opp, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 shrink-0">+</span>
                        <span>{opp ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendation */}
          {data?.recommendation && (
            <div className="rounded-lg border border-border bg-surface-0 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
              <p className="text-sm">{data.recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
