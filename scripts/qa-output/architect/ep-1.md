

# GlowLog — Execution Prompt 1 of 3: Foundation Blueprint

## Project Initialization

### Step 1: Create the Project

Run the command **npx create-expo-app@latest glowlog --template tabs** and then cd into the **glowlog** directory. This creates an Expo SDK 52 project with React Native 0.76+ and a pre-configured tab navigation skeleton that we will customize.

### Step 2: Install All Dependencies

Install every package the entire app will need across all three execution prompts. This avoids dependency conflicts later.

**Expo-compatible packages (use npx expo install):**
- expo-router (v4, should come with template)
- expo-notifications
- expo-device
- expo-camera (for barcode scanning — do NOT install expo-barcode-scanner, it is removed in SDK 52)
- expo-image-picker
- expo-image-manipulator
- expo-auth-session
- expo-crypto
- expo-secure-store
- expo-constants
- expo-updates
- expo-haptics
- expo-file-system
- expo-asset
- react-native-reanimated (v3)
- react-native-gesture-handler
- react-native-safe-area-context
- react-native-screens
- @react-native-async-storage/async-storage

**NPM packages (use npm install):**
- @supabase/supabase-js (v2)
- drizzle-orm
- drizzle-kit (as dev dependency)
- postgres (the postgres.js driver)
- @anthropic-ai/sdk
- openai
- react-native-purchases (RevenueCat SDK 8+)
- @sentry/react-native
- posthog-react-native
- @upstash/redis
- algoliasearch (v4.x)
- react-instantsearch
- nativewind (v4)
- tailwindcss (as dev dependency)
- react-native-chart-kit (needed in EP3 but install now)
- zustand (lightweight state management)
- zod (runtime validation)
- date-fns (date manipulation for RRULE calculations)
- date-fns-tz (timezone handling)
- react-native-uuid (UUID generation on client)

### Step 3: Project Structure

Create the following folder structure. Every folder must exist before any files are written.

