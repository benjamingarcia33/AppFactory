# Cognitize — Technical Architecture Document

**Version:** 1.0
**Platform:** iOS (React Native / Expo)
**Audience:** Technical Lead / Senior Engineer
**Status:** Pre-Development — Architecture Review

---

## Overview

Cognitize is an AI-powered speech coaching application that actively pressures users mid-speech through real-time interruptions, follow-up questions, and conversational pivots — in contrast to the passive recording-and-playback paradigm that dominates the current market. The architecture must simultaneously satisfy four competing constraints: sub-second AI response latency during live sessions, robust offline capability for privacy-conscious users, ethical and transparent billing infrastructure, and a unit economics model that sustains a generous free tier without sacrificing AI quality.

This document describes the complete technical architecture for the iOS MVP, covering platform selection, data modeling, AI integration patterns, security posture, and the specific design decisions made in response to identified technical risks.

---

## 1. Platform & Technology Stack

### Frontend

**React Native 0.74 with Expo SDK 51 (Managed Workflow)**
Expo's managed workflow is the correct choice for a solo-developed, iOS-first application on a 16-week timeline. It eliminates the overhead of maintaining native build configurations while still providing direct access to the device APIs Cognitize requires: microphone recording via `expo-av`, push notifications via `expo-notifications`, local file storage via `expo-file-system`, and biometric authentication via `expo-local-authentication`. The managed workflow's primary constraint — limited access to arbitrary native modules — does not impact this project, as every required capability has a first-class Expo equivalent.

TypeScript is used throughout the codebase. NativeWind v4 provides Tailwind-syntax styling within React Native, eliminating the context switching between web and native styling paradigms and accelerating UI development. React Navigation v6 handles the tab and stack navigation structure. Zustand manages global application state; its minimal API surface and lack of boilerplate make it appropriate for a solo developer compared to Redux Toolkit's steeper overhead. Expo SQLite provides the local-first data layer for session history, transcripts, and offline queue management.

**Alternatives Considered:** A pure React Native CLI project would have provided more native flexibility but introduced significant build maintenance overhead. Flutter was evaluated and rejected due to the existing JavaScript/TypeScript competency assumed across the stack and the superior ecosystem for Supabase and RevenueCat SDKs in the React Native world.

---

### Authentication

**Supabase Auth**
Supabase Auth provides email/password authentication with built-in session management, JWT token refresh, and native integration with the rest of the Supabase ecosystem. Row Level Security policies in PostgreSQL are defined against `auth.uid()`, meaning every database query is automatically user-scoped without additional application-layer enforcement. This tight coupling between the auth layer and the data layer is a primary reason for choosing Supabase as the foundational platform.

**Expo AuthSession (with expo-apple-authentication)**
Apple Sign-In is a hard requirement for App Store compliance on iOS applications that offer any social login option. `expo-apple-authentication` provides the native iOS Sign-In with Apple flow within the managed workflow. Google Sign-In is handled via `expo-auth-session` with an OAuth redirect URI registered in the Supabase dashboard. Both social providers are configured to flow through Supabase Auth, which normalizes the identity into a single user model regardless of provider.

---

### Database

**Supabase PostgreSQL (Cloud)**
Supabase PostgreSQL serves as the authoritative cloud database for user profiles, session metadata, feedback scores, scenario definitions, subscription state, and aggregated progress metrics. It is co-located with the authentication and edge function infrastructure, which eliminates cross-service network hops for the most common data access patterns. Row Level Security is enforced at the database level across all user-facing tables, providing defense in depth against application-layer authorization bugs.

**Expo SQLite (On-Device)**
Expo SQLite provides a local-first data layer on the device. Session history, transcripts, and recordings are written to SQLite immediately upon session completion, before any network sync attempt. This ensures the app is fully functional for history reads and progress display even when the Supabase connection is unavailable. The local cache holds 90 days of session summaries and serves as the primary read source for progress charts, with Supabase acting as the sync target and long-term archive. This dual-database architecture is central to the offline capability and performance promises.

**Alternatives Considered:** WatermelonDB was evaluated as a more sophisticated local database with built-in sync capabilities, but its additional complexity was not warranted for the MVP's data access patterns. Expo SQLite with a hand-rolled sync layer is simpler to reason about and audit.

---

### AI & Audio Services

**Deepgram (Nova-2 Streaming STT)**
Deepgram is the primary speech-to-text engine for all live pressure sessions. Its Nova-2 model delivers sub-300ms streaming transcription via a persistent WebSocket connection, with word-level timestamps and native voice activity detection (VAD) with end-of-utterance signaling. These specific capabilities are non-negotiable for the interruption engine: word-level timestamps enable precise pacing calculation, and end-of-utterance VAD signals are one of three inputs to the interruption trigger. No other commercially available streaming STT API matches Deepgram's combination of latency and VAD quality at this price point.

**OpenAI Whisper (openai-whisper API)**
Whisper serves as the cloud-side fallback when Deepgram's WebSocket connection drops or latency exceeds a 2-second threshold. For offline sessions where the device lacks network connectivity sufficient for streaming, locally cached audio is queued for batch Whisper transcription when connectivity is restored. Whisper's role is explicitly secondary — it is not fast enough for real-time interruption triggering, but it is reliable enough to ensure no session audio is ever lost without feedback.

**GPT-4o (gpt-4o-2024-08-06)**
GPT-4o is the cognitive core of the Pressure Simulation Engine. It receives the rolling session transcript and scenario context via a structured system prompt, then uses function calling to output typed interruption events — `interrupt`, `follow_up`, `pivot`, or `challenge` — with accompanying spoken text. GPT-4o's streaming output capability is used to begin piping the interruption text to the TTS layer before the full response is generated, minimizing the perceived gap between the user's pause and the AI's interjection. It is also used for the post-session qualitative feedback layer: generating plain-language explanations and identifying two strengths and two improvement areas from the session transcript. Critically, GPT-4o does not compute the numerical scores — those are computed deterministically by the edge function layer — it only generates the explanatory text that accompanies pre-computed values.

