

# GlowLog — Execution Prompt 3 of 3: Polish, Payments, and Production Readiness

---

## Preamble and Context

This is the third and final execution prompt for GlowLog. Prompts 1 and 2 have already established the complete foundation: Supabase Auth with Apple Sign-In and email/password, the full PostgreSQL schema (users, products, routines, routine_steps, routine_completions, skin_logs, progress_photos — all with RLS), Expo Router v4 tab navigation, the product shelf with barcode scanning via expo-camera, the routine builder with drag-and-drop, the home dashboard, skin log entry, and all core Edge Functions. Everything described below builds on top of that existing codebase. Do not recreate or modify any EP1/EP2 tables, navigation structures, or core logic unless explicitly stated.

---

## Pre-Build Verification Protocol

Before writing any new files, execute these verification steps in order:

**Step 1 — Environment Variable Audit.** Check that the following keys are present and non-empty in the project's environment configuration: REVENUECAT_API_KEY (for both iOS and Android if applicable), SENTRY_DSN, POSTHOG_API_KEY, POSTHOG_HOST, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY. These are in addition to all EP1/EP2 variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY). If any are missing, add placeholder values with clear TODO comments and log a warning at app startup.

**Step 2 — TypeScript Compilation Check.** Run the TypeScript compiler in no-emit mode across the entire project. Every EP1 and EP2 file must compile cleanly before any EP3 work begins. If there are type errors, resolve them first — they indicate broken foundations that will cascade into EP3 screens.

**Step 3 — Screen Inventory.** Confirm that the following screens from EP1 and EP2 exist and render without crashes: Welcome/Onboarding, Login, Home Dashboard, Product Shelf, Add Product, Product Detail, Routine Builder, Routine Execution, Skin Log Entry, Profile/Settings. If any screen is missing or broken, note it and fix it before proceeding.

**Step 4 — RevenueCat Dashboard Configuration.** The RevenueCat dashboard must have a project created with the correct bundle identifier (com.glowlog.app). Two products must be configured in App Store Connect and synced to RevenueCat: a monthly subscription (glowlog_pro_monthly at $5.99/month) and an annual subscription (glowlog_pro_annual at $47.99/year, which represents a 33% savings). These must be grouped into a single Offering called "default" with both packages available. An entitlement called "pro" must be created and linked to both products. Without this dashboard configuration, the paywall screen cannot function.

**Step 5 — Sentry and PostHog Initialization.** Confirm that Sentry and PostHog SDKs are initialized at app startup (this should have been done in EP1). If not, add them now. Sentry should be configured in app.config via the Sentry Expo plugin, and PostHog should be initialized in the root layout with the project API key. Link them by passing the Sentry trace ID as a PostHog super property so that crash reports can be cross-referenced with user sessions.

---

## New Database Objects Required for EP3

EP3 introduces two new database requirements. These must be created via Drizzle ORM migration, following the exact same patterns established in EP1.

### Notifications Table

Create a new table called **notifications** with the following fields: **id** as UUID primary key with default generation, **user_id** as UUID referencing auth.users and not nullable, **type** as text not nullable (one of: "routine_reminder", "streak_milestone", "skin_story_ready", "system"), **title** as text not nullable, **body** as text not nullable, **data** as jsonb nullable (stores navigation target info like screen name and entity ID), **read** as boolean defaulting to false, **created_at** as timestamp with timezone defaulting to now. Add an index on user_id and created_at descending for efficient chronological queries. Add an index on user_id and read for unread count queries.

**RLS Policy:** Enable RLS. Create a SELECT policy allowing users to read only their own notifications where user_id equals auth.uid(). Create an UPDATE policy allowing users to update only the "read" field on their own notifications. INSERT should be restricted to service role only (Edge Functions create notifications, not the client). DELETE policy allows users to delete their own notifications.

### Skin Story Cache Table

Create a new table called **skin_stories** with the following fields: **id** as UUID primary key with default generation, **user_id** as UUID referencing auth.users and not nullable, **period_start** as date not nullable, **period_end** as date not nullable, **period_type** as text not nullable (one of: "weekly", "monthly"), **narrative** as text not nullable (the Claude-generated insight text), **metrics** as jsonb not nullable (stores computed metrics like average skin scores, completion rates, top products), **generated_at** as timestamp with timezone defaulting to now. Add a unique constraint on the combination of user_id, period_start, and period_type to prevent duplicate stories for the same period. Add an index on user_id and generated_at descending.

**RLS Policy:** Enable RLS. SELECT policy for users to read their own stories. INSERT and UPDATE restricted to service role (Inngest background job writes these via Edge Function). No client-side writes.

After defining these in the Drizzle schema file alongside the existing EP1 tables, run the migration generation and push commands to sync with the Supabase database.

---

## Subscription State Architecture

Before building individual screens, establish the subscription management layer that multiple screens will depend on.

### RevenueCat Initialization

In the app's root layout component (the one that wraps all tabs), initialize RevenueCat immediately after the auth state is confirmed. Use the RevenueCat API key from environment variables. Once a user is authenticated, call the RevenueCat identify method with the Supabase auth user ID so that RevenueCat's customer record is linked to your database user. This must happen on every app launch after login.

### Subscription State Hook

Create a custom React hook called **useSubscription** (place it in the shared hooks directory). This hook should:

- On mount, call RevenueCat's getCustomerInfo method to fetch the current entitlement state.
- Check whether the "pro" entitlement is active in the customer info response.
- Expose three values: **isPro** (boolean), **isLoading** (boolean while fetching), and **currentPlan** (either "monthly", "annual", or null).
- Cache the result in React state so that repeated calls within the same session do not re-fetch from RevenueCat.
- Listen for RevenueCat's customer info update listener to react to purchases or cancellations in real time.
- As a fallback, if RevenueCat is unreachable, check the Supabase user metadata for a cached subscription status with a 48-hour validity window. This prevents users from being locked out of paid features during RevenueCat outages.

### Subscription Webhook Edge Function

Create a new Supabase Edge Function called **revenuecat-webhook**. This function receives POST requests from RevenueCat's webhook system whenever a subscription event occurs (initial purchase, renewal, cancellation, billing issue, expiration). The function should:

- Verify the webhook authenticity using RevenueCat's webhook authorization header.
- Extract the user ID (which is the Supabase auth user ID, since we used it during identify) and the event type.
- For purchase and renewal events: update the Supabase auth user metadata to set subscription_status to "pro", subscription_plan to the product identifier, and subscription_updated_at to the current timestamp.
- For cancellation and expiration events: update subscription_status to "free" and clear subscription_plan.
- Use the Supabase service role client to perform the admin-level user metadata update.

