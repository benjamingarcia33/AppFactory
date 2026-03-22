# QA Audit Report: EP2 Core Features (GlowLog)

**Auditor:** Agent 9
**Date:** 2026-03-13
**Document:** `scripts/qa-output/architect/ep-2.md`
**Cross-references:** `scripts/qa-output/architect/ep-1.md`, `scripts/qa-output/architect/step-5.json`

---

## Check 1: ZERO Code Blocks

**Result: PASS**

Searched the entire EP2 document for triple backticks (` ``` `). Zero instances found. All technical instructions are written in prose format as required by the ABSOLUTE RULE no-code-blocks constraint.

---

## Check 2: State Management Matches EP1

**Result: PASS**

EP1 establishes the state management pattern as **React context providers** for global state (AuthContext, DatabaseContext, SyncContext, ThemeContext) with local component state via `useState` and `useReducer` for screen-level state. No third-party state management library (Zustand, Redux, MobX, Jotai, Recoil) is used.

EP2 follows this exactly:
- Line 40: "Use React context providers (already established in EP1) for global state: AuthContext, DatabaseContext, SyncContext, and ThemeContext. Each screen manages its own local state via useState and useReducer."
- Line 102: Routine Builder uses `useReducer` with typed action discriminated union
- Line 206: Daily Check-In Logger uses `useReducer` with typed action types
- Line 320: Barcode Scanner uses "Local component state" (useState)
- Line 441: Skin Timeline uses a custom hook `useSkinTimeline`

All consistent with EP1's established pattern.

---

## Check 3: Table Names Match EP1

**Result: FAIL**

Multiple field name and table name inconsistencies found between EP2 and EP1's schema definitions.

### Finding 3a: `completed_steps` vs `completed_step_ids` (P1)

EP1 defines the log_entries field as `completed_step_ids` (line 284):
> "**completed_step_ids** (JSON array of UUID strings -- which routine_steps were checked off)"

EP2 consistently refers to it as `completed_steps` instead:
- Line 122: "log_entries (which contain the daily check-in data including date, routine_id, condition_rating, and **completed_steps** JSON)"
- Line 173: "completed_steps (JSON array of objects, each containing step_id as UUID, product_id as nullable UUID, completed as boolean, and skipped_reason as nullable string)"
- Line 213: "Old log entries retain their original **completed_steps** JSON for historical accuracy"
- Line 406: "log_entries (condition_rating, log_date, routine_id, **completed_steps**)"

Furthermore, EP2 redefines the shape of this field. EP1 says it's a "JSON array of UUID strings" but EP2 line 173 redefines it as "JSON array of objects, each containing step_id as UUID, product_id as nullable UUID, completed as boolean, and skipped_reason as nullable string." This is a structural schema mismatch, not just a name change.

### Finding 3b: `barcode` vs `barcode_upc` (P2)

EP1 defines the products table field as `barcode` (line 270):
> "**barcode** (text, nullable, indexed for fast lookup)"

EP2 refers to it as `barcode_upc` in multiple places:
- Line 229: "barcode_upc (nullable string)"
- Line 297: "query the products table WHERE **barcode_upc** equals the scanned code"
- Line 299: "search the Algolia 'products' index with the barcode as the query and a filter on **barcode_upc**"

### Finding 3c: `schedule_type` vs `cycle_type` (P2)

EP1 defines the routines table field as `schedule_type` (line 242):
> "**schedule_type** (text, not null -- one of: 'daily', 'every_n_days', 'weekday_mask', 'alternating')"

EP2 refers to it as `cycle_type`:
- Line 60: "cycle_type (string enum: 'daily', 'every_n_days', 'specific_weekdays', 'alternating')"
- Line 122: "routines (to determine which days a routine was scheduled based on **cycle_type** and cycle_value)"

Additionally, the enum values diverge: EP1 uses `"weekday_mask"` while EP2 uses `"specific_weekdays"`.

### Finding 3d: `step_name`/`sort_order` vs `custom_label`/`step_order` in routine_steps (P2)

EP1 defines routine_steps with:
- `step_name` (text, not null) at line 256
- `sort_order` (integer, not null) at line 260

EP2 redefines the RoutineStep entity at line 62 with:
- `custom_label` (nullable string) instead of `step_name`
- `step_order` (integer, starts at 1) instead of `sort_order`

EP2 also omits several EP1 fields: `user_id`, `step_type`, and `duration_seconds`.

### Finding 3e: `date` vs `log_date` in log_entries (P2)

EP1 defines the field as `date` (line 282):
> "**date** (date/text in ISO format, not null -- the calendar date this log represents)"

EP2 refers to it as `log_date`:
- Line 173: "log_date (string, YYYY-MM-DD format, in the user's local timezone)"
- Line 212: "Enforce a unique constraint on (user_id, routine_id, **log_date**) in SQLite"

### Finding 3f: `ingredient_conflicts` vs `ingredient_conflicts_cache` (P2)

EP1 defines the table as `ingredient_conflicts_cache` (line 292). EP2 mostly uses the correct name (lines 82, 341, 361, 369) but the Edge Function specification at line 484 references a different table name:
> "Insert each result into the **ingredient_conflicts** table in Supabase PostgreSQL"

This drops the `_cache` suffix, which would cause a table-not-found error.

---

## Check 4: Core Features Relevant to Skincare Logging

**Result: PASS**

All seven screens are directly relevant to a skincare logging and routine tracking app:

1. **Routine Builder** (Screen 1) -- Create/edit skincare routines with product steps, scheduling, and ingredient compatibility warnings
2. **Routine Calendar & Streaks** (Screen 2) -- Visualize routine adherence via calendar heatmap with streak tracking
3. **Daily Check-In Logger** (Screen 3) -- Log routine completion, skin condition rating, journal notes, and progress photos
4. **Product Database & Search** (Screen 4) -- Browse/search skincare product catalog with Algolia
5. **Barcode Scanner** (Screen 5) -- Scan product barcodes to identify skincare products
6. **Product Detail & Ingredients** (Screen 6) -- View product details with AI-powered ingredient compatibility analysis
7. **Skin Timeline & Analytics** (Screen 7) -- Chart skin condition over time with AI correlation insights

All screens directly serve the core use case of skincare routine logging and tracking.

---

## Check 5: No Deprecated Model Names

**Result: PASS (with note)**

- No references to `GPT-4o` found
- No references to `SDK 51` found
- `expo-barcode-scanner` is mentioned once at line 281 but explicitly as **deprecated/not to be used**: "NOT the deprecated expo-barcode-scanner package which was removed in SDK 52"
- Claude model references use `claude-sonnet-4-5-20250929` (lines 478, 542) which is the correct model ID
- SDK 52 is correctly referenced (lines 7, 281)

**Note:** Line 311 references "GPT-5.4 Vision" -- this is a future/placeholder model name mentioned in the context of a v1.1 feature. It is not a deprecated model but a speculative future version. This is a minor concern (P3) since GPT-5.4 does not exist yet and the exact model name will need updating, but the EP explicitly defers this to v1.1 so no code is written against it.

---

## Check 6: No Duplicate Screens from EP1

**Result: PASS**

EP1 screens:
1. Welcome & Skin Profile Onboarding
2. Login
3. Today Dashboard
4. Settings & Preferences

EP2 screens:
1. Routine Builder
2. Routine Calendar & Streaks
3. Daily Check-In Logger
4. Product Database & Search
5. Barcode Scanner
6. Product Detail & Ingredients
7. Skin Timeline & Analytics

Zero overlap. EP2's preamble (line 7) explicitly acknowledges EP1's screens as already built: "the onboarding flow, Today Dashboard, Settings screen... are all already in place." EP2 screens reference EP1 screens for navigation (e.g., "navigates back to the Today Dashboard") but do not re-implement them.

---

## Summary

| Check | Result | Findings |
|-------|--------|----------|
| 1. Zero code blocks | PASS | No triple backticks found |
| 2. State management matches EP1 | PASS | React context + useState/useReducer throughout |
| 3. Table names match EP1 | **FAIL** | 6 field/table name inconsistencies (see 3a-3f) |
| 4. Core features relevant | PASS | All 7 screens directly serve skincare logging |
| 5. No deprecated models | PASS | Correct SDK 52, correct Claude model IDs |
| 6. No duplicate screens | PASS | Zero overlap with EP1's 4 screens |

### All Findings

| ID | Severity | Description |
|----|----------|-------------|
| 3a | **P1** | `completed_steps` in EP2 vs `completed_step_ids` in EP1 -- different field name AND structural schema mismatch (EP1: UUID array, EP2: object array with step_id/product_id/completed/skipped_reason) |
| 3b | P2 | `barcode_upc` in EP2 vs `barcode` in EP1 products table |
| 3c | P2 | `cycle_type` in EP2 vs `schedule_type` in EP1 routines table; also enum value mismatch (`specific_weekdays` vs `weekday_mask`) |
| 3d | P2 | EP2 routine_steps uses `custom_label`/`step_order` vs EP1's `step_name`/`sort_order`; EP2 also omits `user_id`, `step_type`, `duration_seconds` |
| 3e | P2 | `log_date` in EP2 vs `date` in EP1 log_entries table |
| 3f | P2 | Edge Function spec at line 484 references `ingredient_conflicts` table instead of `ingredient_conflicts_cache` |
| 5-note | P3 | "GPT-5.4 Vision" is a speculative future model name (line 311); will need updating when v1.1 is built |

### Critical Issues (P1): 1
### Moderate Issues (P2): 5
### Minor Issues (P3): 1
