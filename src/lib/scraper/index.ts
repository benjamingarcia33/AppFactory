import type { AppStore, ScrapedApp, ScrapedReview } from "@/lib/types";
import * as googlePlay from "./google-play";
import * as appStore from "./app-store";

export async function scrapeCategory(
  store: AppStore,
  category: string
): Promise<ScrapedApp[]> {
  if (store === "google_play") {
    return googlePlay.searchTopApps(category);
  }
  return appStore.searchApps(category);
}

export async function searchByQuery(
  store: AppStore,
  query: string,
  num?: number
): Promise<ScrapedApp[]> {
  if (store === "google_play") {
    return googlePlay.searchByQuery(query, num);
  }
  return appStore.searchByQuery(query, num);
}

export async function scrapeReviews(
  store: AppStore,
  appId: string,
  count?: number
): Promise<ScrapedReview[]> {
  if (store === "google_play") {
    return googlePlay.getAppReviews(appId, count);
  }
  return appStore.getAppReviews(appId, count);
}
