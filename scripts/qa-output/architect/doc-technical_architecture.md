# GlowLog — Technical Architecture Document

**Version:** 1.0 | **Target Platform:** iOS (Android in v1.1) | **Stack Maturity:** Production-ready indie scale
**Audience:** Technical lead, senior developer, or technical reviewer evaluating the architecture before execution

---

## 1. Platform & Technology Stack

### Frontend

**Expo SDK 52 with React Native 0.76+**
GlowLog is built as a native iOS application using the Expo managed workflow. Expo SDK 52 is the current stable release and introduces the new architecture by default (Hermes engine, Fabric renderer, JSI bridging), which meaningfully improves animation performance — relevant for the drag-and-drop routine builder. The managed workflow is appropriate here because GlowLog has no native module requirements that cannot be satisfied by Expo's ecosystem. Bare workflow complexity is not justified for an indie MVP. The alternative (pure React Native CLI) would add significant DevOps overhead without meaningful capability gains at this stage.

**Expo Router v4**
File-based navigation using Expo Router v4 provides a tab layout (Home, Shelf, Routines, Log, Profile) with stack navigators nested within each tab. The file-system routing convention reduces navigation boilerplate considerably and aligns with the mental model of any developer familiar with Next.js. Deep linking for notification tap targets (routine execution, skin story dashboard) is handled cleanly through Expo Router's URL scheme support.

**NativeWind v4**
Tailwind CSS utility classes compiled to React Native StyleSheet objects. Chosen over StyleSheet-only or Styled Components because it dramatically accelerates UI iteration speed for a solo developer. NativeWind v4 supports the new React Native architecture and has full dark mode support — relevant for a health app where users frequently open the app in low-light conditions at night during their PM routine.

**React Native Reanimated 3**
Powers the drag-and-drop interaction in the Routine Builder screen. Reanimated 3 runs gesture handlers and animations entirely on the UI thread, eliminating the JS-thread jank that would otherwise make product reordering feel sluggish. This is the only animation library that delivers genuinely native-feeling drag interactions in React Native at this level of polish. No alternative was seriously considered.

**Zustand**
Lightweight client-side state management for UI state: the current user's profile, active routine session state, onboarding step, and subscription tier cache. Zustand is chosen over Redux Toolkit for its dramatically lower boilerplate and over React Context for its selective re-render behavior. Context at scale causes too many unnecessary re-renders across a deeply nested navigation tree. Zustand stores are kept intentionally narrow — not used as a general data cache, which is TanStack Query's responsibility.

**TanStack Query v5 (React Query)**
Server state management for all Supabase data fetching: products, routines, skin logs, progress photos. TanStack Query handles caching, background refetching, optimistic updates, and loading/error states in a consistent pattern across all screens. The optimistic update pattern is specifically important for the Routine Execution screen — marking a step complete should feel instant, not wait for a database round trip. The alternative (managing all fetch state in Zustand or plain useState) would require rebuilding cache invalidation logic that TanStack Query provides out of the box.

### Authentication

**Supabase Auth**
Authentication is handled entirely by Supabase Auth, providing email/password signup and Apple Sign-In. Apple Sign-In is a mandatory inclusion — Apple requires apps that offer any social login to also offer Sign in with Apple, and it is the preferred auth method for iOS users who value privacy. Magic link support for password reset is included at no additional implementation cost. Supabase Auth integrates directly with Row Level Security policies via the `auth.uid()` function, eliminating the need for a separate user identity layer. Alternatives like Firebase Auth or Auth0 would introduce a second vendor dependency without adding capability relevant to GlowLog's requirements.

Session tokens are stored in `expo-secure-store` (the iOS Keychain) rather than AsyncStorage. This is non-negotiable for a health-adjacent app — skin condition data is sensitive and session tokens must not be accessible to other apps on the device.

### Database

**Supabase PostgreSQL**
The primary persistent store for all application data. PostgreSQL's `jsonb` column type is specifically valuable here for storing INCI ingredient arrays (variable-length, searchable without full normalization) and RRULE-style recurrence data. Supabase's hosted PostgreSQL removes all database infrastructure management. Row Level Security enforced at the database layer — not application layer — means even a misconfigured Edge Function cannot leak one user's skin data to another. The free tier (500MB database, 1GB storage) comfortably covers 0–500 users, with a clear upgrade path to Supabase Pro at ~300 users.

**Drizzle ORM**
Type-safe schema definition and query building for PostgreSQL. Drizzle is chosen over Prisma because it works in Deno runtime environments (Supabase Edge Functions use Deno), whereas Prisma has significant Deno compatibility constraints. Drizzle-kit handles migration generation from schema changes. The resulting TypeScript types flow from schema definition through to React Native component props, catching data shape mismatches at compile time. The `jsonb` ingredient list columns require custom Drizzle column type definitions but this is a one-time setup cost.

### AI & Machine Learning

**Claude 4.5 Sonnet (Anthropic) — Primary AI Model**
Used for four distinct inference tasks: ingredient conflict plain-language explanations, optimal layering order generation, weekly Skin Story correlation narrative summaries, and adaptive beginner ingredient education. Sonnet is chosen over Opus for all production paths — Sonnet provides sufficient structured reasoning quality for ingredient data analysis at approximately one-fifth the cost of Opus. Opus is not used in v1. All Claude calls are made server-side from Supabase Edge Functions; the API key is never present in the client bundle.

**GPT-5.4 Vision (OpenAI) — Fallback Vision Path**
Used exclusively as a fallback when barcode lookup fails and the user photographs a product label for ingredient extraction. GPT-5.4's vision capability significantly outperforms standalone OCR for ingredient lists printed on product packaging, particularly for Korean and Japanese label typography. This is a low-frequency, high-value fallback path — cost per call is acceptable because it fires only when both barcode scanning and database lookup have already failed. Deferred to v1.1, with manual entry covering the gap at launch.

**On-Device Bundled Conflict Rules JSON**
A static `ingredient_conflicts.json` file (~200KB, ~500 known conflict pairs) bundled with the app via Expo Updates. This is the deterministic conflict detection layer — not an AI model. It provides binary conflict flags in under 50ms with zero network dependency. Claude's role is enrichment (plain-language explanation, nuance, layering order) not primary detection. The bundled rules file is sourced from peer-reviewed dermatology literature and INCIDecoder-equivalent open databases, versioned, and updated via OTA without App Store review cycles.

### Caching

**Upstash Redis**
Serverless Redis accessed from Supabase Edge Functions via the `@upstash/redis` client. Three cache namespaces serve distinct purposes: ingredient conflict analysis responses keyed on a SHA-256 hash of the normalized, sorted ingredient array (30-day TTL); barcode product lookups keyed on UPC/EAN barcode string (7-day TTL); and ingredient education explanations keyed on ingredient slug plus experience tier (90-day TTL). Upstash's free tier (10,000 commands/day) covers early growth. The HTTP-based client works correctly in the Deno runtime — traditional Redis clients that use TCP sockets are incompatible with Edge Functions.

