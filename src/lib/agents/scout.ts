import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { scans, opportunities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeCategory, scrapeReviews, searchByQuery } from "@/lib/scraper";
import {
  analyzeSentiment,
  analyzeSentimentBatch,
  generateSearchQueries,
  analyzeCompetitorGap,
  detectBlueOcean,
  generateSearchStrategy,
  generateDiscoveryAngle,
  generateDiscoverySearchStrategy,
  synthesizeMasterIdea,
} from "@/lib/ai/scout-prompts";
import type { SearchStrategy } from "@/lib/ai/scout-prompts";
import { cancellableDelay, callAIStructured, SENTIMENT_MODEL } from "@/lib/ai/client";
import { CancelledError } from "@/lib/errors";
import { z } from "zod";
import type {
  AppStore,
  ScrapedApp,
  ScrapedReview,
  ScoutSSEEvent,
  SentimentAnalysis,
  OpportunityScore,
  Opportunity,
  ScoutFilterSettings,
  MasterIdea,
  BlueOceanResult,
} from "@/lib/types";
import { DEFAULT_SCOUT_FILTERS } from "@/lib/types";

// --- Decision trace logging ---
interface TraceEntry {
  phase: string;
  action: string;
  detail: string;
  timestamp: number;
}

// --- Cancel support ---
// Controllers are ALWAYS cleaned up in the `finally` block of each pipeline
// (runScoutPipeline, runScoutIdeaPipeline, runScoutSynthesisPipeline).
// The cancel endpoint (POST /api/scout/cancel) only calls abort() — deletion
// is handled by the pipeline's own finally block to avoid race conditions.
const activeScanControllers = new Map<string, AbortController>();

export function cancelScoutPipeline(scanId: string): boolean {
  const controller = activeScanControllers.get(scanId);
  if (controller) {
    controller.abort();
    return true;
  }
  return false;
}

function checkCancelled(signal: AbortSignal) {
  if (signal.aborted) throw new CancelledError("Scan was cancelled");
}

function parseInstallCount(installs: string): number {
  if (!installs) return 0;
  // Strip the ~ prefix used for estimated install counts (App Store)
  const upper = installs.replace(/^~/, "").toUpperCase().replace(/[,+\s]/g, "");

  // Handle abbreviated formats: 1M, 500K, 10B
  const abbrevMatch = upper.match(/^(\d+(?:\.\d+)?)\s*(B|M|K)$/);
  if (abbrevMatch) {
    const num = parseFloat(abbrevMatch[1]);
    const multiplier = { B: 1_000_000_000, M: 1_000_000, K: 1_000 }[abbrevMatch[2]]!;
    return Math.round(num * multiplier);
  }

  // Plain numeric string
  const cleaned = installs.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

function calculateMarketSize(app: ScrapedApp): number {
  const installs = parseInstallCount(app.installs);
  const ratings = app.ratings;

  // Install thresholds calibrated for 4x multiplier on total star ratings.
  // With accurate estimates: 10k=20, 50k=40, 100k=60, 1M=80, 10M=100
  let installScore: number;
  if (installs >= 10_000_000) installScore = 100;
  else if (installs >= 1_000_000) installScore = 80;
  else if (installs >= 100_000) installScore = 60;
  else if (installs >= 50_000) installScore = 40;
  else if (installs >= 10_000) installScore = 20;
  else installScore = 10;

  // Ratings thresholds with granular tiers for niche apps.
  // Many niche categories (speech coaching, etc.) have <1000 ratings per app,
  // so we need finer gradations below 5K to differentiate them.
  // e.g. Credible (234 ratings) → ~40, Public Speaking with AJ (5 ratings) → ~8
  let ratingScore: number;
  if (ratings >= 5_000) ratingScore = 80;
  else if (ratings >= 1_000) ratingScore = 65;
  else if (ratings >= 500) ratingScore = 50;
  else if (ratings >= 200) ratingScore = 40;
  else if (ratings >= 100) ratingScore = 30;
  else if (ratings >= 50) ratingScore = 22;
  else if (ratings >= 10) ratingScore = 14;
  else ratingScore = 8;

  // Detect unavailable installs (App Store returns "N/A" → parses to 0) and use rating-heavy weighting
  const installsUnavailable = app.installs === "N/A" || parseInstallCount(app.installs) === 0;
  if (installsUnavailable || app.isEstimatedInstalls) {
    return Math.round(installScore * 0.2 + ratingScore * 0.8);
  }
  return Math.round(installScore * 0.6 + ratingScore * 0.4);
}

function calculateDissatisfaction(score: number): number {
  if (score <= 0) return 25; // Unknown/missing score → low (avoid inflating unrated apps)
  // Inverse of score: 1.0 star => 100, 4.0 star => 25, 5.0 star => 0
  // score is 0-5 scale
  return Math.round(Math.max(0, Math.min(100, ((5 - score) / 4) * 100)));
}

const BATCH_SIZE = 5;
const MAX_APPS_TO_PROCESS = 15;
const MAX_SCAN_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours

// --- In-memory category cache (30 min TTL) ---
const CACHE_TTL_MS = 30 * 60 * 1000;
const categoryCache = new Map<string, { apps: ScrapedApp[]; timestamp: number }>();

function getCachedCategory(store: AppStore, category: string): ScrapedApp[] | null {
  const key = `${store}:${category}`;
  const entry = categoryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.apps;
  }
  if (entry) categoryCache.delete(key);
  return null;
}

function setCategoryCache(store: AppStore, category: string, apps: ScrapedApp[]) {
  categoryCache.set(`${store}:${category}`, { apps, timestamp: Date.now() });
}

// Stop words for idea relevance scoring. Includes articles, prepositions, conjunctions,
// auxiliary verbs, pronouns, AND generic action verbs/descriptors that match too many
// app categories (e.g. "improve" appears in guitar, math, memory, language apps).
const IDEA_STOP_WORDS = new Set([
  // Articles, prepositions, conjunctions
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "into", "over", "about", "than", "between",
  // Pronouns and determiners
  "is", "it", "its", "this", "that", "them", "they", "their", "your", "you",
  "we", "our", "who", "what", "which", "each", "other", "those", "these",
  // Auxiliary/common verbs
  "be", "are", "was", "were", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might",
  "shall", "can", "not", "no", "nor",
  // Generic action verbs that appear in nearly every app description
  "help", "helps", "helping", "make", "makes", "making", "find", "give", "take",
  "improve", "improving", "create", "creating", "apply", "applying", "using",
  "provide", "provides", "enable", "enables", "allow", "allows", "keep",
  "learn", "learning", "track", "tracking", "manage", "managing", "build",
  "get", "getting", "want", "need", "start", "turn",
  // Generic descriptors that match too broadly
  "real", "best", "good", "more", "most", "well", "also", "just",
  "very", "even", "only", "some", "many", "like", "such", "new",
  // Common nouns too generic for relevance
  "users", "user", "people", "time", "way", "work", "app", "apps",
  "tool", "tools", "feature", "features", "experience", "data",
]);

/**
 * Keyword overlap between the user's idea and an app's title + description.
 * Returns a score 0-100 representing relevance.
 * Title matches are weighted 3x higher than description matches.
 * Requires minimum absolute matches to prevent false positives from single generic words.
 * Common stop words are aggressively filtered.
 */
function calculateIdeaRelevanceBonus(app: ScrapedApp, ideaText: string): number {
  const ideaWords = new Set(
    ideaText
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !IDEA_STOP_WORDS.has(w))
  );
  if (ideaWords.size === 0) return 0;

  const titleText = app.title.toLowerCase();
  const descText = app.description.toLowerCase();

  let titleMatches = 0;
  let descMatches = 0;
  for (const word of ideaWords) {
    if (titleText.includes(word)) titleMatches++;
    else if (descText.includes(word)) descMatches++;
  }

  const totalMatches = titleMatches + descMatches;

  // Require minimum absolute matches to prevent false positives.
  // A single generic word match (e.g. "speaking" in a language app) should not be enough.
  if (totalMatches < 2) return 0;

  const score = titleMatches * 3 + descMatches;
  // Normalize: max possible = ideaWords.size * 3 (all words in title)
  return Math.min(100, Math.round((score / (ideaWords.size * 3)) * 100));
}

/**
 * Combine user idea text with AI-generated search queries to enrich keyword pool.
 * Made-up app names (e.g. "DermIQ") produce zero useful keywords on their own,
 * but the AI search strategy generates real domain terms ("dermatology", "skincare")
 * that should be used for relevance scoring.
 */
function buildExpandedKeywordText(ideaText: string, searchQueries: string[]): string {
  if (searchQueries.length === 0) return ideaText;
  return ideaText + " " + searchQueries.join(" ");
}

function calculatePreScore(app: ScrapedApp): number {
  const marketSize = calculateMarketSize(app);
  const dissatisfaction = calculateDissatisfaction(app.score);
  // Prioritize apps with proven traction (high installs/ratings) over low-rated apps
  return marketSize * 0.6 + dissatisfaction * 0.4;
}

/**
 * Calculate feature gap score from sentiment analysis.
 * Rewards apps with many unmet feature requests and feature-gap pain points.
 * Monetization complaints are excluded (they validate revenue models, not weaknesses).
 */
function calculateFeatureGapScore(sentiment: SentimentAnalysis): number {
  const demandWeight = { high: 3, medium: 2, low: 1 };
  const severityWeight = { critical: 3, major: 2, minor: 1 };

  // Score from explicit feature requests
  let score = sentiment.featureRequests.reduce(
    (sum, fr) => sum + demandWeight[fr.demand], 0
  );

  // Score from feature_gap pain points (not technical, not monetization)
  // Backward compat: treat missing category as potential feature gap
  score += sentiment.painPoints
    .filter(p => p.category === "feature_gap" || !p.category)
    .reduce((sum, pp) => sum + severityWeight[pp.severity], 0);

  // Normalize to 0-100 (cap at 15 weighted points = 100)
  return Math.min(100, Math.round((score / 15) * 100));
}

/**
 * Deterministic feasibility estimation — replaces the AI-based estimateFeasibility().
 * Evaluates 5 components (UI, Backend, Integrations, Data, Regulatory) using
 * description heuristics, genre signals, and sentiment data.
 * Returns 10-100 score (same scale as the old AI version).
 */
