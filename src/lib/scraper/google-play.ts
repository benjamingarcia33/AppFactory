import gplay from "google-play-scraper";
import type { ScrapedApp, ScrapedReview } from "@/lib/types";

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
 * Fallback: use SerpAPI to search top Google Play apps by category.
 * Only called when SERPAPI_API_KEY is set and the primary scraper fails.
 */
async function searchTopAppsSerpApiFallback(
  category: string
): Promise<ScrapedApp[]> {
  const { getJson } = await import("serpapi");

  const response = await getJson({
    engine: "google_play",
    store: "apps",
    gl: "us",
    hl: "en",
    chart: "topselling_free",
    category,
    api_key: process.env.SERPAPI_API_KEY!,
  });

  const results = response.organic_results ?? [];

  return results.map(
    (app: Record<string, unknown>): ScrapedApp => ({
      id: (app.product_id as string) ?? "",
      title: (app.title as string) ?? "",
      store: "google_play",
      genre: category,
      score: Number(app.rating ?? 0),
      ratings: Number(app.reviews ?? 0),
      installs: (app.installs as string) ?? "0",
      description: (app.description as string) ?? "",
      icon: (app.thumbnail as string) ?? "",
      url: (app.link as string) ?? "",
      developer: (app.developer as string) ?? "",
      dataConfidence: "medium",
    })
  );
}

/**
 * Fallback: use SerpAPI to get Google Play app details.
 */
async function getAppDetailsSerpApiFallback(
  appId: string
): Promise<ScrapedApp | null> {
  const { getJson } = await import("serpapi");

  const response = await getJson({
    engine: "google_play_product",
    product_id: appId,
    store: "apps",
    gl: "us",
    hl: "en",
    api_key: process.env.SERPAPI_API_KEY!,
  });

  const info = response.product_info;
  if (!info) return null;

  return {
    id: appId,
    title: (info.title as string) ?? "",
    store: "google_play",
    genre: (info.genre as string) ?? "",
    score: Number(info.rating ?? 0),
    ratings: Number(info.reviews ?? 0),
    installs: (info.installs as string) ?? "0",
    description: (info.description as string) ?? "",
    icon: (info.thumbnail as string) ?? "",
    url: (info.link as string) ?? "",
    developer: (info.developer as string) ?? "",
    dataConfidence: "medium",
  };
}

/**
 * Fallback: use SerpAPI to get Google Play app reviews.
 */
async function getAppReviewsSerpApiFallback(
  productId: string,
  count: number
): Promise<ScrapedReview[]> {
  const { getJson } = await import("serpapi");

  const reviews: ScrapedReview[] = [];
  let nextPageToken: string | undefined;

  while (reviews.length < count) {
    const params: Record<string, unknown> = {
      engine: "google_play_product",
      product_id: productId,
      store: "apps",
      gl: "us",
      hl: "en",
      all_reviews: "true",
      api_key: process.env.SERPAPI_API_KEY!,
    };

    if (nextPageToken) {
      params.next_page_token = nextPageToken;
    }

    const response = await getJson(params);
    const results = response.reviews ?? [];

    for (const review of results as Record<string, unknown>[]) {
      if (reviews.length >= count) break;
      reviews.push({
        id: (review.id as string) ?? crypto.randomUUID(),
        text: (review.snippet as string) ?? "",
        score: Number(review.rating ?? 0),
        date: (review.date as string) ?? "",
        thumbsUp: Number(review.likes ?? 0),
      });
    }

    nextPageToken = response.serpapi_pagination?.next_page_token as
      | string
      | undefined;
    if (!nextPageToken || results.length === 0) break;
  }

  return reviews;
}

/**
 * Enrich SerpAPI Google Play results with full detail from npm scraper.
 * Fetches histogram, price, offersIAP, priceText, and full description.
 * Concurrency 5 with 500ms inter-batch delay.
 */
