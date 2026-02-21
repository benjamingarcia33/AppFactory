"use server";

import { db } from "@/lib/db";
import { analyses, documents } from "@/lib/db/schema";
import { opportunities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { isAnalysisActive } from "@/lib/agents/architect";
import type { Analysis, AnalysisDocument, AnalysisStep, AnalysisWithContext } from "@/lib/types";

export async function getAnalysisByOpportunity(
  opportunityId: string
): Promise<Analysis | null> {
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.opportunityId, opportunityId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    opportunityId: row.opportunityId,
    status: row.status as Analysis["status"],
    steps: JSON.parse(row.stepsJson) as AnalysisStep[],
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export async function getDocumentsByAnalysis(
  analysisId: string
): Promise<AnalysisDocument[]> {
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

  return rows.map((row) => ({
    id: row.id,
    opportunityId: row.opportunityId,
    status: row.status as Analysis["status"],
    steps: JSON.parse(row.stepsJson) as AnalysisStep[],
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  }));
}

export async function getAllAnalysesWithContext(): Promise<AnalysisWithContext[]> {
  const rows = await db
    .select({
      id: analyses.id,
      opportunityId: analyses.opportunityId,
      status: analyses.status,
      stepsJson: analyses.stepsJson,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      opportunityTitle: opportunities.title,
      opportunityIcon: opportunities.icon,
    })
    .from(analyses)
    .innerJoin(opportunities, eq(analyses.opportunityId, opportunities.id))
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

  return rows.map((row) => ({
    id: row.id,
    opportunityId: row.opportunityId,
    status: row.status as Analysis["status"],
    steps: JSON.parse(row.stepsJson) as AnalysisStep[],
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    opportunityTitle: row.opportunityTitle,
    opportunityIcon: row.opportunityIcon,
    documents: docsByAnalysis.get(row.id) ?? [],
  }));
}

export async function getAnalysisById(
  analysisId: string
): Promise<(AnalysisWithContext & { documents: AnalysisDocument[] }) | null> {
  const rows = await db
    .select({
      id: analyses.id,
      opportunityId: analyses.opportunityId,
      status: analyses.status,
      stepsJson: analyses.stepsJson,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      opportunityTitle: opportunities.title,
      opportunityIcon: opportunities.icon,
    })
    .from(analyses)
    .innerJoin(opportunities, eq(analyses.opportunityId, opportunities.id))
    .where(eq(analyses.id, analysisId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.analysisId, analysisId));

  return {
    id: row.id,
    opportunityId: row.opportunityId,
    status: row.status as Analysis["status"],
    steps: JSON.parse(row.stepsJson) as AnalysisStep[],
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    opportunityTitle: row.opportunityTitle,
    opportunityIcon: row.opportunityIcon,
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
      status: analyses.status,
      stepsJson: analyses.stepsJson,
      createdAt: analyses.createdAt,
      completedAt: analyses.completedAt,
      opportunityTitle: opportunities.title,
      opportunityIcon: opportunities.icon,
    })
    .from(analyses)
    .innerJoin(opportunities, eq(analyses.opportunityId, opportunities.id))
    .where(eq(analyses.status, "completed"))
    .orderBy(desc(analyses.completedAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.analysisId, row.id));

  return {
    id: row.id,
    opportunityId: row.opportunityId,
    status: row.status as Analysis["status"],
    steps: JSON.parse(row.stepsJson) as AnalysisStep[],
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    opportunityTitle: row.opportunityTitle,
    opportunityIcon: row.opportunityIcon,
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

export async function cleanupStaleAnalyses(): Promise<void> {
  const runningRows = await db
    .select({ id: analyses.id, stepsJson: analyses.stepsJson })
    .from(analyses)
    .where(eq(analyses.status, "running"));

  for (const row of runningRows) {
    if (!isAnalysisActive(row.id)) {
      // Mark running/pending steps as failed
      const steps = JSON.parse(row.stepsJson) as AnalysisStep[];
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
