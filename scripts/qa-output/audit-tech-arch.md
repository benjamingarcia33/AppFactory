# Technical Architecture Audit Report

## Executive Summary

The Technical Architecture document is well-structured, detailed, and demonstrates strong architectural reasoning for the GlowStack MVP. However, it contains several hallucinated technologies and features not present in Step 5 selections (TanStack Query, Zustand, NativeWind, Reanimated 3, Drizzle ORM, Vercel AI SDK), uses the deprecated GPT-4o model name instead of GPT-5.x per CURRENT_TECH_VERSIONS, invents database tables and Edge Functions not in the tech selection, and includes 4 ASCII/flow diagrams despite the "no code" instruction. Output efficiency is reasonable at 67K chars given the 9-section scope, though synergy content substantially duplicates Step 5 notes.

---

## Hallucination Findings

### H1: GPT-4o referenced — deprecated per CURRENT_TECH_VERSIONS
- **Severity:** P1
- **Source:** TechArch lines 96, 100, 172, 201, 223, 335-351, 365-366, 403, 436, 613
- **Finding:** The document references "GPT-4o" and "GPT-4o Vision" approximately 15+ times for product photo recognition and personalized routine recommendations. CURRENT_TECH_VERSIONS explicitly states: "Do NOT reference older versions... GPT-4o — deprecated" and specifies GPT-5.2 / GPT-5.4 instead.
- **Evidence:** CURRENT_TECH_VERSIONS line 324: `OpenAI GPT-5.2 / GPT-5.4 (NOT GPT-4o — deprecated)`. TechArch line 96: `GPT-4o Vision (OpenAI API)`. TechArch line 100: `GPT-4o (OpenAI API)`.
- **Root Cause:** Step 3 upstream data also uses "openai-gpt4o" as the model identifier (step-3.json line 25). The TechArch faithfully propagated the deprecated name from its input data.
- **Impact:** Claude Code reading this document will reference a deprecated model. Inconsistent with CURRENT_TECH_VERSIONS injected into other documents (EPs, Steps 3-4).
- **Fix:** Two-pronged: (1) Ensure Step 3 AI Approach uses the `openai-gpt5` slug and GPT-5.x naming. (2) Add CURRENT_TECH_VERSIONS injection to the `buildTechnicalArchitecturePrompt()` function, as it currently receives only Steps 3-5 summaries without the version constraint block.

### H2: TanStack Query v5 — not a selected technology in Step 5
- **Severity:** P2
- **Source:** TechArch lines 40, 157, 429, 447
- **Finding:** TanStack Query v5 (React Query) is described in detail as the server-state management solution with specific stale time configurations. It is NOT in Step 5's `selectedTechnologies` array. There is no `tanstack-query` slug in the technology selection.
- **Evidence:** Step 5 `selectedTechnologies` contains 13 slugs: supabase-auth, supabase-postgresql, supabase-edge-functions, claude-api, tensorflow-lite, expo-image-picker, supabase-storage, revenucat, expo-notifications, posthog, sentry, eas-build, expo-updates. No TanStack Query entry exists.
- **Impact:** The document introduces an architectural dependency on a library that was never evaluated or selected in the pipeline. Claude Code may install it based on TechArch guidance, diverging from the selected stack.
- **Fix:** Either add TanStack Query to the knowledge base and Step 5 selection pipeline, or remove it from TechArch generation. If it is an implicit/expected dependency, the prompt should clarify which libraries are allowed beyond the Step 5 selections.

### H3: Zustand — not a selected technology in Step 5
- **Severity:** P2
- **Source:** TechArch lines 40, 157
- **Finding:** Zustand is described as the client-side state management solution with four specific store slices (authStore, collectionStore, routineStore, uiStore). Not in Step 5 selections.
- **Evidence:** No `zustand` slug in Step 5. The document specifies four named store slices — a level of specificity that implies firm architectural commitment to a library never formally selected.
- **Impact:** Same as H2 — introduces unvetted dependency.
- **Fix:** Same approach as H2.

### H4: NativeWind v4 — not a selected technology in Step 5
- **Severity:** P2
- **Source:** TechArch line 38
- **Finding:** NativeWind v4 (Tailwind CSS for React Native) is described as the styling solution. Not in Step 5 selections.
- **Evidence:** No `nativewind` slug in Step 5.
- **Impact:** Introduces a styling framework dependency not evaluated in the tech selection pipeline.
- **Fix:** Same approach as H2.

