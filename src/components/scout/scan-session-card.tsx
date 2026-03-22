"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OpportunityGrid } from "./opportunity-grid";
import { OpportunityDetailModal } from "./opportunity-detail-modal";
import { MasterIdeaCard } from "./master-idea-card";
import { BlueOceanCard } from "./blue-ocean-card";
import { ScoutExecutiveSummary } from "./scout-executive-summary";
import { getOpportunitiesByScan } from "@/actions/scout-actions";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { STATUS_COLORS } from "@/lib/ui-constants";
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
  { label: string }
> = {
  running: { label: "Running" },
  completed: { label: "Completed" },
  failed: { label: "Failed" },
  cancelled: { label: "Cancelled" },
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
      className={`rounded-xl border bg-surface-0 ${
        isActive
          ? "border-primary/30 shadow-lg shadow-primary/5"
          : "border-border"
      }`}
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
              <Badge variant="outline" className="text-[11px] shrink-0">
                {scan.store === "google_play" ? "Google Play" : "App Store"}
              </Badge>
              {scan.mode === "discovery" ? (
                <>
                  <Badge variant="secondary" className="text-[11px] shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Discovery
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {scan.masterIdea?.name ??
                      (scan.focusText
                        ? `${getCategoryLabel(scan.store, scan.category)}: ${scan.focusText}`
                        : scan.discoveryAngle
                          ? `${getCategoryLabel(scan.store, scan.category)}: ${scan.discoveryAngle.length > 50 ? scan.discoveryAngle.slice(0, 50) + "..." : scan.discoveryAngle}`
                          : `${getCategoryLabel(scan.store, scan.category)} Discovery`)}
                  </span>
                </>
              ) : scan.mode === "synthesis" ? (
                <>
                  <Badge variant="secondary" className="text-[11px] shrink-0 bg-primary/10 text-primary border-primary/20">
                    Synthesis
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {scan.masterIdea?.name ??
                      (scan.ideaText
                        ? scan.ideaText.length > 60
                          ? scan.ideaText.slice(0, 60) + "..."
                          : scan.ideaText
                        : "Synthesis Scan")}
                  </span>
                </>
              ) : scan.mode === "idea" ? (
                <>
                  <Badge variant="secondary" className="text-[11px] shrink-0">
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
            <Badge variant="outline" className={`text-[11px] ${STATUS_COLORS[scan.status] ?? ""}`}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {formattedDate}
            </span>
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-3 space-y-4">
          {/* Master Idea for past synthesis scans */}
          {!isActive && scan.masterIdea && (
            <>
              <ScoutExecutiveSummary masterIdea={scan.masterIdea} scanId={scan.id} />
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  <span>View Full Analysis</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <MasterIdeaCard
                    masterIdea={scan.masterIdea}
                    scanId={scan.id}
                    opportunities={opportunities ?? []}
                    hideExecutiveSummary
                  />
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* Blue Ocean for past scans */}
          {!isActive && scan.blueOcean && (
            <BlueOceanCard blueOcean={scan.blueOcean} scanId={scan.id} />
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading opportunities...
            </div>
          ) : displayOpps.length > 0 ? (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium hover:text-primary transition-colors group">
                <span>{displayOpps.length} competitors analyzed</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <OpportunityGrid
                  opportunities={displayOpps}
                  onSelect={(opp) => {
                    setSelectedOpportunity(opp);
                    setModalOpen(true);
                  }}
                  label={scan.mode === "synthesis" || scan.mode === "discovery" ? "competitors analyzed" : undefined}
                />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {isActive
                ? "Waiting for opportunities..."
                : "No opportunities found in this scan."}
            </p>
          )}

          {/* Modal for viewing opportunity details */}
          <OpportunityDetailModal
            opportunity={selectedOpportunity}
            allOpportunities={displayOpps}
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) setSelectedOpportunity(null);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
}
