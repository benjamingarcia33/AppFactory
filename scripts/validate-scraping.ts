/**
 * Scraping Validation Script
 *
 * Compares scraped data against ground truth from iTunes Lookup API (iOS)
 * and google-play-scraper fullDetail (Android).
 *
 * Run: npx tsx scripts/validate-scraping.ts
 */

import gplay from "google-play-scraper";

// --- Known apps for validation ---

interface TestApp {
  name: string;
  iosId: string;
  gplayId: string;
}

const TEST_APPS: TestApp[] = [
  { name: "Instagram", iosId: "389801252", gplayId: "com.instagram.android" },
  { name: "Spotify", iosId: "324684580", gplayId: "com.spotify.music" },
  { name: "Duolingo", iosId: "570060128", gplayId: "com.duolingo" },
  { name: "WhatsApp", iosId: "310633997", gplayId: "com.whatsapp" },
  { name: "TikTok", iosId: "835599320", gplayId: "com.zhiliaoapp.musically" },
  { name: "YouTube", iosId: "544007664", gplayId: "com.google.android.youtube" },
  { name: "Netflix", iosId: "363590051", gplayId: "com.netflix.mediaclient" },
  { name: "Uber", iosId: "368677368", gplayId: "com.ubercab" },
  { name: "Telegram", iosId: "686449807", gplayId: "org.telegram.messenger" },
  { name: "Shazam", iosId: "284993459", gplayId: "com.shazam.android" },
];

// Tolerances
const SCORE_TOLERANCE = 0.1;
const RATINGS_TOLERANCE_PCT = 0.05; // 5%

interface ValidationResult {
  app: string;
  store: "iOS" | "GPlay";
  passed: boolean;
  details: string;
  scrapedScore?: number;
  expectedScore?: number;
  scrapedRatings?: number;
  expectedRatings?: number;
}

// --- iTunes Lookup API (ground truth for iOS) ---

interface ITunesResult {
  trackId: number;
  trackName: string;
  averageUserRating?: number;
  userRatingCount?: number;
}

async function fetchITunesLookup(appId: string): Promise<ITunesResult | null> {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${appId}&country=us`);
    const data = await res.json();
    const results = data.results as ITunesResult[] | undefined;
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch {
    return null;
  }
}

// --- Google Play ground truth ---

interface GPlayDetail {
  score?: number;
  ratings?: number;
}

async function fetchGPlayDetail(appId: string): Promise<GPlayDetail | null> {
  try {
    const detail = await gplay.app({ appId });
    return {
      score: detail.score,
      ratings: detail.ratings,
    };
  } catch {
    return null;
  }
}

// --- Scraper imports (project scrapers) ---

async function scrapeIOS(appId: string): Promise<{ score: number; ratings: number } | null> {
  try {
    // Dynamic import to handle path aliases via tsx
    const store = await import("app-store-scraper");
    const detail = await store.default.app({ id: appId });
    return {
      score: Number(detail.score ?? 0),
      ratings: Number(detail.reviews ?? 0),
    };
  } catch {
    return null;
  }
}

async function scrapeGPlay(appId: string): Promise<{ score: number; ratings: number } | null> {
  try {
    const detail = await gplay.app({ appId });
    return {
      score: Number(detail.score ?? 0),
      ratings: Number(detail.ratings ?? 0),
    };
  } catch {
    return null;
  }
}

// --- Comparison ---

function compareValues(
  app: string,
  store: "iOS" | "GPlay",
  scraped: { score: number; ratings: number } | null,
  expected: { score: number; ratings: number } | null
): ValidationResult {
  if (!scraped) {
    return { app, store, passed: false, details: "Scraping failed" };
  }
  if (!expected) {
    return { app, store, passed: false, details: "Ground truth fetch failed" };
  }

  const scoreDiff = Math.abs(scraped.score - expected.score);
  const scoreOk = scoreDiff <= SCORE_TOLERANCE;

  const ratingsDiff = expected.ratings > 0
    ? Math.abs(scraped.ratings - expected.ratings) / expected.ratings
    : (scraped.ratings === 0 ? 0 : 1);
  const ratingsOk = ratingsDiff <= RATINGS_TOLERANCE_PCT;

  const passed = scoreOk && ratingsOk;
  const details = [
    `score: ${scraped.score.toFixed(2)} vs ${expected.score.toFixed(2)} (diff ${scoreDiff.toFixed(3)}, ${scoreOk ? "OK" : "FAIL"})`,
    `ratings: ${scraped.ratings.toLocaleString()} vs ${expected.ratings.toLocaleString()} (diff ${(ratingsDiff * 100).toFixed(1)}%, ${ratingsOk ? "OK" : "FAIL"})`,
  ].join("; ");

  return {
    app,
    store,
    passed,
    details,
    scrapedScore: scraped.score,
    expectedScore: expected.score,
    scrapedRatings: scraped.ratings,
    expectedRatings: expected.ratings,
  };
}

// --- Main ---

async function main() {
  console.log("=== Scraping Validation ===\n");
  console.log(`Testing ${TEST_APPS.length} apps on iOS + GPlay (${TEST_APPS.length * 2} total checks)\n`);

  const results: ValidationResult[] = [];

  for (const testApp of TEST_APPS) {
    console.log(`Checking ${testApp.name}...`);

    // iOS
    const [iosScraped, iosExpected] = await Promise.all([
      scrapeIOS(testApp.iosId),
      fetchITunesLookup(testApp.iosId),
    ]);
    const iosGround = iosExpected
      ? { score: iosExpected.averageUserRating ?? 0, ratings: iosExpected.userRatingCount ?? 0 }
      : null;
    results.push(compareValues(testApp.name, "iOS", iosScraped, iosGround));

    // GPlay
    const [gplayScraped, gplayExpected] = await Promise.all([
      scrapeGPlay(testApp.gplayId),
      fetchGPlayDetail(testApp.gplayId),
    ]);
    const gplayGround = gplayExpected
      ? { score: gplayExpected.score ?? 0, ratings: gplayExpected.ratings ?? 0 }
      : null;
    results.push(compareValues(testApp.name, "GPlay", gplayScraped, gplayGround));

    // Small delay to be respectful
    await new Promise((r) => setTimeout(r, 300));
  }

  // --- Report ---
  console.log("\n=== Results ===\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const r of results) {
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${r.app} (${r.store}): ${r.details}`);
  }

  console.log(`\n=== Summary: ${passed}/${results.length} passed, ${failed} failed ===`);

  if (failed > 0) {
    console.log("\nFailed checks:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - ${r.app} (${r.store}): ${r.details}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Validation script error:", err);
  process.exit(1);
});
