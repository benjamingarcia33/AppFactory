"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ScanControls } from "@/components/scout/scan-controls";
import { ScanProgress } from "@/components/scout/scan-progress";
import { ScanHistory } from "@/components/scout/scan-history";
import { BlueOceanCard } from "@/components/scout/blue-ocean-card";
import { MasterIdeaCard } from "@/components/scout/master-idea-card";
import { ScoutExecutiveSummary } from "@/components/scout/scout-executive-summary";
import { getScans } from "@/actions/scout-actions";
import type {
  AppStore,
  Scan,
  Opportunity,
  ScoutSSEEvent,
  ScoutFilterSettings,
  GapAnalysis,
  BlueOceanResult,
  MasterIdea,
  ScoutMode,
} from "@/lib/types";

interface ScanParams {
  store: AppStore;
  mode: ScoutMode;
  ideaText?: string;
  category?: string;
  categoryLabel?: string;
  focusText?: string | null;
  advancedFilters: ScoutFilterSettings | null;
}

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
  const [masterIdea, setMasterIdea] = useState<MasterIdea | null>(null);
  const [lastCompletedScanId, setLastCompletedScanId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scanParamsRef = useRef<ScanParams | null>(null);

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
              const params = scanParamsRef.current;
              const newScan: Scan = {
                id: data.scanId,
                store: params?.store ?? "google_play",
                category: params?.category ?? (params?.mode === "discovery" ? "" : "synthesis"),
                status: "running",
                totalAppsScraped: 0,
                totalOpportunities: 0,
                createdAt: new Date().toISOString(),
                completedAt: null,
                mode: params?.mode ?? "synthesis",
                ideaText: params?.ideaText ?? null,
                masterIdea: null,
                blueOcean: null,
                focusText: params?.focusText ?? null,
                discoveryAngle: null,
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

          case "search_strategy":
            setProgress((prev) => ({
              ...prev,
              stage: "search_strategy",
              message: `AI search strategy: ${data.strategy.queries.length} queries, ${data.strategy.categories.length} categories`,
            }));
            break;

          case "discovery_angle":
            // Persist the angle on the scan in the scans list
            setScans((prev) =>
              prev.map((s) =>
                s.id === activeScanId
                  ? { ...s, discoveryAngle: data.angle }
                  : s
              )
            );
            setProgress((prev) => ({
              ...prev,
              stage: "discovery_angle",
              message: `AI discovered angle: ${data.angle}`,
            }));
            break;

          case "gap_analysis":
            setGapAnalysis(data.gapAnalysis);
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
            setActiveOpportunities((prev) =>
              prev.map((opp) => ({
                ...opp,
                blueOcean: data.blueOcean,
              }))
            );
            // Persist blueOcean on the scan object in the scans list
            setScans((prev) =>
              prev.map((s) =>
                s.id === activeScanId
                  ? { ...s, blueOcean: data.blueOcean }
                  : s
              )
            );
            setProgress((prev) => ({
              ...prev,
              stage: "blue_ocean",
              message: data.blueOcean.isBlueOcean
                ? "Blue ocean opportunity detected!"
                : "Market assessment complete.",
            }));
            break;

          case "master_idea":
            setMasterIdea(data.masterIdea);
            // Also persist masterIdea on the scan object in the scans list
            setScans((prev) =>
              prev.map((s) =>
                s.id === activeScanId
                  ? { ...s, masterIdea: data.masterIdea }
                  : s
              )
            );
            setProgress((prev) => ({
              ...prev,
              stage: "synthesis",
              message: `Master Idea synthesized: ${data.masterIdea.name}`,
            }));
            break;

          case "master_idea_error":
            setProgress((prev) => ({
              ...prev,
              stage: "synthesis_warning",
              message: data.message,
            }));
            break;

          case "complete":
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
            setLastCompletedScanId(data.scanId);
            setIsScanning(false);
            setActiveScanId(null);
            // Don't clear activeOpportunities here — they are needed by
            // MasterIdeaCard and ScanHistory. They will be cleared when the
            // NEXT scan starts (in handleStartScan).
            setProgress({
              stage: "complete",
              message: `Scan complete. Found ${data.totalOpportunities} competitors.`,
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
            setMasterIdea(null);
            setLastCompletedScanId(null);
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
            setMasterIdea(null);
            setLastCompletedScanId(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const resetScanState = useCallback(() => {
    setIsScanning(true);
    setActiveOpportunities([]);
    setGapAnalysis(null);
    setBlueOcean(null);
    setMasterIdea(null);
    setLastCompletedScanId(null);
  }, []);

  const handleStartScan = useCallback(
    (store: AppStore, ideaText: string, advancedFilters: ScoutFilterSettings | null) => {
      resetScanState();
      setProgress({
        stage: "starting",
        message: "Initializing synthesis pipeline...",
        progress: 0,
      });
      scanParamsRef.current = { store, mode: "synthesis", ideaText, advancedFilters };

      const params = new URLSearchParams({
        store,
        mode: "synthesis",
        ideaText,
      });
      if (advancedFilters) {
        params.set("advancedFilters", "true");
        params.set("minInstalls", String(advancedFilters.minInstalls));
        params.set("maxRating", String(advancedFilters.maxRating));
        params.set("minRatings", String(advancedFilters.minRatings));
      }
      connectEventSource(`/api/scout/stream?${params.toString()}`);
    },
    [connectEventSource, resetScanState]
  );

  const handleStartDiscovery = useCallback(
    (store: AppStore, category: string, categoryLabel: string, focusText: string | null, advancedFilters: ScoutFilterSettings | null) => {
      resetScanState();
      setProgress({
        stage: "starting",
        message: `Initializing discovery in ${categoryLabel}...`,
        progress: 0,
      });
      scanParamsRef.current = { store, mode: "discovery", category, categoryLabel, focusText, advancedFilters };

      const params = new URLSearchParams({
        store,
        mode: "discovery",
        category,
        categoryLabel,
      });
      if (focusText) {
        params.set("focusText", focusText);
      }
      if (advancedFilters) {
        params.set("advancedFilters", "true");
        params.set("minInstalls", String(advancedFilters.minInstalls));
        params.set("maxRating", String(advancedFilters.maxRating));
        params.set("minRatings", String(advancedFilters.minRatings));
      }
      connectEventSource(`/api/scout/stream?${params.toString()}`);
    },
    [connectEventSource, resetScanState]
  );

  const handleCancel = useCallback(async () => {
    if (!activeScanId) return;
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
    setMasterIdea(null);
    setLastCompletedScanId(null);
  }, [activeScanId]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scout"
        description="Describe your app idea or explore a category to find opportunities, analyze competitors, and synthesize a unique Master Idea"
      />

      <ScanControls
        onStartScan={handleStartScan}
        onStartDiscovery={handleStartDiscovery}
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

      {blueOcean && !masterIdea && (activeScanId || lastCompletedScanId) && (
        <BlueOceanCard
          blueOcean={blueOcean}
          scanId={(activeScanId ?? lastCompletedScanId)!}
        />
      )}

      {masterIdea && (activeScanId || lastCompletedScanId) && (
        <>
          <ScoutExecutiveSummary
            masterIdea={masterIdea}
            scanId={(activeScanId ?? lastCompletedScanId)!}
          />
          <MasterIdeaCard
            masterIdea={masterIdea}
            scanId={(activeScanId ?? lastCompletedScanId)!}
            opportunities={activeOpportunities}
            hideExecutiveSummary
          />
        </>
      )}

      <ScanHistory
        scans={scans}
        activeScanId={activeScanId}
        activeOpportunities={activeOpportunities}
      />
    </div>
  );
}
