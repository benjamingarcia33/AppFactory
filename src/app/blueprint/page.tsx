"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisualStrategy } from "@/components/architect/visual-strategy";
import { DocumentViewer } from "@/components/architect/document-viewer";
import { ExecutionPromptViewer } from "@/components/architect/execution-prompt-viewer";
import { IdeaChatInput } from "@/components/architect/idea-chat-input";
import { ImpactAnalysisCard } from "@/components/architect/impact-analysis-card";
import { IncrementalEPViewer } from "@/components/architect/incremental-ep-viewer";
import { IdeaEvolutionHistory } from "@/components/architect/idea-evolution-history";
import { normalizeVisualStrategy } from "@/components/architect/document-tabs";
import { useIdeaEvolution } from "@/hooks/useIdeaEvolution";
import {
  getAnalysisById,
  getLatestCompletedAnalysis,
  getAllAnalysesWithContext,
} from "@/actions/architect-actions";
import { getEvolutionsByAnalysis } from "@/actions/idea-evolution-actions";
import type {
  AnalysisDocument,
  AnalysisWithContext,
  IdeaEvolution,
  VisualStrategy as VisualStrategyType,
} from "@/lib/types";

function tryParseVisualStrategy(content: string): VisualStrategyType | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      (Array.isArray(parsed.personas) || parsed.revenueModel || parsed.revenue_model)
    ) {
      return normalizeVisualStrategy(parsed);
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

function StrategyPane({ visualData, strategyDoc }: { visualData: VisualStrategyType | null; strategyDoc: AnalysisDocument | null }) {
  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4">
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
  );
}

function PrdPane({ prdDoc }: { prdDoc: AnalysisDocument | null }) {
  if (!prdDoc) {
    return (
      <div className="rounded-xl border border-border bg-surface-0 p-4">
        <p className="text-sm text-muted-foreground">
          No product brief available.
        </p>
      </div>
    );
  }

  return <DocumentViewer document={prdDoc} copyLabel="Copy for AI Agent" />;
}

interface RightPaneProps {
  executionPrompts: AnalysisDocument[];
  prdDoc: AnalysisDocument | null;
  selectedId: string | null;
  evolutions: IdeaEvolution[];
  onEvolutionsChange: () => void;
}

