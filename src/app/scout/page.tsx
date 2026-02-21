"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ScanControls } from "@/components/scout/scan-controls";
import { ScanProgress } from "@/components/scout/scan-progress";
import { ScanHistory } from "@/components/scout/scan-history";
import { BlueOceanCard } from "@/components/scout/blue-ocean-card";
import { getScans } from "@/actions/scout-actions";
import type {
  AppStore,
  Scan,
  Opportunity,
  ScoutSSEEvent,
  ScoutFilterSettings,
  GapAnalysis,
  BlueOceanResult,
} from "@/lib/types";

export default function ScoutPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [activeOpportunities, setActiveOpportunities] = useState<Opportunity[]>(
    []
  );
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({
    stage: "",
    message: "",
    progress: 0,
  });
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [blueOcean, setBlueOcean] = useState<BlueOceanResult | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scanParamsRef = useRef<{
    store: AppStore;
    category: string;
    filters: ScoutFilterSettings;
    mode?: "category" | "idea";
    ideaText?: string;
  } | null>(null);

  // Load existing scans on mount
  useEffect(() => {
    getScans().then(setScans);
  }, []);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const connectEventSource = useCallback(
    (url: string) => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data: ScoutSSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case "scan_started":
            setActiveScanId(data.scanId);
            // Add a placeholder scan to the list
            setScans((prev) => {
              const exists = prev.some((s) => s.id === data.scanId);
              if (exists) return prev;
              const newScan: Scan = {
                id: data.scanId,
                store: scanParamsRef.current?.store ?? "google_play",
                category: scanParamsRef.current?.category ?? "",
                status: "running",
                totalAppsScraped: 0,
                totalOpportunities: 0,
                createdAt: new Date().toISOString(),
                completedAt: null,
                mode: scanParamsRef.current?.mode ?? "category",
                ideaText: scanParamsRef.current?.ideaText ?? null,
              };
              return [newScan, ...prev];
            });
            break;

          case "progress":
            setProgress({
              stage: data.stage,
              message: data.message,
              progress: data.progress,
            });
            break;

          case "app_found":
            break;

          case "opportunity":
            setActiveOpportunities((prev) => {
              const exists = prev.some(
                (o) => o.id === data.opportunity.id
              );
              if (exists) return prev;
              return [...prev, data.opportunity];
            });
            break;

          case "idea_queries_generated":
            setProgress((prev) => ({
              ...prev,
              stage: "queries_generated",
              message: `Generated ${data.queries.length} search queries: ${data.queries.slice(0, 3).join(", ")}${data.queries.length > 3 ? "..." : ""}`,
            }));
            break;

          case "idea_searching":
            setProgress((prev) => ({
              ...prev,
              stage: "searching",
              message: `Searching "${data.query}" (${data.queryIndex + 1}/${data.totalQueries})...`,
            }));
            break;

          case "gap_analysis":
            setGapAnalysis(data.gapAnalysis);
            // Update existing opportunities with gap analysis
            setActiveOpportunities((prev) =>
              prev.map((opp) => ({
                ...opp,
                gapAnalysis: data.gapAnalysis,
              }))
            );
            setProgress((prev) => ({
              ...prev,
              stage: "gap_analysis",
              message: "Competitive gap analysis complete.",
            }));
            break;

          case "blue_ocean":
            setBlueOcean(data.blueOcean);
            // Update existing opportunities with blue ocean
            setActiveOpportunities((prev) =>
              prev.map((opp) => ({
                ...opp,
                blueOcean: data.blueOcean,
              }))
            );
            setProgress((prev) => ({
              ...prev,
              stage: "blue_ocean",
              message: data.blueOcean.isBlueOcean
                ? "Blue ocean opportunity detected!"
                : "Market assessment complete.",
            }));
            break;

          case "complete":
            // Update the scan in the list
            setScans((prev) =>
              prev.map((s) =>
                s.id === data.scanId
                  ? {
                      ...s,
                      status: "completed" as const,
                      totalOpportunities: data.totalOpportunities,
                      completedAt: new Date().toISOString(),
                    }
                  : s
              )
            );
            setIsScanning(false);
            setActiveScanId(null);
            setActiveOpportunities([]);
            setProgress({
              stage: "complete",
              message: `Scan complete. Found ${data.totalOpportunities} opportunities.`,
              progress: 100,
            });
            eventSource.close();
            eventSourceRef.current = null;
            break;

          case "cancelled":
            setScans((prev) =>
              prev.map((s) =>
                s.id === data.scanId
                  ? {
                      ...s,
                      status: "cancelled" as const,
                      completedAt: new Date().toISOString(),
                    }
                  : s
              )
            );
            setIsScanning(false);
            setActiveScanId(null);
            setActiveOpportunities([]);
            setGapAnalysis(null);
            setBlueOcean(null);
            setProgress({
              stage: "cancelled",
              message: "Scan was cancelled.",
              progress: 0,
            });
            eventSource.close();
            eventSourceRef.current = null;
            break;

          case "error":
            setScans((prev) =>
              prev.map((s) =>
                s.id === activeScanId
                  ? {
                      ...s,
                      status: "failed" as const,
                      completedAt: new Date().toISOString(),
                    }
                  : s
              )
            );
            setIsScanning(false);
            setActiveScanId(null);
            setActiveOpportunities([]);
            setGapAnalysis(null);
            setBlueOcean(null);
            setProgress({
              stage: "error",
              message: `Error: ${data.message}`,
              progress: 0,
            });
            eventSource.close();
            eventSourceRef.current = null;
            break;
        }
      };

      // Don't reconnect on error — reconnecting hits /api/scout/stream which
      // starts a BRAND NEW pipeline run, causing duplicate scans.
      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        setIsScanning(false);
        setActiveScanId(null);
        setProgress({
          stage: "error",
          message:
            "Connection to the scan stream was lost. The scan may still be running on the server. Refresh the page to check for results.",
          progress: 0,
        });
      };
    },
    // activeScanId is read inside the error handler but we capture it via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleStartScan = useCallback(
    (store: AppStore, category: string, filters: ScoutFilterSettings) => {
      setIsScanning(true);
      setActiveOpportunities([]);
      setGapAnalysis(null);
      setBlueOcean(null);
      setProgress({
        stage: "starting",
        message: "Initializing scan...",
        progress: 0,
      });
      scanParamsRef.current = { store, category, filters, mode: "category" };

      const params = new URLSearchParams({ store, category, mode: "category" });
      if (filters) {
        params.set("minInstalls", String(filters.minInstalls));
        params.set("maxRating", String(filters.maxRating));
        params.set("minRatings", String(filters.minRatings));
      }
      connectEventSource(`/api/scout/stream?${params.toString()}`);
    },
    [connectEventSource]
  );

  const handleStartIdeaScan = useCallback(
    (store: AppStore, ideaText: string, filters: ScoutFilterSettings) => {
      setIsScanning(true);
      setActiveOpportunities([]);
      setGapAnalysis(null);
      setBlueOcean(null);
      setProgress({
        stage: "starting",
        message: "Analyzing your app idea...",
        progress: 0,
      });
      scanParamsRef.current = { store, category: "idea-validation", filters, mode: "idea", ideaText };

      const params = new URLSearchParams({
        store,
        mode: "idea",
        ideaText,
      });
      params.set("minInstalls", String(filters.minInstalls));
      params.set("maxRating", String(filters.maxRating));
      params.set("minRatings", String(filters.minRatings));
      connectEventSource(`/api/scout/stream?${params.toString()}`);
    },
    [connectEventSource]
  );

  const handleCancel = useCallback(async () => {
    if (!activeScanId) return;
    // Optimistic UI update — don't wait for SSE event
    setIsScanning(false);
    setScans((prev) =>
      prev.map((s) =>
        s.id === activeScanId
          ? { ...s, status: "cancelled" as const, completedAt: new Date().toISOString() }
          : s
      )
    );
    setProgress({
      stage: "cancelled",
      message: "Scan was cancelled.",
      progress: 0,
    });
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    try {
      await fetch("/api/scout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: activeScanId }),
      });
    } catch (err) {
      console.error("Failed to send cancel request:", err);
    }
    setActiveScanId(null);
    setActiveOpportunities([]);
    setGapAnalysis(null);
    setBlueOcean(null);
  }, [activeScanId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scout"
        description="Discover app opportunities by analyzing top-rated apps with dissatisfied users, or validate your own app idea"
      />

      <ScanControls
        onStartScan={handleStartScan}
        onStartIdeaScan={handleStartIdeaScan}
        onCancel={handleCancel}
        isScanning={isScanning}
      />

      <ScanProgress
        stage={progress.stage}
        message={progress.message}
        progress={progress.progress}
        isActive={
          isScanning ||
          progress.stage === "complete" ||
          progress.stage === "error" ||
          progress.stage === "cancelled"
        }
      />

      {blueOcean && (
        <BlueOceanCard blueOcean={blueOcean} />
      )}

      <ScanHistory
        scans={scans}
        activeScanId={activeScanId}
        activeOpportunities={activeOpportunities}
      />
    </div>
  );
}
