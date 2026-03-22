# Scout Analysis Audit Report

**Test Case**: GlowStack (Beauty and skincare for women)
**Scan ID**: `20c27649-49da-4d94-8151-0678e970e396`
**Pipeline**: Synthesis mode, App Store
**Date Audited**: 2026-03-13

## Executive Summary

The master idea output (GlowStack) is well-grounded in competitor data with 6 relevant competitor flaws traced to real apps, properly calibrated solo-dev estimates, and 5 of 7 core features addressing documented feature requests. Two significant bugs were found: (1) the standalone `gap-analysis.json` file contains **stale Cognitize data** from a previous test run due to a scan-record gap_analysis_json being null; (2) `blue_ocean_json` is correctly null (not a bug) because 11 competitors were found, exceeding the `< 3` threshold. The master idea contains one P1 hallucination (global market size citation) that directly violates the prompt instruction, and the r/SkincareAddiction member count is approximately correct but unverified from within the pipeline.

---

## Bug Investigation: gap_analysis staleness + blue_ocean null

### BUG 1: `gap-analysis.json` Contains Stale Cognitize Data (P1)

**Symptom**: The file `scripts/qa-output/gap-analysis.json` contains a gap analysis about "Cognitize" (a speech coaching app), not the GlowStack beauty test case. The `ideaSummary` references "speech coaching" and competitors include Gibson (guitar app), FreshBooks (invoicing), Google Classroom, and language learning apps.

**Root Cause Chain**:

1. **The scan record's `gap_analysis_json` is null.** The `scan-record.json` output does not contain a `gap_analysis_json` field at all, meaning it was null/absent in the DB for scan `20c27649`.

2. **BUT the pipeline code DOES write gap analysis to the scan record.** In `src/lib/agents/scout.ts:1221-1222`:
   ```
   await db.update(scans).set({ gapAnalysisJson: gapJson }).where(eq(scans.id, scanId));
   ```
   This line executes in the synthesis pipeline at Step 7 (line 1206-1236). Since 11 opportunities were found, this code path IS reached. The most likely explanation is a **race condition or DB write failure** that was silently swallowed, OR the extraction script ran against a DB snapshot from before gap analysis completed.

3. **However, the gap analysis IS correctly stored on the opportunity rows.** Every opportunity in `opportunities.json` has a `gap_analysis_json` field containing correct beauty-themed data (referencing "Skincare Routine: BasicBeauty", "Skan", "Stilla", "GlowinMe", etc.).

4. **The extraction script (`extract-scout-data.mjs:42-57`) has a fallback**: if `scan.gap_analysis_json` is null, it queries `SELECT gap_analysis_json FROM opportunities WHERE scan_id = ${scanId} AND gap_analysis_json IS NOT NULL LIMIT 1`. This SHOULD return the correct beauty gap analysis from the opportunity rows.

5. **Most likely explanation**: The `gap-analysis.json` file is a **stale artifact from a prior Cognitize test run** that was NOT overwritten because the extraction script was either: (a) not re-run after the beauty test, or (b) the fallback query failed silently, or (c) the file was manually preserved. The opportunity data confirms the pipeline generated correct gap analysis for the beauty test case.

**Severity**: P1 for the audit output file (misleading QA data), but P3 for the actual pipeline (gap analysis is correctly generated and stored on opportunities).

**Fix**:
- Verify that the extraction script was actually re-run for scan `20c27649`. If not, re-run it.
- Add a `console.log` in the extraction script confirming which source (scan vs opportunity) provided the gap analysis.
- Investigate why `gap_analysis_json` is null on the scan record despite the pipeline code writing it.

### BUG 2: `blue_ocean_json` is null — NOT A BUG

**Symptom**: All 11 opportunities have `blue_ocean_json: null`. The scan record also has `blue_ocean_json: null`.

