"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MarketGapItem } from "@/lib/types";

interface MarketGapAnalysisProps {
  gaps: MarketGapItem[];
  hideTitle?: boolean;
}

const categoryLabels: Record<string, string> = {
  unserved_need: "Unserved Need",
  underserved_segment: "Underserved Segment",
  blue_ocean: "Blue Ocean",
  feature_gap: "Feature Gap",
};

const categoryColors: Record<string, string> = {
  unserved_need: "bg-red-500/10 text-red-400 border-red-500/20",
  underserved_segment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  blue_ocean: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  feature_gap: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const difficultyColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function MarketGapAnalysis({ gaps, hideTitle }: MarketGapAnalysisProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Market gap analysis data not available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">Market Gap Analysis</h3>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {gaps.map((gap, i) => (
          <Card key={i} className="bg-surface-0 border border-border rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-tight">
                  {gap?.gap ?? "Unknown gap"}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn("text-[11px] shrink-0", categoryColors[gap?.category] ?? "")}
                >
                  {categoryLabels[gap?.category] ?? gap?.category ?? "Unknown"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Current Alternatives</p>
                <p>{gap?.currentAlternatives ?? "No data"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Opportunity Size</p>
                  <p>{gap?.opportunitySize ?? "Unknown"}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[11px]", difficultyColors[gap?.difficultyToAddress] ?? "")}
                >
                  {gap?.difficultyToAddress ?? "unknown"} difficulty
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Our Approach</p>
                <p>{gap?.ourApproach ?? "No approach defined"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
