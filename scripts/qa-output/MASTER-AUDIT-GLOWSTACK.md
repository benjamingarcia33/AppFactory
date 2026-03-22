# GlowStack Full System Audit — Master Findings

**Date**: 2026-03-13
**Test Case**: GlowStack — AI-powered beauty/skincare companion app
**Agents**: 10 parallel audit agents
**Total Checks**: 178
**Overall Pass Rate**: 53% (94 PASS/WARN), 47% (84 FAIL)

---

## Executive Summary

The GlowStack audit revealed **34 P1 (Critical)** issues, **43 P2 (Major)** issues, and **26 P3 (Minor)** issues across all 10 audit sections. Three systemic root causes account for the majority of failures:

1. **Cross-document schema binding failure**: EPs are generated independently in parallel without sharing table names, column names, or state management decisions. This produces fundamentally incompatible code instructions (EP1 uses Zustand + `user_products`; EP2 uses Context+useReducer + `collections`).

2. **Prompt constraint enforcement gap**: Financial projections in Visual Strategy ignore locked conversion rates (8-12% vs locked 2-5%), MRR caps ($10,300 vs $8,000 limit), and YoY growth constraints (295% vs 50-80% limit) despite explicit prompt instructions. Prompt-only enforcement is insufficient — server-side validation is needed.

3. **Knowledge base coverage gap**: The Step 5 technology knowledge base covers 47 entries but omits foundational React Native ecosystem libraries (Zustand, TanStack Query, NativeWind, Drizzle ORM, Reanimated). The TechArch AI fills gaps by hallucinating reasonable choices that bypass formal selection.

---

## P1 Issues by Priority (34 total)

### Tier 1: Pipeline Architecture Fixes (affect all future runs)

| # | Source | Finding | Root Cause | Fix |
|---|--------|---------|------------|-----|
| 1 | EP2-W1 | State mgmt: Zustand (EP1) vs Context+useReducer (EP2) | EPs generated independently | Inject EP1 schema + state mgmt decisions into EP2/EP3 builders |
| 2 | EP2-W2 | Table name: `user_products` (EP1) vs `collections` (EP2) | No shared schema | Pass canonical table map from EP1→EP2→EP3 |
| 3 | EP2-W3 | Table name: `routine_completions` (EP1) vs `routine_checkins` (EP2) | No shared schema | Same as #2 |
| 4 | EP2-W5 | skin_analyses: Supabase (EP1) vs SQLite-only (EP2) | No shared arch decisions | Remove from EP1 Supabase schema; defer to EP2 SQLite |
| 5 | EP1-H5 | 5 table names differ between EP1 and TechArch | TechArch + EP1 generated in parallel | Generate TechArch first → feed table names to EPs |
| 6 | EP1-H4 | skin_analyses in Supabase violates privacy architecture | TechArch says SQLite-only | Remove from EP1 Supabase, use SQLite per TechArch |
| 7 | VS-W2 | Conversion rate lock "2-5%" ignored → AI outputs "8-12%" | Lock phrasing too weak | Use ABSOLUTE RULE prefix + post-generation validation |
| 8 | VS-W3 | MRR cap $8K ignored → AI outputs $10,300 | No post-gen validation | Add server-side clamping in architect.ts |
| 9 | VS-H1 | Month 12 MRR $10,300 exceeds $8K cap | Cascades from #7 | Fix #7 + add revenue validation |
| 10 | VS-H2 | Revenue arithmetic impossible (2100 users × 12% × $6.20 ≠ $10,300) | Cascades from #7 | Add SHOW YOUR MATH instruction |
| 11 | VS-H3 | Conversion rate "8-12%" vs locked "2-5%" | Same as #7 | Same fix |
| 12 | VS-H4 | Year 2 revenue 295% YoY growth vs 50-80% cap | No YoY validation | Add post-gen YoY validation |
| 13 | VS-H5 | Year 3 revenue inconsistent growth trajectory | Cascades from #12 | Same fix |
| 14 | VS-H6 | GlowStack self-scores 9-10/10 as unreleased app | No self-score constraint | Add isOurs constraint (max score rules) |
| 15 | VS-W1 | formatRealDataContext has no install data (all "N/A") | App Store limitation | Add histogram-sum proxy for installs |

### Tier 2: Technology & Version Fixes