### Background Jobs

**Inngest v3**
Handles the weekly Skin Story generation batch job and future community moderation pipelines. Inngest's value over a raw cron system is retry logic with exponential backoff, controlled concurrency (capping parallel Claude API calls to avoid rate limits), and durable execution that survives Edge Function timeouts. The Inngest v3 SDK integrates with Supabase via webhook triggers, and the Inngest dashboard provides job run history for debugging. The free tier (50,000 function runs/month) covers weekly Skin Story generation for up to ~1,500 Pro users. Trigger.dev was evaluated as an alternative but Inngest's simpler local development experience and more mature Supabase integration patterns made it the preferred choice.

### Payments & Subscriptions

**RevenueCat SDK 8+**
Manages the honest freemium subscription lifecycle. RevenueCat abstracts Apple's StoreKit 2 APIs, handles receipt validation server-side, and provides a clean entitlement model (three entitlements: `pro_analytics`, `pro_photos`, `pro_export`) that maps directly to GlowLog Pro feature gates. The RevenueCat dashboard allows changing offering prices, creating promotional offers, and running simple A/B tests on paywall presentation without app releases. Subscription state is synced to Supabase Auth user metadata via RevenueCat webhooks, enabling server-side feature gating independent of the RevenueCat SDK's availability. The 48-hour local cache validity on subscription state is a deliberate design choice to prevent paying users from being locked out during RevenueCat service interruptions.

### Search

**Algolia v4.x**
Powers community product database search — users searching for products by name or brand when adding to their shelf. Algolia's typo tolerance is specifically relevant here because brand and product names are frequently misspelled (especially K-beauty brands transliterated into English). Instant search results and faceted filtering by product type are available out of the box. The free tier (10K searches/month) covers the first several months. Meilisearch v1.x self-hosted is identified as the cost-escape-hatch if Algolia billing becomes significant — the search interface is abstracted behind a `SearchService` layer in Edge Functions to make this swap a configuration change. At MVP launch, Algolia powers search while community product submissions (and thus index population) are deferred to v1.1.

### Infrastructure & DevOps

**Supabase Edge Functions (Deno runtime)**
All server-side business logic beyond database queries runs in Edge Functions. This includes every AI API call, the barcode lookup orchestration chain, RevenueCat webhook handling, and subscription state sync. Edge Functions are stateless, independently deployable, and co-located with the Supabase database — minimizing round-trip latency for database reads within function execution. The Deno runtime is a meaningful constraint: Deno-incompatible Node.js libraries (particularly Prisma, as noted above) cannot be used.

**Expo EAS Build + EAS Update**
EAS Build handles iOS provisioning, code signing, and App Store submission from CI. EAS Update provides OTA delivery of JavaScript bundle updates and bundled asset updates (ingredient conflict rules JSON, top products cache) without App Store review. This is operationally important: as new ingredient research emerges (e.g., a revised understanding of Vitamin C + Niacinamide interactions), the conflict rules can be corrected and deployed to all users within hours rather than the typical 1–3 day App Store review cycle.

### Observability

**Sentry**
Crash reporting and error tracking for both the React Native client and Supabase Edge Functions. Sentry captures full stack traces, custom context (AI model called, cache hit/miss status, input payload size), and breadcrumbs of user actions preceding a crash. This is the primary tool for diagnosing barcode scan failures and AI API errors in production.

**PostHog**
Product analytics for understanding user behavior: funnel analysis from onboarding through first routine completion, feature adoption rates, paywall conversion tracking. EU-hosted for GDPR alignment. Session recording is explicitly disabled — GlowLog's privacy-first positioning makes it inappropriate to record user sessions that may include skin condition data. All event properties are checked for PII before instrumentation is added.

---

## 2. System Architecture Overview

GlowLog operates on a three-tier architecture: a React Native mobile client, a serverless backend layer built on Supabase Edge Functions, and a constellation of third-party services accessed exclusively through the backend layer.

### Client Layer

The React Native client (Expo SDK 52) is responsible for rendering all UI, managing local state (Zustand), coordinating server state (TanStack Query), handling push notification scheduling (Expo Notifications), and executing the camera and image picker flows. Critically, the client never communicates directly with any AI provider (Anthropic, OpenAI) or holds any API keys. All AI calls are proxied through the Edge Function layer.

The client does contain embedded intelligence: the bundled `ingredient_conflicts.json` (~200KB) provides deterministic, zero-latency conflict detection for the ~500 most common ingredient conflict pairs. This bundle is treated as a versioned, updatable asset via Expo Updates OTA. The on-device conflict checker runs synchronously in the JavaScript thread when products are added to a routine — results appear before the user can interact with the next screen element.

The client communicates with Supabase directly for standard CRUD operations (reading product lists, writing skin logs, fetching routine data) via the Supabase JS v2 client, which handles authentication headers automatically. For AI-enriched operations, the client calls the relevant Edge Function endpoint rather than Supabase's data APIs.

### Edge Function Layer

Five primary Edge Functions form the server-side API surface:

- **`/analyze-ingredients`** — Accepts a routine's product ingredient arrays, checks Upstash Redis cache, calls Claude 4.5 Sonnet if cache misses, returns conflict flags and layering order recommendation.
- **`/lookup-product`** — Orchestrates the barcode lookup chain: local cache check → Open Food Facts API → Algolia community index → returns result or triggers manual entry guidance.
- **`/generate-skin-story`** — Called by Inngest's weekly scheduled job. Pulls aggregated skin log data for a specific user from PostgreSQL, constructs a structured prompt for Claude 4.5 Sonnet, writes the generated narrative to the `skin_stories` table.
- **`/explain-ingredient`** — Returns a plain-language ingredient explanation for a given ingredient slug and user experience tier. Checks Upstash Redis first; calls Claude only on cache miss.
- **`/validate-schedule`** — Accepts a full weekly schedule object for a user's routines containing actives. Claude 4.5 Sonnet analyzes for dangerous consecutive-day combinations. Runs on schedule save, not in real time.

All Edge Functions share middleware for: Supabase Auth JWT verification (every request must carry a valid session token), basic rate limiting (per user, per endpoint, per minute), and structured error response formatting.

### Background Job Layer

Inngest v3 sits outside the request/response cycle and handles jobs that are either time-scheduled or too long-running for Edge Function timeouts. The primary job is the weekly `generate-skin-stories` cron that fans out Claude API calls across all eligible users (those with 7+ days of logged data and active Pro subscriptions) with a maximum of 10 concurrent Claude calls. Inngest's webhook endpoint is itself a Supabase Edge Function — Inngest calls this endpoint, which then executes the per-user Skin Story generation logic.

### Third-Party Service Integrations

