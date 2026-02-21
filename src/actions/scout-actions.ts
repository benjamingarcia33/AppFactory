"use server";

import { db } from "@/lib/db";
import { scans, opportunities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type {
  Scan,
  Opportunity,
  ScrapedApp,
  ScrapedReview,
  SentimentAnalysis,
  OpportunityScore,
  AppStore,
  GapAnalysis,
  BlueOceanResult,
  ScoutMode,
} from "@/lib/types";

function rowToOpportunity(
  row: typeof opportunities.$inferSelect
): Opportunity {
  const scrapedApp: ScrapedApp = {
    id: row.appId,
    title: row.title,
    store: row.store as AppStore,
    genre: row.genre,
    score: row.score,
    ratings: row.ratings,
    installs: row.installs,
    description: row.description,
    icon: row.icon,
    url: row.url,
    developer: row.developer,
  };

  const reviews: ScrapedReview[] = JSON.parse(row.reviewsJson);
  const sentiment: SentimentAnalysis = JSON.parse(row.sentimentJson);

  const score: OpportunityScore = {
    marketSize: row.marketSize,
    dissatisfaction: row.dissatisfaction,
    feasibility: row.feasibility,
    composite: row.compositeScore,
  };

  let gapAnalysis: GapAnalysis | null = null;
  if (row.gapAnalysisJson) {
    try {
      gapAnalysis = JSON.parse(row.gapAnalysisJson) as GapAnalysis;
    } catch {
      gapAnalysis = null;
    }
  }

  let blueOcean: BlueOceanResult | null = null;
  if (row.blueOceanJson) {
    try {
      blueOcean = JSON.parse(row.blueOceanJson) as BlueOceanResult;
    } catch {
      blueOcean = null;
    }
  }

  return {
    id: row.id,
    scrapedApp,
    reviews,
    sentiment,
    score,
    scanId: row.scanId,
    createdAt: row.createdAt,
    gapAnalysis,
    blueOcean,
  };
}

export async function getScans(): Promise<Scan[]> {
  const rows = await db
    .select()
    .from(scans)
    .orderBy(desc(scans.createdAt));

  return rows.map(
    (row): Scan => ({
      id: row.id,
      store: row.store as AppStore,
      category: row.category,
      status: row.status as Scan["status"],
      totalAppsScraped: row.totalAppsScraped,
      totalOpportunities: row.totalOpportunities,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      mode: (row.mode as ScoutMode) ?? "category",
      ideaText: row.ideaText ?? null,
    })
  );
}

export async function getOpportunitiesByScan(
  scanId: string
): Promise<Opportunity[]> {
  const rows = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.scanId, scanId))
    .orderBy(desc(opportunities.compositeScore));

  return rows.map(rowToOpportunity);
}

export async function getOpportunityById(
  id: string
): Promise<Opportunity | null> {
  const rows = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id));

  if (rows.length === 0) return null;
  return rowToOpportunity(rows[0]);
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const rows = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.compositeScore));

  return rows.map(rowToOpportunity);
}