### H5: Reanimated 3 — not a selected technology in Step 5
- **Severity:** P3
- **Source:** TechArch line 42
- **Finding:** Reanimated 3 is described for gesture-driven animations. Not in Step 5 selections.
- **Evidence:** No `reanimated` slug in Step 5.
- **Impact:** Lower severity since it is a commonly expected React Native dependency, but still not formally selected.
- **Fix:** Same approach as H2.

### H6: Drizzle ORM — not a selected technology in Step 5
- **Severity:** P2
- **Source:** TechArch lines 70, 299, 483
- **Finding:** Drizzle ORM is described as the database ORM for both SQLite and PostgreSQL with migration management via drizzle-kit. Not in Step 5 selections. CURRENT_TECH_VERSIONS mentions "Drizzle ORM" but only as a version reference — it is not in the Step 5 selected slugs.
- **Evidence:** No `drizzle` slug in Step 5. CURRENT_TECH_VERSIONS line 325: `Supabase JS v2, Drizzle ORM` lists it as a known technology but Step 5 did not select it.
- **Impact:** Core architectural dependency for data access that was never formally selected.
- **Fix:** Add Drizzle ORM to the knowledge base technologies table and ensure Step 5 can select it.

### H7: Vercel AI SDK — not a selected technology in Step 5
- **Severity:** P2
- **Source:** TechArch line 349
- **Finding:** "The Vercel AI SDK is used as the streaming response wrapper in this Edge Function" for GPT-4o routine recommendations. Not in Step 5 selections.
- **Evidence:** No `vercel-ai-sdk` slug in Step 5. However, Step 3 line 26 mentions it: "The Vercel AI SDK (vercel-ai-sdk) is used as the streaming wrapper."
- **Root Cause:** Step 3 upstream data introduced this dependency; TechArch propagated it.
- **Impact:** Introduces an SDK dependency for an Edge Function feature that was never formally selected.
- **Fix:** Either add vercel-ai-sdk to knowledge base or remove from Step 3 prompt constraints.

### H8: `ingredient_education_cache` table — fabricated
- **Severity:** P2
- **Source:** TechArch line 357
- **Finding:** The document describes a Postgres table `ingredient_education_cache` for caching ingredient education explanations. This table does not appear in Step 5 customizations, EP1's database schema, or any other pipeline output.
- **Evidence:** Zero matches for `ingredient_education_cache` in step-5.json and doc-execution_prompt_1.md.
- **Impact:** EP1 will not create this table; the TechArch describes infrastructure that won't exist at build time.
- **Fix:** Either add this table to EP1's database setup or remove from TechArch. The feature (ingredient education caching) is a reasonable optimization but needs to be coordinated across documents.

### H9: `/routine-recommendations` Edge Function — fabricated
- **Severity:** P2
- **Source:** TechArch line 347
- **Finding:** A fourth Edge Function `/routine-recommendations` is described for the premium personalized routine recommendation feature. Step 5 only defines 3 Edge Functions: `/ingredient-check`, `/product-lookup`, `/submit-product` (see step-5.json lines 32-36).
- **Evidence:** Step 5 `supabase-edge-functions` customizations list exactly 4 functions (including rate limiting), none of which is `/routine-recommendations`.
- **Impact:** TechArch describes an API endpoint that no EP is tasked with building.
- **Fix:** Either add this endpoint to Step 5's Edge Function customizations or remove from TechArch. Since GPT-4o routine recommendations are described in Step 3, the pipeline should ensure Step 5 accounts for all AI use cases.

### H10: Database table name mismatches with EP1
- **Severity:** P2
- **Source:** TechArch Section 3 vs EP1 database tables
- **Finding:** Several table names in TechArch differ from EP1:
  - TechArch: `products_cache` (SQLite) / EP1: `products` (Supabase)
  - TechArch: `user_collection` (SQLite) / EP1: `user_products`
  - TechArch: `routine_checkins` / EP1: `routine_completions`
  - TechArch: `user_profiles` / EP1: `profiles`
  - TechArch: `ingredient_conflicts_lookup` / EP1: `ingredient_conflicts`
  - TechArch describes two-tier architecture (SQLite + Postgres) while EP1 creates only Supabase tables
- **Evidence:** EP1 table declarations: `profiles`, `products`, `user_products`, `routines`, `routine_products`, `routine_completions`, `skin_analyses`, `notification_preferences`, `ingredient_conflicts`, `user_subscriptions`. TechArch uses different names for 5 of these.
- **Impact:** Claude Code will see conflicting table names between the architecture reference document and the implementation instructions.
- **Fix:** Ensure TechArch and EPs use a shared table naming convention. The prompt could inject the EP1 table names as a constraint, or the TechArch could be instructed to defer to EPs for exact naming.