Configure this webhook URL in the RevenueCat dashboard under Integrations → Webhooks.

### Feature Gate Helper

Create a utility function called **requirePro** that accepts the navigation object and the subscription state. If the user is not Pro, it navigates them to the paywall screen (passing the feature name that triggered the gate as a route parameter so the paywall can display context-aware messaging). If the user is Pro, it does nothing (allows the calling code to proceed). This function will be used by several screens to gate Pro-only actions.

---

## Screen 1: Skin Story Dashboard

**Purpose**

This is the crown jewel of the Pro subscription — an AI-powered insights screen that correlates the user's skin log data with their routine adherence and product usage to surface meaningful patterns. It answers the question every skincare enthusiast asks: "Is what I'm doing actually working?" Free users see a simplified version with basic stats to demonstrate value, plus a tasteful upgrade prompt for the full AI narrative.

**Data Model**

This screen reads from four existing tables (skin_logs, routine_completions, routines, products) and the new skin_stories table. The metrics displayed are computed values: average skin scores over the selected period (derived from skin_logs.overall_score, hydration, oiliness, irritation, acne fields), routine completion rate (count of routine_completions versus expected completions based on routine recurrence rules), and product usage frequency (derived from routine_completions joined with routine_steps joined with products). The Claude-generated narrative is stored in skin_stories.narrative and the computed metrics in skin_stories.metrics as jsonb.

**User Interactions**

- The screen loads with the most recent weekly period by default.
- A period selector at the top allows toggling between "This Week" and "This Month" (and navigating to previous periods with left/right arrows).
- The greeting header reads "Good morning/afternoon/evening, [display name]" based on the user's local time and the display_name field from the users table.
- Metric cards are displayed in a horizontal scrollable row: Skin Score Trend (average score with up/down arrow showing change from previous period), Streak (current consecutive days of routine completion), Completion Rate (percentage), and Top Product (most frequently used product this period).
- Each metric card uses a distinct icon and subtle color coding — green for improving trends, amber for flat, red for declining.
- Below the metrics, the AI narrative section displays the Claude-generated insight text. This is a rich paragraph (2-4 sentences) that reads naturally, for example: "Your skin hydration improved by 15% this week, coinciding with consistent evening moisturizer use. The two days you skipped your PM routine showed a slight uptick in oiliness. Consider maintaining your current layering order — it seems to be working well."
- Free users see the metric cards (streak and completion rate only) but the AI narrative section is replaced with a frosted/blurred preview and a "Unlock Skin Stories with Pro" button that navigates to the paywall screen, passing "skin_story" as the triggering feature.
- Pull-to-refresh reloads all data. If the current period's story hasn't been generated yet, the narrative section shows a placeholder: "Your weekly insight is being prepared..." with a subtle loading animation.
- Tapping any metric card navigates to a detail view (use a simple modal or bottom sheet) showing the raw data points as a list — for example, tapping Skin Score Trend shows each day's score as a row.

**API Calls**

- On screen mount, fetch the latest skin_story record for the selected period type from Supabase using a query filtered by user_id, period_type, and ordering by generated_at descending, limited to one result.
- Simultaneously, query skin_logs for the selected date range, routine_completions for the same range, and compute metrics client-side (average scores, completion counts). This provides the metric card data independently of whether the AI narrative has been generated.
- Charts use react-native-chart-kit. The skin score trend chart is a line chart with dates on the X axis and score (0-10) on the Y axis. The completion rate chart is a simple bar chart per day (completed versus total routines). Configure charts with the app's color theme.
- No direct Claude API calls from this screen. The AI narrative is pre-generated by the Inngest background job (described below). The screen only reads the cached result.

**Inngest Background Job: Weekly Skin Story Generation**

Create an Inngest function called **generate-weekly-skin-story** triggered on a cron schedule running every Monday at 6:00 AM UTC. The function should:

- **Step 1 — Identify eligible users.** Query the users table for all users with an active Pro subscription (check subscription_status in user metadata). Also check that the user has at least 3 skin log entries in the previous 7 days — without sufficient data, skip that user and optionally create a notification saying "Log more days this week to get your Skin Story!"
- **Step 2 — For each eligible user, gather data.** Query skin_logs for the previous 7-day period. Query routine_completions joined with routine_steps and products for the same period. Compute aggregate metrics: daily average skin scores, completion rates per routine, product usage frequency counts.
- **Step 3 — Generate the narrative via Edge Function.** Invoke the existing analyze-ingredients Edge Function pattern (or create a new one called generate-skin-story) that calls Claude 4.5 Sonnet. The prompt should include the computed metrics as structured data and instruct Claude to generate a 2-4 sentence insight paragraph that is encouraging, specific, and actionable. The system prompt should specify: "You are a friendly skincare advisor. Analyze the user's weekly skin data and routine adherence. Mention specific products by name. Be encouraging but honest. Do not make medical claims. Keep it under 100 words."
- **Step 4 — Cache the result.** Insert the narrative and metrics into the skin_stories table. Also cache the full response in Upstash Redis with a key pattern of "skin_story:{user_id}:{period_start}" and a TTL of 7 days.
- **Step 5 — Notify the user.** Insert a notification into the notifications table with type "skin_story_ready", title "Your Weekly Skin Story is ready!", and data containing the screen navigation target. If the user has push notifications enabled, also send an Expo push notification.

Create a parallel Inngest function called **generate-monthly-skin-story** that runs on the first of each month, following the same pattern but with a 30-day lookback window and a more comprehensive prompt that identifies longer-term trends.

**State Management**

Use a combination of local component state for the selected period and React Query (or a similar async state manager if already established in EP1/EP2) for the Supabase data fetching. The key insight: metric card data is computed from raw tables on every load (always fresh), while the AI narrative is read from the pre-computed skin_stories table (may be stale until the next Inngest run). This dual approach means the screen always has something to show even if the AI job hasn't run yet.

**Edge Cases**

- **New user with no data:** Show an empty state illustration with the message "Start logging your skin to see insights here!" and a call-to-action button that navigates to the Skin Log Entry screen.
- **Free user:** Show basic metric cards (streak and completion rate only, no trend charts) and the blurred AI narrative section with the upgrade prompt. Track the PostHog event "paywall_impression" with the property source set to "skin_story".
- **Insufficient data for AI generation:** If fewer than 3 log entries exist for the period, show the metrics that are available but replace the narrative with "Keep logging! You need at least 3 entries this week for a personalized insight."
- **Inngest job failure:** If the skin_stories table has no entry for the current period, display the metrics and a "Insight pending..." message. The Inngest retry mechanism (configured for 3 retries) will handle transient failures. If the job ultimately fails, Sentry captures the error from the Edge Function.
- **Timezone handling:** Period boundaries must respect the user's timezone stored in the users table. A "week" is Monday 00:00 to Sunday 23:59 in the user's local timezone, not UTC.

