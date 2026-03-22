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
  MasterIdea,
} from "@/lib/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string, name: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid ${name}: must be a valid UUID`);
  }
  return id;
}

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
    reviewCount: row.reviewCount ?? undefined,
    installs: row.installs,
    description: row.description,
    icon: row.icon,
    url: row.url,
    developer: row.developer,
    isEstimatedInstalls: row.installs.startsWith("~"),
    price: row.price ?? undefined,
    free: row.free ?? undefined,
    offersIAP: row.offersIAP ?? undefined,
    priceText: row.priceText ?? undefined,
    histogram: row.histogramJson ? (() => { try { return JSON.parse(row.histogramJson!); } catch { return undefined; } })() : undefined,
    dataConfidence: (row.dataConfidence as "high" | "medium" | "low" | undefined) ?? undefined,
  };

  let reviews: ScrapedReview[];
  try {
    reviews = JSON.parse(row.reviewsJson) ?? [];
  } catch {
    reviews = [];
  }

  // AI-generated JSON may use different field names — ensure all arrays exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawSentiment: any;
  try {
    rawSentiment = JSON.parse(row.sentimentJson);
  } catch {
    rawSentiment = {};
  }
  const sentiment: SentimentAnalysis = {
    overallSentiment: rawSentiment.overallSentiment ?? rawSentiment.overall_sentiment ?? "mixed",
    summary: rawSentiment.summary ?? "",
    painPoints: (rawSentiment.painPoints ?? rawSentiment.pain_points ?? []).map(
      (pp: Record<string, unknown>) => ({
        ...pp,
        sampleQuotes: pp.sampleQuotes ?? pp.sample_quotes ?? pp.quotes ?? [],
      })
    ),
    featureRequests: (rawSentiment.featureRequests ?? rawSentiment.feature_requests ?? []).map(
      (fr: Record<string, unknown>) => ({
        ...fr,
        sampleQuotes: fr.sampleQuotes ?? fr.sample_quotes ?? fr.quotes ?? [],
      })
    ),
    praisedAspects: rawSentiment.praisedAspects ?? rawSentiment.praised_aspects ?? rawSentiment.positives ?? [],
  };

  const score: OpportunityScore = {
    marketSize: row.marketSize,
    dissatisfaction: row.dissatisfaction,
    feasibility: row.feasibility,
    featureGapScore: row.featureGapScore ?? 0,
    compositeScore: row.compositeScore,
  };

  let gapAnalysis: GapAnalysis | null = null;
  if (row.gapAnalysisJson) {
    try {
      const rawGap = JSON.parse(row.gapAnalysisJson);
      gapAnalysis = {
        ideaSummary: rawGap.ideaSummary ?? rawGap.idea_summary ?? "",
        marketPositioning: rawGap.marketPositioning ?? rawGap.market_positioning ?? "",
        uniqueAdvantages: rawGap.uniqueAdvantages ?? rawGap.unique_advantages ?? [],
        competitorComparisons: (rawGap.competitorComparisons ?? rawGap.competitor_comparisons ?? []).map(
          (c: Record<string, unknown>) => ({
            ...c,
            painPointsExploited: c.painPointsExploited ?? c.pain_points_exploited ?? [],
            featureGaps: c.featureGaps ?? c.feature_gaps ?? [],
            strengthsToOvercome: c.strengthsToOvercome ?? c.strengths_to_overcome ?? [],
          })
        ),
      };
    } catch {
      gapAnalysis = null;
    }
  }

  let blueOcean: BlueOceanResult | null = null;
  if (row.blueOceanJson) {
    try {
      const rawBlue = JSON.parse(row.blueOceanJson);
      blueOcean = {
        isBlueOcean: rawBlue.isBlueOcean ?? rawBlue.is_blue_ocean ?? false,
        confidence: rawBlue.confidence ?? 0,
        reasoning: rawBlue.reasoning ?? "",
        adjacentMarkets: rawBlue.adjacentMarkets ?? rawBlue.adjacent_markets ?? [],
        risks: rawBlue.risks ?? [],
        nextSteps: rawBlue.nextSteps ?? rawBlue.next_steps ?? [],
        immediateArchitectHandoff: rawBlue.immediateArchitectHandoff ?? rawBlue.immediate_architect_handoff ?? false,
      };
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

function parseMasterIdea(json: string | null): MasterIdea | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;

    // Normalize AI field-name variants (camelCase vs snake_case)
    const coreFeatures = (
      (raw.coreFeatures ?? raw.core_features ?? []) as Record<string, unknown>[]
    ).map((f) => ({
      name: (f.name ?? "") as string,
      description: (f.description ?? "") as string,
      addressesFlaws: (f.addressesFlaws ?? f.addresses_flaws ?? []) as string[],
      evidenceAppIds: (f.evidenceAppIds ?? f.evidence_app_ids ?? []) as string[],
      priority: (f.priority ?? "medium") as MasterIdea["coreFeatures"][number]["priority"],
    }));

    const competitorFlaws = (
      (raw.competitorFlaws ?? raw.competitor_flaws ?? []) as Record<string, unknown>[]
    ).map((cf) => {
      const md = (cf.marketData ?? cf.market_data ?? {}) as Record<string, unknown>;
      return {
        competitorAppId: (cf.competitorAppId ?? cf.competitor_app_id ?? "") as string,
        competitorName: (cf.competitorName ?? cf.competitor_name ?? "") as string,
        flaws: (cf.flaws ?? []) as string[],
        featureGaps: (cf.featureGaps ?? cf.feature_gaps ?? []) as string[],
        strengths: (cf.strengths ?? []) as string[],
        marketData: {
          installs: (md.installs ?? "N/A") as string,
          rating: (md.rating ?? 0) as number,
          ratings: (md.ratings ?? 0) as number,
        },
      };
    });

    const rawStrategy = (raw.searchStrategy ?? raw.search_strategy ?? {}) as Record<string, unknown>;

    // Parse optional T3 fields
    const rawDiffBreakdown = (raw.difficultyBreakdown ?? raw.difficulty_breakdown) as Record<string, unknown> | undefined;
    const rawFeasibility = (raw.feasibilityAssessment ?? raw.feasibility_assessment) as Record<string, unknown> | undefined;
    const rawViability = (raw.marketViability ?? raw.market_viability) as Record<string, unknown> | undefined;
    const rawRecommendation = (raw.aiRecommendation ?? raw.ai_recommendation) as Record<string, unknown> | undefined;

    return {
      name: (raw.name ?? "") as string,
      tagline: (raw.tagline ?? "") as string,
      description: (raw.description ?? "") as string,
      originalIdea: (raw.originalIdea ?? raw.original_idea ?? "") as string,
      coreFeatures,
      competitorFlaws,
      uniqueValueProps: (raw.uniqueValueProps ?? raw.unique_value_props ?? []) as string[],
      targetAudience: (raw.targetAudience ?? raw.target_audience ?? "") as string,
      marketOpportunity: (raw.marketOpportunity ?? raw.market_opportunity ?? "") as string,
      estimatedDifficulty: (raw.estimatedDifficulty ?? raw.estimated_difficulty ?? "medium") as MasterIdea["estimatedDifficulty"],
      confidenceScore: (raw.confidenceScore ?? raw.confidence_score ?? 0) as number,
      searchStrategy: {
        queries: (rawStrategy.queries ?? []) as string[],
        categories: (rawStrategy.categories ?? []) as string[],
        reasoning: (rawStrategy.reasoning ?? "") as string,
      },
      ...(rawDiffBreakdown ? {
        difficultyBreakdown: {
          technicalComplexity: (rawDiffBreakdown.technicalComplexity ?? rawDiffBreakdown.technical_complexity ?? "medium") as "low" | "medium" | "high",
          timeToMvp: (rawDiffBreakdown.timeToMvp ?? rawDiffBreakdown.time_to_mvp ?? "") as string,
          teamSize: (rawDiffBreakdown.teamSize ?? rawDiffBreakdown.team_size ?? "") as string,
          keyTechnicalChallenges: (rawDiffBreakdown.keyTechnicalChallenges ?? rawDiffBreakdown.key_technical_challenges ?? []) as string[],
          requiredExpertise: (rawDiffBreakdown.requiredExpertise ?? rawDiffBreakdown.required_expertise ?? []) as string[],
        },
      } : {}),
      ...(rawFeasibility ? {
        feasibilityAssessment: {
          isRealistic: (rawFeasibility.isRealistic ?? rawFeasibility.is_realistic ?? true) as boolean,
          score: (rawFeasibility.score ?? 0) as number,
          reasoning: (rawFeasibility.reasoning ?? "") as string,
          majorBlockers: (rawFeasibility.majorBlockers ?? rawFeasibility.major_blockers ?? []) as string[],
          costEstimate: (rawFeasibility.costEstimate ?? rawFeasibility.cost_estimate ?? "") as string,
        },
      } : {}),
      ...(rawViability ? {
        marketViability: {
          score: (rawViability.score ?? 0) as number,
          willMakeDifference: (rawViability.willMakeDifference ?? rawViability.will_make_difference ?? true) as boolean,
          reasoning: (rawViability.reasoning ?? "") as string,
          revenueModel: (rawViability.revenueModel ?? rawViability.revenue_model ?? "") as string,
          userAcquisitionStrategy: (rawViability.userAcquisitionStrategy ?? rawViability.user_acquisition_strategy ?? "") as string,
          competitiveAdvantageType: (rawViability.competitiveAdvantageType ?? rawViability.competitive_advantage_type ?? "feature") as "feature" | "ux" | "price" | "niche" | "technology",
        },
      } : {}),
      ...(rawRecommendation ? {
        aiRecommendation: {
          verdict: (rawRecommendation.verdict ?? "maybe") as "strong_yes" | "yes" | "maybe" | "no" | "strong_no",
          summary: (rawRecommendation.summary ?? "") as string,
          warnings: (rawRecommendation.warnings ?? []) as string[],
          goNoGoFactors: ((rawRecommendation.goNoGoFactors ?? rawRecommendation.go_no_go_factors ?? []) as Record<string, unknown>[]).map((f) => ({
            factor: (f.factor ?? "") as string,
            assessment: (f.assessment ?? "caution") as "go" | "caution" | "no_go",
            explanation: (f.explanation ?? "") as string,
          })),
        },
      } : {}),
    };
  } catch {
    return null;
  }
}

