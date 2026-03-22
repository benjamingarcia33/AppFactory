# EP1 (Foundation) Audit Report

## Executive Summary

EP1 is a well-structured, 799-line architectural blueprint that would give Claude Code enough information to scaffold a working Expo project with authentication, onboarding, profile, and settings. The no-code-blocks rule is fully enforced (zero triple-backtick fences detected). However, there are material issues: **database table names diverge from the Technical Architecture document** (EP1 uses `profiles`/`products`/`user_products` vs TechArch's `user_profiles`/`product_catalog`/`user_collection`), the `skin_analyses` table is defined in EP1's schema but should be local-SQLite-only per the privacy architecture, and the EP1 omits TanStack Query (specified in TechArch as the server-state manager) while only specifying Zustand. The document is efficient at ~61K chars with minimal redundancy, and the four EP1 screens (Welcome, Onboarding, Profile, Settings) receive thorough, balanced coverage.

---

## Hallucination Findings

### H1 — expo-router version ambiguity (P3)
- **Source**: EP1 line 17, 341, 783
- **Finding**: EP1 consistently refers to "expo-router v4". According to npm, expo-router for SDK 52 ships as package version `4.0.x`, but Expo's changelog has also published `5.0.0-sdk-52-router-patches`. The "v4" label is **correct** for the stable SDK 52 release.
- **Evidence**: npm registry shows `expo-router@4.0.11` as the SDK 52 stable version; a patched `5.0.0-sdk-52-router-patches` exists but is not the standard release.
- **Impact**: Low. Claude Code would install the correct version via `npx create-expo-app` regardless.
- **Fix**: No fix needed. The reference is accurate for SDK 52 stable.

### H2 — `postgres` npm package described as "pg driver" (P3)
- **Source**: EP1 line 23
- **Finding**: EP1 lists `postgres (the pg driver for Drizzle migrations)`. The npm package `postgres` is actually **postgres.js** (by porsager), which is a different driver from `pg` (node-postgres). The parenthetical "pg driver" is misleading — it is technically the `postgres.js` driver, not the `pg` driver.
- **Evidence**: Drizzle ORM docs distinguish between `postgres` (postgres.js) and `pg` (node-postgres) as two separate PostgreSQL drivers.
- **Impact**: Low. Claude Code would install the correct `postgres` package, but the misleading comment could cause confusion.
- **Fix**: Change description to `postgres (postgres.js driver for Drizzle migrations)` to avoid conflation with `pg`.

### H3 — All npm package names verified as real (PASS)
- **Source**: EP1 lines 21-31
- **Finding**: Every npm package listed in the dependency install section exists on npm and is actively maintained:
  - `expo-router`, `expo-linking`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated` -- all real
  - `@supabase/supabase-js`, `expo-auth-session`, `expo-crypto`, `expo-apple-authentication`, `@react-native-async-storage/async-storage` -- all real
  - `drizzle-orm`, `drizzle-kit`, `postgres` -- all real
  - `nativewind`, `tailwindcss` -- all real (nativewind v4.2.x is current)
  - `zustand` -- real
  - `expo-notifications`, `expo-device` -- all real
  - `@sentry/react-native` -- real
  - `posthog-react-native` -- real
  - `expo-updates` -- real
  - `react-native-purchases` -- real (RevenueCat SDK 8+)
  - `expo-image-picker`, `expo-haptics`, `expo-linear-gradient`, `react-native-toast-message`, `expo-secure-store` -- all real
- **Evidence**: Verified against npm registry.
- **Impact**: None. All packages exist.
- **Fix**: None needed.

### H4 — skin_analyses table defined in Supabase but should be SQLite-only (P1)
- **Source**: EP1 lines 218-235
- **Finding**: EP1 defines `skin_analyses` as a **Supabase PostgreSQL** table with RLS policies and `user_id` referencing `auth.users`. However, the Technical Architecture document (Section 3.1) explicitly states skin analysis data is **on-device SQLite only** for privacy: "Sensitive personal data — progress photos, skin analysis scores, skin analysis trends — has no business leaving the user's device." The TechArch defines `skin_analyses` under "On-Device SQLite Schema" (Section 3.1), not in the Supabase schema.
- **Evidence**: TechArch Section 2.5: "Skin analysis results are written to Expo SQLite only, with no Supabase sync path in the data model." EP1 line 220: "Stores results from on-device AI skin analysis. The actual photos are stored only in local SQLite on the device — this table stores only the numerical results and metadata." This is contradictory — the EP1 table IS in Supabase (it has RLS policies and user_id FK to auth.users).
- **Impact**: **High**. This violates the core privacy architecture. If Claude Code creates this table in Supabase, skin analysis scores would be stored in the cloud, undermining the "data never leaves your device" promise. A real-world privacy compliance issue.
- **Fix**: Remove `skin_analyses` from the Supabase schema. Instead, instruct EP1 to create it as a local expo-sqlite table (no RLS, no auth.users FK). Or defer entirely to EP2 which handles the AI Skin Analysis screen.

### H5 — Database table naming inconsistency with Technical Architecture (P1)
- **Source**: EP1 lines 95-291 vs TechArch Section 3.2
- **Finding**: EP1 and TechArch use **different table names** for the same entities:

| Entity | EP1 Name | TechArch Name |
|--------|----------|---------------|
| User profiles | `profiles` | `user_profiles` |
| Product catalog | `products` | `product_catalog` |
| User's product collection | `user_products` | `user_collection` (SQLite) |
| Ingredient conflicts | `ingredient_conflicts` | `ingredient_conflicts_lookup` |
| Notification prefs | `notification_preferences` | embedded JSONB in `user_profiles` |
| Subscription sync | `user_subscriptions` | `user_subscriptions` (same) |

- **Evidence**: EP1 line 95: "Table: profiles". TechArch line 280: "user_profiles". EP1 line 117: "Table: products". TechArch line 271: "product_catalog".
- **Impact**: **High**. When EP2 and EP3 are executed, they will reference table names from TechArch (since they also receive the TechArch as context). Claude Code would encounter mismatched table references, causing either SQL errors or redundant tables.
- **Fix**: Align EP1 table names with TechArch. Use `user_profiles`, `product_catalog`, `ingredient_conflicts_lookup`, etc. Alternatively, update TechArch to match EP1's names (less preferred since TechArch is the canonical reference).

### H6 — TechArch specifies notification_preferences as JSONB column, EP1 as separate table (P2)
- **Source**: EP1 lines 237-258 vs TechArch line 281
- **Finding**: TechArch stores notification preferences as a `notification_preferences` JSONB column within the `user_profiles` table. EP1 creates a separate `notification_preferences` table with its own RLS policies and triggers. These are architecturally incompatible designs.
- **Evidence**: TechArch line 281: "`notification_preferences` (JSONB)". EP1 line 237: "Table: notification_preferences" with 13 columns.
- **Impact**: Medium. EP1's separate table is actually a better design (normalized, individually queryable fields), but it contradicts the canonical TechArch. EP2/EP3 may reference the JSONB column approach.
- **Fix**: Reconcile. EP1's separate table design is superior — update TechArch to match, or add a note in EP1 explaining the deviation.

### H7 — EP1 schema has `ingredients` as text array, TechArch uses JSONB (P2)
- **Source**: EP1 line 129 vs TechArch line 272
- **Finding**: EP1's `products` table stores ingredients as `text array` with a GIN index. TechArch's `product_catalog` stores `inci_ingredients` as `JSONB` with a GIN index. These are different PostgreSQL types with different query semantics (array containment `@>` vs JSONB containment).
- **Evidence**: EP1 line 129: "ingredients — text array". TechArch line 272: "inci_ingredients (JSONB, GIN indexed)".
- **Impact**: Medium. The Edge Functions in EP2 would need to know which data type to query against. Inconsistency causes runtime errors.
- **Fix**: Standardize on one type. JSONB is more flexible and is the TechArch standard.

---

## Prompt Weighting Findings

### W1 — Balanced screen coverage (PASS)
- **Source**: EP1 lines 378-731
- **Finding**: The four EP1 screens receive proportional, detailed coverage:
  - Welcome & Sign In: ~76 lines (lines 378-453)
  - Skin Profile Onboarding: ~87 lines (lines 456-543)
  - Profile & Skin Profile: ~85 lines (lines 546-631)
  - Settings: ~98 lines (lines 634-731)
- Each screen follows the required format: Purpose, Data Model, User Interactions, API Calls, State Management, Edge Cases. Coverage depth is appropriate — no screen is underserved.
- **Impact**: None. Good balance.
- **Fix**: None needed.

### W2 — ABSOLUTE RULE enforcement is effective (PASS)
- **Source**: EP1 line 1 (the output does not contain the rule since it was in the prompt; the output is clean)
- **Finding**: Zero code blocks detected in the 799-line output. All interfaces, data shapes, API calls, and configuration are described in prose and bullet points. The `stripCodeBlocks()` function in the builder and the ABSOLUTE RULE + FINAL CHECK instructions successfully prevented code block generation.
- **Evidence**: `grep "```" ep-1.md` returns zero matches.
- **Impact**: None. The rule works.
- **Fix**: None needed.

### W3 — epCrossRef conciseness is adequate (PASS)
- **Source**: EP1 lines 5-7 (the Overview section paraphrases the cross-ref)
- **Finding**: The cross-reference is embedded naturally in the overview paragraph rather than appearing as a verbose separate section. EP1 does not reproduce EP2 or EP3 content — it only mentions "coming soon" stubs for tabs that EP2 will build. This is the intended behavior of the `buildEPCrossReference()` function.
- **Impact**: None. Compact and effective.
- **Fix**: None needed.

### W4 — Scaffolding vs screen instructions ratio is well-balanced (PASS)
- **Source**: EP1 lines 10-376 (scaffolding ~366 lines) vs lines 378-731 (screens ~354 lines)
- **Finding**: Approximately 51% scaffolding (project init, DB schema, shared config) and 49% screen-specific instructions. This is appropriate for EP1 which must establish the entire project foundation. The scaffolding section includes: project initialization (~76 lines), database schema (~215 lines), shared configuration (~75 lines).
- **Impact**: None. Reasonable ratio for a foundation prompt.
- **Fix**: None needed.

### W5 — Missing TanStack Query specification (P2)
- **Source**: EP1 (entire document)
- **Finding**: TechArch Section 1.1 specifies "TanStack Query v5 (React Query) manages all server-state fetching, caching, and synchronization" alongside Zustand for client-side state. EP1 only mentions Zustand for state management and describes all data fetching as direct Supabase calls stored in Zustand. TanStack Query is never mentioned.
- **Evidence**: Grep for "TanStack" or "react-query" in EP1 returns zero matches. TechArch explicitly calls it out as a core technology.
- **Impact**: Medium. Without TanStack Query, EP2 screens (which are data-heavy) would need to be refactored. Better to install and configure it in EP1 so EP2 builds on it.
- **Fix**: Add `@tanstack/react-query` to the dependency list and add a brief configuration section in Shared Configuration describing the QueryClient setup in the root layout.

---

## Output Efficiency Findings

### E1 — Database schema section is thorough but not redundant (PASS)
- **Source**: EP1 lines 92-306
- **Finding**: The database schema section is ~215 lines covering 10 tables. Each table specifies fields, types, constraints, indexes, and RLS policies. While this is the largest single section, it is NOT redundant with TechArch because:
  - EP1 provides migration-ready detail (exact field types, constraint values, trigger functions) that TechArch only summarizes.
  - The schema IS the core deliverable of EP1 — it must be comprehensive.
  - However, the table naming divergence (H5) means this section is duplicated work that contradicts TechArch rather than complementing it.
- **Impact**: The ~215 lines are justified IF the table names are corrected to match TechArch. As-is, the divergence means Claude Code gets conflicting instructions across documents.
- **Fix**: Align names with TechArch (see H5). After alignment, the length is appropriate.

### E2 — Theme system specification is appropriately concise (~30 lines) (PASS)
- **Source**: EP1 lines 312-325
- **Finding**: The theme system is ~30 lines covering brand colors, semantic colors, typography scale, spacing, border radius, and dark mode configuration. This is efficient — no over-specification. It provides the design tokens Claude Code needs without dictating implementation details.
- **Impact**: None.
- **Fix**: None needed.

### E3 — Folder layout specification is appropriately concise (~12 lines) (PASS)
- **Source**: EP1 lines 33-45
- **Finding**: The folder layout is ~12 lines listing top-level directories with brief descriptions of their contents. This is efficient and provides clear structure without over-specifying file names within each directory.
- **Impact**: None.
- **Fix**: None needed.

### E4 — Navigation structure section is detailed but justified (~22 lines) (PASS)
- **Source**: EP1 lines 339-361
- **Finding**: Navigation is described in ~22 lines covering root layout, auth stack, onboarding stack, and 5-tab main navigator. This is necessary detail — expo-router file-based routing requires understanding the exact folder/file structure to work correctly.
- **Impact**: None.
- **Fix**: None needed.

### E5 — Edge Function delete-account section adds value (~16 lines) (PASS)
- **Source**: EP1 lines 735-748
- **Finding**: The delete-account Edge Function specification is ~16 lines and is referenced by the Settings screen. It provides the server-side implementation spec that Claude Code needs. This is not redundant — it's the only place this Edge Function is defined.
- **Impact**: None.
- **Fix**: None needed.

### E6 — Integration Wiring Checklist adds value (~22 lines) (PASS)
- **Source**: EP1 lines 751-773
- **Finding**: The 10-item integration checklist at the end provides test scenarios for verifying the EP1 build. This is valuable for Claude Code to self-validate its work. Not redundant.
- **Impact**: None.
- **Fix**: None needed.

### E7 — Overall document efficiency is good (PASS)
- **Source**: Full document
- **Finding**: At ~799 lines / ~61K chars, the document has minimal filler. The overview is 7 lines, the summary is 20 lines, and the rest is actionable specification. No significant redundancy detected. The largest opportunity for reduction would be merging the schema definitions with TechArch's schema rather than redefining them, but that would require a cross-document reference mechanism that doesn't exist in the prompt pipeline.
- **Impact**: None.
- **Fix**: None needed.

---

## IDE Executability Findings

### I1 — Bare workflow instruction may cause confusion (P2)
- **Source**: EP1 line 15, 17
- **Finding**: EP1 says "Expo SDK 52 with bare workflow (required for future TFLite native module in EP2)" and "Create the project using the Expo CLI with the bare workflow template." However, modern Expo SDK 52 uses CNG (Continuous Native Generation) with `npx create-expo-app` followed by `npx expo prebuild` when native modules are needed. There is no "bare workflow template" in SDK 52 — the concept has been replaced by development builds with prebuild. Claude Code may be confused by the "bare workflow template" instruction.
- **Evidence**: Expo SDK 52 docs recommend `npx create-expo-app` + `npx expo prebuild` for native module support, not a separate bare workflow template.
- **Impact**: Medium. Claude Code might attempt to use a deprecated bare workflow template, fail, and need to recover.
- **Fix**: Change to: "Create the project using `npx create-expo-app` with TypeScript. Configure as a development build (not Expo Go) since TFLite native modules will be added in EP2. Run `npx expo prebuild` to generate native iOS project files."

### I2 — expo-router v4 setup instructions are correct for SDK 52 (PASS)
- **Source**: EP1 lines 17, 341-360
- **Finding**: The file-based routing structure with `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(onboarding)/_layout.tsx`, and `app/(tabs)/_layout.tsx` is correct for expo-router v4 on SDK 52. Group routes with parentheses `()` and layout files are the standard pattern.
- **Impact**: None.
- **Fix**: None needed.

### I3 — Supabase RLS SQL is correctly described but not executable SQL (PASS with caveat)
- **Source**: EP1 lines 93-291
- **Finding**: RLS policies are described in prose (e.g., "Users can SELECT, UPDATE only their own row where id equals auth.uid()"). This is correct behavior per the ABSOLUTE RULE — no SQL code blocks. Claude Code can generate the correct SQL from these prose descriptions. The RLS descriptions are semantically correct and complete for each table.
- **Caveat**: The routine_products RLS policy (line 199-200) correctly describes the JOIN-based policy using EXISTS, which is the proper pattern for child tables. This is a non-trivial RLS pattern that Claude Code should handle correctly.
- **Impact**: None.
- **Fix**: None needed.

### I4 — app.config.js configuration is comprehensive and correct (PASS)
- **Source**: EP1 lines 60-83
- **Finding**: The app.config.js specification covers: name, slug, scheme (for deep linking), version, orientation, icon, splash, iOS bundle identifier, infoPlist camera/photo permissions, plugins array (Sentry, expo-router, expo-notifications, expo-apple-authentication, expo-secure-store), updates config, and EAS project ID. All values are correct for SDK 52.
- **Impact**: None.
- **Fix**: None needed.

### I5 — Environment variable names are consistent and follow Expo conventions (PASS)
- **Source**: EP1 lines 47-57
- **Finding**: All client-side env vars use the `EXPO_PUBLIC_` prefix (required by Expo to be bundled into the client). The server-side `SUPABASE_SERVICE_ROLE_KEY` correctly omits the prefix. Variable names (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_REVENUECAT_API_KEY`, `EXPO_PUBLIC_APP_VARIANT`) are consistent throughout the document.
- **Impact**: None.
- **Fix**: None needed.

