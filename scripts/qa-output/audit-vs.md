# Visual Strategy Audit Report (HIGH PRIORITY)

## Executive Summary

The Visual Strategy output contains multiple **P1-severity hallucinations** in financial projections that violate explicitly locked constraints from the prompt. Month 12 MRR of $10,300 breaches the $8,000 cap; Year 2 revenue of $34,100 represents 295% YoY growth vs. the 50-80% constraint; the stated conversion rate of "8-12%" directly contradicts the locked 2-5% anchor; and the monthly revenue numbers are arithmetically impossible given the stated user counts and ARPU. GlowStack self-scores 9-10/10 in the competitive matrix despite being an unreleased app. The prompts contain strong anchoring language, but the AI disregards it -- suggesting the constraints need even more aggressive enforcement or post-generation validation.

---

## Hallucination Findings

### H1: Month 12 MRR exceeds $8,000 cap
- **Severity**: P1
- **Source**: `doc-strategic_analysis.md` > `revenueModel.monthlyProjections[5]`
- **Finding**: Month 12 revenue is $10,300 with 2,100 users. The prompt explicitly states `LOCKED MRR CAP: Monthly revenue MUST NOT exceed $8,000 at Month 12`.
- **Evidence**: `{"month":12,"users":2100,"revenue":10300}` in VS Part A output. The prompt at line 1690 says: "LOCKED MRR CAP (from Strategic Plan): Monthly revenue MUST NOT exceed $8,000 at Month 12."
- **Impact**: Overestimates revenue potential by ~29%, giving the indie developer a false sense of financial viability.
- **Fix**: Add server-side post-generation validation that clamps `monthlyProjections` revenue to $8,000 max. Also strengthen the prompt with a `VALIDATION: If month 12 revenue > $8000, you MUST reduce user count until revenue fits the cap` instruction.

### H2: Monthly revenue arithmetic is impossible
- **Severity**: P1
- **Source**: `doc-strategic_analysis.md` > `revenueModel`
- **Finding**: At 2,100 users with the stated 8-12% conversion rate and $6.20 ARPU, maximum revenue = 2100 * 0.12 * $6.20 = $1,562/month. The output claims $10,300 -- a 6.6x discrepancy. Even at 100% conversion: 2100 * $6.20 = $13,020, and $10,300/2100 = $4.90 per user, implying ~79% pay -- wildly unrealistic for any freemium app.
- **Evidence**: Revenue field $10,300; users field 2,100; stated conversion 8-12%; stated ARPU $6.20.
- **Impact**: The numbers are internally inconsistent and cannot be traced to any coherent math. This undermines the entire revenue model's credibility.
- **Fix**: Add a `SHOW YOUR MATH` instruction in the prompt requiring explicit `revenue = users * conversion_rate * arpu` with worked arithmetic for each month. Add post-generation validation that checks this equation.

### H3: Conversion rate "8-12%" violates locked 2-5% anchor
- **Severity**: P1
- **Source**: `doc-strategic_analysis.md` > `revenueModel.strategy` field
- **Finding**: The strategy description states "Projected paid conversion rate of 8-12% of active users." The prompt includes `LOCKED CONVERSION RATE: Freemium-to-paid conversion is 2-5%` (line 1669 in architect-prompts.ts). The VS Part B prompt also states `CONVERSION RATE: Freemium-to-paid must be 2-5%` (line 1756).
- **Evidence**: `revenueModel.strategy` text: "Projected paid conversion rate of 8-12%." Step 2 anchor passed as `conversionRateAnchor = '2-5%'`.
- **Impact**: A 2.4-6x inflation of conversion rate cascades into all revenue calculations. This is the root cause of H1 and H2.
- **Fix**: Add conversion rate as a dedicated schema field (not free text) with a Zod `.max(5)` constraint. Add the conversion rate to the explicit math equation requirement.