function calculateFeasibility(app: ScrapedApp, sentiment: SentimentAnalysis): number {
  let score = 78; // Base score for an average consumer app
  const desc = (app.description + " " + app.title).toLowerCase();
  const genre = app.genre.toLowerCase();

  // 1. UI Complexity (weight 25%)
  let uiPenalty = 0;
  if (/\b(ar|vr|augmented.?reality|virtual.?reality|3d.?model)/i.test(desc)) uiPenalty = 35;
  else if (/\b(real.?time|live.?stream|video.?call|canvas|draw|paint|animation)/i.test(desc)) uiPenalty = 20;
  else if (/\b(ai.?scan|camera.?detect|ocr|barcode|face.?recog)/i.test(desc)) uiPenalty = 15;
  else if (/\b(custom.?widget|drag.?and.?drop|gesture)/i.test(desc)) uiPenalty = 10;

  // 2. Backend Complexity (weight 25%)
  let backendPenalty = 0;
  if (/\b(social.?network|marketplace|dating|auction|bidding)/i.test(desc)) backendPenalty = 25;
  else if (/\b(real.?time.?sync|multiplayer|collaborative|live.?chat)/i.test(desc)) backendPenalty = 20;
  else if (/\b(ai.?model|machine.?learning|neural|deep.?learn|computer.?vision)/i.test(desc)) backendPenalty = 15;
  else if (/\b(cloud.?sync|push.?notif|messaging)/i.test(desc)) backendPenalty = 8;
  if (/\b(offline|local.?only|no.?internet|standalone)/i.test(desc)) backendPenalty = Math.max(0, backendPenalty - 10);

  // 3. Third-Party Integrations (weight 20%)
  const integrationKeywords = [
    "payment", "stripe", "paypal", "map", "gps", "location", "camera",
    "bluetooth", "health.?kit", "google.?fit", "apple.?watch", "wearable",
    "nfc", "biometric", "siri", "alexa", "smart.?home", "iot",
  ];
  const integrationCount = integrationKeywords.filter(k => new RegExp(k, "i").test(desc)).length;
  const integrationPenalty = Math.min(25, integrationCount * 6);

  // 4. Data/Content Requirements (weight 15%)
  let dataPenalty = 0;
  if (/\b(licensed|copyright|medical.?data|clinical|proprietary.?content)/i.test(desc)) dataPenalty = 20;
  else if (/\b(large.?database|catalog|encyclopedia|dictionary|corpus)/i.test(desc)) dataPenalty = 15;
  else if (/\b(curated|editorial|expert.?content)/i.test(desc)) dataPenalty = 10;

  // 5. Regulatory/Compliance (weight 15%)
  let regulatoryPenalty = 0;
  const riskyGenres = ["medical", "health", "finance", "banking", "insurance", "kids", "children"];
  if (riskyGenres.some(g => genre.includes(g) || desc.includes(g))) regulatoryPenalty = 15;
  if (/\b(hipaa|coppa|fintech|pci.?dss|regulatory|compliance|fda)/i.test(desc)) regulatoryPenalty = 25;

  // 6. Complexity signals from sentiment data
  const technicalPainCount = sentiment.painPoints.filter(p => p.category === "technical").length;
  if (technicalPainCount >= 5) score -= 8; // Many technical issues = complex domain
  else if (technicalPainCount >= 3) score -= 4;

  const highDemandRequests = sentiment.featureRequests.filter(f => f.demand === "high").length;
  if (highDemandRequests > 5) score -= 5; // Many high-demand requests = large scope to match

  // Apply weighted penalties
  const totalPenalty = Math.round(
    uiPenalty * 0.25 +
    backendPenalty * 0.25 +
    integrationPenalty * 0.20 +
    dataPenalty * 0.15 +
    regulatoryPenalty * 0.15
  );

  score -= totalPenalty;
  return Math.max(10, Math.min(100, score));
}

/**
 * Build shared competitor context for reuse by gap analysis and master idea synthesis.
 * Includes feature inventory matrix and pricing data.
 */
function buildCompetitorContext(opportunityResults: Opportunity[]): {
  featureInventoryText: string;
  pricingContext: string;
} {
  // Build feature inventory matrix
  const featureMap = new Map<string, string[]>();
  for (const opp of opportunityResults) {
    const inventory = opp.sentiment.featureInventory ?? [];
    for (const feature of inventory) {
      const normalized = feature.toLowerCase().trim();
      if (!featureMap.has(normalized)) featureMap.set(normalized, []);
      featureMap.get(normalized)!.push(opp.scrapedApp.title);
    }
  }

  const featureEntries = Array.from(featureMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20);

  const featureInventoryText = featureEntries.length > 0
    ? "FEATURE INVENTORY ACROSS COMPETITORS:\n" + featureEntries
        .map(([feature, apps]) => `- "${feature}" (in ${apps.length}/${opportunityResults.length} apps: ${apps.slice(0, 3).join(", ")}${apps.length > 3 ? "..." : ""})`)
        .join("\n")
    : "";

  // Build pricing context
  const pricingEntries = opportunityResults
    .filter(opp => opp.scrapedApp.free !== undefined || opp.scrapedApp.priceText)
    .map(opp => {
      const app = opp.scrapedApp;
      const pricing = app.free === true ? "Free" : app.priceText || "Paid";
      const iap = app.offersIAP ? " (has IAP)" : "";
      return `- "${app.title}": ${pricing}${iap} — ${app.ratings.toLocaleString()} ratings, ${app.score}/5`;
    });

  const pricingContext = pricingEntries.length > 0
    ? "COMPETITOR PRICING DATA:\n" + pricingEntries.join("\n")
    : "";

  return { featureInventoryText, pricingContext };
}

/**
 * Validate a synthesized master idea against the source opportunity data.
 * Returns warnings for ungrounded features, orphaned competitor references,
 * and budget-busting cost estimates.
 */
function validateMasterIdea(masterIdea: MasterIdea, opportunities: Opportunity[]): string[] {
  const warnings: string[] = [];

  // Check that coreFeatures have evidence links
  const ungroundedFeatures = masterIdea.coreFeatures.filter(f =>
    f.addressesFlaws.length === 0 && f.evidenceAppIds.length === 0
  );
  if (ungroundedFeatures.length > 2) {
    warnings.push(`${ungroundedFeatures.length} core features have no evidence links — may be hallucinated`);
  }

  // Check competitorFlaws reference real apps
  const validAppIds = new Set(opportunities.map(o => o.scrapedApp.id));
  const orphanedFlaws = masterIdea.competitorFlaws.filter(cf => !validAppIds.has(cf.competitorAppId));
  if (orphanedFlaws.length > 0) {
    warnings.push(`${orphanedFlaws.length} competitor flaws reference unknown app IDs`);
  }

  // Check feasibility cost
  if (masterIdea.feasibilityAssessment?.costEstimate) {
    const costs = masterIdea.feasibilityAssessment.costEstimate.match(/\$\s*([\d,]+)/g);
    if (costs?.some(c => parseInt(c.replace(/[\$,\s]/g, ''), 10) > 10000)) {
      warnings.push("Cost estimate exceeds $10K solo builder budget");
    }
  }

  return warnings;
}

function filterApps(apps: ScrapedApp[], filters: ScoutFilterSettings): ScrapedApp[] {
  return apps.filter((app) => {
    const installs = parseInstallCount(app.installs);
    const isEstimated = app.installs.startsWith("~");
    // Use a relaxed threshold (50%) for estimated install counts since they have inherent uncertainty
    const effectiveMinInstalls = isEstimated ? Math.round(filters.minInstalls * 0.5) : filters.minInstalls;
    const passesInstalls = installs >= effectiveMinInstalls;
    const passesRating = filters.maxRating >= 5
      ? true
      : (app.score > 0 && app.score <= filters.maxRating);
    const passesRatings = app.ratings >= filters.minRatings;
    return passesInstalls && passesRating && passesRatings;
  });
}

/**
 * AI-powered relevance filter using Haiku. Sends app titles + short descriptions
 * to the model and asks which apps are directly relevant to the user's idea.
 * Apps not mentioned in the response are kept (safety fallback).
 */
async function filterByAIRelevance(
  apps: ScrapedApp[],
  ideaText: string,
  signal?: AbortSignal,
): Promise<ScrapedApp[]> {
  if (apps.length <= 3) return apps;

  const compactList = apps.map((a) => ({
    id: a.id,
    title: a.title,
    desc: a.description.slice(0, 150),
  }));

  const prompt = `Given the app idea: "${ideaText}"

Here are ${compactList.length} apps found during competitor research:

${JSON.stringify(compactList, null, 1)}

Return ONLY the IDs of apps that are directly relevant to this idea (same category or use-case). Be strict:
- A guitar learning app is NOT relevant to a speech coaching idea even if both involve "practice"
- A math app is NOT relevant to a language app even if both involve "learning"
- Only include apps that a user interested in the idea above would consider as real competitors or alternatives

EXCLUDE these types of apps — they are NEVER direct competitors to a utility/tool idea:
- Retail/shopping apps (e.g., Sephora, Ulta, Amazon) — their primary function is purchasing products, not the utility the idea provides
- Brand-specific shopping apps (e.g., e.l.f. Cosmetics, Nike, SHEIN) — these are storefronts, not tool competitors
- Subscription box services (e.g., IPSY, Birchbox, FabFitFun) — curated delivery, not a utility tool
- Entertainment/content apps where the core function is consuming content rather than the utility the idea provides (e.g., a face yoga app is NOT a skincare routine tool)
- Apps from an adjacent but different category (e.g., a makeup tutorial app is NOT a skincare analysis competitor)

Only include apps whose PRIMARY function directly overlaps with the idea's core utility.`;

  try {
    const result = await callAIStructured(
      prompt,
      z.object({ relevantAppIds: z.array(z.string()) }),
      "AIRelevanceFilter",
      "Filter apps by relevance to the user idea",
      signal,
      SENTIMENT_MODEL,
      4096,
      60_000,
    );

    const relevantSet = new Set(result.relevantAppIds);

    // Safety fallback: if an app ID wasn't mentioned at all in the response,
    // include it rather than excluding it (model may have skipped it)
    const allMentionedIds = new Set<string>();
    for (const app of compactList) {
      if (relevantSet.has(app.id)) {
        allMentionedIds.add(app.id);
      }
    }

    const filtered = apps.filter((app) => relevantSet.has(app.id));
    const removed = apps.length - filtered.length;
    console.log(`[scout] AI relevance filter: kept ${filtered.length}/${apps.length} apps (removed ${removed})`);

    // If AI removed everything, return original list
    if (filtered.length === 0) {
      console.warn(`[scout] AI relevance filter removed ALL apps — returning original list`);
      return apps;
    }

    return filtered;
  } catch (error) {
    console.error(
      `[scout] AI relevance filter failed, returning all apps:`,
      error instanceof Error ? error.message : String(error),
    );
    return apps;
  }
}

