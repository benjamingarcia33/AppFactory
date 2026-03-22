# Cross-Document Consistency Audit: GlowLog

**Auditor:** Agent 11 (Consistency)
**Date:** 2026-03-13
**Scope:** All structured steps (2-5) + all generated documents (PRD, VS, TechArch, EP1-3)

---

## 1. Pricing Consistency

### Source of Truth: Step 2 (`step-2.json` — `revenueModel.tiers`)

| Tier | Price |
|------|-------|
| GlowLog Core (Free) | $0 forever |
| GlowLog Pro | $9.99 one-time |
| GlowLog Plus | $4.99/month or $34.99/year |

### Cross-Document Check

| Document | GlowLog Core | GlowLog Pro | GlowLog Plus | Verdict |
|----------|-------------|-------------|--------------|---------|
| **Step 2** | $0 forever | $9.99 one-time | $4.99/month or $34.99/year | SOURCE |
| **VS (doc-strategic_analysis.md)** | "Free forever" | "$9.99 one-time" | "$4.99/month" (annual $34.99 in projectedArpu) | PASS |
| **PRD (doc-app_prd.md)** | "Free, forever" | "$9.99 one-time purchase" | "$4.99/month or $34.99/year" | PASS |
| **TechArch** | N/A (no pricing listed) | References RevenueCat for IAP | N/A | PASS (n/a) |
| **EP1** | References "GlowLog Pro at $9.99" (line 761) | "$9.99 one-time non-consumable" | "$4.99/month" (deferred) | PASS |
| **EP2** | N/A (no paywall on EP2 screens) | N/A | N/A | PASS (n/a) |
| **EP3** | "3 per day" free ingredient checks | "$9.99" one-time purchase | N/A (deferred) | **SEE NOTE 1** |

**Note 1 (P2 — Moderate): EP3 Paywall Free Tier Ingredient Check Limit Inconsistency.**
- EP3 paywall comparison table states free tier gets "3 per day" ingredient checks (line 74).
- EP2 Edge Function spec states free tier rate limit is 20 checks/day (line 470-471).
- Step 4 states "20 ingredient checks/day free, 100/day Pro" (tech stack backend description).
- TechArch states "20 ingredient checks/day for free tier, 100/day for Pro" (line 308).
- PRD states "Free tier cap: unlimited product logging" and later "GlowLog Pro: 100 ingredient compatibility checks per day" (line 1049) — implying free tier has some limit but not specifying 3 vs 20.
- **Verdict: EP3 paywall screen says "3 per day" while all other documents say "20 per day."** This is a display-layer inconsistency that would confuse users if built as-written.

**Note 2 (P3 — Minor): VS ARPU discrepancy.**
- Step 2 projected ARPU: "$7.50/month blended"
- VS projected ARPU: "$8.20 blended" and unit economics show "$11.20"
- These are different calculated values but refer to slightly different things (Step 2 includes amortized one-time, VS recalculates with different split assumptions). Minor drift but not a hard contradiction since the underlying prices are consistent.

### Pricing Consistency Summary: **PASS with 1 P2 issue**

---

## 2. Timeline Consistency

### Source of Truth: Step 4 (`step-4.json` — `mvpScope.timeline` + `twelveWeekPlan`)

Step 4 specifies:
- **Total: 16 weeks** ("Weeks 1-3 foundation and data layer, Weeks 4-6 core routine and logging UI, Weeks 7-9 ingredient engine and product database, Weeks 10-11 analytics and monetization, Weeks 12-13 polish and offline hardening, Weeks 14-15 TestFlight beta, Week 16 App Store submission")
- The `twelveWeekPlan` array has 6 entries covering Weeks 1-12, while the `mvpScope.timeline` text covers all 16 weeks.

### Cross-Document Check

| Document | Timeline Referenced | Verdict |
|----------|-------------------|---------|
| **Step 4** | 16 weeks total, detailed week-by-week breakdown | SOURCE |
| **VS (doc-strategic_analysis.md)** | 4 phases: Phase 1 (3 weeks), Phase 2 (6 weeks), Phase 3 (4 weeks), Phase 4 (3 weeks) = **16 weeks total** | PASS |
| **PRD** | No explicit timeline mentioned in the PRD (by design — PRD is "what to build, not how") | PASS (n/a) |
| **TechArch** | References "Weeks 14-15 beta testing" (line 361) and the 16-week timeline indirectly | PASS |
| **EP1** | No explicit total timeline; covers foundation work | PASS (n/a) |
| **EP2** | No explicit total timeline; covers core features | PASS (n/a) |
| **EP3** | No explicit total timeline; covers polish + launch | PASS (n/a) |