| # | Source | Finding | Root Cause | Fix |
|---|--------|---------|------------|-----|
| 16 | EP2-H1 | `expo-barcode-scanner` deprecated/removed in SDK 52 | Stale training data | Add to CURRENT_TECH_VERSIONS as deprecated |
| 17 | EP2-H2 | `@tensorflow/tfjs-react-native` conflated with TFLite | Wrong package name | Specify `react-native-fast-tflite` in knowledge base |
| 18 | EP2-I1 | Edge Function API contracts insufficient for code gen | Prose-only specs | Add structured request/response schemas |
| 19 | EP2-I2 | TFLite model spec missing tensor shapes | No model architecture spec | Add input [1,224,224,3] / output [1,5] spec |
| 20 | Tech-H1 | GPT-4o referenced 15+ times in TechArch | Missing CURRENT_TECH_VERSIONS injection | Add to buildTechnicalArchitecturePrompt |
| 21 | Tech-W2 | CURRENT_TECH_VERSIONS not injected into TechArch | One-line omission | Add ${CURRENT_TECH_VERSIONS} to TechArch prompt |
| 22 | Steps-H1 | Deprecated slug `gpt4o-vision` in Step 3 | techCatalog optional for Step 3 | Make techCatalog required |
| 23 | Steps-H2 | Deprecated slug `openai-gpt4o` in Step 3 | Same as #22 | Same fix |

### Tier 3: Content Hallucinations

| # | Source | Finding | Root Cause | Fix |
|---|--------|---------|------------|-----|
| 24 | Arch-H1 | "Skan has an active lawsuit" stated as fact | Single user review escalated | Add "user-reported" hedging instruction |
| 25 | Scout-H1 | "$180B global skincare market" violates no-global-sizes rule | AI used prompt's negative example | Add post-processing regex check |
| 26 | EP3-H1 | "Join 10,000+ skincare lovers" fabricated social proof | PAYWALL GUIDELINES ignored | Add negative example + post-gen validation |
| 27 | EP3-W2 | PAYWALL GUIDELINES failed to prevent social proof | Placement too far from paywall section | Move guidelines closer + add NEGATIVE EXAMPLE |

### Tier 4: Scout Pipeline Bugs

| # | Source | Finding | Root Cause | Fix |
|---|--------|---------|------------|-----|
| 28 | Scout-E1 | Gap analysis IDENTICAL across all 11 opportunities | Single global analysis copied 11× | Store at scan level, not per-opportunity |
| 29 | Scout-W2 | Feasibility clustering: 7/11 apps scored exactly 72 | Anti-clustering check ineffective | Batch scoring or post-scoring normalization |
| 30 | Scout-BUG1 | gap-analysis.json contains stale Cognitize data | Scan record gap_analysis_json is null | Investigate DB write failure |

### Tier 5: PRD Efficiency

| # | Source | Finding | Root Cause | Fix |
|---|--------|---------|------------|-----|
| 31 | PRD-W3 | Screen-by-screen detail duplicates EPs (~35K chars) | PRD prompt requests state-level detail | Remove screen state instructions from PRD Part A |
| 32 | PRD-E1 | 119K chars → reducible to ~65K | Section 3 screen specs | Same fix as #31 |
| 33 | PRD-E7 | Total document 3-4× optimal for AI agent consumption | Multiple redundancies | Apply E1-E4 fixes |

### Tier 6: Config Generation

| # | Source | Finding | Root Cause | Fix |
|---|--------|---------|------------|-----|
| 34 | EP3-C7 | "revenucat" vs "revenuecat" slug key mismatch | Typo in SETUP_STEPS_REGISTRY | Change registry keys to match seed slug |

---

## P2 Issues Summary (43 total)

| Area | Count | Key Issues |
|------|-------|------------|
| TechArch | 11 | 6 technologies not in Step 5 (TanStack Query, Zustand, NativeWind, Drizzle ORM, Reanimated, Vercel AI SDK), fabricated table + Edge Function, 5 table name mismatches |
| EP2 | 7 | Wrong API domain (openfoodfacts vs openbeautyfacts), ungrounded "500 ingredient pairs", column name conflicts, file truncated, Edge Function triple-description |
| VS | 6 | Skan rating data inconsistency, fabricated market segment sizes, Part A/B conversion rate contradiction, unrealistic user growth, competitive redundancy |
| Steps 3-5 | 5 | Deprecated GPT-4o in text, CURRENT_TECH_VERSIONS gap, Step 3-4-5 redundancy, twelveWeekPlan truncated |
| Arch Foundations | 4 | Moat claims exceed indie scale, negativity bias in review selection, S6 partial compliance, free tier gaps |
| PRD | 4 | "All six share same 4 gaps" hallucination, revenue subscriber ungrounded, Sections 5+9 duplication, data entities cross into TechArch |
| EP3/CLAUDE.md | 6 | 8 missing TECH_CONVENTIONS, 5 missing SETUP_STEPS entries, free tier limit mismatch, supabase-edge-functions missing from seed |
| Scout | 4 | r/SkincareAddiction unverified, Skan "verified scandal", confidence overcalibration, gap analysis DB duplication |
| EP1 | 5 | notification_preferences architecture mismatch, ingredients type mismatch, missing TanStack Query, bare workflow confusion, missing expo-sqlite |

