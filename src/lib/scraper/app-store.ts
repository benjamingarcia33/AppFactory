import store from "app-store-scraper";
import type { ScrapedApp, ScrapedReview } from "@/lib/types";
import { withRetry } from "./utils";

/**
 * Parse numeric values that may come as strings with K/M/B suffixes (e.g. "1.9K", "2.2M").
 * Returns 0 for NaN or unparseable values.
 */
function parseNumericValue(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const str = String(val).trim().toUpperCase();
  const suffixMatch = str.match(/^(\d+(?:\.\d+)?)\s*(K|M|B)$/);
  if (suffixMatch) {
    const num = parseFloat(suffixMatch[1]);
    const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[suffixMatch[2]]!;
    return Math.round(num * multiplier);
  }
  const parsed = Number(str.replace(/[,+\s]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Apple does not expose install counts. Previous versions fabricated estimates
 * from ratings * 4, producing nonsensical numbers. Now we honestly return "N/A"
 * and let the UI show ratings count as the primary size proxy.
 */
function getInstallsLabel(): string {
  return "N/A";
}

/**
 * Fetch app metadata directly from the iTunes Lookup API.
 * Bypasses the app-store-scraper library to avoid its field-naming bugs
 * (it maps Apple's `userRatingCount` to `reviews`, causing confusion).
 * Returns exact `averageUserRating`, `userRatingCount`, and `price` from Apple.
 */
async function fetchItunesLookup(
  id: string,
  country: string = "us"
): Promise<{ averageUserRating: number; userRatingCount: number; price: number } | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${encodeURIComponent(country)}&entity=software`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.results ?? []) as Record<string, unknown>[];
    const entry = results.find((r) => r.wrapperType === "software");
    if (!entry) return null;
    return {
      averageUserRating: Number(entry.averageUserRating ?? 0),
      userRatingCount: Number(entry.userRatingCount ?? 0),
      price: Number(entry.price ?? 0),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the App Store star-rating histogram via Cheerio HTML scraping.
 * Non-critical: returns null if parsing fails or all values are zero.
 */
async function fetchAppStoreHistogram(
  id: string,
  country: string = "us"
): Promise<Record<string, number> | null> {
  try {
    const { load } = await import("cheerio");
    const res = await fetch(
      `https://itunes.apple.com/${encodeURIComponent(country)}/customer-reviews/id${encodeURIComponent(id)}?displayable-kind=11`,
      {
        headers: {
          "X-Apple-Store-Front": "143441-1,29",
          "User-Agent": "iTunes/12.0",
        },
      }
    );
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);

    const histogram: Record<string, number> = {};
    let hasValues = false;

    $(".rating-count").each((i, el) => {
      const stars = String(5 - i);
      const text = $(el).text().trim().replace(/[,\s]/g, "");
      const count = parseInt(text, 10) || 0;
      histogram[stars] = count;
      if (count > 0) hasValues = true;
    });

    if (!hasValues) {
      $(".vote .total").each((i, el) => {
        const stars = String(5 - i);
        const text = $(el).text().trim().replace(/[,\s]/g, "");
        const count = parseInt(text, 10) || 0;
        histogram[stars] = count;
        if (count > 0) hasValues = true;
      });
    }

    return hasValues ? histogram : null;
  } catch {
    return null;
  }
}

/**
 * Validate histogram data consistency.
 * If histogram sum differs from totalRatings by >5%, log discrepancy.
 * If weighted average differs from score by >0.15, prefer histogram-derived value.
 */
function validateHistogram(app: ScrapedApp): ScrapedApp {
  if (!app.histogram) return app;

  const hist = app.histogram;
  const histSum = Object.entries(hist).reduce((sum, [, count]) => sum + count, 0);
  const weightedSum = Object.entries(hist).reduce(
    (sum, [stars, count]) => sum + Number(stars) * count, 0
  );

  if (histSum === 0) return app;

  const histAvg = weightedSum / histSum;

  if (app.ratings > 0) {
    const sumDiff = Math.abs(histSum - app.ratings) / app.ratings;
    if (sumDiff > 0.05) {
      console.log(
        `[app-store] Histogram discrepancy for "${app.title}": ` +
        `histogram sum=${histSum}, totalRatings=${app.ratings} (diff=${(sumDiff * 100).toFixed(1)}%)`
      );
    }
  }

  if (app.score > 0) {
    const avgDiff = Math.abs(histAvg - app.score);
    if (avgDiff > 0.15) {
      console.log(
        `[app-store] Score discrepancy for "${app.title}": ` +
        `histogram avg=${histAvg.toFixed(2)}, reported score=${app.score} — using histogram value`
      );
      return { ...app, score: Math.round(histAvg * 10) / 10, dataConfidence: "low" };
    }
  }

  return app;
}

