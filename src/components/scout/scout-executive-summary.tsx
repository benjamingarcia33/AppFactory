"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield } from "lucide-react";
import { scoreColor, verdictConfig } from "@/lib/ui-constants";
import type { MasterIdea } from "@/lib/types";

interface ScoutExecutiveSummaryProps {
  masterIdea: MasterIdea;
  scanId: string;
}

export function ScoutExecutiveSummary({ masterIdea, scanId }: ScoutExecutiveSummaryProps) {
  const rec = masterIdea.aiRecommendation;
  const feas = masterIdea.feasibilityAssessment;
  const viab = masterIdea.marketViability;
  const verdictCfg = rec ? verdictConfig[rec.verdict] : null;

  const scores = [
    { label: "Feasibility", value: feas?.score },
    { label: "Market Viability", value: viab?.score },
    { label: "Confidence", value: masterIdea.confidenceScore },
  ].filter((s) => s.value != null) as { label: string; value: number }[];

  return (
    <Card className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-surface-0">
      <CardContent className="pt-6 space-y-4">
        {/* Title + Tagline */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{masterIdea.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground italic">{masterIdea.tagline}</p>
        </div>

        {/* Verdict Badge */}
        {rec && verdictCfg && (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant="outline"
              className={`text-sm font-bold px-3 py-1 ${verdictCfg.bgClass} ${verdictCfg.color}`}
            >
              {verdictCfg.label}
            </Badge>
          </div>
        )}

        {/* Score Bars */}
        {scores.length > 0 && (
          <div className="space-y-3">
            {scores.map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
                <div className="relative">
                  <div className="h-2.5 w-full rounded-full overflow-hidden bg-surface-0">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${value}%`,
                        backgroundColor: scoreColor(value),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Summary */}
        {rec?.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {rec.summary}
          </p>
        )}

        {/* CTA */}
        <Button asChild size="lg" className="w-full gap-2">
          <Link href={`/architect?scanId=${scanId}`}>
            <Sparkles className="h-4 w-4" />
            Architect this Idea
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
