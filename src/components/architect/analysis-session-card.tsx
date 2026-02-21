"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalysisProgress } from "./analysis-progress";
import { DocumentTabs } from "./document-tabs";
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
};

export function AnalysisSessionCard({
  analysis,
  isActive,
  activeSteps,
  activeDocuments,
  currentStep,
  defaultExpanded,
}: AnalysisSessionCardProps) {
  const [expanded, setExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (isActive) return true;
    if (analysis.status === "completed" && analysis.documents.length > 0) return true;
    return false;
  });

  const config = statusConfig[analysis.status];
  const steps = isActive && activeSteps ? activeSteps : analysis.steps;
  const documents =
    isActive && activeDocuments ? activeDocuments : analysis.documents;
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

  return (
    <Card
      className={
        isActive ? "border-primary/50 shadow-md ring-1 ring-primary/20" : ""
      }
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
        <CardContent className="pt-3 space-y-6">
          {documents.length > 0 && <DocumentTabs documents={documents} />}

          {steps.length > 0 && (
            <AnalysisProgress
              steps={steps}
              currentStep={displayCurrentStep}
            />
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
