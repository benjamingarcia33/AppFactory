import { generateText } from "ai";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyses, documents } from "@/lib/db/schema";
import { openrouter, MODEL, callAIWithRetry, callAIStructured } from "@/lib/ai/client";
import { getOpportunityById } from "@/actions/scout-actions";
import {
  buildAiExpectationsPrompt,
  buildStrategicPlanningPrompt,
  buildAiApproachPrompt,
  buildDevTinkeringPrompt,
  buildPrdDocPrompt,
  buildVisualStrategyPrompt,
  buildStarterPayloadPrompt,
  aiExpectationsSchema,
  strategicPlanSchema,
  aiApproachSchema,
  devPlanSchema,
  visualStrategySchema,
} from "@/lib/ai/architect-prompts";
import { CancelledError } from "@/lib/errors";
import type {
  AnalysisStep,
  ArchitectSSEEvent,
  AnalysisDocument,
} from "@/lib/types";

// --- Cancel support ---
const activeAnalysisControllers = new Map<string, AbortController>();

export function cancelArchitectPipeline(analysisId: string): boolean {
  const controller = activeAnalysisControllers.get(analysisId);
  if (controller) {
    controller.abort();
    return true;
  }
  return false;
}

export function cancelAllActive(): void {
  for (const [, controller] of activeAnalysisControllers) {
    controller.abort();
  }
}

export function isAnalysisActive(analysisId: string): boolean {
  return activeAnalysisControllers.has(analysisId);
}

function checkCancelled(signal: AbortSignal) {
  if (signal.aborted) throw new CancelledError("Analysis was cancelled");
}

// ============================================
// Architect Agent - Pipeline Runner
// Orchestrates the 4-step analysis + document generation
// ============================================

const STEP_DEFINITIONS: { step: number; title: string }[] = [
  { step: 1, title: "AI Expectations Analysis" },
  { step: 2, title: "Strategic Planning" },
  { step: 3, title: "AI Approach & Architecture" },
  { step: 4, title: "Development & Tinkering Plan" },
];

function createInitialSteps(): AnalysisStep[] {
  return STEP_DEFINITIONS.map(({ step, title }) => ({
    step,
    title,
    status: "pending" as const,
    content: "",
  }));
}

function updateStep(
  steps: AnalysisStep[],
  stepNumber: number,
  update: Partial<AnalysisStep>
): AnalysisStep[] {
  return steps.map((s) =>
    s.step === stepNumber ? { ...s, ...update } : s
  );
}

async function saveSteps(analysisId: string, steps: AnalysisStep[]) {
  await db
    .update(analyses)
    .set({ stepsJson: JSON.stringify(steps) })
    .where(eq(analyses.id, analysisId));
}

async function callAIText(
  prompt: string,
  signal?: AbortSignal,
  maxOutputTokens: number = 16384,
): Promise<string> {
  return callAIWithRetry(async () => {
    const { text } = await generateText({
      model: openrouter(MODEL),
      prompt,
      maxOutputTokens,
      abortSignal: signal,
    });
    return text;
  }, 3, signal);
}

function formatStructuredContent(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Create a compact summary of step output for passing to subsequent steps.
 * Truncates strings, limits array sizes, and removes verbose nested data
 * to reduce token count while preserving key decisions.
 */
function formatStepSummary(data: unknown): string {
  const truncated = truncateDeep(data, 2);
  return JSON.stringify(truncated, null, 2);
}

function truncateDeep(obj: unknown, maxDepth: number, depth: number = 0): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj === "string") {
    return obj.length > 150 ? obj.slice(0, 150) + "..." : obj;
  }
  if (depth > maxDepth) return "[...]";
  if (Array.isArray(obj)) {
    return obj.slice(0, 3).map((item) => truncateDeep(item, maxDepth, depth + 1));
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Skip sample quotes and verbose example arrays
      const lk = key.toLowerCase();
      if (lk.includes("quote") || lk.includes("sample")) continue;
      result[key] = truncateDeep(value, maxDepth, depth + 1);
    }
    return result;
  }
  return obj;
}