**Claude API (claude-3-5-sonnet)**
Claude serves two distinct roles. First, it is the fallback for GPT-4o when the OpenAI API returns a 5xx error or fails to respond within 3 seconds — the same system prompts are maintained for both models to ensure continuity. Second, for the premium longitudinal analysis feature, Claude's 200K token context window makes it uniquely suited to synthesizing months of compressed session summaries into a holistic speaking identity report. This batch analysis workload is latency-tolerant, making Claude's analytical depth the relevant selection criterion rather than GPT-4o's speed advantage.

**ElevenLabs TTS (Turbo v2)**
ElevenLabs provides the AI interviewer voice output during pressure sessions. The psychological realism of the pressure simulation is materially dependent on voice quality — a robotic or stilted AI voice reduces the stress response that makes the training effective. ElevenLabs' Turbo v2 model provides the best available combination of naturalness and latency among commercially available TTS APIs. A professional, authoritative voice preset is configured per scenario type. The cost exposure of real-time TTS is managed through an aggressive pre-generation caching strategy described in Section 4.

---

### Payments & Subscriptions

**RevenueCat**
RevenueCat is the industry-standard iOS subscription management layer, abstracting StoreKit 2 receipt validation, subscription state machines, entitlement management, and webhook delivery. The ethical billing model — one-tap cancellation, pause-before-cancel, 3-day pre-renewal reminders, and transparent pricing display — is implemented through RevenueCat's SDK hooks, entitlement management, and webhook integration with the Supabase backend. Attempting to build this subscription infrastructure directly against StoreKit 2 would introduce significant legal and financial risk for a feature that is a core brand promise. RevenueCat's free tier covers up to $2,500 MRR, which is sufficient for the first several months post-launch.

---

### Analytics & Observability

**PostHog**
PostHog provides product analytics, session event tracking, and feature flags within a single SDK. The critical activation funnel — signup → onboarding completion → first session → second session → premium conversion — is instrumented through PostHog. Feature flags enable the onboarding A/B test (calibration-first vs scenario-first flow) and will support gradual rollout of new premium scenarios post-launch. PostHog's open-source architecture and EU data residency option support GDPR compliance requirements. All PostHog event properties are anonymized at collection — no PII is included in event payloads, with users identified only via hashed internal IDs.

**Sentry**
Sentry provides crash reporting, error rate monitoring, and performance tracing for both the React Native client and the Supabase Edge Functions. Source maps are uploaded during EAS Build via the `sentry-expo` plugin, ensuring production crash reports reference original TypeScript file names and line numbers. Custom performance traces are configured around the session start-to-first-interruption latency, which is the most business-critical performance metric. Alert thresholds are set at >1% error rate and >5 second p95 session start latency.

---

### Deployment & Infrastructure

**Supabase Edge Functions (Deno Runtime)**
Edge Functions serve as the Backend-for-Frontend layer. All third-party AI API keys live exclusively in Edge Function environment variables — the mobile binary contains no secrets. Functions handle session orchestration, the Deepgram WebSocket proxy, interruption generation, feedback pipeline execution, TTS serving, and RevenueCat webhook processing.

**Expo EAS Build & EAS Update**
EAS Build compiles the iOS application binary and manages TestFlight distribution and App Store submission. EAS Update enables over-the-air JavaScript bundle deployment post-launch, which is critical for rapid iteration on AI prompts, scenario content, and bug fixes without requiring App Store review cycles. The rollback strategy relies on EAS Update channel pinning to revert all users to a prior stable bundle within minutes of a production incident.

---

## 2. System Architecture Overview

Cognitize follows a **Backend-for-Frontend (BFF)** pattern with a **local-first mobile client**. The architecture has four distinct layers, each with clear responsibility boundaries.

### Layer 1: Mobile Client (React Native / Expo)

The client is responsible for UI rendering, audio capture, local data persistence, and user interaction. It never communicates directly with any third-party AI service. All outbound AI and analytics requests are either proxied through Supabase Edge Functions or batched through SDK layers (PostHog, RevenueCat) that manage their own transmission. The client maintains a local SQLite database as the primary read source for session history and progress data, with Supabase serving as the eventual-consistency sync target.

Audio capture is handled via `expo-av`, which streams raw 16kHz mono PCM to the Edge Function WebSocket proxy in real time during live sessions. Locally, `expo-av` simultaneously writes a compressed session recording to the device file system for post-session replay.

### Layer 2: Supabase Edge Functions (BFF / API Gateway)

Edge Functions are thin orchestration layers, not business logic containers. Each function has a single well-defined responsibility:

- **`/session-start`** — Validates session parameters, initializes the GPT-4o conversation context in memory, opens the Deepgram WebSocket connection, and returns a session token to the client.
- **`/deepgram-proxy`** — A persistent WebSocket relay that forwards PCM audio from the client to Deepgram and returns transcript events downstream. Runs the interruption timing logic (VAD signal + 800ms silence window + clause boundary check) and emits interruption trigger events when all three conditions are met.
- **`/generate-interruption`** — Receives an interruption trigger with the last 2,000 tokens of session transcript, calls GPT-4o (or Claude fallback) with streaming output, and pipes the response to the ElevenLabs TTS function.
- **`/generate-feedback`** — Triggered on session end. Receives the complete Deepgram transcript with timestamps, runs deterministic scoring (filler word regex, WPM calculation, confidence marker detection), passes transcript and scores to GPT-4o for qualitative explanation generation, and returns a structured feedback payload.
- **`/tts-serve`** — Checks the Supabase Storage cache for a pre-generated audio file matching the requested phrase. Returns the cached Opus file if available; otherwise calls ElevenLabs API and caches the result before returning.
- **`/revenucat-webhook`** — Receives RevenueCat subscription lifecycle events, updates the `subscriptions` table in PostgreSQL, and triggers push notification scheduling for pre-renewal reminders.