All third-party AI services (Anthropic Claude, OpenAI GPT-5.4 Vision) are accessed only from Edge Functions. API keys exist only as encrypted Edge Function environment variables.

RevenueCat webhooks are received by a dedicated Edge Function that validates the webhook signature and updates Supabase Auth user metadata with current subscription state. This creates a resilient, server-authoritative subscription record that the client reads from the Supabase Auth session rather than polling RevenueCat on every feature gate check.

Open Food Facts API is called from the `/lookup-product` Edge Function. It requires no API key and supports moderate traffic. Results are cached in Upstash Redis with a 7-day TTL.

Algolia is called directly from the React Native client for product search (read-only, uses the search-only API key which is safe to embed in the client). Product indexing writes go through Edge Functions using the admin API key.

Expo Notifications handles all push notification scheduling locally on the device — no server-side notification queue is required for routine reminders. Notifications are scheduled as local notifications derived from the RRULE data in the `routines` table, recalculated whenever a routine is saved or the user's timezone changes.

### Communication Patterns

```
Client → Supabase JS v2 → PostgreSQL (CRUD, RLS-enforced)
Client → Edge Function (AI-enriched operations, authenticated)
Client → Algolia (product search, search-only API key)
Client → RevenueCat SDK (subscription management)
Edge Function → Anthropic Claude API (AI inference)
Edge Function → OpenAI GPT-5.4 Vision API (label extraction, v1.1)
Edge Function → Upstash Redis (cache read/write)
Edge Function → Open Food Facts API (barcode lookup)
Edge Function → PostgreSQL (AI result persistence, via Supabase client)
Inngest → Edge Function (scheduled job triggers)
RevenueCat → Edge Function (webhook: subscription state changes)
Expo EAS → Device (OTA updates: conflict rules JSON, product cache)
```

---

## 3. Data Model & Database Schema

### Core Entities

**`users`**
Extends Supabase Auth via a trigger on `auth.users` insert. Additional fields beyond what Auth provides: `skin_type` (enum: oily/dry/combo/sensitive/normal), `experience_level` (enum: beginner/intermediate/enthusiast), `primary_concerns` (text array: acne/aging/hyperpigmentation/sensitivity/dryness), `timezone` (IANA timezone string), `notification_token` (Expo push token), `subscription_tier` (enum: free/pro, synced from RevenueCat webhook), `subscription_cache_updated_at` (timestamp, for the 48-hour validity check), `conflict_rules_version` (integer, tracks which bundled rules version the client last loaded). All profile fields are nullable to support the skip-quiz onboarding path.

**`products`**
Represents a product on a specific user's shelf — not a global product record. Fields: `id`, `user_id` (RLS anchor), `name`, `brand`, `product_type` (enum: cleanser/toner/essence/serum/moisturizer/spf/eye_cream/treatment/other), `ingredient_list` (jsonb array of INCI name strings), `ph_value` (numeric, nullable), `barcode` (nullable, for origin tracking), `data_source` (enum: manual/barcode_scan/algolia_community/vision_extracted), `vision_sourced` (boolean, triggers confirmation requirement in UI), `is_archived` (boolean, soft delete for history preservation), `created_at`, `updated_at`. The `ingredient_list` column has a GIN index for fast ingredient-level searches.