async function enrichGPlayMetadata(apps: ScrapedApp[]): Promise<ScrapedApp[]> {
  const CONCURRENCY = 5;
  const INTER_BATCH_DELAY = 200;
  const enriched = [...apps];

  for (let i = 0; i < enriched.length; i += CONCURRENCY) {
    const batch = enriched.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((app) =>
        withRetry(() => gplay.app({ appId: app.id }), 1)
      )
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        const detail = result.value;
        enriched[i + idx] = {
          ...enriched[i + idx],
          score: Number(detail.score ?? enriched[i + idx].score),
          ratings: Number(detail.ratings ?? enriched[i + idx].ratings),
          installs: detail.installs ?? String(detail.maxInstalls ?? enriched[i + idx].installs),
          description: detail.description ?? enriched[i + idx].description,
          dataConfidence: "high",
        };
      } else {
        // Keep medium confidence from SerpAPI if enrichment fails
        if (!enriched[i + idx].dataConfidence) {
          enriched[i + idx] = {
            ...enriched[i + idx],
            dataConfidence: "medium",
          };
        }
      }
    });

    // Inter-batch delay to avoid rate limiting
    if (i + CONCURRENCY < enriched.length) {
      await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY));
    }
  }

  return enriched;
}

/**
 * Search top free apps on Google Play by category.
 * Uses the google-play-scraper npm package as the primary source,
 * with SerpAPI as an optional fallback.
 */
export async function searchTopApps(
  category: string,
  collections: string[] = [gplay.collection.TOP_FREE, gplay.collection.GROSSING]
): Promise<ScrapedApp[]> {
  type GPlayApp = {
    appId: string;
    title: string;
    score?: number;
    ratings?: number;
    reviews?: number;
    installs?: string;
    maxInstalls?: number;
    minInstalls?: number;
    summary?: string;
    description?: string;
    icon: string;
    url: string;
    developer: string;
    genre?: string;
    genreId?: string;
  };

  const toScrapedApp = (app: GPlayApp): ScrapedApp => ({
    id: app.appId ?? "",
    title: app.title ?? "",
    store: "google_play",
    genre: app.genre ?? app.genreId ?? category,
    score: Number(app.score ?? 0),
    ratings: Number(app.ratings ?? app.reviews ?? 0),
    installs: app.installs ?? String(app.maxInstalls ?? app.minInstalls ?? "0"),
    description: app.description ?? app.summary ?? "",
    icon: app.icon ?? "",
    url: app.url ?? "",
    developer: app.developer ?? "",
    dataConfidence: "high",
  });

  try {
    // Fetch from multiple collections and deduplicate by appId
    const collectionResults = await Promise.allSettled(
      collections.map((collection) =>
        withRetry(() =>
          gplay.list({
            category,
            collection,
            num: 100,
            country: "us",
            fullDetail: true,
          } as Parameters<typeof gplay.list>[0])
        )
      )
    );

    const deduped = new Map<string, ScrapedApp>();
    for (const result of collectionResults) {
      if (result.status === "fulfilled") {
        for (const app of result.value as GPlayApp[]) {
          const scraped = toScrapedApp(app);
          if (!deduped.has(scraped.id)) {
            deduped.set(scraped.id, scraped);
          }
        }
      }
    }

    // If all collections failed, throw to trigger fallback
    if (deduped.size === 0) {
      const firstFailed = collectionResults.find((r) => r.status === "rejected");
      throw (firstFailed as PromiseRejectedResult)?.reason ?? new Error("All collection fetches returned empty results");
    }

    return Array.from(deduped.values());
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[google-play] Failed to search top apps for category "${category}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      console.warn(
        "[google-play] Falling back to SerpAPI for searchTopApps..."
      );
      try {
        const serpResults = await searchTopAppsSerpApiFallback(category);
        return await enrichGPlayMetadata(serpResults);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[google-play] SerpAPI fallback also failed: ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `Failed to search top Google Play apps for category "${category}": ${errorMessage}`
    );
  }
}

/**
 * Search Google Play apps by free-text query.
 * Used by Scout's idea-validation mode to find potential competitors.
 */
