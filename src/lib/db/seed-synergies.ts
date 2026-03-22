import { db } from "@/lib/db";
import { techSynergies } from "./schema";
import { v4 as uuid } from "uuid";

/**
 * Idempotent seed function for tech synergy entries.
 * Uses ON CONFLICT DO NOTHING so it can be run multiple times safely.
 *
 * Synergies encode relationships between technology choices:
 *   - recommended: ecosystem pairings that unlock deeper integration
 *   - compatible: work well together with some wiring
 *   - redundant: pick one or the other
 *   - incompatible: cannot be used together
 */
export async function seedSynergies() {
  const synergies = [
    // ============================================
    // RECOMMENDED — Supabase ecosystem
    // ============================================
    {
      id: uuid(),
      techSlugA: "supabase-auth",
      techSlugB: "supabase-postgresql",
      relationship: "recommended",
      reason:
        "Supabase Auth writes user records directly into the Postgres auth.users table, giving you Row Level Security policies with zero extra glue.",
      promptNote:
        "Use Supabase Auth's built-in auth.users table and enable RLS on every public table. Reference auth.uid() in policy definitions so each user can only access their own rows.",
    },
    {
      id: uuid(),
      techSlugA: "supabase-auth",
      techSlugB: "supabase-storage",
      relationship: "recommended",
      reason:
        "Supabase Storage reuses the same Auth JWT, so upload/download permissions are enforced through the same RLS policies as database rows.",
      promptNote:
        "Create storage buckets with RLS enabled. Use the auth.uid() helper in storage policies so users can only read/write files in their own folder path.",
    },
    {
      id: uuid(),
      techSlugA: "supabase-postgresql",
      techSlugB: "supabase-realtime",
      relationship: "recommended",
      reason:
        "Supabase Realtime listens to Postgres WAL changes on any table, delivering row-level broadcasts with no extra infrastructure.",
      promptNote:
        "Enable Realtime on specific tables via supabase.channel() and subscribe to INSERT/UPDATE/DELETE events. Combine with RLS so clients only receive rows they are authorized to see.",
    },
    {
      id: uuid(),
      techSlugA: "supabase-postgresql",
      techSlugB: "supabase-storage",
      relationship: "recommended",
      reason:
        "Storage metadata (bucket, path, size) can be joined against your Postgres tables, and both share the same project and auth layer.",
      promptNote:
        "Store the Supabase Storage object path as a text column in your Postgres table. Use supabase.storage.from(bucket).getPublicUrl(path) to resolve URLs at render time.",
    },
    {
      id: uuid(),
      techSlugA: "supabase-postgresql",
      techSlugB: "supabase-edge-functions",
      relationship: "recommended",
      reason:
        "Edge Functions run on the same Supabase project and can import the service-role client to bypass RLS for background jobs.",
      promptNote:
        "Inside Edge Functions, create a Supabase client with the SUPABASE_SERVICE_ROLE_KEY to perform admin-level Postgres operations. Invoke functions from the client SDK or via database webhooks.",
    },

    // ============================================
    // RECOMMENDED — Firebase ecosystem
    // ============================================
    {
      id: uuid(),
      techSlugA: "firebase-auth",
      techSlugB: "firebase-firestore",
      relationship: "recommended",
      reason:
        "Firebase Auth tokens are natively available in Firestore Security Rules via request.auth, enabling per-document access control with zero middleware.",
      promptNote:
        "Reference request.auth.uid in Firestore Security Rules. Structure documents with an ownerId field and match it against request.auth.uid for user-scoped reads/writes.",
    },
    {
      id: uuid(),
      techSlugA: "firebase-auth",
      techSlugB: "firebase-cloud-messaging",
      relationship: "recommended",
      reason:
        "FCM device tokens can be associated with Firebase Auth UIDs so push notifications target authenticated users instead of anonymous devices.",
      promptNote:
        "After sign-in, call getToken() and store the FCM device token in a Firestore doc keyed by the Auth UID. Send targeted notifications server-side by looking up tokens for a given user.",
    },
    {
      id: uuid(),
      techSlugA: "firebase-firestore",
      techSlugB: "firebase-cloud-messaging",
      relationship: "recommended",
      reason:
        "Firestore triggers (onCreate, onUpdate) can fire Cloud Functions that send FCM push notifications, creating an event-driven notification pipeline.",
      promptNote:
        "Use a Firestore onCreate trigger on a 'notifications' collection to send FCM messages. Write a new document to that collection whenever a push-worthy event occurs.",
    },

    // ============================================
    // RECOMMENDED — AI SDK combos
    // ============================================
    {
      id: uuid(),
      techSlugA: "vercel-ai-sdk",
      techSlugB: "claude-api",
      relationship: "recommended",
      reason:
        "Vercel AI SDK provides streaming React hooks (useChat, useCompletion) with a built-in Anthropic provider, making Claude integration a one-liner.",
      promptNote:
        "Use the @ai-sdk/anthropic provider in your route handler with streamText(). On the client, useChat() auto-handles streaming, loading state, and message history.",
    },
    {
      id: uuid(),
      techSlugA: "vercel-ai-sdk",
      techSlugB: "openai-gpt4",
      relationship: "recommended",
      reason:
        "Vercel AI SDK ships with a first-party OpenAI provider, giving you streaming, structured output, and tool-calling via the same unified API for GPT-4.1 and o3 models.",
      promptNote:
        "Use the @ai-sdk/openai provider with streamText() or generateObject(). The SDK normalizes tool calls and structured output across models so you can swap providers later.",
    },

    // ============================================
    // RECOMMENDED — Expo ecosystem
    // ============================================
    {
      id: uuid(),
      techSlugA: "expo-notifications",
      techSlugB: "eas-build",
      relationship: "recommended",
      reason:
        "EAS Build handles the iOS/Android push credential provisioning that Expo Notifications requires, eliminating manual certificate management.",
      promptNote:
        "Run eas credentials to configure push keys automatically. EAS Build embeds them into the binary so expo-notifications works out of the box on physical devices.",
    },
    {
      id: uuid(),
      techSlugA: "expo-location",
      techSlugB: "expo-image-picker",
      relationship: "recommended",
      reason:
        "Both are Expo managed-workflow modules sharing the same permissions system, so combining them for geotagged photo capture is seamless.",
      promptNote:
        "Request Location and Camera permissions together via expo-location and expo-image-picker. Attach the GPS coordinates from Location.getCurrentPositionAsync to each captured image's metadata.",
    },

    // ============================================
    // RECOMMENDED — Deployment
    // ============================================
    {
      id: uuid(),
      techSlugA: "vercel",
      techSlugB: "supabase-postgresql",
      relationship: "recommended",
      reason:
        "Vercel has a native Supabase integration that auto-provisions environment variables and connects your project with one click from the Vercel dashboard.",
      promptNote:
        "Add the Supabase integration from the Vercel dashboard to auto-inject NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY into all environments.",
    },
    {
      id: uuid(),
      techSlugA: "vercel",
      techSlugB: "supabase-edge-functions",
      relationship: "recommended",
      reason:
        "Vercel hosts the Next.js frontend while Supabase Edge Functions handle background work; both deploy globally with minimal latency.",
      promptNote:
        "Call Supabase Edge Functions from Vercel API routes or directly from the client using supabase.functions.invoke(). Keep long-running tasks in Edge Functions to avoid Vercel's execution time limits.",
    },

    // ============================================
    // RECOMMENDED — ORM pairings
    // ============================================
    {
      id: uuid(),
      techSlugA: "drizzle-orm",
      techSlugB: "supabase-postgresql",
      relationship: "recommended",
      reason:
        "Drizzle ORM connects directly to Supabase's Postgres instance, giving you type-safe queries with zero overhead on top of Supabase's managed database.",
      promptNote:
        "Use the postgres.js driver with Drizzle and set prepare: false for Supabase's connection pooler. Define your schema in drizzle and use drizzle-kit push to sync with the Supabase database.",
    },
    {
      id: uuid(),
      techSlugA: "drizzle-orm",
      techSlugB: "planetscale",
      relationship: "recommended",
      reason:
        "Drizzle has a first-party PlanetScale driver using their serverless HTTP API, perfect for edge runtimes where TCP connections are not available.",
      promptNote:
        "Use drizzle-orm/planetscale-serverless with the @planetscale/database driver. This works in Vercel Edge Functions and Cloudflare Workers without TCP socket support.",
    },

    // ============================================
    // REDUNDANT — pick one or the other
    // ============================================
    {
      id: uuid(),
      techSlugA: "supabase-auth",
      techSlugB: "firebase-auth",
      relationship: "redundant",
      reason:
        "Both are full-featured auth providers. Using both adds unnecessary complexity; pick the one that matches your database choice.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "supabase-auth",
      techSlugB: "clerk",
      relationship: "redundant",
      reason:
        "Both handle sign-up, sign-in, and session management. Clerk offers richer UI components but adds a separate auth layer on top of Supabase.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "supabase-auth",
      techSlugB: "nextauth",
      relationship: "redundant",
      reason:
        "Both solve authentication for Next.js apps. Supabase Auth is tighter with Supabase services; NextAuth is provider-agnostic.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "supabase-postgresql",
      techSlugB: "firebase-firestore",
      relationship: "redundant",
      reason:
        "Both are primary data stores. Supabase is relational SQL; Firestore is NoSQL. Pick the paradigm that fits your data model.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "supabase-postgresql",
      techSlugB: "planetscale",
      relationship: "redundant",
      reason:
        "Both are managed SQL databases. Using both means two sources of truth for relational data; consolidate into one.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "drizzle-orm",
      techSlugB: "prisma",
      relationship: "redundant",
      reason:
        "Both are TypeScript ORMs for SQL databases. Drizzle is lighter and SQL-closer; Prisma has a richer ecosystem. Pick one.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "stripe",
      techSlugB: "lemonsqueezy",
      relationship: "redundant",
      reason:
        "Both handle payment processing and subscription billing. Lemon Squeezy acts as merchant of record; Stripe gives more control. Choose one.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "posthog",
      techSlugB: "mixpanel",
      relationship: "redundant",
      reason:
        "Both are product analytics platforms with event tracking, funnels, and user segmentation. Running both doubles instrumentation work for marginal benefit.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "google-maps-sdk",
      techSlugB: "mapbox",
      relationship: "redundant",
      reason:
        "Both provide map rendering, geocoding, and routing. Mapbox offers more style customization; Google Maps has richer POI data. Pick one.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "expo-notifications",
      techSlugB: "onesignal",
      relationship: "redundant",
      reason:
        "Both handle push notifications in React Native/Expo apps. OneSignal adds a dashboard but duplicates what Expo Notifications already provides.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "supabase-storage",
      techSlugB: "aws-s3",
      relationship: "redundant",
      reason:
        "Supabase Storage is built on S3-compatible object storage. Using raw AWS S3 alongside it creates two file backends for the same purpose.",
      promptNote: null,
    },

    // ============================================
    // INCOMPATIBLE
    // ============================================
    {
      id: uuid(),
      techSlugA: "stripe",
      techSlugB: "revenucat",
      relationship: "incompatible",
      reason:
        "RevenueCat manages its own Stripe connection internally. Connecting Stripe directly alongside RevenueCat causes webhook conflicts and double-charges.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "firebase-firestore",
      techSlugB: "drizzle-orm",
      relationship: "incompatible",
      reason:
        "Drizzle ORM generates SQL queries and only works with relational databases. Firestore is a NoSQL document store with its own SDK; Drizzle cannot connect to it.",
      promptNote: null,
    },

    // ============================================
    // COMPATIBLE — work together with wiring notes
    // ============================================
    {
      id: uuid(),
      techSlugA: "clerk",
      techSlugB: "supabase-postgresql",
      relationship: "compatible",
      reason:
        "Clerk handles auth and session management while Supabase provides the database. Requires syncing Clerk user IDs into Supabase via webhooks.",
      promptNote:
        "Set up a Clerk webhook (user.created, user.updated) that upserts a profiles row in Supabase keyed by the Clerk user ID. Use the Clerk JWT template to mint Supabase-compatible JWTs for RLS.",
    },
    {
      id: uuid(),
      techSlugA: "nextauth",
      techSlugB: "supabase-postgresql",
      relationship: "compatible",
      reason:
        "NextAuth can use Supabase Postgres as its session/account store via the @next-auth/supabase-adapter, keeping auth data alongside app data.",
      promptNote:
        "Install @next-auth/supabase-adapter and configure it in your NextAuth options. The adapter auto-creates users, accounts, and sessions tables in your Supabase Postgres database.",
    },
    {
      id: uuid(),
      techSlugA: "sentry",
      techSlugB: "vercel",
      relationship: "compatible",
      reason:
        "Sentry's Vercel integration auto-instruments serverless functions and uploads source maps on each deploy for accurate stack traces.",
      promptNote:
        "Add the Sentry integration from the Vercel Marketplace. It auto-configures SENTRY_DSN, uploads source maps during build, and tags releases with the Vercel deployment URL.",
    },
    {
      id: uuid(),
      techSlugA: "sentry",
      techSlugB: "eas-build",
      relationship: "compatible",
      reason:
        "Sentry's Expo plugin hooks into EAS Build to upload native source maps and dSYMs, enabling symbolicated crash reports for iOS and Android.",
      promptNote:
        "Add @sentry/react-native and the Sentry Expo plugin to app.config.js. EAS Build will automatically upload source maps and debug symbols during the build step.",
    },

    // ============================================
    // COMPATIBLE — Firebase cross-ecosystem
    // ============================================
    {
      id: uuid(),
      techSlugA: "firebase-auth",
      techSlugB: "mapbox",
      relationship: "compatible",
      reason:
        "Firebase Auth provides user identity while Mapbox provides map rendering. They operate in separate domains and integrate via user ID for personalized map experiences.",
      promptNote:
        "After Firebase Auth sign-in, use the authenticated user ID to fetch and display user-specific map data (saved locations, custom pins). Mapbox does not require auth integration — just pass user context from Firebase to your data layer.",
    },
    {
      id: uuid(),
      techSlugA: "firebase-firestore",
      techSlugB: "stripe",
      relationship: "compatible",
      reason:
        "Firestore stores app data while Stripe handles payments. Requires Cloud Functions to sync Stripe webhook events to Firestore documents.",
      promptNote:
        "Create a Cloud Function triggered by Stripe webhooks that writes subscription status to a Firestore document at users/{uid}/subscription. Read this document client-side to gate premium features. Store stripe_customer_id in the user's Firestore profile on first checkout.",
    },

    // ============================================
    // REDUNDANT — Expo / Mobile notifications
    // ============================================
    {
      id: uuid(),
      techSlugA: "expo-notifications",
      techSlugB: "firebase-cloud-messaging",
      relationship: "redundant",
      reason:
        "Expo Notifications uses FCM under the hood for Android. Adding Firebase Cloud Messaging directly creates two notification pipelines competing for the same device token.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "google-maps-sdk",
      techSlugB: "expo-location",
      relationship: "compatible",
      reason:
        "Google Maps SDK provides map rendering while Expo Location provides GPS coordinates. Combine them for location-aware map features in Expo apps.",
      promptNote:
        "Use expo-location to get the user's current position with Location.getCurrentPositionAsync(), then pass the coordinates to react-native-maps (Google provider) to center the map. Listen to location updates with watchPositionAsync() for real-time tracking on the map.",
    },

    // ============================================
    // RECOMMENDED — AI ecosystem
    // ============================================
    {
      id: uuid(),
      techSlugA: "claude-api",
      techSlugB: "langchain",
      relationship: "compatible",
      reason:
        "LangChain provides chain orchestration and RAG tooling while Claude API provides the underlying language model. LangChain adds abstraction overhead but enables complex multi-step workflows.",
      promptNote:
        "Use @langchain/anthropic's ChatAnthropic class as the model in your LangChain chains. This is useful for RAG pipelines, agents with tool calling, and multi-step reasoning workflows. For simple chat or structured output, prefer calling Claude directly to avoid LangChain's overhead.",
    },
    {
      id: uuid(),
      techSlugA: "openai-gpt4",
      techSlugB: "langchain",
      relationship: "recommended",
      reason:
        "LangChain has first-class OpenAI support with the deepest integration — function calling, tool use, structured output, and streaming all work seamlessly through @langchain/openai with GPT-4.1 and o3.",
      promptNote:
        "Use @langchain/openai's ChatOpenAI class as the model with GPT-4.1. LangChain's tool-calling agent and structured output chain work best with OpenAI's function calling API. Use createOpenAIFnRunnable() for structured extraction tasks.",
    },
    {
      id: uuid(),
      techSlugA: "openai-whisper",
      techSlugB: "claude-api",
      relationship: "compatible",
      reason:
        "Whisper transcribes audio to text, then Claude can analyze, summarize, or extract structured data from the transcript. A natural pipeline for voice-driven AI features.",
      promptNote:
        "Create a two-step pipeline: first transcribe audio with Whisper via openai.audio.transcriptions.create(), then pass the transcript text to Claude for analysis, summarization, or structured extraction. Useful for meeting notes, voice journals, and audio content processing.",
    },
    {
      id: uuid(),
      techSlugA: "tensorflow-lite",
      techSlugB: "openai-gpt4",
      relationship: "compatible",
      reason:
        "TensorFlow Lite handles on-device ML inference (image classification, object detection) while GPT-4.1 provides cloud-based text and multimodal intelligence. They serve different use cases and complement each other.",
      promptNote:
        "Use TensorFlow Lite for real-time on-device tasks like camera-based object detection or pose estimation. Send the classification results or cropped image regions to GPT-4.1 for deeper analysis, description generation, or contextual understanding that requires cloud compute.",
    },

    // ============================================
    // REDUNDANT — Payments ecosystem
    // ============================================
    {
      id: uuid(),
      techSlugA: "revenucat",
      techSlugB: "lemonsqueezy",
      relationship: "incompatible",
      reason:
        "RevenueCat manages in-app purchases and subscriptions through Apple/Google stores, while LemonSqueezy acts as a web-based merchant of record. They serve different platforms and cannot share subscription state reliably.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "revenucat",
      techSlugB: "stripe",
      relationship: "compatible",
      reason:
        "RevenueCat handles mobile in-app subscriptions (App Store/Google Play) while Stripe handles web payments. RevenueCat can sync subscription data to Stripe for unified reporting, but direct Stripe billing should not overlap with RevenueCat-managed subscriptions.",
      promptNote:
        "Use RevenueCat for all mobile subscription flows and Stripe for web-only payments. Configure RevenueCat's Stripe integration in the dashboard to sync subscription events. Query RevenueCat's API server-side for the unified subscription status across platforms. Do not create Stripe subscriptions directly for users who subscribed through mobile stores.",
    },

    // ============================================
    // RECOMMENDED — Database / Backend
    // ============================================
    {
      id: uuid(),
      techSlugA: "planetscale",
      techSlugB: "prisma",
      relationship: "recommended",
      reason:
        "Prisma has excellent PlanetScale support with the @prisma/adapter-planetscale driver. PlanetScale's branching workflow pairs naturally with Prisma's migration system.",
      promptNote:
        "Use the @prisma/adapter-planetscale driver for serverless-compatible connections. Configure prisma schema with provider 'mysql' and relationMode 'prisma' since PlanetScale does not enforce foreign keys at the database level. Use PlanetScale branches for safe schema changes: create a dev branch, run prisma db push, verify, then create a deploy request to merge to main.",
    },
    // ============================================
    // COMPATIBLE — Analytics / Monitoring
    // ============================================
    {
      id: uuid(),
      techSlugA: "sentry",
      techSlugB: "posthog",
      relationship: "compatible",
      reason:
        "Sentry focuses on error tracking and performance monitoring while PostHog focuses on product analytics and user behavior. They serve different purposes and complement each other well.",
      promptNote:
        "Use Sentry for crash reporting, error tracking, and performance monitoring. Use PostHog for event analytics, user funnels, feature flags, and session replays. Link them by passing the Sentry trace ID as a PostHog event property for cross-referencing errors with user sessions.",
    },

    // ============================================
    // REDUNDANT — Realtime
    // ============================================
    {
      id: uuid(),
      techSlugA: "pusher",
      techSlugB: "supabase-realtime",
      relationship: "redundant",
      reason:
        "Both provide real-time event broadcasting. Supabase Realtime is tightly integrated with Supabase Postgres; Pusher is standalone. Using both creates two real-time systems.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "socketio",
      techSlugB: "pusher",
      relationship: "redundant",
      reason:
        "Both handle real-time bidirectional communication. Socket.io is self-hosted with more control; Pusher is fully managed. Pick one based on infrastructure preferences.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "socketio",
      techSlugB: "supabase-realtime",
      relationship: "redundant",
      reason:
        "Both provide real-time messaging. Supabase Realtime is managed and Postgres-integrated; Socket.io requires a persistent server. Using both adds unnecessary complexity.",
      promptNote: null,
    },

    // ============================================
    // COMPATIBLE — Cross-ecosystem extras
    // ============================================
    {
      id: uuid(),
      techSlugA: "cloudinary",
      techSlugB: "expo-image-picker",
      relationship: "recommended",
      reason:
        "Expo ImagePicker captures photos on the device while Cloudinary provides optimized cloud storage, transformations, and CDN delivery. A natural capture-to-cloud pipeline.",
      promptNote:
        "After capturing an image with ImagePicker.launchCameraAsync() or launchImageLibraryAsync(), use expo-image-manipulator to resize/compress locally, then upload to Cloudinary using their upload API. Store the Cloudinary public_id in your database and use CldImage or URL transformations for optimized delivery.",
    },
    {
      id: uuid(),
      techSlugA: "clerk",
      techSlugB: "planetscale",
      relationship: "compatible",
      reason:
        "Clerk handles authentication while PlanetScale provides the database. Clerk user IDs need to be synced to PlanetScale via webhooks for data association.",
      promptNote:
        "Set up a Clerk webhook (user.created, user.updated) endpoint that upserts a user record in PlanetScale keyed by the Clerk user ID. Use Clerk's getAuth() in API routes to get the user ID for database queries.",
    },
    {
      id: uuid(),
      techSlugA: "openai-whisper",
      techSlugB: "openai-gpt4",
      relationship: "recommended",
      reason:
        "Whisper and GPT-4.1 share the same OpenAI API key and SDK. Whisper transcribes audio, then GPT-4.1 can summarize, analyze, or answer questions about the transcript seamlessly.",
      promptNote:
        "Use the same OpenAI client for both: openai.audio.transcriptions.create() for Whisper, then openai.chat.completions.create() with the transcript as context. This pipeline is ideal for meeting summaries, voice notes with AI analysis, and audio content search.",
    },
    {
      id: uuid(),
      techSlugA: "vercel-ai-sdk",
      techSlugB: "langchain",
      relationship: "compatible",
      reason:
        "Vercel AI SDK provides streaming UI hooks while LangChain provides chain orchestration. They can work together but overlap in model calling — use LangChain for complex pipelines and AI SDK for simple streaming chat.",
      promptNote:
        "For simple chat and streaming, prefer Vercel AI SDK alone (lighter, better DX). For complex RAG, agents, or multi-step chains, use LangChain for orchestration and pipe the final output through Vercel AI SDK's toDataStreamResponse() for the streaming UI. Avoid using both for the same simple use case.",
    },
    {
      id: uuid(),
      techSlugA: "resend",
      techSlugB: "supabase-auth",
      relationship: "compatible",
      reason:
        "Resend provides transactional email delivery while Supabase Auth handles authentication. Use Resend for welcome emails, notifications, and custom email templates triggered by auth events.",
      promptNote:
        "Configure a Supabase database webhook or Edge Function triggered by new user signups (INSERT on auth.users) that sends a welcome email via Resend. For password reset emails, you can either use Supabase Auth's built-in emails or override with custom Resend templates for branded consistency.",
    },
    {
      id: uuid(),
      techSlugA: "livekit",
      techSlugB: "supabase-auth",
      relationship: "compatible",
      reason:
        "LiveKit needs authenticated user identity to issue room tokens. Supabase Auth provides the user session that your token endpoint uses to authorize LiveKit room access.",
      promptNote:
        "Create a server-side endpoint that verifies the Supabase Auth session, then generates a LiveKit access token with the user's ID as the participant identity. This ensures only authenticated users can join rooms and their identity is consistent across your app.",
    },

    // ============================================
    // Google Gemini synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "vercel-ai-sdk",
      techSlugB: "google-gemini",
      relationship: "recommended",
      reason:
        "Vercel AI SDK has a first-party Google provider (@ai-sdk/google) with streaming, structured output, and tool-calling support for Gemini models.",
      promptNote:
        "Use the @ai-sdk/google provider with streamText() or generateObject(). The SDK handles streaming and structured output for Gemini the same way as other providers, making it easy to swap or compare models.",
    },
    {
      id: uuid(),
      techSlugA: "google-gemini",
      techSlugB: "langchain",
      relationship: "compatible",
      reason:
        "LangChain has a @langchain/google-genai package for Gemini integration, enabling use of Gemini models in chains, agents, and RAG pipelines.",
      promptNote:
        "Use @langchain/google-genai's ChatGoogleGenerativeAI class as the model in your LangChain chains. Supports tool calling and structured output through LangChain's unified interface.",
    },
    // ============================================
    // SEARCH — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "algolia",
      techSlugB: "meilisearch",
      relationship: "redundant",
      reason:
        "Both provide full-text search functionality with typo tolerance, faceting, and instant results. Using both creates two search indices to maintain.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "algolia",
      techSlugB: "supabase-postgresql",
      relationship: "compatible",
      reason:
        "Index Postgres data in Algolia for fast, typo-tolerant search. Postgres handles storage and relations while Algolia handles search queries.",
      promptNote:
        "Create a sync pipeline from Postgres to Algolia: use a Supabase database webhook or Edge Function triggered on INSERT/UPDATE/DELETE to keep the Algolia index in sync. Each Algolia record should include the Postgres primary key as objectID for easy lookups.",
    },
    {
      id: uuid(),
      techSlugA: "meilisearch",
      techSlugB: "supabase-postgresql",
      relationship: "compatible",
      reason:
        "Index Postgres data in Meilisearch for fast, typo-tolerant search while Postgres handles storage, relations, and transactions.",
      promptNote:
        "Create a sync script or Supabase Edge Function that indexes Postgres rows into Meilisearch on data changes. Use the Postgres primary key as the Meilisearch document ID for consistency.",
    },
    {
      id: uuid(),
      techSlugA: "algolia",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "Algolia has first-class Next.js integration with InstantSearch SSR support and Vercel Edge-compatible search clients.",
      promptNote:
        "Use react-instantsearch with Next.js server components for SSR search. The Algolia search client works in both server and client contexts. Configure InstantSearch with renderToString for server-side rendering of search results.",
    },

    // ============================================
    // CACHING — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "upstash-redis",
      techSlugB: "supabase-postgresql",
      relationship: "recommended",
      reason:
        "Cache hot Postgres queries in Redis for performance. Upstash's REST API works seamlessly in serverless environments alongside Supabase.",
      promptNote:
        "Wrap frequently-read Postgres queries with a Redis cache layer: check Redis first, fall back to Postgres and cache the result with a TTL. Use cache invalidation on write operations. Ideal for caching user profiles, app settings, and computed aggregations.",
    },
    {
      id: uuid(),
      techSlugA: "upstash-redis",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "Serverless Redis designed for Edge and serverless deployments. Upstash has a native Vercel integration for auto-provisioning.",
      promptNote:
        "Add the Upstash integration from the Vercel Marketplace to auto-inject UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Use @upstash/redis in Edge Middleware for rate limiting and in API routes for caching.",
    },
    {
      id: uuid(),
      techSlugA: "upstash-redis",
      techSlugB: "inngest",
      relationship: "compatible",
      reason:
        "Cache background job results in Redis or use Redis as a fast lookup for job deduplication and rate limiting.",
      promptNote:
        "Use Upstash Redis within Inngest step functions to cache expensive computation results, implement job deduplication with SET NX, or store progress state for long-running multi-step jobs.",
    },
    {
      id: uuid(),
      techSlugA: "upstash-redis",
      techSlugB: "trigger-dev",
      relationship: "compatible",
      reason:
        "Cache background job results in Redis for fast subsequent lookups and use Redis for job deduplication.",
      promptNote:
        "Use Upstash Redis in Trigger.dev task handlers to cache results and prevent duplicate processing. Check Redis before starting expensive work: if a result exists for the input, return it immediately.",
    },

    // ============================================
    // UI COMPONENTS — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "shadcn-ui",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "shadcn/ui components are designed for the Next.js ecosystem and work seamlessly with Vercel's deployment platform.",
      promptNote:
        "shadcn/ui components use React Server Components and Tailwind CSS, both of which are optimized for Next.js on Vercel. The component library adds zero runtime overhead — all components are copied into your project and tree-shaken at build time.",
    },
    {
      id: uuid(),
      techSlugA: "shadcn-ui",
      techSlugB: "supabase-auth",
      relationship: "compatible",
      reason:
        "Build auth UI forms (sign in, sign up, password reset) using shadcn/ui components with Supabase Auth as the backend.",
      promptNote:
        "Create auth forms using shadcn/ui components: <Card>, <Input>, <Button>, <Label>, and <Form> for validation. Wire form submissions to Supabase Auth methods (signInWithPassword, signUp). Use shadcn's toast component for auth error messages.",
    },

    // ============================================
    // EMAIL MARKETING — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "loops",
      techSlugB: "convertkit",
      relationship: "redundant",
      reason:
        "Both provide email marketing automation with event-driven campaigns and audience segmentation. Using both creates duplicate subscriber lists.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "loops",
      techSlugB: "resend",
      relationship: "compatible",
      reason:
        "Loops handles marketing and lifecycle emails while Resend handles transactional emails. They serve different email use cases.",
      promptNote:
        "Use Loops for automated marketing sequences (onboarding, upgrade nudges, win-back campaigns) and Resend for transactional emails (password resets, receipts, notifications). Both can share the same verified sending domain.",
    },
    {
      id: uuid(),
      techSlugA: "convertkit",
      techSlugB: "resend",
      relationship: "compatible",
      reason:
        "ConvertKit handles marketing and newsletter emails while Resend handles transactional emails with React templates.",
      promptNote:
        "Use ConvertKit for newsletters, automation sequences, and subscriber management. Use Resend for transactional emails that need custom React templates (welcome emails, receipts, notifications).",
    },

    // ============================================
    // BACKGROUND JOBS — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "inngest",
      techSlugB: "trigger-dev",
      relationship: "redundant",
      reason:
        "Both provide serverless background job processing with retries, scheduling, and monitoring dashboards. Pick one based on open-source needs.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "inngest",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "Inngest has a first-class Vercel integration with automatic function discovery and zero-config deployment for background jobs.",
      promptNote:
        "Install the Inngest Vercel integration for automatic environment variable provisioning. Inngest functions are served from a single Next.js API route and work within Vercel's serverless function model. The Inngest dev server provides a local UI for testing.",
    },
    {
      id: uuid(),
      techSlugA: "trigger-dev",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "Trigger.dev integrates with Vercel for deploying background job handlers alongside your Next.js app.",
      promptNote:
        "Deploy Trigger.dev tasks alongside your Vercel-hosted Next.js app. Use the Trigger.dev CLI for deployment and the cloud dashboard for monitoring. Tasks run on Trigger.dev's infrastructure, avoiding Vercel's serverless timeout limits.",
    },

    // ============================================
    // CMS — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "sanity",
      techSlugB: "payload-cms",
      relationship: "redundant",
      reason:
        "Both provide headless CMS functionality with structured content and admin interfaces. Pick one based on deployment preference.",
      promptNote: null,
    },
    {
      id: uuid(),
      techSlugA: "sanity",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "Official Sanity + Vercel integration with visual editing preview mode, ISR support, and one-click deployment.",
      promptNote:
        "Add the Sanity Vercel integration for automatic webhook-based revalidation on content changes. Use next-sanity's draftMode() integration for live previewing draft content. Configure Sanity's Visual Editing for real-time content updates in the Next.js preview.",
    },
    {
      id: uuid(),
      techSlugA: "payload-cms",
      techSlugB: "supabase-postgresql",
      relationship: "recommended",
      reason:
        "Payload CMS v3 can use Postgres as its database via the @payloadcms/db-postgres adapter, sharing the same Supabase Postgres instance as your app data.",
      promptNote:
        "Configure Payload's postgresAdapter with the same DATABASE_URL as your Supabase Postgres. Payload creates its own tables (payload_*, media, users) alongside your app tables. Use Supabase RLS for app data and Payload's access control for CMS data.",
    },
    {
      id: uuid(),
      techSlugA: "payload-cms",
      techSlugB: "drizzle-orm",
      relationship: "compatible",
      reason:
        "Payload CMS uses Drizzle internally for its Postgres adapter. Your app's Drizzle schema can coexist with Payload's auto-generated tables.",
      promptNote:
        "Payload v3 uses Drizzle ORM under the hood for its Postgres adapter. Your app can use Drizzle ORM for custom tables alongside Payload's managed tables. Avoid modifying Payload's tables directly — use the Payload API for CMS content and Drizzle for app-specific data.",
    },

    // ============================================
    // VIDEO — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "mux",
      techSlugB: "cloudinary",
      relationship: "compatible",
      reason:
        "Mux handles video streaming and encoding while Cloudinary handles image optimization and thumbnails. They complement each other for media-heavy apps.",
      promptNote:
        "Use Mux for all video operations (upload, encoding, streaming, analytics) and Cloudinary for image operations (user avatars, product photos, image transformations). Store Mux playback IDs and Cloudinary public IDs in your database alongside each content record.",
    },
    {
      id: uuid(),
      techSlugA: "mux",
      techSlugB: "supabase-storage",
      relationship: "compatible",
      reason:
        "Store video thumbnails and supplementary files in Supabase Storage while streaming video through Mux's optimized CDN.",
      promptNote:
        "Use Mux for video streaming (it handles encoding and CDN delivery) and Supabase Storage for related files: thumbnails, subtitles, poster images, and attachments. Store the Mux playback ID and Supabase Storage paths together in your database.",
    },
    {
      id: uuid(),
      techSlugA: "mux",
      techSlugB: "vercel",
      relationship: "recommended",
      reason:
        "Mux has an official Vercel integration with Next.js examples and @mux/mux-player-react optimized for Next.js apps.",
      promptNote:
        "Use @mux/mux-player-react for the video player component in your Next.js app. Create Mux webhook handlers in Next.js API routes. The Mux Vercel integration auto-provisions environment variables for MUX_TOKEN_ID and MUX_TOKEN_SECRET.",
    },

    // ============================================
    // STATE MANAGEMENT — new category synergies
    // ============================================
    {
      id: uuid(),
      techSlugA: "zustand",
      techSlugB: "tanstack-query",
      relationship: "recommended",
      reason:
        "Zustand handles client-only UI state while TanStack Query manages server state with caching. Together they provide a complete state management solution without Redux.",
      promptNote:
        "Use TanStack Query for all server data (API calls, database reads) and Zustand for client-only state (UI preferences, form drafts, modal states). Never duplicate server data into Zustand — let TanStack Query be the single source of truth for remote data. Access TanStack Query cache from Zustand actions via queryClient.getQueryData() if needed.",
    },
    {
      id: uuid(),
      techSlugA: "nativewind",
      techSlugB: "shadcn-ui",
      relationship: "compatible",
      reason:
        "NativeWind brings Tailwind to React Native, making the mental model consistent with shadcn/ui on web. For cross-platform projects, shared Tailwind knowledge reduces context switching.",
      promptNote:
        "Use shadcn/ui components on web and build equivalent RN components using NativeWind with matching Tailwind classes. Share the tailwind.config.js theme (colors, spacing, typography) between web and mobile for visual consistency. Not all shadcn/ui components have RN equivalents — build custom components using NativeWind where needed.",
    },
    {
      id: uuid(),
      techSlugA: "expo-router",
      techSlugB: "react-native-reanimated",
      relationship: "recommended",
      reason:
        "Expo Router supports custom screen transitions powered by Reanimated, enabling smooth shared element transitions and custom navigation animations.",
      promptNote:
        "Use Reanimated's layout animations for screen enter/exit transitions in Expo Router. Configure custom transition animations in Stack.Screen options using animation property. For shared element transitions, use react-native-shared-element or Reanimated's SharedTransition API. Always test animations on physical devices — simulator performance differs significantly.",
    },
    {
      id: uuid(),
      techSlugA: "react-hook-form",
      techSlugB: "zod",
      relationship: "recommended",
      reason:
        "React Hook Form's zodResolver provides seamless Zod schema validation with automatic TypeScript type inference, eliminating manual validation code.",
      promptNote:
        "Install @hookform/resolvers. Use zodResolver(schema) in useForm({ resolver: zodResolver(mySchema) }). The form automatically validates against the Zod schema on submit and shows field-level errors. Define the form schema once as a Zod object and use z.infer<typeof schema> for the form's TypeScript type. For conditional validation, use Zod's .refine() or .superRefine() methods.",
    },
    {
      id: uuid(),
      techSlugA: "zustand",
      techSlugB: "react-hook-form",
      relationship: "compatible",
      reason:
        "Zustand can persist draft form data across navigation while React Hook Form manages the active form. Useful for multi-step wizards or forms that span routes.",
      promptNote:
        "For simple forms, React Hook Form's local state is sufficient — no need for Zustand. For complex multi-step forms that persist across navigation, store draft data in a Zustand store and hydrate React Hook Form's defaultValues from the store on mount. Update the Zustand store on step completion or form blur for auto-save.",
    },
    {
      id: uuid(),
      techSlugA: "tanstack-query",
      techSlugB: "supabase-postgresql",
      relationship: "recommended",
      reason:
        "TanStack Query adds caching, optimistic updates, and automatic refetching on top of Supabase queries, transforming raw database calls into a reactive data layer.",
      promptNote:
        "Wrap Supabase queries in TanStack Query: useQuery({ queryKey: ['todos', userId], queryFn: () => supabase.from('todos').select('*').eq('user_id', userId) }). Use useMutation for inserts/updates with optimistic updates: mutationFn: (newTodo) => supabase.from('todos').insert(newTodo), onMutate: async (newTodo) => { await queryClient.cancelQueries(['todos']); queryClient.setQueryData(['todos'], old => [...old, newTodo]); }. Invalidate queries on mutation success to refetch fresh data.",
    },
  ];

  for (const synergy of synergies) {
    await db.insert(techSynergies).values(synergy).onConflictDoNothing();
  }

  console.log(`[seed] Seeded ${synergies.length} tech synergies`);
}
