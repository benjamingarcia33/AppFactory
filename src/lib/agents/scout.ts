import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { scans, opportunities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeCategory, scrapeReviews, searchByQuery } from "@/lib/scraper";
import {
  analyzeSentimentBatch,
  estimateFeasibility,
  generateSearchQueries,
  analyzeCompetitorGap,
  detectBlueOcean,
} from "@/lib/ai/scout-prompts";
import { cancellableDelay } from "@/lib/ai/client";
import { CancelledError } from "@/lib/errors";
import type {
  AppStore,
  ScrapedApp,
  ScrapedReview,
  ScoutSSEEvent,
  SentimentAnalysis,
  OpportunityScore,
  Opportunity,
  ScoutFilterSettings,
} from "@/lib/types";
import { DEFAULT_SCOUT_FILTERS } from "@/lib/types";

// --- Cancel support ---
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

  // Scale installs: 100k=20, 500k=40, 1M=60, 10M=80, 100M=100
  let installScore: number;
  if (installs >= 100_000_000) installScore = 100;
  else if (installs >= 10_000_000) installScore = 80;
  else if (installs >= 1_000_000) installScore = 60;
  else if (installs >= 500_000) installScore = 40;
  else if (installs >= 100_000) installScore = 20;
  else installScore = 10;

  // Scale ratings: more ratings = larger engaged user base
  let ratingScore: number;
  if (ratings >= 1_000_000) ratingScore = 100;
  else if (ratings >= 100_000) ratingScore = 80;
  else if (ratings >= 10_000) ratingScore = 60;
  else if (ratings >= 1_000) ratingScore = 40;
  else ratingScore = 20;

  return Math.round(installScore * 0.6 + ratingScore * 0.4);
}

function calculateDissatisfaction(score: number): number {
  if (score <= 0) return 50; // Unknown/missing score → neutral
  // Inverse of score: 1.0 star => 100, 4.0 star => 33, 5.0 star => 0
  // score is 0-5 scale
  return Math.round(Math.max(0, Math.min(100, ((5 - score) / 4) * 100)));
}

const BATCH_SIZE = 5;
const MAX_APPS_TO_PROCESS = 10;
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

/**
 * Lightweight keyword overlap between the user's idea and an app's title + description.
 * Returns a score 0-100 representing relevance.
 */
function calculateIdeaRelevanceBonus(app: ScrapedApp, ideaText: string): number {
  const ideaWords = new Set(
    ideaText.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );
  if (ideaWords.size === 0) return 0;

  const appText = `${app.title} ${app.description}`.toLowerCase();
  let matches = 0;
  for (const word of ideaWords) {
    if (appText.includes(word)) matches++;
  }

  return Math.min(100, Math.round((matches / ideaWords.size) * 100));
}

function calculatePreScore(app: ScrapedApp): number {
  const marketSize = calculateMarketSize(app);
  const dissatisfaction = calculateDissatisfaction(app.score);
  return marketSize * 0.4 + dissatisfaction * 0.6;
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
          batchReviews.push({ app: batch[ri], reviews: result.value });
        } else {
          if (result.status === "rejected") {
            console.error(
              `Failed to fetch reviews for "${batch[ri].title}":`,
              result.reason instanceof Error ? result.reason.message : String(result.reason)
            );
          }
          completedSteps++;
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

      const sentimentInputs = batchReviews.map((item) => ({
        reviews: item.reviews,
        appTitle: item.app.title,
      }));

      const sentiments = await analyzeSentimentBatch(sentimentInputs, signal);
      checkCancelled(signal);

      // Phase 3: Feasibility estimation (parallel, 3 at a time)
      const FEASIBILITY_CONCURRENCY = 3;
      for (let chunkStart = 0; chunkStart < batchReviews.length; chunkStart += FEASIBILITY_CONCURRENCY) {
        checkCancelled(signal);
        if (chunkStart > 0) await cancellableDelay(250, signal);

        const chunk = batchReviews.slice(chunkStart, chunkStart + FEASIBILITY_CONCURRENCY);
        const chunkSentiments = sentiments.slice(chunkStart, chunkStart + FEASIBILITY_CONCURRENCY);

        const baseProgress =
          totalSteps > 0 ? progressOffset + (completedSteps / totalSteps) * progressRange : progressOffset;

        sendEvent({
          type: "progress",
          stage: "feasibility",
          message: `Estimating feasibility for ${chunk.length} app(s)...`,
          progress: Math.round(baseProgress + 20),
        });

        const feasibilityResults = await Promise.allSettled(
          chunk.map(({ app }, idx) =>
            estimateFeasibility(app, chunkSentiments[idx], signal)
          )
        );
        checkCancelled(signal);

        for (let fi = 0; fi < chunk.length; fi++) {
          const { app, reviews } = chunk[fi];
          const sentiment: SentimentAnalysis = chunkSentiments[fi];
          const feasResult = feasibilityResults[fi];

          if (feasResult.status === "rejected") {
            console.error(
              `Failed to estimate feasibility for "${app.title}":`,
              feasResult.reason instanceof Error ? feasResult.reason.message : String(feasResult.reason)
            );
            completedSteps++;
            continue;
          }

          try {
            const feasibilityScore = feasResult.value;
            const marketSize = calculateMarketSize(app);
            const dissatisfaction = calculateDissatisfaction(app.score);
            const composite = Math.round(
              marketSize * 0.3 + dissatisfaction * 0.4 + feasibilityScore * 0.3
            );

            const opportunityScore: OpportunityScore = {
              marketSize,
              dissatisfaction,
              feasibility: feasibilityScore,
              composite,
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
              installs: app.installs,
              description: app.description,
              icon: app.icon,
              url: app.url,
              developer: app.developer,
              sentimentJson: JSON.stringify(sentiment),
              reviewsJson: JSON.stringify(reviews),
              marketSize: opportunityScore.marketSize,
              dissatisfaction: opportunityScore.dissatisfaction,
              feasibility: opportunityScore.feasibility,
              compositeScore: opportunityScore.composite,
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
    const SEARCH_CONCURRENCY = 3;

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

    const allApps = Array.from(allAppsMap.values());
    console.log(`[scout-idea] Found ${allApps.length} unique apps from ${queries.length} queries`);

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
    filtered.sort((a, b) => {
      const aScore = calculatePreScore(a) + calculateIdeaRelevanceBonus(a, ideaText) * 0.2;
      const bScore = calculatePreScore(b) + calculateIdeaRelevanceBonus(b, ideaText) * 0.2;
      return bScore - aScore;
    });
    const topApps = filtered.slice(0, MAX_APPS_TO_PROCESS);

    console.log(`[scout-idea] Filtered to ${filtered.length} candidates, processing top ${topApps.length}`);

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

        // Update each opportunity's gap analysis in DB
        const gapJson = JSON.stringify(gapAnalysis);
        for (const opp of opportunityResults) {
          await db
            .update(opportunities)
            .set({ gapAnalysisJson: gapJson })
            .where(eq(opportunities.id, opp.id));
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