**Phase Duration Cross-Check (Step 4 vs VS):**

| Phase | Step 4 | VS | Match? |
|-------|--------|-----|--------|
| Foundation & Data Layer | Weeks 1-3 (3 weeks) | Phase 1: 3 weeks | PASS |
| Core Routine & Logging | Weeks 4-6 (3 weeks for routine) + Weeks 3-4 (2 weeks for schedule) | Phase 2: 6 weeks | **SEE NOTE 3** |
| Ingredient Engine + Analytics + Monetization | Weeks 7-9 (ingredient) + Weeks 10-11 (analytics/monetization) = 5 weeks | Phase 3: 4 weeks | **SEE NOTE 3** |
| Polish, Beta, Launch | Weeks 12-15 (4 weeks) + Week 16 | Phase 4: 3 weeks | **SEE NOTE 3** |

**Note 3 (P2 — Moderate): Step 4 twelve-week plan vs. 16-week timeline mismatch.**
- Step 4's `twelveWeekPlan` array only covers Weeks 1-12 (6 entries of 2-week blocks), but the `mvpScope.timeline` text describes a **16-week** plan including TestFlight (Weeks 14-15) and launch (Week 16).
- The VS maps the same work to 4 phases totaling 3+6+4+3 = 16 weeks, which aligns with the high-level `mvpScope.timeline`.
- The breakdown slightly differs in how weeks are allocated to phases, but total duration is consistent at 16 weeks across Step 4 and VS.

### Timeline Consistency Summary: **PASS with 1 P2 note (internal Step 4 inconsistency between 12-week plan array and 16-week timeline text)**

---

## 3. Technology Version Consistency

### Source of Truth: Steps 3-5 + CURRENT_TECH_VERSIONS

Key technologies to track:

| Technology | Expected Version |
|-----------|-----------------|
| Expo SDK | 52 |
| React Native | 0.76+ |
| Expo Router | v4 |
| Claude (text AI) | Claude 4.5 Sonnet / Claude 4.6 Opus |
| GPT (vision AI) | GPT-5.4 Vision |
| Supabase JS | v2 |
| RevenueCat SDK | 8+ |
| Drizzle ORM | (latest) |
| NativeWind | v4 |
| TanStack Query | v5 |
| Inngest | v3 |
| Trigger.dev | v3 |
| Algolia | v4 |

### Cross-Document Check

| Technology | Step 3 | Step 4 | Step 5 | TechArch | EP1 | EP2 | EP3 | Verdict |
|-----------|--------|--------|--------|----------|-----|-----|-----|---------|
| Expo SDK | SDK 52 | SDK 52 | SDK 52 | SDK 52 | SDK 52 | SDK 52 | SDK 52 | PASS |
| React Native | 0.76+ | 0.76+ | -- | 0.76+ | 0.76+ | -- | 0.76+ | PASS |
| Expo Router | v4 | v4 | -- | v4 | v4 | v4 | v4 | PASS |
| Claude model | "claude-api" slug | "Claude 4.5 Sonnet" | "claude-api" slug | "Claude 4.5 Sonnet" | -- | "claude-sonnet-4-5-20250929" | -- | PASS |
| GPT vision | "gpt5-vision" slug | "GPT-5.4 Vision" | "gpt5-vision" slug | "GPT-5.4 Vision" | -- | -- | "GPT-5.4 Vision" | PASS |
| RevenueCat | -- | SDK 8+ | SDK 8+ | SDK 8+ | SDK 8+ | -- | SDK 8+ | PASS |
| Drizzle ORM | Mentioned | Mentioned | Mentioned | Mentioned | Mentioned | Mentioned | -- | PASS |
| NativeWind | -- | v4 | -- | v4 | v4 | -- | -- | PASS |
| Inngest | -- | v3 | v3 | v3 | -- | v3 | v3 | PASS |
| Trigger.dev | -- | -- | v3 | v3 | -- | -- | v3 | PASS |
| Algolia | -- | -- | v4 | v4 | -- | v4 | -- | PASS |
| Supabase JS | v2 | v2 | -- | v2 | v2 | -- | -- | PASS |

