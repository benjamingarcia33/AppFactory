# Scout Search & Scoring Audit Report

## Executive Summary

The Scout agent's search strategy for the "Beauty and skincare for women" test case produced 15 on-domain queries and 11 opportunities with plausible app data. However, two critical issues undermine the output quality: (1) the gap_analysis_json is **identical** across all 11 opportunities — a severe data duplication bug, and (2) feasibility scoring shows heavy clustering at 72 despite the ANTI-CLUSTERING prompt, with 7 of 11 apps sharing the exact same score. Sentiment sample quotes are traceable to actual scraped reviews and app metadata appears plausible.

---

## Hallucination Findings

### H1: Sentiment sample quotes are verifiable — PASS
- **Severity**: N/A (no issue found)
- **Source**: `opportunities.json` → `sentiment_json.painPoints[].sampleQuotes` cross-referenced with `reviews_json`
- **Finding**: All checked sample quotes trace back to actual scraped reviews. For example:
  - BeautyLog's "the user interface is a little clunky and hard to use at times" matches review `13629404208`
  - Skincare Routine's "This app only covers certain brands" matches review `13122773824`
  - BasicBeauty's "the photo settings is stuck in 'private access only'" matches review `13383055117`
  - Skan's "completely unable to use unless you pay!!" matches review `13736575960`
  - Nykaa's "The customer service is actually so horrible" matches review `13734126930`
- **Evidence**: Direct text matches between `sampleQuotes` and `reviews_json` entries across multiple opportunities
- **Impact**: None — this dimension passes
- **Fix**: N/A

### H2: App ratings and review counts are plausible — PASS
- **Severity**: N/A (no issue found)
- **Source**: `opportunities.json` → `score`, `ratings`, `histogram_json`
- **Finding**: All app ratings and review counts look plausible and internally consistent:
  - BeautyLog: 4.10 with 10 ratings, histogram {1:2,2:0,3:0,4:1,5:7} — plausible for a new niche app
  - Skincare Routine: 4.55 with 623 ratings, histogram {1:39,2:6,3:20,4:65,5:493} — plausible for established app
  - BasicBeauty: 4.67 with 560 ratings — plausible
  - Skan: 4.76 with 1 rating BUT histogram shows {1:25,2:17,3:58,4:197,5:1637} — **anomaly**: `ratings: 1` contradicts histogram total of 1,934
  - Ulta Beauty: 4.87 with 2 ratings BUT histogram shows {1:26254,...,5:2044558} — **anomaly**: `ratings: 2` contradicts histogram total of 2,215,593
  - Nykaa: 4.39 with 1 rating BUT histogram shows {1:110,...,5:1119} — **anomaly**: `ratings: 1` contradicts histogram total of 1,638
- **Evidence**: The `ratings` field for Skan (1), Ulta (2), and Nykaa (1) are grossly inconsistent with their histograms. This appears to be an App Store scraper issue where `ratings` returns App Store "ratings for this version" rather than total, while `histogram_json` returns all-time data.
- **Impact**: Low for audit purposes — the `market_size` calculation uses the `ratings` field, so Skan/Ulta/Nykaa get artificially low market_size scores (9 each). This penalizes large apps that recently updated, but since they are shopping/e-commerce apps not truly competing in the skincare tools niche, the impact on ranking is minimal.
- **Fix**: The scraper should use all-time ratings count (sum of histogram values) as a fallback when `ratings` appears anomalously low vs. histogram.

### H3: All 15 search queries relate to beauty/skincare domain — PASS
- **Severity**: N/A (no issue found)
- **Source**: `scan-record.json` → `master_idea_json.searchStrategy.queries`
- **Finding**: All 15 queries are on-domain:
  1. "skincare routine tracker" — direct feature
  2. "beauty app for women" — category
  3. "skin care analyzer" — feature
  4. "makeup tutorial app" — adjacent
  5. "beauty product recommendations" — feature
  6. "skincare regimen planner" — feature
  7. "face skin analysis" — feature
  8. "cosmetics tracker" — feature
  9. "beauty routine women" — category
  10. "skin type quiz app" — feature
  11. "personalized skincare" — feature
  12. "beauty tips daily" — category
  13. "face care routine" — feature
  14. "makeup looks app" — adjacent
  15. "skin health tracker" — feature