### I6 — File path consistency across document (PASS)
- **Source**: Full document
- **Finding**: Directory structure references are consistent:
  - `app/` for expo-router routes
  - `components/` with subfolders (ui/, layout/, onboarding/, auth/, profile/, settings/)
  - `lib/supabase/` for Supabase client
  - `lib/db/` for Drizzle schema
  - `hooks/` for custom hooks
  - `stores/` for Zustand stores
  - `types/` for TypeScript types
  - `constants/` for theme and enums
  - `utils/` for utilities
  - `assets/` for static assets
  No conflicting directory references detected.
- **Impact**: None.
- **Fix**: None needed.

### I7 — Drizzle migration strategy has a dual-path approach that may confuse (P3)
- **Source**: EP1 lines 303-305
- **Finding**: EP1 says "Define all tables in a Drizzle schema file at src/lib/db/schema.ts. Use drizzle-kit to generate SQL migration files. However, since Supabase manages the database, the actual table creation should be done via Supabase SQL editor or migration files applied through the Supabase CLI." This is slightly confusing — it describes both Drizzle-generated migrations AND Supabase CLI migrations. Claude Code might generate both sets.
- **Evidence**: The instruction says to create both a Drizzle schema AND a `supabase/migrations/` directory with SQL files.
- **Impact**: Low. Both approaches work, and having both provides type safety (Drizzle schema) + actual deployment (Supabase CLI). But Claude Code might not understand the dual-path without more explicit guidance.
- **Fix**: Add a clarifying sentence: "The Drizzle schema file provides TypeScript type safety for the app's data layer. The supabase/migrations/ SQL files are the deployment artifacts — generate them from the Drizzle schema using drizzle-kit generate."

