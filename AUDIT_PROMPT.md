# AppFactory Output Quality Audit

You are auditing and improving the AppFactory codebase — an AI-powered blueprint generator that produces execution prompts, CLAUDE.md files, .mcp.json configs, agent definitions, bundled skills, and supporting documents for apps built with Claude Code.

The first real app built from AppFactory's output was **Ascend (Apex)**, an Expo/React Native facial analysis app. All 3 Execution Prompts were run sequentially through Claude Code with manual error handling in between. This audit catalogs every gap, inaccuracy, and missed opportunity discovered during that real-world test so you can fix the generation logic at the source.

Read every file referenced below before making changes. Cross-reference `src/lib/ai/architect-prompts.ts`, `src/lib/db/seed-technologies.ts`, `src/lib/db/seed-screen-patterns.ts`, `src/lib/db/seed-synergies.ts`, `src/lib/agents/architect.ts`, and `src/lib/ai/client.ts`.

---

## CATEGORY 1: OUTDATED TECHNOLOGY VERSIONS

**Problem**: `CURRENT_TECH_VERSIONS` in `architect-prompts.ts` (lines ~321-359) is stale. The Ascend app ended up on Expo SDK 55 / React Native 0.83 / React 19.2, but the constant still says Expo SDK 52 / React Native 0.76+. This caused the generated CLAUDE.md and EPs to reference outdated APIs, deprecated packages, and wrong version constraints.

**What to fix in `architect-prompts.ts` → `CURRENT_TECH_VERSIONS`:**

1. **Expo SDK**: Update from `52` → `55`. React Native from `0.76+` → `0.83+`. React from `18.x` → `19.x`.
2. **Expo Router**: Update from `v4.x` → `v55.x` (Expo Router now matches SDK version numbering).
3. **NativeWind**: Update from `v4.x` → confirm latest stable (4.2.x works, but verify if v5 is out).
4. **React Native Reanimated**: Update from `v3.x` → `v4.x` (Ascend uses 4.2.1).
5. **Zod**: Update from `v3.x` → `v4.x` (Ascend uses 4.3.6).
6. **RevenueCat SDK**: Update from `8+` → `9+` (Ascend uses 9.14.0).
7. **Sentry**: Should reference `@sentry/react-native` v7.x, not `sentry-expo` which is the deprecated wrapper.
8. **Claude models**: Verify `claude-sonnet-4` vs `claude-sonnet-4.6` — the generated edge functions used `anthropic/claude-sonnet-4` via OpenRouter but the CLAUDE.md referenced `claude-sonnet-4.6`. Standardize.
9. **OpenAI models**: Verify `gpt-5.4` is still current. The Ascend edge functions use `openai/gpt-5.4` via OpenRouter.
10. **Next.js**: Update from `15` → `16` (AppFactory itself already runs Next.js 16).

**What to fix in `seed-technologies.ts`:**

- Audit every technology entry's `npmPackages` and `npmPackagesMobile` arrays for deprecated package names.
- Update version-specific references in `promptFragment` and `promptFragmentMobile` fields.
- The `sentry` technology entry should use `@sentry/react-native` not `sentry-expo`.
- The `tensorflow-lite` entry should verify `react-native-fast-tflite` is still the recommended package.

**Systemic fix**: Add a `lastVerifiedDate` field to each technology in the seed data, and add a comment at the top of `CURRENT_TECH_VERSIONS` with the date it was last updated. Consider building a `/check-versions` command or scheduled task that flags stale entries.

---

## CATEGORY 2: PLUGIN MARKETPLACE ISSUES

**Problem**: The generated CLAUDE.md includes a "Plugin Marketplaces" section with `bash` install commands like `/plugin marketplace add expo/skills` and `/plugin install building-native-ui@expo/skills`. Claude Code **cannot execute these commands automatically** — they require manual user action. Some referenced marketplaces and skills may not exist or have been renamed.

**What to fix in `architect-prompts.ts` → `buildPluginSetupSection()` and `PLUGIN_MARKETPLACE_REGISTRY`:**

