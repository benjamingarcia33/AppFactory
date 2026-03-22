"use server";

import { db } from "@/lib/db";
import { analyses, documents, scans, executionPrompts } from "@/lib/db/schema";
import { opportunities } from "@/lib/db/schema";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { isAnalysisActive } from "@/lib/agents/architect";
import type { Analysis, AnalysisDocument, AnalysisStep, AnalysisWithContext, MasterIdea, ExecutionPrompt } from "@/lib/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string, name: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid ${name}: must be a valid UUID`);
  }
  return id;
}

export async function getAnalysisByOpportunity(
  opportunityId: string
): Promise<Analysis | null> {
  validateUUID(opportunityId, "opportunityId");
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.opportunityId, opportunityId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  let steps: AnalysisStep[];
  try {
    steps = JSON.parse(row.stepsJson) as AnalysisStep[];
  } catch {
    steps = [];
  }
  return {
    id: row.id,
    opportunityId: row.opportunityId,
    scanId: row.scanId ?? null,
    status: row.status as Analysis["status"],
    steps,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export async function getDocumentsByAnalysis(
  analysisId: string
): Promise<AnalysisDocument[]> {
  validateUUID(analysisId, "analysisId");
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.analysisId, analysisId));

  return rows.map((row) => ({
    id: row.id,
    analysisId: row.analysisId,
    type: row.type as AnalysisDocument["type"],
    title: row.title,
    content: row.content,
    createdAt: row.createdAt,
  }));
}

export async function getAllAnalyses(): Promise<Analysis[]> {
  const rows = await db
    .select()
    .from(analyses)
    .orderBy(desc(analyses.createdAt));

  return rows.map((row) => {
    let steps: AnalysisStep[];
    try {
      steps = JSON.parse(row.stepsJson) as AnalysisStep[];
    } catch {
      steps = [];
    }
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      scanId: row.scanId ?? null,
      status: row.status as Analysis["status"],
      steps,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    };
  });
}

export async function getAllAnalysesWithContext(): Promise<AnalysisWithContext[]> {
  // LEFT JOIN on opportunities to handle analyses with scanId but no opportunityId
  const rows = await db
    .select({
      id: analyses.id,
      opportunityId: analyses.opportunityId,
      scanId: analyses.scanId,
      status: analyses.status,
      stepsJson: analyses.stepsJson,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      opportunityTitle: opportunities.title,
      opportunityIcon: opportunities.icon,
      masterIdeaJson: scans.masterIdeaJson,
    })
    .from(analyses)
    .leftJoin(opportunities, eq(analyses.opportunityId, opportunities.id))
    .leftJoin(scans, eq(analyses.scanId, scans.id))
    .orderBy(desc(analyses.createdAt));

  // Fetch documents for all analyses
  const allDocs = await db
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt));

  const docsByAnalysis = new Map<string, AnalysisDocument[]>();
  for (const doc of allDocs) {
    const list = docsByAnalysis.get(doc.analysisId) ?? [];
    list.push({
      id: doc.id,
      analysisId: doc.analysisId,
      type: doc.type as AnalysisDocument["type"],
      title: doc.title,
      content: doc.content,
      createdAt: doc.createdAt,
    });
    docsByAnalysis.set(doc.analysisId, list);
  }

  return rows.map((row) => {
    // Determine title: use opportunity title if available, otherwise parse master idea name
    let title = row.opportunityTitle ?? "Unknown";
    let icon = row.opportunityIcon ?? "";
    if (!row.opportunityId && row.masterIdeaJson) {
      try {
        const masterIdea = JSON.parse(row.masterIdeaJson) as MasterIdea;
        title = masterIdea.name;
        icon = ""; // Master ideas don't have icons
      } catch {
        title = "Master Idea Analysis";
      }
    }

    let steps: AnalysisStep[];
    try {
      steps = JSON.parse(row.stepsJson) as AnalysisStep[];
    } catch {
      steps = [];
    }

    return {
      id: row.id,
      opportunityId: row.opportunityId,
      scanId: row.scanId ?? null,
      status: row.status as Analysis["status"],
      steps,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      opportunityTitle: title,
      opportunityIcon: icon,
      documents: docsByAnalysis.get(row.id) ?? [],
    };
  });
}

export async function getAnalysisById(
  analysisId: string
): Promise<(AnalysisWithContext & { documents: AnalysisDocument[] }) | null> {
  validateUUID(analysisId, "analysisId");
  const rows = await db
    .select({
      id: analyses.id,
      opportunityId: analyses.opportunityId,
      scanId: analyses.scanId,
      status: analyses.status,
      stepsJson: analyses.stepsJson,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      opportunityTitle: opportunities.title,
      opportunityIcon: opportunities.icon,
      masterIdeaJson: scans.masterIdeaJson,
    })
    .from(analyses)
    .leftJoin(opportunities, eq(analyses.opportunityId, opportunities.id))
    .leftJoin(scans, eq(analyses.scanId, scans.id))
    .where(eq(analyses.id, analysisId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.analysisId, analysisId));

  let title = row.opportunityTitle ?? "Unknown";
  let icon = row.opportunityIcon ?? "";
  if (!row.opportunityId && row.masterIdeaJson) {
    try {
      const masterIdea = JSON.parse(row.masterIdeaJson) as MasterIdea;
      title = masterIdea.name;
      icon = "";
    } catch {
      title = "Master Idea Analysis";
    }
  }

  let steps: AnalysisStep[];
  try {
    steps = JSON.parse(row.stepsJson) as AnalysisStep[];
  } catch {
    steps = [];
  }

  return {
    id: row.id,
    opportunityId: row.opportunityId,
    scanId: row.scanId ?? null,
    status: row.status as Analysis["status"],
    steps,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    opportunityTitle: title,
    opportunityIcon: icon,
    documents: docs.map((doc) => ({
      id: doc.id,
      analysisId: doc.analysisId,
      type: doc.type as AnalysisDocument["type"],
      title: doc.title,
      content: doc.content,
      createdAt: doc.createdAt,
    })),
  };
}