---

## Screen 2: Ingredient Conflict Guide

**Purpose**

A standalone reference screen that analyzes the user's entire product shelf and displays all detected ingredient conflicts in one place. Unlike the per-routine conflict checking in EP2's Routine Builder (which flags conflicts within a single routine), this screen provides a holistic view across all owned products, helping users understand which products should never be layered together regardless of which routine they're in.

**Data Model**

This screen reads from the products table (all products where user_id matches the current user) and the bundled ingredient_conflicts.json file (established in EP1 — approximately 200KB containing 500 known conflict pairs with severity levels and brief descriptions). For enriched explanations, it reads from or writes to Upstash Redis where Claude-generated explanations are cached.

The conflict detection data shape (described in prose): each conflict result contains ingredient_a (string, the first ingredient name), ingredient_b (string, the second ingredient name), severity (one of "avoid", "caution", or "myth"), brief_description (string from the bundled JSON, approximately 1-2 sentences), products_containing_a (array of objects with product id and name), products_containing_b (array of objects with product id and name), and optionally ai_explanation (string, the longer Claude-generated explanation, null until requested and cached).

**User Interactions**

- On screen load, the app reads all products from the user's shelf and extracts every ingredient from every product's ingredients jsonb array. It then runs the on-device conflict detection algorithm (cross-reference all ingredient pairs against the bundled conflict rules). This should complete in under 50ms for a typical shelf of 20-30 products.
- Results are grouped into three collapsible sections, each with a colored header: **"Avoid Combining"** (red, severity "avoid") for genuinely problematic combinations like Retinol + AHA or Retinol + Benzoyl Peroxide; **"Use with Caution"** (amber, severity "caution") for combinations that may cause irritation in sensitive skin but are not universally harmful; **"Common Myths — Actually Safe"** (green, severity "myth") for combinations frequently misidentified as conflicts, like Niacinamide + Vitamin C.
- Each conflict card within a section displays the two ingredient names prominently, the brief description from the bundled rules, and a list of which specific products from the user's shelf contain each ingredient (tappable to navigate to Product Detail).
- Tapping "Learn More" on any conflict card triggers a Claude API call (via the analyze-ingredients Edge Function) to generate a detailed, plain-language explanation. This explanation is cached in Upstash Redis with the key "conflict_explanation:{ingredient_a_hash}:{ingredient_b_hash}" and a TTL of 30 days. Subsequent taps on the same conflict load from cache. While the AI explanation is loading, show a skeleton text placeholder with a subtle shimmer animation.
- A search bar at the top allows filtering conflicts by ingredient name or product name.
- If the user has no conflicts detected, show a celebratory empty state: "Your shelf is conflict-free! Your products play well together." with a cheerful illustration.
- The screen header includes a small info icon that opens a bottom sheet explaining how conflict detection works, its limitations ("This is not medical advice"), and that the data comes from published dermatological research.

**API Calls**

- Primary data fetch: query the products table for all user products, selecting id, name, brand, and ingredients fields. This is a single Supabase query.
- On-device conflict detection: purely local computation against the bundled JSON. No network call.
- Claude enrichment (on "Learn More" tap): invoke the analyze-ingredients Edge Function. The request body includes the two ingredient names and a flag indicating this is a conflict explanation request (as opposed to a layering order request). The Edge Function checks Redis cache first, and only calls Claude if no cached result exists.
- The Edge Function prompt for conflict explanations should instruct Claude: "Explain in 2-3 sentences why these two skincare ingredients may conflict. Mention the specific chemical interaction. Suggest how to safely use both (e.g., use at different times of day). Do not make medical diagnoses. Use everyday language."

**State Management**

Compute conflicts in a useMemo hook (or equivalent memoization) that recalculates only when the products array changes. Store the enriched AI explanations in a local map keyed by the conflict pair hash, populated as the user taps "Learn More" on individual conflicts. This avoids re-fetching explanations during the same session.

**Edge Cases**

- **Empty shelf:** If the user has no products, show a prompt to add products first, with a button navigating to the Add Product screen.
- **Single product:** With only one product, there can be no cross-product conflicts. Show a message: "Add more products to see potential conflicts between them."
- **Products with missing ingredients:** Some manually entered products may have empty ingredient lists. Exclude them from conflict analysis but show a subtle note: "2 products have no ingredient data — edit them to add ingredients for full conflict analysis."
- **Bundled JSON versioning:** The bundled ingredient_conflicts.json includes a version number field at the root level. When the app updates via Expo OTA and the version number increments, any cached Claude explanations for affected conflict pairs should be invalidated (the Edge Function checks the version and re-generates if stale).

---

## Screen 3: Progress Photos Gallery

**Purpose**

A chronological gallery of progress photos that the user has taken alongside their skin logs. The key feature is a side-by-side comparison mode that lets users visually track skin changes over time. This screen provides the emotional payoff of consistent logging — seeing visual improvement is the strongest retention driver.

**Data Model**

This screen reads from the progress_photos table (established in EP1 with fields: id, user_id, photo_path, skin_log_id referencing skin_logs, notes, created_at). The photo_path field stores the Supabase Storage object path. The screen also joins with skin_logs to display the skin scores recorded on the same day as each photo.

For display purposes, each gallery item combines: the photo URL (resolved from photo_path via Supabase Storage getPublicUrl), the date (from created_at), the associated skin log scores (overall_score, hydration, oiliness, irritation, acne from the joined skin_logs row), and optional notes text.

**User Interactions**

- The default view is a vertical scrollable timeline grouped by month. Each month section has a sticky header with the month and year label. Within each month, photos are displayed in a grid layout (3 columns) showing thumbnail versions of the photos with the date overlaid in the bottom-left corner.
- Tapping a photo opens it in a full-screen lightbox with pinch-to-zoom support. The lightbox overlay shows the photo date, the skin log scores as small colored badges (e.g., "Score: 7/10", "Hydration: 8/10"), and any notes the user added.
- **Side-by-side comparison mode:** A "Compare" button in the screen header activates comparison mode. In this mode, the user taps two photos to select them (indicated by a numbered badge overlay: "1" and "2"). Once two are selected, the screen transitions to a split-screen view showing both photos side by side with their respective dates and scores below each. Pinch-to-zoom should work on both photos simultaneously (synchronized zoom). A "Swap" button exchanges left and right positions. An "Exit Compare" button returns to the gallery.
- **Photo count and Pro gate:** Free users can store up to 50 progress photos. Display a counter in the header showing "12 / 50 photos" for free users. When the limit is reached, the "Add Photo" action (from the Skin Log Entry screen — photos are added there, not here) shows a message directing to the paywall. Pro users see no counter (unlimited storage).
- Pull-to-refresh reloads the gallery. Skeleton shimmer placeholders appear during initial load, shaped as the grid thumbnail squares.
- Long-pressing a photo opens a context menu with options: "View Full Size", "Compare With...", "Delete Photo". Delete requires confirmation and removes both the Supabase Storage file and the database record.
- Photos are loaded with pagination — fetch 30 photos at a time, loading more as the user scrolls to the bottom of the timeline.