1. **Add a warning header** to the generated Plugin Marketplaces section: `> ⚠️ Plugin commands must be run manually by the user in Claude Code. They cannot be automated within execution prompts or agent workflows.`

2. **Verify every marketplace exists** — audit each entry in `PLUGIN_MARKETPLACE_REGISTRY`:
   - `expo/skills` — verify this marketplace is live and all 11 listed skills exist
   - `callstackincubator/agent-skills` — verify exists
   - `software-mansion-labs/react-native-skills` — verify exists
   - `mhuxain/react-native-dev` — verify exists
   - `anthropics/claude-plugins-official` — verify exists and has the 4 listed skills
   - `gsd-build/get-shit-done` — verify exists

3. **Move plugin setup to Phase 0 of BUILD_STRATEGY.md** with explicit instructions: "Before running any EP, the USER (not Claude Code) must manually run these plugin commands in their terminal."

4. **Add a `verified` boolean** to each entry in `PLUGIN_MARKETPLACE_REGISTRY`. Mark unverified ones with a comment. During generation, only include verified marketplaces.

5. **In the generated CLAUDE.md**, change the Plugin Marketplaces section from imperative commands to a checklist format:
   ```
   ## Plugin Marketplaces (Manual Setup)
   Run these commands yourself before starting EP1:
   - [ ] /plugin marketplace add expo/skills
   - [ ] /plugin install building-native-ui@expo/skills
   ...
   ```

---

## CATEGORY 3: MISSING GITHUB/VERSION CONTROL SETUP

**Problem**: The generated CLAUDE.md and BUILD_STRATEGY.md contain zero mention of Git or GitHub. A real project needs repo initialization, .gitignore, branch strategy, and ideally GitHub Actions for CI. The user had to set this up entirely on their own.

**What to add to `architect-prompts.ts`:**