**Root Cause**: This is **correct behavior by design**. In `src/lib/agents/scout.ts:1239`:
```typescript
if (opportunityResults.length < 3) {
```
Blue ocean detection only runs when fewer than 3 competitors are found. The GlowStack beauty scan found **11 competitors**, so the blue ocean step is correctly skipped. The threshold makes sense — blue ocean analysis is designed for markets with little to no competition.

**Severity**: Not a bug. Working as designed.

**Note**: The same `< 3` threshold applies in `runScoutIdeaPipeline` (line 875) and `runScoutDiscoveryPipeline` (line 1653).

---

## Hallucination Findings

### H1: Global Market Size Citation Violates Prompt Instruction (P1)

**Source**: `master-idea.json` > `marketOpportunity` field
**Finding**: The output states: *"The global skincare market exceeds $180B"*
**Evidence**: The prompt at `scout-prompts.ts:468` explicitly says:
> "Do NOT cite global market sizes ('$180B skincare market'). Instead estimate the ADDRESSABLE market for a solo indie app"

The AI used the **exact example** the prompt told it NOT to use. Despite this violation, the rest of the `marketOpportunity` paragraph does ground claims in competitor data ("top skincare routine trackers have hundreds of ratings") and provides realistic projections ("10,000+ downloads and $3,000-$8,000 MRR within 12-18 months"). The global market size is the leading sentence and frames the opportunity in misleading terms for a solo indie developer.

**Impact**: High — undermines the solo-dev calibration and makes the opportunity sound larger than a solo builder can capture. The $180B figure is irrelevant to a solo developer building one iOS app.

**Fix**: Add a post-processing check in `synthesizeMasterIdea()` that scans the `marketOpportunity` string for patterns like `$\d+B` or `global.*market` and replaces/warns. Alternatively, increase prompt emphasis with a CRITICAL/ABSOLUTE RULE tag as done for other constraints (see A1 pattern in architect prompts).

### H2: r/SkincareAddiction "1.5M members" Claim (P2)

**Source**: `master-idea.json` > `marketViability.userAcquisitionStrategy`
**Finding**: Claims "r/SkincareAddiction (1.5M members)"
**Evidence**: Web search confirms the subreddit has approximately 1.4-1.5M members as of 2026, so the figure is **approximately correct** but was NOT sourced from the pipeline's own data — it was fabricated from the AI model's training data. The pipeline has no Reddit API integration or web scraping capability.
**Impact**: Low — the number happens to be roughly accurate, but it sets a precedent for citing external statistics without verification. Future runs on different topics could produce fabricated community sizes.

**Fix**: No immediate code fix needed, but consider adding a prompt instruction: "Do not cite specific community member counts or external statistics unless they come from the competitor data provided."

### H3: "10,000+ downloads and $3,000-$8,000 MRR" Projection (P3)

**Source**: `master-idea.json` > `marketOpportunity`
**Finding**: Projects "$3,000-$8,000 MRR within 12-18 months"
**Evidence**: The prompt's solo indie constraints (from QA fix S6) cap at "max $8K MRR, 5K users at month 12" — but that constraint is in `buildStrategicPlanningPrompt()` (Architect agent), NOT in the Scout's `synthesizeMasterIdea()`. The Scout prompt says "realistic indie pricing: $5-$15/month" which at $7.99/month would need 375-1,000 paying users for $3K-$8K MRR. With the `marketViability` section estimating "500 paying users at $7.99/month = $4,000 MRR", the math is internally consistent.
**Impact**: Low — the projection is reasonable for a beauty app niche and the math checks out. The upper bound of $8K MRR is optimistic but within the Architect's cap.

### H4: All 6 CompetitorFlaws Entries Trace to Real Apps (PASS)