export async function runArchitectPipeline(
  opportunityId: string,
  sendEvent: (event: ArchitectSSEEvent) => void
) {
  // 1. Fetch the opportunity
  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity) {
    sendEvent({ type: "error", message: "Opportunity not found" });
    return;
  }

  // 2. Create analysis record
  const analysisId = uuid();
  const now = new Date().toISOString();
  let steps = createInitialSteps();

  // Set up cancellation
  const abortController = new AbortController();
  activeAnalysisControllers.set(analysisId, abortController);
  const { signal } = abortController;

  await db.insert(analyses).values({
    id: analysisId,
    opportunityId,
    status: "running",
    stepsJson: JSON.stringify(steps),
    createdAt: now,
  });

  // Emit analysis_started early so client can track analysisId for cancellation
  sendEvent({ type: "analysis_started", analysisId });

  try {
    // ==============================
    // Step 1: AI Expectations
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 1, { status: "running" });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 1,
      title: STEP_DEFINITIONS[0].title,
      status: "running",
    });

    const aiExpectationsData = await callAIStructured(
      buildAiExpectationsPrompt(opportunity),
      aiExpectationsSchema,
      "aiExpectations",
      "User expectations analysis for an AI-powered app alternative",
      signal,
      MODEL,
      8192,
    );
    checkCancelled(signal);
    const aiExpectations = formatStructuredContent(aiExpectationsData);
    const aiExpectationsSummary = formatStepSummary(aiExpectationsData);

    steps = updateStep(steps, 1, {
      status: "completed",
      content: aiExpectations,
    });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 1,
      title: STEP_DEFINITIONS[0].title,
      status: "completed",
      content: aiExpectations,
    });

    // ==============================
    // Step 2: Strategic Planning
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 2, { status: "running" });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 2,
      title: STEP_DEFINITIONS[1].title,
      status: "running",
    });

    const strategicPlanData = await callAIStructured(
      buildStrategicPlanningPrompt(opportunity, aiExpectationsSummary),
      strategicPlanSchema,
      "strategicPlan",
      "Business strategy and go-to-market plan",
      signal,
      MODEL,
      8192,
    );
    checkCancelled(signal);
    const strategicPlan = formatStructuredContent(strategicPlanData);
    const strategicPlanSummary = formatStepSummary(strategicPlanData);

    steps = updateStep(steps, 2, {
      status: "completed",
      content: strategicPlan,
    });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 2,
      title: STEP_DEFINITIONS[1].title,
      status: "completed",
      content: strategicPlan,
    });

    // ==============================
    // Step 3: AI Approach
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 3, { status: "running" });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 3,
      title: STEP_DEFINITIONS[2].title,
      status: "running",
    });

    const aiApproachData = await callAIStructured(
      buildAiApproachPrompt(opportunity, aiExpectationsSummary, strategicPlanSummary),
      aiApproachSchema,
      "aiApproach",
      "Technical AI approach and architecture design",
      signal,
      MODEL,
      6144,
    );
    checkCancelled(signal);
    const aiApproach = formatStructuredContent(aiApproachData);
    const aiApproachSummary = formatStepSummary(aiApproachData);

    steps = updateStep(steps, 3, {
      status: "completed",
      content: aiApproach,
    });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 3,
      title: STEP_DEFINITIONS[2].title,
      status: "completed",
      content: aiApproach,
    });

    // ==============================
    // Step 4: Development & Tinkering
    // ==============================
    checkCancelled(signal);
    steps = updateStep(steps, 4, { status: "running" });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 4,
      title: STEP_DEFINITIONS[3].title,
      status: "running",
    });

    const previousStepsSummary = [
      `## AI Expectations Analysis\n${aiExpectationsSummary}`,
      `## Strategic Planning\n${strategicPlanSummary}`,
      `## AI Approach & Architecture\n${aiApproachSummary}`,
    ].join("\n\n");

    const devPlanData = await callAIStructured(
      buildDevTinkeringPrompt(opportunity, previousStepsSummary),
      devPlanSchema,
      "devPlan",
      "Development plan with MVP scope, tech stack, and timeline",
      signal,
      MODEL,
      8192,
    );
    checkCancelled(signal);
    const devPlan = formatStructuredContent(devPlanData);
    const devPlanSummary = formatStepSummary(devPlanData);

    steps = updateStep(steps, 4, {
      status: "completed",
      content: devPlan,
    });
    await saveSteps(analysisId, steps);
    sendEvent({
      type: "progress",
      step: 4,
      title: STEP_DEFINITIONS[3].title,
      status: "completed",
      content: devPlan,
    });

    // ==============================
    // Generate Documents (PRD + Visual Strategy + Starter Payload)
    // Uses Promise.allSettled so partial success still saves documents
    // ==============================
    checkCancelled(signal);
    sendEvent({
      type: "progress",
      step: 5,
      title: "Generating Documents",
      status: "running",
    });

    const allStepsSummary = [
      `## AI Expectations Analysis\n${aiExpectationsSummary}`,
      `## Strategic Planning\n${strategicPlanSummary}`,
      `## AI Approach & Architecture\n${aiApproachSummary}`,
      `## Development & Tinkering Plan\n${devPlanSummary}`,
    ].join("\n\n");

    const [prdResult, visualStrategyResult] = await Promise.allSettled([
      callAIText(buildPrdDocPrompt(opportunity, allStepsSummary), signal, 12288),
      callAIStructured(
        buildVisualStrategyPrompt(opportunity, allStepsSummary),
        visualStrategySchema,
        "visualStrategy",
        "Visual strategic analysis with chart data",
        signal,
        MODEL,
        10240,
      ),
    ]);

    // Save PRD if it succeeded
    if (prdResult.status === "fulfilled") {
      const prdDoc: AnalysisDocument = {
        id: uuid(),
        analysisId,
        type: "app_prd",
        title: `PRD: AI-Powered Alternative to ${opportunity.scrapedApp.title}`,
        content: prdResult.value,
        createdAt: new Date().toISOString(),
      };
      await db.insert(documents).values({
        id: prdDoc.id,
        analysisId: prdDoc.analysisId,
        type: prdDoc.type,
        title: prdDoc.title,
        content: prdDoc.content,
        createdAt: prdDoc.createdAt,
      });
      sendEvent({ type: "document", document: prdDoc });
    } else {
      console.warn("[architect] PRD generation failed:", prdResult.reason);
    }

    // Save Visual Strategy if it succeeded
    if (visualStrategyResult.status === "fulfilled") {
      const strategyDoc: AnalysisDocument = {
        id: uuid(),
        analysisId,
        type: "strategic_analysis",
        title: `Visual Strategy: AI Alternative to ${opportunity.scrapedApp.title}`,
        content: JSON.stringify(visualStrategyResult.value),
        createdAt: new Date().toISOString(),
      };
      await db.insert(documents).values({
        id: strategyDoc.id,
        analysisId: strategyDoc.analysisId,
        type: strategyDoc.type,
        title: strategyDoc.title,
        content: strategyDoc.content,
        createdAt: strategyDoc.createdAt,
      });
      sendEvent({ type: "document", document: strategyDoc });
    } else {
      console.warn("[architect] Visual Strategy generation failed:", visualStrategyResult.reason);
    }

    // Generate Starter Payload only if PRD succeeded
    if (prdResult.status === "fulfilled") {
      try {
        checkCancelled(signal);
        const starterPayloadContent = await callAIText(
          buildStarterPayloadPrompt(opportunity, prdResult.value),
          signal,
          4096,
        );
        const starterDoc: AnalysisDocument = {
          id: uuid(),
          analysisId,
          type: "starter_payload",
          title: `Claude Code Starter: ${opportunity.scrapedApp.title} Alternative`,
          content: starterPayloadContent,
          createdAt: new Date().toISOString(),
        };
        await db.insert(documents).values({
          id: starterDoc.id,
          analysisId: starterDoc.analysisId,
          type: starterDoc.type,
          title: starterDoc.title,
          content: starterDoc.content,
          createdAt: starterDoc.createdAt,
        });
        sendEvent({ type: "document", document: starterDoc });
      } catch (starterErr) {
        if (starterErr instanceof CancelledError || signal.aborted) throw starterErr;
        console.warn("[architect] Starter Payload generation failed:", starterErr);
      }
    }

    // ==============================
    // Mark analysis as completed (even with partial document failures)
    // The 4 analysis steps completed successfully
    // ==============================
    await db
      .update(analyses)
      .set({
        status: "completed",
        completedAt: new Date().toISOString(),
      })
      .where(eq(analyses.id, analysisId));

    sendEvent({ type: "complete", analysisId });
  } catch (error) {
    if (error instanceof CancelledError || signal.aborted) {
      await db
        .update(analyses)
        .set({
          status: "cancelled",
          completedAt: new Date().toISOString(),
        })
        .where(eq(analyses.id, analysisId));

      // Mark running/pending steps as cancelled
      steps = steps.map((s) =>
        s.status === "running" || s.status === "pending"
          ? { ...s, status: "cancelled" as const }
          : s
      );
      await saveSteps(analysisId, steps);

      sendEvent({ type: "cancelled", analysisId });
    } else {
      // Update analysis status to failed
      await db
        .update(analyses)
        .set({
          status: "failed",
          completedAt: new Date().toISOString(),
        })
        .where(eq(analyses.id, analysisId));

      // Mark any running steps as failed
      steps = steps.map((s) =>
        s.status === "running" ? { ...s, status: "failed" as const } : s
      );
      await saveSteps(analysisId, steps);

      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      sendEvent({ type: "error", message });
    }
  } finally {
    activeAnalysisControllers.delete(analysisId);
  }
}