/**
 * Shared batch processing: fetch reviews, sentiment analysis, feasibility scoring,
 * and store opportunities in DB. Used by both category and idea pipelines.
 */
async function processBatch(
  apps: ScrapedApp[],
  store: AppStore,
  scanId: string,
  sendEvent: (event: ScoutSSEEvent) => void,
  signal: AbortSignal,
  progressOffset: number,
  progressRange: number,
): Promise<Opportunity[]> {
  const totalSteps = apps.length;
  let completedSteps = 0;
  const opportunityResults: Opportunity[] = [];

  for (let batchStart = 0; batchStart < apps.length; batchStart += BATCH_SIZE) {
    checkCancelled(signal);

    const batch = apps.slice(batchStart, batchStart + BATCH_SIZE);

    try {
      // Phase 1: Fetch reviews for all apps in the batch (parallel)
      const batchReviews: { app: ScrapedApp; reviews: ScrapedReview[] }[] = [];

      sendEvent({
        type: "progress",
        stage: "reviews",
        message: `Fetching reviews for ${batch.length} app(s)...`,
        progress: Math.round(
          totalSteps > 0 ? progressOffset + (completedSteps / totalSteps) * progressRange : progressOffset
        ),
      });

      const reviewResults = await Promise.allSettled(
        batch.map((app) => scrapeReviews(store, app.id, 50))
      );
      checkCancelled(signal);

      for (let ri = 0; ri < batch.length; ri++) {
        const result = reviewResults[ri];
        if (result.status === "fulfilled" && result.value.length > 0) {
          // reviewCount = number of reviews actually fetched (best available approximation).
          // Enrichment no longer sets reviewCount — it only sets ratings (total star ratings).
          const appWithReviewCount = {
            ...batch[ri],
            reviewCount: result.value.length,
          };
          batchReviews.push({ app: appWithReviewCount, reviews: result.value });
        } else {
          if (result.status === "rejected") {
            console.error(
              `Failed to fetch reviews for "${batch[ri].title}":`,
              result.reason instanceof Error ? result.reason.message : String(result.reason)
            );
          }
          // Include apps with no reviews using default sentiment (instead of skipping)
          if (!batchReviews.some(br => br.app.id === batch[ri].id)) {
            batchReviews.push({ app: batch[ri], reviews: [] });
          }
        }
      }

      if (batchReviews.length === 0) {
        continue;
      }

      // Phase 2: Batch sentiment analysis
      sendEvent({
        type: "progress",
        stage: "analysis",
        message: `Analyzing sentiment for batch of ${batchReviews.length} app(s)...`,
        progress: Math.round(
          progressOffset + (completedSteps / totalSteps) * progressRange + 10
        ),
      });

      // Separate apps with reviews from those without for sentiment analysis
      const appsWithReviews: { app: ScrapedApp; reviews: ScrapedReview[]; originalIndex: number }[] = [];
      const appsWithoutReviews: { app: ScrapedApp; originalIndex: number }[] = [];
      for (let bi = 0; bi < batchReviews.length; bi++) {
        if (batchReviews[bi].reviews.length > 0) {
          appsWithReviews.push({ app: batchReviews[bi].app, reviews: batchReviews[bi].reviews, originalIndex: bi });
        } else {
          appsWithoutReviews.push({ app: batchReviews[bi].app, originalIndex: bi });
        }
      }

      // Only call AI sentiment for apps that have reviews
      const sentiments: SentimentAnalysis[] = new Array(batchReviews.length);

      if (appsWithReviews.length > 0) {
        const sentimentInputs = appsWithReviews.map((item) => ({
          reviews: item.reviews,
          appTitle: item.app.title,
        }));

        const aiSentiments = await analyzeSentimentBatch(sentimentInputs, signal);
        checkCancelled(signal);

        // Place AI sentiments at their original indices
        for (let si = 0; si < appsWithReviews.length; si++) {
          sentiments[appsWithReviews[si].originalIndex] = aiSentiments[si];
        }
      }

      // Assign default sentiment for apps with no reviews
      for (const noReview of appsWithoutReviews) {
        sentiments[noReview.originalIndex] = {
          overallSentiment: "mixed",
          painPoints: [],
          featureRequests: [],
          praisedAspects: [],
          featureInventory: [],
          summary: `No reviews available for analysis. App has ${noReview.app.ratings} ratings with a score of ${noReview.app.score}/5.`,
        };
      }

      // Quality gate: detect if too many apps got default sentiment
      const defaultCount = sentiments.filter(
        (s) => s.painPoints.length === 0 && s.featureRequests.length === 0
      ).length;
      const batchQuality = batchReviews.length > 0 ? 1 - (defaultCount / batchReviews.length) : 1;

      console.log(`[scout-quality] sentiment_batch: ${defaultCount}/${batchReviews.length} default sentiments (quality: ${(batchQuality * 100).toFixed(0)}%)`);

      // If >50% of batch has no substantive data, try aggressive review fetching for those apps
      if (batchQuality < 0.5 && defaultCount > 0) {
        console.log(`[scout] Low batch quality (${(batchQuality * 100).toFixed(0)}%). Retrying review fetch for ${defaultCount} apps with higher limit...`);
        const defaultIndices = sentiments
          .map((s, i) => (s.painPoints.length === 0 && s.featureRequests.length === 0) ? i : -1)
          .filter((i) => i >= 0);

        for (const idx of defaultIndices) {
          try {
            const reviews = await scrapeReviews(store, batchReviews[idx].app.id, 100);
            if (reviews.length > 0) {
              const reSentiment = await analyzeSentiment(reviews, batchReviews[idx].app.title, signal);
              sentiments[idx] = reSentiment;
              batchReviews[idx].reviews = reviews;
              console.log(`[scout-quality] reroute_success: Re-fetched ${reviews.length} reviews for "${batchReviews[idx].app.title}"`);
            }
          } catch (e) {
            console.warn(`[scout] Reroute failed for "${batchReviews[idx].app.title}":`, e instanceof Error ? e.message : String(e));
          }
        }
      }

      // Phase 3: Feasibility + scoring (deterministic — no AI calls needed)
      sendEvent({
        type: "progress",
        stage: "feasibility",
        message: `Scoring ${batchReviews.length} app(s)...`,
        progress: Math.round(
          totalSteps > 0 ? progressOffset + (completedSteps / totalSteps) * progressRange + 20 : progressOffset + 20
        ),
      });

      for (let fi = 0; fi < batchReviews.length; fi++) {
        const { app, reviews } = batchReviews[fi];
        const sentiment: SentimentAnalysis = sentiments[fi];

        try {
          const feasibilityScore = calculateFeasibility(app, sentiment);
          const marketSize = calculateMarketSize(app);
          const dissatisfaction = calculateDissatisfaction(app.score);
          const featureGapScore = calculateFeatureGapScore(sentiment);
          const composite = Math.round(
            marketSize * 0.25 + featureGapScore * 0.35 + feasibilityScore * 0.25 + dissatisfaction * 0.15
          );

            const opportunityScore: OpportunityScore = {
              marketSize,
              dissatisfaction,
              feasibility: feasibilityScore,
              featureGapScore,
              compositeScore: composite,
            };

            const opportunityId = uuidv4();
            const opportunityCreatedAt = new Date().toISOString();

            await db.insert(opportunities).values({
              id: opportunityId,
              scanId,
              appId: app.id,
              title: app.title,
              store: app.store,
              genre: app.genre,
              score: app.score,
              ratings: app.ratings,
              reviewCount: app.reviewCount ?? null,
              installs: app.installs,
              description: app.description,
              icon: app.icon,
              url: app.url,
              developer: app.developer,
              price: app.price ?? null,
              free: app.free ?? null,
              offersIAP: app.offersIAP ?? null,
              priceText: app.priceText ?? null,
              histogramJson: app.histogram ? JSON.stringify(app.histogram) : null,
              sentimentJson: JSON.stringify(sentiment),
              reviewsJson: JSON.stringify(reviews),
              marketSize: opportunityScore.marketSize,
              dissatisfaction: opportunityScore.dissatisfaction,
              feasibility: opportunityScore.feasibility,
              featureGapScore: opportunityScore.featureGapScore,
              compositeScore: opportunityScore.compositeScore,
              dataConfidence: app.dataConfidence ?? null,
              createdAt: opportunityCreatedAt,
            });
            checkCancelled(signal);

            const opportunity: Opportunity = {
              id: opportunityId,
              scrapedApp: app,
              reviews,
              sentiment,
              score: opportunityScore,
              scanId,
              createdAt: opportunityCreatedAt,
              gapAnalysis: null,
              blueOcean: null,
            };

            opportunityResults.push(opportunity);
            sendEvent({ type: "opportunity", opportunity });
          } catch (error) {
            console.error(
              `Failed to store opportunity for "${app.title}":`,
              error instanceof Error ? error.message : String(error)
            );
          }

          completedSteps++;
        }
    } catch (error) {
      console.error(
        `Failed to process batch starting at index ${batchStart}:`,
        error instanceof Error ? error.message : String(error)
      );
      for (const app of batch) {
        const alreadyCounted = opportunityResults.some(
          (o) => o.scrapedApp.id === app.id
        );
        if (!alreadyCounted) {
          completedSteps++;
        }
      }
    }
  }

  // Anti-clustering normalization: if >50% of opportunities share the same feasibility score,
  // spread them using the composite score as a tiebreaker
  if (opportunityResults.length >= 4) {
    const feasCounts = new Map<number, number>();
    for (const opp of opportunityResults) {
      const f = opp.score.feasibility;
      feasCounts.set(f, (feasCounts.get(f) ?? 0) + 1);
    }
    const maxCluster = Math.max(...feasCounts.values());
    if (maxCluster > opportunityResults.length * 0.5) {
      console.log(`[scout] Feasibility anti-clustering: ${maxCluster}/${opportunityResults.length} apps share a score, applying spread`);
      // Sort by composite score (descending) and reassign feasibility with spread
      const sorted = [...opportunityResults].sort((a, b) => b.score.compositeScore - a.score.compositeScore);
      const minFeas = Math.min(...sorted.map(o => o.score.feasibility));
      const maxFeas = Math.max(...sorted.map(o => o.score.feasibility));
      const range = Math.max(maxFeas - minFeas, 20); // Ensure at least 20-point spread
      const step = range / Math.max(sorted.length - 1, 1);
      const updates: { id: string; feasibility: number; compositeScore: number }[] = [];
      for (let i = 0; i < sorted.length; i++) {
        const newFeas = Math.round(maxFeas - i * step);
        const opp = sorted[i];
        opp.score.feasibility = Math.max(10, Math.min(100, newFeas));
        // Recalculate composite score with updated weights
        opp.score.compositeScore = Math.round(
          opp.score.marketSize * 0.25 + opp.score.featureGapScore * 0.35 + opp.score.feasibility * 0.25 + opp.score.dissatisfaction * 0.15
        );
        updates.push({ id: opp.id, feasibility: opp.score.feasibility, compositeScore: opp.score.compositeScore });
      }
      // Persist anti-clustered scores back to DB
      for (const u of updates) {
        await db.update(opportunities)
          .set({ feasibility: u.feasibility, compositeScore: u.compositeScore })
          .where(eq(opportunities.id, u.id));
      }
    }
  }

  return opportunityResults;
}