---

## Fix Implementation Plan (Ordered by Impact)

### Phase 1: Pipeline Architecture (eliminates 15 P1s)

**File: `src/lib/agents/architect.ts`**
1. Extract canonical schema from TechArch output after Batch 1
2. Pass schema map (table names, column types, storage tier) into EP builders as `CANONICAL_SCHEMA` block
3. Pass EP1 state management decisions into EP2/EP3 as `EP1_ARCHITECTURE` block
4. Add post-generation validation for VS: clamp MRR ≤ $8K, validate conversion 2-5%, validate YoY ≤ 80%
5. Remove `skin_analyses` from EP1 Supabase schema (defer to EP2 SQLite)

**File: `src/lib/ai/architect-prompts.ts`**
6. Add `CANONICAL_SCHEMA` parameter to EP2 + EP3 builders
7. Strengthen VS conversion rate lock: `ABSOLUTE RULE` prefix
8. Add `SHOW YOUR MATH` instruction to VS Part A
9. Add competitive matrix self-score constraint for `isOurs=true`
10. Add `CURRENT_TECH_VERSIONS` to `buildTechnicalArchitecturePrompt()`
11. Make `techCatalog` required (not optional) for Step 3
12. Remove screen-by-screen state detail from PRD Part A prompt
13. Move PAYWALL GUIDELINES closer to paywall screen section in EP3
14. Add user growth constraint: YoY ≤ 100%
15. Add histogram-sum proxy for install counts in `formatRealDataContext()`

### Phase 2: Technology Knowledge Base (eliminates 5 P1s + 11 P2s)

**File: `src/lib/ai/architect-prompts.ts`**
16. Add `expo-barcode-scanner` to CURRENT_TECH_VERSIONS as DEPRECATED
17. Add `react-native-fast-tflite` to tensorflow-lite knowledge base entry
18. Fix "revenucat"→"revenuecat" key mismatch in SETUP_STEPS_REGISTRY + TECH_CONVENTIONS
19. Add 8 missing TECH_CONVENTIONS entries
20. Add 5 missing SETUP_STEPS_REGISTRY entries (supabase-edge-functions, posthog, eas-build, expo-updates, tensorflow-lite)

### Phase 3: Content Quality (eliminates 4 P1s)

**File: `src/lib/ai/architect-prompts.ts`**
21. Add "user-reported" hedging instruction for competitor legal claims
22. Add negative example to PAYWALL GUIDELINES
23. Add fabricated social proof post-processing regex

**File: `src/lib/ai/scout-prompts.ts`**
24. Add global market size post-processing check

### Phase 4: Scout Pipeline (eliminates 3 P1s)

**File: `src/lib/agents/scout.ts`**
25. Store gap analysis at scan level (not per-opportunity duplication)
26. Investigate gap_analysis_json null on scan record

**File: `src/lib/ai/scout-prompts.ts`**
27. Add batch feasibility scoring or post-scoring normalization

---

## Scorecard by Section

| Section | Checks | Pass | Warn | Fail | P1 | P2 | P3 |
|---------|--------|------|------|------|----|----|-----|
| Scout Search/Scoring | 11 | 3 | 3 | 5 | 3 | 2 | 3 |
| Scout Analysis | 16 | 9 | 5 | 2 | 2 | 4 | 3 |
| Arch Foundations | 12 | 6 | 4 | 2 | 1 | 4 | 7 |
| Arch Tech Plan | 18 | 9 | 5 | 4 | 2 | 5 | 3 |
| PRD | 17 | 9 | 2 | 6 | 3 | 4 | 2 |
| Visual Strategy | 21 | 5 | 7 | 9 | 8 | 6 | 3 |
| TechArch | 21 | 6 | 5 | 10 | 2 | 11 | 3 |
| EP1 | 26 | 18 | 6 | 2 | 2 | 5 | 2 |
| EP2 | 27 | 8 | 4 | 15 | 8 | 7 | 0 |
| EP3+CLAUDE.md | 36 | 18 | 0 | 3+6 | 3 | 6 | 9 |
| **TOTAL** | **205** | **91** | **41** | **58+6** | **34** | **54** | **35** |

### Worst Sections (by P1 count)
1. **Visual Strategy**: 8 P1s — financial projections completely uncontrolled
2. **EP2**: 8 P1s — fundamentally incompatible with EP1
3. **Scout Search**: 3 P1s — gap analysis duplication, feasibility clustering
4. **PRD**: 3 P1s — screen detail duplication with EPs
5. **EP3/CLAUDE.md**: 3 P1s — social proof, paywall guidelines, slug mismatch
