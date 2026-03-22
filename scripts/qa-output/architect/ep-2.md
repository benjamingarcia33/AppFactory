

# GlowLog — Execution Prompt 2 of 3: Core Feature Screens

## Preamble for Claude Code

You are continuing the GlowLog project that was set up in Execution Prompt 1. The foundation is already in place: Expo SDK 52 with Expo Router v4 tab navigation, Supabase Auth with Apple Sign-In and email/password, the full PostgreSQL schema via Drizzle ORM (users, products, routines, routine_steps, routine_completions, skin_logs, progress_photos tables with RLS policies), onboarding flow, settings screen, Sentry error tracking, PostHog analytics, Expo Notifications permission handling, and the bundled ingredient_conflicts.json file.

Your job now is to build the seven core feature screens that make GlowLog functional. After this prompt, a user should be able to: add products to their shelf, build routines from those products, execute routines daily, log their skin condition, and see everything summarized on a home dashboard. Every AI-powered feature (ingredient explanations, conflict detection, layering suggestions) should be wired up through Supabase Edge Functions.

Do NOT modify the database schema from EP1. Use the exact table names and column names that already exist. Do NOT rename any fields.

---

## Pre-Build Verification Checklist

Before writing any screen code, perform these checks and fix any issues:

1. **Environment variables** — Confirm these are all present and filled in the project's environment configuration: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (for Edge Functions), ANTHROPIC_API_KEY (set as a Supabase Edge Function secret), UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, EXPO_PUBLIC_ALGOLIA_APP_ID, EXPO_PUBLIC_ALGOLIA_SEARCH_KEY, and ALGOLIA_ADMIN_KEY (for indexing).

2. **TypeScript compilation** — Run the TypeScript compiler in no-emit mode to verify zero type errors across the existing codebase. Fix any errors before proceeding.

3. **Auth flow** — Manually verify that signing up, signing in, and signing out all work. Confirm the auth session persists across app restarts via AsyncStorage.