### Layer 3: Supabase Platform (Database, Auth, Storage)

PostgreSQL stores the canonical application state. Auth manages identity and session tokens. Storage holds pre-generated TTS audio assets (public bucket) and optional user session recordings (private, RLS-protected bucket). All three components share the same Supabase project, enabling native integration between auth identity and data access policies.

### Layer 4: Third-Party AI & Service APIs

Third-party services are reached exclusively from Edge Functions, never from the client:

- **Deepgram** — Receives audio stream from the proxy Edge Function via WebSocket
- **OpenAI (GPT-4o, Whisper)** — Receives transcript context and structured prompts for interruption generation and feedback
- **Anthropic (Claude)** — Receives same prompts as GPT-4o fallback; receives compressed session archives for longitudinal analysis
- **ElevenLabs** — Receives text strings for TTS synthesis; responses are cached in Supabase Storage

RevenueCat and PostHog SDKs communicate directly from the client to their respective cloud services, as both are purpose-built for mobile-side instrumentation and do not require server-side key management.

### Communication Patterns

| Client → Edge Function | WebSocket (Deepgram proxy), HTTPS (all other calls) |
|---|---|
| Edge Function → Deepgram | WebSocket streaming |
| Edge Function → OpenAI | HTTPS with streaming (SSE) |
| Edge Function → ElevenLabs | HTTPS with chunked audio streaming |
| Edge Function → Anthropic | HTTPS |
| RevenueCat → Edge Function | HTTPS webhook (POST) |
| Client → Supabase Auth | HTTPS (Supabase JS SDK) |
| Client → Supabase PostgreSQL | HTTPS (Supabase JS SDK, JWT-authenticated) |

---

## 3. Data Model & Database Schema

### Core Entities

**`users`**
The user profile record, created automatically via a PostgreSQL trigger on `auth.users` insert. Stores display name, primary speaking goal (enum: `interviews | presentations | debates | general`), self-assessed level (enum: `beginner | intermediate | advanced`), calibrated starting difficulty (integer 1–5), profile avatar storage path, and timestamps. This separation from `auth.users` follows Supabase best practices and enables RLS policies that reference `auth.uid()` directly.

**`scenarios`**
The scenario definition table, populated at launch with the 6 MVP scenarios and expanded monthly. Each scenario record contains a name, description, category (enum: `interview | pitch | debate | presentation | difficult_conversation | impromptu`), difficulty rating (integer 1–5), estimated duration range, the GPT-4o system prompt template (stored as a parameterized text field with `{difficulty}` and `{user_context}` interpolation points), an array of pressure tactics used, a `requires_premium` boolean, and display metadata. This table is read-only from the client side; writes are admin-only.

**`speaking_sessions`**
The central transactional record for every practice session. Links to `users` via `user_id` and to `scenarios` via `scenario_id`. Records session start and end timestamps, total duration in seconds, difficulty level at time of session, network mode during session (`online | offline | degraded`), interruption count, and the storage path for the local session recording if the user opts in to cloud sync. This table drives all progress calculations and history display.

Indexed on `(user_id, created_at DESC)` for fast chronological history queries. Indexed on `(user_id, scenario_id)` for per-scenario progress aggregation.

**`session_feedback`**
One-to-one child of `speaking_sessions`. Stores all computed scores for the session: `filler_word_count` (integer), `filler_words_per_minute` (float), `wpm` (integer), `clarity_score` (float 0–100), `coherence_score` (float 0–100), `confidence_score` (float 0–100), `overall_score` (float 0–100), and `gpt_qualitative_summary` (JSONB containing the strengths array, improvements array, and plain-language score explanations). The deterministic scores are stored as separate typed columns rather than in the JSONB blob to enable SQL aggregation for progress chart queries. GPT-4o's qualitative output is stored as JSONB since it is display-only and not aggregated.

**`session_transcripts`**
Stores the full Deepgram word-level transcript output for a session as a JSONB array of `{word, start_ms, end_ms, confidence}` objects. Linked to `speaking_sessions` via `session_id`. This table is the source of truth for the annotated transcript replay feature and is used as input to the feedback pipeline. Stored separately from `session_feedback` because the transcript data is large (a 10-minute session generates ~1,500 word objects) and is not always needed — history list views and progress charts never access it.

Retention policy: transcript records older than 12 months are archived to Supabase Storage as compressed JSON and deleted from the live table, preventing unbounded table growth.

**`user_progress`**
A materialized summary table updated by a PostgreSQL function after each session is written. Stores rolling averages: `avg_overall_score_7d`, `avg_overall_score_30d`, `avg_wpm_30d`, `avg_filler_rate_30d`, `total_sessions`, `total_practice_minutes`, `current_streak_days`, `longest_streak_days`, and `last_session_date`. This table eliminates the need to run expensive aggregation queries on `session_feedback` for dashboard and profile display. Updated via a `AFTER INSERT ON session_feedback` trigger that calls a PostgreSQL function.

**`subscriptions`**
Mirrors the authoritative RevenueCat subscription state in PostgreSQL. Written exclusively by the `/revenucat-webhook` Edge Function. Contains `user_id`, `rc_customer_id`, `entitlement` (enum: `free | premium`), `product_id`, `status` (enum: `active | cancelled | paused | in_grace_period | expired`), `current_period_end` timestamp, `renewal_reminder_sent` boolean, and `updated_at`. The client reads entitlement state from this table rather than calling RevenueCat on every render, ensuring instant feature gating without network dependency.