### H11: `react-native-fast-tflite` library name — unverified
- **Severity:** P3
- **Source:** TechArch lines 32, 311, 565, 571
- **Finding:** The document references `react-native-fast-tflite` as the TFLite integration library with "New Architecture JSI support." While this library does exist as an open-source project, it is not referenced in Step 5 or the knowledge base. The TechArch introduced this specific library recommendation.
- **Evidence:** No mention in step-5.json. Step 5's tensorflow-lite entry describes "Custom MobileNetV4/EfficientNet-Lite model" but does not specify the React Native bridge library.
- **Impact:** Low — the library does exist and is a reasonable choice, but it was not evaluated in the pipeline.
- **Fix:** Consider adding the specific bridge library to the tensorflow-lite knowledge base entry's promptFragment.

---

## Prompt Weighting Findings

### W1: Missing Steps 1-2 context (AI Expectations + Strategic Planning)
- **Severity:** P2
- **Source:** `architect.ts` lines 869-873, `buildTechnicalArchitecturePrompt()` line 1615
- **Finding:** The TechArch prompt receives only Steps 3-5 (`techArchSummary` = AI Approach + Dev Plan + Tech Selection). Steps 1 (AI Expectations — market positioning, user persona) and Step 2 (Strategic Planning — pricing, competitive strategy, revenue projections) are excluded. The prompt label says "TECHNICAL ANALYSES (Steps 3-5)."
- **Evidence:** `architect.ts` lines 869-873: `techArchSummary` concatenates only aiApproach, devPlan, and techSelectionData. Step 1/2 data (pricing anchors, user persona, competitive positioning) is not passed.
- **Impact:** The TechArch document independently rediscovered and restated pricing ($7.99/month, $49.99/year) and positioning information that exists in Steps 1-2, but without the formal pricing anchor lock that other documents receive. The pricing happens to be consistent in this case, but there is no structural guarantee.
- **Fix:** Consider passing `pricingAnchor` and a compact Step 1-2 summary to the TechArch prompt, similar to how VS and PRD receive pricing locks. Alternatively, the TechArch prompt could be instructed to describe only technical architecture without restating business context.

### W2: Missing CURRENT_TECH_VERSIONS injection
- **Severity:** P1
- **Source:** `buildTechnicalArchitecturePrompt()` function at architect-prompts.ts lines 1603-1650
- **Finding:** The `CURRENT_TECH_VERSIONS` constant is NOT injected into the TechArch prompt. It is injected into Steps 3-4 and all 3 EPs per the A3 fix, but the TechArch prompt builder does not include it.
- **Evidence:** Comparing `buildTechnicalArchitecturePrompt()` (lines 1603-1650) with other prompt builders — CURRENT_TECH_VERSIONS is absent. This is why GPT-4o (deprecated) appears throughout the TechArch despite being blocked in other documents.
- **Impact:** Direct cause of H1 (GPT-4o references). The TechArch is the only document that doesn't receive version constraints, making it the most likely place for outdated technology references.
- **Fix:** Add `${CURRENT_TECH_VERSIONS}` to the TechArch prompt template, consistent with how it is injected into other prompt builders.

### W3: "No code" instruction partially violated — 4 ASCII diagrams present
- **Severity:** P3
- **Source:** TechArch lines 154-179 (system architecture diagram), lines 208-228 (product scan flow)
- **Finding:** The prompt says "Do NOT include code — describe what will be built and why, not how to implement it." The document contains 4 code-fenced blocks (lines 154, 179, 208, 228) with ASCII art diagrams: a system architecture component map and a product scan fallback flow diagram.
- **Evidence:** 4 occurrences of triple-backtick code fences in the document, all containing ASCII art/flow diagrams rather than executable code.
- **Impact:** Low — these are architectural diagrams, not code. They arguably enhance the document's value as a technical reference. The spirit of "no code" seems aimed at preventing implementation code snippets, which is respected.
- **Fix:** If strict compliance is desired, change the prompt to "Do NOT include executable code, pseudocode, or code snippets. Architectural diagrams using ASCII art are acceptable." Otherwise, no change needed — the current output is appropriate for the document's purpose.

### W4: Detail level appropriate for Claude Code reference
- **Severity:** PASS
- **Source:** Full document
- **Finding:** The document is appropriately detailed for its stated purpose: "bridges the product brief (what to build) and the execution prompts (how to code it)." Each section provides enough architectural context for a developer (or Claude Code) to understand the "why" behind implementation decisions without duplicating the "how" that EPs provide.
- **Impact:** Positive — the document serves its bridging role well.

---

## Output Efficiency Findings