**API Calls**

- On mount: query progress_photos joined with skin_logs, filtered by user_id, ordered by created_at descending, with a limit of 30 and cursor-based pagination using the created_at timestamp.
- Photo URLs: resolve each photo_path using Supabase Storage's getPublicUrl method from the progress-photos bucket. For grid thumbnails, use Supabase Storage's image transformation parameters to request a width of 300 pixels (reduces bandwidth for the grid view). For the full-screen lightbox, request the full resolution image.
- Photo count query (for the free-tier counter): a simple count query on progress_photos filtered by user_id.
- Delete operation: call Supabase Storage's remove method to delete the file at the photo_path, then delete the progress_photos database row. These should be performed in sequence — delete storage first, then database, so that if the storage deletion fails, the database record still exists and can be retried.

**State Management**

Maintain the photo list in component state with infinite scroll pagination. The comparison mode uses a local state array (maximum 2 items) tracking which photo IDs are selected for comparison. When entering comparison mode, the gallery view remains mounted but visually transitions to a comparison layout — no separate screen navigation is needed. Use React Native Reanimated for the layout transition animation.

**Edge Cases**

- **No photos yet:** Show an engaging empty state with an illustration of a camera and the message "Take your first progress photo during a skin log to start tracking your journey!" with a button navigating to the Skin Log Entry screen.
- **Photos with missing skin log association:** If a progress_photo has a null skin_log_id (edge case from a deleted skin log), display the photo without score badges. Show "No skin data" in place of scores.
- **Storage quota:** Supabase free tier includes 1GB of storage. With JPEG compression (established in EP2 — max 1200px width, 80% quality, roughly 200-400KB per photo), 50 free-tier photos use approximately 10-20MB. This is well within limits, but monitor storage usage in the Supabase dashboard.
- **Network errors during image load:** Use a fallback placeholder image (a generic photo icon) for any thumbnail that fails to load. Retry loading on pull-to-refresh.
- **Comparison with same photo:** If the user accidentally selects the same photo twice, show a brief toast: "Select two different photos to compare."

---

## Screen 4: Routine Calendar

**Purpose**

A monthly calendar visualization of routine completion history that gives users a visual representation of their consistency. Each day at a glance shows whether routines were fully completed, partially completed, or missed. This is the "don't break the chain" motivational mechanic that drives daily habit formation.

**Data Model**

This screen reads from routine_completions (fields: id, user_id, routine_id, date, completed_at) and routines (fields: id, user_id, name, recurrence_rule, time_of_day, is_active). The recurrence_rule field contains RRULE-style data that determines which days a routine is expected. The screen also reads from skin_logs to show whether a skin log entry exists for any given day.

