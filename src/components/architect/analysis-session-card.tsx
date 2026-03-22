"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { AnalysisProgress } from "./analysis-progress";
import { DocumentTabs, normalizeVisualStrategy } from "./document-tabs";
import { ArchitectMetricsDashboard } from "./architect-metrics-dashboard";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  AnalysisStep,
  AnalysisDocument,
  AnalysisWithContext,
} from "@/lib/types";

interface AnalysisSessionCardProps {
  analysis: AnalysisWithContext;
  isActive?: boolean;
  /** Live-updating steps for the active analysis */
  activeSteps?: AnalysisStep[];
  /** Live-updating documents for the active analysis */
  activeDocuments?: AnalysisDocument[];
  currentStep?: number;
  defaultExpanded?: boolean;
  connectionLost?: boolean;
  isGeneratingDocs?: boolean;
}

const statusConfig: Record<
  AnalysisWithContext["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
  completed_with_warnings: { label: "Completed", variant: "secondary" },
};

export function AnalysisSessionCard({
  analysis,
  isActive,
  activeSteps,
  activeDocuments,
  currentStep,
  defaultExpanded,
  connectionLost,
  isGeneratingDocs,
}: AnalysisSessionCardProps) {
  const [expanded, setExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (isActive) return true;
    if ((analysis.status === "completed" || analysis.status === "completed_with_warnings") && analysis.documents.length > 0) return true;
    return false;
  });

  const config = statusConfig[analysis.status];
  const steps = isActive && activeSteps ? activeSteps : analysis.steps;
  const documents =
    isActive && activeDocuments ? activeDocuments : analysis.documents;
  const executionPrompts = documents.filter((d) =>
    d.type.startsWith("execution_prompt_")
  );
  const nonEpDocuments = documents.filter(
    (d) => !d.type.startsWith("execution_prompt_")
  );
  const lastCompleted = [...steps]
    .reverse()
    .find((s) => s.status === "completed");
  const displayCurrentStep = currentStep ?? (lastCompleted?.step ?? 0);

  const date = new Date(analysis.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Parse visual strategy for metrics dashboard
  const visualData = useMemo(() => {
    const stratDoc = documents.find((d) => d.type === "strategic_analysis");
    if (!stratDoc) return null;
    try {
      const parsed = JSON.parse(stratDoc.content);
      if (parsed && typeof parsed === "object") return normalizeVisualStrategy(parsed);
      return null;
    } catch {
      return null;
    }
  }, [documents]);

  return (
    <Card
      className={cn(
        "rounded-xl border border-border bg-surface-0",
        isActive && "border-primary/30 shadow-lg shadow-primary/5"
      )}
    >
      <CardHeader className="pb-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {analysis.opportunityIcon && (
              <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border">
                <Image
                  src={analysis.opportunityIcon}
                  alt={analysis.opportunityTitle}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <span className="text-sm font-medium truncate">
              {analysis.opportunityTitle}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isActive && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
            <Badge variant={config.variant} className="text-[11px]">
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {formattedDate}
            </span>
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-3 space-y-6 overflow-hidden">
          {/* Status banners */}
          {connectionLost && isActive && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm font-medium text-yellow-400">
                Connection lost — progress updating automatically
              </p>
              <p className="text-sm text-yellow-400/80 mt-1">
                The live stream was interrupted, but the analysis is still running on the server.
              </p>
            </div>
          )}

          {isGeneratingDocs && isActive && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                Generating documents...
              </p>
              <p className="text-sm text-primary/80 mt-1">
                All analysis steps completed. Now generating PRD, Visual Strategy, and Execution Prompts.
              </p>
            </div>
          )}

          {/* Metrics dashboard at top for completed */}
          {!isActive && visualData && (
            <ArchitectMetricsDashboard visualStrategy={visualData} />
          )}

          {/* Analysis Progress - at top when active */}
          {isActive && steps.length > 0 && (
            <AnalysisProgress
              steps={steps}
              currentStep={displayCurrentStep}
            />
          )}

          {/* Documents (includes EPs now) */}
          {(nonEpDocuments.length > 0 || executionPrompts.length > 0) && (
            <DocumentTabs documents={nonEpDocuments} executionPrompts={executionPrompts} />
          )}

          {/* Pipeline details - collapsible when completed */}
          {!isActive && steps.length > 0 && (
            <>
              <Separator />
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                  Pipeline Details ({steps.filter((s) => s.status === "completed").length}/{steps.length} steps)
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <AnalysisProgress
                    steps={steps}
                    currentStep={displayCurrentStep}
                  />
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {!isActive && steps.length === 0 && documents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available for this analysis.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
