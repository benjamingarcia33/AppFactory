"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ImpactAnalysis, IdeaEvolutionSSEEvent, IdeaEvolution } from "@/lib/types";

interface UseIdeaEvolutionReturn {
  status: "idle" | "analyzing" | "generating" | "complete" | "error";
  impactAnalysis: ImpactAnalysis | null;
  epContent: string | null;
  evolutionId: string | null;
  error: string | null;
  completedEvolution: IdeaEvolution | null;
  submitIdea: (ideaText: string) => void;
  cancel: () => void;
  reset: () => void;
}

export function useIdeaEvolution(analysisId: string | null): UseIdeaEvolutionReturn {
  // State
  const [status, setStatus] = useState<UseIdeaEvolutionReturn["status"]>("idle");
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [epContent, setEpContent] = useState<string | null>(null);
  const [evolutionId, setEvolutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedEvolution, setCompletedEvolution] = useState<IdeaEvolution | null>(null);

  // Ref for EventSource
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Submit idea - opens EventSource to /api/idea-evolution/stream
  const submitIdea = useCallback((ideaText: string) => {
    if (!analysisId) return;

    // Clean up any existing connection
    cleanup();

    // Reset state
    setStatus("analyzing");
    setImpactAnalysis(null);
    setEpContent(null);
    setEvolutionId(null);
    setError(null);
    setCompletedEvolution(null);

    // Open SSE connection
    const url = `/api/idea-evolution/stream?analysisId=${encodeURIComponent(analysisId)}&idea=${encodeURIComponent(ideaText)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as IdeaEvolutionSSEEvent;

        switch (data.type) {
          case "idea_started":
            setEvolutionId(data.evolutionId);
            setStatus("analyzing");
            break;
          case "impact_analysis_complete":
            setImpactAnalysis(data.impactAnalysis);
            setStatus("generating");
            break;
          case "ep_generation_started":
            setStatus("generating");
            break;
          case "ep_generated":
            setEpContent(data.epContent);
            break;
          case "idea_complete":
            setCompletedEvolution(data.evolution);
            setStatus("complete");
            cleanup();
            break;
          case "idea_error":
            setError(data.message);
            setStatus("error");
            cleanup();
            break;
          case "idea_cancelled":
            setStatus("idle");
            cleanup();
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    es.onerror = () => {
      // Only set error if we haven't completed
      if (status !== "complete") {
        setError("Connection lost");
        setStatus("error");
      }
      cleanup();
    };
  }, [analysisId, cleanup, status]);

  // Cancel - close EventSource + POST to cancel endpoint
  const cancel = useCallback(async () => {
    cleanup();
    if (evolutionId) {
      try {
        await fetch("/api/idea-evolution/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evolutionId }),
        });
      } catch {
        // Cancel is best-effort
      }
    }
    setStatus("idle");
  }, [cleanup, evolutionId]);

  // Reset - clear all state
  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setImpactAnalysis(null);
    setEpContent(null);
    setEvolutionId(null);
    setError(null);
    setCompletedEvolution(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    impactAnalysis,
    epContent,
    evolutionId,
    error,
    completedEvolution,
    submitIdea,
    cancel,
    reset,
  };
}