For each calendar day, the computed display state is one of: **complete** (all scheduled routines for that day were completed), **partial** (some but not all scheduled routines were completed), **missed** (at least one routine was scheduled but none were completed), **none** (no routines were scheduled for that day), or **future** (the day hasn't occurred yet). Additionally, a day may have a skin log indicator if a skin_logs row exists for that date and user.

**User Interactions**

- The screen opens to the current month. A header displays the month and year with left/right arrow buttons to navigate between months. The "Today" text is tappable to quickly return to the current month.
- The calendar grid follows a standard 7-column layout (Sunday through Saturday or Monday through Sunday based on locale). Each day cell contains: the day number, a colored dot indicator (green for complete, amber for partial, red for missed, no dot for none/future), and a small secondary dot in a different color if a skin log was recorded that day.
- Tapping any past or present day opens a bottom sheet showing: the date formatted nicely, a list of routines that were scheduled for that day (each with a checkmark if completed or an X if missed, along with the routine name and time of day), the skin log summary for that day if one exists (showing the overall score and individual metrics as small labeled values), and a link to "View Progress Photo" if one exists for that date.
- The current streak counter is prominently displayed above the calendar grid — "15 day streak 🔥" — calculated as the number of consecutive days (working backwards from today) where all scheduled routines were completed. If today's routines are not yet complete, the streak counts through yesterday.
- A small legend below the calendar explains the dot colors for new users.
- Month transitions should animate smoothly — the outgoing month slides out and the incoming month slides in from the appropriate direction.

**API Calls**

- On mount and on month change: fetch all routine_completions for the visible month's date range (first day of month to last day of month), filtered by user_id. Also fetch all active routines for the user to determine which routines were scheduled on each day (by evaluating the recurrence_rule against each day in the month). Additionally, fetch skin_logs for the month's date range to determine which days have log entries.
- The recurrence rule evaluation should happen client-side. The RRULE-style data stored in routines.recurrence_rule is parsed by the same utility functions established in EP2 to determine whether a given routine is scheduled for a specific date. This computation is purely local and fast.
- For the streak calculation: this can be computed client-side from the fetched completions data, but for efficiency, consider computing it server-side via a Supabase RPC (a PostgreSQL function) that counts consecutive complete days. If an RPC doesn't already exist from EP2, compute it client-side by iterating backward from today.

**State Management**

The selected month is held in local state as a year-month pair. The completions and routines data for the visible month are fetched reactively when the month changes. Cache at least the current month and the previous month in memory to enable smooth back-navigation without re-fetching. The bottom sheet for a selected day uses a separate local state for which day is selected and whether the sheet is open.

**Edge Cases**

- **New user with no routines:** Show the calendar grid (still useful for orientation) with an empty state message: "Create your first routine to start tracking!" with a button to the Routine Builder.
- **Month with no data:** If the user navigates to a month before they started using the app, all days show as "none" (no dots). This is fine and expected.
- **Timezone edge cases:** All date comparisons must use the user's timezone from the users table. A routine completed at 11:30 PM Pacific time should count for that Pacific date, not the next UTC date. The date field in routine_completions stores the local date (not a timestamp), so this should already be handled if EP2 stores dates correctly.
- **Multiple routines per day:** A user might have both AM and PM routines. A day is only "complete" (green) if ALL scheduled routines for that day have completion records. If only AM is done but PM is missed, the day shows as "partial" (amber).
- **Routines added mid-month:** If a routine's recurrence_rule starts from a date mid-month, days before that start date should not count the routine as scheduled. The recurrence rule evaluation must respect start dates.

---

## Screen 5: GlowLog Pro Paywall

**Purpose**

The subscription purchase screen that converts free users into paying Pro subscribers. This screen is shown when a user taps a Pro-gated feature (Skin Story AI narratives, unlimited progress photos, data export). It must be honest, clear, and value-focused — no fake social proof, no dark patterns, no urgency tricks.

**Data Model**

This screen reads from RevenueCat's offerings (fetched at runtime from the RevenueCat SDK, not hardcoded) to get the localized prices for the monthly and annual packages. It also reads the current subscription state from the useSubscription hook to handle the case where the user is already subscribed (redirect or show a "You're already a Pro member" state). The screen receives a route parameter called **triggeringFeature** (optional string) that indicates which feature the user was trying to access, enabling context-aware messaging.

**User Interactions**

- **Header section:** A clean, branded header with the GlowLog Pro logo/icon and a headline that adapts based on the triggering feature. If the user came from Skin Story, the headline reads "Unlock AI Skin Insights". If from Progress Photos, it reads "Unlimited Progress Tracking". If no triggering feature is specified (user navigated from Settings), the generic headline reads "Get More From GlowLog". Below the headline, a 1-2 sentence value proposition: "Your skincare routine deserves deeper insights."

- **Feature list:** A vertical list of Pro benefits, each with a checkmark icon and brief description:
  - "AI-powered weekly Skin Stories — understand what's working"
  - "Unlimited progress photos — track your journey without limits"
  - "Advanced charts and trend analysis"
  - "Export your data (JSON/CSV)"
  - Each item uses the app's accent color for the checkmark.

- **What stays free section:** A clearly labeled section below the feature list showing what free users retain: "Product shelf & barcode scanning", "Routine builder & scheduling", "Daily skin logging", "Ingredient conflict detection", "Basic streak tracking". This section uses a more subdued visual treatment (gray checkmarks) to emphasize that free users aren't being strong-armed.

- **Pricing cards:** Two horizontally arranged cards for Monthly and Annual plans. The Annual card has a subtle "Save 33%" badge. Each card displays: the plan name ("Monthly" or "Annual"), the price pulled from RevenueCat (which provides localized pricing — do NOT hardcode "$5.99"), the per-month equivalent for the annual plan (e.g., "$4.00/mo"), and a "Subscribe" button. The Annual card should be visually emphasized (slightly larger, accent border, or filled background) as the recommended option. Prices are fetched from RevenueCat's getOfferings response and displayed using the package's localizedPriceString property, ensuring correct currency formatting for all locales.

- **Purchase flow:** Tapping "Subscribe" on either card calls RevenueCat's purchasePackage method with the selected package. During the purchase process, show a full-screen loading overlay with a message "Processing..." to prevent double-taps. On success: dismiss the paywall, navigate back to the screen the user came from, and show a brief celebration animation or toast ("Welcome to GlowLog Pro!"). On failure: show an error message in a non-blocking alert. If the user cancels the purchase (a normal flow on iOS), silently dismiss the loading state without showing an error.

- **Restore Purchases:** A text link below the pricing cards labeled "Already subscribed? Restore Purchases" that calls RevenueCat's restorePurchases method. If restoration finds an active entitlement, update the UI to reflect Pro status. If no active subscription is found, show a friendly message: "No active subscription found. If you believe this is an error, contact support."

- **Close button:** An X button in the top-right corner to dismiss the paywall without purchasing. This is essential — the user must never feel trapped.

**API Calls**

- On mount: call RevenueCat's getOfferings method to fetch the "default" offering with its monthly and annual packages. This returns localized pricing data.
- On subscribe tap: call purchasePackage with the selected package object from the offerings response. RevenueCat handles all App Store communication, receipt validation, and entitlement activation.
- On restore tap: call restorePurchases, then check the resulting customerInfo for active entitlements.
- PostHog analytics: track "paywall_viewed" with properties (triggering_feature, timestamp), "paywall_subscribe_tapped" with properties (plan_type: "monthly" or "annual"), "paywall_purchase_completed" with properties (plan_type, price), "paywall_dismissed" (user closed without purchasing), and "paywall_restore_tapped".

**State Management**

Local state for: offerings data (fetched from RevenueCat), loading states (fetching offerings, processing purchase, restoring), and error messages. The useSubscription hook provides the current subscription state for conditional rendering.

**Edge Cases**

- **Already subscribed:** If useSubscription indicates the user is already Pro when the paywall screen loads, show a different UI: "You're a GlowLog Pro member!" with their plan details and a "Manage Subscription" button that opens the device's native subscription management screen (use RevenueCat's getManagementURL or Linking to open the App Store subscriptions page).
- **RevenueCat unavailable:** If getOfferings fails (network error), show a retry button and a fallback message with the standard pricing (but labeled as approximate since it can't be localized). Track this failure in Sentry.
- **App Store sandbox vs production:** During development and TestFlight testing, RevenueCat automatically uses the App Store sandbox environment. No special handling is needed, but be aware that sandbox purchases have accelerated renewal schedules (monthly renews every 5 minutes).
- **User under 18:** Apple's App Store handles age-based purchase restrictions. The app does not need to implement additional age gating.
- **Price display before offerings load:** Show skeleton placeholder rectangles in place of prices while offerings are being fetched. Never show hardcoded prices as they may not match the user's locale currency.

---

## Screen 6: Notification Center

**Purpose**

An in-app notification history screen that aggregates all app notifications in one place — routine reminders, streak milestones, Skin Story availability alerts, and system messages. Each notification is actionable, navigating the user to the relevant screen on tap.

**Data Model**

This screen reads from the notifications table (defined above in the new database objects section). Each notification has a type field that determines the icon, color treatment, and navigation target: "routine_reminder" navigates to Routine Execution (passing the routine_id from the data jsonb field), "streak_milestone" navigates to the Routine Calendar, "skin_story_ready" navigates to the Skin Story Dashboard, and "system" shows an inline expanded message with no navigation.

The data jsonb field stores context-specific navigation parameters. For routine_reminder: the routine_id and routine_name. For streak_milestone: the streak_count. For skin_story_ready: the period_type and period_start. For system: an optional action_url.

**User Interactions**

- The screen displays a vertically scrolling list of notifications grouped by time period with sticky section headers: "Today", "Yesterday", "This Week", "Older". If a section has no notifications, it is omitted entirely.
- Each notification row displays: a colored icon on the left (bell icon for reminders, fire icon for streaks, sparkle icon for skin stories, info icon for system), the title in bold, the body text below in regular weight, and a relative timestamp on the right (e.g., "2h ago", "Yesterday at 3:00 PM").
- Unread notifications have a small colored dot on the left edge and a slightly tinted background (using the app's primary color at 5% opacity). Read notifications have no dot and a plain background.
- Tapping a notification performs two actions simultaneously: marks it as read (updates the read field to true in the database) and navigates to the appropriate screen based on the notification type and data fields.
- Swipe gestures: swipe left reveals a red "Delete" button that removes the notification from the database. Swipe right toggles the read/unread state.
- A "Mark All as Read" button in the header performs a batch update on all unread notifications for the user, setting read to true. This should be a single Supabase update query with a filter on user_id and read equals false.
- A filter tab bar below the header offers: "All", "Reminders", "Milestones", "Insights", "System" — filtering the list by notification type. "All" is selected by default.
- Pull-to-refresh reloads the notification list. Infinite scroll loads older notifications (paginated by 20 items at a time, cursor-based on created_at).
- The tab bar badge count (displayed on the main navigation tab for this screen) reflects the count of unread notifications. This count should be maintained reactively — when the user marks notifications as read, the badge count decreases in real time.

**API Calls**

- On mount: query notifications filtered by user_id, ordered by created_at descending, limited to 20, with optional type filter if a filter tab is selected.
- On mark as read (single): update notifications set read equals true where id equals the notification id and user_id equals the current user.
- On mark all as read: update notifications set read equals true where user_id equals the current user and read equals false.
- On delete: delete from notifications where id equals the notification id and user_id equals the current user.
- Unread count query (for badge): select count from notifications where user_id equals the current user and read equals false. This query should also be run on app foreground resume to keep the badge current.

**How Notifications Are Created**

Notifications are created by Edge Functions and background jobs, never by the client directly:

- **Routine reminders:** The local notification system (Expo Notifications scheduling from EP2) handles the push notification delivery. Separately, an Edge Function (or the same Inngest job that manages reminders) inserts a row into the notifications table so that the notification appears in the in-app center even if the push notification was dismissed.
- **Streak milestones:** When a routine completion is logged (in the Routine Execution screen from EP2), the Edge Function that processes the completion should check the current streak count. If the streak hits a milestone number (7, 14, 30, 60, 90, 180, 365 days), insert a milestone notification and optionally send a push notification with a congratulatory message.
- **Skin Story ready:** Created by the Inngest generate-weekly-skin-story job (described above in the Skin Story Dashboard section) after successfully generating a story.
- **System notifications:** Created manually via the Supabase dashboard or a future admin tool for announcements like app updates or maintenance windows.

**State Management**

The notification list is held in component state with pagination support. The unread count is maintained as a separate piece of state (queried independently) that drives the tab bar badge. When the user marks a notification as read, update both the list state (toggle the read flag on the affected item) and decrement the unread count — this is an optimistic update, with the database write happening in the background.

**Edge Cases**

- **No notifications:** Show an empty state illustration with "You're all caught up!" message. This is a positive state, not an error.
- **Notification for deleted entity:** If a routine_reminder notification references a routine that was subsequently deleted, tapping it should gracefully handle the missing entity — show a toast "This routine no longer exists" and mark the notification as read rather than crashing or showing a broken screen.
- **Rapid marking:** If the user quickly swipes through multiple notifications, batch the read status updates into a single database call using an array of notification IDs rather than making individual requests for each.
- **Push notification permission denied:** The notification center works independently of push notification permissions. Even if the user denied push permissions, in-app notifications are still created and displayed here. The push notification is simply not delivered to the device.

---

## GPT-5 Vision Label Extraction Edge Function

**Purpose**

This is a barcode scan fallback feature. When the barcode scanning flow (from EP2) fails to find a product in Open Food Facts or Algolia, the user is offered the option to photograph the product's ingredient label and have AI extract the text. This replaces manual typing of long INCI ingredient lists.

**Architecture**

Create a new Supabase Edge Function called **extract-label-text**. This function receives a base64-encoded image of a product label and returns the extracted ingredient list as a structured array.

**Data Flow**

1. The user is in the Add Product screen (EP2). After a barcode scan fails to find a product match, and the user is on the manual entry form, a new button appears: "📷 Scan Ingredient Label" (this button must be added to the existing Add Product screen from EP2).
2. Tapping this button opens the camera (using expo-camera in photo mode, not barcode mode). The user photographs the ingredient list on the product packaging.
3. The captured image is compressed using expo-image-manipulator to a maximum width of 1500 pixels and 85% JPEG quality (higher quality than progress photos because text legibility matters).
4. The compressed image is converted to base64 and sent to the extract-label-text Edge Function.
5. The Edge Function calls GPT-5.4 with vision capability (slug: gpt5-vision). The request includes the image as a base64 data URL and a system prompt instructing the model: "Extract the complete ingredient list (INCI format) from this skincare product label image. Return ONLY a JSON array of ingredient name strings, in the order they appear on the label. If you cannot read the label clearly, return an empty array with an error message."
6. The Edge Function parses the GPT-5.4 response, validates that it's a valid JSON array of strings, and returns it to the client.
7. The client populates the manual entry form's ingredient field with the extracted ingredients, allowing the user to review and edit before saving.

**Caching Strategy**

Unlike ingredient conflict explanations, label extraction results are not cached in Redis — each label image is unique and unlikely to be scanned again. However, the Edge Function should implement rate limiting via Upstash Redis: maximum 10 label extractions per user per day on the free tier, unlimited for Pro users. The rate limit key pattern is "label_extract:{user_id}:{date}".

**Error Handling**

- If GPT-5.4 returns an empty array or an error indication, show a user-friendly message: "We couldn't read the label clearly. Try again with better lighting, or enter ingredients manually."
- If the Edge Function times out (Supabase Edge Functions have a default 60-second timeout, which should be sufficient for a single vision API call), return a timeout error and suggest manual entry.
- If the user exceeds the daily rate limit, show: "You've reached the daily limit for label scanning. Enter ingredients manually, or upgrade to Pro for unlimited scans."
- Track extraction success/failure rates in PostHog to monitor the feature's reliability.

**Integration Point with EP2**

The Add Product screen from EP2 must be modified to include the "Scan Ingredient Label" button. This button should appear only on the manual entry form (not during the barcode scan or Algolia search phases, where ingredient data comes from the product database). The button should be placed near the ingredients text input field, styled as a secondary action. After successful extraction, the ingredients field is populated but remains editable.

---

## Polish and Production Readiness

### Loading States

Every screen that fetches data must have a proper loading state. Use skeleton shimmer placeholders (not spinners) that match the layout of the content they're replacing. The skeleton components should be reusable — create a shared SkeletonCard, SkeletonLine, and SkeletonCircle component in the shared UI directory. These use React Native Reanimated to animate a shimmer gradient effect from left to right on a repeating loop.

Specific loading state implementations:
- **Skin Story Dashboard:** Skeleton versions of each metric card (rectangle with rounded corners) and a multi-line skeleton block for the narrative section.
- **Ingredient Conflict Guide:** Skeleton conflict cards (three of them stacked) within skeleton section groups.
- **Progress Photos Gallery:** A grid of square skeleton thumbnails (9 of them, matching the 3-column layout).
- **Routine Calendar:** A skeleton calendar grid (7x5 grid of circles) with a skeleton streak counter above.
- **Paywall:** Skeleton pricing cards (two rectangles side by side). However, if RevenueCat offerings load quickly (usually under 1 second), consider showing the feature list immediately and only skeletoning the pricing section.
- **Notification Center:** Skeleton notification rows (4-5 of them, each with a circle on the left and two lines on the right).

### Empty States

Every list or data-driven screen must have a dedicated empty state that appears when there is no data to display. Empty states should include: a themed illustration or icon (use a consistent illustration style across all empty states), a primary message explaining what will appear here, a secondary message suggesting the next action, and a call-to-action button that navigates to the relevant creation flow.

Document of empty state messages per screen is above in each screen's Edge Cases section. Ensure illustrations are lightweight vector graphics (SVG rendered via react-native-svg or simple composed View elements), not heavy bitmap images.

### Error Boundaries

Implement a React error boundary component that wraps each tab screen independently. If one tab crashes, only that tab shows the error state — other tabs continue functioning. The error boundary should:

- Catch rendering errors and display a friendly error screen with: "Something went wrong" title, a brief non-technical description, a "Try Again" button that resets the error boundary state and re-mounts the child component, and a "Report Issue" button that opens an email compose screen pre-filled with error details.
- Log the error to Sentry with the screen name as context, the component stack trace, and any relevant user state (subscription status, number of products, etc. — but no PII).
- For API errors (not rendering errors), use a shared error handling utility that categorizes errors: network errors show "Check your connection" with a retry button, 401/403 errors trigger a re-authentication flow, 429 errors show "Too many requests, please wait" with the retry-after value, and 500 errors show "Our servers are having a moment" with a retry button.

### Haptic Feedback

Add haptic feedback to key user interactions throughout the entire app (both EP2 and EP3 screens). Use Expo Haptics (expo-haptics) with the following pattern:
- **Light impact** on button taps, tab switches, and filter selections.
- **Medium impact** on completing a routine step (the checkmark tap in Routine Execution).
- **Success notification** when completing all steps of a routine, reaching a streak milestone, or successfully purchasing a subscription.
- **Warning notification** when encountering an ingredient conflict in the Routine Builder or Conflict Guide.
- **Error notification** on validation failures (empty form submissions, failed purchases).

Create a shared haptic utility that wraps expo-haptics and includes a user preference check — if the user has disabled haptics in Settings (add a toggle to the existing Settings screen from EP1), all haptic calls become no-ops.

### App Icon and Splash Screen

Configure the app icon and splash screen in app.config:

- **App icon:** The icon field should point to a 1024x1024 PNG file in the assets directory. For GlowLog, the icon should be a clean, modern design featuring a glow or dewdrop motif on a gradient background (soft pink to lavender, matching the app's brand colors). The actual image asset must be created separately — for Claude Code's purposes, ensure the app.config correctly references the asset path and that a placeholder image of the correct dimensions exists.
- **Splash screen:** Configure the splash screen with a solid background color matching the app's primary background, the app name "GlowLog" centered with the icon above it, and a resizeMode of "contain". Use expo-splash-screen to control when the splash is hidden — it should remain visible until the auth state is determined and the first screen's data is loaded. Call SplashScreen.hideAsync() only after the initial data fetch completes.

### Analytics Events

Implement PostHog event tracking for all key user actions introduced in EP3. Each event should include standard properties (user_id, subscription_status, platform, app_version) plus event-specific properties:

- **skin_story_viewed:** properties include period_type (weekly/monthly), has_narrative (boolean), is_pro (boolean)
- **conflict_guide_viewed:** properties include total_conflicts_found (number), severity_breakdown (object with counts per severity level)
- **conflict_detail_requested:** properties include ingredient_a, ingredient_b, severity, cache_hit (boolean)
- **photo_gallery_viewed:** properties include total_photos (number), is_pro (boolean)
- **photo_comparison_started:** no additional properties needed
- **calendar_viewed:** properties include current_streak (number), month_viewed (string)
- **calendar_day_tapped:** properties include date, completion_status
- **paywall_viewed:** properties include triggering_feature, source_screen
- **paywall_subscribe_tapped:** properties include plan_type (monthly/annual)
- **paywall_purchase_completed:** properties include plan_type, localized_price
- **paywall_purchase_failed:** properties include plan_type, error_type
- **paywall_dismissed:** properties include triggering_feature, time_spent_seconds
- **paywall_restore_tapped:** properties include restore_successful (boolean)
- **notification_tapped:** properties include notification_type, age_hours (how old the notification was when tapped)
- **notification_mark_all_read:** properties include count_marked
- **label_scan_attempted:** no additional properties
- **label_scan_succeeded:** properties include ingredient_count
- **label_scan_failed:** properties include error_type

### Sentry Error Context

Enhance Sentry error reports with custom context for EP3 features. When initializing Sentry scope:
- Set user context with the Supabase user ID (but not email or name for privacy).
- Set tags for subscription_status ("free" or "pro"), product_count (number of products on shelf), and routine_count (number of active routines).
- For Edge Function errors, include custom context: function_name, ai_model_called, cache_hit, input_size_bytes, and response_time_ms.
- For RevenueCat errors, include: offering_identifier, package_identifier, and store_error_code.

### Performance Optimization

- **Image lazy loading:** In the Progress Photos Gallery, use a FlashList (from @shopify/flash-list, which should already be installed from EP2 for other list screens) instead of FlatList for the photo grid. FlashList provides better recycling of off-screen components and reduces memory pressure.
- **Calendar computation memoization:** The routine calendar performs date math for every day of the visible month. Memoize the computation of "which routines are scheduled for which days" so that it only recalculates when the month changes or routines are modified, not on every re-render.
- **Subscription state caching:** The useSubscription hook should cache the RevenueCat customer info in AsyncStorage with a 1-hour TTL. On app launch, immediately return the cached state (allowing instant feature gate checks) while silently re-validating with RevenueCat in the background. If the fresh result differs from cache, update the UI reactively.
- **Edge Function cold start mitigation:** The first invocation of a Supabase Edge Function after a period of inactivity incurs a cold start delay (typically 1-3 seconds). For user-facing Edge Functions (analyze-ingredients, extract-label-text), add a loading indicator that appears after 500ms to avoid the user thinking the app is frozen. For background Edge Functions (invoked by Inngest), cold start is not user-facing and needs no special handling.

---

## EAS Build Configuration

Ensure the eas.json file has three build profiles properly configured:

**Development profile:** Uses the development client for debugging. Internal distribution. The environment should include all development-specific variables (Supabase staging project URL, RevenueCat sandbox API key).

**Preview profile:** Uses the preview distribution channel for TestFlight/internal testing. The bundle identifier is com.glowlog.app. This profile should be configured for simulator builds as well for quick testing. Environment variables point to the staging Supabase project but the production RevenueCat account (in sandbox mode).

**Production profile:** Uses the production distribution channel for App Store submission. Auto-increment build numbers. The bundle identifier is com.glowlog.app. All environment variables point to production services. Source maps are uploaded to Sentry automatically during the build step via the Sentry Expo plugin. The iOS configuration includes the correct team ID, provisioning profile, and distribution certificate.

The app.config file must include:
- The Sentry plugin in the plugins array with the organization and project slugs.
- The expo-notifications plugin with the notification icon and color configuration for Android.
- The expo-camera plugin with the camera usage description string: "GlowLog uses the camera to scan product barcodes and photograph ingredient labels."
- The expo-image-picker plugin with the photo library usage description: "GlowLog uses your photo library to select progress photos."
- The bundle identifier set to com.glowlog.app for iOS and the package name for Android.
- The version and buildNumber fields properly set for the initial App Store submission (start with version "1.0.0" and buildNumber "1").

---

## App Store Submission Preparation

### App Store Metadata

Prepare the following metadata for the App Store Connect listing:

- **App Name:** GlowLog
- **Subtitle:** Smart Skincare Routine Tracker
- **Category:** Primary — Health & Fitness; Secondary — Lifestyle
- **Description:** A comprehensive app description (up to 4000 characters) covering the key value propositions: product shelf management with barcode scanning, intelligent routine building with ingredient conflict detection, daily skin logging, progress photo tracking, and AI-powered insights (Pro). Emphasize that the core experience is completely free.
- **Keywords:** skincare, routine, tracker, ingredients, skin, care, beauty, glow, progress, barcode (100 characters max, comma-separated)
- **Privacy Policy URL:** Must be hosted (even a simple GitHub Pages site) before submission. Document what data is collected (skin log entries, product lists, progress photos), how it's stored (Supabase with RLS, encrypted at rest), and that AI processing happens server-side with no data retention by third-party AI providers.
- **Support URL:** An email address or simple support page.

### Screenshot Preparation

Generate screenshots for at least the following screens (for iPhone 6.7" and 6.1" displays): Home Dashboard showing a populated routine day, Product Shelf with several products, Routine Builder with products arranged, Skin Log Entry screen, Progress Photos Gallery (if populated), and the Skin Story Dashboard showing an AI insight. Screenshots should show the app in a populated state — use realistic sample data, not empty states.

### Review Guidelines Compliance

Ensure the following for Apple App Review:
- The paywall clearly shows pricing before any purchase action.
- The Restore Purchases button is visible and functional.
- The app works meaningfully without a Pro subscription (the free tier includes the core product shelf, routine builder, scheduling, logging, and conflict detection).
- The camera permission prompt clearly explains why camera access is needed.
- No hardcoded test data or debug menus are accessible in the production build.
- The privacy nutrition labels in App Store Connect accurately reflect data collection: "Data Linked to You" includes skin condition logs, photos, and product lists; "Data Not Linked to You" includes analytics and crash reports.

---

## Post-Build Verification Sequence

After all EP3 screens and infrastructure are built, execute these checks in order:

1. **Full TypeScript compilation** — run the TypeScript compiler in no-emit mode. Zero errors required.
2. **Screen navigation audit** — manually navigate to every screen in the app (all EP1, EP2, and EP3 screens) and confirm each renders without crashing. Pay special attention to screens that depend on subscription state (Skin Story Dashboard, Progress Photos counter) to verify they handle both free and Pro states correctly.
3. **Edge Function deployment** — deploy all Edge Functions to the production Supabase project: analyze-ingredients, lookup-product, generate-skin-story, extract-label-text, and revenuecat-webhook. Verify each is accessible via the Supabase functions invoke method.
4. **RevenueCat integration test** — on a physical device (not simulator), verify the paywall screen loads offerings, a sandbox purchase completes successfully, the subscription state updates in the app, and the webhook fires and updates the Supabase user metadata.
5. **Notification flow test** — create a test notification in the notifications table via the Supabase dashboard, verify it appears in the Notification Center, verify tapping it navigates correctly, verify the badge count updates.
6. **Sentry verification** — trigger a deliberate error (e.g., throw an exception in a test button only available in development) and confirm it appears in the Sentry dashboard with the correct context tags.
7. **PostHog verification** — perform a paywall view and a few screen navigations, then check the PostHog dashboard for the corresponding events with correct properties.
8. **Preview build** — run the EAS build command for the preview profile targeting iOS. Confirm the build succeeds and can be installed via TestFlight.
9. **Production build** — once preview testing is satisfactory, run the production build. Verify that source maps are uploaded to Sentry during the build process.
10. **App Store submission** — upload the production build to App Store Connect, fill in all metadata fields, upload screenshots, configure the privacy nutrition labels, and submit for review.

---

## Expected Final State

After executing this prompt completely, GlowLog should be a fully production-ready application with:

- **6 new screens:** Skin Story Dashboard, Ingredient Conflict Guide, Progress Photos Gallery, Routine Calendar, GlowLog Pro Paywall, and Notification Center — all integrated into the existing tab navigation and accessible from appropriate entry points.
- **Subscription monetization:** RevenueCat-powered paywall with monthly ($5.99) and annual ($47.99) plans, webhook syncing to Supabase, and feature gates on Pro-only features (AI Skin Story narratives, unlimited photos, data export, advanced charts).
- **Background intelligence:** Inngest-scheduled weekly and monthly Skin Story generation via Claude 4.5 Sonnet, with results cached in the skin_stories table and Redis.
- **AI vision fallback:** GPT-5.4 Vision label extraction for unrecognized products, integrated into the existing Add Product flow.
- **Full notification system:** In-app notification history with actionable notifications, badge counts, and read/unread management.
- **Production infrastructure:** Sentry error tracking with custom context, PostHog analytics with comprehensive event coverage, proper error boundaries on every tab, skeleton loading states on every data-driven screen, and haptic feedback throughout.
- **App Store readiness:** Configured EAS Build profiles, app icon and splash screen, App Store metadata preparation, and compliance with Apple Review Guidelines.