### H4: Year 2 revenue $34,100 violates YoY growth constraint
- **Severity**: P1
- **Source**: `doc-strategic_analysis.md` > `revenueProjections.yearlyProjections[1]`
- **Finding**: Year 1 revenue is $8,640. Year 2 is $34,100 -- a 295% YoY increase. The prompt explicitly states `YoY GROWTH CONSTRAINT: Apply 50-80% year-over-year revenue growth. If Year 1 is $20K, Year 2 should be $30K-$36K -- NOT $80K.` At 80% max growth from $8,640, Year 2 should be at most $15,552.
- **Evidence**: `yearlyProjections`: `[{year:1, revenue:8640}, {year:2, revenue:34100}]`. Growth: ($34,100 - $8,640) / $8,640 = 295%.
- **Impact**: Creates a wildly optimistic financial model that cannot be achieved by a solo indie developer with near-zero marketing budget.
- **Fix**: Add post-generation validation that rejects any yearlyProjection where `year_N_revenue / year_(N-1)_revenue > 1.8`. Also reword the prompt to say `ABSOLUTE RULE: Year 2 revenue MUST be between Year1 * 1.5 and Year1 * 1.8`.

### H5: Year 3 revenue $82,600 with impossible growth trajectory
- **Severity**: P1
- **Source**: `doc-strategic_analysis.md` > `revenueProjections.yearlyProjections[2]`
- **Finding**: Year 3 revenue is $82,600. From Year 2's $34,100, this is 142% growth (still exceeds 80% max). From a correctly constrained Year 2 of ~$15,552, Year 3 at 80% would be ~$27,994 -- the output is 3x higher. The prompt also sets `Year 3: $40,000-$120,000 MAX` (line 1754), so $82,600 is within the absolute cap, but the growth path from $8,640 to $82,600 in 3 years is inconsistent with 50-80% YoY constraint.
- **Evidence**: `{year:3, revenue:82600}`. Constrained path: $8,640 -> $15,552 -> $27,994.
- **Impact**: Combined with H4, creates a hockey-stick projection that is fundamentally dishonest about solo-dev economics.
- **Fix**: Same as H4 -- enforce cumulative constraint validation.

### H6: GlowStack self-scores 9-10/10 in competitive matrix
- **Severity**: P1
- **Source**: `doc-strategic_analysis.md` > `competitiveMatrix[0]`
- **Finding**: GlowStack (an unreleased app with zero users, zero reviews, zero store presence) scores itself: AI Features: 9, UX/Design: 9, Pricing: 10, Performance: 9. This is higher than all established competitors across every dimension. An unreleased product cannot objectively score higher than apps with thousands of ratings and years of market presence.
- **Evidence**: `{"name":"GlowStack","isOurs":true,"scores":[{"category":"AI Features","score":9},{"category":"UX/Design","score":9},{"category":"Pricing","score":10},{"category":"Performance","score":9}]}`.
- **Impact**: Severely undermines the credibility of the competitive analysis. A reader would immediately question the objectivity of all other analysis in the document.
- **Fix**: Add a prompt constraint: `For isOurs=true entries, scores MUST be 1-2 points BELOW established competitors on UX/Design and Performance (unproven product). Only Pricing may exceed competitors if justified by free tier generosity. AI Features score must reflect that the feature is planned, not shipped.`

### H7: Skan competitor data uses inflated rating count
- **Severity**: P2
- **Source**: `doc-strategic_analysis.md` > `competitiveDetails`
- **Finding**: VS output claims Skan has "1,934 total ratings indicating strong user satisfaction." However, the actual scraped data from opportunities.json shows `"ratings": 1` for Skan (app_id 6449196562). The number 1,934 actually comes from summing the histogram (1★=25 + 2★=17 + 3★=58 + 4★=197 + 5★=1637 = 1,934). This is a data pipeline issue: `competitorFlaws.marketData.ratings` says 1, while the histogram total says 1,934.
- **Evidence**: opportunities.json for Skan: `"ratings": 1`, `"histogram_json": {"1":25,"2":17,"3":58,"4":197,"5":1637}` (sum = 1,934). Master-idea.json `competitorFlaws[1].marketData.ratings: 1`.
- **Impact**: The VS output interpolated the histogram data correctly (1,934 is the right total) but this contradicts the `ratings` field passed via `formatRealDataContext`. This is a data inconsistency in the Scout pipeline, not a VS hallucination per se, but it means the VS received contradictory inputs.
- **Fix**: Fix the Scout pipeline to set `competitorFlaws.marketData.ratings` to the histogram sum when a histogram is available.

