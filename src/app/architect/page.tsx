"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { OpportunitySelector } from "@/components/architect/opportunity-selector";
import { AnalysisHistory } from "@/components/architect/analysis-history";
import {
  getAllAnalysesWithContext,
  getAnalysisByOpportunity,
  getAnalysisByScan,
  getDocumentsByAnalysis,
  getAnalysisProgress,
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
  { step: 5, title: "Pattern Matching & Execution Planning", status: "pending", content: "" },
];

const POLL_INTERVAL_MS = 5_000;

function ArchitectContent() {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get("id");
  const preSelectedScanId = searchParams.get("scanId");

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(
    preSelectedId
  );
  const [selectedScanId, setSelectedScanId] = useState<string | null>(
    preSelectedScanId
  );
  const [allAnalyses, setAllAnalyses] = useState<AnalysisWithContext[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeSteps, setActiveSteps] = useState<AnalysisStep[]>(DEFAULT_STEPS);
  const [activeDocuments, setActiveDocuments] = useState<AnalysisDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartTriggered = useRef(false);

  // --- Polling ---
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (analysisId: string) => {
      stopPolling();
      pollIntervalRef.current = setInterval(async () => {
        try {
          const progress = await getAnalysisProgress(analysisId);
          if (!progress) return;

          const { status, steps } = progress;

          // Update active steps from DB
          setActiveSteps(steps);

          // Derive current step from DB data
          const runningStep = steps.find((s) => s.status === "running");
          const lastCompleted = [...steps]
            .reverse()
            .find((s) => s.status === "completed");
          if (runningStep) {
            setCurrentStep(runningStep.step);
          } else if (lastCompleted) {
            setCurrentStep(lastCompleted.step);
          }

          // Terminal states: fetch full data and stop
          if (status === "completed" || status === "completed_with_warnings" || status === "failed" || status === "cancelled") {
            stopPolling();
            setConnectionLost(false);
            const fresh = await getAllAnalysesWithContext();
            setAllAnalyses(fresh);

            if (status === "completed" || status === "completed_with_warnings") {
              const docs = await getDocumentsByAnalysis(analysisId);
              setActiveDocuments(docs);
            }

            setIsAnalyzing(false);
            setActiveAnalysisId(null);
          }
        } catch (err) {
          console.warn("[architect] Polling failed:", err);
          // Keep polling — transient network error
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  // Load analyses immediately; cleanup stale ones in the background
  useEffect(() => {
    getAllAnalysesWithContext().then((loaded) => {
      setAllAnalyses(loaded);

      // Detect any running analysis and resume tracking via polling
      const running = loaded.find((a) => a.status === "running");
      if (running && !eventSourceRef.current) {
        setIsAnalyzing(true);
        setActiveAnalysisId(running.id);
        setActiveSteps(running.steps.length > 0 ? running.steps : DEFAULT_STEPS.map((s) => ({ ...s })));
        const runningStep = running.steps.find((s) => s.status === "running");
        const lastCompleted = [...running.steps]
          .reverse()
          .find((s) => s.status === "completed");
        setCurrentStep(runningStep?.step ?? lastCompleted?.step ?? 1);
        setConnectionLost(true);
        startPolling(running.id);
      }
    });
    cleanupStaleAnalyses().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close any active SSE connection
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectEventSource = useCallback(
    (url: string, trackId?: string) => {
      closeEventSource();
      stopPolling();
      setConnectionLost(false);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: ArchitectSSEEvent = JSON.parse(event.data);

          switch (data.type) {
            case "analysis_started":
              setActiveAnalysisId(data.analysisId);
              setAllAnalyses((prev) => {
                const exists = prev.some((a) => a.id === data.analysisId);
                if (exists) return prev;
                const placeholder: AnalysisWithContext = {
                  id: data.analysisId,
                  opportunityId: selectedOpportunityId,
                  scanId: selectedScanId,
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
              setCurrentStep(prev => Math.max(prev, data.step));
              if (data.step === 6 && data.status === "running") {
                setIsGeneratingDocs(true);
              }
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
              stopPolling();
              setConnectionLost(false);
              setIsGeneratingDocs(false);
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
              stopPolling();
              setConnectionLost(false);
              setIsGeneratingDocs(false);
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

            case "step_failed":
              setActiveSteps((prev) =>
                prev.map((s) =>
                  s.step === data.step
                    ? { ...s, status: "failed" as const, content: data.message }
                    : s
                )
              );
              break;

            case "error":
              console.error("Architect error:", data.message);
              stopPolling();
              setConnectionLost(false);
              setIsGeneratingDocs(false);
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

      eventSource.onerror = () => {
        // SSE dropped — close the dead connection but keep analysis state alive
        eventSource.close();
        eventSourceRef.current = null;
        setConnectionLost(true);

        // Start polling to track progress from the DB
        setActiveAnalysisId((currentId) => {
          if (currentId) {
            startPolling(currentId);
          }
          return currentId;
        });
      };
    },
    [closeEventSource, stopPolling, startPolling, selectedOpportunityId, selectedScanId]
  );

  // Cancel the active server-side pipeline
  const cancelActivePipeline = useCallback(() => {
    if (activeAnalysisId) {
      fetch("/api/architect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: activeAnalysisId }),
      }).catch(() => {});
    }
  }, [activeAnalysisId]);

  // Start analysis for opportunity or scan
  const startAnalysis = useCallback(
    (params: { opportunityId?: string; scanId?: string }) => {
      cancelActivePipeline();
      setError(null);
      setConnectionLost(false);
      setActiveSteps(DEFAULT_STEPS.map((s) => ({ ...s })));
      setActiveDocuments([]);
      setIsGeneratingDocs(false);
      setIsAnalyzing(true);
      setCurrentStep(1);

      if (params.scanId) {
        connectEventSource(`/api/architect/stream?scanId=${encodeURIComponent(params.scanId)}`);
      } else if (params.opportunityId) {
        connectEventSource(`/api/architect/stream?opportunityId=${encodeURIComponent(params.opportunityId)}`);
      }
    },
    [connectEventSource, cancelActivePipeline]
  );

  // Auto-start ONLY when there is NO analysis at all for the pre-selected item.
  // If any analysis exists (completed, failed, cancelled, running), do NOT restart.
  // The user must explicitly click "Start Analysis" to run a new one.
  useEffect(() => {
    if (autoStartTriggered.current) return;
    if (!preSelectedId && !preSelectedScanId) return;
    autoStartTriggered.current = true;

    async function init() {
      try {
        if (preSelectedScanId) {
          const analysis = await getAnalysisByScan(preSelectedScanId);
          if (!analysis) {
            startAnalysis({ scanId: preSelectedScanId });
          }
        } else if (preSelectedId) {
          const analysis = await getAnalysisByOpportunity(preSelectedId);
          if (!analysis) {
            startAnalysis({ opportunityId: preSelectedId });
          }
        }
      } catch (err) {
        console.error("Failed to load existing analysis:", err);
        // Don't auto-start on error — user can manually start
      }
    }

    init();
  }, [preSelectedId, preSelectedScanId, startAnalysis]);

  // When user selects from the dropdown
  const handleSelect = useCallback(
    async (id: string, type: "opportunity" | "masterIdea") => {
      cancelActivePipeline();
      closeEventSource();
      stopPolling();
      setError(null);
      setConnectionLost(false);
      setIsAnalyzing(false);
      setActiveAnalysisId(null);
      if (type === "masterIdea") {
        setSelectedScanId(id);
        setSelectedOpportunityId(null);
      } else {
        setSelectedOpportunityId(id);
        setSelectedScanId(null);
      }
    },
    [closeEventSource, stopPolling, cancelActivePipeline]
  );

  // Handle "Start Analysis" button click
  const handleStartAnalysis = useCallback(() => {
    if (selectedScanId) {
      startAnalysis({ scanId: selectedScanId });
    } else if (selectedOpportunityId) {
      startAnalysis({ opportunityId: selectedOpportunityId });
    }
  }, [selectedOpportunityId, selectedScanId, startAnalysis]);

  // Handle cancel
  const handleCancel = useCallback(async () => {
    if (!activeAnalysisId) return;
    stopPolling();
    setConnectionLost(false);
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
  }, [activeAnalysisId, closeEventSource, stopPolling]);

  // Check if the selected item has any completed analyses
  const hasCompleted = allAnalyses.some(
    (a) =>
      (a.opportunityId === selectedOpportunityId || a.scanId === selectedScanId) &&
      (a.status === "completed" || a.status === "completed_with_warnings")
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelActivePipeline();
      closeEventSource();
      stopPolling();
    };
  }, [closeEventSource, stopPolling, cancelActivePipeline]);

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
        selectedScanId={selectedScanId}
        isAnalyzing={isAnalyzing}
        hasCompleted={hasCompleted}
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Analysis Error</p>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          {(selectedOpportunityId || selectedScanId) && !isAnalyzing && (
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
        connectionLost={connectionLost}
        isGeneratingDocs={isGeneratingDocs}
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