**`routines`**
Defines a scheduled skincare routine. Fields: `id`, `user_id`, `name` (user-defined), `am_pm` (enum: am/pm/other), `recurrence_rule` (text, RRULE format: e.g., `FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,WE,FR`, `INTERVAL=3`), `timezone` (IANA string, copied from user profile at creation time and stored independently so routine schedules survive profile timezone changes), `reminder_time` (time of day, local to the routine's timezone), `is_active` (boolean), `created_at`, `updated_at`.

**`routine_steps`**
Join table between routines and products with ordering. Fields: `id`, `routine_id`, `product_id`, `order_index` (integer), `wait_seconds` (nullable integer, for enforced waits between steps like Vitamin C before moisturizer), `notes` (nullable text). Compound unique constraint on `(routine_id, order_index)`.

**`routine_completions`**
Immutable event log of routine execution. Fields: `id`, `user_id`, `routine_id`, `completed_at` (timestamp with timezone), `skipped_product_ids` (jsonb array of product IDs the user marked as skipped), `session_duration_seconds` (integer, how long the user spent in the execution screen). Never updated after creation — this is an append-only log. RLS policy: `user_id = auth.uid()`.

**`skin_logs`**
Daily skin condition entries. Fields: `id`, `user_id`, `log_date` (date, not timestamp — one entry per day, enforced by unique constraint on `(user_id, log_date)`), `breakout_score` (smallint 1–5), `dryness_score` (smallint 1–5), `redness_score` (smallint 1–5), `oiliness_score` (smallint 1–5), `overall_score` (smallint 1–5), `notes` (text, nullable), `uv_index` (numeric, nullable, populated if environmental tracking is enabled), `humidity_percent` (numeric, nullable), `created_at`, `updated_at`. The unique constraint on `(user_id, log_date)` enforces one log per day while allowing backdating (upsert semantics).

**`progress_photos`**
References to photos stored in Supabase Storage. Fields: `id`, `user_id`, `storage_path` (text, format: `{user_id}/{date}/{photo_id}.jpg`), `photo_date` (date), `skin_log_id` (nullable FK to `skin_logs`, for correlation display), `thumbnail_path` (nullable text, set after thumbnail generation), `created_at`. Free users limited at application layer to 50 records; Pro users unlimited. Physical files stored in a private Supabase Storage bucket with RLS matching the table policy.

**`skin_stories`**
Cache table for Inngest-generated weekly narrative summaries. Fields: `id`, `user_id`, `story_date` (date, the Sunday the story was generated for), `summary_text` (text, the Claude-generated narrative), `chart_data` (jsonb, pre-computed aggregates for client-side chart rendering), `data_point_count` (integer, used to validate the 14-point minimum threshold for insight display), `generated_at` (timestamp), `model_version` (text, records which Claude model version generated this, for quality tracking). Unique constraint on `(user_id, story_date)`. Indexed on `(user_id, story_date DESC)` for efficient latest-story queries.

### Relationships

The schema follows a user-scoped hierarchy: every leaf table has a `user_id` column that anchors RLS. `routine_steps` references both `routines.id` and `products.id`, both of which are scoped to the same user — enforced by application logic and FK constraints. `routine_completions` references `routines.id`. `progress_photos` optionally references `skin_logs.id`. `skin_stories` is a standalone cache keyed to `user_id`.

### Indexing Strategy

Beyond the GIN index on `products.ingredient_list`, the following indexes are planned: B-tree index on `routine_completions(user_id, completed_at DESC)` for streak calculation queries; B-tree index on `skin_logs(user_id, log_date DESC)` for dashboard queries; B-tree index on `routines(user_id, is_active)` for fetching today's active routines; B-tree index on `skin_stories(user_id, story_date DESC)` for the dashboard's latest story query. Index decisions are made conservatively — only added when a query exceeds 100ms in the Supabase slow query log.

### Data Lifecycle

Products are never hard-deleted — they are archived (`is_archived = true`) to preserve history for the Skin Story correlation engine. Skin logs are retained indefinitely while the account is active. Routine completions are append-only and never modified. On account deletion, a cascading delete across all user-scoped tables is triggered by the `delete_user` RPC function, with Supabase Storage folder deletion handled by a separate Edge Function. The 30-day post-deletion retention window for GDPR compliance is managed by a `deletion_requests` table that records deletion timestamp and user ID hash (no PII) for audit purposes.

### Migration Approach

Drizzle-kit generates SQL migrations from schema definition changes. Migrations are version-controlled in the repository under `/drizzle/migrations`. All migrations are reviewed manually before production application — no auto-migration on deploy. The staging Supabase project receives every migration first; the production project receives it only after staging validation. RLS policies are included in migration files, not applied manually, to ensure they remain version-controlled and reproducible.

---

## 4. AI Integration Architecture

### Model Assignments and Rationale

GlowLog uses AI for five distinct functions, each with a deliberate model selection and invocation pattern:

**Ingredient Conflict Explanation & Layering Order (Claude 4.5 Sonnet)**
Triggered when a user saves a routine or opens the Ingredient Conflict Guide. The input is a structured JSON object containing each product's name, type, and normalized INCI ingredient array. The output is a JSON object containing an ordered application sequence and an array of conflict objects, each with a severity level, plain-language explanation, and the two conflicting ingredients identified. Temperature is set to 0.2 — this task demands consistency, not creativity. The system prompt includes the confirmed deterministic conflict flags from the on-device rules as ground truth, constraining Claude's conflict identification to known pairs rather than allowing hallucination of novel conflicts.

**Skin Story Weekly Narrative (Claude 4.5 Sonnet)**
Triggered by Inngest's Sunday cron job for all eligible Pro users. The input is a pre-aggregated data structure — not raw log rows — containing 30-day average skin scores, routine completion rates by day of week, top products used, and environmental averages if available. Claude's task is to generate a human-readable narrative (2–3 paragraphs) identifying apparent patterns in the numerical data. Temperature is 0.4 to allow more natural language while maintaining factual grounding. The statistical correlations (Pearson r values, computed by the Edge Function before Claude is called) are passed in the prompt alongside strict instructions to use probabilistic language ("tends to correlate with" not "causes").

**Beginner Ingredient Education (Claude 4.5 Sonnet)**
Triggered when a user taps an ingredient name anywhere in the app. Input: ingredient INCI name and the user's `experience_level` from their profile. Output: a structured JSON with a plain-language description, a list of benefits, any applicable cautions, and a "good for" skin types field. The user experience level (beginner/intermediate/enthusiast) drives prompt instructions — beginners receive analogies and simplified descriptions, enthusiasts receive mechanism-of-action detail. Temperature 0.5. Aggressively cached by `{ingredient_slug}:{experience_level}` in Upstash Redis with a 90-day TTL. After the first several thousand users, the marginal cost of this feature approaches zero.

**Schedule Safety Analysis — Active Ingredient Conflicts (Claude 4.5 Sonnet)**
Triggered server-side when a user saves a routine containing actives (retinol, AHAs, BHAs, Vitamin C, benzoyl peroxide — identified by ingredient keyword matching). Input is a structured weekly schedule object showing which actives appear in which routines on which days. Output is a JSON array of scheduling conflict warnings. This runs asynchronously after schedule save — the user is notified via a banner when results are ready (typically 1–2 seconds). Temperature 0.2 for consistency.

**Product Label Extraction from Photo (GPT-5.4 Vision)**
Deferred to v1.1. When barcode lookup fails, users can photograph the product label. The Edge Function sends the base64-encoded image to GPT-5.4 Vision with a prompt instructing extraction of product name, brand, and full INCI ingredient list into a structured JSON response. The extracted list is never silently accepted — the user always sees an editable confirmation screen labeled "AI-extracted — please verify." Extracted products are flagged as `vision_sourced: true` in the database and excluded from community product submissions until a second user independently confirms the same product's ingredient list.

### On-Device vs. Cloud Processing Decision

The on-device/cloud boundary is drawn at the cost and latency boundary:

- **On-device (zero latency, zero cost):** Deterministic conflict flag lookup against bundled JSON; streak calculation from local cache; routine recurrence calculation; basic skin score trend computation.
- **Cloud/Edge Function (network latency, API cost):** All LLM inference (Claude, GPT-5.4); barcode-to-product resolution; image upload and storage; subscription validation; background Skin Story generation.

The decision to not use `react-native-fast-tflite` in v1 is deliberate. The correlation engine is statistical (Pearson correlation on logged numeric data), not a trained ML model. There is no inference workload that benefits from on-device ML at this stage. Introducing TFLite would add significant setup complexity, model hosting overhead, and model update logistics for a problem that a statistical calculation running in the Edge Function solves adequately. On-device ML is re-evaluated if the Skin Story feature evolves to need more sophisticated pattern recognition in v2+.

### Fallback Mechanisms

The AI architecture is designed so that no single model failure blocks a core user flow:

**Claude API unavailable:** The on-device conflict rules JSON provides immediate, deterministic conflict flags without any quality degradation for common conflict pairs. The UI displays a non-alarmist banner: "Using offline ingredient data — some detailed explanations may not be available." The core conflict warning (is there a conflict?) still works. Only the nuanced explanation is missing.

**Skin Story generation failure (Inngest retry exhausted):** The dashboard displays the most recently generated Skin Story with its generation timestamp. A simplified statistical baseline (streak rate, average skin scores, most-used products) is computed client-side from raw `skin_logs` data — this is always available and ensures the Pro dashboard is never empty.

**RevenueCat unavailable:** The subscription tier is cached in Supabase Auth user metadata with a 48-hour validity window. Paying users retain Pro feature access for up to 48 hours without a successful RevenueCat check, covering virtually all plausible service disruption windows.

**Barcode lookup chain failure at any step:** The chain degrades through five steps to the always-available manual entry form. No user is ever blocked from adding a product.

### Prompt Management

Prompt templates are stored as versioned string constants in Edge Function source code, not in a database or external prompt management system. This approach was chosen because: (1) prompt changes require testing and should go through code review; (2) prompt versions are automatically tracked via git history; (3) no additional infrastructure dependency is introduced. The system prompt and user prompt are constructed separately — the system prompt defines Claude's role and constraints, the user prompt carries the structured data payload. Prompt format is validated against a JSON schema in the Edge Function before dispatch to catch malformed inputs early.

### Cost Optimization

The cost optimization strategy has six layers, applied in order of impact:

1. **Aggressive caching** — Upstash Redis caching of ingredient analysis responses by ingredient fingerprint hash. Expected 80%+ cache hit rate by Month 2. This is the single highest-impact lever: it reduces the most frequent AI call type by 4x.
2. **Tiered feature access** — Skin Story generation (the most expensive call at ~$0.032/user/month) is Pro-only. Free users (97% of the user base) generate no Skin Story AI costs.
3. **Batched background generation** — Skin Stories are generated in a controlled batch by Inngest, not on-demand per user. This enables predictable, budgetable API spend rather than spiky real-time usage.
4. **On-device pre-filtering** — The bundled conflict rules JSON eliminates Claude API calls entirely for ~80% of ingredient conflict checks, leaving only novel or nuanced combinations to reach the API.
5. **Model tier discipline** — Sonnet is used for all production paths. Opus is not used in v1 anywhere. The cost ratio between Opus and Sonnet makes Opus appropriate only for features where the quality difference is demonstrably user-facing.
6. **Prompt compression** — Ingredient lists are normalized (lowercased, deduplicated, truncated after position 30 in the INCI list) before Claude dispatch. Average input token count reduction of ~30% with negligible impact on conflict detection accuracy — the most important actives appear at the top of the INCI list.

Estimated steady-state cost: **$0.04–$0.09 per active user per month**, with the unit economics strongly positive from the first paying subscriber at $7.99/month.

---

## 5. API Architecture

### Endpoint Design

GlowLog's API surface consists of two layers: direct Supabase client calls (for standard CRUD operations) and Supabase Edge Function calls (for AI-enriched or orchestrated operations). The division is clear: if the operation is a simple read or write against a single table with RLS enforcement, it goes through the Supabase JS client. If it involves external services, AI inference, or multi-step orchestration, it goes through an Edge Function.

**Edge Function Endpoints:**

`POST /functions/v1/analyze-ingredients`
Accepts a JSON body with the routine's product list (each product containing its `id`, `name`, `product_type`, and `ingredient_list` array). Checks Upstash Redis using the SHA-256 hash of the normalized ingredient fingerprint. On cache miss, constructs a Claude prompt and awaits response. Returns conflict warnings and layering order. Caches result on write. Response time: <100ms on cache hit, <4s on cache miss (Claude inference). Rate limited to 20 calls per user per hour.

`POST /functions/v1/lookup-product`
Accepts a barcode string or search query. Executes the lookup chain: Upstash Redis → Open Food Facts REST API → Algolia search index. Returns product data or signals that manual entry is required. Rate limited to 30 calls per user per hour to prevent barcode scan spam.

`POST /functions/v1/generate-skin-story`
Called exclusively by Inngest — not directly by the client. Accepts a `user_id` parameter. Fetches aggregated skin log data from PostgreSQL, constructs the Claude prompt with pre-computed Pearson correlation values, calls Claude 4.5 Sonnet, and writes the result to the `skin_stories` table. The client reads from `skin_stories` directly via Supabase client — it never calls this endpoint.

`GET /functions/v1/explain-ingredient`
Accepts `ingredient_slug` and `experience_level` query parameters. Checks Upstash Redis. On cache miss, calls Claude for explanation. Returns structured JSON with description, benefits, cautions, and suitable skin types. Cache TTL: 90 days.

`POST /functions/v1/validate-schedule`
Accepts a structured weekly schedule object for a specific user. Called on routine save when actives are detected. Claude analyzes for dangerous day-adjacent combinations and returns warnings. Results are stored in a `schedule_warnings` field on the `routines` table and surfaced in the UI after save.

`POST /functions/v1/sync-subscription`
RevenueCat webhook receiver. Validates RevenueCat webhook signature. Updates `users.subscription_tier` and `users.subscription_cache_updated_at` in Supabase based on the event type (subscription purchased, cancelled, expired, renewed). No client-facing response — this is a server-to-server integration.

### Authentication and Authorization

Every Edge Function validates the incoming request's Supabase JWT before any business logic executes. The JWT is extracted from the `Authorization: Bearer {token}` header, verified against Supabase's JWT secret, and the resulting `user_id` is used for all subsequent database queries. Edge Functions never accept a `user_id` parameter from the client — the authenticated user's ID from the JWT is the only authoritative identity source.

The RevenueCat webhook endpoint is the sole exception: it validates the RevenueCat webhook signature (HMAC-SHA256) instead of a Supabase JWT, since it is called by RevenueCat's servers, not a user client.

Supabase RLS policies enforce data isolation at the database layer. Even if an Edge Function had a bug that constructed an incorrect `user_id` query, the RLS policy's `auth.uid() = user_id` check would prevent cross-user data access. Defense in depth: application-level filtering and database-level RLS both enforce isolation independently.

The Algolia search-only API key is embedded in the React Native client. This is the intended Algolia usage pattern — the search-only key cannot write to the index or access admin functions. Index writes use the admin API key, which is an Edge Function environment variable only.

### Caching Strategy

Three cache tiers operate independently and serve different latency profiles:

**Tier 1 — On-device bundle (0ms, 0 network cost):** The `ingredient_conflicts.json` file serves the fastest possible conflict detection for the ~500 most common conflict pairs. Updated via Expo Updates OTA. The top-5000 products cache is similarly bundled for instant product type lookups.

**Tier 2 — Upstash Redis (<100ms, negligible cost):** Server-side response cache for AI results and barcode lookups. All Edge Functions follow a cache-aside pattern: check Redis first → return cached response if hit → execute expensive operation if miss → write result to Redis before returning. Cache keys are deterministic and content-addressed (hashed from input data), ensuring the same ingredient combination always maps to the same cache key regardless of which user triggered it. This cross-user cache efficiency is a deliberate design choice — ingredient analysis results are not user-specific and can be safely shared.

**Tier 3 — PostgreSQL materialized (`skin_stories` table):** Skin Story summaries are pre-computed and stored as database records. The client reads from this table directly (via Supabase client, RLS-enforced) rather than triggering live LLM inference on dashboard load. Cache invalidation: the Inngest job regenerates the story weekly, or when the user manually requests a refresh (rate-limited to once per day for Pro users).

### Rate Limiting

Rate limiting is applied at the Edge Function middleware layer using Upstash Redis for count tracking. The pattern: a Redis key `ratelimit:{user_id}:{endpoint}` with a sliding window count and a TTL matching the window size. Limits are endpoint-specific and generous enough not to affect normal usage: 20 calls/hour for ingredient analysis, 30 calls/hour for barcode lookup, 5 manual Skin Story refreshes per day. Rate limit responses return HTTP 429 with a `Retry-After` header.

### Error Handling

Edge Functions follow a consistent error response envelope: `{ "error": { "code": "CONFLICT_ANALYSIS_FAILED", "message": "Ingredient analysis is temporarily unavailable", "fallback_used": true } }`. The client's TanStack Query error handling interprets this envelope and decides whether to surface an error to the user or silently fall back to a degraded experience. The `fallback_used` flag specifically signals to the client that on-device conflict rules have been applied and a degraded-but-functional result is available — this triggers the non-alarming banner rather than an error screen.

---

## 6. Infrastructure & Deployment

### Hosting

All backend infrastructure runs on Supabase's managed platform. The primary database, storage, authentication, and Edge Functions are co-located within the same Supabase project, minimizing network hops for inter-service communication. Supabase's EU region (`eu-west-1`) is selected as the default for GDPR alignment — EU user data remains in the EU. A US-region Supabase project is available for US-only users if data residency becomes a selling point; the client routing logic to select the correct region is handled at onboarding and stored in the user's session.

Supabase free tier (500MB database, 1GB storage, 50MB Edge Function bundle) covers 0–500 users. The Supabase Pro plan ($25/month) is the planned upgrade trigger at approximately 300 users, providing 8GB database, 100GB storage, daily backups, and the pg_cron extension needed for scheduled cleanup jobs.

Upstash Redis is hosted on Upstash's serverless infrastructure. The free tier (10,000 commands/day) covers approximately 500 active users. Pay-as-you-go pricing at $0.2 per 100K commands thereafter.

Inngest runs on Inngest's cloud infrastructure. The free tier (50,000 function runs/month) covers weekly Skin Story jobs for up to approximately 1,500 Pro users (4 runs/month each × 1,500 = 6,000 job executions, well within the limit).

### CI/CD Pipeline

EAS Build handles the iOS build pipeline. The workflow is:
1. Developer pushes to `main` → triggers EAS Build (development profile) automatically via GitHub Actions.
2. Development builds are distributed to internal testers via TestFlight automatically.
3. Production builds are triggered manually via `eas build --profile production` followed by `eas submit --platform ios` for App Store submission.

Supabase Edge Functions are deployed via the Supabase CLI (`supabase functions deploy {function-name}`). This is a manual step tied to git tags — no auto-deployment of Edge Functions on push, because Edge Function deployments require careful staging validation given they carry AI API keys.

Database migrations (`drizzle-kit generate` → `drizzle-kit push`) are applied to staging first, then production manually. A migration checklist in the repository's `DEPLOY.md` documents the sequence.

Ingredient conflict rules JSON updates are deployed via `eas update --channel production` — an OTA push that reaches all active users within 24 hours without App Store review.

### Environment Strategy

Three environments are maintained:

**Development** — Local Supabase instance (`supabase start`) with local Edge Functions (`supabase functions serve`). Uses mock RevenueCat credentials (StoreKit configuration file for local subscription testing). Algolia dev index. Upstash Redis development instance.

**Staging** — Separate Supabase project (identical schema, seeded with test data). Edge Functions deployed from the staging branch. RevenueCat sandbox environment. Algolia staging index. All integration tests run against staging. This is where the two-user RLS cross-access test runs before every production deployment.

**Production** — Live Supabase project. EAS production build profile. RevenueCat production app with live App Store shared secret. PostHog production project. Sentry production DSN.

Environment variables are managed through: Supabase project environment variables (for Edge Function secrets), EAS secrets (for build-time variables like Sentry DSN and PostHog key), and Expo config plugins (for runtime environment variables embedded in the app bundle).

### Monitoring and Observability

**Sentry** provides real-time crash and error alerting. Alert rules are configured for: Edge Function error rate exceeding 5% in a 5-minute window (pages immediately), React Native crash rate exceeding 1% (daily digest), AI API timeout rate exceeding 10% (immediate alert indicating a model provider issue).

**Supabase Dashboard** provides database query performance monitoring. The slow query log (queries >100ms) is reviewed weekly. Connection pool utilization alerts fire at 80% capacity.

**PostHog** provides funnel analysis, feature adoption tracking, and OTA update adoption curves. The update adoption curve specifically tracks whether ingredient conflict rule updates are reaching users — a version mismatch between client bundle and server expectations is a debugging risk.

**RevenueCat Dashboard** provides subscription lifecycle metrics: new subscriptions, cancellations, trial conversions (if trials are introduced in a later version), and MRR. Email alerts configured for first production subscription and any cancellation.

**Upstash Console** provides Redis cache hit rate monitoring. A cache hit rate below 50% at 60 days post-launch triggers an investigation into cache key construction correctness or TTL configuration.

**Inngest Dashboard** provides job run history, failure rates, and execution duration for the weekly Skin Story job. If the weekly job fails three consecutive times, an email alert fires.

---

## 7. Security & Compliance

### Authentication Security

Supabase Auth sessions use short-lived JWTs (1-hour expiry) with refresh token rotation. Refresh tokens are stored in `expo-secure-store` (iOS Keychain), not AsyncStorage — a deliberate security choice for a health-adjacent app where session token theft would expose sensitive skin condition data. On logout, both the local session and the Supabase server-side refresh token are invalidated.

Apple Sign-In is implemented following Apple's authentication guidelines — the identity token is validated server-side via Supabase Auth before a session is established. Email/password accounts require email confirmation before access is granted.

### Data Privacy Architecture

GlowLog collects data that is health-adjacent under GDPR Article 9 (skin conditions as health information). The consent architecture is designed accordingly:

**Onboarding consent** is explicit and specific — not a blanket ToS acceptance. Users see a plain-language consent screen that lists what data is collected, how it is used, and with whom it is shared (answer: Anthropic for ingredient analysis, OpenAI for label extraction if user-initiated, Supabase for storage). Consent is stored as a timestamped record in the `users` table.

**Progress photos** require a separate consent confirmation before the camera feature is activated for the first time. The consent explains: "Photos are stored on GlowLog's servers and are never analyzed by AI unless you explicitly trigger label scanning."

**Environmental data (location for UV index)** is opt-in, off by default, requested only when the user explicitly enables Environmental Tracking in settings. The permission prompt explains precisely what is collected and that location is never stored. The alternative (manual city name entry) is always available.

**AI inference calls** are constructed server-side in Edge Functions with PII stripped before dispatch. Prompts include numerical scores and product ingredient lists — not user names, email addresses, or any identifying information. All Claude and GPT API calls use the provider's API (not fine-tuning endpoints), meaning user data is not used to train models per standard API terms.

**Data export** (GDPR portability right) is a free-tier feature, not paywalled. A JSON export of all user data is available via a single button in Profile & Settings. The export includes all skin logs, routine definitions, product lists, and photo metadata (not the photos themselves, which are provided as download links).

**Account deletion** triggers a cascading database delete across all user-scoped tables and a Supabase Storage folder deletion. A `deletion_requests` record is created (containing only a hash of the user ID and the deletion timestamp) for the 30-day audit window.

**GDPR Data Processing Agreements** must be executed with Anthropic and OpenAI before any personal health data is included in API calls to these providers. This is a legal prerequisite for launch, not a post-launch task.

### Input Validation Strategy

All Edge Function inputs are validated against JSON schemas using a lightweight schema validation library (Zod-compatible for TypeScript type inference) before any business logic executes. Malformed inputs return HTTP 400 with a descriptive error — they never reach Claude or the database. Ingredient list arrays are validated for INCI name format (alphanumeric with spaces and hyphens, max 200 characters per ingredient, max 100 ingredients per product) before being passed to conflict analysis. This prevents prompt injection attempts via crafted ingredient names.

Barcode inputs are validated as numeric strings (UPC-A, EAN-13 format) before dispatch to Open Food Facts. SQL injection via Drizzle ORM's parameterized queries is not a concern — Drizzle generates parameterized SQL and never interpolates user input directly into query strings.

### API Security

All Edge Function endpoints require a valid Supabase JWT. Endpoints not callable by clients (the Skin Story generation endpoint, called only by Inngest) additionally check for a shared secret in the request headers — the Inngest webhook signature — rejecting any request that lacks it. This prevents unauthorized triggering of batch LLM inference jobs.

The Algolia admin API key (used for index writes) is stored exclusively as a Supabase Edge Function environment variable. The client-embedded Algolia key is search-only and scoped to the specific index. Regular rotation of all API keys is planned quarterly, with a key rotation runbook documented in the project README.

CORS headers on Edge Functions are configured to allow only the production app's bundle identifier — no browser-based access to the AI inference endpoints.

---

## 8. Technology Synergies & Integration Notes

### Supabase Auth ↔ PostgreSQL RLS

The most foundational synergy in the stack. Supabase Auth's `auth.uid()` function is available in all PostgreSQL RLS policy expressions without any additional configuration. Every table's RLS policy follows the pattern `USING (user_id = auth.uid())`. This means no application-level user ID filtering is needed — even a malformed query from the client cannot return another user's data. The `users` table is populated via a PostgreSQL trigger on `auth.users` INSERT, automatically creating the extended profile record at signup.

### Supabase Edge Functions ↔ Claude API

Edge Functions act as a security proxy for all Claude calls. The Claude API key never leaves the server environment. Edge Functions add auth verification (reject unauthenticated requests), rate limiting (prevent runaway API spend), input validation (prevent malformed prompts), and Upstash Redis caching (eliminate redundant API calls) before forwarding to Claude. This architecture means Claude is essentially a backend service dependency, not a client-facing integration — the client has no awareness of which AI model is being used.

### Supabase Edge Functions ↔ Upstash Redis

Every AI-calling Edge Function follows the cache-aside pattern: Redis check → return cached response (if hit) → call AI API (if miss) → write to Redis → return response. The Upstash `@upstash/redis` HTTP client is compatible with the Deno runtime (unlike traditional Redis TCP clients). Cache keys are constructed deterministically — SHA-256 hash of normalized input data — ensuring cross-user cache sharing for ingredient analysis results. Cache coherence is maintained by versioning the conflict rules JSON and including the version number in cache keys for ingredient analysis.

### RevenueCat ↔ Supabase Auth

RevenueCat webhooks are received by a dedicated Supabase Edge Function that updates the `subscription_tier` and `subscription_cache_updated_at` fields in the `users` table. The React Native client reads subscription status from the Supabase Auth user metadata (populated from these fields) rather than hitting RevenueCat on every feature gate evaluation. This creates a resilient, offline-capable subscription check backed by a server-authoritative source. The 48-hour cache validity window means the system degrades gracefully even during RevenueCat outages — the most common subscription disruption scenario.

### Inngest ↔ Supabase Edge Functions

Inngest calls a dedicated Supabase Edge Function (`/inngest`) as its webhook handler. This Edge Function validates the Inngest signature, routes to the appropriate job handler function, and executes the business logic (Skin Story generation, community moderation) as a standard Edge Function. Inngest provides the scheduling, retry logic, and concurrency control that Edge Functions lack natively (Edge Functions cannot maintain state across invocations or retry themselves). The separation of concerns is clean: Inngest owns orchestration, Edge Functions own execution.

### Expo Notifications ↔ PostgreSQL (RRULE data)

Routine reminders are implemented as local notifications scheduled on the device, driven by RRULE data stored in the `routines` table. When a user saves a routine, the React Native client reads the RRULE string and `reminder_time`, computes the next N notification fire times (accounting for the user's device timezone, including DST transitions), and schedules them via Expo Notifications. When the user travels across timezones, the app detects the timezone change on next foreground and reschedules all pending notifications. Push notification tokens from Expo Notifications are stored in the `users` table for potential future server-initiated notifications (e.g., Skin Story ready alerts).

### Expo Updates ↔ Upstash Redis (Cache Invalidation)

The bundled `ingredient_conflicts.json` carries a `version` integer. When an OTA update pushes a new conflict rules version to devices, the first Edge Function call after the update includes the new version number in the request headers (set by the client after loading the updated bundle). The Edge Function compares the incoming version to the cached version and selectively invalidates Redis cache entries for ingredient combinations where the conflict determination has changed. This prevents stale conflict analysis results from persisting after a rules update.

### expo-camera ↔ Open Food Facts (Barcode Scan Flow)

`expo-camera` in barcode scanning mode (SDK 52 — `expo-barcode-scanner` is removed and must not be referenced) captures the barcode value. This value is passed to the `/lookup-product` Edge Function, which first checks Upstash Redis for a cached result, then calls the Open Food Facts REST API if cache misses. The barcode scan to result display pipeline targets under 2 seconds for cache hits. The camera permission request is combined with a clear explanation of purpose: "To scan product barcodes from your shelf." If permission is denied, the barcode scan path is hidden and the user lands directly on the manual entry form.

### Sentry ↔ Supabase Edge Functions

Sentry's SDK is initialized in both the React Native client (using the Expo plugin) and in Supabase Edge Functions (using the Sentry Deno SDK). Edge Function errors are enriched with custom context before being sent to Sentry: the model called (claude/gpt5-vision), the cache hit/miss status, the input payload size in tokens, and the endpoint name. This enrichment enables filtering Sentry issues by "AI API failures" versus "database query failures" versus "client navigation crashes" — critical for rapid triage when an error alert fires.

---

## 9. Technical Risks & Mitigations

### Risk 1: Claude API Hallucination on Ingredient Conflict Advice

**Risk:** Claude confidently states an incorrect conflict or marks a safe combination as dangerous. Given that GlowLog's value proposition includes trustworthy ingredient guidance, a hallucinated conflict warning (e.g., claiming retinol and hyaluronic acid conflict, when they do not) would erode trust and generate negative reviews. A missed genuine conflict could cause a user to unknowingly irritate their skin.

**Mitigation:** The deterministic conflict rules JSON is the authoritative source for conflict detection. Claude cannot override it — Claude's role is explanation and nuance only. The system prompt for ingredient analysis explicitly instructs Claude to rely on the provided conflict flags from the rules engine and not introduce novel conflict claims. All conflict-related UI copy is labeled "Based on known ingredient interactions" and includes a "consult a dermatologist for personalized advice" disclaimer. The golden test set of 30 ingredient scenarios is validated manually before every production Edge Function deployment. If Claude's explanation for a known conflict is demonstrably wrong, the prompt template is rolled back via environment variable without code deployment.

### Risk 2: Barcode Scan Produces Incorrect Ingredient Data via Vision Extraction

**Risk (v1.1, when Vision is enabled):** GPT-5.4 Vision misreads an ingredient label — particularly for Korean or Japanese text — and populates an incorrect ingredient list. This incorrect list then drives flawed conflict analysis for that user and any other users who subsequently find the same product in the community database.

**Mitigation:** Vision-extracted ingredient lists are never silently accepted. The user sees the parsed list in an editable confirmation screen before anything is saved. The UI explicitly labels it "AI-extracted — please verify." Vision-sourced products are flagged `vision_sourced: true` in the database and are excluded from community product submissions until a second independent user confirms the same product's ingredient list. GPT-5.4 Vision confidence scoring is used to trigger a lower-confidence warning when the model's output uncertainty is high (indicated by hedging language in the response). The confirmation step cannot be skipped — it is not an optional review.

### Risk 3: LLM Vendor Lock-In (Anthropic/OpenAI)

**Risk:** Anthropic changes Claude's pricing significantly, deprecates the Sonnet model tier, or experiences an extended outage. Given that three of GlowLog's five AI features use Claude, a pricing increase of 2–3x would materially affect unit economics.

**Mitigation:** All Claude API calls are made through an internal `AIService` interface abstracted in the Edge Function layer. Swapping Claude for GPT-5.2 (via the `openai-gpt5` slug) or Google Gemini requires changing the model adapter implementation, not the calling code. The bundled on-device conflict rules JSON ensures the most critical user-facing feature (ingredient conflict detection) operates with zero LLM dependency. Skin Story generation degrades gracefully to statistical summaries if Claude is unavailable. No user-facing feature is 100% dependent on a single AI vendor's uptime — the system always has a functional fallback state.

### Risk 4: Ingredient Analysis Latency Disrupts UX

**Risk:** The Claude API call for ingredient conflict analysis takes 3–5 seconds, creating a noticeable pause when a user saves a routine or opens the conflict guide. Given that the app is positioned as simple and fast, a multi-second spinner on a routine save would feel broken.

**Mitigation:** The UX pattern decouples immediate feedback from enriched analysis. When a user saves a routine, the on-device conflict rules JSON provides instant (< 50ms) conflict flags that appear immediately in the UI — the save feels instant. The Claude enrichment (plain-language explanation, precise layering order) loads asynchronously in the background and populates the conflict detail cards when available, typically within 1–2 seconds on LTE. The user can navigate away immediately after save and return to see the enriched results. A 3-second hard timeout on the Claude call falls back to on-device rules with a "Detailed analysis unavailable" note. Upstash Redis cache hits return in under 100ms and eliminate the Claude call entirely for recurring ingredient combinations — the most common scenario after the first few weeks of usage.

### Risk 5: Spurious Skin Story Correlations Undermine Trust

**Risk:** The Skin Story correlation engine surfaces a false positive — telling a user that Product X is causing their breakouts when the correlation is coincidental. A user who trusts this and discontinues a beneficial product would experience a negative outcome and lose trust in the app's core analytical value proposition.

**Mitigation:** Statistical thresholds gate insight display: a minimum of 14 data points, a minimum Pearson correlation coefficient of |r| ≥ 0.4, and a minimum 30-day logging history before any correlation claim is surfaced. Below these thresholds, the dashboard shows descriptive statistics only (average scores, streak rate) without pattern claims. All correlation language in the Claude prompt template and in the UI is explicitly probabilistic — the phrase "causes" is excluded from the prompt instructions. Every insight card displays the data point count and a "How is this calculated?" explanation one tap away. The UI frames insights as hypotheses to explore, not diagnoses.

### Risk 6: Algolia Cost Escalation Beyond Free Tier

**Risk:** As the product database grows and search volume increases with user growth, Algolia search costs exceed the free tier (10K searches/month) and create an unbudgeted recurring expense.

**Mitigation:** PostHog event tracking fires on every product search call, enabling real-time visibility into monthly search volume. A Slack alert is configured at 80% of the free tier threshold (8,000 searches/month). The search interface in Edge Functions is abstracted behind a `SearchService` layer — swapping Algolia for Meilisearch v1.x self-hosted on a $6/month VPS is a configuration-level change, not a rewrite. Meilisearch is specifically evaluated as the v2 primary search solution if Algolia costs exceed $30/month. At MVP launch, community product search is deferred entirely — only Open Food Facts and manual entry are available — so Algolia cost pressure is minimal until v1.1.

### Risk 7: GDPR Health Data Classification Creates Launch Bloat

**Risk:** Treating skin condition data as GDPR special category (Article 9) data introduces consent flow complexity, Data Processing Agreement requirements with AI vendors, and potential app store policy friction that delays launch beyond the 16-week timeline.

**Mitigation:** Consent complexity is managed through a single, clear onboarding consent screen in plain language (not a legal document). The explicit consent record is stored in the `users` table. DPAs with Anthropic and OpenAI are identified as pre-launch legal prerequisites — not post-launch tasks — and should be initiated in Week 1 alongside technical development. The AI prompt architecture (stripping PII from all prompts before dispatch) reduces the sensitivity of what is technically being transmitted to AI vendors. Progress photos have a separate, additional consent confirmation before the camera feature activates, addressing the biometric-adjacent classification risk. COPPA is addressed by the 17+ App Store rating, avoiding the most complex regulatory layer for the US market.

### Risk 8: Environmental Data Permission Denial Undermines Skin Story Differentiation

**Risk:** A significant portion of users decline location permission, making the environmental correlation layer (UV index, humidity) unavailable for much of the user base. If this is a key differentiator, permission denial undermines the product's competitive positioning.

**Mitigation:** Environmental tracking is explicitly opt-in, off by default, and never requested during onboarding. The permission is requested only when the user actively enables "Environmental Tracking" in Settings — at which point their intent is already established and denial is less likely. If permission is denied, the environmental correlation feature is hidden rather than shown as an error state. A city name text input is available as an alternative — the user types their city, which is used for Open-Meteo API lookup with no device location access. The Skin Story feature remains valuable and differentiated even without environmental data: routine consistency correlation with skin scores alone provides meaningful insights. Environmental data is positioned as an enhancement, not a dependency.

---

*Document prepared for GlowLog v1.0 architecture review. All technology version references reflect the March 2026 current stable ecosystem. This document describes intended architecture — implementation specifics are deferred to execution prompt sequences.*