### H8: Market segment sizes are fabricated
- **Severity**: P2
- **Source**: `doc-strategic_analysis.md` > `marketData`
- **Finding**: Four market segments are cited: "Skincare Routine Tracker Apps" ($420M), "AI Skin Analysis Tools" ($310M), "Beauty Product Database & Scanner" ($185M), "Beauty Collection Management" ($95M). None of these figures are grounded in any data source provided to the prompt. No market research was conducted. The prompt says `Label all sizes as estimates` (line 1699) but the output does not label them as estimates.
- **Evidence**: `marketData` array with fabricated size values. No source data provides market sizing.
- **Impact**: P2 because the prompt acknowledges these will be estimates and constrains them to $10M-$500M range (which they satisfy). However, presenting specific numbers like "$420M" without sourcing creates false precision.
- **Fix**: Add `(est.)` suffix to segment names automatically in the UI. Consider adding a prompt instruction: `Explicitly state that these are rough estimates based on competitor install volumes, not verified market research.`

### H9: VS Part B conversion rate of 5% contradicts VS Part A's 8-12%
- **Severity**: P2
- **Source**: `doc-strategic_analysis.md` > `revenueProjections.unitEconomics`
- **Finding**: VS Part B states `Freemium Conversion Rate: 5%` in unit economics, while VS Part A states `8-12%` in the revenue model strategy. These are generated in parallel by separate AI calls, so they cannot coordinate. Part B's 5% is closer to the locked 2-5% anchor, but Part A's 8-12% is used for the monthly projections.
- **Evidence**: Part A: "Projected paid conversion rate of 8-12%". Part B unitEconomics: "Freemium Conversion Rate: 5%".
- **Impact**: Internal inconsistency between the two parts. Monthly projections (Part A) use the inflated rate while unit economics (Part B) use a more realistic rate, making the revenue model self-contradictory.
- **Fix**: Pass the conversion rate as a single locked value (not a range) in both prompts. E.g., `LOCKED CONVERSION RATE: Exactly 4%. Use this single number everywhere.`

### H10: LTV/CAC ratio arithmetic
- **Severity**: P3
- **Source**: `doc-strategic_analysis.md` > `revenueProjections`
- **Finding**: LTV=$38.50, CAC=$4.20, displayed ratio=9.2. Actual: $38.50/$4.20 = 9.1667. The unit economics note says "Average premium subscriber lifetime ~6.2 months; LTV = $6.20 ARPU * 6.2 months = $38.44" but displays $38.50. Minor rounding discrepancy.
- **Evidence**: 6.2 * 6.20 = $38.44, not $38.50. 38.50/4.20 = 9.167, displayed as 9.2.
- **Impact**: Negligible -- cosmetic rounding issue.
- **Fix**: No action needed. If desired, add a post-generation check that verifies `ltv / cac` matches `ltvCacRatio` within 0.1.

### H11: Year 2 users 6,200 and Year 3 users 14,500 are unrealistic
- **Severity**: P2
- **Source**: `doc-strategic_analysis.md` > `revenueProjections.yearlyProjections`
- **Finding**: Year 1 has 1,800 users. Year 2 jumps to 6,200 (244% growth) and Year 3 to 14,500 (134% growth). The prompt says "Year 1: 500-3,000 total users is realistic for a solo dev." Growing from 1,800 to 6,200 in Year 2 implies massive organic growth without marketing budget -- inconsistent with the solo indie constraint.
- **Evidence**: `[{year:1, users:1800}, {year:2, users:6200}, {year:3, users:14500}]`.
- **Impact**: Inflated user projections cascade into inflated revenue. With correct conversion (4%) and ARPU ($6.20): 6,200 * 0.04 * $6.20 * 12 = $18,461 annual, which is more aligned with the YoY constraint but the user count itself isn't justified.
- **Fix**: Add `USER GROWTH CONSTRAINT: Year-over-year user growth MUST be 50-100% max for an organic-only indie app`.

---

## Prompt Weighting Findings

### W1: formatRealDataContext provides insufficient data to constrain revenue projections
- **Severity**: P1
- **Source**: `architect-prompts.ts:1346-1464`
- **Finding**: `formatRealDataContext()` passes competitor store metrics (ratings, installs, pricing signals) and Scout composite scores. However, all competitor apps show "N/A" for installs (App Store limitation). The ANCHORING INSTRUCTIONS say "Use install counts as TAM signal" but no install data exists. This leaves the AI without a concrete numeric anchor for market sizing.
- **Evidence**: All 11 opportunities have `"installs": "N/A"`. Anchoring instruction #3 references install counts.
- **Impact**: Without install count data, the AI fabricates market sizing and user projections from nothing. The anchoring system fails silently.
- **Fix**: When installs = "N/A", substitute with histogram-sum-based proxy: `"Estimated downloads: histogram total suggests ~X,XXX engaged users based on review-to-download ratio of ~1:100"`. Update anchoring instruction #3 to handle the N/A case.