**Source**: `master-idea.json` > `competitorFlaws` array
**Finding**: All 6 entries map to real apps found in `opportunities.json`:
- `1571959428` = Skincare Routine: BasicBeauty (560 ratings, 4.67 score) -- VERIFIED
- `6449196562` = Skan - AI Skincare and Beauty (1 rating, 4.76 score) -- VERIFIED
- `1428570992` = Skincare Routine (623 ratings, 4.55 score) -- VERIFIED
- `6443494117` = Stilla: Skincare Scanner (364 ratings, 4.5 score) -- VERIFIED
- `1450130797` = GlowinMe: Beauty Tracker (234 ratings, 4.58 score) -- VERIFIED
- `6754345115` = BeautyLog: Beauty Tracker (10 ratings, 4.1 score) -- VERIFIED

All are beauty/skincare apps directly relevant to the idea domain. The COMPETITORFLAWS FILTER instruction (S5 fix) is working correctly — no irrelevant-domain competitors appear.

**Impact**: None — this is a PASS.

### H5: Cost Estimate Within Solo Builder Budget (PASS)

**Source**: `master-idea.json` > `feasibilityAssessment.costEstimate`
**Finding**: States "$800-$3,500 for MVP" — well within the $500-$5,000 range specified by the prompt and below the $10K warning threshold in the post-processing code at `scout-prompts.ts:520-537`.
**Impact**: None — this is a PASS.

### H6: Skan "Privacy Scandal" — Unverifiable Claim (P2)

**Source**: `master-idea.json` > `coreFeatures[3]`, `competitorFlaws[1]`, `goNoGoFactors[3]`
**Finding**: Multiple references to "verified privacy scandal of competitors selling user facial data" and "users report facial photos being sold". This traces to the sentiment analysis of Skan (app ID `6449196562`) which has a pain point: "Privacy and data security concerns - users report facial photos being sold".
**Evidence**: This pain point comes from user reviews scraped by the pipeline. Whether reviews accurately reflect a real scandal is unverifiable from within the pipeline. The sentiment analysis correctly extracted what users said, but the master idea treats user accusations as verified facts ("verified privacy scandal").
**Impact**: Medium — if this claim appears in Architect outputs that reach end users, it could be libelous. The pain point from reviews is legitimate data, but characterizing it as a "verified" scandal is an AI embellishment.

**Fix**: Add prompt guidance: "When citing competitor issues from reviews, use hedging language like 'users report' rather than 'verified' unless you have confirmed the claim."

---

## Prompt Weighting Findings

### W1: Core Feature Gap/Pain Point Ratio (PASS)

**Source**: `master-idea.json` > `coreFeatures` array (7 features)
**Finding**: The prompt requires "at least 3 of 5-8 must address unmet feature requests (from the 'Wants' data)."

Analysis of the 7 features:
1. **Barcode & Photo Scanner** — Addresses feature gaps (database, scanner) from 4 competitors. **FEATURE GAP** count: 1
2. **Ingredient Conflict Engine** — Addresses missing conflict/pairing recommendations. **FEATURE GAP** count: 1
3. **Crash-Free Routine Tracker** — Primarily addresses pain points (crashes, data loss, bugs). **PAIN POINT** count: 1
4. **Privacy-First AI Skin Analysis** — Addresses both a pain point (privacy) and a feature gap (AI analysis behind paywall). **MIXED** count: 0.5 each
5. **Generous Freemium** — Addresses pain points (paywall complaints). **PAIN POINT** count: 1
6. **Smart Collection with Analytics** — Addresses feature requests (analytics, export, tracking). **FEATURE GAP** count: 1
7. **Unified Beauty Journal** — Addresses feature gaps (flexible photo logging). **FEATURE GAP** count: 1

Feature gap leaders: #1, #2, #6, #7 = 4 features. Pain point leaders: #3, #5 = 2 features. Mixed: #4 = 1 feature.

**Result**: 4-5 of 7 features address unmet feature requests. **PASSES** the "at least 3 of 5-8" requirement.

### W2: COMPETITORFLAWS FILTER Effectiveness (PASS)

