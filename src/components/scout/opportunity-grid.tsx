"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpportunityCard } from "./opportunity-card";
import type { Opportunity } from "@/lib/types";

type SortField = "composite" | "dissatisfaction" | "marketSize";

interface OpportunityGridProps {
  opportunities: Opportunity[];
  onSelect?: (opportunity: Opportunity) => void;
}

export function OpportunityGrid({ opportunities, onSelect }: OpportunityGridProps) {
  const [sortBy, setSortBy] = useState<SortField>("composite");

  const sorted = useMemo(() => {
    const copy = [...opportunities];
    copy.sort((a, b) => {
      switch (sortBy) {
        case "composite":
          return b.score.composite - a.score.composite;
        case "dissatisfaction":
          return b.score.dissatisfaction - a.score.dissatisfaction;
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
          {opportunities.length} opportunit{opportunities.length === 1 ? "y" : "ies"} found
        </p>
        <div className="flex items-center gap-2">
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
              <SelectItem value="dissatisfaction">Dissatisfaction</SelectItem>
              <SelectItem value="marketSize">Market Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