### W2: Conversion rate lock is present but too weak
- **Severity**: P1
- **Source**: `architect-prompts.ts:1669`
- **Finding**: The prompt says `LOCKED CONVERSION RATE: Freemium-to-paid conversion is 2-5%`. However, the AI outputs "8-12%". The lock is phrased as informational rather than imperative. Compare to LOCKED PRICING which uses `do NOT change` -- the conversion rate lock lacks this imperative phrasing.
- **Evidence**: Line 1669: `\nLOCKED CONVERSION RATE: Freemium-to-paid conversion is ${conversionRateAnchor}. monthly revenue = total_users * conversion_rate * price_per_user. Show this math explicitly.\n`. Output: "8-12%".
- **Impact**: Root cause of the cascading revenue hallucinations (H1, H2, H3, H4, H5).
- **Fix**: Change to: `LOCKED CONVERSION RATE (ABSOLUTE RULE — do NOT change): Freemium-to-paid conversion rate is EXACTLY ${conversionRateAnchor}. Any output that mentions a conversion rate outside this range is WRONG. Show math: revenue = total_users * [rate within 2-5%] * price_per_user.`

### W3: MRR cap enforcement is present but not validated post-generation
- **Severity**: P1
- **Source**: `architect-prompts.ts:1690, 1751`
- **Finding**: The prompt contains `LOCKED MRR CAP` in both Part A and Part B. Despite this, the AI outputs $10,300 for Month 12. The prompt correctly states the constraint but there is no server-side validation to catch violations.
- **Evidence**: Prompt says "Monthly revenue MUST NOT exceed $8,000 at Month 12." Output: month 12 revenue = $10,300.
- **Impact**: A prompt-only enforcement without validation cannot prevent hallucinations. The AI model treats these as strong suggestions but occasionally ignores them.
- **Fix**: Add post-generation validation in `architect.ts`: iterate `monthlyProjections`, clamp any revenue > 8000 to 8000 and adjust users proportionally. Log a warning when clamping occurs.

### W4: gapScore <= 60 filter works correctly
- **Severity**: PASS
- **Source**: `architect-prompts.ts:1402-1415`
- **Finding**: The filter `gapComparison.gapScore <= 60` correctly excludes competitors. Checking the master idea data: Beauty Care (gapScore=60) is on the boundary. The filter uses `<=` so gapScore=60 IS excluded. Beauty Tips (gapScore=58) would also be excluded. This correctly filters 2 of 11 competitors.
- **Evidence**: Code at line 1409: `if (gapComparison && gapComparison.gapScore <= 60)`. Beauty Care gapScore=60 (filtered), Beauty Tips gapScore=58 (filtered).
- **Impact**: Filter is working as designed.
- **Fix**: None needed. Consider whether gapScore=60 should be included (change to `< 60`) since 60 is a moderate relevance score, but current behavior is defensible.

### W5: LOCKED PRICING anchor is present and correctly passed
- **Severity**: PASS
- **Source**: `architect.ts:476-479`, `architect-prompts.ts:1668`
- **Finding**: `pricingAnchor` is correctly extracted from Step 2's revenue model tiers and passed to both VS Part A and Part B prompts. The Step 2 data contains `Free - GlowStack Core: $0 forever`, `GlowStack Premium Monthly: $7.99/month`, `GlowStack Premium Annual: $49.99/year`.
- **Evidence**: VS output correctly uses $7.99/month and $49.99/year throughout, matching Step 2 exactly.
- **Impact**: Pricing is consistent across documents.
- **Fix**: None needed.

### W6: LOCKED TIMELINE anchor is present and correctly passed
- **Severity**: PASS
- **Source**: `architect.ts:611-612`, `architect-prompts.ts:1719`
- **Finding**: `timelineAnchor` is extracted from Step 4 `mvpScope.timeline` ("16 weeks total...") and `mvpFeatureCount` = 6. These are passed to VS Part B. The output correctly shows 4 phases summing to 16 weeks (5+3+4+4) with 6 core features.
- **Evidence**: Timeline phases sum: 5+3+4+4 = 16 weeks. Feature count in MVP = 6.
- **Impact**: Timeline is correctly constrained.
- **Fix**: None needed.