/**
 * Validate scraped app data: clamp score to 0-5, ensure ratings is non-negative.
 */
function validateScrapedApp(app: ScrapedApp): ScrapedApp {
  let { score, ratings } = app;
  if (score < 0 || score > 5 || isNaN(score)) {
    console.warn(`[app-store] Invalid score ${score} for "${app.title}", clamping to 0`);
    score = 0;
  }
  if (ratings < 0 || isNaN(ratings)) {
    console.warn(`[app-store] Invalid ratings ${ratings} for "${app.title}", setting to 0`);
    ratings = 0;
  }
  return { ...app, score, ratings };
}

/**
 * Separate apps that failed enrichment (score=0 AND ratings=0) from valid ones.
 */
export function partitionByEnrichment(apps: ScrapedApp[]): { valid: ScrapedApp[]; failed: ScrapedApp[] } {
  const valid: ScrapedApp[] = [];
  const failed: ScrapedApp[] = [];
  for (const app of apps) {
    if (app.score === 0 && app.ratings === 0) {
      failed.push(app);
    } else {
      valid.push(app);
    }
  }
  return { valid, failed };
}

/**
 * Fallback: use SerpAPI to search App Store apps by term.
 */
async function searchAppsSerpApiFallback(
  term: string
): Promise<ScrapedApp[]> {
  const { getJson } = await import("serpapi");

  const response = await getJson({
    engine: "apple_app_store",
    term,
    country: "us",
    lang: "en",
    num: "50",
    api_key: process.env.SERPAPI_API_KEY!,
  });

  const results = response.organic_results ?? [];

  return results.map(
    (app: Record<string, unknown>): ScrapedApp => {
      const ratingsCount = parseNumericValue(app.reviews ?? 0);
      return {
        id: (app.id as string) ?? "",
        title: (app.title as string) ?? "",
        store: "app_store",
        genre: (app.genre as string) ?? term,
        score: Number(app.rating ?? 0),
        ratings: ratingsCount,
        installs: getInstallsLabel(),
        description: (app.description as string) ?? "",
        icon: (app.icon as string) ?? "",
        url: (app.link as string) ?? "",
        developer: (app.developer as string) ?? "",
        isEstimatedInstalls: false,
        dataConfidence: "medium",
      };
    }
  );
}

/**
 * Fallback: use SerpAPI to get App Store reviews.
 */
async function getAppReviewsSerpApiFallback(
  appId: string,
  count: number
): Promise<ScrapedReview[]> {
  const { getJson } = await import("serpapi");

  const reviews: ScrapedReview[] = [];
  let page = 1;

  while (reviews.length < count) {
    const response = await getJson({
      engine: "apple_reviews",
      product_id: appId,
      country: "us",
      sort: "mostrecent",
      page: String(page),
      api_key: process.env.SERPAPI_API_KEY!,
    });

    const results = response.reviews ?? [];

    for (const review of results as Record<string, unknown>[]) {
      if (reviews.length >= count) break;
      reviews.push({
        id: (review.id as string) ?? crypto.randomUUID(),
        text:
          (review.title ? String(review.title) + ". " : "") +
          ((review.text as string) ?? ""),
        score: Number(review.rating ?? 0),
        date: (review.date as string) ?? "",
      });
    }

    if (results.length === 0) break;
    page++;
  }

  return reviews;
}

/**
 * Enrich apps with score/ratings by calling the iTunes Lookup API directly.
 * Bypasses the app-store-scraper library's `store.app()` to avoid its
 * field-naming bug (it maps Apple's `userRatingCount` to `reviews`).
 *
 * Field mapping (from iTunes Lookup API):
 * - `score` = `averageUserRating` (exact from API)
 * - `ratings` = `userRatingCount` (exact from API)
 * - `histogram` = from Cheerio HTML scrape (optional, non-critical)
 * - `reviewCount` is NOT set here — it comes from actual review fetching later
 */