**app/** — Expo Router v4 file-based pages. This is the routing root.
- **app/(auth)/** — Authentication screens grouped as a route group: login.tsx, signup.tsx, forgot-password.tsx
- **app/(onboarding)/** — Onboarding flow screens: welcome.tsx, skin-profile.tsx, notifications.tsx, summary.tsx
- **app/(tabs)/** — Main tab navigation layout: _layout.tsx (tab bar config), index.tsx (Home), shelf.tsx (Product Shelf), routines.tsx (Routines), log.tsx (Skin Log), profile.tsx (Profile & Settings)
- **app/_layout.tsx** — Root layout that wraps AuthProvider, theme provider, Sentry, PostHog, and conditionally routes to auth, onboarding, or tabs based on auth and onboarding state

**components/** — Reusable UI components organized by domain
- **components/ui/** — Generic design system atoms: Button, Input, Card, Toggle, ProgressBar, ChipSelector, Toast, Modal, Avatar, SkeletonLoader, ErrorBoundary
- **components/onboarding/** — Onboarding-specific components: StepIndicator, SkinTypeSelector, ConcernChips, ExperienceLevelPicker
- **components/product/** — Product domain components (used in EP2): ProductCard, IngredientList, ConflictBadge
- **components/routine/** — Routine domain components (used in EP2): RoutineCard, StepItem, SchedulePicker
- **components/settings/** — Settings-specific components: SettingsRow, SettingsSection, DangerZone

**lib/** — Utilities, API clients, hooks, and business logic
- **lib/supabase.ts** — Supabase client initialization
- **lib/auth.tsx** — AuthProvider context and hook
- **lib/db/** — Database layer: schema.ts (Drizzle schema), index.ts (Drizzle client), migrations/
- **lib/api/** — Edge Function callers: ingredients.ts, products.ts, notifications.ts
- **lib/hooks/** — Custom React hooks: useAuth.ts, useProfile.ts, useNotifications.ts, useSubscription.ts
- **lib/stores/** — Zustand stores: onboardingStore.ts, profileStore.ts, notificationStore.ts
- **lib/utils/** — Pure utility functions: validators.ts, formatters.ts, recurrence.ts (RRULE logic), timezone.ts
- **lib/analytics.ts** — PostHog initialization and event helpers
- **lib/sentry.ts** — Sentry initialization and configuration
- **lib/theme.ts** — Theme constants and dark mode logic

**constants/** — Static configuration
- **constants/colors.ts** — Color palette for light and dark themes
- **constants/config.ts** — App-wide constants (app name, support email, API timeouts)
- **constants/skin-types.ts** — Enumeration of skin types, concerns, experience levels
- **constants/ingredient-conflicts.json** — Bundled conflict rules (200KB, ~500 pairs)

**assets/** — Static assets
- **assets/images/** — App logo, onboarding illustrations, empty state graphics
- **assets/fonts/** — Custom fonts if any (otherwise use system fonts)

**supabase/** — Supabase project configuration
- **supabase/functions/** — Edge Function stubs (directories with index.ts files)
- **supabase/functions/analyze-ingredients/** — Conflict detection + Claude layering explanation
- **supabase/functions/lookup-product/** — Barcode lookup orchestration via Open Food Facts
- **supabase/functions/sync-subscription/** — RevenueCat webhook handler
- **supabase/functions/generate-skin-story/** — Inngest-triggered weekly summary generation
- **supabase/migrations/** — SQL migration files generated by Drizzle

### Step 4: Configuration Files

**app.config.ts** must be a dynamic configuration file (not app.json) that exports a function. It must include:
- **name**: "GlowLog"
- **slug**: "glowlog"
- **scheme**: "glowlog" (for deep linking and OAuth redirects)
- **version**: "1.0.0"
- **orientation**: "portrait"
- **icon** and **splash** pointing to assets
- **plugins** array containing: expo-router, expo-notifications (with icon and color for Android), expo-camera, expo-image-picker, expo-secure-store, @sentry/react-native (with organization and project slugs read from env), and the Sentry Expo plugin
- **ios** section with bundleIdentifier "com.glowlog.app", supportsTablet false, infoPlist containing NSCameraUsageDescription ("GlowLog uses your camera to scan product barcodes") and NSPhotoLibraryUsageDescription ("GlowLog uses your photo library for progress photos")
- **android** section with package "com.glowlog.app", adaptiveIcon configuration, and permissions for CAMERA and notifications
- **extra** section with eas.projectId (read from env), supabaseUrl and supabaseAnonKey (read from env), posthogApiKey (read from env), sentryDsn (read from env), algoliaAppId and algoliaSearchKey (read from env)
- **updates** section with url pointing to the EAS updates endpoint

**tsconfig.json** should extend expo's TypeScript config with strict mode enabled and path aliases: the at-sign alias (@/) should resolve to the project root so imports look like @/lib/supabase or @/components/ui/Button.

**tailwind.config.js** must be configured for NativeWind v4. The content array must include app/, components/, and lib/ directories. Extend the theme with GlowLog's brand colors (defined below under Theme System). Configure the NativeWind preset.

**drizzle.config.ts** should point to the schema file at lib/db/schema.ts, output migrations to supabase/migrations/, use the "postgresql" dialect, and read the database URL from environment variables. Set **prepare: false** because Supabase's connection pooler (Transaction mode) does not support prepared statements.

**eas.json** must define three build profiles:
- **development**: developmentClient true, distribution internal, env pointing to .env.development
- **preview**: distribution internal, for TestFlight/internal testing
- **production**: distribution store, autoIncrement true, env pointing to .env.production

### Step 5: Environment Setup

Create a file named **.env.example** at the project root with the following placeholder keys. Each key must have a comment explaining what it is and where to get it. The actual **.env** file should be gitignored.

Required environment variables:
- **EXPO_PUBLIC_SUPABASE_URL** — The Supabase project URL (found in Supabase dashboard under Settings > API)
- **EXPO_PUBLIC_SUPABASE_ANON_KEY** — The Supabase anonymous/public key
- **SUPABASE_SERVICE_ROLE_KEY** — The Supabase service role key (used only in Edge Functions, never in client code)
- **SUPABASE_DB_URL** — Direct PostgreSQL connection string for Drizzle migrations
- **EXPO_PUBLIC_SENTRY_DSN** — Sentry DSN for error tracking
- **SENTRY_ORG** — Sentry organization slug (for source map uploads during EAS Build)
- **SENTRY_PROJECT** — Sentry project slug
- **EXPO_PUBLIC_POSTHOG_API_KEY** — PostHog API key for analytics
- **EXPO_PUBLIC_POSTHOG_HOST** — PostHog host URL (default: https://us.i.posthog.com)
- **ANTHROPIC_API_KEY** — Claude API key (used only in Edge Functions)
- **OPENAI_API_KEY** — OpenAI API key (used only in Edge Functions for GPT-5.4 Vision in EP3)
- **EXPO_PUBLIC_ALGOLIA_APP_ID** — Algolia application ID
- **EXPO_PUBLIC_ALGOLIA_SEARCH_KEY** — Algolia search-only API key (safe for client)
- **ALGOLIA_ADMIN_KEY** — Algolia admin key (used only in Edge Functions for indexing)
- **UPSTASH_REDIS_REST_URL** — Upstash Redis REST URL
- **UPSTASH_REDIS_REST_TOKEN** — Upstash Redis REST token
- **REVENUECAT_API_KEY_IOS** — RevenueCat public SDK key for iOS
- **REVENUECAT_WEBHOOK_SECRET** — RevenueCat webhook authorization header secret
- **EAS_PROJECT_ID** — EAS project ID for OTA updates and push notifications

Create the Supabase client initialization module at **lib/supabase.ts**. This module must:
- Import createClient from @supabase/supabase-js
- Import AsyncStorage from @react-native-async-storage/async-storage
- Read EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from the environment (using Constants.expoConfig.extra or process.env with the EXPO_PUBLIC_ prefix)
- Create and export a singleton Supabase client configured with auth.storage set to AsyncStorage, auth.autoRefreshToken set to true, auth.persistSession set to true, and auth.detectSessionInUrl set to false (important for React Native — there is no browser URL bar)
- Export the client as a named export called **supabase**

### Step 6: Database Schema

This is the most critical section. The schema must be defined using Drizzle ORM in **lib/db/schema.ts** and then pushed to Supabase PostgreSQL. Every table must have Row Level Security (RLS) enabled with policies that scope access to the authenticated user via auth.uid().

#### Table: users

**Purpose**: Extends Supabase Auth's built-in auth.users table with GlowLog-specific profile data. Created automatically via a PostgreSQL trigger that fires on new auth.users inserts.

**Fields**:
- **id** — UUID, primary key, references auth.users(id) with cascade delete. This is NOT auto-generated by the users table; it mirrors the auth user's ID exactly.
- **email** — text, not null. Copied from auth.users for convenience.
- **display_name** — text, nullable. User's chosen display name.
- **avatar_url** — text, nullable. Path to avatar in Supabase Storage (not a full URL — resolve at render time).
- **skin_type** — text, nullable. One of: "oily", "dry", "combination", "sensitive", "normal". Null if onboarding was skipped.
- **experience_level** — text, nullable. One of: "beginner", "intermediate", "enthusiast". Null if skipped.
- **skin_concerns** — jsonb, nullable. An array of strings representing selected concerns, e.g., ["acne", "aging", "hyperpigmentation", "sensitivity", "dryness", "dark_spots"]. Stored as jsonb to allow flexible querying.
- **timezone** — text, not null, default "UTC". IANA timezone string captured during onboarding or derived from device. Used for notification scheduling and streak calculations.
- **onboarding_completed** — boolean, not null, default false. Gates whether the user sees onboarding or tabs on app launch.
- **notification_token** — text, nullable. Expo push notification token stored after permission grant.
- **notifications_enabled** — boolean, not null, default true. Master toggle for push notifications.
- **reminder_time_morning** — text, nullable, default "08:00". Preferred AM routine reminder time in HH:MM format (24-hour, user's local timezone).
- **reminder_time_evening** — text, nullable, default "21:00". Preferred PM routine reminder time.
- **subscription_tier** — text, not null, default "free". One of: "free", "pro_monthly", "pro_annual". Synced from RevenueCat via webhook.
- **subscription_expires_at** — timestamp with time zone, nullable. When the current subscription period ends. Null for free users.
- **created_at** — timestamp with time zone, not null, default now().
- **updated_at** — timestamp with time zone, not null, default now(). Updated via a trigger on row modification.

**Indexes**: Primary key on id. Index on email for lookups. Index on subscription_tier for analytics queries.

**RLS Policies**:
- SELECT: Users can read only their own row (auth.uid() equals id).
- UPDATE: Users can update only their own row.
- INSERT: Handled by the database trigger, not by client. The trigger function should use the service role internally. Alternatively, allow insert where auth.uid() equals the id being inserted.
- DELETE: Users can delete only their own row (triggers cascade deletion of all related data).

**Trigger**: Create a PostgreSQL function called handle_new_user() that inserts a row into public.users whenever a new row appears in auth.users. The function extracts the id and email from the new auth.users row. Create a trigger on auth.users that fires AFTER INSERT and calls this function.

**Updated_at Trigger**: Create a generic function called update_updated_at_column() that sets updated_at to now() on any row update. Apply this trigger to the users table and all other tables that have an updated_at column.

#### Table: products

**Purpose**: Stores products on a user's personal shelf. Each product belongs to one user. Products can be added via barcode scan, Algolia search, or manual entry.

**Fields**:
- **id** — UUID, primary key, default gen_random_uuid().
- **user_id** — UUID, not null, foreign key references users(id) with cascade delete.
- **name** — text, not null. Product name (e.g., "CeraVe Moisturizing Cream").
- **brand** — text, nullable. Brand name.
- **barcode** — text, nullable. EAN/UPC barcode string if scanned or looked up. Indexed for deduplication checks.
- **product_type** — text, not null. One of: "cleanser", "toner", "serum", "essence", "ampoule", "moisturizer", "sunscreen", "eye_cream", "mask", "exfoliant", "oil", "mist", "treatment", "other". Used for layering order suggestions.
- **ingredients** — jsonb, nullable. An array of strings representing the INCI ingredient list in order. Stored as jsonb for flexible querying and conflict detection. Example: ["Water", "Glycerin", "Niacinamide", "Cetearyl Alcohol"].
- **image_url** — text, nullable. Path to product image in Supabase Storage, or an external URL from Open Food Facts.
- **notes** — text, nullable. User's personal notes about this product.
- **purchase_date** — date, nullable. When the user bought it.
- **expiry_date** — date, nullable. Expected expiry.
- **is_active** — boolean, not null, default true. Whether the product is currently in use (vs. archived/finished).
- **source** — text, not null, default "manual". One of: "manual", "barcode_scan", "algolia_search", "community". Tracks how the product was added for analytics.
- **open_food_facts_id** — text, nullable. Reference ID from Open Food Facts if the product was sourced from there.
- **created_at** — timestamp with time zone, not null, default now().
- **updated_at** — timestamp with time zone, not null, default now().

**Indexes**: Primary key on id. Index on user_id for shelf queries. Index on barcode for deduplication. Composite index on (user_id, is_active) for filtering active products. GIN index on ingredients for jsonb containment queries.

**RLS Policies**:
- SELECT: Users can read only their own products (auth.uid() equals user_id).
- INSERT: Users can insert only products where user_id equals auth.uid().
- UPDATE: Users can update only their own products.
- DELETE: Users can delete only their own products.

#### Table: routines

**Purpose**: Stores user-created skincare routines. Each routine has a schedule defined by recurrence rules and contains an ordered list of steps (products). A user can have multiple routines (e.g., AM Daily, PM Daily, Weekly AHA, Monthly Mask Night).

**Fields**:
- **id** — UUID, primary key, default gen_random_uuid().
- **user_id** — UUID, not null, foreign key references users(id) with cascade delete.
- **name** — text, not null. User-given name (e.g., "Morning Glow", "Retinol Night").
- **time_of_day** — text, not null. One of: "morning", "evening", "anytime". Used to group routines on the dashboard and determine which reminder time setting to use.
- **recurrence_rule** — text, not null. An RRULE-compatible string that defines the schedule. Examples: "FREQ=DAILY" for every day, "FREQ=DAILY;INTERVAL=2" for every other day, "FREQ=WEEKLY;BYDAY=MO,WE,FR" for Mon/Wed/Fri, "FREQ=MONTHLY;BYMONTHDAY=1,15" for 1st and 15th. The app parses this to calculate next-due dates.
- **timezone** — text, not null. IANA timezone string. Defaults to the user's timezone at creation time but can be overridden per routine. Used to evaluate recurrence in the user's local time.
- **is_active** — boolean, not null, default true. Allows pausing a routine without deleting it.
- **streak_count** — integer, not null, default 0. Current consecutive completion streak. Incremented when a routine is completed on its scheduled day; reset to 0 when a day is missed. Calculated with a grace period (see Edge Cases below).
- **longest_streak** — integer, not null, default 0. Highest streak ever achieved. Updated whenever streak_count exceeds it.
- **last_completed_at** — timestamp with time zone, nullable. When this routine was last completed. Used for streak and next-due calculations.
- **next_due_at** — timestamp with time zone, nullable. Pre-computed next due date/time for efficient dashboard queries. Recalculated after each completion or schedule change.
- **sort_order** — integer, not null, default 0. Allows users to reorder routines on the dashboard via drag-and-drop.
- **created_at** — timestamp with time zone, not null, default now().
- **updated_at** — timestamp with time zone, not null, default now().

**Indexes**: Primary key on id. Index on user_id. Composite index on (user_id, is_active) for dashboard queries. Index on next_due_at for "what's due today" queries.

**RLS Policies**: Same user-scoped pattern as products — all CRUD operations restricted to rows where auth.uid() equals user_id.

#### Table: routine_steps

**Purpose**: Joins products to routines in a specific order. Each step represents one product application within a routine.

**Fields**:
- **id** — UUID, primary key, default gen_random_uuid().
- **routine_id** — UUID, not null, foreign key references routines(id) with cascade delete.
- **product_id** — UUID, not null, foreign key references products(id) with cascade delete. If a product is deleted, its steps are removed from all routines.
- **step_order** — integer, not null. Determines the application sequence within the routine. Starts at 0 or 1, no gaps enforced (reorder operations simply reassign values).
- **notes** — text, nullable. Step-specific notes (e.g., "Wait 20 minutes after applying" for actives).
- **duration_seconds** — integer, nullable. Optional wait time after this step before proceeding to the next. Used for actives that need absorption time. Null means no wait.
- **created_at** — timestamp with time zone, not null, default now().

**Indexes**: Primary key on id. Composite index on (routine_id, step_order) for ordered retrieval. Index on product_id for reverse lookups ("which routines use this product?").

**RLS Policies**: Users can access routine_steps only for routines they own. The policy must join through routines to check that the routine's user_id equals auth.uid(). Specifically: SELECT, INSERT, UPDATE, DELETE are allowed where EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_steps.routine_id AND routines.user_id = auth.uid()).

#### Table: routine_completions

**Purpose**: Logs each time a user completes a routine. One row per completion event. Used for streak calculations, consistency tracking, and the Skin Story Correlation Engine.

**Fields**:
- **id** — UUID, primary key, default gen_random_uuid().
- **routine_id** — UUID, not null, foreign key references routines(id) with cascade delete.
- **user_id** — UUID, not null, foreign key references users(id) with cascade delete. Denormalized from routines for efficient querying without joins.
- **completed_at** — timestamp with time zone, not null, default now(). The actual moment of completion.
- **scheduled_date** — date, not null. The date this completion was "for" — important distinction from completed_at because a user might complete a night routine at 12:30 AM, which should count for the previous day. Calculated from recurrence_rule and timezone.
- **skipped** — boolean, not null, default false. If true, the user explicitly marked this routine as skipped (vs. simply not doing it). Skipped routines do not break streaks within the grace period.
- **completed_steps** — jsonb, nullable. Array of objects recording which steps were actually completed, in case a user skips some steps. Each object contains step_id (UUID) and completed (boolean). Allows partial completion tracking.
- **notes** — text, nullable. Optional completion notes (e.g., "Skipped retinol because of sunburn").
- **created_at** — timestamp with time zone, not null, default now().

**Indexes**: Primary key on id. Index on routine_id. Index on user_id. Composite index on (user_id, scheduled_date) for "what did I do on this date" queries. Index on completed_at for time-range queries.

**RLS Policies**: Users can access only their own completions (auth.uid() equals user_id).

#### Table: skin_logs

**Purpose**: Records daily skin condition observations. The core data for the Skin Story Correlation Engine. Users log how their skin looks and feels, and the app correlates this with products used and routine consistency.

**Fields**:
- **id** — UUID, primary key, default gen_random_uuid().
- **user_id** — UUID, not null, foreign key references users(id) with cascade delete.
- **log_date** — date, not null. The date this observation is for. Unique per user per day (enforced by composite unique constraint).
- **overall_rating** — integer, nullable. 1-5 scale representing overall skin satisfaction. Null if the user skips the rating.
- **conditions** — jsonb, not null, default empty object. A structured object mapping condition names to severity scores (0-10 scale). Keys are standardized: "acne", "dryness", "oiliness", "redness", "irritation", "texture", "dark_spots", "wrinkles", "glow". Example: {"acne": 3, "dryness": 7, "redness": 2}. Only conditions the user actively logs are present as keys.
- **notes** — text, nullable. Free-text notes about the day's skin ("Traveled, skin felt dry from airplane").
- **tags** — jsonb, nullable. Array of strings for quick-tag labels: ["period", "stressed", "travel", "new_product", "weather_change", "diet_change"]. Enriches correlation data.
- **sleep_hours** — real, nullable. Optional sleep tracking for correlation.
- **water_intake_ml** — integer, nullable. Optional hydration tracking.
- **created_at** — timestamp with time zone, not null, default now().
- **updated_at** — timestamp with time zone, not null, default now().

**Indexes**: Primary key on id. Composite unique index on (user_id, log_date) — one log per user per day. Index on user_id. Index on log_date for time-range queries. GIN index on conditions for jsonb queries. GIN index on tags for array containment queries.

**RLS Policies**: Users can access only their own logs (auth.uid() equals user_id).

#### Table: progress_photos

**Purpose**: Stores references to progress photos uploaded to Supabase Storage. Photos are stored as file paths, not base64. The actual image files live in a private Supabase Storage bucket.

**Fields**:
- **id** — UUID, primary key, default gen_random_uuid().
- **user_id** — UUID, not null, foreign key references users(id) with cascade delete.
- **skin_log_id** — UUID, nullable, foreign key references skin_logs(id) with set null on delete. Links the photo to a specific skin log entry. Nullable because a user might take a photo without logging conditions.
- **storage_path** — text, not null. The object path within the Supabase Storage bucket. Format: "{user_id}/{date}/{uuid}.jpg". This path is used with supabase.storage.from('progress-photos').getPublicUrl(path) or createSignedUrl() to generate viewable URLs.
- **photo_type** — text, not null, default "face". One of: "face", "left_side", "right_side", "forehead", "chin", "other". Allows categorized comparison views.
- **caption** — text, nullable. User-added caption.
- **taken_at** — timestamp with time zone, not null, default now(). When the photo was taken (from EXIF data if available, otherwise upload time).
- **is_favorite** — boolean, not null, default false. Allows starring photos for quick access.
- **file_size_bytes** — integer, nullable. For tracking storage usage against free tier limits.
- **created_at** — timestamp with time zone, not null, default now().

**Indexes**: Primary key on id. Index on user_id. Index on skin_log_id. Composite index on (user_id, taken_at) for chronological gallery queries. Index on (user_id, photo_type) for comparison views.

**RLS Policies**: Users can access only their own photos (auth.uid() equals user_id).

#### Database Functions and Triggers

**handle_new_user()** — A PostgreSQL function that fires after a new row is inserted into auth.users. It inserts a corresponding row into public.users with the id and email from the auth user. Set the function's security context to SECURITY DEFINER so it can bypass RLS to perform the insert.

**update_updated_at_column()** — A generic trigger function that sets updated_at = now() before each UPDATE. Apply this trigger to: users, products, routines, skin_logs.

**Important RLS note**: All RLS policies must be created AFTER the tables. The migration should enable RLS on each table explicitly (ALTER TABLE table_name ENABLE ROW LEVEL SECURITY) and then create the policies. Without enabling RLS, the policies have no effect.

### Step 7: Storage Setup

Create a Supabase Storage bucket called **progress-photos** with the following configuration:
- **Public**: false (private bucket — images served via signed URLs or RLS-protected access)
- **File size limit**: 5MB per file (progress photos are compressed before upload)
- **Allowed MIME types**: image/jpeg, image/png, image/webp

**Storage RLS Policies** for the progress-photos bucket:
- **SELECT (read)**: Allow if the file path starts with the user's auth.uid(). Policy condition: bucket_id equals 'progress-photos' AND (storage.foldername(name))[1] equals auth.uid()::text.
- **INSERT (upload)**: Allow if the user is uploading to their own folder. Same path-based check.
- **DELETE**: Allow if the file is in the user's own folder.

Create a second bucket called **product-images** with the same configuration. This is for user-uploaded product photos (not all products will have images from Open Food Facts).

### Edge Function Stubs

Create the following directories under **supabase/functions/**. Each directory should contain a single index.ts file that is a minimal Deno-compatible Edge Function stub. The stub should accept a POST request, validate that the Authorization header contains a valid Supabase JWT, and return a JSON response with a message indicating the function is not yet implemented. The actual implementations will be built in EP2 and EP3.

**supabase/functions/analyze-ingredients/** — Will accept a list of ingredient arrays (one per product in a routine), check Upstash Redis cache, run on-device conflict rules server-side as validation, call Claude 4.5 Sonnet for plain-language explanations and layering order, cache the result, and return structured conflict data and suggestions.

**supabase/functions/lookup-product/** — Will accept a barcode string, check Upstash Redis cache, query Open Food Facts API, parse the response into the product schema shape, cache the result, and return product data. Falls back to "not found" with a suggestion to enter manually.

**supabase/functions/sync-subscription/** — Will receive RevenueCat webhook payloads, verify the webhook secret, extract subscription state (active/expired/cancelled), and update the user's subscription_tier and subscription_expires_at in the users table using the service role key.

**supabase/functions/generate-skin-story/** — Will be triggered by Inngest on a weekly schedule per user. Queries the user's skin_logs, routine_completions, and products for the past 7 days, sends the data to Claude 4.5 Sonnet for correlation analysis, and stores the narrative summary. This function is fully deferred to EP3 but the stub and directory must exist now.

Each stub must import serve from "https://deno.land/std/http/server.ts" (or the Supabase Edge Function entrypoint pattern) and create a Supabase client using Deno.env.get("SUPABASE_URL") and Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"). The stubs exist so the project structure is complete and deployment configuration can be tested.

### Shared Configuration

#### Theme System

Define the theme in **lib/theme.ts** and **constants/colors.ts**. GlowLog uses a soft, skin-friendly palette:

**Light mode colors**:
- Primary: a warm rose/coral tone (hex around #E8927C or similar) — evokes healthy skin
- Primary dark: deeper coral for pressed states
- Secondary: a soft sage green (#8BAD96) — evokes natural/clean beauty
- Background: warm off-white (#FFF8F5) — not pure white, easier on eyes
- Surface: white (#FFFFFF) — card backgrounds
- Text primary: dark warm gray (#2D2320) — not pure black
- Text secondary: medium warm gray (#7A6E66)
- Text muted: light gray (#B5ADA7)
- Border: subtle warm gray (#E8E2DD)
- Error: soft red (#D9534F)
- Warning: warm amber (#E8A838)
- Success: sage green (#6B9E78)
- Destructive: red (#C0392B) for delete/logout actions

**Dark mode colors**: Invert appropriately — dark warm backgrounds (#1A1512), lighter text, desaturated primaries for reduced eye strain.

The theme should expose a hook (e.g., useTheme) that returns the current color set based on the user's system preference or manual override stored in AsyncStorage. NativeWind's dark mode class strategy should be configured to respect this.

#### Global Loading and Error Boundary Components

**LoadingScreen** — A full-screen centered component with the GlowLog logo and a subtle pulsing animation. Used during auth session restoration and initial data loading.

**ErrorBoundary** — A React error boundary component that catches rendering errors, displays a friendly "Something went wrong" message with a "Try Again" button, and reports the error to Sentry with relevant context (current screen, user ID if available). Wrap this around the root layout.

**Toast** — A non-modal notification component that slides in from the top, displays for 3 seconds, and auto-dismisses. Supports success, error, warning, and info variants. Managed via a Zustand store so any component can trigger a toast without prop drilling.

#### Navigation Structure

The app uses Expo Router v4 with file-based routing. The navigation hierarchy is:

**Root layout (app/_layout.tsx)**: Wraps the entire app in providers (AuthProvider, ThemeProvider, PostHogProvider, Sentry ErrorBoundary, Toast provider). Uses a Stack navigator at the root level with three possible screens:
1. **(auth)** group — shown when the user is not authenticated
2. **(onboarding)** group — shown when authenticated but onboarding_completed is false
3. **(tabs)** group — shown when authenticated and onboarding is complete

The root layout must check auth state on mount using supabase.auth.getSession() and listen to onAuthStateChange. It fetches the user's profile from the users table to check onboarding_completed. It conditionally renders the appropriate group using router.replace().

**Tab layout (app/(tabs)/_layout.tsx)**: Five tabs with icons and labels:
1. **Home** (index.tsx) — House icon — "Home"
2. **Shelf** (shelf.tsx) — Grid/package icon — "Shelf"
3. **Routines** (routines.tsx) — Calendar/checklist icon — "Routines"
4. **Log** (log.tsx) — Pencil/journal icon — "Log"
5. **Profile** (profile.tsx) — User/gear icon — "Profile"

The tab bar should use the theme's primary color for the active tab and text secondary for inactive tabs. It should be visible on all tab screens and hidden on modal/detail screens.

**Auth group (app/(auth)/_layout.tsx)**: Stack navigator with no header, containing login, signup, and forgot-password screens. Animated with a slide-up transition from the bottom.

**Onboarding group (app/(onboarding)/_layout.tsx)**: Stack navigator with no header, containing 4 screens: welcome, skin-profile, notifications, summary. Animated with horizontal slide transitions. No back button on the welcome screen; back navigation available on subsequent steps.

#### Analytics Client Configuration

**lib/analytics.ts** must:
- Initialize PostHog with the API key and host from environment variables
- Export a typed analytics object with helper methods: identify(userId, properties), track(eventName, properties), screen(screenName), reset()
- Define an enum or object of event names used throughout the app: ONBOARDING_STARTED, ONBOARDING_COMPLETED, ONBOARDING_SKIPPED, PRODUCT_ADDED (with source property), ROUTINE_CREATED, ROUTINE_COMPLETED, SKIN_LOG_CREATED, BARCODE_SCANNED (with success boolean), PAYWALL_VIEWED, SUBSCRIPTION_STARTED, SUBSCRIPTION_CANCELLED
- Call identify after successful login with the user's ID, email, skin_type, experience_level, and subscription_tier as properties
- Call reset on logout to clear the anonymous ID

**lib/sentry.ts** must:
- Initialize Sentry with the DSN from environment variables
- Configure tracesSampleRate to 0.2 (20% of transactions) for performance monitoring
- Set the environment to "development" or "production" based on the build profile
- Export a helper to set user context after login: Sentry.setUser({ id, email })
- Export a helper to clear user context on logout: Sentry.setUser(null)
- Configure the Sentry Expo plugin integration to capture native crashes

#### Ingredient Conflicts JSON Bundle

Create the file **constants/ingredient-conflicts.json**. This is a static JSON file bundled with the app that enables instant (sub-50ms) on-device conflict detection without network calls.

The file structure should be an object with the following shape:
- **version**: a string like "1.0.0" used for cache invalidation when the file is updated via OTA
- **updated_at**: ISO date string of when this data was last reviewed
- **conflicts**: an array of conflict objects

Each conflict object has:
- **id**: a unique string identifier (e.g., "retinol-aha")
- **ingredient_a**: an array of strings representing ingredient names and common synonyms that trigger this rule (e.g., ["retinol", "retinal", "tretinoin", "adapalene", "tazarotene", "retinyl palmitate"])
- **ingredient_b**: same format for the conflicting ingredient group (e.g., ["glycolic acid", "lactic acid", "mandelic acid", "salicylic acid", "aha", "bha"])
- **severity**: one of "high", "medium", "low". High means significant irritation risk, medium means reduced efficacy, low means minor concern or debunked myth.
- **short_description**: a one-sentence plain-language explanation (e.g., "Using retinol with AHA exfoliants in the same routine can cause significant irritation and skin barrier damage.")
- **recommendation**: a brief actionable suggestion (e.g., "Use on alternate nights, or use AHA in the morning and retinol at night.")
- **is_myth**: boolean. True if this is a commonly believed conflict that is actually safe (e.g., Vitamin C + Niacinamide at normal concentrations). The app should display myth-busting information for these.
- **sources**: array of strings referencing dermatological sources

Populate the file with at least 30-40 well-researched conflict pairs covering the most common interactions. Key conflicts to include:
1. Retinoids (retinol, tretinoin, adapalene) + AHAs (glycolic, lactic acid) — severity high
2. Retinoids + BHAs (salicylic acid) — severity high
3. Retinoids + Benzoyl Peroxide — severity high (note: adapalene is the exception)
4. Retinoids + Vitamin C (L-ascorbic acid) — severity medium (pH incompatibility at high concentrations)
5. AHAs + Vitamin C — severity medium (over-exfoliation risk)
6. Niacinamide + Vitamin C (L-ascorbic acid) — severity low, is_myth true (debunked; safe at modern formulation pH levels)
7. Benzoyl Peroxide + Vitamin C — severity high (oxidation/inactivation)
8. Benzoyl Peroxide + AHAs — severity medium (irritation)
9. Multiple exfoliants combined (AHA + BHA + PHA in same routine) — severity medium
10. Retinoids + physical scrubs — severity medium

Continue with at least 20 more pairs covering common active ingredients: hydroquinone interactions, copper peptides + direct acids, EGF + Vitamin C, etc.

---

## Screens to Build

### Screen: Welcome & Skin Profile Onboarding

**Purpose**: Guide new users through account creation and initial profile setup. This flow runs exactly once for new users and sets the foundation for personalized routine suggestions, ingredient conflict relevance, and notification scheduling. The data collected here populates the users table profile fields and determines the initial app experience.

**Data Model**: The onboarding flow collects data into a local Zustand store (onboardingStore) during the multi-step process and writes it to the users table in a single batch update on the final step. The store holds: skinType (string or null), experienceLevel (string or null), skinConcerns (array of strings), notificationsEnabled (boolean), notificationToken (string or null). None of these fields are required — the user can skip any or all steps, and the profile will have null values for skipped fields.

**User Interactions**:

*Step 1 — Welcome*: A full-screen page with the GlowLog logo centered in the upper third, a headline ("Your skin's smartest diary"), a 2-3 line description of the app's value proposition, and two buttons at the bottom: "Sign Up with Apple" (primary, full-width) and "Sign Up with Email" (secondary, below). Below both, a text link: "Already have an account? Log In" that navigates to the login screen. The Apple Sign-In button uses Supabase Auth's signInWithApple flow via expo-auth-session. The email button navigates to a signup sub-screen within the auth group.

*Step 2 — Skin Profile Quiz*: A page titled "Tell us about your skin" with a progress indicator showing step 2 of 4. Three sections, each clearly labeled:

**Skin Type** — Five tappable chips arranged in a flex-wrap row: Oily, Dry, Combination, Sensitive, Normal. Single-select — tapping one deselects the previous. Each chip has a subtle icon or emoji and changes to a filled/highlighted state when selected. Below the chips, a small "Not sure?" link that shows a brief tooltip or bottom sheet explaining each type in one sentence.

**Experience Level** — Three tappable cards arranged vertically, each with a title and one-sentence description: "Beginner" ("I'm just starting a skincare routine"), "Intermediate" ("I have a routine but want to optimize it"), "Enthusiast" ("I know my ingredients and want detailed tracking"). Single-select.

**Skin Concerns** — Multi-select chips in a flex-wrap grid: Acne, Aging/Fine Lines, Hyperpigmentation, Sensitivity/Redness, Dryness/Dehydration, Dark Spots, Oiliness, Texture/Pores. Multiple can be selected simultaneously. Selected chips display a checkmark.

A "Skip" text link in the top-right corner. A "Continue" button at the bottom that is always enabled (even with no selections — all fields are optional). Pressing Continue saves selections to the onboarding Zustand store and advances to step 3.

*Step 3 — Notification Permission*: A page titled "Stay on track" with an illustration of a notification bell or phone with a notification. A brief explanation: "GlowLog can remind you when it's time for your routine. We'll never spam you — just gentle nudges when your routines are due." Two buttons: "Enable Reminders" (primary) that triggers Notifications.requestPermissionsAsync() and, on grant, calls Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID }) to get the token, storing it in the onboarding store; and "Maybe Later" (secondary text link) that skips without requesting permission. If permission is denied by the OS, show a brief toast explaining they can enable it later in Settings. Track the PostHog event NOTIFICATION_PERMISSION_REQUESTED with granted: true/false.

*Step 4 — Summary & Get Started*: A page titled "You're all set!" with a summary card showing the selected skin type, experience level, and number of concerns (or "Skipped" for any unset field). Below, a brief sentence: "You can always update these in your Profile." A large "Start Glowing" button that: (1) calls supabase.from('users').update() with all the collected profile data (skin_type, experience_level, skin_concerns, timezone from the device via Intl.DateTimeFormat().resolvedOptions().timeZone, notification_token, notifications_enabled, onboarding_completed: true), (2) tracks the ONBOARDING_COMPLETED PostHog event with all profile data as properties, (3) navigates to the (tabs) group using router.replace('/(tabs)').

**API Calls**:
- supabase.auth.signInWithApple() (or signUp with email) during step 1
- supabase.auth.signUp({ email, password }) if email auth chosen
- Notifications.requestPermissionsAsync() and Notifications.getExpoPushTokenAsync() during step 3
- supabase.from('users').update({ ... }).eq('id', userId) during step 4 — a single batch write

**State Management**: A Zustand store called onboardingStore manages the flow state. Fields: currentStep (number, 1-4), skinType (string or null), experienceLevel (string or null), skinConcerns (string array), notificationsEnabled (boolean), notificationToken (string or null). Actions: setSkinType, setExperienceLevel, toggleConcern, setNotificationData, nextStep, previousStep, reset. The store is not persisted — it only lives during the onboarding flow and is cleared after completion.

**Edge Cases**:
- User kills the app mid-onboarding: On next launch, the auth session exists but onboarding_completed is false. The app redirects back to onboarding. However, the in-memory Zustand store is lost, so the quiz starts fresh. This is acceptable — the quiz is quick.
- Apple Sign-In fails: Show an error toast with the message from Supabase Auth. Do not advance from step 1.
- User denies notification permission: Proceed normally. Store notifications_enabled as false. The notification step should not feel like a blocker.
- User's device has no Intl support for timezone: Fall back to "UTC" and show a note in settings that they should set their timezone manually.
- Network error during the final batch write: Show an error toast, keep the user on the summary screen, and offer a "Try Again" button. Do not navigate away until the write succeeds.
- Duplicate email on signup: Show the Supabase Auth error message inline ("An account with this email already exists") and offer a "Log In instead" link.

---

### Screen: Login

**Purpose**: Authenticate returning users. This screen is shown when no valid auth session exists. It provides Apple Sign-In and email/password authentication. It must feel fast, professional, and trustworthy — this is the first impression for returning users.

**Data Model**: No persistent state beyond the auth session. The login form holds email (string) and password (string) in local component state. Error messages are derived from Supabase Auth error responses.

**User Interactions**:

The screen has a warm branded background (the app's off-white or a subtle gradient). Content is vertically centered.

At the top, the GlowLog logo (smaller than on the welcome screen — about 80x80 points) followed by a subtle tagline.

Below the logo, a card (or card-less design depending on brand feel) containing:
- **Email field**: TextInput with keyboardType "email-address", autoCapitalize "none", autoComplete "email", textContentType "emailAddress". Placeholder: "Email address". Validates on blur for basic email format (contains @ and a dot). Shows inline red error text below the field if invalid.
- **Password field**: TextInput with secureTextEntry toggled by a show/hide eye icon button inside the field. autoComplete "password", textContentType "password". Placeholder: "Password". No client-side validation beyond "required" (minimum length is enforced server-side by Supabase Auth).
- **Log In button**: Full-width, primary color, displays "Log In" normally and a spinner with "Logging in..." during the async call. Disabled while loading. Calls supabase.auth.signInWithPassword({ email, password }).
- **Forgot Password link**: Below the login button, styled as secondary text. Navigates to the forgot-password screen.

Below the card, a divider line with "or" text centered on it.

**Apple Sign-In button**: A full-width button styled per Apple's Human Interface Guidelines (dark button with the Apple logo). Calls the Apple Sign-In flow via expo-auth-session integrated with Supabase Auth.

At the very bottom, a text link: "Don't have an account? Sign Up" that navigates to the signup screen (which is essentially step 1 of onboarding, but with the account creation form exposed).

**API Calls**:
- supabase.auth.signInWithPassword({ email, password }) for email login
- Supabase Apple Sign-In flow via expo-auth-session for Apple login
- supabase.auth.resetPasswordForEmail(email) on the forgot-password screen

**State Management**: Local component state only — email, password, isLoading, errorMessage. After successful authentication, the AuthProvider's onAuthStateChange listener detects the new session and triggers navigation: if onboarding_completed is true, navigate to (tabs); if false, navigate to (onboarding).

**Edge Cases**:
- Invalid credentials: Show the error from Supabase Auth as an inline message above the Log In button (not a toast — keep it in context). Message: "Invalid email or password. Please try again."
- Account not confirmed: Supabase Auth may return an "Email not confirmed" error if email confirmation is enabled. Show: "Please check your email to confirm your account" with a "Resend confirmation" link.
- Rate limiting: Supabase Auth rate-limits login attempts. If a 429 is returned, show: "Too many login attempts. Please wait a moment and try again."
- Network failure: Show: "Unable to connect. Please check your internet connection."
- Apple Sign-In cancelled by user: Do nothing — just return to the login screen without an error message.
- Apple Sign-In on Android: This is an iOS app primarily, but if running on Android, hide the Apple Sign-In button and only show email auth.
- Deep link OAuth callback: The app's scheme ("glowlog://") must be registered to handle the OAuth redirect. Expo Router's linking config should handle this. The redirect URL configured in Supabase Auth settings must match: glowlog://auth/callback.
- Session restoration: On app launch, the root layout checks supabase.auth.getSession(). If a valid session exists, the login screen is never shown. If the token is expired but refreshable, Supabase JS auto-refreshes it.

---

### Screen: Profile & Settings

**Purpose**: Central hub for viewing and editing the user's profile, managing app preferences, checking subscription status, and performing account-level actions. This screen is the fifth tab in the main navigation and serves as the primary settings interface.

**Data Model**: Reads from and writes to the users table. Subscription data comes from both the users table (cached subscription_tier and subscription_expires_at) and RevenueCat (Purchases.getCustomerInfo() for real-time entitlement checks). Notification preferences map to users table fields (notifications_enabled, reminder_time_morning, reminder_time_evening).

**User Interactions**:

The screen is a scrollable view organized into clearly labeled sections with visual separators.

**Profile Header** (top section):
A tappable area showing the user's avatar (or a default avatar with their initials), display name, and email. Tapping navigates to a Profile Edit sub-screen. A small edit icon (pencil) in the corner indicates it's tappable.

**Profile Edit Sub-Screen** (navigated to, not inline):
- Avatar: Tappable circular image. Opens the image picker (expo-image-picker) with camera and library options. Selected image is compressed via expo-image-manipulator (max 400px, 80% JPEG) and uploaded to the product-images bucket under {user_id}/avatar.jpg. The storage path is saved to users.avatar_url.
- Display Name: TextInput, saves on blur or on a Save button.
- Skin Type: Single-select chips (same as onboarding).
- Experience Level: Single-select cards (same as onboarding).
- Skin Concerns: Multi-select chips (same as onboarding).
- All changes save immediately with optimistic UI updates and a subtle "Saved" toast on success, error toast with rollback on failure.

**Notification Preferences** section:
- **Push Notifications** toggle: Maps to users.notifications_enabled. When turned off, a brief explanation appears: "You won't receive routine reminders." When turned back on, check notification permission status — if not granted, prompt to enable in iOS Settings with a deep link.
- **Morning Reminder Time**: A tappable row showing the current time (e.g., "8:00 AM"). Tapping opens a time picker (native iOS date picker in time mode). Saves to users.reminder_time_morning. When changed, triggers a recalculation of all morning routine local notifications.
- **Evening Reminder Time**: Same as above, maps to users.reminder_time_evening.
- **Timezone**: Display the current timezone (e.g., "America/New_York") as a read-only row. Include a small "Auto-detected" label. If the user travels and their device timezone changes, show a prompt: "Your timezone seems to have changed. Update to {new_tz}?" with Update and Keep buttons.

**Subscription** section:
- Shows the current tier: "GlowLog Free" or "GlowLog Pro (Monthly)" or "GlowLog Pro (Annual)".
- If free: A "Upgrade to Pro" button that navigates to the paywall screen (built in EP3).
- If pro: Shows the renewal date from subscription_expires_at. A "Manage Subscription" button that opens the native iOS subscription management URL (itms-apps://apps.apple.com/account/subscriptions).
- A "Restore Purchases" text link that calls Purchases.restorePurchases() — required by App Store guidelines.

**Data & Privacy** section:
- **Export My Data** row: Tappable, with a Pro badge if the user is free (this feature is Pro-only). For Pro users, triggers an async process that queries all user data (products, routines, completions, skin logs), formats it as JSON, and either emails it or presents a share sheet. For MVP, a simple JSON download via the share sheet is sufficient.
- **Privacy Policy** row: Opens the privacy policy URL in an in-app browser (WebBrowser.openBrowserAsync).
- **Terms of Service** row: Same pattern.
- **Analytics** toggle: Opt-out of PostHog tracking. When toggled off, call posthog.optOut(). When toggled on, call posthog.optIn(). Maps to a local AsyncStorage flag (not a database field, since analytics opt-out should work offline).

**Account** section (styled with extra spacing and a warning color for destructive actions):
- **Change Password** row: Navigates to a sub-screen with current password, new password, and confirm new password fields. Calls supabase.auth.updateUser({ password: newPassword }).
- **Log Out** button: Styled in the destructive/red color. Shows a confirmation dialog ("Are you sure you want to log out?"). On confirm, calls supabase.auth.signOut(), calls Sentry.setUser(null), calls posthog.reset(), clears any local caches, and the AuthProvider navigates to the (auth) group.
- **Delete Account** button: Styled in destructive red with a warning icon. Shows a two-step confirmation: first a dialog explaining what will be deleted ("This will permanently delete your account, all your products, routines, skin logs, and photos. This cannot be undone."), then requires typing "DELETE" into a text field to confirm. On confirmation, calls a Supabase Edge Function (or direct RPC) that: (1) deletes all user data from all tables (cascade from users table), (2) deletes all user files from Storage buckets, (3) calls supabase.auth.admin.deleteUser(userId) using the service role key, (4) signs the user out on the client side. Track ACCOUNT_DELETED event before deletion.

**App Info** section (bottom of the scroll view, muted styling):
- App version number (from Constants.expoConfig.version)
- Ingredient conflict rules version (from the bundled JSON's version field)
- Build number
- A "Send Feedback" link that opens the email compose with the support email pre-filled

**API Calls**:
- supabase.from('users').select('*').eq('id', userId).single() — on mount, to load profile data
- supabase.from('users').update({ ... }).eq('id', userId) — for each settings change
- Purchases.getCustomerInfo() — on mount, to check subscription status
- Purchases.restorePurchases() — when restore button is tapped
- supabase.auth.updateUser({ password }) — for password change
- supabase.auth.signOut() — for logout
- Notifications.getPermissionsAsync() — to check current notification permission status
- supabase.storage.from('product-images').upload() — for avatar upload
- supabase.storage.from('progress-photos').list() — for data export (list all user's photos)

**State Management**: A Zustand store called profileStore caches the user's profile data after the initial fetch. Fields mirror the users table relevant columns. The store is populated on auth, updated optimistically on settings changes, and cleared on logout. The settings screen reads from this store for instant rendering and performs writes that update both the store (optimistic) and the database (async).

For notification time changes, updating the reminder time triggers a side effect: all local notifications for routines with the matching time_of_day must be cancelled and rescheduled with the new time. This logic lives in a utility function in lib/utils/notifications.ts that: (1) fetches all active routines for the user, (2) cancels all existing scheduled notifications via Notifications.cancelAllScheduledNotificationsAsync(), (3) recalculates notification triggers based on the updated reminder times and routine recurrence rules, and (4) schedules them via Notifications.scheduleNotificationAsync().

**Edge Cases**:
- Profile fetch fails on mount: Show a retry button overlaying the screen. Do not show stale data — it could mislead (especially subscription status).
- Optimistic update fails: Revert the UI to the previous state and show an error toast. The Zustand store should support a "rollback" pattern where the previous state is held during the async operation.
- RevenueCat unreachable: Fall back to the cached subscription_tier in the users table. Show a subtle "Subscription status may be outdated" label if the RevenueCat call fails. The 48-hour cache validity rule applies: if subscription_expires_at is more than 48 hours in the past and RevenueCat is unreachable, do NOT downgrade the user to free. Grace period prevents lockouts.
- Notification permission revoked at OS level: The notification preferences section should check permission status on mount. If permissions were granted before but are now denied, show a banner: "Notifications are turned off in your device settings" with a button that opens the app's iOS Settings page via Linking.openSettings().
- Account deletion edge case: If the Edge Function fails mid-deletion (e.g., storage files deleted but auth user not), the user sees an error. The function should be idempotent — running it again should continue where it left off without errors on already-deleted resources.
- Timezone change detection: Compare the device timezone (Intl.DateTimeFormat().resolvedOptions().timeZone) with the stored users.timezone on each app foreground event. If they differ, show the update prompt.
- Data export for users with many photos: The JSON export should include photo metadata (paths, dates) but not the actual image binary. A note should explain how to download photos separately. For MVP, this is sufficient.

---

## Post-Build Verification

After Claude Code has built everything described above, perform these checks in sequence:

**1. Environment Check**: Verify that all required environment variables are defined. If using a check-env script, run it. Otherwise, manually verify that the Supabase client can be initialized by checking that EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.

**2. Dev Server Compilation**: Run **npx expo start** and confirm the Metro bundler starts without TypeScript compilation errors, missing module errors, or native module linking issues. Fix any dependency resolution problems.

**3. Authentication Flow**: Launch the app in a simulator. Verify: the login screen appears for unauthenticated users; email signup creates a new account and a corresponding row appears in the public.users table (check via Supabase dashboard); login with the new credentials succeeds and transitions to the onboarding flow; completing onboarding writes profile data to the users table and transitions to the main tabs; logging out returns to the login screen; logging back in skips onboarding (onboarding_completed is true) and goes straight to tabs.

**4. Database Tables**: Open the Supabase dashboard Table Editor and confirm that all seven tables exist with the correct columns, types, and constraints: users, products, routines, routine_steps, routine_completions, skin_logs, progress_photos. Verify that RLS is enabled on every table (the shield icon should appear). Verify that the handle_new_user trigger exists on auth.users. Test RLS by attempting to read another user's data using the Supabase client — it should return empty results.

**5. Storage Buckets**: Confirm that both storage buckets (progress-photos and product-images) exist in the Supabase Storage dashboard with the correct privacy settings and RLS policies.

**6. Navigation**: Tap through all five tabs in the tab bar and confirm each renders without crashes. Verify that the Profile & Settings screen loads profile data. Verify that tapping settings rows navigates to the appropriate sub-screens. Verify that the back button works on all sub-screens.

**7. Edge Function Stubs**: Verify that the four Edge Function directories exist under supabase/functions/ and that each contains an index.ts stub. Deploy them to the Supabase project using **supabase functions deploy** and confirm they respond to HTTP requests (even if just returning "not implemented").

**8. Analytics and Error Tracking**: Verify that PostHog receives events by checking the PostHog dashboard after performing a signup. Verify that Sentry is initialized by intentionally throwing an error in development and checking the Sentry dashboard.

**9. Ingredient Conflicts JSON**: Verify that the bundled ingredient_conflicts.json file loads correctly in the app by importing it and logging the version and the count of conflict pairs.

---

**IMPORTANT — Before continuing to Prompt 2**, the user must fill in these environment variables in their .env file with real values from the respective service dashboards:

- **ANTHROPIC_API_KEY** — from console.anthropic.com, required for the analyze-ingredients Edge Function
- **OPENAI_API_KEY** — from platform.openai.com, required for the GPT-5.4 Vision label extraction Edge Function in EP3
- **EXPO_PUBLIC_ALGOLIA_APP_ID** — from the Algolia dashboard, required for product search
- **EXPO_PUBLIC_ALGOLIA_SEARCH_KEY** — the search-only (public) API key from Algolia
- **ALGOLIA_ADMIN_KEY** — the admin API key from Algolia, used only in Edge Functions for index management

Without these keys, the EP2 features (product search, ingredient analysis, barcode lookup enrichment) will not function. The foundation built in EP1 does not require these keys to run — auth, navigation, database, and settings all work with just the Supabase and monitoring keys.