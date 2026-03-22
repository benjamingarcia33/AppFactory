# EP2 (Core Features) Audit Report

## Executive Summary

EP2 is the longest execution prompt at 71K characters and provides substantial implementation detail for all 8 core feature screens. However, it contains **critical cross-EP consistency failures** — state management (Zustand in EP1 vs. Context+useReducer in EP2), table names (`user_products` vs. `collections`, `routine_completions` vs. `routine_checkins`, `step_order` vs. `display_order`), and contradictory skin analysis storage architecture (Supabase in EP1 vs. SQLite-only in EP2). It also references the deprecated `expo-barcode-scanner` package (removed in SDK 52) and conflates `@tensorflow/tfjs-react-native` with TFLite (they are different technologies). These issues would cause Claude Code to produce code that fundamentally conflicts with EP1's foundation.

---

## Hallucination Findings

### H1: `expo-barcode-scanner` — Deprecated and Removed in SDK 52
- **Severity**: P1
- **Source**: EP2 Preamble (line 22) and Screen 2 (lines 147-148)
- **Finding**: EP2 lists `expo-barcode-scanner` in the technology requirements and instructs Claude Code to use `expo-barcode-scanner`'s `onBarCodeScanned` callback. This package was deprecated in SDK 50 and **completely removed in SDK 52**. The Expo documentation no longer references it.
- **Evidence**: Expo SDK 52 changelog confirms removal. The replacement is `expo-camera`'s built-in barcode scanning via `onBarcodeScanned` (note the camelCase difference).
- **Impact**: Claude Code will attempt to install a non-existent package and fail during the Scanner screen build. This blocks the entire product ingestion flow.
- **Fix**: Replace all references to `expo-barcode-scanner` with `expo-camera`'s barcode scanning API. Update the callback name from `onBarCodeScanned` to `onBarcodeScanned`. Remove `expo-barcode-scanner` from the tech requirements line.

### H2: `@tensorflow/tfjs-react-native` Conflated with TFLite
- **Severity**: P1
- **Source**: EP2 Preamble (line 22) and Screen 7 (lines 497-502)
- **Finding**: EP2 specifies "TensorFlow Lite via @tensorflow/tfjs-react-native" in the tech requirements, then instructs using `decodeJpeg` and `model.predict()` from TensorFlow.js. However, `@tensorflow/tfjs-react-native` is a **TensorFlow.js platform adapter** (runs full TFJS models via WebGL/expo-gl), NOT a TFLite runtime. TFLite models (.tflite files) require a dedicated package like `react-native-fast-tflite` (a real, maintained npm package by mrousavy/Margelo). These are fundamentally different: TFJS runs JavaScript-based models, TFLite runs compiled native models.
- **Evidence**: Step 5 specifies `tensorflow-lite` as the tech slug with "TFLite format" and ".tflite" model files. The EP2 implementation instructions describe TFJS APIs (`decodeJpeg`, tensor manipulation) which cannot load or run .tflite files.
- **Impact**: Claude Code will install @tensorflow/tfjs-react-native but the code pattern described won't work with .tflite model files. The skin analysis feature will be non-functional.
- **Fix**: Either (a) switch to `react-native-fast-tflite` and rewrite the inference pipeline using `loadTensorflowModel()` / `model.run()`, or (b) keep TFJS and specify a TFJS-compatible model format (SavedModel/TFJS graph model). Given Step 5's privacy requirements and bare workflow decision, option (a) with react-native-fast-tflite is the correct choice.

### H3: Open Beauty Facts API Endpoint — Wrong Domain
- **Severity**: P2
- **Source**: EP2 lines 52, 625
- **Finding**: EP2 uses `world.openfoodfacts.org/api/v2/product/{barcode}.json` and includes a parenthetical: "note this works for beauty products despite the domain name." This is **misleading**. Open Beauty Facts has its own dedicated domain: `world.openbeautyfacts.org`. While the Open Food Facts API works similarly, it is a separate database focused on food products, not cosmetics. Querying openfoodfacts.org for a beauty product barcode will likely return no results or return food items with the same barcode.
- **Evidence**: Open Beauty Facts documentation at https://world.openbeautyfacts.org/data confirms the correct API endpoint is `https://world.openbeautyfacts.org/api/v2/product/{barcode}.json`.
- **Impact**: Product lookups for cosmetics will fail or return incorrect (food) products. The parenthetical explanation actively misleads Claude Code into using the wrong endpoint.
- **Fix**: Change the endpoint to `world.openbeautyfacts.org/api/v2/product/{barcode}.json`. Remove the misleading parenthetical.

