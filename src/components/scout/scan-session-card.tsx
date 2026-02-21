"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpportunityGrid } from "./opportunity-grid";
import { OpportunityDetailModal } from "./opportunity-detail-modal";
import { getOpportunitiesByScan } from "@/actions/scout-actions";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Scan, Opportunity } from "@/lib/types";
import {
  GOOGLE_PLAY_CATEGORIES,
  APP_STORE_CATEGORIES,
} from "@/lib/types";

interface ScanSessionCardProps {
  scan: Scan;
  isActive?: boolean;
  activeOpportunities?: Opportunity[];
  defaultExpanded?: boolean;
  /** Pre-loaded opportunities (from parent); skips lazy-load */
  loadedOpportunities?: Opportunity[];
}

const statusConfig: Record<
  Scan["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

function getCategoryLabel(store: string, categoryValue: string): string {
  const categories =
    store === "google_play" ? GOOGLE_PLAY_CATEGORIES : APP_STORE_CATEGORIES;
  const found = categories.find((c) => c.value === categoryValue);
  return found ? found.label : categoryValue;
}

export function ScanSessionCard({
  scan,
  isActive,
  activeOpportunities,
  defaultExpanded,
  loadedOpportunities: preLoaded,
}: ScanSessionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? isActive ?? false);
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(
    preLoaded ?? null
  );
  const [loading, setLoading] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const config = statusConfig[scan.status];
  const displayOpps = isActive ? (activeOpportunities ?? []) : (opportunities ?? []);

  const handleToggle = async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);

    // Lazy-load opportunities for past scans
    if (willExpand && !isActive && opportunities === null && !loading) {
      setLoading(true);
      try {
        const data = await getOpportunitiesByScan(scan.id);
        setOpportunities(data);
      } catch (err) {
        console.error("Failed to load opportunities for scan:", err);
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const date = new Date(scan.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      className={
        isActive
          ? "border-primary/50 shadow-md ring-1 ring-primary/20"
          : ""
      }
    >
      <CardHeader className="pb-0">
        <button
          onClick={handleToggle}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Badge variant="outline" className="text-[10px] shrink-0">
                {scan.store === "google_play" ? "Google Play" : "App Store"}
              </Badge>
              {scan.mode === "idea" ? (
                <>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    Idea
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {scan.ideaText
                      ? scan.ideaText.length > 60
                        ? scan.ideaText.slice(0, 60) + "..."
                        : scan.ideaText
                      : "Idea Validation"}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium truncate">
                  {getCategoryLabel(scan.store, scan.category)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isActive && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {scan.totalOpportunities} opps
            </span>
            <Badge variant={config.variant} className="text-[10px]">
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {formattedDate}
            </span>
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-3">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading opportunities...
            </div>
          ) : displayOpps.length > 0 ? (
            <>
              <OpportunityGrid
                opportunities={displayOpps}
                onSelect={(opp) => {
                  setSelectedOpportunity(opp);
                  setModalOpen(true);
                }}
              />
              <OpportunityDetailModal
                opportunity={selectedOpportunity}
                allOpportunities={displayOpps}
                open={modalOpen}
                onOpenChange={(open) => {
                  setModalOpen(open);
                  if (!open) setSelectedOpportunity(null);
                }}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {isActive
                ? "Waiting for opportunities..."
                : "No opportunities found in this scan."}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
