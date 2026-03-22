# Build Strategy: GlowLog

## Overview
This project uses a 3-phase sequential build with specialized Claude Code subagents.
Each phase has a dedicated agent optimized for that type of work.

## Phase 1: Foundation
**Agent**: `@foundation-builder`
**Focus**: Set up the Expo SDK 52 project with Expo Router v4 file-based navigation (tab layout with Home, Shelf, Routines, Log, Profile tabs). Configure Supabase Auth with Apple Sign-In and email/password. Create the full PostgreSQL schema with Drizzle ORM: users, products, routines, routine_steps, routine_completions, skin_logs, progress_photos tables with RLS policies on all tables. Build the onboarding flow (skin profile quiz with skin type, experience level, concerns), login screen, and settings screen with profile editing, notification preferences, and account deletion. Configure Expo Notifications permission request during onboarding. Set up Sentry error tracking and PostHog analytics initialization. Bundle the initial ingredient_conflicts.json file. Configure EAS Build profiles for development and production.
**Screens**: Welcome & Skin Profile Onboarding, Login, Profile & Settings (3 screens)
**Prerequisites**: .env configured, required accounts created
**Deliverables**: Project scaffolding, database schema, auth flow, navigation structure

### How to run
```
@foundation-builder Execute EP1. The full Execution Prompt 1 is in the Execution Prompts document.
```

### Verification
- Run `/verify-build` — must compile with no TypeScript errors
- Run `/check-env` — all EP1 env vars must be set
- Manual: confirm auth flow works (sign up, sign in, sign out)
- Git commit before proceeding to Phase 2

## Phase 2: Core Features
**Agent**: Agent team with `@screen-builder` teammates (recommended)
**Focus**: Build the core user experience loop. Home Dashboard shows today's routines with completion status, streak counter, and quick-log shortcut. Product Shelf displays user's products in a grid with search/sort. Add Product screen implements the three entry paths: barcode scan via expo-camera, Algolia product search, and manual entry form — with the Edge Function for barcode lookup orchestration. Product Detail shows full ingredient list with tappable ingredients that call Claude via Edge Function for plain-language explanations (cached in Upstash Redis). Routine Builder with drag-and-drop reordering, product selection from shelf, auto-layering suggestions, ingredient conflict detection via on-device rules + Claude enrichment, and flexible RRULE-based scheduling. Routine Execution as a step-by-step checklist that logs completions. Skin Log Entry with condition sliders and optional progress photo upload to Supabase Storage. Wire up Expo Notifications for routine reminders based on schedule data.
**Screens**: Home Dashboard, Product Shelf, Add Product, Product Detail, Routine Builder, Routine Execution, Skin Log Entry (7 screens)
**Prerequisites**: Phase 1 complete and verified
**Deliverables**: All core feature screens functional with proper states

### Option A: Agent Team (Recommended for 4+ screens)
Use an agent team to build independent screens in parallel:
```
Create a team to build EP2 screens for GlowLog. Use @screen-builder as the teammate agent.
Assign each teammate one screen from EP2. The screens are: Home Dashboard, Product Shelf, Add Product, Product Detail, Routine Builder, Routine Execution, Skin Log Entry.
Build independent screens in parallel, then integrate shared state.
```

### Option B: Sequential Build
For simpler coordination, use the feature builder sequentially:
```
@feature-builder Execute EP2. The full Execution Prompt 2 is in the Execution Prompts document.
```

### Verification
- Run `/verify-build` — must compile with no TypeScript errors
- Manual: test each screen's loading, error, and populated states
- Manual: verify navigation between all screens works
- Git commit before proceeding to Phase 3

## Phase 3: Polish & Production
**Agent**: `@polish-builder`
**Focus**: Build premium and polish features. Skin Story Dashboard (Pro-only) with weekly/monthly charts using react-native-chart-kit and Claude-generated correlation narratives via Inngest scheduled background jobs. Ingredient Conflict Guide as a standalone reference showing all conflicts across the user's shelf. Progress Photos Gallery with chronological view and side-by-side comparison mode. Routine Calendar with monthly completion visualization. GlowLog Pro Paywall with RevenueCat integration — monthly and annual plans, subscription state synced to Supabase Auth metadata via webhook. Notification Center for in-app notification history. Configure GPT-5 Vision label extraction Edge Function as barcode scan fallback. Final polish: loading states, empty states, error boundaries, haptic feedback on completions, app icon and splash screen. Production EAS Build and App Store submission preparation.
**Screens**: Skin Story Dashboard, Ingredient Conflict Guide, Progress Photos Gallery, Routine Calendar, GlowLog Pro Paywall, Notification Center (6 screens)
**Prerequisites**: Phase 2 complete and verified
**Deliverables**: Payments, notifications, analytics, production config

### How to run
```
@polish-builder Execute EP3. The full Execution Prompt 3 is in the Execution Prompts document.
```

### Verification
- Run `/verify-build` — must compile with no TypeScript errors
- Run `/check-env` — all env vars must be set
- Manual: test payment flow end-to-end (use Stripe test mode)
- Manual: verify push notifications on device
- Run `/run-tests` — all tests should pass
- Git commit and tag as v1.0.0

## Agent Teams for Parallel Screen Building

When EP2 has 4+ screens, parallel building with agent teams significantly speeds up development.
Each `@screen-builder` teammate works in an isolated git worktree, preventing merge conflicts.

### How it works
1. The team lead analyzes EP2 screen dependencies
2. Independent screens are assigned to `@screen-builder` teammates
3. Each teammate builds their screen in a worktree branch
4. The lead merges completed screens and handles integration

### Prerequisites
- `settings.json` must have `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` set to `"1"`
- Phase 1 must be complete (shared components and navigation exist)

## Settings
The `settings.json` file in `.claude/` enables agent teams and pre-approves common build operations.
See the generated `settings.json` for the full configuration.