- **Evidence**: All queries contain beauty/skincare/cosmetics terminology
- **Impact**: None — this dimension passes
- **Fix**: N/A

### H4: Gap analysis competitorIds reference real opportunities — FAIL (critical data issue)
- **Severity**: P1
- **Source**: `opportunities.json` → `gap_analysis_json.competitorComparisons[].competitorId`
- **Finding**: The gap_analysis_json references valid app IDs that correspond to real opportunities in the list. All 11 competitorIds (1571959428, 1636637479, 6449196562, 561930308, 1592160339, 1022363908, 6754345115, 1428570992, 6443494117, 1664400242, 1450130797) match actual opportunity `app_id` values. **However**, every single opportunity contains the exact same gap_analysis_json — see E1 below for details.
- **Evidence**: Byte-level comparison of `gap_analysis_json` across all 11 opportunities shows identical content
- **Impact**: Critical — the gap analysis does not differentiate between opportunities. Each app's gap analysis should be tailored to compare THAT app specifically against competitors, but instead each app receives a global analysis that is identical to every other app.
- **Fix**: The gap analysis generation should produce per-opportunity comparisons, not a single global analysis copied to all records. The gap analysis prompt should be scoped to the specific app being analyzed, highlighting where THAT app specifically falls short.

---

## Prompt Weighting Findings

### W1: Search query distribution lacks direct competitor names
- **Severity**: P2
- **Source**: `scan-record.json` → `searchStrategy.queries` vs. prompt in `scout-prompts.ts:251-264`
- **Finding**: The prompt requests queries across 5 categories: (1) direct competitor names, (2) feature-specific, (3) problem-specific, (4) broader category, (5) adjacent solutions. The actual distribution:
  - **Direct competitor names**: 0/15 — ZERO queries use actual app names like "Skincare Routine app", "Stilla", "GlowinMe", "BasicBeauty"
  - **Feature-specific**: 9/15 — "skincare routine tracker", "skin care analyzer", "skincare regimen planner", "face skin analysis", "cosmetics tracker", "skin type quiz app", "personalized skincare", "face care routine", "skin health tracker"
  - **Problem-specific**: 0/15 — no queries frame user problems like "fix dry skin app" or "stop buying wrong skincare"
  - **Broader category**: 4/15 — "beauty app for women", "beauty routine women", "beauty tips daily", "beauty product recommendations"
  - **Adjacent solutions**: 2/15 — "makeup tutorial app", "makeup looks app"
- **Evidence**: Despite the prompt explicitly requesting "direct competitor names" and "problem-specific" queries, neither category is represented. The queries are heavily skewed toward generic feature keywords.
- **Impact**: Medium — missing competitor name queries means the search may miss discovering specific top competitors that dominate the space. Missing problem queries reduces the chances of finding pain-point-focused niche apps.
- **Fix**: Add 2-3 concrete examples of each query type in the prompt. For competitor names, add "e.g., 'BasicBeauty app', 'GlowinMe tracker'". For problem queries, add "e.g., 'app to stop wasting money on skincare', 'track which products work for my skin'".

