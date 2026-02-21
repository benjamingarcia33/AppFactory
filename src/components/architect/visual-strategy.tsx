"use client";

import { PersonaCards } from "@/components/architect/persona-cards";
import { RevenueChart } from "@/components/architect/revenue-chart";
import { CompetitiveMatrix } from "@/components/architect/competitive-matrix";
import { RiskMatrix } from "@/components/architect/risk-matrix";
import { MarketChart } from "@/components/architect/market-chart";
import { TimelineVisual } from "@/components/architect/timeline-visual";
import type { VisualStrategy as VisualStrategyType } from "@/lib/types";

interface VisualStrategyProps {
  data: VisualStrategyType;
}

export function VisualStrategy({ data }: VisualStrategyProps) {
  return (
    <div className="space-y-8">
      {data.personas && data.personas.length > 0 && (
        <PersonaCards personas={data.personas} />
      )}

      {data.revenueModel && (
        <RevenueChart revenueModel={data.revenueModel} />
      )}

      {data.competitiveMatrix && data.competitiveMatrix.length > 0 && (
        <CompetitiveMatrix matrix={data.competitiveMatrix} />
      )}

      {data.risks && data.risks.length > 0 && (
        <RiskMatrix risks={data.risks} />
      )}

      {data.marketData && data.marketData.length > 0 && (
        <MarketChart marketData={data.marketData} />
      )}

      {data.timeline && data.timeline.length > 0 && (
        <TimelineVisual timeline={data.timeline} />
      )}
    </div>
  );
}
