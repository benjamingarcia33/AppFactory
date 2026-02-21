"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { OpportunitySelector } from "@/components/architect/opportunity-selector";
import { AnalysisHistory } from "@/components/architect/analysis-history";
import {
  getAllAnalysesWithContext,
  getAnalysisByOpportunity,
  getDocumentsByAnalysis,
  cleanupStaleAnalyses,
} from "@/actions/architect-actions";
import type {
  AnalysisStep,
  AnalysisDocument,
  ArchitectSSEEvent,
  AnalysisWithContext,
} from "@/lib/types";

const DEFAULT_STEPS: AnalysisStep[] = [
  { step: 1, title: "AI Expectations Analysis", status: "pending", content: "" },
  { step: 2, title: "Strategic Planning", status: "pending", content: "" },
  { step: 3, title: "AI Approach & Architecture", status: "pending", content: "" },
  { step: 4, title: "Development & Tinkering Plan", status: "pending", content: "" },
];

function ArchitectContent() {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get("id");

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(
    preSelectedId
  );
  const [allAnalyses, setAllAnalyses] = useState<AnalysisWithContext[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeSteps, setActiveSteps] = useState<AnalysisStep[]>(DEFAULT_STEPS);
  const [activeDocuments, setActiveDocuments] = useState<AnalysisDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const autoStartTriggered = useRef(false);

  // Clean up stale "running" analyses then load all
  useEffect(() => {
    cleanupStaleAnalyses().then(() => getAllAnalysesWithContext()).then(setAllAnalyses);
  }, []);

  // Close any active SSE connection
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectEventSource = useCallback(
    (opportunityId: string) => {
      closeEventSource();

      const url = `/api/architect/stream?opportunityId=${encodeURIComponent(opportunityId)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: ArchitectSSEEvent = JSON.parse(event.data);

          switch (data.type) {
            case "analysis_started":
              setActiveAnalysisId(data.analysisId);
              // Add placeholder to the analyses list
              setAllAnalyses((prev) => {
                const exists = prev.some((a) => a.id === data.analysisId);
                if (exists) return prev;
                const placeholder: AnalysisWithContext = {
                  id: data.analysisId,
                  opportunityId: opportunityId,
                  status: "running",
                  steps: DEFAULT_STEPS.map((s) => ({ ...s })),
                  createdAt: new Date().toISOString(),
                  completedAt: null,
                  opportunityTitle: "Loading...",
                  opportunityIcon: "",
                  documents: [],
                };
                return [placeholder, ...prev];
              });
              break;

            case "progress":
              setCurrentStep(data.step);
              setActiveSteps((prev) =>
                prev.map((s) =>
                  s.step === data.step
                    ? {
                        ...s,
                        status: data.status,
                        content: data.content ?? s.content,
                      }
                    : s
                )
              );
              break;

            case "document":
              setActiveDocuments((prev) => [...prev, data.document]);
              break;

            case "complete": {
              // Refresh analyses to get final state with opportunity context
              getAllAnalysesWithContext().then((fresh) => {
                setAllAnalyses(fresh);
              });
              setIsAnalyzing(false);
              setActiveAnalysisId(null);
              eventSource.close();
              eventSourceRef.current = null;
              break;
            }

            case "cancelled": {
              setAllAnalyses((prev) =>
                prev.map((a) =>
                  a.id === data.analysisId
                    ? { ...a, status: "cancelled" as const, completedAt: new Date().toISOString() }
                    : a
                )
              );
              setIsAnalyzing(false);
              setActiveAnalysisId(null);
              eventSource.close();
              eventSourceRef.current = null;
              break;
            }

            case "error":
              console.error("Architect error:", data.message);
              setError(data.message);
              setIsAnalyzing(false);
              setActiveAnalysisId(null);
              eventSource.close();
              eventSourceRef.current = null;
              break;
          }
        } catch (e) {
          console.error("Failed to parse SSE event:", e);
        }
      };

      // Don't reconnect on error — reconnecting triggers a duplicate pipeline run.
      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        setError(
          "Connection to the analysis stream was lost. The analysis may still be running on the server. Refresh the page to check for results, or re-run the analysis."
        );
        setIsAnalyzing(false);
        setActiveAnalysisId(null);
      };
    },
    [closeEventSource]
  );

  // Cancel the active server-side pipeline (fire-and-forget)
  const cancelActivePipeline = useCallback(() => {
    if (activeAnalysisId) {
      fetch("/api/architect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: activeAnalysisId }),
      }).catch(() => {});
    }
  }, [activeAnalysisId]);

  // Start a new analysis for the given opportunity
  const startAnalysis = useCallback(
    (opportunityId: string) => {
      // Cancel any running pipeline before starting a new one
      cancelActivePipeline();
      setError(null);
      setActiveSteps(DEFAULT_STEPS.map((s) => ({ ...s })));
      setActiveDocuments([]);
      setIsAnalyzing(true);
      setCurrentStep(1);
      connectEventSource(opportunityId);
    },
    [connectEventSource, cancelActivePipeline]
  );

  // Load existing completed analysis, or auto-start if coming from Scout
  useEffect(() => {
    if (!preSelectedId || autoStartTriggered.current) return;
    autoStartTriggered.current = true;

    async function init() {
      try {
        const analysis = await getAnalysisByOpportunity(preSelectedId!);

        if (analysis && analysis.status === "completed") {
          // The analysis should already be in allAnalyses from the mount load.
          // Just make sure it's expanded via scroll or similar (no extra action needed).
        } else {
          // No completed analysis — auto-start
          startAnalysis(preSelectedId!);
        }
      } catch (err) {
        console.error("Failed to load existing analysis:", err);
        startAnalysis(preSelectedId!);
      }
    }

    init();
  }, [preSelectedId, startAnalysis]);

  // When user selects a different opportunity from the dropdown
  const handleSelect = useCallback(
    async (opportunityId: string) => {
      if (opportunityId === selectedOpportunityId) return;
      // Cancel any running pipeline when navigating to a different opportunity
      cancelActivePipeline();
      closeEventSource();
      setSelectedOpportunityId(opportunityId);
      setError(null);
      setIsAnalyzing(false);
      setActiveAnalysisId(null);
    },
    [selectedOpportunityId, closeEventSource, cancelActivePipeline]
  );

  // Handle "Start Analysis" button click from the selector
  const handleStartAnalysis = useCallback(() => {
    if (!selectedOpportunityId) return;
    startAnalysis(selectedOpportunityId);
  }, [selectedOpportunityId, startAnalysis]);

  // Handle cancel
  const handleCancel = useCallback(async () => {
    if (!activeAnalysisId) return;
    // Optimistic UI update
    setIsAnalyzing(false);
    setAllAnalyses((prev) =>
      prev.map((a) =>
        a.id === activeAnalysisId
          ? { ...a, status: "cancelled" as const, completedAt: new Date().toISOString() }
          : a
      )
    );
    closeEventSource();
    try {
      await fetch("/api/architect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: activeAnalysisId }),
      });
    } catch (err) {
      console.error("Failed to send cancel request:", err);
    }
    setActiveAnalysisId(null);
  }, [activeAnalysisId, closeEventSource]);

  // Check if the selected opportunity has any completed analyses
  const hasCompleted = allAnalyses.some(
    (a) =>
      a.opportunityId === selectedOpportunityId && a.status === "completed"
  );

  // Cleanup on unmount — cancel server pipeline + close SSE
  useEffect(() => {
    return () => {
      cancelActivePipeline();
      closeEventSource();
    };
  }, [closeEventSource, cancelActivePipeline]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Architect"
        description="Deep analysis and strategic planning for app opportunities. Generate PRDs and strategy documents ready for development."
      />

      <OpportunitySelector
        onSelect={handleSelect}
        onStartAnalysis={handleStartAnalysis}
        onCancel={handleCancel}
        selectedId={selectedOpportunityId}
        isAnalyzing={isAnalyzing}
        hasCompleted={hasCompleted}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Analysis Error</p>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          {selectedOpportunityId && !isAnalyzing && (
            <button
              onClick={handleStartAnalysis}
              className="mt-2 text-sm underline text-destructive hover:text-destructive/80"
            >
              Try again
            </button>
          )}
        </div>
      )}

      <AnalysisHistory
        analyses={allAnalyses}
        activeAnalysisId={activeAnalysisId}
        activeSteps={activeSteps}
        activeDocuments={activeDocuments}
        currentStep={currentStep}
      />
    </div>
  );
}

export default function ArchitectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <ArchitectContent />
    </Suspense>
  );
}
