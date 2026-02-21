"use client";

import { useEffect, useState } from "react";
import { getAllOpportunities } from "@/actions/scout-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Opportunity } from "@/lib/types";

interface OpportunitySelectorProps {
  onSelect: (opportunityId: string) => void;
  onStartAnalysis: () => void;
  onCancel?: () => void;
  selectedId: string | null;
  isAnalyzing: boolean;
  hasCompleted: boolean;
}

export function OpportunitySelector({
  onSelect,
  onStartAnalysis,
  onCancel,
  selectedId,
  isAnalyzing,
  hasCompleted,
}: OpportunitySelectorProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllOpportunities();
        setOpportunities(data);
      } catch (error) {
        console.error("Failed to load opportunities:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selected = opportunities.find((o) => o.id === selectedId);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Select an Opportunity</label>
          <Select
            value={selectedId ?? ""}
            onValueChange={onSelect}
            disabled={isAnalyzing || loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loading ? "Loading opportunities..." : "Choose an app to analyze"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {opportunities.map((opp) => (
                <SelectItem key={opp.id} value={opp.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{opp.scrapedApp.title}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {opp.score.composite.toFixed(0)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {opp.scrapedApp.store === "google_play"
                        ? "Google Play"
                        : "App Store"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAnalyzing ? (
          <Button
            onClick={onCancel}
            variant="destructive"
            className="sm:w-auto w-full"
          >
            Cancel Analysis
          </Button>
        ) : (
          <Button
            onClick={onStartAnalysis}
            disabled={!selectedId}
            className="sm:w-auto w-full"
          >
            {hasCompleted ? "Re-run Analysis" : "Start Analysis"}
          </Button>
        )}
      </div>

      {selected && !isAnalyzing && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{selected.scrapedApp.genre}</span>
          <span>&middot;</span>
          <span>
            {selected.scrapedApp.score.toFixed(1)}/5 (
            {selected.scrapedApp.ratings.toLocaleString()} ratings)
          </span>
          <span>&middot;</span>
          <span>{selected.scrapedApp.installs} installs</span>
          {selected.sentiment.painPoints.length > 0 && (
            <>
              <span>&middot;</span>
              <span>
                {selected.sentiment.painPoints.length} pain points identified
              </span>
            </>
          )}
        </div>
      )}

      {!loading && opportunities.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No opportunities found. Run a scan in the Scout page first.
        </p>
      )}
    </div>
  );
}