### I8 — Missing expo-sqlite setup for local data tier (P2)
- **Source**: EP1 (entire document)
- **Finding**: TechArch describes a "Two-Tier Architecture: Expo SQLite (On-Device) + Supabase PostgreSQL (Cloud)" as "one of the most consequential architectural decisions." EP1 mentions SQLite only 3 times in passing references but never includes `expo-sqlite` in the dependency list (line 19-31) and never provides setup instructions for the local SQLite database layer.
- **Evidence**: EP1 line 23 installs `drizzle-orm` + `drizzle-kit` + `postgres` for Supabase, but no `expo-sqlite` or SQLite Drizzle driver. TechArch Section 1.3 explicitly calls out expo-sqlite v14 as a core technology.
- **Impact**: Medium. EP2 needs the local SQLite layer for offline product caching, skin analysis storage, and conflict result caching. Not having it set up in EP1 means EP2 must also handle the foundation work.
- **Fix**: Add `expo-sqlite` to the EP1 dependency list and add a brief setup section describing the local database initialization and Drizzle configuration for SQLite.

### I9 — Supabase Auth PKCE flow configuration is correct (PASS)
- **Source**: EP1 lines 362-366
- **Finding**: The Supabase client configuration correctly specifies: SecureStore for session persistence, autoRefreshToken, persistSession, detectSessionInUrl for OAuth callbacks, and flowType 'pkce'. This is the recommended configuration for mobile OAuth with Supabase.
- **Impact**: None.
- **Fix**: None needed.