### W7: VS Part A and Part B are generated in parallel without cross-reference
- **Severity**: P2
- **Source**: `architect.ts:918-930`
- **Finding**: VS Parts A and B are called in parallel via `Promise.allSettled`. This means Part B cannot reference Part A's specific numbers (conversion rate, monthly projections, tier pricing). While LOCKED anchors provide some coordination, the conversion rate inconsistency (H9) is a direct consequence of parallel generation without shared state.
- **Evidence**: Both calls fire simultaneously in Batch 1. Part A outputs 8-12% conversion, Part B outputs 5%.
- **Impact**: Creates internal contradictions. The same revenue model is interpreted differently by two parallel calls.
- **Fix**: Either (a) generate Part A first and extract key numbers to feed into Part B, or (b) provide a single explicit numeric table in both prompts: `Conversion rate: 4%, ARPU: $6.20, Month 12 users: 2000, Month 12 revenue: $496`. Option (b) preserves parallelism.

---

## Output Efficiency Findings

### E1: competitiveMatrix + competitiveDetails redundancy
- **Severity**: P2
- **Source**: `doc-strategic_analysis.md` > `competitiveMatrix` + `competitiveDetails`
- **Finding**: Both sections cover the same 4 entries (GlowStack, Skan, BasicBeauty, Stilla). `competitiveMatrix` provides numeric scores, while `competitiveDetails` provides qualitative strengths/weaknesses/positioning. Together they occupy ~3,200 characters. The redundancy is moderate -- matrix provides chart data while details provide narrative. However, `competitiveDetails.pricing` and `competitiveDetails.userBase` repeat information already in `competitiveMatrix.scores`.
- **Impact**: ~30% redundancy between the two sections. Some fields in `competitiveDetails` (pricing, userBase) could be derived from matrix scores and real data.
- **Fix**: Remove `pricing` and `userBase` from `competitiveDetails` schema -- they add ~400 chars of redundant data. Keep both sections as they serve different visualization purposes (radar chart vs. detail cards).

### E2: marketGapAnalysis redundancy with competitive sections
- **Severity**: P3
- **Source**: `doc-strategic_analysis.md` > `marketGapAnalysis`
- **Finding**: `marketGapAnalysis` contains 6 entries totaling ~3,600 characters. Some gaps overlap with `competitiveDetails.weaknesses` (e.g., "crash-free persistent data storage" gap mirrors BasicBeauty/GlowinMe weakness). However, the gap analysis adds structure (category, difficulty, approach) that competitive sections lack.
- **Impact**: ~20% conceptual overlap but with distinct structure. Not directly consolidatable without losing the categorization.
- **Fix**: No change needed. The structured format (category, difficulty, approach) provides unique value for UI visualization.

### E3: Go/No-Go reasoning conciseness
- **Severity**: P3
- **Source**: `doc-strategic_analysis.md` > `goNoGoScorecard`
- **Finding**: The scorecard contains 7 dimensions with detailed reasoning, plus investmentThesis (2 sentences), 4 keyRisks, 4 keyOpportunities, and a recommendation paragraph. Total: ~3,200 characters. The reasoning per dimension averages ~120 words. Some reasoning is verbose (e.g., Technical Feasibility dimension mentions Scout feasibility score twice).
- **Evidence**: "Scout feasibility score of 62/100" mentioned in both Technical Feasibility and Execution Risk dimensions.
- **Impact**: Minor verbosity. Each reasoning paragraph could be 60-80 words without losing substance.
- **Fix**: Add a prompt constraint: `Reasoning per dimension: maximum 60 words. Focus on the 1-2 decisive factors, not exhaustive lists.`

### E4: Overall signal-to-noise assessment
- **Severity**: P2
- **Source**: `doc-strategic_analysis.md` (full document)
- **Finding**: The complete VS output is approximately 33K characters of JSON. Estimated breakdown:
  - **High-signal** (directly actionable for development): personas (3.5K), revenueModel tiers (2K), risks (3K), timeline (2.5K), dataModel (4K), goNoGoScorecard (3K) = ~18K (55%)
  - **Medium-signal** (useful for strategy but not development): competitiveMatrix (0.8K), competitiveDetails (2.5K), marketGapAnalysis (3.6K), monthlyProjections (0.4K) = ~7.3K (22%)
  - **Low-signal/hallucinated** (fabricated or unreliable): marketData (0.5K), revenueProjections yearly (0.4K), revenue strategy text (1K), various redundant fields = ~1.9K (6%)
  - **Structural overhead** (JSON syntax, field names): ~5.8K (17%)