function RightPane({ executionPrompts, prdDoc, selectedId, evolutions, onEvolutionsChange }: RightPaneProps) {
  const hasEPs = executionPrompts.length > 0;
  const defaultTab = hasEPs ? "execution" : "prd";

  const evolution = useIdeaEvolution(selectedId);
  const isRunning = evolution.status === "analyzing" || evolution.status === "generating";

  // Track which past evolution is being viewed
  const [viewingEvolution, setViewingEvolution] = useState<IdeaEvolution | null>(null);

  // Reload evolutions when a new one completes
  useEffect(() => {
    if (evolution.status === "complete") {
      onEvolutionsChange();
    }
  }, [evolution.status, onEvolutionsChange]);

  // Clear viewed evolution when a new one starts running
  useEffect(() => {
    if (isRunning) {
      setViewingEvolution(null);
    }
  }, [isRunning]);

  // Determine what to show: active run takes priority, then viewed past evolution
  const showImpact = evolution.impactAnalysis ?? viewingEvolution?.impactAnalysis ?? null;
  const showEpContent = evolution.epContent ?? viewingEvolution?.epContent ?? null;
  const showMeta = evolution.completedEvolution ?? viewingEvolution;

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="w-full">
        {hasEPs && (
          <TabsTrigger value="execution" className="flex-1">
            Execution Prompts
          </TabsTrigger>
        )}
        <TabsTrigger value="prd" className="flex-1">
          Product Brief
        </TabsTrigger>
        <TabsTrigger value="evolve" className="flex-1">
          Evolve
        </TabsTrigger>
      </TabsList>
      {hasEPs && (
        <TabsContent value="execution">
          <ExecutionPromptViewer prompts={executionPrompts} />
        </TabsContent>
      )}
      <TabsContent value="prd">
        <PrdPane prdDoc={prdDoc} />
      </TabsContent>
      <TabsContent value="evolve">
        <div className="space-y-4">
          <IdeaChatInput
            onSubmit={evolution.submitIdea}
            isRunning={isRunning}
            onCancel={evolution.cancel}
          />

          {evolution.error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{evolution.error}</p>
            </div>
          )}

          {/* Viewing a past evolution banner */}
          {viewingEvolution && !isRunning && evolution.status !== "complete" && (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
              <p className="text-sm text-primary/80">
                Viewing: &ldquo;{viewingEvolution.ideaText.slice(0, 60)}{viewingEvolution.ideaText.length > 60 ? "..." : ""}&rdquo;
              </p>
              <button
                onClick={() => setViewingEvolution(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}

          {showImpact && (
            <ImpactAnalysisCard impactAnalysis={showImpact} />
          )}

          {showEpContent && (
            <IncrementalEPViewer
              epContent={showEpContent}
              newDependencies={showMeta?.newDependencies ?? undefined}
              newEnvVars={showMeta?.newEnvVars ?? undefined}
              setupSteps={showMeta?.setupSteps ?? undefined}
              documentUpdates={showMeta?.documentUpdates ?? undefined}
            />
          )}

          <IdeaEvolutionHistory
            evolutions={evolutions}
            onSelect={(evo) => {
              if (evo.status === "completed") {
                setViewingEvolution(evo);
              }
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function BlueprintContent() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("analysisId");

  const [completedAnalyses, setCompletedAnalyses] = useState<AnalysisWithContext[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedId);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evolutions, setEvolutions] = useState<IdeaEvolution[]>([]);

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

  // Load evolutions for selected analysis
  const loadEvolutions = useCallback(async (id: string | null) => {
    if (!id) {
      setEvolutions([]);
      return;
    }
    try {
      const evos = await getEvolutionsByAnalysis(id);
      setEvolutions(evos);
    } catch {
      setEvolutions([]);
    }
  }, []);

  useEffect(() => {
    loadEvolutions(selectedId);
  }, [selectedId, loadEvolutions]);

  const handleEvolutionsChange = useCallback(() => {
    loadEvolutions(selectedId);
  }, [selectedId, loadEvolutions]);

  const prdDoc = useMemo(
    () => data?.documents.find((d) => d.type === "app_prd") ?? null,
    [data]
  );
  const strategyDoc = useMemo(
    () => data?.documents.find((d) => d.type === "strategic_analysis") ?? null,
    [data]
  );
  const visualData = useMemo(() => {
    if (!strategyDoc) return null;
    return tryParseVisualStrategy(strategyDoc.content);
  }, [strategyDoc]);
  const executionPromptDocs = useMemo(
    () => data?.documents.filter((d) => d.type.startsWith("execution_prompt_")) ?? [],
    [data]
  );

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
            blueprint with visual strategy and product brief will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top bar with selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blueprint</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visual strategy and AI-ready product brief for{" "}
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

      {/* Mobile: tab layout */}
      <div className="lg:hidden">
        <Tabs defaultValue="strategy">
          <TabsList className="w-full">
            <TabsTrigger value="strategy" className="flex-1">Visual Strategy</TabsTrigger>
            <TabsTrigger value="docs" className="flex-1">
              {executionPromptDocs.length > 0 ? "Prompts & Brief" : "Product Brief"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="strategy">
            <StrategyPane visualData={visualData} strategyDoc={strategyDoc} />
          </TabsContent>
          <TabsContent value="docs">
            <RightPane
              executionPrompts={executionPromptDocs}
              prdDoc={prdDoc}
              selectedId={selectedId}
              evolutions={evolutions}
              onEvolutionsChange={handleEvolutionsChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-[55fr_45fr] gap-4 items-start">
        <StrategyPane visualData={visualData} strategyDoc={strategyDoc} />
        <RightPane
          executionPrompts={executionPromptDocs}
          prdDoc={prdDoc}
          selectedId={selectedId}
          evolutions={evolutions}
          onEvolutionsChange={handleEvolutionsChange}
        />
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
