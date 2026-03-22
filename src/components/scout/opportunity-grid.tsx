"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpportunityCard } from "./opportunity-card";
import { Grid3X3, List } from "lucide-react";
import { scoreColor, sentimentColors } from "@/lib/ui-constants";
import type { Opportunity } from "@/lib/types";

type SortField = "composite" | "featureGap" | "marketSize";

interface OpportunityGridProps {
  opportunities: Opportunity[];
  onSelect?: (opportunity: Opportunity) => void;
  label?: string;
}

const sentimentDotColor: Record<string, string> = {
  positive: "bg-green-500",
  mixed: "bg-yellow-500",
  negative: "bg-red-500",
};

export function OpportunityGrid({ opportunities, onSelect, label }: OpportunityGridProps) {
  const [sortBy, setSortBy] = useState<SortField>("composite");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sorted = useMemo(() => {
    const copy = [...opportunities];
    copy.sort((a, b) => {
      switch (sortBy) {
        case "composite":
          return b.score.compositeScore - a.score.compositeScore;
        case "featureGap":
          return b.score.featureGapScore - a.score.featureGapScore;
        case "marketSize":
          return b.score.marketSize - a.score.marketSize;
        default:
          return 0;
      }
    });
    return copy;
  }, [opportunities, sortBy]);

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No opportunities found</p>
        <p className="text-sm mt-1">
          Start a scan to discover app opportunities
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {opportunities.length} {label ?? `opportunit${opportunities.length === 1 ? "y" : "ies"} found`}
        </p>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <label className="text-sm text-muted-foreground">Sort by:</label>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortField)}
          >
            <SelectTrigger className="w-[180px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="composite">Composite Score</SelectItem>
              <SelectItem value="featureGap">Feature Gap</SelectItem>
              <SelectItem value="marketSize">Market Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((opp) => {
            const { scrapedApp, sentiment, score } = opp;
            const sentimentDot = sentimentDotColor[sentiment.overallSentiment] ?? "bg-gray-400";
            return (
              <div
                key={opp.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-surface-0 cursor-pointer hover:bg-surface-1 transition-colors"
                onClick={() => onSelect?.(opp)}
              >
                {scrapedApp.icon && (
                  <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border">
                    <Image
                      src={scrapedApp.icon}
                      alt={scrapedApp.title}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                )}
                <span className="text-sm font-medium truncate min-w-0 flex-1">
                  {scrapedApp.title}
                </span>
                <span
                  className="text-lg font-bold shrink-0"
                  style={{ color: scoreColor(score.compositeScore) }}
                >
                  {score.compositeScore}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                  M:{score.marketSize} G:{score.featureGapScore} F:{score.feasibility}
                </span>
                <div className={`size-2.5 rounded-full shrink-0 ${sentimentDot}`} title={sentiment.overallSentiment} />
                <Badge variant="outline" className="text-[11px] shrink-0">
                  {scrapedApp.store === "google_play" ? "GP" : "iOS"}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