### E1: Synergies section (Section 8) substantially duplicates Step 5 synergyNotes
- **Severity:** P2
- **Source:** TechArch lines 543-586 vs step-5.json lines 327-367
- **Finding:** Section 8 "Technology Synergies & Integration Notes" contains 8 subsections covering the same 8 synergy pairs as Step 5's `synergyNotes`. The TechArch versions are significantly expanded (~3,700 chars vs ~2,100 chars in Step 5) but contain the same core information with additional implementation detail.
- **Evidence:**
  - Step 5 synergy: "Supabase Auth user IDs (auth.uid()) are used directly in Row Level Security policies..." (173 chars)
  - TechArch 8.1: Same point expanded to ~600 chars with additional detail about RLS timing and anon key behavior
  - All 8 synergy pairs in Step 5 have direct 1:1 counterparts in Section 8
- **Impact:** ~3,700 chars of synergy content is largely restated from Step 5, adding ~1,600 chars of net new detail. The expansion does add some value (implementation timing, security implications) but could be more targeted.
- **Fix:** The TechArch prompt could instruct: "For technology synergies, focus on architectural implications and gotchas not already captured in the Step 5 synergy notes. Do not restate the basic integration facts."

### E2: Security section (Section 7) — mostly tailored, some generic content
- **Severity:** P3
- **Source:** TechArch lines 497-541
- **Finding:** Section 7 is predominantly GlowStack-specific: SecureStore/Keychain for tokens, Apple Sign-In implementation details, biometric data privacy architecture, GDPR compliance mechanisms with specific article references, COPPA age gate, prompt injection prevention for the ingredient engine. The only moderately generic content is the input validation subsection (7.4), which describes standard Zod validation patterns.
- **Evidence:** 5 of 6 subsections contain GlowStack-specific details (device names, specific API surfaces, specific data categories). Subsection 7.4 (prompt injection prevention) is app-specific to the ingredient conflict engine.
- **Impact:** Low — the section is well-tailored to GlowStack's needs. Minimal generic boilerplate.
- **Fix:** No significant change needed. The section is appropriately scoped.

### E3: Database schema section (Section 3) significantly overlaps EP1
- **Severity:** P2
- **Source:** TechArch lines 244-302 vs EP1 database table definitions
- **Finding:** Section 3 describes 13 tables across SQLite and PostgreSQL with full column listings, index strategies, and data lifecycle. EP1 defines 10 of these tables with full column definitions and RLS policies. The overlap is ~60-70% — both documents specify columns, types, indexes, and relationships for the same tables (with different names per H10).
- **Evidence:** TechArch describes: products_cache, user_collection, routines, routine_products, routine_checkins, skin_analyses, conflict_results_cache (SQLite) + product_catalog, ingredient_conflicts_lookup, conflict_results_cache, user_profiles, user_subscriptions, product_submissions (Postgres) = 13 tables. EP1 creates 10 tables with full DDL-level detail.
- **Impact:** The duplication creates a consistency risk (naming mismatches, as documented in H10) and inflates both documents. The TechArch schema serves as an architectural reference while EP1 serves as implementation instructions — having both is reasonable, but the naming inconsistencies undermine this.
- **Fix:** Two options: (1) TechArch describes only the data model at a conceptual level (entities and relationships) without column-level detail, deferring specifics to EPs. (2) TechArch provides the canonical schema and EPs reference it rather than redefining. Option 1 is simpler and reduces TechArch by ~2,500 chars.

### E4: Boilerplate and document framing — minimal
- **Severity:** PASS
- **Source:** TechArch lines 1-21 (header), line 657 (closing)
- **Finding:** Document framing is concise: a 5-line header block, a table of contents, and a 1-line closing note. No excessive introductions, no "In this document we will..." preamble. Each section starts directly with substantive content.
- **Impact:** Positive — well-structured with minimal padding.

### E5: Infrastructure section (Section 6) adds reasonable value
- **Severity:** PASS
- **Source:** TechArch lines 451-494
- **Finding:** Section 6 covers hosting (with cost estimates at different user scales), CI/CD (3 build profiles), environment strategy, and monitoring/observability. While EPs contain some deployment setup instructions, Section 6 provides the strategic infrastructure view (when to upgrade Supabase, cost thresholds, monitoring alert rules) that EPs do not cover.
- **Impact:** The section adds value that EPs cannot — infrastructure planning context, cost scaling projections, and operational monitoring strategy.

### E6: AI cost table (Section 4.6) — valuable and unique
- **Severity:** PASS
- **Source:** TechArch lines 359-370
- **Finding:** The AI cost architecture summary table provides a unique cross-cutting view of per-model costs that does not exist in any other document. The $103/month projection at 1K premium users is a concrete planning artifact.
- **Impact:** Positive — unique content not duplicated elsewhere.