### Local SQLite Schema (On-Device)

The local schema mirrors a subset of the cloud schema for offline support: a `sessions` table with the same columns as `speaking_sessions` plus a `sync_status` column (enum: `pending | synced | failed`), a `transcripts` table with the same structure as `session_transcripts`, and a `progress_cache` table holding the last 90 days of session summary data for chart rendering. A `sync_queue` table records pending write operations that failed due to network unavailability, enabling reliable eventual consistency.

### Migration Strategy

Database schema migrations are managed via Supabase's built-in migration system, with migration SQL files version-controlled in the repository under `/supabase/migrations`. Each migration is named with a timestamp prefix and describes its intent in the file name. Migrations are applied to the development Supabase project first, validated against the test suite, then applied to production via the Supabase CLI as part of the deployment process. Breaking changes (column renames, type changes) are handled in two-phase migrations: add the new column and backfill in migration N, drop the old column in migration N+1 deployed after client adoption.

---

## 4. AI Integration Architecture

### Processing Model: Hybrid On-Device and Cloud

The AI processing architecture follows a deliberate tiered model based on latency requirements, privacy sensitivity, and network dependency:

**Cloud (Primary Path — Live Sessions):**
All real-time pressure simulation runs in the cloud when network quality exceeds a 50ms RTT threshold checked at session start. The Deepgram → GPT-4o → ElevenLabs chain delivers the full-fidelity pressure simulation experience. Post-session feedback analysis always runs cloud-side for quality consistency regardless of network conditions during the session.

**Cloud (Fallback Path — Degraded Network):**
When Deepgram streaming is unavailable but HTTPS connectivity exists, Whisper cloud API handles transcription in batch mode with a 2-second audio buffer. GPT-4o interruptions continue with slightly increased latency; if GPT-4o is unreachable, Claude API receives the same request. Pre-cached TTS audio handles interruptions without ElevenLabs.

**Offline (Minimum Viable Path):**
When no usable network exists, the session continues in a reduced mode: `expo-av` records the full session locally, and a local audio queue stores the file for post-session Whisper transcription when connectivity returns. Real-time AI interruptions are replaced by a local pool of 10 pre-cached generic pressure questions per scenario, played via iOS `AVSpeechSynthesizer`. Feedback is generated once the session transcript is available, which may be minutes or hours after the session ends. This mode is described honestly to the user with a non-blocking status indicator — no false impression is created that the AI is listening in real time.

### Interruption Engine Design

The interruption trigger uses three independent signals that must all be satisfied before an interruption fires:

1. **Deepgram VAD end-of-utterance signal** — confirms the user has stopped producing speech
2. **800ms minimum silence window** — prevents interruptions on intra-sentence pauses typical of deliberate speech
3. **Clause boundary classifier** — a lightweight rule-based check running on the rolling transcript in the Edge Function that confirms the most recent utterance ended at a syntactically complete unit (clause-final punctuation inferred from Deepgram's smart formatting output)

When all three conditions are met, the `/deepgram-proxy` Edge Function emits an interruption trigger to `/generate-interruption`, which passes the rolling transcript context (last 2,000 tokens, managed via sliding window with oldest context pruned first) to GPT-4o with the scenario system prompt. GPT-4o returns a typed function call output specifying the interruption type and text. The text is immediately forwarded to `/tts-serve` while GPT-4o continues streaming, minimizing the gap between trigger and audio playback onset.

A 200ms jitter buffer is applied to the trigger mechanism to smooth Deepgram latency variance. If Deepgram latency exceeds 500ms for three consecutive 1-second chunks, the session automatically reduces to a lower-frequency interruption mode (maximum one interruption per 90 seconds) to prevent mis-timed interjections.

### Scoring Architecture: Deterministic + Generative Separation

This is a critical design decision that protects the core brand promise of honest, non-black-box scoring.

**Deterministic computation (Edge Function, not AI):**
- Filler word count and rate — regex-based detection on the Deepgram transcript against a curated list of filler words and phrases, with false-positive guards for legitimate uses (e.g., "like" as a verb vs. "like" as a filler)
- Words per minute — calculated from the word timestamp arrays provided by Deepgram: `(total_words / (last_word_end_ms - first_word_start_ms)) * 60000`
- Speaking time vs. silence ratio — derived from word timestamp gaps in the transcript

**Statistical computation (Edge Function, rule-based):**
- Pacing variance — standard deviation of inter-word gaps normalized against an ideal conversational speech distribution
- Confidence marker frequency — keyword matching against a predefined list of hedging phrases ("I think," "maybe," "sort of," "I'm not sure") expressed as a rate per minute

**Generative computation (GPT-4o, explanation only):**
GPT-4o receives the pre-computed scores alongside the transcript and is prompted to generate the plain-language explanation for each score, identify the two most impactful strengths, and generate two specific, actionable improvement suggestions with transcript timestamps. GPT-4o's structured JSON output is validated by the Edge Function against the pre-computed scores — if the generated explanation contradicts a computed value (e.g., claims "you used no filler words" when the regex count is 12), the explanation is flagged and regenerated with a correction prompt before delivery.

This separation means GPT-4o cannot hallucinate the numbers. It can only explain numbers that the rule-based system has already verified.

### Prompt Management

Scenario system prompts are stored in the `scenarios` table as parameterized templates rather than hardcoded in Edge Function source. This enables prompt iteration via database update without a code deployment. Prompt changes are rolled out through EAS Update for client-side context and via Supabase dashboard for Edge Function-side prompts, with immediate effect.

The static portion of the GPT-4o system prompt (persona definition, interruption rules, output schema) is eligible for OpenAI's prompt caching feature, which provides a 50% cost reduction on repeated identical prompt prefixes. The session-specific context (scenario type, user difficulty level, current transcript) is appended after the cached static prefix. This structure is intentionally designed to maximize the cacheable token proportion.

GPT-4o-mini is used for the real-time interruption decision logic (lower stakes, higher frequency, latency-critical) while full GPT-4o is reserved for the post-session coherence and confidence analysis (quality-critical, latency-tolerant, lower frequency). This tiered model usage reduces the interruption engine's token costs by approximately 80% relative to using full GPT-4o throughout.

### TTS Caching Strategy

The top 200 interruption phrases — determined by scenario type frequency analysis and common adversarial conversation patterns — are pre-generated as ElevenLabs Turbo v2 Opus audio files and stored in the `tts-cache` public Supabase Storage bucket. These assets are downloaded to device storage on first app launch and cached for the lifetime of the installation. This eliminates ElevenLabs API calls for an estimated 70% of interruption audio events. Only novel, contextually dynamic follow-up questions (the 30% that require real-time generation) incur live TTS API costs.

### Longitudinal Analysis (Premium — Claude)

Claude 3.5 Sonnet receives compressed session summaries (stripped of transcripts, containing only metadata and scored metrics) spanning the user's full history. The compression step removes redundant text and normalizes whitespace, reducing token count by approximately 20–30% before transmission. The Claude analysis produces a longitudinal speaking identity report identifying patterns invisible in single-session feedback: recurring filler words under specific pressure types, pacing regression under interruption stress, and coherence trends across scenario categories. This runs as a batch job weekly for premium users, not in a user-blocking flow.

---

## 5. API Architecture

### Backend-for-Frontend Pattern

The BFF architecture is enforced at the infrastructure level: the Supabase Edge Functions are the only permitted callers of OpenAI, Deepgram, Anthropic, and ElevenLabs APIs. There is no path by which the mobile client can reach these services directly, even if a user inspects the application binary. API keys live exclusively in Supabase Edge Function environment variables, managed via the Supabase secrets store.

### Edge Function Endpoints

| Endpoint | Method | Auth Required | Purpose |
|---|---|---|---|
| `/session-start` | POST | JWT | Initialize session context, validate entitlement, open Deepgram proxy |
| `/deepgram-proxy` | WebSocket | JWT | Relay audio to Deepgram, run interruption trigger logic |
| `/generate-interruption` | POST | JWT (internal) | GPT-4o/Claude interruption generation with scenario context |
| `/generate-feedback` | POST | JWT | Deterministic scoring + GPT-4o explanation for session end |
| `/tts-serve` | GET | None (public CDN cache) | Serve cached or on-demand TTS audio |
| `/revenucat-webhook` | POST | Webhook signature | Process subscription lifecycle events from RevenueCat |
| `/health` | GET | None | Pre-warm ping, used by app foreground pre-warm strategy |

### Authentication Flow

All client requests to Edge Functions include the Supabase JWT from the active user session in the `Authorization: Bearer` header. Edge Functions validate the JWT against the Supabase Auth service on each request. User identity extracted from the validated token (`auth.uid()`) is used to scope database reads and writes within the function, preventing any cross-user data access.

The `/revenucat-webhook` endpoint uses a separate webhook signature verification mechanism (HMAC-SHA256 of the payload body using a shared secret configured in both RevenueCat and the Edge Function environment) rather than JWT auth, since webhooks originate from RevenueCat's servers, not from an authenticated user session.

### Rate Limiting

Rate limiting is enforced within Edge Functions using a lightweight counter stored in Supabase PostgreSQL. Two limits are enforced:
- Free tier: maximum 3 sessions per calendar day, maximum 2 concurrent session starts per hour
- Premium tier: maximum 10 session starts per hour (burst protection, not a usage cap)

Rate limit state is checked at `/session-start` before any downstream AI API calls are initiated, preventing runaway costs from rapid repeated session attempts. A 429 response includes a human-readable `X-Rate-Limit-Reset` header indicating when the limit resets, enabling the client to display an accurate countdown rather than a generic error.

### Caching Strategy

**Edge Function response caching:** The `/tts-serve` endpoint serves pre-generated audio from Supabase Storage with aggressive HTTP cache headers (1-year max-age for static assets, content-hash-keyed URLs for cache busting on regeneration). Feedback responses for identical transcripts are cached in PostgreSQL with a SHA-256 content hash key — repeated practice of the same prepared speech does not re-invoke GPT-4o.

**Client-side caching:** The Supabase JS SDK's built-in response caching is used for scenario library fetches (scenario definitions change infrequently, cached for 1 hour). Progress chart data is served from local SQLite, which is treated as the authoritative cache for data up to 15 minutes old. On app foreground, if the last Supabase sync was more than 15 minutes ago, a background refresh is triggered without blocking the UI render.

**Edge Function pre-warming:** When the app foregrounds, the client sends a lightweight GET to `/health` for the three most critical Edge Functions. This triggers Supabase's runtime to keep the function instances warm in anticipation of an imminent session start, reducing cold start latency from a potential 2–4 seconds to under 500ms.

### Error Handling Patterns

All Edge Function responses use a consistent error envelope:

```
{
  "error": {
    "code": "DEEPGRAM_UNAVAILABLE",
    "message": "Human-readable description",
    "fallback_active": true,
    "retry_after_ms": null
  }
}
```

Error codes are typed enums known to the client, enabling specific UI responses rather than generic error displays. The `fallback_active` flag informs the client whether a degraded experience is in progress, allowing the appropriate status indicator to be shown.

---

## 6. Infrastructure & Deployment

### Hosting Architecture

The entire server-side infrastructure runs on Supabase's managed platform:
- **Supabase PostgreSQL** — managed, auto-scaled, daily automated backups enabled
- **Supabase Edge Functions** — Deno runtime, deployed to the `us-east-1` region for the North American launch audience; EU region (`eu-central-1`, Frankfurt) for GDPR-compliant EU user data routing
- **Supabase Storage** — S3-compatible object storage for TTS cache and optional session recordings
- **Supabase Auth** — managed identity service co-located with the database

The iOS application binary is built and distributed via Expo EAS:
- **EAS Build** — cloud-based native compilation for iOS, producing `.ipa` for TestFlight and App Store distribution
- **EAS Update** — over-the-air JavaScript bundle delivery for post-launch patching

### CI/CD Pipeline

The pipeline has three stages triggered by Git branch events:

**Development builds** (triggered on push to `develop` branch): Run the Jest test suite via EAS Build's `test` profile. If tests pass, build an internal distribution `.ipa` for TestFlight internal testing. Sentry source maps are uploaded automatically via the `sentry-expo` EAS plugin.

**Preview builds** (triggered on pull request to `main`): Build a TestFlight external testing build. Supabase migrations are applied to the staging Supabase project. A manual QA checklist review gates promotion to production.

**Production builds** (triggered on merge to `main` with a version tag): Build the App Store submission binary via EAS Submit. Apply Supabase migrations to the production project via Supabase CLI in the pipeline. EAS Update's production channel is updated with the new JS bundle.

### Environment Strategy

Three environments are maintained:
- **Development** — local Supabase instance via Supabase CLI (`supabase start`), Expo Go or development build on physical device, all API keys pointing to test accounts with spend limits
- **Staging** — dedicated Supabase project (separate from production), StoreKit sandbox environment, TestFlight distribution, staging PostHog project
- **Production** — production Supabase project, live App Store, production PostHog, API spend limits enforced

Environment-specific configuration is managed through Expo's `.env` file system with the `expo-constants` manifest, ensuring no production keys are ever compiled into a development build binary.

### Monitoring & Observability

**Sentry** monitors both the React Native client and Edge Functions. Custom performance spans are instrumented around:
- App cold start to Home screen render
- Session start tap to first Deepgram audio frame received
- Session end tap to feedback screen fully rendered
- Edge Function execution time per function

Alert policies: error rate >1% in a 5-minute window triggers an email alert; p95 session start latency >5 seconds triggers an email alert; Edge Function error rate >5% in a 5-minute window triggers an immediate alert.

**PostHog** provides product-level observability: daily active users, session completion rate, Day-1/7/30 retention cohorts, free-to-premium conversion funnel, and feature usage breakdown by scenario type. A dashboard is pre-configured before launch with all Day-1 success metrics visible.

**Better Uptime** monitors the `/health` Edge Function endpoint on a 1-minute interval, with SMS alerting on downtime. This provides independent uptime monitoring outside the Sentry ecosystem.

**Supabase dashboard** provides query performance monitoring with slow query alerts set at >500ms. Connection pool utilization is monitored to anticipate scaling requirements before they become incidents.

---

## 7. Security & Compliance

### Authentication & Authorization

Supabase Auth issues short-lived JWTs (1-hour expiry) with automatic refresh via 7-day refresh tokens. All PostgreSQL tables are protected by Row Level Security policies that enforce `user_id = auth.uid()` constraints on SELECT, INSERT, UPDATE, and DELETE operations. This means even a misconfigured Edge Function cannot return one user's data to another — the database itself enforces isolation.

Apple Sign-In is implemented using Apple's private email relay feature, which means Cognitize never stores a user's real Apple ID email unless the user chooses to share it — fully compliant with Apple's requirements and consistent with the privacy-first positioning.

### API Security

No third-party API keys are present in the mobile application binary. The Supabase anon key (which is intentionally public in Supabase's security model) is the only service credential in the client binary; all privileged operations require a valid user JWT. Edge Functions validate JWTs on every invocation, with Supabase's built-in JWT verification library — no custom JWT handling code.

The RevenueCat webhook endpoint validates the HMAC-SHA256 payload signature before processing any subscription state change, preventing spoofed webhook attacks that could grant unauthorized premium access.

### Data Privacy — GDPR/CCPA

**Audio data handling:** Raw audio is never stored server-side in the default configuration. During live sessions, the Deepgram proxy Edge Function relays the audio stream to Deepgram without persisting it. Deepgram is configured with `no-store` and `redact` API parameters on all production requests. OpenAI API calls use the data usage opt-out header. Only the derived transcript (text, not audio) is persisted to the database. Users who opt into cloud audio backup via the Settings screen have their recordings stored in a private Supabase Storage bucket with per-user encryption keys derived from their user ID.

**Consent and data subject rights:** EU/EEA users are presented with a granular consent screen before their first session, covering audio processing (explicit consent under GDPR Art. 6(1)(a)), transcript storage, and optional cloud sync. A one-tap "Delete All My Data" flow in Settings triggers deletion of all Supabase PostgreSQL records, Supabase Storage files in the user's private bucket, and a PostHog user deletion API call. This flow is tested as one of the 8 critical integration test scenarios before each release.

Data Processing Agreements are executed with Deepgram, OpenAI, Anthropic, ElevenLabs, and PostHog before launch. The Supabase project for EU users is deployed to the Frankfurt (`eu-central-1`) region to satisfy data residency requirements.

**Analytics anonymization:** PostHog event properties contain no PII. User identity in PostHog is linked via a hashed internal user ID, never email or name. IP anonymization is enabled in the PostHog SDK configuration.

**Retention policies:** Local session audio auto-deletes after 30 days unless the user explicitly saves it. Cloud audio (opt-in) is retained for 12 months then auto-purged with a 30-day advance notification. Session transcripts older than 12 months are archived and removed from the live database.

**COPPA:** The app is rated 17+ in App Store Connect and includes an age gate at onboarding. No data is collected from users under 13. This is enforced at the product level (age gate) and documented in the App Store privacy nutrition label.

### Input Validation

All user-facing inputs to Edge Functions are validated against typed schemas using Zod-compatible validation at the function entry point. Session parameters (duration, difficulty level, scenario ID) are range-checked before any downstream API calls are initiated. Transcript data passed to GPT-4o is sanitized to remove any injected prompt-manipulation text patterns (prompt injection mitigation). Scenario selection is validated against the user's current entitlement to prevent premium scenario access by free tier users via crafted API requests.

---

## 8. Technology Synergies & Integration Notes

### Supabase Auth ↔ Supabase PostgreSQL

The Supabase ecosystem's tightest integration is between Auth and the database. User creation in `auth.users` triggers a PostgreSQL function that automatically creates the corresponding `users` table row with default values. All RLS policies use `auth.uid()` as the scope predicate, meaning every query from the Supabase JS SDK on the client is automatically user-scoped without any application-level WHERE clause required. This eliminates an entire category of authorization bugs common in handcrafted middleware layers.

### Supabase Edge Functions ↔ Deepgram

The Deepgram WebSocket proxy pattern requires the Edge Function to maintain a persistent bidirectional connection — one side to the client, one side to Deepgram. The Deno runtime's native WebSocket support handles this without a third-party library. The interruption timing logic (VAD + silence window + clause boundary) runs within this same Edge Function, colocated with the transcript stream, minimizing the latency between a trigger condition being met and the interruption generation request being dispatched to GPT-4o.

### Supabase Edge Functions ↔ OpenAI GPT-4o

Edge Functions call GPT-4o with streaming enabled (Server-Sent Events). The stream is immediately forwarded to the ElevenLabs TTS endpoint and then to the client audio buffer as audio chunks arrive — the user begins hearing the AI's interruption before GPT-4o has finished generating the full sentence. The static system prompt prefix (persona + rules + output schema, approximately 800 tokens) is designed to be identical across all sessions of the same scenario type, maximizing OpenAI's prompt cache hit rate and reducing effective per-session token costs.

### RevenueCat ↔ Supabase PostgreSQL

RevenueCat is the authoritative subscription state store, but the app never queries RevenueCat in real time for feature gating decisions. The webhook-to-Edge-Function pipeline keeps the `subscriptions` table in PostgreSQL synchronized within seconds of any subscription event. The client reads entitlement state from the local SQLite cache (sourced from the PostgreSQL `subscriptions` table), making scenario lock/unlock decisions entirely without a network call. This means premium feature access is fast, offline-tolerant, and not dependent on RevenueCat's API availability.

### RevenueCat ↔ Expo Notifications

The 3-day pre-renewal reminder is orchestrated through the intersection of these two systems. When RevenueCat fires a `RENEWAL` webhook, the Edge Function calculates `current_period_end - 3 days`, sets the `renewal_reminder_sent = false` flag in the `subscriptions` table, and schedules a push notification via the Expo Notifications API for that timestamp. A separate scheduled Edge Function runs daily to catch any webhooks that may have failed delivery and re-schedules notifications for subscribers whose `renewal_reminder_sent` is still false within the 3-day window.

### ElevenLabs ↔ Supabase Storage

Pre-generated TTS audio files are stored as Opus-encoded files in a public Supabase Storage bucket with content-hash-keyed filenames. On first app launch (or after a content update), the app downloads the full 200-file cache to device storage. The `/tts-serve` Edge Function performs a cache lookup in the database before making any ElevenLabs API call — the lookup is a simple indexed key-value check with under 5ms latency, fast enough to remain in the interruption delivery path.

### PostHog ↔ Expo Updates

PostHog feature flags are evaluated synchronously after Expo Updates completes its check for new bundles on app foreground. This sequencing means that new feature flags can be bundled with OTA updates and activated immediately upon download, without requiring users to close and reopen the app. The onboarding A/B test flag is read during the onboarding flow initialization, ensuring every user receives a consistent variant for the duration of their onboarding regardless of updates during the process.

### Sentry ↔ EAS Build

The `sentry-expo` EAS Build plugin injects the Sentry source map upload step into the build process automatically. Each production build generates a unique Sentry release identifier matched to the EAS build number, enabling precise correlation between a crash report and the exact code version that produced it. This is particularly important for diagnosing post-OTA-update issues, since EAS Update changes the JS bundle without changing the native binary version number.

---

## 9. Technical Risks & Mitigations

### Risk 1: GPT-4o Feedback Hallucination Destroying User Trust

**Description:** If GPT-4o fabricates filler word counts, pacing scores, or coherence ratings that don't reflect the actual session transcript, users will distrust the feedback system — which is the central brand differentiator.

**Mitigation:** All numerical scores are computed deterministically in the Edge Function using rule-based NLP (regex filler detection, timestamp-derived WPM, statistical pacing variance) before GPT-4o is invoked. GPT-4o's sole role in the feedback pipeline is generating natural-language explanations for pre-computed values. The Edge Function validates GPT-4o's output against the computed scores before delivery; any explanation that contradicts a computed value (detectable by scanning the generated text for numerical claims that don't match the stored values) triggers an automatic regeneration with a correction prompt. GPT-4o cannot hallucinate numbers it is not responsible for generating.

### Risk 2: Interruption Timing Errors Making the Experience Feel Broken

**Description:** Deepgram latency spikes could cause the interruption engine to fire mid-word rather than at natural pause points, making the AI feel clumsy rather than challenging — destroying the psychological pressure effect that is the product's core value.

**Mitigation:** The three-signal interruption trigger (VAD + 800ms silence + clause boundary) means interruptions cannot fire based on Deepgram signal alone. The 200ms jitter buffer smooths transient latency spikes. If Deepgram latency exceeds 500ms for three consecutive 1-second chunks, the session automatically downgrades to a lower-frequency interruption mode (maximum one per 90 seconds), which is less challenging but not broken. Interruption timing accuracy is validated pre-launch against a golden dataset of 20 annotated speech samples, with a threshold of less than 10ms deviation from natural pause points for 90% of triggered interruptions.

### Risk 3: ElevenLabs TTS Vendor Lock-In and Pricing Instability

**Description:** ElevenLabs has historically revised its pricing and API terms. Heavy dependency on a single TTS provider for the session's primary audio output creates fragility in both cost and continuity.

**Mitigation:** All TTS calls are abstracted behind an internal `VoiceService` interface in the codebase. `AVSpeechSynthesizer` (iOS native) is implemented as a fully functional zero-cost fallback in the production codebase, not a future TODO. The 200-phrase pre-generation cache means a complete ElevenLabs outage affects only real-time dynamic TTS (estimated 30% of audio events during a session). An ElevenLabs outage with the native fallback active degrades voice quality but does not break the session flow. Quarterly evaluation of OpenAI TTS API as a secondary provider is scheduled as a recurring architecture review item.

### Risk 4: On-Device Whisper Thermal and Battery Impact

**Description:** Running Whisper inference on-device for offline sessions on older iOS hardware could cause thermal throttling, excessive battery drain, and app termination — directly contradicting the stability promise.

**Mitigation:** For the MVP, on-device Whisper inference is deferred — the offline path uses the device to record audio locally and queues the file for cloud Whisper batch transcription when connectivity is restored, with a user-visible "Offline mode — feedback pending sync" indicator. This eliminates the thermal risk entirely for the launch version. On-device Whisper inference (using the `small` 39M parameter model via CoreML) is scoped for a post-launch release, at which point a device capability benchmark at first launch will route devices below iPhone XS (A12 chip) permanently to the cloud path.

### Risk 5: GDPR/CCPA Liability from Inadvertent Third-Party Data Retention

**Description:** If Deepgram, OpenAI, or Anthropic inadvertently retains user audio or transcript data beyond their stated policies, Cognitize faces regulatory liability and reputational damage that conflicts with its privacy-first positioning.

**Mitigation:** Deepgram is configured with `no-store` and `redact` parameters on all production API requests. OpenAI API calls include the data usage opt-out header. All third-party DPAs are executed before launch. A canary test runs monthly: a synthetic transcript containing a planted unique phrase string is submitted to each AI API, and the application's model outputs are monitored for any recurrence of that phrase in subsequent sessions, providing an empirical signal of inadvertent training data leakage. A quarterly privacy audit reviews the API configurations of all three AI vendors for policy changes that would require contract renegotiation.

### Risk 6: RevenueCat or App Store Infrastructure Failure Locking Paid Users Out

**Description:** A RevenueCat outage or App Store receipt validation failure could cause paying users to lose access to premium features, generating chargebacks, App Store reviews, and reputational damage to the ethical billing brand promise.

**Mitigation:** Entitlement state is cached locally in SQLite with a 24-hour validity window. Users are never locked out of premium features due to a billing API outage that lasts less than 24 hours. A 72-hour grace period is implemented for subscription renewal failures before access is downgraded, giving users time to resolve payment issues without punitive lockout. A manual entitlement override tool is built into the admin dashboard (Supabase Table Editor with a protected admin role) for customer support to restore access within minutes. All subscription state changes are written to the `subscriptions` table with a full audit trail for dispute resolution.

### Risk 7: Edge Function Cold Start Latency Undermining the Reliable Experience Promise

**Description:** Supabase Edge Functions can experience 2–4 second cold start delays after periods of inactivity, causing the first session start of a day to feel unacceptably slow.

**Mitigation:** The app implements a pre-warm strategy triggered on every foreground event: a lightweight GET to the `/health` endpoint of the three most critical Edge Functions fires 15 seconds after app foreground, which is before the median user initiates a session. During active usage periods, functions remain warm. For the initial app load, the session start interaction is preceded by at minimum the scenario detail screen (where the user adjusts difficulty and reads the scenario description), providing a natural 10–20 second warm-up window before the session actually begins.

### Risk 8: Subscription Dark Patterns Triggering App Store Rejection

**Description:** Apple's App Store Review Guidelines have become increasingly strict about subscription flows, particularly around trial disclosures and cancellation accessibility. A rejection on first submission would delay launch and damage team morale.

**Mitigation:** The premium upgrade screen is designed with equal-prominence accept and decline buttons, explicit trial start and renewal dates shown before any tap commitment, and a direct link to Apple's subscription management from within the app. The RevenueCat SDK's StoreKit 2 implementation follows Apple's canonical subscription presentation guidelines. The App Store submission includes reviewer notes explicitly walking through the subscription flow, a demo account with premium access, and annotated screenshots of the paywall screen. A full Guideline 3.1.1 compliance review against Apple's current subscription guidelines is conducted in the week before submission.

---

*Document prepared for technical review. Architecture decisions reflect the constraints of a solo-developer iOS MVP on a 16-week timeline with a monthly infrastructure budget of $0–$200 at launch. All technology selections have been validated against the unit economics model: free tier COGS of approximately $0.076/user/month and premium tier COGS of approximately $0.266/user/month against a $14.99 ARPU, yielding approximately 98% AI cost gross margin at scale.*