async function enrichAppMetadata(apps: ScrapedApp[]): Promise<ScrapedApp[]> {
  const CONCURRENCY = 5;
  const enriched = [...apps];
  let enrichedCount = 0;
  let failedCount = 0;
  const failedIndices: number[] = [];

  for (let i = 0; i < enriched.length; i += CONCURRENCY) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }

    const batch = enriched.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (app) => {
        const [lookup, histogram] = await Promise.all([
          withRetry(() => fetchItunesLookup(app.id), 2),
          fetchAppStoreHistogram(app.id).catch(() => null),
        ]);
        return { lookup, histogram };
      })
    );

    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      const globalIdx = i + idx;
      const app = enriched[globalIdx];

      if (result.status === "fulfilled" && result.value.lookup) {
        const { lookup, histogram } = result.value;

        enriched[globalIdx] = {
          ...enriched[globalIdx],
          score: lookup.averageUserRating,
          ratings: lookup.userRatingCount,
          installs: getInstallsLabel(),
          isEstimatedInstalls: false,
          price: lookup.price > 0 ? lookup.price : undefined,
          free: lookup.price === 0,
          histogram: histogram ?? undefined,
          dataConfidence: "high",
        };
        enriched[globalIdx] = validateHistogram(enriched[globalIdx]);
        enrichedCount++;
      } else {
        const reason = result.status === "rejected"
          ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
          : "empty result (app not found in iTunes Lookup)";
        console.warn(
          `[app-store] Enrichment failed for "${app.title}" (id=${app.id}): ${reason}`
        );

        // Track for batch SerpAPI fallback after all enrichment attempts

        enriched[globalIdx] = { ...enriched[globalIdx], dataConfidence: "low" };
        failedIndices.push(globalIdx);
        failedCount++;
      }
    }
  }

  // Batch SerpAPI fallback for all failed apps
  if (failedIndices.length > 0 && process.env.SERPAPI_API_KEY) {
    const failedTitles = failedIndices.map(idx => enriched[idx].title);
    console.log(`[app-store] Attempting batch SerpAPI fallback for ${failedTitles.length} failed apps`);
    try {
      // Use the first few titles as a combined search query
      const batchQuery = failedTitles.slice(0, 10).join(" OR ");
      const serpResults = await searchAppsSerpApiFallback(batchQuery);

      for (const idx of failedIndices) {
        const app = enriched[idx];
        const match = serpResults.find(
          (r) => r.id === app.id || r.title.toLowerCase() === app.title.toLowerCase()
        );
        if (match && match.score > 0) {
          enriched[idx] = {
            ...enriched[idx],
            score: match.score,
            ratings: match.ratings,
            dataConfidence: "medium",
          };
          enrichedCount++;
          failedCount--;
          console.log(`[app-store] Batch SerpAPI fallback matched "${app.title}": score=${match.score}, ratings=${match.ratings}`);
        }
      }
    } catch (serpError) {
      console.warn(
        `[app-store] Batch SerpAPI fallback failed:`,
        serpError instanceof Error ? serpError.message : String(serpError)
      );
    }
  }

  if (failedCount > 0) {
    console.warn(
      `[app-store] Enrichment summary: ${enrichedCount}/${apps.length} succeeded, ${failedCount} failed`
    );
  }

  return enriched;
}