### W2: Feasibility score clustering at 72 — ANTI-CLUSTERING CHECK ineffective
- **Severity**: P1
- **Source**: `opportunities.json` → `feasibility` field; prompt in `scout-prompts.ts:219-221`
- **Finding**: 7 out of 11 opportunities (64%) have a feasibility score of exactly 72:
  - BeautyLog: 72
  - Skincare Routine: 72
  - BasicBeauty: 72
  - GlowinMe: 72
  - Beauty Care: 72
  - Daily Beauty Care: 78 (different)
  - Beauty Tips: 72
  - Stilla: 68 (different)
  - Skan: 62 (different)
  - Nykaa: 25 (different)
  - Ulta: 35 (different)

  The ANTI-CLUSTERING CHECK in the prompt says: "After scoring, if your result falls between 70-74, re-examine whether the app is truly 'average complexity' or you defaulted to the middle." Despite this, 7 apps landed at exactly 72. The check is ineffective because:
  1. Each app is scored **independently** in its own API call — the model has no batch context to compare against
  2. The check asks the model to self-evaluate a single score, but cannot reference other apps' scores
  3. "Beauty Care - Skincare Guide" (a content-only video tutorial app) should NOT have the same feasibility as "Skincare Routine" (a full product database + layering engine + scheduling app)
- **Evidence**:
  - Beauty Care (content app, 1 review, video tutorials only) = 72
  - Skincare Routine (database + conflict engine + scheduling + diary) = 72
  - BeautyLog (social community + reviews + tracking) = 72
  - These apps have vastly different complexity levels but identical scores
- **Impact**: High — feasibility is 30% of the composite score. When 7 apps share the same feasibility, the composite ranking is driven entirely by market_size and dissatisfaction, making the feasibility dimension useless for differentiation.
- **Fix**: Two options: (1) Score feasibility in batches so the model can compare apps and enforce spread, or (2) Add a post-scoring normalization step that detects clusters and forces minimum spread (e.g., re-prompt clustered apps with the batch context). Option 1 is preferred since it leverages the model's comparison ability.

### W3: Composite score ranking partially reflects logical competitor order
- **Severity**: P3
- **Source**: `opportunities.json` → composite_score values
- **Finding**: The composite formula is `market_size * 0.3 + dissatisfaction * 0.4 + feasibility * 0.3`. Ranking:
  | Rank | App | Market | Dissat. | Feasib. | Composite |
  |------|-----|--------|---------|---------|-----------|
  | 1 | BeautyLog | 12 | 23 | 72 | 34 |
  | 1 | Skincare Routine | 26 | 11 | 72 | 34 |
  | 3 | BasicBeauty | 26 | 8 | 72 | 33 |
  | 4 | GlowinMe | 22 | 10 | 72 | 32 |
  | 4 | Stilla | 22 | 13 | 68 | 32 |
  | 6 | Beauty Care | 15 | 10 | 72 | 30 |
  | 7 | Daily Beauty Care | 9 | 0 | 78 | 26 |
  | 8 | Beauty Tips | 12 | 0 | 72 | 25 |
  | 9 | Skan | 9 | 6 | 62 | 24 |
  | 10 | Nykaa | 9 | 15 | 25 | 16 |
  | 11 | Ulta Beauty | 9 | 3 | 35 | 14 |

  Logical assessment:
  - **Good**: Nykaa (shopping app, not a competitor) and Ulta (retail app) correctly rank at the bottom with low feasibility scores. Skan also ranks low due to moderate feasibility.
  - **Questionable**: BeautyLog (10 ratings, brand-new app) ties for #1 with Skincare Routine (623 ratings, established). BeautyLog's high dissatisfaction (23 vs Skincare Routine's 11) compensates for its low market_size. This is arguable — a new app with 10 ratings having high dissatisfaction is suspicious (based on 2 one-star reviews out of 10 total).
  - **Questionable**: The top 6 apps are separated by only 4 points (30-34), making the ranking nearly meaningless for differentiation.
- **Evidence**: 4-point spread across top 6 opportunities
- **Impact**: Low-medium — the narrow spread means any small scoring error flips rankings, but the general tier structure (skincare tools > content apps > shopping/retail apps) is correct.
- **Fix**: Consider logarithmic scaling for market_size to better separate niche (10 ratings) from established (600+ ratings) apps. Currently 200-rating apps score 40 and 600-rating apps score 50 — only a 10-point gap that gets diluted to 3 points in the composite.