export async function searchByQuery(
  query: string,
  num: number = 30
): Promise<ScrapedApp[]> {
  try {
    const results = await withRetry(() =>
      gplay.search({
        term: query,
        num,
        country: "us",
        fullDetail: true,
      })
    );

    return results.map(
      (app: {
        appId: string;
        title: string;
        score?: number;
        ratings?: number;
        reviews?: number;
        installs?: string;
        maxInstalls?: number;
        minInstalls?: number;
        summary?: string;
        description?: string;
        icon: string;
        url: string;
        developer: string;
        genre?: string;
        genreId?: string;
      }): ScrapedApp => ({
        id: app.appId ?? "",
        title: app.title ?? "",
        store: "google_play",
        genre: app.genre ?? app.genreId ?? query,
        score: Number(app.score ?? 0),
        ratings: Number(app.ratings ?? app.reviews ?? 0),
        installs: app.installs ?? String(app.maxInstalls ?? app.minInstalls ?? "0"),
        description: app.description ?? app.summary ?? "",
        icon: app.icon ?? "",
        url: app.url ?? "",
        developer: app.developer ?? "",
        dataConfidence: "high",
      })
    );
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[google-play] Failed to search by query "${query}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      console.warn(
        "[google-play] Falling back to SerpAPI for searchByQuery..."
      );
      try {
        const { getJson } = await import("serpapi");

        const response = await getJson({
          engine: "google_play",
          store: "apps",
          gl: "us",
          hl: "en",
          term: query,
          api_key: process.env.SERPAPI_API_KEY!,
        });

        const serpResults = response.organic_results ?? [];

        const serpApps = serpResults.map(
          (app: Record<string, unknown>): ScrapedApp => ({
            id: (app.product_id as string) ?? "",
            title: (app.title as string) ?? "",
            store: "google_play",
            genre: (app.genre as string) ?? query,
            score: Number(app.rating ?? 0),
            ratings: Number(app.reviews ?? 0),
            installs: (app.installs as string) ?? "0",
            description: (app.description as string) ?? "",
            icon: (app.thumbnail as string) ?? "",
            url: (app.link as string) ?? "",
            developer: (app.developer as string) ?? "",
            dataConfidence: "medium",
          })
        );

        return await enrichGPlayMetadata(serpApps);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[google-play] SerpAPI fallback also failed: ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `Failed to search Google Play by query "${query}": ${errorMessage}`
    );
  }
}

/**
 * Get detailed information about a specific Google Play app.
 * Uses the google-play-scraper npm package as the primary source,
 * with SerpAPI as an optional fallback.
 */
export async function getAppDetails(
  appId: string
): Promise<ScrapedApp | null> {
  try {
    const app = await withRetry(() =>
      gplay.app({ appId })
    );

    if (!app) return null;

    return {
      id: app.appId ?? appId,
      title: app.title ?? "",
      store: "google_play",
      genre: app.genre ?? "",
      score: Number(app.score ?? 0),
      ratings: Number(app.ratings ?? 0),
      installs: app.installs ?? String(app.maxInstalls ?? "0"),
      description: app.description ?? "",
      icon: app.icon ?? "",
      url: app.url ?? "",
      developer: app.developer ?? "",
      dataConfidence: "high",
    };
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[google-play] Failed to get app details for "${appId}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      console.warn(
        "[google-play] Falling back to SerpAPI for getAppDetails..."
      );
      try {
        return await getAppDetailsSerpApiFallback(appId);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[google-play] SerpAPI fallback also failed: ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `Failed to get Google Play app details for "${appId}": ${errorMessage}`
    );
  }
}

/**
 * Get reviews for a specific Google Play app.
 * Uses the google-play-scraper npm package as the primary source,
 * with SerpAPI as an optional fallback.
 */
export async function getAppReviews(
  productId: string,
  count: number = 50
): Promise<ScrapedReview[]> {
  try {
    const response = await withRetry(() =>
      gplay.reviews({
        appId: productId,
        num: count,
        sort: gplay.sort.NEWEST,
      })
    );

    const reviewData = response.data ?? [];

    return reviewData.map(
      (review: {
        id: string;
        text: string;
        score: number;
        date: string;
        thumbsUp: number;
      }): ScrapedReview => ({
        id: review.id ?? crypto.randomUUID(),
        text: review.text ?? "",
        score: Number(review.score ?? 0),
        date: review.date ?? "",
        thumbsUp: Number(review.thumbsUp ?? 0),
      })
    );
  } catch (primaryError) {
    const errorMessage =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);
    console.error(
      `[google-play] Failed to get reviews for "${productId}": ${errorMessage}`
    );

    if (process.env.SERPAPI_API_KEY) {
      console.warn(
        "[google-play] Falling back to SerpAPI for getAppReviews..."
      );
      try {
        return await getAppReviewsSerpApiFallback(productId, count);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `[google-play] SerpAPI fallback also failed: ${fallbackMessage}`
        );
      }
    }

    throw new Error(
      `Failed to get Google Play reviews for "${productId}": ${errorMessage}`
    );
  }
}
