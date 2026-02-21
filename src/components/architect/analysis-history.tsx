"use client";

import { AnalysisSessionCard } from "./analysis-session-card";
import type {
  AnalysisStep,
  AnalysisDocument,
  AnalysisWithContext,
} from "@/lib/types";

interface AnalysisHistoryProps {
  analyses: AnalysisWithContext[];
  activeAnalysisId: string | null;
  activeSteps?: AnalysisStep[];
  activeDocuments?: AnalysisDocument[];
  currentStep?: number;
}

export function AnalysisHistory({
  analyses,
  activeAnalysisId,
  activeSteps,
  activeDocuments,
  currentStep,
}: AnalysisHistoryProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No analyses yet</p>
        <p className="text-sm mt-1">
          Select an opportunity above and start an analysis to generate PRDs
          and strategic documents.
        </p>
      </div>
    );
  }

  // Active analysis first, rest sorted newest-first (already from DB)
  const activeAnalysis = activeAnalysisId
    ? analyses.find((a) => a.id === activeAnalysisId)
    : null;
  const pastAnalyses = analyses.filter((a) => a.id !== activeAnalysisId);

  return (
    <div className="space-y-3">
      {activeAnalysis && (
        <AnalysisSessionCard
          key={activeAnalysis.id}
          analysis={activeAnalysis}
          isActive
          activeSteps={activeSteps}
          activeDocuments={activeDocuments}
          currentStep={currentStep}
          defaultExpanded
        />
      )}
      {pastAnalyses.map((analysis) => (
        <AnalysisSessionCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  );
}