4. **Database tables** — Query Supabase to confirm all seven tables exist with correct columns and RLS policies are enabled on every table. Verify that a test insert respects RLS (i.e., a user cannot read another user's rows).

5. **Navigation skeleton** — Confirm the five-tab layout is rendering (Home, Shelf, Routines, Log, Profile) and that navigating between tabs works without crashes.

6. **Supabase Storage** — Confirm that two storage buckets exist: one named **progress-photos** (private, with RLS policy requiring auth.uid() in the file path) and one named **product-images** (public, for product thumbnails). If they do not exist, create them with the appropriate policies.

7. **Edge Functions deployment** — Deploy any Edge Functions created in EP1. If none were created yet, that is fine — this prompt will define and create them.

8. **Ingredient conflicts bundle** — Verify that the ingredient_conflicts.json file exists in the assets directory and contains the expected structure (an array of conflict pair objects, each with two ingredient identifiers, a severity level, and a short description).

If any check fails, fix it before proceeding. Do not build screens on a broken foundation.

---

## Shared Architecture Decisions (Apply to All Screens)

### Data Fetching Pattern

Every screen that loads data from Supabase should follow this pattern:

- Use a custom hook (for example, useRoutines, useProducts, useSkinLogs) that wraps Supabase client queries.
- Each hook should return an object with fields: **data** (the fetched result or null), **loading** (boolean), **error** (Error or null), and a **refetch** function.
- Queries should use the Supabase JS v2 client (not raw Drizzle from the client — Drizzle is used in Edge Functions and for schema definition; the client app queries via supabase.from().select()).
- All queries are automatically scoped to the authenticated user by RLS. Do NOT add manual user_id filters in client-side queries unless RLS is insufficient for that specific case.
- Implement pull-to-refresh on every scrollable screen by passing the refetch function to the RefreshControl component.
- Show skeleton shimmer placeholders during initial data loads. Use a reusable Skeleton component that accepts width, height, and borderRadius props and renders an animated gradient placeholder.

### State Management

- Use React Context for global state that multiple screens need: **AuthContext** (already from EP1), **ShelfContext** (the user's product list, used by Home Dashboard, Product Shelf, Routine Builder), and **RoutineContext** (today's routines and their completion status, used by Home Dashboard and Routine Execution).
- ShelfContext should load the user's full product list on app launch and expose methods to add, update, and archive products. It should re-fetch when a product is added or modified.
- RoutineContext should load today's applicable routines (based on recurrence rules and current date/timezone), their steps, and today's completion records. It should expose a method to mark a step complete and to mark an entire routine complete.
- For screen-local state (form inputs, UI toggles, animation values), use useState and useReducer. Do not over-globalize.

### Error Handling

- Wrap every Supabase query and Edge Function invocation in a try/catch. On error, log to Sentry with relevant context (screen name, operation attempted, user ID).
- Display user-facing errors as a dismissible banner at the top of the screen (not an alert dialog). The banner should show a friendly message and a "Retry" button.
- For Edge Function failures specifically (AI features), degrade gracefully: show the on-device result (from ingredient_conflicts.json) and note that enhanced AI analysis is temporarily unavailable.

### Analytics Events

Track these PostHog events across EP2 screens. Every event should include the user's subscription tier (free or pro) as a property:

- **product_added** with properties: entry_method (barcode, search, manual), product_type, has_ingredients (boolean)
- **product_viewed** with property: product_id
- **routine_created** with properties: step_count, schedule_type (daily, weekly, custom), time_of_day (AM/PM)
- **routine_started** with property: routine_id
- **routine_completed** with properties: routine_id, steps_completed, steps_skipped, duration_seconds
- **skin_log_created** with properties: has_photo (boolean), overall_score
- **ingredient_conflict_detected** with properties: ingredient_a, ingredient_b, severity
- **ai_explanation_requested** with property: ingredient_name

### NativeWind Styling Conventions

All screens use NativeWind v4 for styling. Follow these conventions established in EP1:

- Use the app's color tokens defined in the tailwind config: primary, secondary, surface, background, text-primary, text-secondary, accent-warning, accent-success, accent-danger.
- Cards use rounded-2xl, bg-surface, p-4, and a subtle shadow via the shadow-sm class.
- Section headers use text-lg, font-semibold, text-text-primary, and mb-3.
- Interactive elements have minimum 44x44pt touch targets per Apple HIG.
- Use safe area insets on every screen via the SafeAreaView wrapper from react-native-safe-area-context.

---

## Edge Functions to Build

Before building screens, create these three Supabase Edge Functions that the screens depend on. Each lives in the supabase/functions directory as its own folder with an index.ts entry file.

### Edge Function 1: lookup-product

**Purpose**: Orchestrates product lookup from a barcode scan. First checks the local Supabase products table for a matching barcode (in case another user has already added this product and it was cached). If not found, calls the Open Food Facts API. If Open Food Facts returns a result, extracts the product name, brand, and ingredient list. If Open Food Facts fails or returns no result, returns a "not found" response so the client can offer manual entry or GPT-5 Vision fallback.

**Request shape**: Accepts a JSON body with a single field **barcode** (string).

**Response shape**: Returns a JSON object with fields: **found** (boolean), **source** (string — either "cache", "open_food_facts", or "not_found"), **product** (object or null with fields: name, brand, ingredients as an array of strings, barcode, image_url if available).

**Implementation details**:
- First, query the Supabase products table for any row where the barcode column matches the input. Use the service role key client so this is not user-scoped. If found, return it immediately with source "cache".
- If not cached, make an HTTP GET request to the Open Food Facts API at the URL https://world.openfoodfacts.org/api/v2/product/ followed by the barcode value, with a .json suffix. The response includes a "product" object with fields "product_name", "brands", and "ingredients_text".
- Parse the ingredients_text string into an array by splitting on commas, trimming whitespace, and normalizing to lowercase.
- If the Open Food Facts API returns a status of 0 (product not found) or the request fails, return found as false with source "not_found".
- Add rate limiting: use Upstash Redis to limit each authenticated user to 30 barcode lookups per hour. Return a 429 status if exceeded.
- Cache successful Open Food Facts results in Upstash Redis with the barcode as key and a TTL of 7 days, so subsequent lookups for the same barcode by any user are instant.

### Edge Function 2: analyze-ingredients

**Purpose**: Takes a list of ingredients from one or more products and returns conflict analysis plus optimal layering order. Combines on-device conflict rules with Claude 4.5 Sonnet enrichment.

**Request shape**: Accepts a JSON body with field **products** (array of objects, each with fields: product_id, name, product_type, ingredients as an array of strings). Also accepts an optional field **explain** (boolean, default false) — when true, Claude generates plain-language explanations for each detected conflict.

**Response shape**: Returns a JSON object with fields: **conflicts** (array of objects, each with: product_a_id, product_b_id, ingredient_a, ingredient_b, severity as "high" or "medium" or "low", description as a string, ai_explanation as a string or null), **suggested_order** (array of product_ids in recommended application order), **layering_notes** (string — Claude-generated plain-language layering guidance, or null if explain is false).

**Implementation details**:
- First, perform the on-device-equivalent conflict detection server-side by loading the same ingredient_conflicts.json data (bundle it with the Edge Function or store it in Supabase Storage and cache it in Redis). Compare every ingredient across every product pair. This step is fast and does not require AI.
- If conflicts are found OR if explain is true, call Claude 4.5 Sonnet via the Anthropic SDK. The system prompt should identify Claude as a dermatology-trained skincare ingredient analyst. The user prompt should list all products with their ingredients, the detected conflicts, and ask for: plain-language explanations of each conflict (why they conflict, what could happen), and the optimal layering order with reasoning.
- Cache the Claude response in Upstash Redis using a deterministic cache key derived from a sorted hash of all ingredient arrays. TTL of 24 hours.
- If Claude is unavailable (API error, timeout, rate limit), still return the on-device conflict results with ai_explanation set to null and layering_notes set to null. Never block the user because AI is down.
- Rate limit: 10 analysis requests per user per hour.

### Edge Function 3: explain-ingredient

**Purpose**: Returns a plain-language explanation of a single skincare ingredient, suitable for display in a bottom sheet on the Product Detail screen.

**Request shape**: Accepts a JSON body with field **ingredient** (string — the INCI name of the ingredient).

**Response shape**: Returns a JSON object with fields: **ingredient** (string — normalized name), **common_name** (string — e.g., "Vitamin C" for "Ascorbic Acid"), **what_it_does** (string — one-paragraph explanation in friendly language), **skin_types** (array of strings — which skin types benefit most), **cautions** (string or null — any usage cautions), **pairs_well_with** (array of strings — complementary ingredients), **avoid_with** (array of strings — conflicting ingredients).

**Implementation details**:
- Check Upstash Redis cache first using the lowercased ingredient name as key. If cached, return immediately.
- If not cached, call Claude 4.5 Sonnet with a system prompt identifying it as a skincare ingredient encyclopedia. Ask it to return the response in the exact JSON structure described above. Use a max_tokens of 500 to keep responses concise.
- Cache the result in Redis with a TTL of 30 days (ingredient information is stable and rarely changes).
- Rate limit: 20 explanation requests per user per hour.

---

## Algolia Index Setup

Create an Algolia index named **products** that serves as the global product search database. This is separate from the user's personal product shelf (which is stored in Supabase). The Algolia index contains products that any user can search and add to their shelf.

**Index schema**: Each record should have these attributes: **objectID** (matching the Supabase product row id if it exists, or a generated ID for seeded data), **name** (string, searchable), **brand** (string, searchable), **product_type** (string, filterable — values like "cleanser", "toner", "serum", "moisturizer", "sunscreen", "exfoliant", "mask", "oil", "eye_cream"), **ingredients** (array of strings, searchable), **barcode** (string, optional).

**Searchable attributes** in priority order: name, brand, ingredients.

**Faceting attributes**: product_type, brand.

For MVP, seed the index with a starter dataset. Create a seeding script (run manually, not in the app) that populates Algolia with 50-100 common skincare products across major brands (CeraVe, The Ordinary, La Roche-Posay, Neutrogena, Paula's Choice, etc.). Each entry should include realistic ingredient lists. This script should use the Algolia admin API key and run from a local Node.js script or a Supabase Edge Function invoked manually.

When a user adds a product via manual entry and includes an ingredient list, also index that product in Algolia (via an Edge Function triggered after insert) so it becomes searchable for other users in the future. Use the Supabase product row's id as the objectID.

---

## Screen 1: Home Dashboard

**Purpose**

The Home Dashboard is the first screen users see after signing in. It answers three questions instantly: "What should I do today?", "Am I on track?", and "How is my skin doing?". It motivates daily engagement through streak visibility and makes the two primary daily actions (execute routine, log skin) accessible within one tap.

**Data Model**

This screen reads from multiple tables but writes to none directly. It needs:

- From the **routines** table: all active routines for the current user, filtered to those whose recurrence rule matches today's date. Each routine record has fields including id, user_id, name, time_of_day (text, either "AM" or "PM"), recurrence (text, RRULE-style), timezone (text), is_active (boolean), and created_at.
- From the **routine_steps** table: the steps for each of today's routines, joined with the products table to get product names. Each step has routine_id, product_id, step_order (integer), notes (text, nullable).
- From the **routine_completions** table: completion records for today, used to determine which routines are already done. Each record has routine_id, date (date type — use today's date in the user's timezone), completed_steps (jsonb array of product_ids), skipped_steps (jsonb array of product_ids), completed_at (timestamptz).
- From the **skin_logs** table: the most recent 7 days of logs for the mini chart, and today's log to determine if the user has already logged today. Each log has user_id, date, overall (integer 1-5), breakout (integer 1-5), dryness (integer 1-5), redness (integer 1-5), oiliness (integer 1-5), notes (text, nullable).
- From the **users** table: the user's display_name for the greeting and their skin_type for contextual tips.

**Recurrence Rule Evaluation**

The app needs a utility function that takes a routine's recurrence string and the user's timezone, and returns a boolean indicating whether that routine is due today. The recurrence field stores data in a simplified RRULE-compatible format. Supported patterns:

- **FREQ=DAILY** — due every day
- **FREQ=DAILY;INTERVAL=N** — due every N days, calculated from the routine's created_at date
- **FREQ=WEEKLY;BYDAY=MO,WE,FR** — due on specific days of the week (using two-letter day codes)
- **FREQ=MONTHLY;BYMONTHDAY=1,15** — due on specific days of the month

This utility must account for the user's timezone. Convert "today" to the user's local date before evaluating. This is the single most important pure function in the app and must be unit tested thoroughly.

**User Interactions**

- **Pull to refresh**: Reloads all dashboard data (today's routines, completions, skin logs, streak).
- **Tap routine card**: Navigates to the Routine Execution screen for that routine, passing the routine_id as a route parameter.
- **Tap "Log Skin Today" card**: Navigates to the Skin Log Entry screen. If a log already exists for today, navigates to it in edit mode.
- **Tap streak counter**: Shows a bottom sheet with a streak calendar visualization (last 30 days, with dots for completed days).
- **Tap user avatar**: Navigates to the Profile tab.
- **Tap mini skin chart**: Navigates to the Log tab, which will show the full history.

**Layout Specification**

The screen scrolls vertically with these sections in order:

1. **Greeting header**: Left-aligned "Good morning/afternoon/evening, {display_name}" with the appropriate greeting based on the user's local time. Right-aligned circular avatar image (40x40pt) linked to profile. If no avatar, show initials in a colored circle.

2. **Streak card**: A prominent card spanning full width showing the current streak count as a large number, the label "day streak" below it, and a flame or sparkle icon. The streak is calculated as the number of consecutive days (going backwards from yesterday) where at least one routine_completion exists. Today does not count toward the streak until at least one routine is completed today. If the streak is zero, show an encouraging message like "Start your streak today!" instead of a zero.

3. **Today's routines section**: Section header "Today's Routines". Below it, one card per routine that is due today. Each card shows: the routine name, the time_of_day as a badge ("AM" in a warm color, "PM" in a cool color), the number of steps (e.g., "5 steps"), and a completion status indicator. If the routine is already completed today, show a checkmark overlay and muted styling. If partially completed, show a progress bar. If not started, show a "Start" button. If no routines are due today, show a message "No routines scheduled for today" with a button to create one.

4. **Quick log card**: A card prompting the user to log their skin today. If already logged, shows today's overall score with a small face emoji (1=sad, 5=glowing) and the label "Logged today ✓". If not logged, shows "How's your skin today?" with a tap target to start logging.

5. **Weekly mini chart**: A small bar or line chart showing the last 7 days of overall skin scores. Each day shows as a small vertical bar colored from red (1) to green (5). Days without logs show as gray dots. Label the x-axis with abbreviated day names (Mon, Tue, etc.). This chart is informational only — detailed charts are in EP3's Skin Story Dashboard.

**API Calls**

All data loading should happen in parallel on mount. Use Promise.all or equivalent to fetch:
- Today's applicable routines (query routines where is_active is true, then filter client-side by evaluating recurrence rules against today's date in the user's timezone)
- Today's routine_completions (query where date equals today in user's timezone)
- Routine steps for each applicable routine (query routine_steps joined with products for the relevant routine_ids)
- Skin logs for the last 7 days (query skin_logs where date is between 7 days ago and today)
- Streak data (query routine_completions ordered by date descending, counting consecutive days)

**State Management**

This screen consumes from both ShelfContext (not directly, but indirectly through routine step product names) and RoutineContext (today's routines and completions). The RoutineContext should be the source of truth for "is this routine complete today?" so that when the user returns from Routine Execution having completed a routine, the dashboard updates immediately without a re-fetch.

The streak calculation should also live in RoutineContext as a derived value. It recomputes whenever routine_completions data changes.

**Edge Cases**

- **New user with no routines**: Show an illustrated empty state with the message "Welcome to GlowLog! Start by adding products to your shelf, then build your first routine." Include a button linking to the Shelf tab.
- **User in a different timezone than their device**: Use the timezone stored in the user's profile (set during onboarding or settings). If it differs from the device timezone, show a subtle banner noting the discrepancy.
- **Streak grace period**: If the user's timezone changed (travel), allow a 26-hour window (instead of strict 24-hour midnight-to-midnight) before breaking a streak. Implement this in the streak calculation utility.
- **Data loading failure**: Show a full-screen error state with a retry button. Individual section failures should degrade gracefully (e.g., if skin_logs fail to load, still show routines).
- **Many routines due today**: If more than 4 routines are due, the section should scroll. This is unlikely for most users but should not break the layout.

---

## Screen 2: Product Shelf

**Purpose**

The Product Shelf is the user's personal inventory of skincare products they own. It serves as the source from which routines are built. Products must be on the shelf before they can be added to a routine. The shelf is designed for quick scanning — users should be able to find any product in under 3 seconds.

**Data Model**

Reads from the **products** table. Each product row has: id (UUID), user_id (UUID), name (text), brand (text), product_type (text), barcode (text, nullable), ingredients (jsonb — array of strings), image_url (text, nullable — path in Supabase Storage or external URL), is_archived (boolean, default false), notes (text, nullable), created_at (timestamptz), updated_at (timestamptz).

The shelf only shows products where is_archived is false. Archived products are hidden but preserved because they may be referenced in historical routine_completions and skin_logs for the Skin Story correlation engine.

**User Interactions**

- **Search bar at top**: Filters the displayed products locally (no network request) by matching the query against product name, brand, and product_type. Debounce at 300ms.
- **Sort control**: A segmented control or dropdown allowing sort by: "Recently Added" (created_at descending, default), "Name A-Z", "Product Type", "Most Used" (requires a count of routine_steps referencing each product_id).
- **View toggle**: Switch between grid view (2 columns, showing product image/icon, name, and brand) and list view (full-width rows with more detail including ingredient count and product type).
- **Tap a product card**: Navigates to the Product Detail screen, passing the product_id.
- **Floating Action Button**: A prominent "+" button in the bottom-right corner. Tapping it navigates to the Add Product screen.
- **Swipe left on a product (list view)**: Reveals an "Archive" action. Tapping archive sets is_archived to true and removes the product from the visible shelf with an animation. Show a brief undo snackbar at the bottom for 5 seconds.
- **Long press a product**: Opens a context menu with options: "Edit", "Archive", "View in Routines" (navigates to routines that use this product).

**Layout Specification**

1. **Header area**: Screen title "My Shelf" with a product count badge (e.g., "23 products"). Below the title, a search input with a magnifying glass icon and placeholder "Search products...". Below the search, a row containing the sort dropdown on the left and the grid/list view toggle on the right.

2. **Product grid/list**: The main content area. In grid view, display products in a 2-column grid. Each grid cell shows: a square product image (or a colored placeholder with the product type icon if no image exists), the product name (max 2 lines, truncated), and the brand in smaller muted text. In list view, each row shows: a small square product image on the left, then the product name and brand, the product_type as a colored chip, and the ingredient count (e.g., "32 ingredients") on the right.

3. **FAB**: Circular floating action button with a "+" icon, positioned in the bottom-right corner with a 16pt margin from edges, sitting above the tab bar.

4. **Empty state**: When the user has zero products, show a centered illustration (a simple shelf graphic), the heading "Your shelf is empty", body text "Add your first skincare product to get started", and a prominent "Add Product" button.

**API Calls**

- On mount, query products table where is_archived is false, ordered by created_at descending. This populates the ShelfContext.
- For "Most Used" sort, run a separate query that counts routine_steps grouped by product_id, then join with the product data client-side.
- Archive operation: update the products table setting is_archived to true for the given product_id.
- Undo archive: update is_archived back to false (the snackbar action triggers this).

**State Management**

The product list lives in ShelfContext and is the single source of truth. When a product is added (from the Add Product screen), the ShelfContext appends it. When archived, the ShelfContext removes it from the visible list. Other screens (Routine Builder) read from ShelfContext to display available products.

Local state on this screen: search query string, sort selection, view mode (grid/list), and the "undo archive" snackbar visibility with the archived product_id.

**Edge Cases**

- **Large shelf (100+ products)**: Use a FlatList with proper keyExtractor and getItemLayout for performance. Do not render all items at once.
- **Product with no image**: Show a styled placeholder using the product_type to determine an icon (e.g., a droplet for serum, a jar for moisturizer, a tube for cleanser). Use the brand's first letter as a fallback within a colored circle.
- **Product with no ingredients**: This is valid (user may add ingredients later). Show "No ingredients listed" in muted text. The product can still be added to routines.
- **Search with no results**: Show "No products match '{query}'" with a suggestion to check spelling or add a new product.
- **Offline**: If the Supabase query fails, attempt to show cached data from the last successful fetch (store the product list in AsyncStorage as a fallback cache).

---

## Screen 3: Add Product

**Purpose**

This screen is the gateway for getting products onto the user's shelf. It supports three entry paths in order of preference: barcode scanning (fastest), searching the global Algolia product index (for products without barcodes or when scanning fails), and manual entry (always available as the last resort). The design philosophy is "never block the user" — if one path fails, the next is always immediately available.

**Data Model**

Writes to the **products** table. The new product record will contain: user_id (from auth session), name, brand, product_type, barcode (if scanned), ingredients (jsonb array — may be empty if user skips), image_url (nullable), is_archived (false), notes (nullable).

**User Interactions — Entry Path Selection**

The screen opens with three large tappable option cards stacked vertically:

1. **"Scan Barcode"** — icon of a barcode scanner, subtitle "Fastest way to add a product". Tapping opens the camera scanner.
2. **"Search Products"** — icon of a magnifying glass, subtitle "Find by name or brand". Tapping reveals the Algolia search interface.
3. **"Enter Manually"** — icon of a pencil, subtitle "Type in product details yourself". Tapping reveals the manual entry form.

After any path produces a result, the user lands on a **confirmation/edit form** that shows all the product details pre-populated (or empty for manual entry) and lets them review and modify before saving.

**Entry Path 1: Barcode Scan**

- Use expo-camera in barcode scanning mode (NOT expo-barcode-scanner, which is removed in SDK 52). Configure the camera to scan EAN-13, EAN-8, UPC-A, and UPC-E barcode types, which cover virtually all retail skincare products.
- Display a full-screen camera viewfinder with a rectangular scan area overlay in the center. Show instructional text above the viewfinder: "Point camera at barcode". Include a flashlight toggle button and a "Cancel" button.
- When a barcode is detected, immediately dismiss the camera, show a loading indicator with the text "Looking up product...", and invoke the **lookup-product** Edge Function with the scanned barcode string.
- If the Edge Function returns found as true, pre-populate the confirmation form with the returned product data (name, brand, ingredients). Show a success banner "Product found!".
- If the Edge Function returns found as false, show a screen with three options: "Take a photo of the label" (triggers GPT-5 Vision extraction — see below), "Search by name instead" (switches to Algolia search with the brand field focused), or "Enter manually" (opens the manual form). Do NOT show an error — frame it as "We couldn't find this barcode in our database. Try one of these options instead."
- Store the scanned barcode value regardless of lookup success, so it is saved with the product for future barcode-scan matches.

**Entry Path 1b: GPT-5 Vision Label Fallback**

- If barcode lookup fails and the user taps "Take a photo of the label", open expo-camera in photo mode (not barcode mode).
- Instruct the user: "Take a clear photo of the ingredient list on the back of the product". Show a framing guide overlay.
- After the photo is captured, compress it using expo-image-manipulator (max width 1200px, JPEG quality 80%).
- Upload the compressed image to Supabase Storage in a temporary folder (temp/{user_id}/{timestamp}.jpg).
- Invoke a new Edge Function called **extract-label** (create this function). This function retrieves the image, encodes it, sends it to GPT-5.4 with vision capability (model identifier as specified in the tech versions), with a system prompt instructing it to: "Extract the following from this skincare product label image: product name, brand name, and the complete ingredient list. Return as JSON with fields: name (string), brand (string), ingredients (array of strings). If you cannot read a field, set it to null." Parse the JSON response and return it.
- Pre-populate the confirmation form with the extracted data. Show a warning banner: "Extracted from photo — please verify the details are correct."
- If GPT-5 Vision fails or cannot read the label, show a friendly message and transition to the manual entry form.
- This feature should be marked as a potential future Pro-only gate (add a comment in the code) but is free at MVP.

**Entry Path 2: Algolia Search**

- Display a search input at the top with placeholder "Search by product name or brand...". Below it, show facet filter chips for product_type (All, Cleanser, Toner, Serum, etc.).
- As the user types, query the Algolia **products** index in real-time (debounced at 300ms). Display results in a FlatList. Each result row shows: product name (with search term highlighted using Algolia's _highlightResult), brand, product_type chip, and ingredient count.
- Tapping a search result pre-populates the confirmation form with that product's data from Algolia.
- If no results found, show "No products found for '{query}'" with a link to manual entry.

**Entry Path 3: Manual Entry**

- Show the confirmation/edit form immediately but with all fields empty.
- All fields are editable. The ingredients field is a large multiline text input with the placeholder "Paste or type the full ingredient list, separated by commas". The app parses this into an array when saving.

**Confirmation/Edit Form (All Paths Converge Here)**

Form fields in order:
- **Product Name** (required, text input)
- **Brand** (required, text input)
- **Product Type** (required, dropdown/picker with options: cleanser, toner, essence, serum, treatment, moisturizer, sunscreen, exfoliant, mask, oil, eye_cream, other)
- **Barcode** (optional, text input — pre-filled if scanned, editable)
- **Ingredient List** (optional but encouraged, multiline text input — pre-filled if found, editable). Below the input, show a count of parsed ingredients: "32 ingredients detected".
- **Product Photo** (optional, tappable image area — "Add Photo" to open ImagePicker, which offers camera or library). Photos are compressed via expo-image-manipulator (max 800px width, JPEG quality 70%) and uploaded to Supabase Storage at product-images/{user_id}/{product_id}.jpg.
- **Notes** (optional, text input — for personal notes like "bought at Sephora" or "sample size")

At the bottom, a prominent "Add to Shelf" button (disabled until name, brand, and product_type are filled). Tapping it:
1. Parses the ingredient list text into a JSON array (split by commas, trim whitespace, normalize to lowercase).
2. Inserts a new row into the products table.
3. If an image was selected, uploads it to Supabase Storage and updates the product's image_url field with the storage path.
4. If the product has ingredients and a barcode that was not in Algolia, indexes the product in Algolia for future searchability.
5. Updates ShelfContext with the new product.
6. Shows a brief success animation and navigates back to the Product Shelf screen.

**API Calls**

- Supabase Edge Function: **lookup-product** (barcode scan path)
- Supabase Edge Function: **extract-label** (GPT-5 Vision fallback path — create this)
- Algolia: index.search(query, { filters, facetFilters }) for search path
- Supabase Storage: upload for product photos
- Supabase DB: insert into products table
- Algolia Admin: addObject to index new manual-entry products that have ingredients

**State Management**

Local state only — this is a form screen. Track: current entry path (scan/search/manual), scanned barcode value, Algolia search query and results, form field values (name, brand, type, barcode, ingredients text, photo URI, notes), form validation errors, loading states for barcode lookup and Vision extraction, and submission loading state.

On successful submission, update ShelfContext to include the new product.

**Edge Cases**

- **Camera permission denied**: Show a message explaining why camera access is needed with a button to open device settings. Fall back to search and manual entry.
- **Barcode scans but lookup returns garbage data**: The confirmation form lets the user correct any field. The user is always the final authority on product data.
- **Duplicate product**: Before inserting, check if a product with the same name AND brand already exists on the user's shelf. If so, show a dialog: "You already have {name} on your shelf. Add another or view existing?"
- **Very long ingredient list**: Some products have 50+ ingredients. The ingredients text input should be scrollable and the parsed array should handle up to 200 items without performance issues.
- **Network offline during barcode lookup**: Detect the failure and immediately offer search and manual entry paths. Do not show a spinner indefinitely.
- **User cancels mid-flow**: Navigating back from the confirmation form should discard unsaved data. If they've entered substantial data (more than just a name), show a confirmation dialog before discarding.

---

## Screen 4: Product Detail

**Purpose**

The Product Detail screen is the information hub for a single product. It shows everything the user needs to know: what the product is, what's in it, which routines use it, and whether any of its ingredients conflict with their other products. The ingredient tap-to-explain feature powered by Claude is a key differentiator of GlowLog.

**Data Model**

Reads from:
- **products** table: the full product record for the given product_id.
- **routine_steps** table joined with **routines** table: to show which routines include this product.
- **ingredient_conflicts.json** (bundled asset): for on-device conflict checking against the user's other products.
- Claude API via **explain-ingredient** Edge Function: for individual ingredient explanations.
- Claude API via **analyze-ingredients** Edge Function: for conflict details between this product and others on the shelf.

**User Interactions**

- **Scroll through product info**: The screen scrolls vertically through all sections.
- **Tap an ingredient chip**: Opens a bottom sheet showing the Claude-generated explanation for that ingredient. While loading, show a skeleton placeholder in the bottom sheet. The bottom sheet displays: the ingredient's common name, what it does, which skin types it benefits, cautions, pairs well with, and avoid with.
- **Tap "View Conflicts" on a conflict card**: Expands the card to show the full AI-generated explanation, or navigates to the Ingredient Conflict Guide (EP3) if available.
- **Tap a routine name in "Used In" section**: Navigates to the Routine Builder for that routine in edit mode.
- **Tap "Edit" button in header**: Transforms the screen into edit mode (or navigates to the Add Product screen in edit mode with the product data pre-populated). Fields become editable. Save button replaces Edit.
- **Tap "Archive" in the overflow menu**: Archives the product (same flow as shelf swipe-to-archive with undo snackbar).
- **Share button**: Generates a text summary of the product and its ingredients, shareable via the system share sheet.

**Layout Specification**

1. **Hero section**: Product image (large, taking up roughly 40% of screen height) with a gradient overlay at the bottom. If no image, show a large styled placeholder with the product type icon. Over the gradient, display the product name in bold white text and the brand below it. An "Edit" button (pencil icon) in the top-right corner. A back arrow in the top-left.

2. **Product meta section**: Below the hero. Shows product_type as a colored chip, the barcode number (if present) in small muted text, and the date added ("Added 3 weeks ago").

3. **Ingredient list section**: Section header "Ingredients" with the count (e.g., "32 ingredients"). Display ingredients as tappable chips in a flowing/wrapping layout. Each chip shows the ingredient name. If the ingredient is involved in a known conflict with another product on the user's shelf, the chip has a warning-colored border (orange for medium severity, red for high). Tapping any chip invokes the explain-ingredient Edge Function and opens the explanation bottom sheet.

4. **Conflicts section**: Section header "Potential Conflicts". This section appears only if conflicts exist between this product's ingredients and ingredients in other products on the user's shelf. For each conflict, show a card with: the conflicting ingredient from this product, the conflicting ingredient from the other product, the other product's name, severity badge (High/Medium/Low), and a short description from the bundled conflict data. If the user is on Pro (or during MVP where AI is free), show the Claude-generated detailed explanation. If no conflicts exist, show a reassuring message: "No conflicts detected with your other products ✓".

5. **Used in routines section**: Section header "Used In". List each routine that includes this product as a step. Each row shows the routine name, time_of_day badge, and the step number (e.g., "Step 3 of 5"). If the product is not in any routine, show "Not in any routine yet" with a button "Add to a Routine".

6. **Notes section**: If the product has user notes, display them. An "Add Note" or "Edit Note" link.

**API Calls**

- On mount: fetch the product record from Supabase by product_id.
- On mount (parallel): fetch routine_steps where product_id matches, joined with routines for name and time_of_day.
- On mount (parallel): run on-device conflict detection — load the user's full product shelf from ShelfContext, iterate through all other products' ingredient lists, compare against the bundled ingredient_conflicts.json. This is a synchronous CPU operation that should complete in under 50ms for typical shelf sizes (under 50 products).
- On ingredient chip tap: invoke the **explain-ingredient** Edge Function. This is lazy-loaded (not pre-fetched for all ingredients).
- If conflicts are detected and AI enrichment is desired: invoke **analyze-ingredients** Edge Function with this product and the conflicting products. This call can be deferred — show the on-device conflict data immediately and load the AI explanation asynchronously.

**State Management**

Local state: the product data object, the list of routines using this product, the computed conflicts array, the currently selected ingredient (for the bottom sheet), the ingredient explanation data (loaded lazily), edit mode toggle.

Consumes ShelfContext to access the full product shelf for conflict detection.

**Edge Cases**

- **Product has no ingredients**: Hide the ingredients section entirely. Show a prompt: "Add ingredients to get conflict detection and AI analysis" with an "Edit" button.
- **Product has been archived but is accessed via deep link or routine**: Show the product normally but with a banner "This product has been archived" and an "Unarchive" button.
- **Claude rate limit hit on ingredient explanation**: Show a fallback message in the bottom sheet: "Explanation temporarily unavailable. Try again in a few minutes." Log to Sentry.
- **Ingredient not recognized by Claude**: Claude should still return a best-effort explanation. If it explicitly says it cannot identify the ingredient, show "This ingredient isn't in our database yet" in the bottom sheet.
- **Many conflicts detected (5+)**: Show the top 3 sorted by severity, with a "Show all conflicts" expander.
- **Stale conflict data after shelf changes**: When ShelfContext updates (product added or archived), re-run the conflict detection on this screen if it's currently mounted.

---

## Screen 5: Routine Builder

**Purpose**

The Routine Builder is where users create and edit their skincare routines. It pulls products from the user's shelf, lets them arrange the order, suggests optimal layering, detects ingredient conflicts, and sets up the schedule for recurring reminders. This is the most complex screen in EP2 and the heart of GlowLog's value proposition.

**Data Model**

Writes to:
- **routines** table: creates or updates a routine record with fields: user_id, name (text), time_of_day (text — "AM" or "PM"), recurrence (text — RRULE string), timezone (text), is_active (boolean, default true).
- **routine_steps** table: creates step records linking products to the routine. Fields: routine_id, product_id, step_order (integer starting from 1), notes (text, nullable — e.g., "wait 2 minutes before next step").

Reads from:
- **products** table (via ShelfContext): to display available products for selection.
- **analyze-ingredients** Edge Function: for conflict detection and layering suggestions.
- **ingredient_conflicts.json** (bundled): for instant on-device conflict flagging.

**User Interactions**

The screen has two phases: **Building** (selecting and ordering products) and **Scheduling** (setting when the routine runs).

**Phase 1: Building**

- **Routine name input**: At the top, a text input for the routine name with placeholder "e.g., Morning Glow Routine". Required.
- **AM/PM toggle**: A prominent segmented control directly below the name. Selecting AM or PM.
- **Product selection area**: Below the toggle, a section labeled "Steps" with an "Add Product" button. Tapping "Add Product" opens a bottom sheet showing all products from the user's shelf, organized by product_type sections (Cleansers, Toners, Serums, etc.). Each product in the bottom sheet shows its name, brand, and a checkmark if already added to this routine. Tapping a product adds it to the routine steps list and dismisses the sheet. If the shelf is empty, the bottom sheet shows "No products on your shelf yet" with a button to navigate to Add Product.
- **Step list with drag-and-drop**: Added products appear in a vertical list, each row showing: a drag handle on the left, the step number, the product name and brand, the product type as a small chip, and a remove button (X) on the right. Users can press and hold the drag handle to reorder steps using React Native Reanimated for smooth drag animations. The step_order values update to reflect the visual order.
- **Auto-suggest layering button**: A button labeled "Auto-Order" or "Suggest Order" above the step list. Tapping it reorders the steps according to the standard skincare layering convention based on product_type: cleanser first, then toner, essence, serum, treatment, moisturizer, sunscreen last. Oil-based products slot before moisturizer. Eye cream slots before moisturizer. This is a client-side sorting function — no AI needed.
- **Wait step insertion**: Between any two product steps, the user can tap a small "+" icon that appears in the gap to insert a wait step (e.g., "Wait 2 minutes for Vitamin C to absorb"). Wait steps are stored as notes on the preceding routine_step record.
- **Conflict detection**: After the user has added 2+ products, run the on-device ingredient conflict check. If conflicts are found, show inline warning cards between the conflicting steps. Each warning shows: an orange or red warning icon, the two conflicting ingredients, and a short description. Also show a button "Get AI Analysis" that invokes the analyze-ingredients Edge Function for detailed explanations and reordering suggestions.
- **AI layering analysis**: When the user taps "Get AI Analysis" (or automatically on save if conflicts exist), invoke the analyze-ingredients Edge Function with all products in the routine. Display the results in a modal or expandable section: Claude's suggested order (with option to apply it), detailed conflict explanations, and general layering notes. The user can tap "Apply Suggested Order" to reorder their steps to match Claude's recommendation, or dismiss and keep their custom order.

**Phase 2: Scheduling**

Below the steps section, a "Schedule" section with:

- **Recurrence selector**: A set of tappable chips: "Daily", "Every Other Day", "Specific Days", "Custom". Selecting "Daily" sets recurrence to "FREQ=DAILY". Selecting "Every Other Day" sets "FREQ=DAILY;INTERVAL=2". Selecting "Specific Days" reveals a row of 7 day-of-week toggles (M T W T F S S); the selected days form the BYDAY parameter (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR"). Selecting "Custom" reveals a numeric input for interval days ("Every __ days") which sets "FREQ=DAILY;INTERVAL={n}".
- **Reminder time picker**: A time picker allowing the user to set when they want to be reminded. Default: 7:00 AM for AM routines, 9:00 PM for PM routines.
- **Timezone display**: Shows the user's current timezone (from their profile) with a small "Change" link that opens a timezone picker. This is stored on the routine record.

**Save Flow**

When the user taps "Save Routine":
1. Validate: name is not empty, at least one product step exists, schedule is selected.
2. If editing an existing routine, update the routines record and delete/re-insert routine_steps (simpler than diffing).
3. If creating new, insert the routines record, then insert all routine_steps with sequential step_order values.
4. Schedule local notifications using Expo Notifications. Calculate the next N notification dates (up to 30 days ahead) based on the recurrence rule and reminder time. Schedule each as a local notification with the title "Time for {routine_name}" and body listing the first 2-3 product names. Store the notification identifiers so they can be cancelled if the routine is edited or deleted.
5. Update RoutineContext to include the new/modified routine.
6. Navigate back to the Routines tab with a success message.

**API Calls**

- Reads ShelfContext (no network call needed — products already loaded).
- On-device conflict detection: synchronous, using bundled ingredient_conflicts.json against the selected products' ingredient arrays.
- Edge Function: **analyze-ingredients** — invoked on user request ("Get AI Analysis") or on save if conflicts exist. Sends all selected products with their ingredients.
- Supabase DB: insert/update routines table, delete + insert routine_steps.
- Expo Notifications: schedule local notifications based on recurrence data.

**State Management**

Local state (this is a complex form):
- routine_name (string)
- time_of_day ("AM" or "PM")
- steps (array of objects, each with: product_id, product reference from ShelfContext, step_order, notes)
- recurrence_type ("daily", "every_other", "specific_days", "custom")
- recurrence_days (array of day codes for "specific_days" type)
- custom_interval (number for "custom" type)
- reminder_time (Date object — hours and minutes)
- timezone (string)
- conflicts (array of conflict objects — computed after product selection changes)
- ai_analysis (the response from analyze-ingredients, nullable)
- is_loading_ai (boolean)
- is_saving (boolean)

Autosave the form to AsyncStorage every 30 seconds so the user doesn't lose progress if the app crashes. On mount, check for a saved draft and offer to restore it.

**Edge Cases**

- **User tries to add the same product twice**: Prevent duplicates. Show a toast "This product is already in your routine."
- **User has no products on shelf**: The "Add Product" bottom sheet should prominently link to the Add Product screen. Do not let the user save a routine with zero steps.
- **Conflict detection with missing ingredients**: If a product has no ingredients (empty array), it cannot have conflicts. Skip it in the conflict check and show a note: "{Product name} has no ingredient data — conflict check unavailable."
- **AI analysis timeout**: Set a 15-second timeout on the analyze-ingredients call. If it times out, show "AI analysis took too long. Your routine has been saved with the on-device conflict data." The routine can still be saved.
- **Editing an existing routine**: Pre-populate all form fields from the existing routine and its steps. The save flow should update (not duplicate) the existing records.
- **Deleting a routine**: Available via a "Delete Routine" button in the overflow menu when editing. This deletes the routine and its steps, cancels all associated notifications, and removes it from RoutineContext. Show a confirmation dialog first. Note: routine_completions historical records are preserved for Skin Story.
- **Very many steps (15+ products)**: Unlikely but possible. The drag-and-drop list must remain performant. Use Reanimated's layout animations efficiently.

---

## Screen 6: Routine Execution

**Purpose**

Routine Execution is the daily interaction screen — it guides the user through their routine step by step, making the process feel satisfying and trackable. Completing a routine feeds the streak counter and provides data for Skin Story correlations. The experience should feel like checking off a to-do list with delightful micro-interactions.

**Data Model**

Reads from:
- **routines** table: the routine record for context (name, time_of_day).
- **routine_steps** table joined with **products**: to build the step list with product details.

Writes to:
- **routine_completions** table: a single record per routine per day with fields: id (UUID), routine_id, user_id, date (date type — today in user's timezone), completed_steps (jsonb — array of product_ids that were completed), skipped_steps (jsonb — array of product_ids that were skipped), started_at (timestamptz), completed_at (timestamptz, nullable — set when all steps are done or user taps "Finish").

**User Interactions**

- **Step-by-step checklist**: The screen displays each routine step as a large card in a vertical scrollable list. Each card shows: the step number, the product name and brand, the product type chip, and a prominent checkbox or circular tap target on the right side.
- **Tap to complete a step**: Tapping the checkbox marks the step as complete. The card animates: the checkbox fills with a checkmark, the card slightly reduces opacity or gets a green-tinted overlay, and a subtle haptic feedback fires (use expo-haptics with a "light" impact). The step remains visible but appears visually "done".
- **Skip a step**: A small "Skip" text link below the checkbox. Tapping it marks the step as skipped — the card gets a different visual treatment (e.g., strikethrough text, gray background) to differentiate from completed. Skipped steps are tracked separately.
- **Wait timer**: If a step has notes containing a wait instruction (e.g., "Wait 2 minutes"), display a "Start Timer" button after completing that step. Tapping it starts a countdown timer that appears as a sticky element between the current and next step. The timer shows minutes and seconds counting down. When it completes, a notification sound plays and the next step pulses to draw attention.
- **Undo last action**: A subtle "Undo" link appears for 5 seconds after any step is completed or skipped, allowing the user to reverse the action.
- **Finish routine**: When all steps are either completed or skipped, show a completion screen with a congratulatory animation (confetti, glowing icon, or expanding checkmark). The animation should last 2-3 seconds. Below it, show a summary: "X steps completed, Y steps skipped, took Z minutes". Include buttons: "Log Your Skin" (navigates to Skin Log Entry) and "Done" (returns to Home Dashboard).
- **Partial completion**: The user can leave the screen before completing all steps. If they've completed at least one step, prompt: "Save progress? You've completed X of Y steps." If they save, write the completion record with whatever steps are done so far. If they return later (same day), resume from where they left off.

**Layout Specification**

1. **Header**: The routine name as the title, the time_of_day badge (AM/PM), a progress indicator showing "3 of 7 steps complete" as both text and a thin progress bar spanning the full width below the header. A close/X button to exit.

2. **Step cards**: Vertically scrollable list. Each card is full-width with generous padding. Left side shows the step number in a circle (filled green when complete, gray when pending, crossed out when skipped). Center shows the product name (large text), brand (smaller text below), and product type chip. Right side shows the tap-to-complete circle. Below the main card content, the optional notes for that step (e.g., "Apply to damp skin" or the wait timer trigger).

3. **Timer overlay**: When a wait timer is active, it appears as a card between two steps, showing a circular countdown animation and the remaining time. A "Skip Timer" button allows bypassing the wait.

4. **Completion screen**: Replaces the step list when all steps are addressed. Centered animation, summary text, and action buttons.

**API Calls**

- On mount: fetch the routine record and its steps (joined with products) for the given routine_id. Also fetch any existing routine_completion for this routine_id and today's date — if one exists, pre-populate the completed/skipped steps to support resume.
- On step complete/skip: write to the routine_completions table. Use an upsert pattern: if a completion record already exists for this routine_id and today's date, update it (append to completed_steps or skipped_steps). If not, insert a new record.
- On finish: set the completed_at timestamp on the completion record.
- After completion: update RoutineContext to reflect the new completion (for the Home Dashboard streak counter).

**State Management**

Local state: the routine data (name, time_of_day), the ordered steps array with product details, a map of step statuses (pending/completed/skipped) keyed by product_id, the timer state (is_running, seconds_remaining, associated_step), started_at timestamp, and the completion screen visibility flag.

RoutineContext is updated when the routine is completed so the Home Dashboard reflects the change immediately upon navigating back.

**Edge Cases**

- **Routine was already completed today**: If the user navigates to execute a routine that already has a completion record for today, show the completion summary screen immediately with a note "You already completed this routine today" and an option to "Do it again" (which creates a second completion record — useful for double-cleansing scenarios).
- **Routine has been modified since last execution**: If products were added/removed from the routine since it was last executed, the step list should reflect the current configuration. Do not carry over stale step data.
- **App crashes mid-execution**: Because each step completion writes to the database immediately (upsert pattern), progress is preserved. On relaunch, the screen resumes at the correct point.
- **Zero steps remaining (all completed/skipped)**: Automatically transition to the completion screen.
- **Timer running when app backgrounds**: Use expo-notifications to schedule a local notification for when the timer would expire, so the user gets alerted even if they switch apps.
- **Step product was archived**: Show the step normally with a small note "This product has been archived". The user can still complete or skip the step.

---

## Screen 7: Skin Log Entry

**Purpose**

The Skin Log Entry screen captures daily skin condition data that powers the Skin Story correlation engine (EP3). It is designed for speed — a user should be able to complete a log in under 30 seconds. The log captures both quantitative data (sliders) and qualitative data (notes and photos).

**Data Model**

Writes to:
- **skin_logs** table: a single record per day. Fields: id (UUID), user_id, date (date type — defaults to today, can be backdated), overall (integer 1-5), breakout (integer 1-5), dryness (integer 1-5), redness (integer 1-5), oiliness (integer 1-5), notes (text, nullable), created_at (timestamptz), updated_at (timestamptz).
- **progress_photos** table: optional, linked to the skin_log. Fields: id (UUID), user_id, skin_log_id (foreign key, nullable), photo_path (text — Supabase Storage path), taken_at (timestamptz), notes (text, nullable).

**User Interactions**

- **Date selector**: At the top, shows "Today, {formatted date}" with a small calendar icon. Tapping it opens a date picker that allows selecting any date in the past 30 days (cannot log future dates). This supports backdating for users who forgot to log yesterday.
- **Condition sliders**: Five horizontal sliders, each ranging from 1 to 5. Each slider has a label, the current value displayed as a number, and semantic labels at the extremes:
  - **Overall**: 1 = "Bad day" ↔ 5 = "Great day" (with emoji faces: 😣 to 😊)
  - **Breakout**: 1 = "Clear" ↔ 5 = "Severe" (note: higher is worse here)
  - **Dryness**: 1 = "Hydrated" ↔ 5 = "Very dry"
  - **Redness**: 1 = "None" ↔ 5 = "Very red"
  - **Oiliness**: 1 = "Matte" ↔ 5 = "Very oily"
  
  Default all sliders to 3 (neutral). Sliders should have distinct step markers at each integer position and snap to integer values. Use haptic feedback (expo-haptics, light impact) when the slider snaps to a new value.

- **Notes field**: A multiline text input below the sliders with placeholder "Any notes? (products that irritated, stress, sleep, diet, etc.)". Optional. No character limit displayed but capped at 1000 characters.

- **Progress photo**: An "Add Photo" button that opens a bottom sheet with "Take Selfie" (front camera) and "Choose from Library" options. When a photo is selected, compress it using expo-image-manipulator (max width 1200px, JPEG quality 80%), display a thumbnail preview with a remove button. Multiple photos are supported (up to 3 per log).

- **Save button**: A prominent button at the bottom labeled "Save Log". On tap:
  1. Validate that at least the overall slider has been moved from default (or allow saving with all defaults — user's choice).
  2. Upsert the skin_logs record: if a log for this date already exists, update it; if not, insert new.
  3. Upload any selected photos to Supabase Storage at the path progress-photos/{user_id}/{date}/{filename}.jpg.
  4. Insert progress_photos records linking to the skin_log_id and containing the storage path.
  5. Show a brief success animation (checkmark) and navigate back to the previous screen (Home Dashboard or Log tab).

**Layout Specification**

1. **Header**: "Log Your Skin" title with a close/back button. The date selector directly below.

2. **Overall score section**: The overall slider is larger and more prominent than the others — this is the most important metric. Show the current value as a large emoji face that changes expression as the slider moves.

3. **Detail sliders section**: The four remaining sliders (breakout, dryness, redness, oiliness) in a section labeled "Details (optional)". These are slightly smaller than the overall slider. Collapsible — the section starts expanded but can be collapsed to just the header if the user wants to speed through.

4. **Notes section**: The text input.

5. **Photo section**: Section labeled "Progress Photo (optional)". Photo thumbnails in a horizontal row with an "Add" button. Each thumbnail has a small X to remove.

6. **Save button**: Fixed at the bottom of the screen (not scrolling), always visible. Disabled state while uploading photos.

**API Calls**

- On mount: check if a skin_log already exists for the selected date. If so, pre-populate all sliders and notes for editing. Also load any existing progress_photos for that log.
- On date change: repeat the above check for the newly selected date.
- On save: upsert to skin_logs table. If photos are present, upload to Supabase Storage and insert progress_photos records.
- Photo upload: use supabase.storage.from('progress-photos').upload(path, file) with the content type set to image/jpeg.

**State Management**

Local state: selected_date (Date object), overall (integer), breakout (integer), dryness (integer), redness (integer), oiliness (integer), notes (string), photo_uris (array of local URIs), existing_log_id (UUID or null — for edit mode), is_saving (boolean), photo_upload_progress (for each photo).

No context updates needed — the Skin Log data is read by the Home Dashboard via direct queries, not a shared context.

**Edge Cases**

- **Editing an existing log**: If the user already logged today and taps "Log Skin Today" from the dashboard, load the existing log in edit mode. The save button should say "Update Log" instead of "Save Log".
- **Backdating to a date with an existing log**: Same as above — load the existing log for that date and allow editing.
- **Photo upload fails**: If one photo fails to upload, save the skin_log record anyway (the log is valuable even without photos). Show a toast: "Log saved but one photo failed to upload. You can try again from the Log tab." Store the failed photo URI locally for retry.
- **User changes date after modifying sliders**: If the user changes the date after moving sliders, check if the new date has an existing log. If so, ask: "Load existing log for this date? Your current changes will be lost." If not, keep the current slider values.
- **Large photos**: Always compress before upload. If the original file is over 10MB (possible with modern iPhone cameras), show a brief "Compressing..." indicator.
- **No camera permission for selfie**: Fall back to library-only option. Show a message about enabling camera access in settings.
- **Storage bucket full**: Extremely unlikely at MVP scale, but handle the upload error gracefully. Save the log without the photo and inform the user.

---

## Expo Notifications Wiring

After all screens are built, wire up the notification system that connects Routine Builder schedules to actual push notifications.

**Notification Scheduling Logic**

Create a utility module (e.g., lib/notifications.ts) that exports these functions:

- **scheduleRoutineReminders(routine)**: Takes a routine object (with recurrence, time_of_day, reminder time, timezone, and name). Calculates the next 30 days of dates when this routine is due (using the same recurrence evaluation utility from the Home Dashboard). For each date, schedules a local notification using Expo Notifications' scheduleNotificationAsync with a trigger set to the specific date and time. Each notification's content includes: title "Time for {routine_name} 🧴", body listing the first 2-3 product step names, and data payload including routine_id for deep linking. Returns an array of notification identifiers.

- **cancelRoutineReminders(notificationIds)**: Takes an array of notification identifiers and cancels each using cancelScheduledNotificationAsync.

- **rescheduleAllRoutineReminders()**: Fetches all active routines for the user, cancels all existing scheduled notifications, and re-schedules them. This should be called when: the app opens (to refresh the 30-day window), a routine is created or edited, or the user changes their timezone.

**Notification Tap Handling**

Set up a notification response handler (addNotificationResponseReceivedListener) in the app's root layout. When a user taps a notification, extract the routine_id from the data payload and navigate to the Routine Execution screen for that routine.

**Token Storage**

The user's Expo push notification token (obtained during onboarding in EP1) should already be stored in the users table. If it's not there yet, obtain it on the Home Dashboard mount and store it. This token is needed for EP3's server-sent notifications but not for the local notifications implemented here.

---

## Post-Build Verification

After all seven screens and three Edge Functions are built, verify the following end-to-end flows work:

1. **New user flow**: Sign up → Complete onboarding → See empty Home Dashboard → Navigate to Shelf → Tap FAB → Add a product via manual entry → Return to Shelf and see the product → Navigate to Routines tab → Create a new routine with that product → Set schedule to daily AM → Save → Return to Home Dashboard → See today's AM routine card → Tap to execute → Complete the step → See completion animation → Tap "Log Your Skin" → Move sliders and save → Return to Home Dashboard → See streak update to 1 and