**Source**: `master-idea.json` > `competitorFlaws` + post-processing code at `scout-prompts.ts:488-516`
**Finding**: All 6 competitor flaws are from beauty/skincare apps. No language learning, guitar, invoicing, or other irrelevant-domain apps appear. The fix from S5 (COMPETITORFLAWS FILTER instruction) is working correctly for this test case.

Additionally, the post-processing code at lines 509-516 filters out competitor flaws with unmatched app IDs, providing a code-level safety net.

**Impact**: None — PASS.

### W3: Confidence Score Calibration (WARN)

**Source**: `master-idea.json` > `confidenceScore: 72`
**Finding**: A score of 72/100 seems **slightly high** given the data quality:
- Only 1 out of 6 competitors (Skan) has a single rating (1 rating) — extremely thin signal
- All apps are App Store only with "N/A" installs — no install count data available
- The highest-rated competitor (Skincare Routine) has only 623 ratings — niche market
- The beauty app category is described as "crowded" with "dozens of players" in the caution factors

The goNoGoFactors correctly identify 3 "caution" items (Technical Feasibility, Database Quality, Competition Intensity) and 3 "go" items. A score of 72 implies moderate-high confidence, which seems generous given the data limitations. A score of 55-65 would better reflect the uncertainty.

**Impact**: Medium — could give the user false confidence in a market assessment built on thin data.

### W4: teamSize Correctly Set to "1 person" (PASS)

**Source**: `master-idea.json` > `difficultyBreakdown.teamSize`
**Finding**: Set to "1 person" as required by the prompt.

---

## Output Efficiency Findings

### E1: Master Idea Total Size — 14,213 Characters (WARN)

**Source**: `master-idea.json` — full content
**Finding**: The master idea JSON is ~14.2K characters. Key breakdown:
- `coreFeatures` (7 items): ~5,800 chars (41%) — each feature has 3-5 sentence descriptions
- `competitorFlaws` (6 items): ~3,800 chars (27%)
- `aiRecommendation`: ~2,500 chars (18%)
- `marketOpportunity` + `targetAudience`: ~1,200 chars (8%)
- Remaining fields: ~900 chars (6%)

The content is within the 12,288 token limit set for the `synthesizeMasterIdea` call (line 484), but is information-dense. The data will be used downstream by the Architect agent and displayed in the UI.

**Impact**: Low — the size is acceptable for the amount of competitor analysis performed. No critical redundancy found.

### E2: Core Feature Descriptions Are Verbose (P3)

**Source**: `master-idea.json` > `coreFeatures[*].description`
**Finding**: Feature descriptions average ~75 words each. Examples:
- Feature 1 (Barcode Scanner): 68 words with specific details about "crowdsourced + curated database" and "48 hours" verification timeline
- Feature 3 (Routine Tracker): 57 words listing specific sub-features (iCloud backup, streak gamification, UV index)

These descriptions contain valuable specificity for the Architect pipeline downstream. However, some could be trimmed without losing essential information (e.g., "eliminating the tedious manual input that plagues every competitor" is editorializing, not data).

**Impact**: Low — the verbosity is acceptable for downstream use but adds ~20% overhead compared to pure-data descriptions.

### E3: searchStrategy Duplicates Scan Record Data (P3)

**Source**: `master-idea.json` > `searchStrategy` (bottom of file, ~600 chars)
**Finding**: The `searchStrategy` field at the bottom of the master idea contains:
- `queries`: 15 search queries — these are the same queries stored in the scan record's strategy
- `categories`: `["6012", "6013"]` — same as the scan record
- `reasoning`: 3 sentences — adds context but duplicates what the pipeline already knows

This is injected by `synthesizeMasterIdea()` at line 540-544 in `scout-prompts.ts`:
```typescript
return {
    ...result,
    originalIdea: ideaText,
    searchStrategy,
};
```