---

## Scorecard Table

| Check ID | Category | Finding Summary | Verdict | Severity |
|----------|----------|----------------|---------|----------|
| H1 | Hallucination | GPT-4o used instead of GPT-5.x per CURRENT_TECH_VERSIONS | FAIL | P1 |
| H2 | Hallucination | TanStack Query v5 not in Step 5 selections | FAIL | P2 |
| H3 | Hallucination | Zustand not in Step 5 selections | FAIL | P2 |
| H4 | Hallucination | NativeWind v4 not in Step 5 selections | FAIL | P2 |
| H5 | Hallucination | Reanimated 3 not in Step 5 selections | WARN | P3 |
| H6 | Hallucination | Drizzle ORM not in Step 5 selections | FAIL | P2 |
| H7 | Hallucination | Vercel AI SDK not in Step 5 selections | FAIL | P2 |
| H8 | Hallucination | `ingredient_education_cache` table fabricated | FAIL | P2 |
| H9 | Hallucination | `/routine-recommendations` Edge Function fabricated | FAIL | P2 |
| H10 | Hallucination | 5 table name mismatches between TechArch and EP1 | FAIL | P2 |
| H11 | Hallucination | `react-native-fast-tflite` specific library not in Step 5 | WARN | P3 |
| W1 | Prompt Weighting | Missing Steps 1-2 context (pricing, positioning) | WARN | P2 |
| W2 | Prompt Weighting | Missing CURRENT_TECH_VERSIONS injection | FAIL | P1 |
| W3 | Prompt Weighting | 4 ASCII diagrams despite "no code" instruction | WARN | P3 |
| W4 | Prompt Weighting | Detail level appropriate for Claude Code reference | PASS | -- |
| E1 | Output Efficiency | Synergies section ~60% duplicates Step 5 notes | WARN | P2 |
| E2 | Output Efficiency | Security section well-tailored, minimal boilerplate | PASS | -- |
| E3 | Output Efficiency | Database schema ~65% overlaps EP1 definitions | WARN | P2 |
| E4 | Output Efficiency | Minimal boilerplate/framing | PASS | -- |
| E5 | Output Efficiency | Infrastructure section adds unique value | PASS | -- |
| E6 | Output Efficiency | AI cost table unique and valuable | PASS | -- |

---

## Summary Statistics

- **Total checks:** 21
- **PASS:** 6 (29%)
- **WARN:** 5 (24%)
- **FAIL:** 10 (48%)
- **P1 issues:** 2 (H1: deprecated model, W2: missing version injection — same root cause)
- **P2 issues:** 11 (H2-H4, H6-H10, W1, E1, E3)
- **P3 issues:** 3 (H5, H11, W3)

### Root Cause Analysis

The two P1 issues (H1 + W2) share a single root cause: `buildTechnicalArchitecturePrompt()` does not inject `CURRENT_TECH_VERSIONS`. This is a one-line fix.

The 6 "technology not in Step 5" findings (H2-H7) share a structural root cause: the Step 5 technology knowledge base covers only 47 entries across 12 categories, but common React Native ecosystem libraries (state management, styling, animation, ORM) are not represented. The TechArch AI fills these gaps by hallucinating reasonable choices, but they bypass the formal selection pipeline. The fix is either to expand the knowledge base to include these foundational libraries, or to instruct the TechArch prompt to only reference technologies present in the Step 5 selections.

The table naming inconsistencies (H10) stem from TechArch and EP1 being generated independently in the same batch, with no shared schema reference point. This could be addressed by having EP1 generate before TechArch and feeding the EP1 table names as context, or by establishing a canonical naming convention in the Step 5 output.

### Recommended Priority Order for Fixes

1. **W2 → H1** (one-line fix): Add `CURRENT_TECH_VERSIONS` to `buildTechnicalArchitecturePrompt()` — eliminates both P1s
2. **H2-H7** (knowledge base expansion): Add TanStack Query, Zustand, NativeWind, Reanimated, Drizzle ORM, Vercel AI SDK to the technologies knowledge base so Step 5 can formally select them
3. **H10** (naming consistency): Establish shared table naming between TechArch and EPs — either via Step 5 output or by generating in sequence
4. **H8-H9** (fabricated entities): Instruct TechArch prompt to reference only Edge Functions and database tables defined in Step 5
5. **E1, E3** (efficiency): Reduce TechArch overlap by instructing the prompt to provide architectural-level descriptions rather than column-level detail for schemas, and to add only novel integration insights for synergies