### W4: Dissatisfaction metric anomaly for apps with rating/histogram mismatch
- **Severity**: P2
- **Source**: `scout.ts:109-114` — `calculateDissatisfaction(score)` formula
- **Finding**: Dissatisfaction is calculated purely from the star rating: `((5 - score) / 4) * 100`. This means:
  - Skan (4.76 stars) → dissatisfaction = 6. But Skan has overwhelmingly negative actual sentiment (paywall complaints, crash reports, privacy scandals). The 4.76 rating appears inflated by fake/early reviews while the actual user experience is terrible.
  - Ulta (4.87 stars) → dissatisfaction = 3. Despite critical technical issues (crashes, login failures) documented in dozens of reviews.
  - The star rating doesn't capture the sentiment reality because the `score` field represents the App Store's weighted average which can be dominated by old 5-star ratings.
- **Evidence**: Skan's sentiment_json has `overallSentiment: "negative"` and 4 critical pain points, yet gets a low dissatisfaction score of 6 because its star rating is 4.76.
- **Impact**: Medium — apps with deceptive star ratings (high rating but actually terrible UX) are incorrectly deprioritized as opportunities. Skan is arguably the BEST opportunity (massive user frustration, clear competitor failure) but ranks #9 out of 11.
- **Fix**: Incorporate sentiment analysis results into dissatisfaction calculation. When `overallSentiment` is "negative" but star rating is high, apply a correction factor (e.g., boost dissatisfaction by 20-30 points). Alternatively, weight the 1-star percentage from the histogram.

---

## Output Efficiency Findings

### E1: Gap analysis is IDENTICAL across all 11 opportunities — critical duplication bug
- **Severity**: P1
- **Source**: `opportunities.json` → `gap_analysis_json` across all 11 records
- **Finding**: Every single opportunity contains the **exact same** gap_analysis_json content. The `ideaSummary`, `competitorComparisons` (all 11 entries with identical gapScores), `uniqueAdvantages`, and `marketPositioning` are byte-for-byte identical across all 11 opportunities. This means:
  - BeautyLog's gap analysis compares against itself as a competitor (gapScore 66)
  - Skan's gap analysis compares against itself as a competitor (gapScore 82)
  - Every app lists the same 11 competitor comparisons, same 9 unique advantages, same market positioning text
- **Evidence**: The `ideaSummary` starts with "A comprehensive beauty and skincare app for women that combines personalized skincare routines..." in ALL 11 records. The `competitorComparisons` array has 11 entries in every record, with identical competitorNames, competitorIds, gapScores, painPointsExploited, and featureGaps.
- **Impact**: Critical — the gap analysis is supposed to be the per-opportunity competitive intelligence, showing how the proposed app can beat EACH specific competitor. Instead, it's a single global analysis copy-pasted 11 times. This makes the gap_analysis_json field 11x larger than necessary with zero per-app differentiation.
- **Fix**: The gap analysis generation in the Scout pipeline should either (a) generate a single global gap analysis stored at the scan level (not per-opportunity), or (b) generate per-opportunity gap analyses that are actually tailored to each specific competitor, showing what advantages GlowStack would have against THAT particular app.

### E2: Redundant search queries that would return overlapping results
- **Severity**: P3
- **Source**: `scan-record.json` → `searchStrategy.queries`
- **Finding**: Several queries are near-duplicates that would return highly overlapping App Store results:
  - "skincare routine tracker" vs "skincare regimen planner" vs "face care routine" — all target routine-management apps
  - "beauty app for women" vs "beauty routine women" — near-identical intent
  - "skin care analyzer" vs "face skin analysis" — same concept, different phrasing
  - "makeup tutorial app" vs "makeup looks app" — overlapping intent
  - "personalized skincare" vs "skin type quiz app" — related but moderately distinct