export async function getLatestCompletedAnalysis(): Promise<
  (AnalysisWithContext & { documents: AnalysisDocument[] }) | null
> {
  const rows = await db
    .select({
      id: analyses.id,
      opportunityId: analyses.opportunityId,
      scanId: analyses.scanId,
      status: analyses.status,
      stepsJson: analyses.stepsJson,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      opportunityTitle: opportunities.title,
      opportunityIcon: opportunities.icon,
      masterIdeaJson: scans.masterIdeaJson,
    })
    .from(analyses)
    .leftJoin(opportunities, eq(analyses.opportunityId, opportunities.id))
    .leftJoin(scans, eq(analyses.scanId, scans.id))
    .where(inArray(analyses.status, ["completed", "completed_with_warnings"]))
    .orderBy(desc(analyses.completedAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.analysisId, row.id));

  let title = row.opportunityTitle ?? "Unknown";
  let icon = row.opportunityIcon ?? "";
  if (!row.opportunityId && row.masterIdeaJson) {
    try {
      const masterIdea = JSON.parse(row.masterIdeaJson) as MasterIdea;
      title = masterIdea.name;
      icon = "";
    } catch {
      title = "Master Idea Analysis";
    }
  }

  let steps: AnalysisStep[];
  try {
    steps = JSON.parse(row.stepsJson) as AnalysisStep[];
  } catch {
    steps = [];
  }

  return {
    id: row.id,
    opportunityId: row.opportunityId,
    scanId: row.scanId ?? null,
    status: row.status as Analysis["status"],
    steps,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    opportunityTitle: title,
    opportunityIcon: icon,
    documents: docs.map((doc) => ({
      id: doc.id,
      analysisId: doc.analysisId,
      type: doc.type as AnalysisDocument["type"],
      title: doc.title,
      content: doc.content,
      createdAt: doc.createdAt,
    })),
  };
}

export async function getAnalysisByScan(
  scanId: string
): Promise<Analysis | null> {
  validateUUID(scanId, "scanId");
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.scanId, scanId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  let steps: AnalysisStep[];
  try {
    steps = JSON.parse(row.stepsJson) as AnalysisStep[];
  } catch {
    steps = [];
  }
  return {
    id: row.id,
    opportunityId: row.opportunityId,
    scanId: row.scanId ?? null,
    status: row.status as Analysis["status"],
    steps,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export async function getExecutionPromptsByAnalysisId(
  analysisId: string
): Promise<ExecutionPrompt[]> {
  validateUUID(analysisId, "analysisId");
  const rows = await db
    .select()
    .from(executionPrompts)
    .where(eq(executionPrompts.analysisId, analysisId))
    .orderBy(asc(executionPrompts.promptNumber));

  return rows.map((row) => {
    let techSlugs: string[];
    try {
      techSlugs = JSON.parse(row.techSlugsJson);
    } catch {
      techSlugs = [];
    }
    return {
      id: row.id,
      analysisId: row.analysisId,
      promptNumber: row.promptNumber as 1 | 2 | 3,
      title: row.title,
      content: row.content,
      techSlugs,
      createdAt: row.createdAt,
    };
  });
}

export async function getAnalysisProgress(
  analysisId: string
): Promise<{ status: string; steps: AnalysisStep[] } | null> {
  validateUUID(analysisId, "analysisId");
  const rows = await db
    .select({
      status: analyses.status,
      stepsJson: analyses.stepsJson,
    })
    .from(analyses)
    .where(eq(analyses.id, analysisId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  let steps: AnalysisStep[];
  try {
    steps = JSON.parse(row.stepsJson) as AnalysisStep[];
  } catch {
    steps = [];
  }
  return { status: row.status, steps };
}

export async function cleanupStaleAnalyses(): Promise<void> {
  const runningRows = await db
    .select({ id: analyses.id, stepsJson: analyses.stepsJson, createdAt: analyses.createdAt })
    .from(analyses)
    .where(eq(analyses.status, "running"));

  const now = Date.now();
  // Grace period: don't clean up analyses created less than 1 hour ago.
  // In Next.js dev mode, server actions and API routes may run in different
  // module contexts, so isAnalysisActive() can return false for pipelines that
  // are still actively running (the in-memory Map is per-module-instance).
  const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 hour

  for (const row of runningRows) {
    const createdMs = new Date(row.createdAt).getTime();
    const ageMs = now - createdMs;

    // Skip recent analyses — they may still be actively running in another module context
    if (ageMs < GRACE_PERIOD_MS) {
      continue;
    }

    // Only mark as failed if both: older than grace period AND no in-memory controller
    if (!isAnalysisActive(row.id)) {
      let steps: AnalysisStep[];
      try {
        steps = JSON.parse(row.stepsJson) as AnalysisStep[];
      } catch {
        steps = [];
      }
      const updatedSteps = steps.map((s) =>
        s.status === "running" || s.status === "pending"
          ? { ...s, status: "failed" as const }
          : s
      );

      await db
        .update(analyses)
        .set({
          status: "failed",
          stepsJson: JSON.stringify(updatedSteps),
          completedAt: new Date().toISOString(),
        })
        .where(eq(analyses.id, row.id));
    }
  }
}
