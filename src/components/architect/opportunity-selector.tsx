"use client";

import { useEffect, useState } from "react";
import { getAllOpportunities, getScans } from "@/actions/scout-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { Opportunity, Scan } from "@/lib/types";

interface OpportunitySelectorProps {
  onSelect: (id: string, type: "opportunity" | "masterIdea") => void;
  onStartAnalysis: () => void;
  onCancel?: () => void;
  selectedId: string | null;
  selectedScanId: string | null;
  isAnalyzing: boolean;
  hasCompleted: boolean;
}

type SelectableItem =
  | { kind: "masterIdea"; scanId: string; name: string; confidenceScore: number; competitorCount: number }
  | { kind: "opportunity"; id: string; title: string; compositeScore: number; store: string };

export function OpportunitySelector({
  onSelect,
  onStartAnalysis,
  onCancel,
  selectedId,
  selectedScanId,
  isAnalyzing,
  hasCompleted,
}: OpportunitySelectorProps) {
  const [items, setItems] = useState<SelectableItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [opportunities, scans] = await Promise.all([
          getAllOpportunities(),
          getScans(),
        ]);

        const selectableItems: SelectableItem[] = [];

        // Add master ideas from synthesis scans
        for (const scan of scans) {
          if (scan.masterIdea && scan.status === "completed") {
            selectableItems.push({
              kind: "masterIdea",
              scanId: scan.id,
              name: scan.masterIdea.name,
              confidenceScore: scan.masterIdea.confidenceScore,
              competitorCount: scan.masterIdea.competitorFlaws.length,
            });
          }
        }

        // Add individual opportunities
        for (const opp of opportunities) {
          selectableItems.push({
            kind: "opportunity",
            id: opp.id,
            title: opp.scrapedApp.title,
            compositeScore: opp.score.compositeScore,
            store: opp.scrapedApp.store,
          });
        }

        setItems(selectableItems);
      } catch (error) {
        console.error("Failed to load items:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute the current select value
  const currentValue = selectedScanId
    ? `scan:${selectedScanId}`
    : selectedId
      ? `opp:${selectedId}`
      : "";

  const handleValueChange = (value: string) => {
    if (value.startsWith("scan:")) {
      onSelect(value.slice(5), "masterIdea");
    } else if (value.startsWith("opp:")) {
      onSelect(value.slice(4), "opportunity");
    }
  };

  // Find selected item for detail display
  const selectedItem = items.find((item) => {
    if (item.kind === "masterIdea") return selectedScanId === item.scanId;
    return selectedId === item.id;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Select an Opportunity or Master Idea</label>
          <Select
            value={currentValue}
            onValueChange={handleValueChange}
            disabled={isAnalyzing || loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loading ? "Loading..." : "Choose an app or master idea to analyze"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {/* Master Ideas first */}
              {items.filter((i) => i.kind === "masterIdea").length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Master Ideas
                  </div>
                  {items
                    .filter((i): i is Extract<SelectableItem, { kind: "masterIdea" }> => i.kind === "masterIdea")
                    .map((item) => (
                      <SelectItem key={`scan:${item.scanId}`} value={`scan:${item.scanId}`}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                            {item.confidenceScore}%
                          </Badge>
                          <Badge variant="secondary" className="text-[11px]">
                            {item.competitorCount} competitors
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </>
              )}

              {/* Individual Opportunities */}
              {items.filter((i) => i.kind === "opportunity").length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Individual Opportunities
                  </div>
                  {items
                    .filter((i): i is Extract<SelectableItem, { kind: "opportunity" }> => i.kind === "opportunity")
                    .map((item) => (
                      <SelectItem key={`opp:${item.id}`} value={`opp:${item.id}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="secondary" className="text-[11px]">
                            {item.compositeScore.toFixed(0)}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            {item.store === "google_play" ? "Google Play" : "App Store"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </>
              )}
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
            disabled={!selectedId && !selectedScanId}
            className="sm:w-auto w-full"
          >
            {hasCompleted ? "Re-run Analysis" : "Start Analysis"}
          </Button>
        )}
      </div>

      {selectedItem && !isAnalyzing && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {selectedItem.kind === "masterIdea" ? (
            <>
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-medium text-foreground">{selectedItem.name}</span>
              <span>&middot;</span>
              <span>{selectedItem.confidenceScore}% confidence</span>
              <span>&middot;</span>
              <span>{selectedItem.competitorCount} competitors analyzed</span>
            </>
          ) : (
            <>
              <span>{selectedItem.title}</span>
              <span>&middot;</span>
              <span>Composite: {selectedItem.compositeScore}</span>
              <span>&middot;</span>
              <span>{selectedItem.store === "google_play" ? "Google Play" : "App Store"}</span>
            </>
          )}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No opportunities or master ideas found. Run a scan in the Scout page first.
        </p>
      )}
    </div>
  );
}