The searchStrategy is passed IN to the function and appended to the output. It's stored redundantly on both the scan record (as part of the synthesis pipeline state) and the master idea JSON.

**Impact**: Low — ~600 chars of redundant data. The duplication serves a purpose: it makes the master idea self-contained for the Architect pipeline. Not worth removing.

### E4: Gap Analysis on Opportunities is Identical Across All 11 Rows (P2)

**Source**: `opportunities.json` — `gap_analysis_json` field on each of 11 opportunity rows
**Finding**: The same gap analysis JSON (~8K characters) is stored identically on ALL 11 opportunity rows in the database. This is by design (see `scout.ts:1223-1228`):
```typescript
for (const opp of opportunityResults) {
    await db.update(opportunities).set({ gapAnalysisJson: gapJson }).where(eq(opportunities.id, opp.id));
}
```

This results in ~88K of redundant data in the DB (8K x 11 rows) when it could be stored once on the scan record.

**Impact**: Medium — database bloat. For 11 opportunities, this is 10x redundant storage. The scan record SHOULD have the gap analysis (it's written at line 1222), but it appears to be null in this test case, suggesting the scan record write may have failed or been overwritten.

**Fix**: Investigate why the scan record's `gap_analysis_json` is null despite the pipeline writing to it. If fixed, the opportunity-level storage could be removed, reducing DB storage by ~90% for this field.

---

## Scorecard Table

| Check ID | Check Description | Result | Severity |
|----------|-------------------|--------|----------|
| BUG-1 | gap-analysis.json contains stale Cognitize data | **FAIL** | P1 (file artifact) / P3 (pipeline) |
| BUG-2 | blue_ocean_json is null | **PASS** | N/A (by design, 11 > 3 threshold) |
| H1 | No global market sizes in marketOpportunity | **FAIL** | P1 |
| H2 | r/SkincareAddiction member count accuracy | **WARN** | P2 |
| H3 | MRR projection reasonableness | **PASS** | P3 |
| H4 | CompetitorFlaws trace to real apps | **PASS** | -- |
| H5 | Cost estimate within $10K solo budget | **PASS** | -- |
| H6 | Skan "privacy scandal" verified claim | **WARN** | P2 |
| W1 | 3+ of 5-8 features address feature gaps | **PASS** | -- |
| W2 | COMPETITORFLAWS FILTER excludes irrelevant domains | **PASS** | -- |
| W3 | Confidence score calibration vs data quality | **WARN** | P2 |
| W4 | teamSize = "1 person" | **PASS** | -- |
| E1 | Master idea total size (14.2K chars) | **WARN** | P3 |
| E2 | Core feature description verbosity | **WARN** | P3 |
| E3 | searchStrategy duplication | **PASS** | P3 (acceptable redundancy) |
| E4 | Gap analysis duplicated across 11 opportunity rows | **WARN** | P2 |

---

## Summary Statistics

- **Total checks**: 16
- **PASS**: 9 (56%)
- **WARN**: 5 (31%)
- **FAIL**: 2 (13%)

**By severity**:
- P1: 2 (global market size violation, stale gap-analysis file)
- P2: 4 (r/SkincareAddiction unverified, Skan scandal embellishment, confidence overcalibration, gap analysis DB duplication)
- P3: 3 (MRR projection, feature verbosity, master idea size)

**Key Recommendations** (prioritized):
1. **P1**: Add post-processing in `synthesizeMasterIdea()` to detect and strip global market size citations (e.g., regex for `$\d+B.*market`)
2. **P1**: Investigate why `gap_analysis_json` is null on the scan record despite pipeline code writing to it. Re-run extraction script to verify `gap-analysis.json` correctness.
3. **P2**: Lower confidence score calibration — consider a post-processing adjustment that caps confidence based on data quality signals (e.g., total competitor ratings < 2000 => cap at 65).
4. **P2**: Deduplicate gap analysis storage — store only on the scan record, not on every opportunity row.
