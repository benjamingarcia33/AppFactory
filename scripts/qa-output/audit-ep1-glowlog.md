# QA Audit: EP1 Foundation — GlowLog

**Auditor:** Agent 8
**Date:** 2026-03-13
**Files Reviewed:**
- `scripts/qa-output/architect/ep-1.md`
- `scripts/qa-output/architect/step-5.json`
- `scripts/qa-output/architect/doc-technical_architecture.md`

---

## Check 1: ZERO Code Blocks

**Result: PASS**

Searched for all instances of triple backticks (```) in `ep-1.md`. Zero matches found. The entire document uses structural prose format with bold text for inline code references (e.g., `**npx create-expo-app@latest glowlog --template tabs**`) rather than fenced code blocks. This is consistent with the P1 fix from the GlowStack audit (A1: ABSOLUTE RULE no-code-blocks).

---

## Check 2: Prose Format

**Result: PASS**

The EP uses structural prose format throughout. Content is organized under hierarchical Markdown headers (## and ###), with instructions written as narrative paragraphs and descriptive bullet lists. Examples:

> "Run **npx create-expo-app@latest glowlog --template tabs** in the terminal. Then **cd glowlog** to enter the project directory." (line 9)

> "Install packages in logical groups. Use **npx expo install** for any package that has Expo-specific version constraints, and **npm install** for everything else." (line 13)

No code snippets, no shell command blocks, no TypeScript/JavaScript source code blocks appear anywhere. Inline commands are bolded, not fenced.

---

## Check 3: Auth Instructions Present

**Result: PASS**

Authentication setup instructions are thorough and present across multiple sections:

- **Supabase client initialization** (Step 5, lines 205-210): Describes creating the Supabase client with `expo-secure-store` as custom storage adapter for encrypted JWT persistence. Specifies `auth.autoRefreshToken: true`, `auth.persistSession: true`, `auth.detectSessionInUrl: false`.
- **AuthProvider** (line 116): `lib/auth/provider.tsx` described as managing session state, listening to `onAuthStateChange`, handling offline session from SecureStore.
- **Apple Sign-In** (lines 452-453): `supabase.auth.signInWithIdToken` for Apple, `supabase.auth.signUp` for email.
- **Login screen** (lines 471-504): Full auth flow including Apple Sign-In, email/password, offline cached session, and edge cases (rate limiting, session expiry, credential revocation).
- **Onboarding** (lines 426-468): Auth creation during onboarding Step 4 with Apple Sign-In and email options.
- **RLS policies** (lines 329-341): Comprehensive RLS definitions for all tables.

---

## Check 4: DB Schema Instructions Present

**Result: PASS**

Database schema is comprehensively defined in Step 6 (lines 212-326). All tables are defined with complete field specifications:

- **users_profile**: 16 fields defined including id, display_name, skin_type, skin_concerns, routine_preference, onboarding_completed, tier, push_token, nav_shortcuts, theme_preference, ai_photo_opt_in, ai_journal_opt_in, notification times, created_at, updated_at (lines 218-235)
- **routines**: 12 fields (lines 237-249)
- **routine_steps**: 11 fields (lines 251-262)
- **products**: 12 fields (lines 264-276)
- **log_entries**: 12 fields (lines 278-290)
- **ingredient_conflicts_cache**: 10 fields (lines 292-302)
- **sync_queue**: 8 fields, SQLite only (lines 304-313)

Indexes (line 319), composite unique constraints (line 325), SQLite-specific type mappings (lines 315-317), and PostgreSQL-specific types (lines 322-323) are all specified.

---

## Check 5: Navigation Instructions Present

**Result: PASS**

Navigation structure is thoroughly defined in the "Navigation Structure" section (lines 389-407):

- **Root Stack** (`_layout.tsx`): Conditional rendering of (auth) or (tabs) groups based on session state.
- **Auth Stack** (`(auth)/_layout.tsx`): Stack with welcome, login, signup, forgot-password screens.
- **Tabs Navigator** (`(tabs)/_layout.tsx`): 5-tab bottom bar: Today, Routines, Products, Timeline, Settings.
- **Customizable tab bar**: Reads `nav_shortcuts` from user profile for reorder. Haptic feedback, badge counts.
- **Modal Stack**: Onboarding steps, quick condition rating, upgrade prompts.
- **File-based routing** (lines 78-91): Complete directory tree under `app/` with all routes specified.

---

## Check 6: State Management Defined

**Result: FAIL (P2)**

EP1 does **not** specify a single, unified state management approach. The Technical Architecture document clearly specifies **Zustand** for client UI state and **TanStack Query v5** for server state (TechArch lines 21-25):

> "**Zustand** — Lightweight client state management for UI state, sync queue status, and user preferences."
> "**TanStack Query v5 (React Query)** — Server state management for all Supabase and Algolia data fetching."

However, EP1 never mentions Zustand at all (zero occurrences). Instead, EP1 describes state management via:
- Per-screen custom hooks (`useOnboarding`, `useTodayDashboard`, `useSettings`) with local component state and direct SQLite queries
- React Context for `AuthProvider` (line 116), `ToastProvider` (line 385)
- One passing mention of "React Query" on line 560: "use a simple event emitter or React Query with SQLite as the source"

The omission of Zustand and the vague "React Query" mention creates ambiguity. A developer following EP1 alone would implement local hooks with `useState`/`useReducer` and React Context, which contradicts the TechArch specification. Neither Zustand nor TanStack Query appear in the dependency install list (Step 2, lines 12-72).

**Evidence:**
- "Zustand" appears 0 times in EP1
- "TanStack" appears 0 times in EP1
- Neither `zustand` nor `@tanstack/react-query` are in the npm install instructions
- TechArch lines 21-25 explicitly mandate both

---

## Check 7: Table Names Match TechArch

**Result: FAIL (P2)**

There are table name discrepancies between EP1 and the Technical Architecture document:

**EP1 defines these tables:**
- `users_profile`
- `routines`
- `routine_steps`
- `products`
- `log_entries`
- `ingredient_conflicts_cache`
- `sync_queue`

**TechArch defines these tables:**
- `user_profiles` (note: plural, differs from EP1's `users_profile`)
- `routines`
- `routine_steps`
- `products`
- `log_entries`
- `progress_photos` (not in EP1 schema)
- `journal_milestones` (not in EP1 schema)
- `ingredient_overrides` (not in EP1 schema)
- `ai_reports` (not in EP1 schema)
- `sync_queue`

**Discrepancy 1 — Profile table naming:** EP1 uses `users_profile` (singular "user", lines 218, 331, 436, etc.) while TechArch uses `user_profiles` (plural, lines 162, 292, 295, 303). This is inconsistent and will cause schema conflicts.

**Discrepancy 2 — Missing tables in EP1:** Four tables defined in TechArch (`progress_photos`, `journal_milestones`, `ingredient_overrides`, `ai_reports`) are absent from EP1's schema. While some of these might be intended for EP2/EP3, `progress_photos` is referenced in EP1's Storage Setup (line 347) and `ingredient_overrides` is part of the core compatibility engine architecture. The migration statement on line 783 lists only the EP1 tables, meaning these tables won't exist when EP2/EP3 features need them.

**Discrepancy 3 — Missing table in TechArch:** EP1 defines `ingredient_conflicts_cache` (lines 292-302) which does not appear in TechArch. TechArch has `ingredient_overrides` instead, which serves a different purpose (user overrides vs. cached AI results).

**Evidence:**
- EP1 line 218: `**users_profile** table`
- TechArch line 292: `updates the **user_profiles**.tier field`
- TechArch line 176: `**progress_photos**` — absent from EP1 schema
- EP1 line 783: migration list includes `users_profile` not `user_profiles`

---

## Check 8: CURRENT_TECH_VERSIONS Respected

**Result: PASS**

No deprecated or outdated technology references found:

- **SDK version**: EP1 line 9 correctly specifies "Expo SDK 52 project with React Native 0.76+"
- **No GPT-4o**: Zero occurrences. The only AI SDK mention is `@anthropic-ai/sdk` and `openai` as dev dependencies (lines 66-67)
- **No SDK 51**: Zero occurrences. Only SDK 52 is referenced.
- **No expo-barcode-scanner**: Zero occurrences. EP1 does not mention barcode scanning (deferred to EP2). Step 5 (step-5.json line 287) correctly notes "NOT expo-barcode-scanner which is removed"
- **Supabase JS v2**: Correctly specified (line 41)
- **RevenueCat SDK 8+**: Correctly specified (line 46)
- **Expo Router v4**: Correctly specified (line 16)
- **Claude 4.5 Sonnet**: Referenced in Edge Function stubs (line 357) — correct model name

---

## Summary

| Check | Result | Severity |
|-------|--------|----------|
| 1. Zero code blocks | PASS | — |
| 2. Prose format | PASS | — |
| 3. Auth instructions present | PASS | — |
| 4. DB schema instructions present | PASS | — |
| 5. Navigation instructions present | PASS | — |
| 6. State management defined | FAIL | P2 |
| 7. Table names match TechArch | FAIL | P2 |
| 8. CURRENT_TECH_VERSIONS respected | PASS | — |

**Total: 6 PASS, 2 FAIL (0 P1, 2 P2, 0 P3)**

### P2 Issues Requiring Resolution

**P2-1: Missing Zustand and TanStack Query in EP1.** The Technical Architecture mandates Zustand for client state and TanStack Query for server state, but EP1 omits both from its dependency list and state management descriptions. EP1 should add `zustand` and `@tanstack/react-query` to the install instructions and describe how the per-screen hooks integrate with Zustand stores rather than relying on local component state and React Context alone.

**P2-2: Table name mismatch and missing tables between EP1 and TechArch.** The profile table is named `users_profile` in EP1 but `user_profiles` in TechArch. Four tables from TechArch (`progress_photos`, `journal_milestones`, `ingredient_overrides`, `ai_reports`) are absent from EP1's schema definition. The naming should be reconciled and EP1's migration should at minimum create placeholder tables for entities referenced in its own Storage Setup and Edge Function descriptions.