1. **In `buildClaudeMdContent()`**, add a "Version Control" section to the generated CLAUDE.md:
   ```
   ## Version Control
   - Initialize: `git init && git add -A && git commit -m "Initial commit from EP1"`
   - Branch strategy: `main` (production), `develop` (integration), `feature/*` (per-screen)
   - Create `.gitignore` covering: node_modules, .env*, .expo, ios/Pods, android/build, *.tflite
   - Recommended: Create GitHub repo and push before starting EP2
   ```

2. **In `buildBuildStrategyContent()`**, add a Phase 0 step: "Initialize git repository and create remote on GitHub."

3. **In EP1 generation** (`buildExecutionPrompt1()`), add an instruction: "Create a comprehensive .gitignore file appropriate for the platform (Expo/Next.js). Initialize a git repository. Make an initial commit after the foundation is built."

4. **In the generated `.claude/commands/`**, consider adding a `setup-repo.md` command.

---

## CATEGORY 4: INSUFFICIENT MANUAL SETUP GUIDANCE

**Problem**: The generated output assumes the user knows how to set up RevenueCat entitlements, Sentry projects, Supabase storage buckets, PostHog projects, and other third-party services. The CLAUDE.md lists "Required Accounts" with URLs but provides no walkthrough. During the Ascend build, this caused significant friction — the user had to figure out each service's dashboard independently.

**What to fix:**

1. **Expand the `ENV_VAR_SOURCES` registry** in `architect-prompts.ts` to include step-by-step setup instructions per service, not just "go to this URL and get a key." Each entry should have:
   - What to create (e.g., "Create a new Supabase project, then go to Settings → API")
   - What to copy (e.g., "Copy the `anon` key, NOT the `service_role` key")
   - What to configure in the dashboard (e.g., "Create a `user-photos` storage bucket, set it to private, add a 10MB size limit, allow image/jpeg and image/png")
   - Common gotchas (e.g., "Supabase connection string must use the pooler URL ending in `:6543`, not the direct connection")

2. **Auth setup walkthrough** — The generated output should include specific instructions for:
   - Supabase Auth: Enable Email provider, enable Apple provider (requires Apple Developer account + Service ID + Key), configure redirect URLs for deep linking
   - Apple Sign-In: Step-by-step for creating the App ID, Service ID, and Key in Apple Developer Console — this is notoriously confusing

3. **RevenueCat setup walkthrough**:
   - Create a RevenueCat project
   - Create an entitlement (e.g., "premium")
   - Create an offering with packages (weekly, monthly, annual, lifetime)
   - Connect App Store Connect / Google Play Console
   - Configure webhook URL (the Supabase edge function URL)
   - Copy the public API key (NOT the secret key) for the mobile SDK

4. **Sentry setup walkthrough**:
   - Create a Sentry project for React Native (not Node.js, not generic JavaScript)
   - Copy the DSN
   - Generate an auth token for source map uploads
   - Configure the org and project names in app.config.ts

5. **PostHog setup walkthrough**:
   - Create a PostHog project
   - Copy the project API key and host URL
   - Note: PostHog Cloud uses `https://us.i.posthog.com` or `https://eu.i.posthog.com`

6. **Add a `SETUP_WALKTHROUGH.md`** as a new generated document. It should be a companion to CLAUDE.md that the user reads BEFORE running any EP. This document should be generated alongside the other artifacts.

7. **In BUILD_STRATEGY.md Phase 0**, add: "Complete all manual setup steps in SETUP_WALKTHROUGH.md before running EP1. Verify with `/check-env`."

---

## CATEGORY 5: AI MODEL CONFIGURATION ISSUES

**Problem 1: Scanner model mismatch.** The Scout agent in the CLAUDE.md referenced the wrong model for the initial scanner. The `CURRENT_TECH_VERSIONS` constant and the generated edge function prompts need to be consistent about which models to use and via which provider.

**Problem 2: OpenRouter vs direct API ambiguity.** The generated CLAUDE.md says `OPENAI_API_KEY` but the actual edge functions use OpenRouter as a proxy (with `OPENROUTER_API_KEY`). The generated .env.example listed `OPENAI_API_KEY` for EP2 but the built app uses `OPENROUTER_API_KEY` exclusively.

**What to fix:**

1. **In `seed-technologies.ts`**, for each AI technology entry:
   - Add a `providerOptions` field that lists supported providers: `["direct", "openrouter"]`
   - Update `promptFragment` and `promptFragmentMobile` to include OpenRouter-specific configuration when selected
   - Include the actual model string for OpenRouter (e.g., `anthropic/claude-sonnet-4.6`, `openai/gpt-5.4`)

2. **In `architect-prompts.ts`**, when generating .env.example:
   - If OpenRouter is the selected AI routing approach, use `OPENROUTER_API_KEY` instead of separate `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`
   - Add a comment explaining: "OpenRouter provides a single API key for all AI models (Claude, GPT, etc.)"

3. **In EP generation**, when writing edge function instructions:
   - Specify the exact model string to use (e.g., `openai/gpt-5.4` not just "GPT-4.1 vision")
   - Specify the base URL (e.g., `https://openrouter.ai/api/v1`)
   - Include a fallback model recommendation

4. **Add OpenRouter as a first-class technology** in `seed-technologies.ts` if it doesn't exist already — with its own slug, promptFragment, and env var requirements.

---

## CATEGORY 6: INCOMPLETE ANALYTICS INTEGRATION

**Problem**: PostHog was selected as an analytics technology and appears in the generated CLAUDE.md and .env.example, but the built app **never initializes PostHog**. The `useAnalytics()` hook only sends Sentry breadcrumbs. PostHog SDK is installed but completely unused.

**What to fix:**

1. **In `seed-technologies.ts` → posthog entry** (or equivalent analytics entry):
   - The `promptFragment` and `promptFragmentMobile` must include initialization code, not just "install the SDK"
   - Should specify: wrap the app in `<PostHogProvider>`, call `posthog.identify()` after auth, track key funnels

2. **In EP3 generation** (`buildExecutionPrompt3()`):
   - Add explicit instructions: "Initialize PostHog in the root layout provider. Identify users after authentication. Track these events at minimum: `app_opened`, `sign_up_completed`, `paywall_viewed`, `purchase_completed`, `scan_initiated`, `scan_completed`, `results_viewed`."
   - Include funnel definition: "Configure a conversion funnel: paywall_viewed → purchase_completed → scan_initiated → results_viewed"

3. **In the bundled `ai-integration` skill** or a new `analytics-integration` skill:
   - Include PostHog initialization patterns for React Native
   - Include event taxonomy recommendations
   - Include funnel setup guidance

---

## CATEGORY 7: MISSING TEST INFRASTRUCTURE

**Problem**: The generated CLAUDE.md includes a `/run-tests` command, but no test framework is configured and no tests are generated. The Ascend app has zero test files despite 48 components, 15 hooks, and 8 edge functions.

**What to fix:**

1. **In EP1 generation** (`buildExecutionPrompt1()`):
   - Add: "Configure Jest (or Vitest) with React Native Testing Library. Create `jest.config.js` and a `__tests__/` directory. Write at least one smoke test for the root layout."

2. **In EP2 generation** (`buildExecutionPrompt2()`):
   - Add per-screen instruction: "Write a basic render test for each screen that verifies it mounts without crashing and displays expected elements."

3. **In EP3 generation** (`buildExecutionPrompt3()`):
   - Add: "Write integration tests for the core user flow: auth → onboarding → camera → results. Add edge function tests using Deno test runner."

4. **In `seed-technologies.ts`**, add testing technologies:
   - `jest` / `vitest` for unit testing
   - `@testing-library/react-native` for component testing
   - `detox` or `maestro` for E2E testing

5. **In the generated `/run-tests` command**, include actual test runner commands instead of a stub.

---

## CATEGORY 8: LOGGING AND OBSERVABILITY

**Problem**: The generated EPs don't instruct Claude Code to add structured logging. The Ascend edge functions use `console.error` but don't capture exceptions to Sentry. Client-side errors are caught by ErrorBoundary but not reported. There's no request tracing, no performance monitoring, no structured log format.

**What to fix:**

1. **In `seed-technologies.ts` → sentry entry**:
   - Update `promptFragment` to include: "Wrap all edge function handlers with `Sentry.captureException()` in catch blocks. Use `Sentry.addBreadcrumb()` for state transitions. Set transaction names for performance monitoring."
   - Add: "In client code, replace `console.error` with `Sentry.captureException()` for all user-facing error paths."

2. **In EP generation**, add a cross-cutting instruction:
   - "Every edge function must log: function name, user ID, input parameters (sanitized), execution time, and outcome (success/failure). Use structured JSON logging."
   - "Every client-side catch block that affects the user must call `Sentry.captureException(error)` in addition to showing a user-facing error message."

3. **In the bundled `deployment-checklist` skill**:
   - Add a "Logging & Monitoring" section with requirements for structured logging, error tracking, and performance monitoring.

---

## CATEGORY 9: PAYMENT & MONETIZATION OPTIMIZATION

**Problem**: The RevenueCat integration works but is minimal. The generated EPs don't instruct on: optimizing the paywall (A/B testing, trial periods), webhook validation (the Ascend webhook is a stub), subscription lifecycle management (grace periods, billing retry), or analytics on conversion.

**What to fix:**

1. **In `seed-technologies.ts` → revenucat entry**:
   - Expand `promptFragment` to include:
     - Webhook signature validation (RevenueCat sends an `X-RevenueCat-Webhook-Signature` header)
     - Subscription lifecycle events to handle: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `BILLING_ISSUE`, `PRODUCT_CHANGE`, `EXPIRATION`
     - Grace period handling
     - Trial period configuration

2. **In EP3 generation** for payment-related screens:
   - Add: "Implement the RevenueCat webhook edge function with signature validation. Handle at minimum: INITIAL_PURCHASE (activate premium), CANCELLATION (mark pending expiry), EXPIRATION (downgrade to free), BILLING_ISSUE (show in-app warning)."
   - Add: "Configure trial periods in RevenueCat dashboard. Add trial UI to paywall screen."
   - Add: "Track paywall conversion metrics: paywall_viewed, package_selected, purchase_initiated, purchase_completed, purchase_failed, restore_completed."

3. **In the bundled `payment-integration` skill**:
   - Add webhook implementation patterns
   - Add subscription state machine documentation
   - Add paywall optimization guidance (pricing psychology, trial lengths, feature gating tiers)

---

## CATEGORY 10: INNGEST / BACKGROUND JOBS GAP

**Problem**: Inngest is listed in the CLAUDE.md environment variables and dependency manifest, but the Ascend app doesn't use Inngest at all. The scan pipeline uses direct sequential edge function calls instead. The generated EPs never explain how to set up or use Inngest for background job orchestration.

**What to fix:**

1. **Decision point in Step 5 (Tech Selection)**: The Architect should explicitly decide: "Is a background job system (Inngest/Trigger.dev) actually needed for this app, or can direct edge function orchestration suffice?" If the pipeline is simple (< 5 steps, < 30s total), skip Inngest. If complex (parallel steps, retries, long-running), include it.

2. **If Inngest IS selected**, the EP must include:
   - Inngest client setup
   - Function definitions for each background job
   - Event sending from edge functions
   - Dashboard configuration instructions

3. **If Inngest is NOT needed**, remove it from the generated .env.example and dependency manifest. Don't include technologies that won't be used — it creates confusion.

4. **In `architect-prompts.ts`**, add logic to `buildEnvExampleContent()` and the dependency manifest builder to only include env vars and packages for technologies that are actually referenced in the EPs.

---

## CATEGORY 11: GENERATED DEPENDENCY MANIFEST ACCURACY

**Problem**: The CLAUDE.md includes a single `npx expo install` command with ALL dependencies. Some packages in this list may not be needed (e.g., `@sentry/nextjs` for an Expo app — should be `@sentry/react-native`). Some packages are duplicated across web/mobile variants. The manifest should only include packages that are actually used.

**What to fix:**

1. **In `buildClaudeMdContent()`**, the dependency manifest should be assembled from the selected technologies' `npmPackagesMobile` (for Expo) or `npmPackages` (for Next.js) — not both.

2. **Add validation**: After assembling the manifest, check for known conflicts:
   - `@sentry/nextjs` should never appear in a mobile project (use `@sentry/react-native`)
   - `sentry-expo` is deprecated — use `@sentry/react-native` directly
   - `@tensorflow/tfjs` and `@tensorflow/tfjs-react-native` should only appear if TFLite is actually selected
   - `postgres` package should only appear if using direct PostgreSQL (not via Supabase client)

3. **In the dependency manifest**, group by category with comments:
   ```
   # Auth & Database
   @supabase/supabase-js expo-secure-store
   # AI & ML
   openai @anthropic-ai/sdk
   # UI & Styling
   nativewind tailwindcss react-native-reanimated react-native-gesture-handler
   ...
   ```

---

## CATEGORY 12: EP CROSS-REFERENCE COMPLETENESS

**Problem**: EPs are decoupled via `buildEPCrossReference()` (~200-token summary), but this summary doesn't include enough context. EP2 and EP3 don't know what EP1 actually built — they just get a short paragraph. This leads to inconsistencies, duplicate work, and missed integrations.

**What to fix:**

1. **Expand `buildEPCrossReference()`** to include:
   - List of all screens built in the previous EP(s) with their route paths
   - List of all stores created (Zustand stores with their key state fields)
   - List of all hooks created
   - Database tables already created
   - Auth flow summary (what auth methods are configured, how sessions work)
   - Subscription gating pattern (how premium is checked)

2. **Add an EP completion checklist** to each EP:
   - "At the end of this EP, verify: [list of screens that should exist], [list of stores], [list of hooks], [database tables with row counts from seed data if applicable]"

3. **In EP2 and EP3 headers**, add: "Do NOT recreate any component, hook, store, or utility that was built in a previous EP. Import from existing paths."

---

## CATEGORY 13: EDGE FUNCTION GENERATION QUALITY

**Problem**: The generated EPs describe edge functions at a high level but don't specify: CORS configuration, error response format, input validation patterns, shared utilities, or the Deno import pattern for Supabase. Claude Code had to figure these out independently, leading to inconsistent patterns across functions.

**What to fix:**

1. **In `seed-technologies.ts` → supabase-edge-functions entry**:
   - The `promptFragment` should include a reference implementation for a Deno edge function with:
     - CORS headers helper (`_shared/cors.ts`)
     - Supabase admin client helper (`_shared/supabase-client.ts`)
     - Standard error response format: `{ error: string, code: string }`
     - Input validation pattern using Zod
     - Standard response pattern: `new Response(JSON.stringify(data), { headers: corsHeaders })`

2. **In EP generation**, when specifying edge functions:
   - List every edge function that should exist with its HTTP method, input shape, output shape, and error cases
   - Specify shared utilities to create in `_shared/`
   - Specify which functions call which other functions (pipeline orchestration)

---

## CATEGORY 14: ON-DEVICE ML (TFLite) REALITY CHECK

**Problem**: The generated output references TensorFlow Lite / `react-native-fast-tflite` for on-device ML, but the Ascend app does ALL ML inference via cloud APIs (OpenAI Vision). No .tflite models are bundled. The spec creates false expectations.

**What to fix:**

1. **In Step 4 (Dev Tinkering)** or **Step 5 (Tech Selection)**: Add a decision gate: "Does this app actually need on-device ML inference, or is cloud API inference sufficient? On-device ML is only justified when: (a) offline support is critical, (b) latency < 100ms is required, (c) privacy prevents sending images to cloud, or (d) cost per inference must be near-zero."

2. **If TFLite is NOT needed**, don't select it. Remove it from the dependency manifest and environment variables.

3. **If TFLite IS needed**, the EP must include:
   - Which pre-trained model to use (or how to train one)
   - How to bundle the .tflite file in assets
   - How to configure metro.config.js to handle .tflite files
   - A reference implementation for inference

---

## CATEGORY 15: GENERATED .claude/commands/ QUALITY

**Problem**: Some generated commands are stubs or reference things that don't exist. The `/run-tests` command has no tests to run. The `/deploy-edge-functions` command may not match the actual Supabase CLI invocation.

**What to fix:**

1. **Audit every command template** in `architect-prompts.ts`:
   - `/check-env`: Should validate ALL env vars from .env.example, not just a hardcoded subset
   - `/verify-build`: Should run `npx tsc --noEmit` for TypeScript check AND `npx expo export --platform ios` for build verification
   - `/run-tests`: Should only be generated if a test framework is configured
   - `/deploy-edge-functions`: Should include the actual `supabase functions deploy` commands with function names
   - `/setup-database`: Should include `npx drizzle-kit push` AND RLS policy application
   - `/check-consistency`: Should validate that all screens in the spec have corresponding route files

2. **Make commands dynamic**: The command templates should reference the actual technologies and screens selected, not generic placeholders.

---

## CATEGORY 16: GENERATED AGENT DEFINITION IMPROVEMENTS

**Problem**: The agent definitions use model references (`sonnet`, `opus`) but don't specify which plugin skills they need loaded. The `screen-builder` agent uses `isolation: worktree` but doesn't explain git worktree prerequisites. The agents don't have explicit success criteria.

**What to fix:**

1. **In `BUILD_AGENT_REGISTRY`**, for each agent:
   - Add explicit success criteria: "This agent is done when: [list of verifiable outcomes]"
   - Add required context: "Before running, ensure: [list of prerequisites]"
   - Add the list of bundled skills that should be loaded (from `.claude/skills/`)

2. **For `screen-builder`** with worktree isolation:
   - Add a note: "Requires git to be initialized. Run `git init` and make an initial commit before using agent teams."
   - Explain how to merge the worktree back: "After screen-builder completes, review the worktree branch and merge into develop."

---

## CATEGORY 17: FINANCIAL CONSISTENCY IN VISUAL STRATEGY

**Problem**: While `checkVSConsistency()` enforces caps (MRR ≤ $8K, users ≤ 5K), the generated Visual Strategy documents sometimes produce revenue projections that don't match the pricing tiers defined in Strategic Planning. The pricing anchor system works but the arithmetic verification needs strengthening.

**What to fix:**

1. **In `checkVSConsistency()`**, add:
   - Cross-check: `projectedRevenue[month12] ≈ projectedUsers[month12] × conversionRate × monthlyPrice`
   - If the difference is > 20%, flag a warning and clamp
   - Verify that free tier limits mentioned in VS match those in the payment-integration skill

2. **In VS Part B generation**, add an explicit instruction:
   - "Revenue projection MUST equal: (total users × conversion rate × weighted average price). Show the arithmetic. If it doesn't match, adjust the user count, not the price."

---

## CATEGORY 18: COMPREHENSIVE CHANGES CHECKLIST

After making all the above changes, verify:

- [ ] `CURRENT_TECH_VERSIONS` has accurate versions for all entries, with a `lastUpdated` date comment
- [ ] Every technology in `seed-technologies.ts` has been audited for version accuracy
- [ ] Plugin marketplace references have been verified or marked unverified
- [ ] Generated CLAUDE.md includes Git/GitHub setup section
- [ ] Generated CLAUDE.md plugin section clearly states manual-only with checklist format
- [ ] `ENV_VAR_SOURCES` includes step-by-step setup instructions per service
- [ ] A new `SETUP_WALKTHROUGH.md` document is generated alongside other artifacts
- [ ] AI model strings are consistent between CLAUDE.md, .env.example, and EP edge function instructions
- [ ] OpenRouter is handled as a first-class AI routing option
- [ ] PostHog initialization is explicitly instructed in EP3 (or whichever EP covers analytics)
- [ ] Test framework setup is included in EP1
- [ ] Structured logging instructions are included in EP generation
- [ ] RevenueCat webhook implementation is fully specified (not a stub)
- [ ] Inngest is only included when actually needed (decision gate added)
- [ ] Dependency manifest only includes packages for the target platform
- [ ] EP cross-reference includes screens, stores, hooks, and tables from prior EPs
- [ ] Edge function generation includes CORS, error format, and shared utilities
- [ ] TFLite is only included when on-device ML is justified
- [ ] All generated commands reference actual project artifacts
- [ ] Agent definitions include success criteria and prerequisites
- [ ] Visual Strategy revenue arithmetic is cross-validated

---

## PRIORITY ORDER

Fix these in order of impact:

1. **CURRENT_TECH_VERSIONS** (Category 1) — affects every generated app
2. **Manual setup walkthrough** (Category 4) — biggest user friction point
3. **AI model configuration** (Category 5) — causes runtime failures
4. **Dependency manifest accuracy** (Category 11) — causes build failures
5. **EP cross-reference** (Category 12) — causes inconsistencies across phases
6. **Plugin marketplace** (Category 2) — causes confusion during setup
7. **Git/GitHub** (Category 3) — missing from every generated project
8. **Analytics integration** (Category 6) — installed but never initialized
9. **Payment optimization** (Category 9) — webhook stub is a production risk
10. **Edge function quality** (Category 13) — inconsistent patterns
11. **Logging** (Category 8) — invisible failures in production
12. **Test infrastructure** (Category 7) — no tests despite command existing
13. **Inngest decision gate** (Category 10) — unused dependencies
14. **TFLite reality check** (Category 14) — false expectations
15. **Command quality** (Category 15) — stubs and placeholders
16. **Agent definitions** (Category 16) — missing context and criteria
17. **Financial consistency** (Category 17) — minor arithmetic gaps