function parseBlueOcean(json: string | null): BlueOceanResult | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    return {
      isBlueOcean: (raw.isBlueOcean ?? raw.is_blue_ocean ?? false) as boolean,
      confidence: (raw.confidence ?? 0) as number,
      reasoning: (raw.reasoning ?? "") as string,
      adjacentMarkets: (raw.adjacentMarkets ?? raw.adjacent_markets ?? []) as string[],
      risks: (raw.risks ?? []) as string[],
      nextSteps: (raw.nextSteps ?? raw.next_steps ?? []) as string[],
      immediateArchitectHandoff: (raw.immediateArchitectHandoff ?? raw.immediate_architect_handoff ?? false) as boolean,
    };
  } catch {
    return null;
  }
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
      masterIdea: parseMasterIdea(row.masterIdeaJson ?? null),
      blueOcean: parseBlueOcean(row.blueOceanJson ?? null),
      focusText: row.focusText ?? null,
      discoveryAngle: row.discoveryAngle ?? null,
    })
  );
}

export async function getScanById(scanId: string): Promise<Scan | null> {
  validateUUID(scanId, "scanId");
  const rows = await db
    .select()
    .from(scans)
    .where(eq(scans.id, scanId));

  if (rows.length === 0) return null;
  const row = rows[0];

  return {
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
    masterIdea: parseMasterIdea(row.masterIdeaJson ?? null),
    blueOcean: parseBlueOcean(row.blueOceanJson ?? null),
    focusText: row.focusText ?? null,
    discoveryAngle: row.discoveryAngle ?? null,
  };
}

export async function getOpportunitiesByScan(
  scanId: string
): Promise<Opportunity[]> {
  validateUUID(scanId, "scanId");
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
  validateUUID(id, "opportunityId");
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
