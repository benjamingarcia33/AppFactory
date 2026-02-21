import store from "app-store-scraper";
import type { ScrapedApp, ScrapedReview } from "@/lib/types";

/**
 * Estimate installs from ratings count.
 * Industry standard: iOS installs ≈ ratings × 40-80 (median ~50).
 * The `~` prefix marks the value as an estimate.
 */
function estimateInstalls(ratings: number): string {
  if (ratings <= 0) return "N/A";
  return "~" + (ratings * 50).toLocaleString("en-US");
}

/**
 * Retry wrapper with exponential backoff and jitter.
 * On failure, waits (2^attempt * 500ms) + random jitter before retrying.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const baseDelay = Math.pow(2, attempt) * 500;
        const jitter = Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }
    }
  }

  throw lastError;
}

/**
 * Fallback: use SerpAPI to search App Store apps by term.
 * Only called when SERPAPI_API_KEY is set and the primary scraper fails.
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
    (app: Record<string, unknown>): ScrapedApp => ({
      id: (app.id as string) ?? "",
      title: (app.title as string) ?? "",
      store: "app_store",
      genre: (app.genre as string) ?? term,
      score: Number(app.rating ?? 0),
      ratings: Number(app.reviews ?? 0),
      installs: estimateInstalls(Number(app.reviews ?? 0)),
      description: (app.description as string) ?? "",
      icon: (app.icon as string) ?? "",
      url: (app.link as string) ?? "",
      developer: (app.developer as string) ?? "",
    })
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
 * Enrich apps with score/reviews by fetching individual app details.
 * store.list() does not return score or reviews, so we fetch each app individually.
 */
async function enrichAppMetadata(apps: ScrapedApp[]): Promise<ScrapedApp[]> {
  const CONCURRENCY = 5;
  const enriched = [...apps];

  for (let i = 0; i < enriched.length; i += CONCURRENCY) {
    const batch = enriched.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((app) =>
        withRetry(() => store.app({ id: app.id }), 1)
      )
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        const detail = result.value;
        const ratings = Number(detail.reviews ?? 0);
        enriched[i + idx] = {
          ...enriched[i + idx],
          score: Number(detail.score ?? 0),
          ratings,
          installs: estimateInstalls(ratings),
        };
      }
    });
  }

  return enriched;
}

/**
 * Search top free apps on the App Store by category.
 * Uses the app-store-scraper npm package as the primary source,
 * with SerpAPI as an optional fallback.
 *
 * The `term` parameter is used as the category for store.list().
 */
export async function searchApps(term: string): Promise<ScrapedApp[]> {
  type AppStoreApp = {
    id: string | number;
    title: string;
    score: number;
    reviews: number;
    icon: string;
    url: string;
    developer: string;
    description: string;
    primaryGenre: string;
  };

  const toScrapedApp = (app: AppStoreApp): ScrapedApp => ({
    id: String(app.id ?? ""),
    title: app.title ?? "",
    store: "app_store",
    genre: app.primaryGenre ?? term,
    score: Number(app.score ?? 0),
    ratings: Number(app.reviews ?? 0),
    installs: estimateInstalls(Number(app.reviews ?? 0)),
    description: app.description ?? "",
    icon: app.icon ?? "",
    url: app.url ?? "",
    developer: app.developer ?? "",
  });

  try {
    // The app-store-scraper package expects numeric category IDs (e.g. 6007 for Productivity).
    // Our category values are already stored as numeric strings in APP_STORE_CATEGORIES.
    const categoryId = parseInt(term, 10);
    const categoryParam = isNaN(categoryId) ? term : categoryId;

    // Fetch from both TOP_FREE and TOP_GROSSING collections
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

    // Deduplicate by app id
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

    // store.list() doesn't return score/reviews — enrich via individual lookups
    return await enrichAppMetadata(apps);
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[app-store] Failed to search apps for category "${term}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      console.warn(
        "[app-store] Falling back to SerpAPI for searchApps..."
      );
      try {
        return await searchAppsSerpApiFallback(term);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[app-store] SerpAPI fallback also failed: ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `Failed to search App Store apps for category "${term}": ${errorMessage}`
    );
  }
}

/**
 * Search App Store apps by free-text query.
 * Used by Scout's idea-validation mode to find potential competitors.
 */
export async function searchByQuery(
  query: string,
  num: number = 30
): Promise<ScrapedApp[]> {
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
        icon: string;
        url: string;
        developer: string;
        description: string;
        primaryGenre: string;
      }): ScrapedApp => ({
        id: String(app.id ?? ""),
        title: app.title ?? "",
        store: "app_store",
        genre: app.primaryGenre ?? query,
        score: Number(app.score ?? 0),
        ratings: Number(app.reviews ?? 0),
        installs: estimateInstalls(Number(app.reviews ?? 0)),
        description: app.description ?? "",
        icon: app.icon ?? "",
        url: app.url ?? "",
        developer: app.developer ?? "",
      })
    );

    return await enrichAppMetadata(apps);
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[app-store] Failed to search by query "${query}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      console.warn(
        "[app-store] Falling back to SerpAPI for searchByQuery..."
      );
      try {
        return await searchAppsSerpApiFallback(query);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[app-store] SerpAPI fallback also failed: ${fallbackMessage}`
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
 * Uses the app-store-scraper npm package as the primary source,
 * with SerpAPI as an optional fallback.
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
      console.warn(
        "[app-store] Falling back to SerpAPI for getAppReviews..."
      );
      try {
        return await getAppReviewsSerpApiFallback(appId, count);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[app-store] SerpAPI fallback also failed: ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `Failed to get App Store reviews for "${appId}": ${errorMessage}`
    );
  }
}