**No GPT-4o references found.** All AI text references use Claude (Anthropic), not OpenAI for text. Vision uses GPT-5.4 consistently.

**No SDK 51 references found.** All documents consistently reference SDK 52.

**Claude model ID check:**
- EP2 Edge Function spec (line 478) references model ID `"claude-sonnet-4-5-20250929"` for the ingredient compatibility function.
- TechArch refers to "Claude 4.5 Sonnet" and "Claude 4.6 Opus" consistently.
- Step 3 and Step 5 use the slug "claude-api" which is the app's internal identifier, not a model version conflict.

### Technology Version Consistency Summary: **PASS - No inconsistencies found**

---

## 4. Table Name Consistency

### Source of Truth: TechArch (`doc-technical_architecture.md` Section 3)

Canonical table names from TechArch:
1. `user_profiles` (extends auth.users)
2. `routines`
3. `routine_steps`
4. `products`
5. `log_entries`
6. `progress_photos`
7. `journal_milestones`
8. `ingredient_overrides`
9. `ai_reports`
10. `sync_queue` (SQLite only)

### Cross-Document Check

| Table | TechArch | EP1 | EP2 | EP3 | Verdict |
|-------|----------|-----|-----|-----|---------|
| User profile table | `user_profiles` | `users_profile` | -- | `user_profiles` / `user_preferences` | **FAIL - P1** |
| Routines | `routines` | `routines` | `routines` | `routines` | PASS |
| Routine steps | `routine_steps` | `routine_steps` | `routine_steps` | -- | PASS |
| Products | `products` | `products` | `products` | `products` | PASS |
| Log entries | `log_entries` | `log_entries` | `log_entries` | `log_entries` | PASS |
| Progress photos | `progress_photos` | -- | `progress_photos` | `progress_photos` | PASS |
| Journal milestones | `journal_milestones` | -- | -- | -- | PASS (EP-irrelevant) |
| Ingredient overrides | `ingredient_overrides` | -- | `user_overrides` | -- | **FAIL - P1** |
| AI reports | `ai_reports` | -- | `correlation_reports` | `correlation_reports` | **FAIL - P1** |
| Sync queue | `sync_queue` | `sync_queue` | `sync_queue` | `sync_queue` | PASS |
| Ingredient cache | `ingredient_conflicts_cache` (not in TechArch canonical list) | `ingredient_conflicts_cache` | `ingredient_conflicts_cache` | -- | PASS (consistent in EPs) |
| Notifications | -- | -- | -- | `notifications` (local only) | PASS (EP3-only) |
| Community submissions | -- | -- | -- | `community_submissions` | PASS (EP3-only) |

**FINDING T4-1 (P1 - Critical): User profile table name inconsistency.**
- TechArch: `user_profiles`
- EP1: `users_profile` (singular possessive — different name)
- EP3: Uses both `user_profiles` AND `user_preferences` interchangeably
- A developer following EP1 would create `users_profile`, but EP3 and TechArch reference `user_profiles`. These are different table names that would cause runtime errors.

**FINDING T4-2 (P1 - Critical): Ingredient overrides table name inconsistency.**
- TechArch: `ingredient_overrides`
- EP2: `user_overrides`
- These refer to the same concept (dismissed ingredient warnings) but use different table names.

**FINDING T4-3 (P1 - Critical): AI reports table name inconsistency.**
- TechArch: `ai_reports` (with fields: report_type enum including correlation/trigger/derm-report)
- EP2: `correlation_reports` (separate table name with different field structure)
- EP3: Also uses `correlation_reports`
- TechArch designed a generalized `ai_reports` table, but both EPs created a more specific `correlation_reports` table. A developer following TechArch would create `ai_reports`, but EP code would reference `correlation_reports`.

### Table Name Consistency Summary: **FAIL - 3 P1 issues**

---

## 5. State Management Consistency

### Source of Truth: EP1 (establishes the architecture)

