# Scout Search & Scoring Audit — GlowLog

**Auditor**: Agent 1 (Scout Search & Scoring)
**Date**: 2026-03-13
**Input**: `scan-record.json`, `opportunities.json`
**Scan ID**: `3f3e6080-d300-4785-af3f-938f71eb24c6`
**Mode**: synthesis | **Store**: app_store | **Status**: completed
**Apps scraped**: 42 | **Opportunities**: 12

---

## Check 1: Search Queries On-Domain

**Result: PASS**

All 15 search queries are directly relevant to the skincare/logging/tracking domain:

| # | Query | Domain Relevance |
|---|-------|-----------------|
| 1 | skincare routine tracker | Direct match |
| 2 | skincare log app | Direct match |
| 3 | GlowLog | App name query |
| 4 | skin care diary | Direct match |
| 5 | beauty routine tracker | Adjacent (beauty/skincare overlap) |
| 6 | skincare journal | Direct match |
| 7 | face care tracker | Direct match |
| 8 | skin health tracker | Direct match |
| 9 | acne tracker app | Direct match (skincare sub-niche) |
| 10 | skincare ingredient tracker | Direct match |
| 11 | beauty log | Adjacent (beauty/skincare overlap) |
| 12 | skin condition tracker | Direct match |
| 13 | daily skincare routine | Direct match |
| 14 | cosmetic routine planner | Adjacent (cosmetic/skincare overlap) |
| 15 | skin care regimen app | Direct match |

Categories searched: `6013` (Health & Fitness), `6012` (Lifestyle) — both appropriate for a skincare app.

No off-domain queries detected. The strategy reasoning correctly identifies the Health & Fitness / Lifestyle intersection.

---

## Check 2: Feasibility Anti-Clustering

**Result: PASS**

Feasibility score distribution across 12 opportunities:

| Score | Count | Percentage |
|-------|-------|-----------|
| 72 | 3 | 25.0% |
| 52 | 2 | 16.7% |
| 68 | 2 | 16.7% |
| 78 | 2 | 16.7% |
| 38 | 1 | 8.3% |
| 58 | 1 | 8.3% |
| 62 | 1 | 8.3% |

**Maximum cluster**: 25.0% (score 72, 3 opportunities) — well below the 50% threshold.

7 distinct feasibility scores across 12 opportunities shows healthy spread.

---

## Check 3: Composite Score Formula

**Result: PASS**

Formula verified: `composite = round(market_size * 0.3 + dissatisfaction * 0.4 + feasibility * 0.3)`

| App | Market | Dissatisfaction | Feasibility | Composite (actual) | Composite (expected) | Diff |
|-----|--------|----------------|-------------|-------------------|---------------------|------|
| Charm: Skincare Routine 360° | 54 | 12 | 72 | 43 | 43 | 0 |
| Skincare Routine | 42 | 11 | 72 | 39 | 39 | 0 |
| Skincare Routine: BasicBeauty | 42 | 8 | 72 | 37 | 37 | 0 |
| SkinSort - Skincare Scanner | 54 | 7 | 52 | 35 | 35 | 0 |
| Stilla: Skincare Scanner | 34 | 13 | 62 | 34 | 34 | 0 |
| Skincare Routine: FeelinMySkin | 34 | 9 | 68 | 34 | 34 | 0 |
| Skin Bliss: Skincare Routines | 42 | 7 | 58 | 33 | 33 | 0 |
| Skincare Routine Planner | 26 | 9 | 68 | 32 | 32 | 0 |
| Skan - AI Skincare and Beauty | 54 | 6 | 38 | 30 | 30 | 0 |
| Routinely: Clear Skin Coach | 34 | 8 | 52 | 29 | 29 | 0 |
| Dewi Skincare Routine Tracker | 8 | 6 | 78 | 28 | 28 | 0 |
| Skincare Routine Time Halo | 8 | 0 | 78 | 26 | 26 | 0 |

**All 12 opportunities match exactly (0 deviation)**. No rounding tolerance needed.

---

## Check 4: No Duplicate App IDs

**Result: PASS**

12 unique app IDs out of 12 total opportunities. No duplicates found.

Unique IDs: `1480983279`, `1428570992`, `1571959428`, `6478040418`, `6443494117`, `1526044677`, `1385561364`, `6475258897`, `6449196562`, `6748936998`, `6738664200`, `6478578614`

---

## Check 5: App Store Installs Handling

**Result: PASS**

All 12 opportunities have:
- `store`: `"app_store"`
- `installs`: `"N/A"` (correct — App Store does not expose install counts)

Market size scores use the rating-based fallback formula from `calculateMarketSize()`:
- `installScore = 10` (N/A parses to 0, hits the `else` branch)
- `ratingScore` uses 8 granular tiers: 8, 14, 22, 30, 40, 50, 65, 80
- Formula: `round(installScore * 0.2 + ratingScore * 0.8)` (80% weighting on ratings when installs unavailable)

Verification of all 12 opportunities against actual code tiers (`scout.ts:73-107`):

| App | Ratings | Rating Tier | Expected Market | Actual Market | Match |
|-----|---------|------------|----------------|---------------|-------|
| Charm: Skincare Routine 360° | 1471 | >=1000 -> 65 | 54 | 54 | OK |
| Skincare Routine | 623 | >=500 -> 50 | 42 | 42 | OK |
| Skincare Routine: BasicBeauty | 563 | >=500 -> 50 | 42 | 42 | OK |
| SkinSort - Skincare Scanner | 4081 | >=1000 -> 65 | 54 | 54 | OK |
| Stilla: Skincare Scanner | 364 | >=200 -> 40 | 34 | 34 | OK |
| Skincare Routine: FeelinMySkin | 214 | >=200 -> 40 | 34 | 34 | OK |
| Skin Bliss: Skincare Routines | 759 | >=500 -> 50 | 42 | 42 | OK |
| Skincare Routine Planner | 100 | >=100 -> 30 | 26 | 26 | OK |
| Skan - AI Skincare and Beauty | 2025 | >=1000 -> 65 | 54 | 54 | OK |
| Routinely: Clear Skin Coach | 219 | >=200 -> 40 | 34 | 34 | OK |
| Dewi Skincare Routine Tracker | 8 | <10 -> 8 | 8 | 8 | OK |
| Skincare Routine Time Halo | 4 | <10 -> 8 | 8 | 8 | OK |

**All 12 match perfectly.**

Dissatisfaction scores were also verified against the `calculateDissatisfaction()` formula (`round(max(0, min(100, ((5 - score) / 4) * 100)))`) — all 12 match exactly.

**Note**: No histogram data is present (`histogram_json` is null for all opportunities). The `formatRealDataContext()` histogram-sum install proxy cannot be verified, but this is expected since histogram data is not always available from App Store scraping.

---

## Summary

| Check | Result | Severity |
|-------|--------|----------|
| 1. Search queries on-domain | PASS | — |
| 2. Feasibility anti-clustering (<=50%) | PASS (max 25.0%) | — |
| 3. Composite score formula | PASS (0 deviation all 12) | — |
| 4. No duplicate app_ids | PASS (12/12 unique) | — |
| 5. App Store installs handling | PASS (all N/A, rating tiers correct) | — |

**Overall: ALL 5 CHECKS PASS. No issues found.**

The Scout search and scoring pipeline produced correct, well-distributed results for the GlowLog skincare app test case.
