# GlowLog
Your skin's smartest diary — track, analyze, and glow with confidence.

## Tech Stack
- **Platform**: Expo SDK 52 (React Native)
- **auth**: Supabase Auth
- **database**: Supabase PostgreSQL, Drizzle ORM
- **deployment**: Supabase Edge Functions, EAS Build
- **ai-text**: Claude API
- **ai-vision**: GPT-5 Vision
- **caching**: Upstash Redis
- **background-jobs**: Inngest
- **notifications**: Expo Notifications
- **payments**: RevenueCat
- **file-storage**: Supabase Storage, Expo ImagePicker
- **search**: Algolia
- **analytics**: Sentry, PostHog, Expo Updates

## Architecture
- Use Expo Router for file-based navigation
- Use expo-secure-store for sensitive data, AsyncStorage for preferences
- Test on both iOS and Android simulators before committing
- Use expo-constants for environment variables
- Prefer React Native core components over web-based alternatives
- Use Supabase Auth helpers for session management; never store tokens manually
- Use Drizzle ORM for type-safe database queries; run migrations with drizzle-kit push
- Use Deno-based Edge Functions for server-side logic; deploy with supabase functions deploy
- Use the Anthropic SDK with streaming for long responses; implement max_tokens limits
- Use @upstash/redis REST client; set TTL on all cache entries
- Use EAS Build for cloud builds; configure separate profiles for development, preview, and production
- Request notification permissions at appropriate UX moment, not on app launch
- Use RevenueCat for subscription management; check entitlements before gating features
- Use Supabase Storage SDK for file uploads; create separate buckets for public vs private assets
- Use expo-image-picker for camera/gallery access; handle permissions gracefully with fallback messaging
- Index data server-side; use InstantSearch components for search UI
- Initialize Sentry early in app lifecycle; configure source maps for production builds
- Use PostHog SDK for analytics; identify users after auth for cohort analysis
- Configure expo-updates for OTA updates; use separate channels for staging and production

## Common Commands
- `npx expo start` — Start Expo dev server
- `npx expo run:ios` — Run on iOS simulator
- `npx expo run:android` — Run on Android emulator
- `npx drizzle-kit push` — Push schema changes to database
- `npx drizzle-kit generate` — Generate migration files

## Required Accounts
Create these accounts/projects BEFORE starting. You will need API keys from each.

- **Supabase Auth** — https://supabase.com/dashboard
  Copy to .env: `EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Supabase Postgresql** — https://supabase.com/dashboard
  Copy to .env: `DATABASE_URL`
- **Claude Api** — https://console.anthropic.com
  Copy to .env: `ANTHROPIC_API_KEY`
- **Gpt5 Vision** — https://platform.openai.com
  Copy to .env: `OPENAI_API_KEY`
- **Upstash Redis** — https://console.upstash.com
  Copy to .env: `UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN`
- **Eas Build** — https://expo.dev
  Copy to .env: `EXPO_ACCESS_TOKEN`
- **Expo Notifications** — https://expo.dev
  Copy to .env: `EXPO_ACCESS_TOKEN`
- **Revenucat** — https://app.revenuecat.com
  Copy to .env: `REVENUECAT_API_KEY, REVENUECAT_SECRET_KEY`
- **Algolia** — https://algolia.com
  Copy to .env: `NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY, ALGOLIA_ADMIN_KEY`
- **Sentry** — https://sentry.io
  Copy to .env: `NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN`
- **Posthog** — https://app.posthog.com
  Copy to .env: `NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST`

## Environment Variables
See `.env.example` for all required variables with documentation links.
Fill these in after EP1 builds the project foundation.

## Available Commands
Custom Claude Code commands are in `.claude/commands/`. Use them during the build:

- `/check-env` — Verify all environment variables are set (run before each EP)
- `/verify-build` — Check compilation and TypeScript errors
- `/deploy-edge-functions` — Deploy Supabase Edge Functions
- `/run-tests` — Run test suite (unit + E2E)

## Skills
Install these Claude Code skills for domain-specific guidance:

### expo/skills
`/install-skill expo/skills`
Skills: building-native-ui, native-data-fetching, expo-dev-client, expo-tailwind-setup, expo-deployment, expo-cicd-workflows, expo-api-routes, expo-ui-swift-ui, expo-ui-jetpack-compose, use-dom, upgrading-expo

### callstackincubator/agent-skills
`/install-skill callstackincubator/agent-skills`
Skills: react-native-best-practices

### software-mansion-labs/react-native-skills
`/install-skill software-mansion-labs/react-native-skills`
Skills: react-native-best-practices

### mhuxain/react-native-dev
`/install-skill mhuxain/react-native-dev`
Skills: react-native-dev

### anthropics/skills
`/install-skill anthropics/skills`

## Build Strategy
This project uses specialized Claude Code subagents for each build phase.
Agent definitions are in `.claude/agents/`. See `BUILD_STRATEGY.md` for full details.

- **EP1 (Foundation)**: `@foundation-builder` — Set up the Expo SDK 52 project with Expo Router v4 file-based navigation (tab layout with Home, Shelf, Routines, Log, Profile tabs). Configure Supabase Auth with Apple Sign-In and email/password. Create the full PostgreSQL schema with Drizzle ORM: users, products, routines, routine_steps, routine_completions, skin_logs, progress_photos tables with RLS policies on all tables. Build the onboarding flow (skin profile quiz with skin type, experience level, concerns), login screen, and settings screen with profile editing, notification preferences, and account deletion. Configure Expo Notifications permission request during onboarding. Set up Sentry error tracking and PostHog analytics initialization. Bundle the initial ingredient_conflicts.json file. Configure EAS Build profiles for development and production.
- **EP2 (Core Features)**: Agent team with `@screen-builder` teammates for parallel building (7 screens), or `@feature-builder` for sequential
- **EP3 (Polish)**: `@polish-builder` — Build premium and polish features. Skin Story Dashboard (Pro-only) with weekly/monthly charts using react-native-chart-kit and Claude-generated correlation narratives via Inngest scheduled background jobs. Ingredient Conflict Guide as a standalone reference showing all conflicts across the user's shelf. Progress Photos Gallery with chronological view and side-by-side comparison mode. Routine Calendar with monthly completion visualization. GlowLog Pro Paywall with RevenueCat integration — monthly and annual plans, subscription state synced to Supabase Auth metadata via webhook. Notification Center for in-app notification history. Configure GPT-5 Vision label extraction Edge Function as barcode scan fallback. Final polish: loading states, empty states, error boundaries, haptic feedback on completions, app icon and splash screen. Production EAS Build and App Store submission preparation.

`settings.json` enables agent teams. See `BUILD_STRATEGY.md` for invocation prompts.

## App Screens
### Prompt 1 (Foundation): Welcome & Skin Profile Onboarding, Login, Profile & Settings
### Prompt 2 (Core): Home Dashboard, Product Shelf, Add Product, Product Detail, Routine Builder, Routine Execution, Skin Log Entry
### Prompt 3 (Polish): Skin Story Dashboard, Ingredient Conflict Guide, Progress Photos Gallery, Routine Calendar, GlowLog Pro Paywall, Notification Center

## MCP Servers
See .mcp.json for configured MCP servers. Environment variables marked with `${...}` must be set before use.