- **Impact**: ~55% high-signal content is reasonable for a strategic analysis document. The main waste is not volume but accuracy -- the 6% low-signal content contaminates the 22% medium-signal content.
- **Fix**: Focus fixes on accuracy (hallucinations H1-H6) rather than size reduction. The document size is appropriate for its purpose.

---

## Scorecard Table

| Check ID | Description | Result | Severity |
|----------|-------------|--------|----------|
| H1 | Month 12 MRR $10,300 exceeds $8K cap | FAIL | P1 |
| H2 | Monthly revenue arithmetic impossible | FAIL | P1 |
| H3 | Conversion rate 8-12% vs locked 2-5% | FAIL | P1 |
| H4 | Year 2 revenue 295% YoY growth vs 50-80% cap | FAIL | P1 |
| H5 | Year 3 revenue inconsistent growth trajectory | FAIL | P1 |
| H6 | GlowStack self-scores 9-10/10 as unreleased app | FAIL | P1 |
| H7 | Skan rating count data inconsistency | WARN | P2 |
| H8 | Market segment sizes fabricated without sourcing | WARN | P2 |
| H9 | Part A vs Part B conversion rate contradiction | WARN | P2 |
| H10 | LTV/CAC rounding discrepancy | PASS | P3 |
| H11 | Year 2-3 user counts unrealistic growth | WARN | P2 |
| W1 | formatRealDataContext lacks install data | FAIL | P1 |
| W2 | Conversion rate lock phrasing too weak | FAIL | P1 |
| W3 | MRR cap has no post-generation validation | FAIL | P1 |
| W4 | gapScore <= 60 filter correctness | PASS | -- |
| W5 | LOCKED PRICING anchor present and correct | PASS | -- |
| W6 | LOCKED TIMELINE anchor present and correct | PASS | -- |
| W7 | Part A/B parallel generation causes inconsistencies | WARN | P2 |
| E1 | competitiveMatrix + competitiveDetails redundancy | WARN | P2 |
| E2 | marketGapAnalysis overlap with competitive sections | PASS | P3 |
| E3 | Go/No-Go reasoning verbosity | PASS | P3 |
| E4 | Overall signal-to-noise ratio ~55% high-signal | WARN | P2 |

---

## Summary Statistics

- **Total checks**: 21
- **FAIL**: 9 (43%)
- **WARN**: 7 (33%)
- **PASS**: 5 (24%)
- **P1 issues**: 8 (H1, H2, H3, H4, H5, H6, W1, W2, W3 -- note W2 and W3 are root causes of H1-H5)
- **P2 issues**: 6 (H7, H8, H9, H11, W7, E1)
- **P3 issues**: 3 (H10, E2, E3)

### Root Cause Analysis

The 5 financial hallucinations (H1-H5) all stem from **two root causes**:
1. **W2**: Conversion rate lock is too weakly phrased -- the AI ignores it and invents "8-12%"
2. **W3**: No post-generation validation to catch constraint violations

If the conversion rate were correctly locked at 4% and validated, the cascading math would produce:
- Month 12: 2,100 users * 4% * $6.20 = $521/month (well under $8K cap)
- Year 1: ~$3,130 (realistic for indie app)
- Year 2 at 80% YoY: ~$5,634
- Year 3 at 80% YoY: ~$10,141

These corrected numbers align perfectly with the solo indie constraints.

### Priority Fix Recommendations (Ordered)

1. **Add post-generation validation** in `architect.ts` for all `monthlyProjections` and `yearlyProjections` -- clamp values that exceed caps and log warnings
2. **Strengthen conversion rate lock** to imperative phrasing with `ABSOLUTE RULE` prefix
3. **Add competitive matrix self-score constraint** preventing unreleased apps from scoring above competitors
4. **Provide explicit numeric table** to both VS Part A and B with pre-calculated revenue projections based on locked parameters
5. **Fix Skan ratings field** in Scout pipeline to use histogram sum when ratings field returns 1