### I10 — The delete-account Edge Function uses admin.deleteUser correctly (PASS)
- **Source**: EP1 lines 735-748
- **Finding**: The Edge Function correctly uses the service role key (not the anon key) and calls `supabase.auth.admin.deleteUser(userId)`. It also correctly describes cascading deletion order and storage cleanup. This would produce a working Edge Function.
- **Impact**: None.
- **Fix**: None needed.

### I11 — Missing `react-native-fast-tflite` from EP1 dependencies (PASS — intentional)
- **Source**: EP1 lines 19-31
- **Finding**: `react-native-fast-tflite` is NOT in the EP1 dependency list. This is correct — EP1 is Foundation, and TFLite is an EP2 concern. EP1 correctly only installs `react-native-purchases` as a "stub only" for payments setup.
- **Impact**: None. Correct scoping.
- **Fix**: None needed.

---

## Scorecard Table

| Check ID | Category | Description | Result | Severity |
|----------|----------|-------------|--------|----------|
| H1 | Hallucination | expo-router v4 version accuracy | PASS | - |
| H2 | Hallucination | postgres npm package description | WARN | P3 |
| H3 | Hallucination | All npm packages exist | PASS | - |
| H4 | Hallucination | skin_analyses in Supabase violates privacy arch | FAIL | P1 |
| H5 | Hallucination | Table names diverge from TechArch | FAIL | P1 |
| H6 | Hallucination | notification_preferences table vs JSONB column | WARN | P2 |
| H7 | Hallucination | ingredients text array vs JSONB type mismatch | WARN | P2 |
| W1 | Weighting | Balanced screen coverage | PASS | - |
| W2 | Weighting | ABSOLUTE RULE no-code-blocks enforced | PASS | - |
| W3 | Weighting | epCrossRef conciseness | PASS | - |
| W4 | Weighting | Scaffolding vs screen ratio | PASS | - |
| W5 | Weighting | Missing TanStack Query specification | WARN | P2 |
| E1 | Efficiency | Database schema section length | PASS | - |
| E2 | Efficiency | Theme system specification | PASS | - |
| E3 | Efficiency | Folder layout specification | PASS | - |
| E4 | Efficiency | Navigation structure detail | PASS | - |
| E5 | Efficiency | Edge Function delete-account | PASS | - |
| E6 | Efficiency | Integration wiring checklist | PASS | - |
| E7 | Efficiency | Overall document efficiency | PASS | - |
| I1 | Executability | Bare workflow template confusion | WARN | P2 |
| I2 | Executability | expo-router file-based routing | PASS | - |
| I3 | Executability | Supabase RLS descriptions | PASS | - |
| I4 | Executability | app.config.js configuration | PASS | - |
| I5 | Executability | Environment variable consistency | PASS | - |
| I6 | Executability | File path consistency | PASS | - |
| I7 | Executability | Drizzle migration dual-path | WARN | P3 |
| I8 | Executability | Missing expo-sqlite setup | WARN | P2 |
| I9 | Executability | Supabase Auth PKCE flow | PASS | - |
| I10 | Executability | delete-account Edge Function | PASS | - |
| I11 | Executability | TFLite deferred to EP2 | PASS | - |