export async function searchApps(term: string): Promise<ScrapedApp[]> {
  type AppStoreApp = {
    id: string | number;
    title: string;
    score: number;
    ratings: number;
    reviews: number;
    icon: string;
    url: string;
    developer: string;
    description: string;
    primaryGenre: string;
  };

  const toScrapedApp = (app: AppStoreApp): ScrapedApp => {
    const ratingsCount = Math.max(Number(app.ratings ?? 0), Number(app.reviews ?? 0));
    return {
      id: String(app.id ?? ""),
      title: app.title ?? "",
      store: "app_store",
      genre: app.primaryGenre ?? term,
      score: Number(app.score ?? 0),
      ratings: ratingsCount,
      installs: getInstallsLabel(),
      description: app.description ?? "",
      icon: app.icon ?? "",
      url: app.url ?? "",
      developer: app.developer ?? "",
      isEstimatedInstalls: false,
    };
  };

  // SerpAPI-first: when key is available, use SerpAPI as primary source (more accurate ratings)
  if (process.env.SERPAPI_API_KEY) {
    try {
      console.log(`[app-store] Using SerpAPI as primary source for category "${term}"`);
      const serpResults = await searchAppsSerpApiFallback(term);
      if (serpResults.length > 0) {
        console.log(`[app-store] SerpAPI returned ${serpResults.length} results for category "${term}"`);
        return serpResults.map(validateScrapedApp);
      }
      console.log(`[app-store] SerpAPI returned 0 results for category "${term}", falling back to npm scraper`);
    } catch (serpError) {
      console.warn(
        `[app-store] SerpAPI primary search failed for category "${term}", falling back to npm scraper:`,
        serpError instanceof Error ? serpError.message : String(serpError)
      );
    }
  }

  try {
    const categoryId = parseInt(term, 10);
    const categoryParam = isNaN(categoryId) ? term : categoryId;

    const collections = [
      store.collection.TOP_FREE_IOS,
      store.collection.TOP_GROSSING_IOS,
    ];

    const collectionResults = await Promise.allSettled(
      collections.map((collection) =>
        withRetry(() =>
          store.list({
            category: categoryParam,
            collection,
            num: 100,
            country: "us",
          })
        )
      )
    );

    const deduped = new Map<string, ScrapedApp>();
    for (const result of collectionResults) {
      if (result.status === "fulfilled") {
        for (const app of result.value as AppStoreApp[]) {
          const scraped = toScrapedApp(app);
          if (!deduped.has(scraped.id)) {
            deduped.set(scraped.id, scraped);
          }
        }
      }
    }

    if (deduped.size === 0) {
      const firstFailed = collectionResults.find((r) => r.status === "rejected");
      throw (firstFailed as PromiseRejectedResult)?.reason ?? new Error("All collection fetches returned empty results");
    }

    const apps = Array.from(deduped.values());
    return (await enrichAppMetadata(apps)).map(validateScrapedApp);
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[app-store] Failed to search apps for category "${term}": ${errorMessage}`
    );

    throw new Error(
      `Failed to search App Store apps for category "${term}": ${errorMessage}`
    );
  }
}

/**
 * Search App Store apps by free-text query.
 * SerpAPI-first for all queries (more accurate ratings than npm scraper).
 */
export async function searchByQuery(
  query: string,
  num: number = 30
): Promise<ScrapedApp[]> {
  // SerpAPI-first for query search
  if (process.env.SERPAPI_API_KEY) {
    try {
      const serpResults = await searchAppsSerpApiFallback(query);
      if (serpResults.length >= 5) {
        return serpResults.map(validateScrapedApp);
      }
      // If SerpAPI returns few results, supplement with npm scraper
      console.log(`[app-store] SerpAPI returned only ${serpResults.length} results for query "${query}", supplementing with npm scraper`);
    } catch (serpError) {
      console.warn(
        `[app-store] SerpAPI search failed for query "${query}", falling back to npm scraper:`,
        serpError instanceof Error ? serpError.message : String(serpError)
      );
    }
  }

  try {
    const results = await withRetry(() =>
      store.search({
        term: query,
        num,
        country: "us",
      })
    );

    const apps = results.map(
      (app: {
        id: string | number;
        title: string;
        score: number;
        reviews: number;
        ratings?: number;
        icon: string;
        url: string;
        developer: string;
        description: string;
        primaryGenre: string;
      }): ScrapedApp => {
        const ratingsCount = Math.max(Number(app.ratings ?? 0), Number(app.reviews ?? 0));
        return {
          id: String(app.id ?? ""),
          title: app.title ?? "",
          store: "app_store",
          genre: app.primaryGenre ?? query,
          score: Number(app.score ?? 0),
          ratings: ratingsCount,
          installs: getInstallsLabel(),
          description: app.description ?? "",
          icon: app.icon ?? "",
          url: app.url ?? "",
          developer: app.developer ?? "",
          isEstimatedInstalls: false,
        };
      }
    );

    return (await enrichAppMetadata(apps)).map(validateScrapedApp);
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[app-store] Failed to search by query "${query}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      try {
        return await searchAppsSerpApiFallback(query);
      } catch (fallbackError) {
        console.error(
          `[app-store] SerpAPI fallback also failed:`,
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        );
      }
    }

    throw new Error(
      `Failed to search App Store by query "${query}": ${errorMessage}`
    );
  }
}

/**
 * Get reviews for a specific App Store app.
 */
export async function getAppReviews(
  appId: string,
  count: number = 50
): Promise<ScrapedReview[]> {
  try {
    const allReviews: ScrapedReview[] = [];
    let page = 1;

    while (allReviews.length < count) {
      const results = await withRetry(() =>
        store.reviews({
          id: appId,
          country: "us",
          sort: store.sort.RECENT,
          page,
        })
      );

      if (!results || results.length === 0) break;

      for (const review of results as Array<{
        id: string;
        text: string;
        title: string;
        score: number;
        date: string;
      }>) {
        if (allReviews.length >= count) break;
        allReviews.push({
          id: review.id ?? crypto.randomUUID(),
          text:
            (review.title ? String(review.title) + ". " : "") +
            (review.text ?? ""),
          score: Number(review.score ?? 0),
          date: review.date ?? "",
        });
      }

      page++;
    }

    return allReviews;
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[app-store] Failed to get reviews for "${appId}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      try {
        return await getAppReviewsSerpApiFallback(appId, count);
      } catch (fallbackError) {
        console.error(
          `[app-store] SerpAPI fallback also failed:`,
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        );
      }
    }

    throw new Error(
      `Failed to get App Store reviews for "${appId}": ${errorMessage}`
    );
  }
}