- **Evidence**: At least 4 pairs of queries with >70% expected result overlap
- **Impact**: Low — redundant queries waste scraping API calls but don't harm result quality (deduplication presumably happens downstream). With 15 queries, having 4-5 redundant ones means ~30% wasted API calls.
- **Fix**: The prompt already says "No near-duplicates" but the model doesn't comply. Adding a post-generation deduplication step (cosine similarity on query embeddings, threshold 0.7) would be more reliable than prompt instructions.

### E3: Sentiment summary partially duplicates painPoints and praisedAspects
- **Severity**: P3
- **Source**: `opportunities.json` → `sentiment_json` fields
- **Finding**: The `summary` field in sentiment_json re-describes information already present in `painPoints` and `praisedAspects` arrays. For example, Skincare Routine's summary mentions "limited product database", "requiring manual input", and "outdated UI design" — all of which are already enumerated in `painPoints`. The `praisedAspects` list items are also restated.
- **Evidence**: Skincare Routine's summary is 384 characters of prose that adds minimal information beyond what the structured arrays already convey.
- **Impact**: Minimal — the summary serves as a human-readable executive summary which has value for display purposes. The duplication is by design for UX reasons.
- **Fix**: Not critical. If token reduction is needed, the summary could be shortened to 1-2 sentences of net-new insight not captured in the arrays.

---

## Scorecard Table

| Check ID | Dimension | Description | Result | Severity |
|----------|-----------|-------------|--------|----------|
| H1 | Hallucination | Sentiment quotes traceable to real reviews | PASS | - |
| H2 | Hallucination | App ratings/review counts plausible | WARN | P3 |
| H3 | Hallucination | All 15 queries relate to beauty/skincare | PASS | - |
| H4 | Hallucination | Gap analysis competitorIds reference real opps | FAIL | P1 |
| W1 | Prompt Weighting | Query distribution across 5 categories | FAIL | P2 |
| W2 | Prompt Weighting | Feasibility anti-clustering effectiveness | FAIL | P1 |
| W3 | Prompt Weighting | Composite ranking matches logical order | WARN | P3 |
| W4 | Prompt Weighting | Dissatisfaction metric accuracy | FAIL | P2 |
| E1 | Output Efficiency | Gap analysis duplication across opportunities | FAIL | P1 |
| E2 | Output Efficiency | Redundant search queries | WARN | P3 |
| E3 | Output Efficiency | Sentiment summary duplication | PASS | - |

---

## Summary Statistics

| Dimension | Passed | Warned | Failed | Total |
|-----------|--------|--------|--------|-------|
| Hallucination | 2 | 1 | 1 | 4 |
| Prompt Weighting | 0 | 1 | 3 | 4 |
| Output Efficiency | 1 | 1 | 1 | 3 |
| **Total** | **3** | **3** | **5** | **11** |

| Severity | Count |
|----------|-------|
| P1 | 3 (H4, W2, E1) |
| P2 | 2 (W1, W4) |
| P3 | 3 (H2, W3, E2) |

### Top Priority Fixes
1. **P1 — E1/H4: Gap analysis identical across all 11 opportunities.** This is the most impactful bug. The gap analysis should be either a single global document or truly per-opportunity tailored content. Currently it wastes storage and provides zero differentiation.
2. **P1 — W2: Feasibility clustering at 72.** 64% of apps share the exact same score, nullifying the feasibility dimension. Batch scoring or post-scoring normalization needed.
3. **P2 — W4: Dissatisfaction ignores sentiment reality.** Skan (negative sentiment, 4.76 stars) gets a lower dissatisfaction score than BeautyLog (positive sentiment, 4.10 stars). The formula should incorporate sentiment analysis output.
4. **P2 — W1: Missing competitor-name and problem-specific queries.** The search strategy has zero direct competitor name queries despite the prompt requesting them.