export async function runScoutPipeline(
  store: AppStore,
  category: string,
  sendEvent: (event: ScoutSSEEvent) => void,
  filters: ScoutFilterSettings = DEFAULT_SCOUT_FILTERS
): Promise<void> {
  const scanId = uuidv4();
  const scanStartTime = Date.now();
  const now = new Date().toISOString();

  const abortController = new AbortController();
  activeScanControllers.set(scanId, abortController);
  const { signal } = abortController;

  await db.insert(scans).values({
    id: scanId,
    store,
    category,
    status: "running",
    totalAppsScraped: 0,
    totalOpportunities: 0,
    createdAt: now,
  });

  sendEvent({ type: "scan_started", scanId });

  const trace: TraceEntry[] = [];
  function addTrace(phase: string, action: string, detail: string) {
    trace.push({ phase, action, detail, timestamp: Date.now() });
    console.log(`[scout-trace] [${phase}] ${action}: ${detail}`);
  }

  sendEvent({
    type: "progress",
    stage: "scraping",
    message: `Starting scan for ${category} on ${store === "google_play" ? "Google Play" : "App Store"}...`,
    progress: 5,
  });

  try {
    sendEvent({
      type: "progress",
      stage: "scraping",
      message: "Fetching top apps from store...",
      progress: 10,
    });

    let apps: ScrapedApp[];
    const cached = getCachedCategory(store, category);
    if (cached) {
      apps = cached;
      console.log(`[scout] Using cached ${apps.length} apps for ${store}:${category}`);
    } else {
      apps = await scrapeCategory(store, category);
      checkCancelled(signal);
      setCategoryCache(store, category, apps);
    }

    addTrace("search", "category_scrape", `Scraped ${apps.length} apps from ${store}:${category}`);
    console.log(`[scout] Scraped ${apps.length} apps from ${store}`);
    if (apps.length > 0) {
      const sample = apps.slice(0, 3);
      for (const s of sample) {
        console.log(`[scout]   Sample: "${s.title}" — score=${s.score}, ratings=${s.ratings}, installs=${s.installs}, store=${s.store}`);
      }
    }

    sendEvent({
      type: "progress",
      stage: "scraping",
      message: `Found ${apps.length} apps. Filtering candidates...`,
      progress: 20,
    });

    for (const app of apps) {
      sendEvent({ type: "app_found", app });
    }

    await db
      .update(scans)
      .set({ totalAppsScraped: apps.length })
      .where(eq(scans.id, scanId));

    const filtered = filterApps(apps, filters);

    if (filtered.length === 0 && apps.length > 0) {
      console.warn(`[scout] All ${apps.length} apps were filtered out! Filter settings: minInstalls=${filters.minInstalls}, maxRating=${filters.maxRating}, minRatings=${filters.minRatings}`);
      for (const app of apps.slice(0, 5)) {
        const installs = parseInstallCount(app.installs);
        const passesInstalls = app.store === "app_store" || installs >= filters.minInstalls;
        const passesRating = filters.maxRating >= 5 ? true : (app.score > 0 && app.score <= filters.maxRating);
        const passesRatings = app.ratings >= filters.minRatings;
        console.warn(`[scout]   "${app.title}": installs=${installs}(${passesInstalls ? 'PASS' : 'FAIL'}), score=${app.score}(${passesRating ? 'PASS' : 'FAIL'}), ratings=${app.ratings}(${passesRatings ? 'PASS' : 'FAIL'})`);
      }
      sendEvent({
        type: "progress",
        stage: "filtering",
        message: `Warning: 0 apps passed filters. Check console for diagnostics. Raw apps had scores like: ${apps.slice(0, 3).map(a => a.score).join(', ')}`,
        progress: 25,
      });
    }

    const totalCandidates = filtered.length;
    filtered.sort((a, b) => calculatePreScore(b) - calculatePreScore(a));
    const topApps = filtered.slice(0, MAX_APPS_TO_PROCESS);

    addTrace("filter", "candidates", `${topApps.length} top apps from ${totalCandidates} filtered candidates`);
    console.log(`[scout] Pre-ranked ${totalCandidates} candidates, processing top ${topApps.length}`);

    const installsLabel =
      filters.minInstalls >= 1_000_000
        ? `${filters.minInstalls / 1_000_000}M`
        : `${filters.minInstalls / 1_000}K`;

    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Top ${topApps.length} of ${totalCandidates} candidates match criteria (installs >= ${installsLabel}, rating <= ${filters.maxRating}, ratings >= ${filters.minRatings})`,
      progress: 25,
    });

    const opportunityResults = await processBatch(
      topApps,
      store,
      scanId,
      sendEvent,
      signal,
      25,
      65,
    );

    // Cross-step validation: check sentiment category distribution
    if (opportunityResults.length > 0) {
      const allPainPoints = opportunityResults.flatMap(o => o.sentiment.painPoints);
      const categories = { technical: 0, feature_gap: 0, monetization: 0, uncategorized: 0 };
      for (const pp of allPainPoints) {
        const cat = pp.category ?? "uncategorized";
        if (cat in categories) categories[cat as keyof typeof categories]++;
        else categories.uncategorized++;
      }
      const total = allPainPoints.length;
      if (total > 0) {
        addTrace("validation", "sentiment_distribution",
          `technical=${categories.technical}(${Math.round(categories.technical/total*100)}%), ` +
          `feature_gap=${categories.feature_gap}(${Math.round(categories.feature_gap/total*100)}%), ` +
          `monetization=${categories.monetization}(${Math.round(categories.monetization/total*100)}%)`
        );
      }
    }

    // Pipeline quality summary
    const qualitySummary = {
      totalApps: opportunityResults.length,
      avgComposite: opportunityResults.length > 0
        ? Math.round(opportunityResults.reduce((s, o) => s + o.score.compositeScore, 0) / opportunityResults.length)
        : 0,
      defaultSentimentCount: opportunityResults.filter(o =>
        o.sentiment.painPoints.length === 0 && o.sentiment.featureRequests.length === 0
      ).length,
    };
    addTrace("summary", "pipeline_quality", JSON.stringify(qualitySummary));

    // Persist trace
    try {
      await db.update(scans).set({ traceJson: JSON.stringify(trace) }).where(eq(scans.id, scanId));
    } catch (e) {
      console.error("[scout] Failed to persist trace:", e);
    }

    await db
      .update(scans)
      .set({
        status: "completed",
        totalOpportunities: opportunityResults.length,
        completedAt: new Date().toISOString(),
      })
      .where(eq(scans.id, scanId));

    sendEvent({
      type: "complete",
      scanId,
      totalOpportunities: opportunityResults.length,
    });
  } catch (error) {
    if (error instanceof CancelledError || signal.aborted) {
      await db
        .update(scans)
        .set({
          status: "cancelled",
          completedAt: new Date().toISOString(),
        })
        .where(eq(scans.id, scanId));

      sendEvent({ type: "cancelled", scanId });
    } else {
      await db
        .update(scans)
        .set({
          status: "failed",
          completedAt: new Date().toISOString(),
        })
        .where(eq(scans.id, scanId));

      sendEvent({
        type: "error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  } finally {
    activeScanControllers.delete(scanId);
  }
}

export async function runScoutIdeaPipeline(
  store: AppStore,
  ideaText: string,
  sendEvent: (event: ScoutSSEEvent) => void,
  filters: ScoutFilterSettings = DEFAULT_SCOUT_FILTERS
): Promise<void> {
  const scanId = uuidv4();
  const now = new Date().toISOString();

  const abortController = new AbortController();
  activeScanControllers.set(scanId, abortController);
  const { signal } = abortController;

  // Step 1: Create scan record with idea mode
  await db.insert(scans).values({
    id: scanId,
    store,
    category: "idea-validation",
    status: "running",
    totalAppsScraped: 0,
    totalOpportunities: 0,
    createdAt: now,
    mode: "idea",
    ideaText,
  });

  sendEvent({ type: "scan_started", scanId });

  const trace: TraceEntry[] = [];
  function addTrace(phase: string, action: string, detail: string) {
    trace.push({ phase, action, detail, timestamp: Date.now() });
    console.log(`[scout-trace] [${phase}] ${action}: ${detail}`);
  }

  sendEvent({
    type: "progress",
    stage: "generating_queries",
    message: "Analyzing your app idea and generating search queries...",
    progress: 5,
  });

  try {
    // Step 2: Generate search queries from the idea
    const queries = await generateSearchQueries(ideaText, store, signal);
    checkCancelled(signal);

    sendEvent({ type: "idea_queries_generated", queries });

    sendEvent({
      type: "progress",
      stage: "searching",
      message: `Generated ${queries.length} search queries. Searching for competitors...`,
      progress: 15,
    });

    // Step 3: Search queries in parallel (3 at a time) and collect/deduplicate apps
    const allAppsMap = new Map<string, ScrapedApp>();
    const SEARCH_CONCURRENCY = 5;

    for (let chunkStart = 0; chunkStart < queries.length; chunkStart += SEARCH_CONCURRENCY) {
      checkCancelled(signal);
      const chunk = queries.slice(chunkStart, chunkStart + SEARCH_CONCURRENCY);

      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Searching queries ${chunkStart + 1}-${Math.min(chunkStart + SEARCH_CONCURRENCY, queries.length)} of ${queries.length}...`,
        progress: Math.round(15 + (chunkStart / queries.length) * 20),
      });

      for (let ci = 0; ci < chunk.length; ci++) {
        sendEvent({
          type: "idea_searching",
          query: chunk[ci],
          queryIndex: chunkStart + ci,
          totalQueries: queries.length,
        });
      }

      const searchResults = await Promise.allSettled(
        chunk.map((query) => searchByQuery(store, query))
      );

      for (let si = 0; si < searchResults.length; si++) {
        const result = searchResults[si];
        if (result.status === "fulfilled") {
          for (const app of result.value) {
            if (!allAppsMap.has(app.id)) {
              allAppsMap.set(app.id, app);
            }
          }
        } else {
          console.error(
            `[scout-idea] Search failed for query "${chunk[si]}":`,
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          );
        }
      }
    }

    let allApps = Array.from(allAppsMap.values());
    addTrace("dedup", "merged", `${allApps.length} unique from ${queries.length} queries`);
    console.log(`[scout-idea] Found ${allApps.length} unique apps from ${queries.length} queries`);

    // AI relevance filter: use Haiku to remove clearly irrelevant apps
    const beforeFilter = allApps.length;
    allApps = await filterByAIRelevance(allApps, ideaText, signal);
    checkCancelled(signal);
    addTrace("filter", "ai_relevance", `Kept ${allApps.length}/${beforeFilter}`);

    // Feedback loop: if too few apps passed relevance filter, broaden search
    if (allApps.length < 5 && allApps.length > 0) {
      console.log(`[scout] Only ${allApps.length} apps passed relevance filter. Broadening search...`);
      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Only ${allApps.length} relevant apps found. Running expanded search...`,
        progress: 33,
      });

      try {
        const broaderQueries = await generateSearchQueries(ideaText, store, signal);
        checkCancelled(signal);
        const existingQueries = new Set(queries);
        const newQueries = broaderQueries.filter(q => !existingQueries.has(q)).slice(0, 5);
        addTrace("search", "broadening", `Generated ${newQueries.length} new queries from ${broaderQueries.length} broader queries`);

        for (const query of newQueries) {
          checkCancelled(signal);
          try {
            const results = await searchByQuery(store, query);
            addTrace("search", "results", `Query "${query}" returned ${results.length} apps`);
            for (const app of results) {
              if (!allAppsMap.has(app.id)) {
                allAppsMap.set(app.id, app);
              }
            }
          } catch (e) {
            console.error(`[scout] Broader search failed for "${query}":`, e instanceof Error ? e.message : String(e));
          }
        }

        const expandedApps = Array.from(allAppsMap.values());
        allApps = await filterByAIRelevance(expandedApps, ideaText, signal);
        addTrace("filter", "ai_relevance_broadened", `After broadening: ${allApps.length} apps`);
        console.log(`[scout] After broadening: ${allApps.length} apps`);
      } catch (e) {
        console.error("[scout] Search broadening failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // Notify about each discovered app
    for (const app of allApps) {
      sendEvent({ type: "app_found", app });
    }

    // Update scan with total scraped
    await db
      .update(scans)
      .set({ totalAppsScraped: allApps.length })
      .where(eq(scans.id, scanId));

    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Found ${allApps.length} unique apps. Filtering and ranking...`,
      progress: 35,
    });

    // Step 4: Filter + rank using existing filter logic with idea relevance bonus
    const filtered = filterApps(allApps, filters);

    // Compute relevance and filter out apps with no meaningful keyword overlap
    const withRelevance = filtered.map((app) => ({
      app,
      relevance: calculateIdeaRelevanceBonus(app, ideaText),
      preScore: calculatePreScore(app),
    }));

    let relevant = withRelevance.filter((item) => item.relevance >= 10);
    if (relevant.length < 3) {
      // Fallback: sort all by relevance and take top N
      relevant = [...withRelevance].sort((a, b) => b.relevance - a.relevance).slice(0, MAX_APPS_TO_PROCESS);
    }

    relevant.sort((a, b) => {
      const aScore = a.preScore * 0.5 + a.relevance * 0.5;
      const bScore = b.preScore * 0.5 + b.relevance * 0.5;
      return bScore - aScore;
    });
    const topApps = relevant.slice(0, MAX_APPS_TO_PROCESS).map((item) => item.app);

    console.log(`[scout-idea] Filtered to ${filtered.length} candidates (${relevant.length} relevant), processing top ${topApps.length}`);

    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Processing top ${topApps.length} of ${filtered.length} matching apps...`,
      progress: 40,
    });

    // Step 5: Process apps through the shared batch pipeline
    const opportunityResults = await processBatch(
      topApps,
      store,
      scanId,
      sendEvent,
      signal,
      40,
      40,
    );

    // Step 6: Gap analysis (if competitors found)
    if (opportunityResults.length > 0) {
      sendEvent({
        type: "progress",
        stage: "gap_analysis",
        message: "Analyzing competitive gaps against your idea...",
        progress: 82,
      });

      try {
        const gapAnalysis = await analyzeCompetitorGap(ideaText, opportunityResults, signal);
        checkCancelled(signal);

        sendEvent({ type: "gap_analysis", gapAnalysis });

        // Persist gap analysis on the scan record (scan-level, not per-opportunity)
        const gapJson = JSON.stringify(gapAnalysis);
        await db.update(scans).set({ gapAnalysisJson: gapJson }).where(eq(scans.id, scanId));
        // Set in memory for downstream pipeline use
        for (const opp of opportunityResults) {
          opp.gapAnalysis = gapAnalysis;
        }
      } catch (error) {
        console.error(
          "[scout-idea] Gap analysis failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Step 7: Blue ocean detection (if few competitors)
    if (opportunityResults.length < 3) {
      sendEvent({
        type: "progress",
        stage: "blue_ocean",
        message: "Few competitors found. Assessing blue ocean opportunity...",
        progress: 90,
      });

      try {
        const blueOcean = await detectBlueOcean(ideaText, opportunityResults.length, queries, signal);
        checkCancelled(signal);

        sendEvent({ type: "blue_ocean", blueOcean });

        // Persist blue ocean on the scan record
        await db.update(scans).set({ blueOceanJson: JSON.stringify(blueOcean) }).where(eq(scans.id, scanId));

        // Update opportunities with blue ocean data
        const blueOceanJson = JSON.stringify(blueOcean);
        for (const opp of opportunityResults) {
          await db
            .update(opportunities)
            .set({ blueOceanJson })
            .where(eq(opportunities.id, opp.id));
          opp.blueOcean = blueOcean;
        }
      } catch (error) {
        console.error(
          "[scout-idea] Blue ocean detection failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Cross-step validation: check sentiment category distribution
    if (opportunityResults.length > 0) {
      const allPainPoints = opportunityResults.flatMap(o => o.sentiment.painPoints);
      const categories = { technical: 0, feature_gap: 0, monetization: 0, uncategorized: 0 };
      for (const pp of allPainPoints) {
        const cat = pp.category ?? "uncategorized";
        if (cat in categories) categories[cat as keyof typeof categories]++;
        else categories.uncategorized++;
      }
      const total = allPainPoints.length;
      if (total > 0) {
        addTrace("validation", "sentiment_distribution",
          `technical=${categories.technical}(${Math.round(categories.technical/total*100)}%), ` +
          `feature_gap=${categories.feature_gap}(${Math.round(categories.feature_gap/total*100)}%), ` +
          `monetization=${categories.monetization}(${Math.round(categories.monetization/total*100)}%)`
        );
      }
    }

    // Persist trace
    try {
      await db.update(scans).set({ traceJson: JSON.stringify(trace) }).where(eq(scans.id, scanId));
    } catch (e) {
      console.error("[scout] Failed to persist trace:", e);
    }

    // Complete
    await db
      .update(scans)
      .set({
        status: "completed",
        totalOpportunities: opportunityResults.length,
        completedAt: new Date().toISOString(),
      })
      .where(eq(scans.id, scanId));

    sendEvent({
      type: "complete",
      scanId,
      totalOpportunities: opportunityResults.length,
    });
  } catch (error) {
    if (error instanceof CancelledError || signal.aborted) {
      await db
        .update(scans)
        .set({
          status: "cancelled",
          completedAt: new Date().toISOString(),
        })
        .where(eq(scans.id, scanId));

      sendEvent({ type: "cancelled", scanId });
    } else {
      await db
        .update(scans)
        .set({
          status: "failed",
          completedAt: new Date().toISOString(),
        })
        .where(eq(scans.id, scanId));

      sendEvent({
        type: "error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  } finally {
    activeScanControllers.delete(scanId);
  }
}

// ============================================
// Synthesis Pipeline — AI-driven competitor analysis + Master Idea generation
// ============================================

export async function runScoutSynthesisPipeline(
  store: AppStore,
  ideaText: string,
  sendEvent: (event: ScoutSSEEvent) => void,
  filterOverrides?: ScoutFilterSettings | null,
): Promise<void> {
  const scanId = uuidv4();
  const now = new Date().toISOString();

  const abortController = new AbortController();
  activeScanControllers.set(scanId, abortController);
  const { signal } = abortController;

  // Step 1: Create scan record
  await db.insert(scans).values({
    id: scanId,
    store,
    category: "synthesis",
    status: "running",
    totalAppsScraped: 0,
    totalOpportunities: 0,
    createdAt: now,
    mode: "synthesis",
    ideaText,
  });

  sendEvent({ type: "scan_started", scanId });

  const trace: TraceEntry[] = [];
  function addTrace(phase: string, action: string, detail: string) {
    trace.push({ phase, action, detail, timestamp: Date.now() });
    console.log(`[scout-trace] [${phase}] ${action}: ${detail}`);
  }

  sendEvent({
    type: "progress",
    stage: "search_strategy",
    message: "Generating AI search strategy for your idea...",
    progress: 5,
  });

  try {
    let blueOcean: BlueOceanResult | undefined;

    // Step 2: Generate search strategy via AI
    const strategy = await generateSearchStrategy(ideaText, store, signal);
    checkCancelled(signal);

    // Clamp AI-suggested filters to prevent overly strict filtering
    const aiFilters: ScoutFilterSettings = filterOverrides ?? {
      minInstalls: Math.min(strategy.filters.minInstalls, 100_000),
      maxRating: Math.min(strategy.filters.maxRating, 5),
      minRatings: Math.min(strategy.filters.minRatings, 500),
    };

    sendEvent({
      type: "search_strategy",
      strategy: {
        queries: strategy.queries,
        categories: strategy.categories,
        reasoning: strategy.reasoning,
        filters: aiFilters,
      },
    });

    sendEvent({
      type: "progress",
      stage: "searching",
      message: `Search strategy ready: ${strategy.queries.length} queries, ${strategy.categories.length} categories. Searching...`,
      progress: 15,
    });

    // Step 3: Search queries in parallel
    const allAppsMap = new Map<string, ScrapedApp>();
    const SEARCH_CONCURRENCY = 5;

    for (let chunkStart = 0; chunkStart < strategy.queries.length; chunkStart += SEARCH_CONCURRENCY) {
      checkCancelled(signal);
      const chunk = strategy.queries.slice(chunkStart, chunkStart + SEARCH_CONCURRENCY);

      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Searching queries ${chunkStart + 1}-${Math.min(chunkStart + SEARCH_CONCURRENCY, strategy.queries.length)} of ${strategy.queries.length}...`,
        progress: Math.round(15 + (chunkStart / strategy.queries.length) * 10),
      });

      for (let ci = 0; ci < chunk.length; ci++) {
        sendEvent({
          type: "idea_searching",
          query: chunk[ci],
          queryIndex: chunkStart + ci,
          totalQueries: strategy.queries.length,
        });
      }

      const searchResults = await Promise.allSettled(
        chunk.map((query) => searchByQuery(store, query))
      );

      for (let si = 0; si < searchResults.length; si++) {
        const result = searchResults[si];
        if (result.status === "fulfilled") {
          for (const app of result.value) {
            if (!allAppsMap.has(app.id)) {
              allAppsMap.set(app.id, app);
            }
          }
        } else {
          console.error(
            `[scout-synthesis] Search failed for query "${chunk[si]}":`,
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          );
        }
      }
    }

    // Record which app IDs came from search queries (vs category scraping)
    const searchAppIds = new Set(allAppsMap.keys());

    // Step 4: Scrape AI-suggested categories, merge & deduplicate
    if (strategy.categories.length > 0) {
      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Scraping ${strategy.categories.length} AI-suggested categories...`,
        progress: 28,
      });

      const categoryResults = await Promise.allSettled(
        strategy.categories.map((cat) => {
          const cached = getCachedCategory(store, cat);
          if (cached) return Promise.resolve(cached);
          return scrapeCategory(store, cat).then((apps) => {
            setCategoryCache(store, cat, apps);
            return apps;
          });
        })
      );

      for (const result of categoryResults) {
        if (result.status === "fulfilled") {
          for (const app of result.value) {
            if (!allAppsMap.has(app.id)) {
              allAppsMap.set(app.id, app);
            }
          }
        }
      }
    }

    // Pre-filter: remove apps with low relevance to the idea.
    // Search-sourced apps are trusted (AI-generated queries are already semantically
    // relevant) — downstream filterByAIRelevance() catches genuinely unrelated results.
    // Category-sourced apps are scored against expanded keywords (idea + query terms)
    // so made-up app names don't kill all matches.
    const expandedText = buildExpandedKeywordText(ideaText, strategy.queries);
    for (const [appId, app] of allAppsMap) {
      if (searchAppIds.has(appId)) {
        continue; // trust AI search query relevance; filterByAIRelevance handles noise
      }
      // Category-sourced: require moderate relevance against expanded keywords
      const relevance = calculateIdeaRelevanceBonus(app, expandedText);
      if (relevance < 8) {
        allAppsMap.delete(appId);
      }
    }

    let allApps = Array.from(allAppsMap.values());
    addTrace("dedup", "merged", `${allApps.length} unique from ${strategy.queries.length} queries + ${strategy.categories.length} categories`);
    console.log(`[scout-synthesis] Found ${allApps.length} unique apps from ${strategy.queries.length} queries + ${strategy.categories.length} categories`);

    // AI relevance filter: use Haiku to remove clearly irrelevant apps
    const beforeFilter = allApps.length;
    allApps = await filterByAIRelevance(allApps, ideaText, signal);
    checkCancelled(signal);
    addTrace("filter", "ai_relevance", `Kept ${allApps.length}/${beforeFilter}`);

    // Feedback loop: if too few apps passed relevance filter, broaden search
    if (allApps.length < 5 && allApps.length > 0) {
      console.log(`[scout] Only ${allApps.length} apps passed relevance filter. Broadening search...`);
      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Only ${allApps.length} relevant apps found. Running expanded search...`,
        progress: 33,
      });

      try {
        const broaderQueries = await generateSearchQueries(ideaText, store, signal);
        checkCancelled(signal);
        const existingQueries = new Set(strategy.queries);
        const newQueries = broaderQueries.filter(q => !existingQueries.has(q)).slice(0, 5);
        addTrace("search", "broadening", `Generated ${newQueries.length} new queries from ${broaderQueries.length} broader queries`);

        for (const query of newQueries) {
          checkCancelled(signal);
          try {
            const results = await searchByQuery(store, query);
            addTrace("search", "results", `Query "${query}" returned ${results.length} apps`);
            for (const app of results) {
              if (!allAppsMap.has(app.id)) {
                allAppsMap.set(app.id, app);
              }
            }
          } catch (e) {
            console.error(`[scout] Broader search failed for "${query}":`, e instanceof Error ? e.message : String(e));
          }
        }

        const expandedApps = Array.from(allAppsMap.values());
        allApps = await filterByAIRelevance(expandedApps, ideaText, signal);
        addTrace("filter", "ai_relevance_broadened", `After broadening: ${allApps.length} apps`);
        console.log(`[scout] After broadening: ${allApps.length} apps`);
      } catch (e) {
        console.error("[scout] Search broadening failed:", e instanceof Error ? e.message : String(e));
      }
    }

    for (const app of allApps) {
      sendEvent({ type: "app_found", app });
    }

    await db
      .update(scans)
      .set({ totalAppsScraped: allApps.length })
      .where(eq(scans.id, scanId));

    // Step 5: Filter using AI-suggested (or user-overridden) filters
    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Found ${allApps.length} unique apps. Filtering and ranking...`,
      progress: 35,
    });

    // Progressive filter fallback: try strict → relaxed → no filter
    let filtered = filterApps(allApps, aiFilters);

    if (filtered.length === 0 && allApps.length > 0) {
      const relaxedFilters: ScoutFilterSettings = {
        minInstalls: Math.round(aiFilters.minInstalls / 2),
        maxRating: 5,
        minRatings: Math.round(aiFilters.minRatings / 2),
      };
      console.log(`[scout-synthesis] 0 results with strict filters, retrying with relaxed: minInstalls=${relaxedFilters.minInstalls}, minRatings=${relaxedFilters.minRatings}`);
      filtered = filterApps(allApps, relaxedFilters);
    }

    if (filtered.length === 0 && allApps.length > 0) {
      console.log(`[scout-synthesis] Still 0 results after relaxed filters, using all ${allApps.length} apps`);
      filtered = allApps;
    }

    // Compute relevance and filter out apps with no meaningful keyword overlap
    const withRelevance = filtered.map((app) => ({
      app,
      relevance: calculateIdeaRelevanceBonus(app, expandedText),
      preScore: calculatePreScore(app),
    }));

    let relevant = withRelevance.filter((item) => item.relevance >= 10);
    if (relevant.length < 3) {
      // Fallback: sort all by relevance and take top N
      relevant = [...withRelevance].sort((a, b) => b.relevance - a.relevance).slice(0, MAX_APPS_TO_PROCESS);
    }

    relevant.sort((a, b) => {
      const aScore = a.preScore * 0.5 + a.relevance * 0.5;
      const bScore = b.preScore * 0.5 + b.relevance * 0.5;
      return bScore - aScore;
    });
    const topApps = relevant.slice(0, MAX_APPS_TO_PROCESS).map((item) => item.app);

    addTrace("filter", "candidates", `${topApps.length} top apps from ${filtered.length} filtered (${relevant.length} relevant)`);
    console.log(`[scout-synthesis] Filtered to ${filtered.length} candidates (${relevant.length} relevant), processing top ${topApps.length}`);

    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Processing top ${topApps.length} of ${filtered.length} matching apps...`,
      progress: 40,
    });

    // Step 6: processBatch — reviews, sentiment, feasibility
    const opportunityResults = await processBatch(
      topApps,
      store,
      scanId,
      sendEvent,
      signal,
      40,
      35,
    );

    // Step 7: Gap analysis
    if (opportunityResults.length > 0) {
      sendEvent({
        type: "progress",
        stage: "gap_analysis",
        message: "Analyzing competitive gaps against your idea...",
        progress: 78,
      });

      try {
        const gapAnalysis = await analyzeCompetitorGap(ideaText, opportunityResults, signal);
        checkCancelled(signal);

        sendEvent({ type: "gap_analysis", gapAnalysis });

        // Persist gap analysis on the scan record (scan-level, not per-opportunity)
        const gapJson = JSON.stringify(gapAnalysis);
        await db.update(scans).set({ gapAnalysisJson: gapJson }).where(eq(scans.id, scanId));
        // Set in memory for downstream pipeline use
        for (const opp of opportunityResults) {
          opp.gapAnalysis = gapAnalysis;
        }
      } catch (error) {
        console.error(
          "[scout-synthesis] Gap analysis failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Step 8: Blue ocean detection if <3 competitors
    if (opportunityResults.length < 3) {
      sendEvent({
        type: "progress",
        stage: "blue_ocean",
        message: "Few competitors found. Assessing blue ocean opportunity...",
        progress: 84,
      });

      try {
        blueOcean = await detectBlueOcean(ideaText, opportunityResults.length, strategy.queries, signal);
        checkCancelled(signal);

        sendEvent({ type: "blue_ocean", blueOcean });

        // Persist blue ocean on the scan record
        await db.update(scans).set({ blueOceanJson: JSON.stringify(blueOcean) }).where(eq(scans.id, scanId));

        // Also persist on each opportunity
        const blueOceanJson = JSON.stringify(blueOcean);
        for (const opp of opportunityResults) {
          await db
            .update(opportunities)
            .set({ blueOceanJson })
            .where(eq(opportunities.id, opp.id));
          opp.blueOcean = blueOcean;
        }
      } catch (error) {
        console.error(
          "[scout-synthesis] Blue ocean detection failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Step 9: Synthesize Master Idea (always — even with 0 competitors)
    sendEvent({
      type: "progress",
      stage: "synthesis",
      message: opportunityResults.length > 0
        ? "Synthesizing Master Idea from all competitor data..."
        : "Synthesizing Master Idea for blue ocean opportunity...",
      progress: 88,
    });

    try {
      // Filter out ultra-low-data competitors (< 20 ratings) from synthesis input
      // They provide insufficient review data for meaningful analysis
      const MIN_RATINGS_FOR_SYNTHESIS = 20;
      const synthesisCompetitors = opportunityResults.filter(
        (opp) => opp.scrapedApp.ratings >= MIN_RATINGS_FOR_SYNTHESIS
      );
      if (synthesisCompetitors.length < opportunityResults.length) {
        console.log(`[scout] Filtered out ${opportunityResults.length - synthesisCompetitors.length} ultra-low-data competitors (< ${MIN_RATINGS_FOR_SYNTHESIS} ratings) from synthesis`);
      }
      let masterIdea = await synthesizeMasterIdea(
        ideaText,
        synthesisCompetitors,
        {
          queries: strategy.queries,
          categories: strategy.categories,
          reasoning: strategy.reasoning,
        },
        signal,
        blueOcean,
      );
      checkCancelled(signal);

      // Confidence gate: if master idea confidence is low, retry with stronger model
      if (masterIdea.confidenceScore < 50) {
        console.log(`[scout-synthesis] Low confidence (${masterIdea.confidenceScore}%). Escalating to Opus model...`);
        addTrace("quality", "low_confidence",
          `Master idea confidence ${masterIdea.confidenceScore}% < 50%. Retrying with Opus...`
        );

        try {
          const opusResult = await synthesizeMasterIdea(
            ideaText,
            synthesisCompetitors,
            {
              queries: strategy.queries,
              categories: strategy.categories,
              reasoning: strategy.reasoning,
            },
            signal,
            blueOcean,
            "anthropic/claude-opus-4.6",
          );
          if (opusResult.confidenceScore > masterIdea.confidenceScore) {
            addTrace("quality", "opus_upgrade",
              `Opus produced confidence ${opusResult.confidenceScore}% (was ${masterIdea.confidenceScore}%)`
            );
            masterIdea = opusResult;
          }
        } catch (e) {
          console.warn("[scout-synthesis] Opus retry failed, keeping Sonnet result:", e instanceof Error ? e.message : String(e));
        }
      }

      // Validate master idea against source data
      const masterIdeaWarnings = validateMasterIdea(masterIdea, opportunityResults);
      if (masterIdeaWarnings.length > 0) {
        console.warn("[scout] Master idea validation warnings:", masterIdeaWarnings);
        addTrace("validation", "master_idea", `Warnings: ${masterIdeaWarnings.join("; ")}`);
      }

      sendEvent({ type: "master_idea", masterIdea });

      // Step 10: Store masterIdeaJson in scan record
      await db
        .update(scans)
        .set({ masterIdeaJson: JSON.stringify(masterIdea) })
        .where(eq(scans.id, scanId));
    } catch (error) {
      if (error instanceof CancelledError || signal.aborted) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[scout-synthesis] Master idea synthesis failed:", errMsg);
      sendEvent({
        type: "master_idea_error",
        message: `Master idea synthesis failed: ${errMsg}. Competitor data is still available.`,
      });
    }

    // Cross-step validation: check sentiment category distribution
    if (opportunityResults.length > 0) {
      const allPainPoints = opportunityResults.flatMap(o => o.sentiment.painPoints);
      const categories = { technical: 0, feature_gap: 0, monetization: 0, uncategorized: 0 };
      for (const pp of allPainPoints) {
        const cat = pp.category ?? "uncategorized";
        if (cat in categories) categories[cat as keyof typeof categories]++;
        else categories.uncategorized++;
      }
      const total = allPainPoints.length;
      if (total > 0) {
        addTrace("validation", "sentiment_distribution",
          `technical=${categories.technical}(${Math.round(categories.technical/total*100)}%), ` +
          `feature_gap=${categories.feature_gap}(${Math.round(categories.feature_gap/total*100)}%), ` +
          `monetization=${categories.monetization}(${Math.round(categories.monetization/total*100)}%)`
        );
      }
    }

    // Pipeline quality summary
    const qualitySummary = {
      totalApps: opportunityResults.length,
      avgComposite: opportunityResults.length > 0
        ? Math.round(opportunityResults.reduce((s, o) => s + o.score.compositeScore, 0) / opportunityResults.length)
        : 0,
      defaultSentimentCount: opportunityResults.filter(o =>
        o.sentiment.painPoints.length === 0 && o.sentiment.featureRequests.length === 0
      ).length,
    };
    addTrace("summary", "pipeline_quality", JSON.stringify(qualitySummary));

    // Persist trace
    try {
      await db.update(scans).set({ traceJson: JSON.stringify(trace) }).where(eq(scans.id, scanId));
    } catch (e) {
      console.error("[scout] Failed to persist trace:", e);
    }

    // Complete
    await db
      .update(scans)
      .set({
        status: "completed",
        totalOpportunities: opportunityResults.length,
        completedAt: new Date().toISOString(),
      })
      .where(eq(scans.id, scanId));

    sendEvent({
      type: "complete",
      scanId,
      totalOpportunities: opportunityResults.length,
    });
  } catch (error) {
    if (error instanceof CancelledError || signal.aborted) {
      await db
        .update(scans)
        .set({
          status: "cancelled",
          completedAt: new Date().toISOString(),
        })
        .where(eq(scans.id, scanId));

      sendEvent({ type: "cancelled", scanId });
    } else {
      await db
        .update(scans)
        .set({
          status: "failed",
          completedAt: new Date().toISOString(),
        })
        .where(eq(scans.id, scanId));

      sendEvent({
        type: "error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  } finally {
    activeScanControllers.delete(scanId);
  }
}

// ============================================
// Discovery Pipeline — Category-based exploration with optional focus
// ============================================

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function runScoutDiscoveryPipeline(
  store: AppStore,
  category: string,
  categoryLabel: string,
  sendEvent: (event: ScoutSSEEvent) => void,
  focusText?: string | null,
  filterOverrides?: ScoutFilterSettings | null,
): Promise<void> {
  const scanId = uuidv4();
  const now = new Date().toISOString();

  const abortController = new AbortController();
  activeScanControllers.set(scanId, abortController);
  const { signal } = abortController;

  await db.insert(scans).values({
    id: scanId,
    store,
    category,
    status: "running",
    totalAppsScraped: 0,
    totalOpportunities: 0,
    createdAt: now,
    mode: "discovery",
    focusText: focusText || null,
  });

  sendEvent({ type: "scan_started", scanId });

  const trace: TraceEntry[] = [];
  function addTrace(phase: string, action: string, detail: string) {
    trace.push({ phase, action, detail, timestamp: Date.now() });
    console.log(`[scout-trace] [${phase}] ${action}: ${detail}`);
  }

  sendEvent({
    type: "progress",
    stage: "scraping",
    message: `Discovering opportunities in ${categoryLabel}${focusText ? ` focused on "${focusText}"` : ""}...`,
    progress: 5,
  });

  try {
    let blueOcean: BlueOceanResult | undefined;
    let discoveryAngleText: string | null = null;

    // Scrape category top apps (reuses 30-min cache)
    sendEvent({
      type: "progress",
      stage: "scraping",
      message: `Fetching top apps in ${categoryLabel}...`,
      progress: 8,
    });

    let categoryApps: ScrapedApp[];
    const cached = getCachedCategory(store, category);
    if (cached) {
      categoryApps = cached;
      console.log(`[scout-discovery] Using cached ${categoryApps.length} apps for ${store}:${category}`);
    } else {
      categoryApps = await scrapeCategory(store, category);
      checkCancelled(signal);
      setCategoryCache(store, category, categoryApps);
    }

    console.log(`[scout-discovery] Scraped ${categoryApps.length} apps from ${store}:${category}`);

    // Fisher-Yates shuffle top apps, sample ~20 for variety
    const shuffled = shuffleArray(categoryApps);
    const sampled = shuffled.slice(0, 20);

    const allAppsMap = new Map<string, ScrapedApp>();
    let searchQueries: string[];

    if (focusText) {
      // Has focus: generate targeted search strategy
      sendEvent({
        type: "progress",
        stage: "search_strategy",
        message: `Generating search strategy for "${focusText}" in ${categoryLabel}...`,
        progress: 15,
      });

      const strategy = await generateDiscoverySearchStrategy(
        category, categoryLabel, focusText, store, signal,
      );
      checkCancelled(signal);

      searchQueries = strategy.queries;

      sendEvent({
        type: "search_strategy",
        strategy: {
          queries: strategy.queries,
          categories: strategy.categories,
          reasoning: strategy.reasoning,
          filters: filterOverrides ?? strategy.filters,
        },
      });

      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Searching ${searchQueries.length} queries for "${focusText}"...`,
        progress: 20,
      });

      const SEARCH_CONCURRENCY = 5;
      for (let chunkStart = 0; chunkStart < searchQueries.length; chunkStart += SEARCH_CONCURRENCY) {
        checkCancelled(signal);
        const chunk = searchQueries.slice(chunkStart, chunkStart + SEARCH_CONCURRENCY);

        for (let ci = 0; ci < chunk.length; ci++) {
          sendEvent({
            type: "idea_searching",
            query: chunk[ci],
            queryIndex: chunkStart + ci,
            totalQueries: searchQueries.length,
          });
        }

        const searchResults = await Promise.allSettled(
          chunk.map((query) => searchByQuery(store, query))
        );

        for (let si = 0; si < searchResults.length; si++) {
          const result = searchResults[si];
          if (result.status === "fulfilled") {
            for (const app of result.value) {
              if (!allAppsMap.has(app.id)) allAppsMap.set(app.id, app);
            }
          } else {
            console.error(`[scout-discovery] Search failed for "${chunk[si]}":`, result.reason instanceof Error ? result.reason.message : String(result.reason));
          }
        }
      }
    } else {
      // No focus: AI discovers an angle from the sampled apps
      sendEvent({
        type: "progress",
        stage: "discovery_angle",
        message: `Analyzing ${sampled.length} apps to discover underserved niches...`,
        progress: 15,
      });

      const appSummaries = sampled.map((app, i) =>
        `${i + 1}. "${app.title}" — ${app.score}/5, ${app.ratings.toLocaleString()} ratings, ${app.installs} installs\n   ${app.description.slice(0, 150)}...`
      ).join("\n");

      const angle = await generateDiscoveryAngle(
        category, categoryLabel, store, appSummaries, signal,
      );
      checkCancelled(signal);

      discoveryAngleText = angle.angle;
      searchQueries = angle.searchQueries;

      sendEvent({ type: "discovery_angle", angle: angle.angle, reasoning: angle.reasoning });

      await db.update(scans).set({ discoveryAngle: angle.angle }).where(eq(scans.id, scanId));

      sendEvent({
        type: "progress",
        stage: "searching",
        message: `Discovered angle: "${angle.angle}". Searching ${searchQueries.length} queries...`,
        progress: 25,
      });

      const SEARCH_CONCURRENCY = 5;
      for (let chunkStart = 0; chunkStart < searchQueries.length; chunkStart += SEARCH_CONCURRENCY) {
        checkCancelled(signal);
        const chunk = searchQueries.slice(chunkStart, chunkStart + SEARCH_CONCURRENCY);

        for (let ci = 0; ci < chunk.length; ci++) {
          sendEvent({
            type: "idea_searching",
            query: chunk[ci],
            queryIndex: chunkStart + ci,
            totalQueries: searchQueries.length,
          });
        }

        const searchResults = await Promise.allSettled(
          chunk.map((query) => searchByQuery(store, query))
        );

        for (let si = 0; si < searchResults.length; si++) {
          const result = searchResults[si];
          if (result.status === "fulfilled") {
            for (const app of result.value) {
              if (!allAppsMap.has(app.id)) allAppsMap.set(app.id, app);
            }
          } else {
            console.error(`[scout-discovery] Search failed for "${chunk[si]}":`, result.reason instanceof Error ? result.reason.message : String(result.reason));
          }
        }
      }
    }

    // Merge category apps (deduplicated)
    for (const app of categoryApps) {
      if (!allAppsMap.has(app.id)) allAppsMap.set(app.id, app);
    }

    const allApps = Array.from(allAppsMap.values());
    addTrace("dedup", "merged", `${allApps.length} unique apps (search + category)`);
    console.log(`[scout-discovery] Found ${allApps.length} unique apps (search + category)`);

    for (const app of allApps) sendEvent({ type: "app_found", app });

    await db.update(scans).set({ totalAppsScraped: allApps.length }).where(eq(scans.id, scanId));

    // Filter apps
    const defaultDiscoveryFilters: ScoutFilterSettings = { minInstalls: 5000, maxRating: 5, minRatings: 50 };
    const activeFilters = filterOverrides ?? defaultDiscoveryFilters;

    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Found ${allApps.length} unique apps. Filtering and ranking...`,
      progress: 35,
    });

    let filtered = filterApps(allApps, activeFilters);

    if (filtered.length === 0 && allApps.length > 0) {
      const relaxed: ScoutFilterSettings = {
        minInstalls: Math.round(activeFilters.minInstalls / 2),
        maxRating: 5,
        minRatings: Math.round(activeFilters.minRatings / 2),
      };
      filtered = filterApps(allApps, relaxed);
    }
    if (filtered.length === 0 && allApps.length > 0) filtered = allApps;

    // Rank by preScore + relevanceBonus
    const syntheticIdea = `A ${categoryLabel} app focused on: ${focusText || discoveryAngleText || categoryLabel}`;

    const withRelevance = filtered.map((app) => ({
      app,
      relevance: focusText ? calculateIdeaRelevanceBonus(app, syntheticIdea) : 0,
      preScore: calculatePreScore(app),
    }));

    withRelevance.sort((a, b) => {
      const aScore = a.preScore * 0.6 + a.relevance * 0.4;
      const bScore = b.preScore * 0.6 + b.relevance * 0.4;
      return bScore - aScore;
    });

    const topApps = withRelevance.slice(0, MAX_APPS_TO_PROCESS).map((item) => item.app);
    addTrace("filter", "candidates", `${topApps.length} top apps from ${filtered.length} filtered candidates`);
    console.log(`[scout-discovery] Filtered to ${filtered.length} candidates, processing top ${topApps.length}`);

    sendEvent({
      type: "progress",
      stage: "filtering",
      message: `Processing top ${topApps.length} of ${filtered.length} matching apps...`,
      progress: 40,
    });

    // processBatch — reviews, sentiment, feasibility
    const opportunityResults = await processBatch(topApps, store, scanId, sendEvent, signal, 40, 35);

    // Gap analysis
    if (opportunityResults.length > 0) {
      sendEvent({ type: "progress", stage: "gap_analysis", message: "Analyzing competitive gaps...", progress: 78 });

      try {
        const gapAnalysis = await analyzeCompetitorGap(syntheticIdea, opportunityResults, signal);
        checkCancelled(signal);
        sendEvent({ type: "gap_analysis", gapAnalysis });
        // Persist gap analysis on the scan record (scan-level, not per-opportunity)
        const gapJson = JSON.stringify(gapAnalysis);
        await db.update(scans).set({ gapAnalysisJson: gapJson }).where(eq(scans.id, scanId));
        // Set in memory for downstream pipeline use
        for (const opp of opportunityResults) {
          opp.gapAnalysis = gapAnalysis;
        }
      } catch (error) {
        console.error("[scout-discovery] Gap analysis failed:", error instanceof Error ? error.message : String(error));
      }
    }

    // Blue ocean detection if <3 competitors
    if (opportunityResults.length < 3) {
      sendEvent({ type: "progress", stage: "blue_ocean", message: "Few competitors found. Assessing blue ocean opportunity...", progress: 84 });

      try {
        blueOcean = await detectBlueOcean(syntheticIdea, opportunityResults.length, searchQueries, signal);
        checkCancelled(signal);
        sendEvent({ type: "blue_ocean", blueOcean });
        await db.update(scans).set({ blueOceanJson: JSON.stringify(blueOcean) }).where(eq(scans.id, scanId));
        const blueOceanJson = JSON.stringify(blueOcean);
        for (const opp of opportunityResults) {
          await db.update(opportunities).set({ blueOceanJson }).where(eq(opportunities.id, opp.id));
          opp.blueOcean = blueOcean;
        }
      } catch (error) {
        console.error("[scout-discovery] Blue ocean detection failed:", error instanceof Error ? error.message : String(error));
      }
    }

    // Synthesize Master Idea
    sendEvent({
      type: "progress",
      stage: "synthesis",
      message: opportunityResults.length > 0
        ? "Synthesizing Master Idea from competitor data..."
        : "Synthesizing Master Idea for blue ocean opportunity...",
      progress: 88,
    });

    try {
      // Filter out ultra-low-data competitors from synthesis
      const discoverySynthesisCompetitors = opportunityResults.filter(
        (opp) => opp.scrapedApp.ratings >= 20
      );
      if (discoverySynthesisCompetitors.length < opportunityResults.length) {
        console.log(`[scout-discovery] Filtered out ${opportunityResults.length - discoverySynthesisCompetitors.length} ultra-low-data competitors (< 20 ratings) from synthesis`);
      }
      const masterIdea = await synthesizeMasterIdea(
        syntheticIdea,
        discoverySynthesisCompetitors,
        {
          queries: searchQueries,
          categories: [category],
          reasoning: focusText
            ? `Discovery in ${categoryLabel} focused on: ${focusText}`
            : `AI-discovered angle in ${categoryLabel}: ${discoveryAngleText}`,
        },
        signal,
        blueOcean,
      );
      checkCancelled(signal);

      // Validate master idea against source data
      const masterIdeaWarnings = validateMasterIdea(masterIdea, opportunityResults);
      if (masterIdeaWarnings.length > 0) {
        console.warn("[scout] Master idea validation warnings:", masterIdeaWarnings);
        addTrace("validation", "master_idea", `Warnings: ${masterIdeaWarnings.join("; ")}`);
      }

      sendEvent({ type: "master_idea", masterIdea });
      await db.update(scans).set({ masterIdeaJson: JSON.stringify(masterIdea) }).where(eq(scans.id, scanId));
    } catch (error) {
      if (error instanceof CancelledError || signal.aborted) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[scout-discovery] Master idea synthesis failed:", errMsg);
      sendEvent({ type: "master_idea_error", message: `Master idea synthesis failed: ${errMsg}. Competitor data is still available.` });
    }

    // Cross-step validation: check sentiment category distribution
    if (opportunityResults.length > 0) {
      const allPainPoints = opportunityResults.flatMap(o => o.sentiment.painPoints);
      const categories = { technical: 0, feature_gap: 0, monetization: 0, uncategorized: 0 };
      for (const pp of allPainPoints) {
        const cat = pp.category ?? "uncategorized";
        if (cat in categories) categories[cat as keyof typeof categories]++;
        else categories.uncategorized++;
      }
      const total = allPainPoints.length;
      if (total > 0) {
        addTrace("validation", "sentiment_distribution",
          `technical=${categories.technical}(${Math.round(categories.technical/total*100)}%), ` +
          `feature_gap=${categories.feature_gap}(${Math.round(categories.feature_gap/total*100)}%), ` +
          `monetization=${categories.monetization}(${Math.round(categories.monetization/total*100)}%)`
        );
      }
    }

    // Persist trace
    try {
      await db.update(scans).set({ traceJson: JSON.stringify(trace) }).where(eq(scans.id, scanId));
    } catch (e) {
      console.error("[scout] Failed to persist trace:", e);
    }

    await db.update(scans).set({ status: "completed", totalOpportunities: opportunityResults.length, completedAt: new Date().toISOString() }).where(eq(scans.id, scanId));
    sendEvent({ type: "complete", scanId, totalOpportunities: opportunityResults.length });
  } catch (error) {
    if (error instanceof CancelledError || signal.aborted) {
      await db.update(scans).set({ status: "cancelled", completedAt: new Date().toISOString() }).where(eq(scans.id, scanId));
      sendEvent({ type: "cancelled", scanId });
    } else {
      await db.update(scans).set({ status: "failed", completedAt: new Date().toISOString() }).where(eq(scans.id, scanId));
      sendEvent({ type: "error", message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  } finally {
    activeScanControllers.delete(scanId);
  }
}
