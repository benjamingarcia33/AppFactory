"use server";

import { db } from "@/lib/db";
import { ideaEvolutions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { IdeaEvolution, ImpactAnalysis } from "@/lib/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string, name: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid ${name}: must be a valid UUID`);
  }
  return id;
}

function parseJsonField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getEvolutionsByAnalysis(
  analysisId: string
): Promise<IdeaEvolution[]> {
  validateUUID(analysisId, "analysisId");
  const rows = await db
    .select()
    .from(ideaEvolutions)
    .where(eq(ideaEvolutions.analysisId, analysisId))
    .orderBy(desc(ideaEvolutions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    analysisId: row.analysisId,
    ideaText: row.ideaText,
    status: row.status as IdeaEvolution["status"],
    impactAnalysis: parseJsonField<ImpactAnalysis | null>(row.impactAnalysis, null),
    epContent: row.epContent ?? null,
    documentUpdates: parseJsonField<string[] | null>(row.documentUpdates, null),
    newDependencies: parseJsonField<string[] | null>(row.newDependencies, null),
    newEnvVars: parseJsonField<string[] | null>(row.newEnvVars, null),
    setupSteps: parseJsonField<string[] | null>(row.setupSteps, null),
    newScreens: parseJsonField<Array<{ screenName: string; description: string }> | null>(row.newScreens, null),
    modifiedScreens: parseJsonField<Array<{ screenName: string; changes: string }> | null>(row.modifiedScreens, null),
    newTables: parseJsonField<Array<{ tableName: string; description: string }> | null>(row.newTables, null),
    modifiedTables: parseJsonField<Array<{ tableName: string; changes: string }> | null>(row.modifiedTables, null),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? null,
  }));
}

export async function getEvolutionById(
  evolutionId: string
): Promise<IdeaEvolution | null> {
  validateUUID(evolutionId, "evolutionId");
  const rows = await db
    .select()
    .from(ideaEvolutions)
    .where(eq(ideaEvolutions.id, evolutionId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    analysisId: row.analysisId,
    ideaText: row.ideaText,
    status: row.status as IdeaEvolution["status"],
    impactAnalysis: parseJsonField<ImpactAnalysis | null>(row.impactAnalysis, null),
    epContent: row.epContent ?? null,
    documentUpdates: parseJsonField<string[] | null>(row.documentUpdates, null),
    newDependencies: parseJsonField<string[] | null>(row.newDependencies, null),
    newEnvVars: parseJsonField<string[] | null>(row.newEnvVars, null),
    setupSteps: parseJsonField<string[] | null>(row.setupSteps, null),
    newScreens: parseJsonField<Array<{ screenName: string; description: string }> | null>(row.newScreens, null),
    modifiedScreens: parseJsonField<Array<{ screenName: string; changes: string }> | null>(row.modifiedScreens, null),
    newTables: parseJsonField<Array<{ tableName: string; description: string }> | null>(row.newTables, null),
    modifiedTables: parseJsonField<Array<{ tableName: string; changes: string }> | null>(row.modifiedTables, null),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? null,
  };
}

export async function getEvolutionEPContent(
  evolutionId: string
): Promise<string | null> {
  validateUUID(evolutionId, "evolutionId");
  const rows = await db
    .select({ epContent: ideaEvolutions.epContent })
    .from(ideaEvolutions)
    .where(eq(ideaEvolutions.id, evolutionId))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0].epContent ?? null;
}