### H4: "Top 500 Ingredient Pairs" — Ungrounded Fabrication
- **Severity**: P2
- **Source**: Step 5 line 21 (referenced in EP2 line 50)
- **Finding**: Step 5 specifies a "pre-computed top 500 active ingredient pairs" lookup table. EP2 describes this as an `ingredient_conflicts` table that serves as a cache. There is no established, published dataset of "top 500 skincare ingredient conflict pairs." This number appears fabricated.
- **Evidence**: No dermatological or cosmetic chemistry database publishes a canonical "top 500" list. The EP2 implementation actually describes a **cache-on-demand** system (check cache first, call Claude for unknowns, store results). The "500" number from Step 5 is not referenced in the EP2 implementation at all.
- **Impact**: Low direct impact since EP2 treats it as a growing cache rather than a pre-seeded dataset. However, if Claude Code interprets Step 5 literally and tries to pre-populate 500 entries, it will need to fabricate them.
- **Fix**: Remove the "top 500" claim from Step 5. In EP2, clarify that the ingredient_conflicts table starts empty and populates over time as users trigger conflict checks. Optionally, seed with 20-30 well-known conflicts (retinol+AHA, niacinamide+vitamin C, etc.) from published dermatology sources.

### H5: Claude Model Identifier — Correct
- **Severity**: N/A (PASS)
- **Source**: EP2 line 22, line 615
- **Finding**: The model identifier `claude-sonnet-4-5-20250929` is used consistently. This matches the correct Claude 4.5 Sonnet model ID format.
- **Evidence**: Confirmed against current model documentation.
- **Impact**: None.

### H6: `react-native-fast-tflite` — Real Package (Not Referenced)
- **Severity**: N/A (informational)
- **Finding**: `react-native-fast-tflite` IS a real, published npm package (v2.0.0, maintained by mrousavy/Margelo). Step 5 references `tensorflow-lite` as the tech slug. EP2 should reference this package instead of @tensorflow/tfjs-react-native (see H2).

---

## Prompt Weighting Findings

### W1: State Management — EP1 vs. EP2 Fundamental Conflict
- **Severity**: P1
- **Source**: EP1 lines 25, 41, 388, 436, 464, 556, 644 vs. EP2 lines 38-41
- **Finding**: EP1 explicitly specifies **Zustand** as the state management library, installs it as a dependency, and defines 5 Zustand stores (authStore, profileStore, onboardingStore, settingsStore, themeStore). EP2 completely abandons Zustand and introduces **React Context + useReducer** via an "AppStateContext" pattern. These are incompatible architectures. EP2 never mentions Zustand or references the existing stores.
- **Impact**: Claude Code will build EP2 with Context+useReducer, creating a parallel state system that ignores the Zustand stores from EP1. Authentication state, profile data, and settings will exist in Zustand (from EP1) while products, routines, and check-ins will exist in Context (from EP2). This creates confusion, potential stale state bugs, and architectural inconsistency.
- **Fix**: EP2 should extend the Zustand pattern from EP1. Replace the AppStateContext section with new Zustand stores: `productsStore`, `routinesStore`, `checkinsStore`. Reference the existing stores from EP1 where relevant (e.g., authStore for user ID, profileStore for skin type in suitability badges).

### W2: Table Name Conflicts — `user_products` vs. `collections`
- **Severity**: P1
- **Source**: EP1 line 141 vs. EP2 throughout (lines 82, 110, 141, 173, 210, 230, 242, 404, 432, 436, 661)
- **Finding**: EP1 defines the user-products join table as `user_products`. EP2 consistently calls it `collections`. The Supabase queries in EP2 use `supabase.from('collections')` which will fail because EP1 created the table as `user_products`. Furthermore, the column names differ:
  - EP1: `price_paid`, `is_favorite`, `notes`, `usage_count`, `last_used_at`, `status` (active/finished/expired/wishlist)
  - EP2: `purchase_price`, `personal_rating` (1-5), `personal_notes`, `usage_frequency` (daily/weekly/occasional/rarely), `is_archived`, `opened_date`, `added_at`
  These are completely different schemas for the same table.
- **Impact**: Every Supabase query in EP2 that touches the collection table will fail with "relation 'collections' does not exist." Even if the table name is fixed, the column names are wrong.
- **Fix**: Align EP2 to use `user_products` table name and the exact column names from EP1's schema. If EP2 needs additional columns (like `personal_rating`, `is_archived`), specify them as ALTER TABLE additions, not as a different table.