EP1 establishes the following state management approach:
- **Zustand** for client UI state (sync queue status, user preferences, navigation customization) — referenced in TechArch line 22-23
- **TanStack Query v5 (React Query)** for server state — referenced in TechArch line 24-25
- **React Context providers** for global state (AuthContext, DatabaseContext, SyncContext, ThemeContext) — EP1 line 79-80, EP2 line 40
- **useReducer** for complex form state — EP1 line 458, EP2 lines 102, 206
- **Custom hooks** (useTodayDashboard, useSettings, etc.) wrapping SQLite queries — EP1 lines 556-565

### Cross-Document Check

| Document | State Management Approach | Consistent? |
|----------|--------------------------|-------------|
| **TechArch** | Zustand for client state, TanStack Query v5 for server state | PASS (source) |
| **EP1** | React Context providers + useReducer for forms + custom hooks for SQLite + mentions "React Query with SQLite as the source" (line 560) | PASS |
| **EP2** | "React context providers (already established in EP1) for global state: AuthContext, DatabaseContext, SyncContext, and ThemeContext" (line 40) + useReducer for forms + custom hooks | PASS |
| **EP3** | "React context or Zustand store" for photo gallery state (line 159) + custom hooks | PASS |

**Note:** EP1 does not explicitly mention Zustand by name in its screen architectures (it relies on React Context + custom hooks), but the TechArch defines the Zustand role clearly, and EP3 references Zustand as an option. There is no contradiction — no EP uses a conflicting library like Redux or MobX.

### State Management Consistency Summary: **PASS - All documents use the same approach (Zustand + React Context + React Query + useReducer)**

---

## Summary of Findings

### P1 (Critical) - 3 issues

| ID | Category | Description |
|----|----------|-------------|
| T4-1 | Table Names | User profile table named `user_profiles` in TechArch, `users_profile` in EP1, and `user_preferences` also used in EP3. Must be unified to one name. |
| T4-2 | Table Names | Ingredient override table named `ingredient_overrides` in TechArch but `user_overrides` in EP2. |
| T4-3 | Table Names | AI reports table named `ai_reports` in TechArch but `correlation_reports` in EP2 and EP3. |

### P2 (Moderate) - 2 issues

| ID | Category | Description |
|----|----------|-------------|
| P1-1 | Pricing | EP3 paywall screen shows free tier gets "3 per day" ingredient checks; all other documents specify 20/day free, 100/day Pro. |
| T2-1 | Timeline | Step 4 internally inconsistent: `twelveWeekPlan` array covers 12 weeks but `mvpScope.timeline` describes 16 weeks. Total timeline of 16 weeks is consistent across Step 4 and VS at the summary level. |

### P3 (Minor) - 1 issue

| ID | Category | Description |
|----|----------|-------------|
| P1-2 | Pricing | VS blended ARPU ($8.20) differs from Step 2 blended ARPU ($7.50) due to different split assumptions. Not a hard pricing inconsistency. |

### Checks Passed

| Check | Result |
|-------|--------|
| Core pricing ($9.99 Pro / $4.99 Plus / Free Core) | PASS across all documents |
| Timeline total (16 weeks) | PASS across Step 4 and VS |
| Technology versions (SDK 52, RN 0.76+, Claude 4.5 Sonnet, etc.) | PASS - fully consistent |
| No GPT-4o / SDK 51 contamination | PASS - clean |
| State management (Zustand + Context + React Query) | PASS across all EPs |

---

## Recommendations

1. **Unify table names immediately.** Pick one canonical name for each table and update all EP references:
   - `user_profiles` (not `users_profile` or `user_preferences`)
   - `ingredient_overrides` (not `user_overrides`)
   - Decide between `ai_reports` (TechArch's generalized design) or `correlation_reports` (EPs' specific design) and update all references

2. **Fix EP3 paywall ingredient check limit.** Change "3 per day" to "20 per day" to match the rate limiting spec in EP2 Edge Function, Step 4, and TechArch.

3. **Reconcile Step 4's internal timeline.** Either expand `twelveWeekPlan` to cover all 16 weeks or rename it to reflect it only covers the development phase (Weeks 1-12), with Weeks 13-16 covered by `mvpScope.timeline`.
