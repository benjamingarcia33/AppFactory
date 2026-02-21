"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisualStrategy } from "@/components/architect/visual-strategy";
import { StarterPayloadViewer } from "@/components/architect/starter-payload-viewer";
import {
  getAnalysisById,
  getLatestCompletedAnalysis,
  getAllAnalysesWithContext,
} from "@/actions/architect-actions";
import type {
  AnalysisDocument,
  AnalysisWithContext,
  VisualStrategy as VisualStrategyType,
} from "@/lib/types";

function tryParseVisualStrategy(content: string): VisualStrategyType | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      (Array.isArray(parsed.personas) || parsed.revenueModel)
    ) {
      return parsed as VisualStrategyType;
    }
    return null;
  } catch {
    return null;
  }
}

interface AnalysisData {
  analysis: AnalysisWithContext;
  documents: AnalysisDocument[];
}

function BlueprintContent() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("analysisId");

  const [completedAnalyses, setCompletedAnalyses] = useState<AnalysisWithContext[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedId);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prdCopied, setPrdCopied] = useState(false);

  // Load all completed analyses for the selector
  useEffect(() => {
    getAllAnalysesWithContext().then((all) => {
      const completed = all.filter((a) => a.status === "completed");
      setCompletedAnalyses(completed);
    });
  }, []);

  // Load analysis data when selectedId changes or on initial load
  const loadAnalysis = useCallback(async (id: string | null) => {
    setLoading(true);
    try {
      let result;
      if (id) {
        result = await getAnalysisById(id);
      } else {
        result = await getLatestCompletedAnalysis();
      }
      if (result) {
        setData({ analysis: result, documents: result.documents });
        setSelectedId(result.id);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error("Failed to load analysis:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalysis(requestedId);
  }, [requestedId, loadAnalysis]);

  const handleSelectAnalysis = useCallback(
    (id: string) => {
      setSelectedId(id);
      loadAnalysis(id);
    },
    [loadAnalysis]
  );

  const prdDoc = useMemo(
    () => data?.documents.find((d) => d.type === "app_prd") ?? null,
    [data]
  );
  const strategyDoc = useMemo(
    () => data?.documents.find((d) => d.type === "strategic_analysis") ?? null,
    [data]
  );
  const starterDoc = useMemo(
    () => data?.documents.find((d) => d.type === "starter_payload") ?? null,
    [data]
  );
  const visualData = useMemo(() => {
    if (!strategyDoc) return null;
    return tryParseVisualStrategy(strategyDoc.content);
  }, [strategyDoc]);

  const handleCopyPrd = async () => {
    if (!prdDoc) return;
    try {
      await navigator.clipboard.writeText(prdDoc.content);
      setPrdCopied(true);
      setTimeout(() => setPrdCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading blueprint data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">No Completed Analyses</h2>
          <p className="text-muted-foreground max-w-md">
            Run an analysis from the Architect page first. Once completed, your
            blueprint with visual strategy, PRD, and starter payload will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar with selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blueprint</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visual strategy, PRD, and starter payload for{" "}
            <span className="font-medium text-foreground">
              {data.analysis.opportunityTitle}
            </span>
          </p>
        </div>
        {completedAnalyses.length > 1 && (
          <Select value={selectedId ?? undefined} onValueChange={handleSelectAnalysis}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an analysis" />
            </SelectTrigger>
            <SelectContent>
              {completedAnalyses.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.opportunityTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Main layout: left (strategy) + right (PRD/starter) */}
      <div className="flex gap-4 items-start">
        {/* Left pane: Visual Strategy */}
        <div className="w-[55%] shrink-0">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Visual Strategic Analysis</h2>
            {visualData ? (
              <VisualStrategy data={visualData} />
            ) : strategyDoc ? (
              <ScrollArea className="h-[700px]">
                <pre className="text-sm font-mono whitespace-pre-wrap p-4">
                  {strategyDoc.content}
                </pre>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                No strategic analysis document available.
              </p>
            )}
          </div>
        </div>

        {/* Right pane: PRD + Starter Payload tabs */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="prd">
            <TabsList>
              <TabsTrigger value="prd">PRD</TabsTrigger>
              <TabsTrigger value="starter">Starter Payload</TabsTrigger>
            </TabsList>

            <TabsContent value="prd">
              {prdDoc ? (
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <h3 className="text-sm font-medium">{prdDoc.title}</h3>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleCopyPrd}
                    >
                      {prdCopied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <ScrollArea className="h-[650px]">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                      {prdDoc.content}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4">
                  No PRD document available.
                </p>
              )}
            </TabsContent>

            <TabsContent value="starter">
              {starterDoc ? (
                <StarterPayloadViewer content={starterDoc.content} />
              ) : (
                <p className="text-sm text-muted-foreground p-4">
                  No starter payload available.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function BlueprintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <BlueprintContent />
    </Suspense>
  );
}