### W3: Table Name Conflict — `routine_completions` vs. `routine_checkins`
- **Severity**: P1
- **Source**: EP1 line 202 vs. EP2 lines 78, 109, 113, 342-346, 366-374
- **Finding**: EP1 defines the routine completion tracking table as `routine_completions` with a specific schema. EP2 introduces `routine_checkins` with a different schema:
  - EP1 `routine_completions`: products_completed as UUID array, notes as text, immutable (no UPDATE/DELETE)
  - EP2 `routine_checkins`: products_completed as JSONB array of product ID strings, completed_at updated on last check-off, allows upsert
  EP2 even says "The routine_checkins table (which must be created if not already present from Prompt 1)" — acknowledging the table may not exist, but using a different name than what EP1 actually created.
- **Impact**: All check-in queries will fail. The streak calculation, Dashboard routines, and Routine Detail screen will be non-functional.
- **Fix**: Use `routine_completions` (EP1's name) consistently. Reconcile the schema differences — EP2's JSONB approach with upsert is more flexible, so update EP1's schema to match, or vice versa.

### W4: Column Name Conflict — `step_order` vs. `display_order`
- **Severity**: P2
- **Source**: EP1 line 194 vs. EP2 lines 244, 274, 288, 308, 350
- **Finding**: EP1 defines `routine_products.step_order` for the ordering column. EP2 calls it `display_order` everywhere and also adds `wait_time_seconds` and `notes` columns that don't exist in EP1's schema.
- **Impact**: All ordering queries and inserts for routine products will reference the wrong column name.
- **Fix**: Use `step_order` (EP1's name) or explicitly add an ALTER TABLE to rename it. Add `wait_time_seconds` and `notes` columns as EP2 additions.

### W5: Skin Analysis Storage Architecture Contradiction
- **Severity**: P1
- **Source**: EP1 lines 218-235 vs. EP2 lines 466-468, 504, 508
- **Finding**: EP1 creates a `skin_analyses` table **in Supabase PostgreSQL** (with RLS policies, user_id, and server-side storage). EP2 states "These results are never uploaded to Supabase. This is a firm architectural decision for privacy." EP2 stores results **exclusively in local SQLite** in a `skin_analysis_results` table with different column names and a 0.0-1.0 score scale (vs. EP1's 0-100 numeric(5,2) scale).
- **Impact**: Claude Code will implement SQLite-only storage per EP2, leaving the Supabase `skin_analyses` table from EP1 empty and unused. The data models have different score scales (0-1 vs. 0-100) and different column names (`concern_tags` vs. `concerns_detected`, `captured_at` vs. `analyzed_at`).
- **Fix**: Decide on one architecture. Given the privacy emphasis throughout the product vision, SQLite-only (EP2's approach) is likely correct. Remove the `skin_analyses` table from EP1, or keep it for non-sensitive metadata only while photos and detailed scores stay in SQLite.

### W6: Preamble Lists EP1 Tables Inconsistently
- **Severity**: P2
- **Source**: EP2 line 11
- **Finding**: The EP2 preamble says EP1 created "All PostgreSQL tables (users, products, routines, routine_products, collections, notification_preferences)." But EP1 actually created: profiles (not "users"), products, user_products (not "collections"), routines, routine_products, routine_completions, skin_analyses, notification_preferences, and user_subscriptions. The preamble lists 6 tables, EP1 defines 9. It uses wrong names for 2 of them.
- **Impact**: Claude Code may assume different table names than what actually exists from EP1.
- **Fix**: List the exact table names from EP1: profiles, products, user_products, routines, routine_products, routine_completions, skin_analyses, notification_preferences, user_subscriptions.

### W7: Instruction Depth Is Reasonably Balanced Across Screens
- **Severity**: N/A (PASS)
- **Finding**: Screen sections range from 61-76 lines each. Screen 8 (Ingredient Conflict Report) is the longest at 76 lines due to Edge Function implementation detail, and Screens 5-6 are the shortest at 61 lines each. The variance (15 lines, ~20%) is acceptable. All screens cover all six required prose headings (Purpose, Data Model, User Interactions, API Calls, State Management, Edge Cases).

### W8: Barcode Scanner Edge Cases — Covered
- **Severity**: N/A (PASS)
- **Finding**: Screen 2 covers camera permission denied (line 185), invalid/unrecognized barcodes (line 189), network errors during lookup (line 187), duplicate rapid scans (line 183), and product not found (lines 157-158). The coverage is thorough.

---

## Output Efficiency Findings

### E1: Preamble Restates EP1 Architecture Decisions
- **Severity**: P3
- **Source**: EP2 lines 6-18
- **Finding**: The preamble lists 10 bullet points of what EP1 built, some of which are already covered by the EP cross-reference system. This is 13 lines of content that EP's cross-reference summary should already provide.
- **Impact**: Minor token waste (~200 tokens). However, this redundancy is somewhat beneficial as a safety check — ensuring Claude Code knows what exists.
- **Fix**: Optional — could trim to 3-4 key items. But the redundancy has value for grounding, so low priority.

### E2: Global Architecture Decisions Section — 40 Lines of New Architecture
- **Severity**: P2
- **Source**: EP2 lines 28-66
- **Finding**: The "Global Architecture Decisions" section introduces 40 lines of new architectural decisions (navigation structure, shared state management, local SQLite layer, Supabase Edge Functions architecture, error handling patterns, analytics events). This is essentially a mini Technical Architecture document embedded in EP2. Much of this overlaps with what should be in the TechArch document and EP1's project structure. The Edge Functions architecture alone is 9 lines here, then repeated in detail in the "Supabase Edge Functions — Detailed Specifications" section (lines 605-638), creating internal redundancy.
- **Impact**: ~700 tokens of content that could be more concise. The Edge Function architecture appears twice.
- **Fix**: Move the Edge Functions overview from lines 43-56 into the detailed spec section (lines 605-638) and reference it once. Trim the Global Architecture section to navigation structure and state management only.

### E3: Edge Function Specifications — Duplicated Within EP2
- **Severity**: P2
- **Source**: EP2 lines 43-56 (overview) and lines 605-638 (detailed specs) and Screen 8 lines 568-601 (ingredient-check internal logic)
- **Finding**: The ingredient-check Edge Function is described **three times**:
  1. Lines 50-51: Overview in Global Architecture (5 lines)
  2. Lines 607-617: Detailed spec section (11 lines)
  3. Lines 568-601: Full internal logic within Screen 8's API Calls section (34 lines)
  The Screen 8 description is the most complete, including the Claude API call details, caching logic, hash computation, error handling, and scoring algorithm. The detailed spec section at lines 607-617 adds rate limiting and JWT details. The overview at lines 50-51 is a subset of both.
- **Impact**: ~50 lines (~800 tokens) of redundancy. More critically, if the three descriptions diverge, Claude Code won't know which one is authoritative.
- **Fix**: Consolidate into one definitive spec section. The Screen 8 API Calls section should reference "See Edge Function specifications below" rather than redefining the entire logic inline.

### E4: Product Detail Screen — Generic UI Patterns
- **Severity**: P3
- **Source**: EP2 lines 218-234
- **Finding**: The Product Detail User Interactions section includes generic UI patterns that Claude Code would implement by default: scrollable detail view with collapsible header (7 lines), share button behavior (3 lines), archive/unarchive (3 lines). These are standard patterns that don't need this level of specification.
- **Impact**: ~200 tokens of low-value instructions.
- **Fix**: Trim the collapsible header to 1 line ("collapsible hero image header, 250pt hero collapsing to 60pt on scroll"). Focus detail on the domain-specific interactions (ingredient list, conflict warnings, skin-type badges).

### E5: File Is Truncated at Line 661
- **Severity**: P2
- **Source**: EP2 line 661
- **Finding**: The file ends mid-sentence: "When a product's expiry date is set or updated in the collections table, schedule a local notification for" — the Notification System Wiring section is cut off. Content about expiry alert notifications, product-level notification scheduling, and potentially other sections is missing.
- **Impact**: Claude Code will not receive complete notification wiring instructions. Expiry alerts may not be implemented.
- **Fix**: This is likely a token truncation issue during generation. Increase the EP2 token limit or split notification system wiring into EP3.

---

## IDE Executability Findings

### I1: Edge Function API Contract — Insufficient for Code Generation
- **Severity**: P1
- **Finding**: While the Edge Functions are described in prose, they lack the precise API contract Claude Code needs:
  - **Request body schema**: The ingredient-check function's request body is described narratively in Screen 8 (line 570) but the product-lookup and ai-skin-tips request schemas are only implied.
  - **Response body schema**: No explicit response shapes are defined. The ingredient-check response includes `overall_compatibility_score`, `product_names`, `analysis_timestamp`, `conflict_pairs` (lines 538-539) but these are buried in Screen 8's data model, not in the Edge Function spec.
  - **HTTP status codes**: Only 401, 429, and 503 are mentioned. Standard codes like 200, 400, 404 are not specified.
  - **Error response format**: Not standardized across the three functions.
- **Impact**: Claude Code will have to infer request/response shapes from scattered prose across multiple sections. This increases the chance of misinterpretation.
- **Fix**: Add a structured API contract for each Edge Function in the detailed spec section: method, path, request body (field names and types), response body (field names and types), status codes, and error format.

### I2: TFLite Model — No Tensor Shape or Model Architecture Specified
- **Severity**: P1
- **Finding**: Screen 7 specifies using a TFLite model for skin analysis but provides no actionable model specification:
  - Input tensor shape is stated as 224x224 (line 498) but number of channels (RGB=3? RGBA=4?) is not specified.
  - Output tensor shape is not specified. The text says "output tensors containing the five score values" (line 501) but doesn't specify whether this is a single tensor of shape [5], five separate tensors, or something else.
  - Model architecture is not specified (Step 5 mentions "Custom-trained MobileNetV4/EfficientNet-Lite" but EP2 doesn't reference this).
  - No model file path or bundling instructions (Step 5 says "bundled with app binary" but EP2 doesn't specify the asset path).
  - No information on whether a pre-trained model exists or needs to be trained/sourced.
- **Impact**: Claude Code cannot implement the inference pipeline without knowing the exact tensor I/O specification. It will have to guess or create a placeholder.
- **Fix**: Specify: (a) model file location (e.g., `assets/models/skin-analysis-v1.tflite`), (b) input tensor shape `[1, 224, 224, 3]` (batch, height, width, RGB), (c) output tensor shape `[1, 5]` (batch, [pore, hydration, texture, redness, overall]), (d) value range (0.0-1.0 float32), (e) a placeholder model file approach for MVP (use a random-weight model for UI development, replace with trained model later).

### I3: SQLite Schema — Actionable but Missing Initialization Hook
- **Severity**: P2
- **Finding**: EP2 describes three SQLite tables (cached_products, skin_analysis_results, search_history) in the Global Architecture section (lines 43-44) and in Screen 7 (lines 466). The skin_analysis_results schema is fully specified (line 466). However:
  - The `cached_products` table schema is described as "mirroring the Supabase products table shape" without listing exact columns.
  - The `search_history` table only mentions "recent product search terms" without specifying columns.
  - The initialization function is mentioned (line 43: "Create a local database initialization function that runs on app startup") but no hook or lifecycle integration point is specified. Should it run in the root layout? In a useEffect? In a Zustand store initializer?
- **Impact**: Claude Code will need to infer the cached_products and search_history schemas and decide where to run the initialization.
- **Fix**: Specify all three SQLite table schemas explicitly (column names, types, indices). Specify the initialization point (e.g., "In the root layout's useEffect, before rendering children, call initializeLocalDatabase()").

### I4: Ingredient Suitability Rules Engine — No Source Data
- **Severity**: P2
- **Finding**: Screen 3 (lines 222-223) describes a "local JSON mapping of ingredient names to skin type flags" for computing skin-type suitability badges. This is specified as a "static local dictionary of common INCI ingredients bundled with the app as a JSON asset." However:
  - No JSON structure is specified.
  - No list of ingredients to include is given.
  - No source for the ingredient-to-skin-type mappings is referenced.
  - The same concept appears in Screen 3 (line 220) as "a brief inline tooltip or bottom sheet explaining what the ingredient does."
- **Impact**: Claude Code will need to fabricate an ingredient dictionary with skin-type mappings. The quality of the data will be unreliable.
- **Fix**: Provide a seed dataset structure (e.g., 30-50 common INCI ingredients with skin-type flags and descriptions) or reference a published cosmetic ingredient database. Alternatively, specify that this feature uses the Claude API via an Edge Function rather than a local dictionary.

### I5: Data Models for Routine Builder — Sufficiently Detailed
- **Severity**: N/A (PASS)
- **Finding**: The routines and routine_products table schemas are fully specified in Screen 4 (lines 272-274) with all column names, types, and constraints. The CRUD operations are clearly described with Supabase query examples. This is actionable for code generation.

### I6: Dual Storage Sync Strategy — Partially Specified
- **Severity**: P2
- **Finding**: EP2 describes a dual-storage architecture (Supabase + SQLite) but the sync strategy is incomplete:
  - **Write-through caching** for products is described (line 44: "every product fetched from the server or API is also inserted into SQLite").
  - **Offline queuing** for archive actions is described (line 454: "store pending operations in SQLite and process on next successful network request").
  - **Missing**: How to handle conflicts when offline-queued operations conflict with server state. How to handle SQLite cache invalidation. Whether the SQLite cache has a size limit or TTL. How to handle the initial cold-start (first launch with empty SQLite).
- **Impact**: Claude Code will implement basic write-through caching but may not handle edge cases like cache staleness or offline queue conflicts.
- **Fix**: Specify: cache TTL (e.g., 7 days), maximum cache size (e.g., 1000 products), conflict resolution strategy (last-write-wins), and cold-start behavior (fetch all on first launch, paginate thereafter).

### I7: No Code Blocks — PASS
- **Severity**: N/A (PASS)
- **Finding**: EP2 contains zero code blocks (no triple-backtick fences). All technical specifications are written in prose as required by the ABSOLUTE RULE. The document is clean markdown throughout.

---

## Scorecard Table

| Check ID | Check Description | Result | Severity |
|----------|-------------------|--------|----------|
| H1 | expo-barcode-scanner is a valid SDK 52 package | **FAIL** | P1 |
| H2 | TFLite package reference is accurate | **FAIL** | P1 |
| H3 | Open Beauty Facts API endpoint is correct | **FAIL** | P2 |
| H4 | "Top 500 ingredient pairs" is grounded | **FAIL** | P2 |
| H5 | Claude model identifier is correct | PASS | — |
| H6 | react-native-fast-tflite is a real package | PASS | — |
| W1 | State management consistent with EP1 | **FAIL** | P1 |
| W2 | Table name `collections` matches EP1 | **FAIL** | P1 |
| W3 | Table name `routine_checkins` matches EP1 | **FAIL** | P1 |
| W4 | Column name `display_order` matches EP1 | **FAIL** | P2 |
| W5 | Skin analysis storage architecture consistent | **FAIL** | P1 |
| W6 | Preamble table names match EP1 | **FAIL** | P2 |
| W7 | Instruction depth balanced across screens | PASS | — |
| W8 | Barcode scanner edge cases covered | PASS | — |
| E1 | Preamble redundancy with EP1 | WARN | P3 |
| E2 | Global Architecture section efficiency | WARN | P2 |
| E3 | Edge Function triple-description redundancy | **FAIL** | P2 |
| E4 | Generic UI instructions padding | WARN | P3 |
| E5 | File truncated — incomplete content | **FAIL** | P2 |
| I1 | Edge Function API contracts actionable | **FAIL** | P1 |
| I2 | TFLite model specification actionable | **FAIL** | P1 |
| I3 | SQLite schema fully specified | WARN | P2 |
| I4 | Ingredient rules engine data provided | **FAIL** | P2 |
| I5 | Routine data models fully specified | PASS | — |
| I6 | Dual-storage sync strategy complete | WARN | P2 |
| I7 | No code blocks in output | PASS | — |

---

## Summary Statistics

- **Total checks**: 27
- **PASS**: 8 (30%)
- **WARN**: 4 (15%)
- **FAIL**: 15 (55%)

**By severity of failures:**
- **P1 (Critical)**: 8 — H1, H2, W1, W2, W3, W5, I1, I2
- **P2 (Major)**: 7 — H3, H4, W4, W6, E3, E5, I4
- **P3 (Minor)**: 0 failures (2 warnings)

**Root cause analysis**: The majority of P1 failures (W1-W5) stem from a single systemic issue: **EP2 was generated without binding to EP1's actual output**. The EP cross-reference system provides a compact summary but does not enforce schema-level consistency. Table names, column names, state management libraries, and architectural decisions from EP1 are ignored or contradicted. This suggests the EP builders need access to EP1's actual data model definitions (table names, column names) as input, not just a prose summary.

**Estimated fix effort**: The 8 P1 issues require changes in `buildExecutionPrompt2()` in `architect-prompts.ts` to inject EP1's schema definitions as a binding constraint. The 2 hallucination P1s (H1, H2) require updating the `CURRENT_TECH_VERSIONS` constant or the technology knowledge base entries for `tensorflow-lite` and adding a note about expo-barcode-scanner deprecation.
