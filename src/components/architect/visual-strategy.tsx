"use client";

import { PersonaCards } from "@/components/architect/persona-cards";
import { RevenueChart } from "@/components/architect/revenue-chart";
import { CompetitiveMatrix } from "@/components/architect/competitive-matrix";
import { RiskMatrix } from "@/components/architect/risk-matrix";
import { MarketChart } from "@/components/architect/market-chart";
import { TimelineVisual } from "@/components/architect/timeline-visual";
import { GoNoGoScorecard } from "@/components/architect/go-no-go-scorecard";
import { MarketGapAnalysis } from "@/components/architect/market-gap-analysis";
import { RevenueProjections } from "@/components/architect/revenue-projections";
import { EnhancedCompetitiveDetails } from "@/components/architect/enhanced-competitive-details";
import { DataModelVisual } from "@/components/architect/data-model-visual";
import { StrategySectionWrapper } from "@/components/architect/strategy-section-wrapper";
import { Target, TrendingUp, DollarSign, Code } from "lucide-react";
import type { VisualStrategy as VisualStrategyType } from "@/lib/types";

interface VisualStrategyProps {
  data: VisualStrategyType;
}

export function VisualStrategy({ data }: VisualStrategyProps) {
  if (!data) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Visual strategy data not available.
      </div>
    );
  }

  const hasMarketGroup =
    (data?.competitiveMatrix ?? []).length > 0 ||
    (data?.competitiveDetails ?? []).length > 0 ||
    (data?.marketGapAnalysis ?? []).length > 0 ||
    (data?.marketData ?? []).length > 0;

  const hasBusinessGroup =
    !!data?.revenueModel ||
    !!data?.revenueProjections ||
    (data?.personas ?? []).length > 0;

  const hasTechnicalGroup =
    (data?.dataModel ?? []).length > 0 ||
    (data?.timeline ?? []).length > 0 ||
    (data?.risks ?? []).length > 0;

  return (
    <div className="space-y-12">
      {/* Decision */}
      {data?.goNoGoScorecard && (
        <StrategySectionWrapper id="vs-go-no-go" title="Go/No-Go Scorecard" icon={Target}>
          <GoNoGoScorecard data={data.goNoGoScorecard} hideTitle />
        </StrategySectionWrapper>
      )}

      {/* Market Group */}
      {hasMarketGroup && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Market Analysis</h2>
          </div>
          {(data?.competitiveMatrix ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-competitive-matrix" title="Competitive Matrix" icon={TrendingUp} description="Feature comparison across competitors">
              <CompetitiveMatrix matrix={data.competitiveMatrix} hideTitle />
            </StrategySectionWrapper>
          )}
          {(data?.competitiveDetails ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-competitive-details" title="Competitive Deep Dive" icon={TrendingUp}>
              <EnhancedCompetitiveDetails details={data.competitiveDetails!} hideTitle />
            </StrategySectionWrapper>
          )}
          {(data?.marketGapAnalysis ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-market-gaps" title="Market Gap Analysis" icon={TrendingUp}>
              <MarketGapAnalysis gaps={data.marketGapAnalysis!} hideTitle />
            </StrategySectionWrapper>
          )}
          {(data?.marketData ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-market-segments" title="Market Segments" icon={TrendingUp}>
              <MarketChart marketData={data.marketData} hideTitle />
            </StrategySectionWrapper>
          )}
        </div>
      )}

      {/* Business Group */}
      {hasBusinessGroup && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Business Model</h2>
          </div>
          {data?.revenueModel && (
            <StrategySectionWrapper id="vs-revenue-model" title="Revenue Model" icon={DollarSign}>
              <RevenueChart revenueModel={data.revenueModel} hideTitle />
            </StrategySectionWrapper>
          )}
          {data?.revenueProjections && (
            <StrategySectionWrapper id="vs-revenue-projections" title="Revenue Projections" icon={DollarSign}>
              <RevenueProjections data={data.revenueProjections} hideTitle />
            </StrategySectionWrapper>
          )}
          {(data?.personas ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-personas" title="User Personas" icon={DollarSign}>
              <PersonaCards personas={data.personas} hideTitle />
            </StrategySectionWrapper>
          )}
        </div>
      )}

      {/* Technical Group */}
      {hasTechnicalGroup && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Technical Planning</h2>
          </div>
          {(data?.dataModel ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-data-model" title="Data Model" icon={Code}>
              <DataModelVisual entities={data.dataModel!} hideTitle />
            </StrategySectionWrapper>
          )}
          {(data?.timeline ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-timeline" title="Timeline" icon={Code}>
              <TimelineVisual timeline={data.timeline} hideTitle />
            </StrategySectionWrapper>
          )}
          {(data?.risks ?? []).length > 0 && (
            <StrategySectionWrapper id="vs-risk-assessment" title="Risk Assessment" icon={Code}>
              <RiskMatrix risks={data.risks} hideTitle />
            </StrategySectionWrapper>
          )}
        </div>
      )}
    </div>
  );
}