---

## Summary Statistics

- **Total checks**: 26
- **PASS**: 18 (69%)
- **WARN**: 6 (23%)
- **FAIL**: 2 (8%)
- **P1 (Critical)**: 2 (H4 — skin_analyses privacy violation, H5 — table name divergence)
- **P2 (Medium)**: 5 (H6 — notif prefs architecture, H7 — ingredients type, W5 — missing TanStack Query, I1 — bare workflow confusion, I8 — missing expo-sqlite)
- **P3 (Low)**: 2 (H2 — postgres package description, I7 — migration dual-path)

### Root Cause Analysis

The two P1 issues share a root cause: **the AI model generating EP1 does not have the Technical Architecture document as direct input**. The EP1 builder receives only `allStepsSummary` (a compressed summary of Steps 1-5) and screen-specific data from Step 5. The detailed schema definitions in TechArch are generated in a parallel batch (Batch 1) and are NOT fed into the EP builders (Batch 2). This means the EP1 model independently invents table names and schema designs, which naturally diverge from TechArch's independently invented names.

### Recommended Pipeline Fix

To resolve the root cause, pass a schema summary extracted from the TechArch output into the EP builders. This could be:
1. A compact "TABLE MAP" appended to `epCrossRef` listing canonical table names and their tiers (Supabase vs SQLite)
2. Or feed the TechArch document's Section 3 into the EP builder prompts as a `CANONICAL SCHEMA` block

This would eliminate both P1 issues (H4 and H5) and likely prevent the P2 schema-related issues (H6, H7) as well.
