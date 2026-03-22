# EP3 + CLAUDE.md + .mcp.json Audit Report

## Executive Summary

EP3 is the most thorough and production-ready of the three execution prompts, delivering strong coverage across 4 screens, RevenueCat subscription infrastructure, gamification, performance optimization, and App Store preparation within ~52K tokens. However, it contains one critical social proof hallucination that the prompt builder's PAYWALL GUIDELINES explicitly forbid, several pricing anchor inconsistencies with the Step 5 source data, and the CLAUDE.md/MCP generation system has notable gaps in SETUP_STEPS_REGISTRY and TECH_CONVENTIONS coverage that will produce incomplete config files for 5 of the 13 selected tech slugs.

---

## EP3 Hallucination Findings

### H1 — Fabricated Social Proof in Paywall Copy (P1 CRITICAL)
**Source**: EP3 Section 2.3 (Premium Upgrade Screen), line ~89
**Finding**: The paywall screen description says: *"a short paragraph of social proof: 'Join 10,000+ skincare lovers who trust GlowStack.'"*
**Evidence**: The EP3 prompt builder at `architect-prompts.ts:757-761` contains explicit PAYWALL GUIDELINES that state: *"Do NOT include fabricated social proof ('Join 10,000+ users'). Use dynamic placeholders populated from real analytics at runtime."* The AI-generated output directly violates the instructions it was given.
**Impact**: If Claude Code implements this copy literally, Apple may reject the app under App Store Review Guideline 2.3.7 (accurate promotional descriptions) or the FTC's truth-in-advertising rules. At launch, GlowStack has zero users.
**Fix**: Strengthen the PAYWALL GUIDELINES prompt weight by adding a NEGATIVE EXAMPLE line: "FORBIDDEN EXAMPLE: 'Join 10,000+ skincare lovers' — this is fabricated. Use instead: 'Join the GlowStack community' or omit social proof entirely." Consider post-processing EP3 output to detect and strip numeric social proof claims.

### H2 — "12 Achievement Types" Claim (P3 LOW)
**Source**: EP3 Summary of Deliverables (line ~319)
**Finding**: States "a gamification system with 12 achievement types." Section 4.1 lists the achievement types: first_scan, collection_10, collection_50, streak_7, streak_14, streak_30, streak_60, streak_90, streak_180, streak_365, first_analysis, routine_master, ingredient_detective. That is **13** types, not 12.
**Evidence**: Counting the enumerated achievement_type values in the achievements table design yields 13 items.
**Impact**: Minor inconsistency. Claude Code will likely implement all 13 regardless. The summary text is not user-facing.
**Fix**: No code fix needed. This is an AI counting error in the summary. Could add a validation step to count achievement types and inject the correct number.

### H3 — Pricing Consistency: Free Tier Conflict Check Limit (P2 MEDIUM)
**Source**: EP3 Section 1.2 vs Step 5 customizations
**Finding**: EP3 Section 1.2 states free tier allows "5 per day" ingredient conflict checks. Step 5's RevenueCat customizations (line ~92) say "10 conflict checks/day" for free tier. The Supabase Edge Functions customizations also state "Rate limiting per user tier (free: 10 conflict checks/day, premium: unlimited)."
**Evidence**: Step 5 `step-5.json` line 36: "Rate limiting per user tier (free: 10 conflict checks/day, premium: unlimited)". EP3 Section 1.2: "limited to 5 per day."
**Impact**: Claude Code will see conflicting instructions between what Step 5 established and what EP3 specifies. The developer will need to choose one. This is a source of ambiguity.
**Fix**: Pass the free tier limits from Step 2/Step 5 as a LOCKED parameter into the EP3 prompt, similar to how pricingAnchor works for prices.

### H4 — Pricing Values ($7.99/$49.99) Are Consistent (P3 — PASS)
**Source**: EP3 Sections 1.1, 2.3
**Finding**: The prices "$7.99/month and $49.99/year" are used consistently throughout EP3 and match Step 5's RevenueCat customizations (line ~91: "Monthly ($7.99) and Annual ($49.99)").
**Evidence**: Consistent across EP3 sections 1.1, 1.2, 2.3, and Step 5.
**Impact**: None — this is correct.

### H5 — Apple Developer Guidelines References Are Implicit, Not Cited (P3 LOW)
**Source**: EP3 Sections 2.3, 9.3
**Finding**: EP3 references App Store guidelines conceptually ("following Apple's App Store guidelines for subscription marketing") but never cites specific guideline numbers (e.g., 3.1.1 In-App Purchase, 3.1.2 Subscriptions). The app review notes section mentions generic items.
**Evidence**: No specific App Store Review Guideline section numbers appear in EP3.
**Impact**: Low — Claude Code doesn't need guideline numbers to implement correctly, but citing them would help the developer during the review preparation phase.
**Fix**: Add a small set of key guideline references to the EP3 prompt template's paywall section: "Comply with App Store Review Guidelines 3.1.1 (In-App Purchase), 3.1.2(a) (auto-renewable subscriptions), 5.6.1 (App data used to serve advertising), and 2.3.7 (accuracy)."

### H6 — RevenueCat API Patterns Are Correct (P3 — PASS)
**Source**: EP3 Section 1.1, 2.3
**Finding**: The RevenueCat integration uses correct API patterns: `Purchases.configure`, `Purchases.logIn`, `Purchases.getOfferings`, `Purchases.purchasePackage`, `Purchases.restorePurchases`, `Purchases.getCustomerInfo`, and `customerInfo.entitlements.active["premium"]`. These match the RevenueCat React Native SDK documentation.
**Evidence**: Cross-referenced with RevenueCat's `react-native-purchases` SDK documentation patterns.
**Impact**: None — correct.

---

## EP3 Prompt Weighting Findings

### W1 — Screen Balance Within 52K Tokens (P3 LOW)
**Source**: Full EP3 output
**Finding**: The 4 screens are unevenly weighted:
- Skin Progress Timeline: ~1100 words (Section 2.1)
- Collection Analytics Dashboard: ~1000 words (Section 2.2)
- Premium Upgrade (Paywall): ~1200 words (Section 2.3)
- Notification Center: ~1100 words (Section 2.4)

The screens themselves are reasonably balanced. However, the non-screen sections (RevenueCat infrastructure, expiry tracking, gamification, performance, OTA, Sentry, TestFlight, App Store, security, CI/CD) consume approximately 60% of the total prompt.
**Impact**: This is appropriate because EP3's focus is production readiness, not screen building. The 4 screens are simpler (analytics dashboards, feeds, paywall) compared to EP2's complex interaction screens.
**Fix**: No change needed. The weighting is intentional.

### W2 — PAYWALL GUIDELINES Effectiveness (P1 CRITICAL)
**Source**: `architect-prompts.ts:756-761` vs EP3 output
**Finding**: Despite the PAYWALL GUIDELINES section explicitly prohibiting fabricated social proof, the AI generated "Join 10,000+ skincare lovers" anyway (see H1). The guidelines are placed after the EP cross-reference and synergy section, and before the SCREENS section. They may be getting lost in the prompt context.
**Impact**: The guidelines failed to prevent the exact thing they were designed to prevent.
**Fix**: Three approaches:
1. Move PAYWALL GUIDELINES to immediately before the paywall screen's section (higher proximity = higher attention weight)
2. Add a NEGATIVE EXAMPLE as described in H1
3. Add a post-generation validator that regex-checks for patterns like "Join \d+[\d,]*\+? " in EP3 output

### W3 — RevenueCat Detail Level (P2 MEDIUM)
**Source**: EP3 Part 1
**Finding**: The RevenueCat integration section is highly detailed — SDK initialization, identity linking, webhook Edge Function, user_subscriptions table schema, entitlement checking strategy, and edge cases. This is one of the strongest sections in all 3 EPs.
**Impact**: Positive — enough for implementation. However, it duplicates some of the RevenueCat `promptFragment` from seed-technologies.ts (line 277: "Initialize RevenueCat in App.tsx with Purchases.configure..."). The EP3 prompt builder injects the promptFragment via `formatScreenInstructions`, so Claude Code sees both the detailed EP3 section AND the promptFragment.
**Fix**: Acceptable redundancy — the EP3 section provides GlowStack-specific context (identity linking with Supabase Auth, webhook design) that the generic promptFragment cannot.

### W4 — Settings Screen Depth Is Minimal (P3 LOW)
**Source**: EP3 general
**Finding**: Settings is assigned to EP1 (promptOrder 1), not EP3. EP3 does not add detail about Settings modifications needed for expiry tracking preferences, achievement display, or notification center settings. These are mentioned in passing but not detailed.
**Impact**: Low — Claude Code should infer the settings additions from the feature descriptions.
**Fix**: No change needed; Settings was covered in EP1.

---

## EP3 Efficiency Findings

### E1 — Production Checklist vs CLAUDE.md Overlap (P2 MEDIUM)
**Source**: EP3 Part 11 (CI/CD) + EP3 Part 10 (Security) vs CLAUDE.md Setup Checklist
**Finding**: EP3's Production Readiness Checklist (Part 7.1: Sentry config, Part 11: CI/CD, Part 11.3: environment variables) overlaps with CLAUDE.md's Setup Checklist and Common Commands sections. Specifically:
- EP3 lists all environment variables in Part 11.3 — CLAUDE.md's Setup Checklist also lists env vars from SETUP_STEPS_REGISTRY
- EP3 describes EAS Build profiles — CLAUDE.md doesn't cover this
- EP3's security audit (Part 10) describes which keys are safe to include client-side — CLAUDE.md doesn't cover this

Estimated overlap: ~15% of EP3's production sections duplicate what CLAUDE.md provides.
**Impact**: Minor token waste but acceptable because EP3 needs to be self-contained (developers may not read CLAUDE.md while following EP3).
**Fix**: Add a note in EP3's production sections: "Refer to CLAUDE.md for the authoritative environment variable list and setup sequence."

### E2 — App Store Metadata Section Is Verbose (P3 LOW)
**Source**: EP3 Part 9 (App Store Submission)
**Finding**: Part 9 includes ~800 words on App Store metadata, screenshots, review notes, and privacy labels. This is useful context but is not something Claude Code can automate — it requires manual actions in App Store Connect.
**Impact**: This section cannot be executed programmatically. It serves as a developer checklist.
**Fix**: No change needed. It is valuable as documentation even if not automatable.

### E3 — Security Section Is Mostly App-Specific (P2 — PASS)
**Source**: EP3 Part 10
**Finding**: The security section is well-tailored to GlowStack. It correctly identifies which keys are safe client-side (Supabase anon key, RevenueCat key, Sentry DSN, PostHog key) vs. must be server-only (Supabase service role key, Anthropic API key). The RLS verification section lists the specific tables. The data privacy section addresses the TFLite on-device-only pipeline. This is NOT generic security advice.
**Impact**: Positive — this is one of the most well-grounded sections in EP3.

---

## CLAUDE.md Validation Findings

Based on the 13 selected tech slugs from Step 5:
`supabase-auth, supabase-postgresql, supabase-edge-functions, claude-api, tensorflow-lite, expo-image-picker, supabase-storage, revenucat, expo-notifications, posthog, sentry, eas-build, expo-updates`

### C1 — Tech Stack Section: Correct (PASS)
**Expected**: Platform line says "Expo SDK 52 (React Native)" (since platform is "mobile-expo"). Category groupings from the 13 techs.
**Actual (reconstructed)**: `buildClaudeMdContent` at line 1052-1054 correctly resolves "mobile-expo" to "Expo SDK 52 (React Native)". The category map groups by `selectedTechnologies[].category` and displays `techDetails.get(slug).name`.
**Finding**: Correct implementation.

### C2 — Architecture Conventions: PLATFORM_CONVENTIONS["mobile-expo"] Is Correct (PASS)
**Expected**: 5 conventions from PLATFORM_CONVENTIONS["mobile-expo"] (lines 1000-1006).
**Actual**: `buildClaudeMdContent` at line 1073 resolves `PLATFORM_CONVENTIONS[platform]` correctly.
**Finding**: Will produce: "Use Expo Router for file-based navigation", "Use expo-secure-store for sensitive data...", etc.

### C3 — TECH_CONVENTIONS Coverage: 5 Hits, 8 Misses (P2 MEDIUM)
**Expected TECH_CONVENTIONS matches from the 13 slugs**:
| Slug | TECH_CONVENTIONS entry? | Result |
|------|------------------------|--------|
| supabase-auth | YES (line 1016) | "Use Supabase Auth helpers..." |
| supabase-postgresql | YES (line 1017) | "Use Drizzle ORM..." |
| supabase-edge-functions | NO | MISSING |
| claude-api | YES (line 1019) → key is "claude-api" | "Use the Anthropic SDK..." |
| tensorflow-lite | NO | MISSING |
| expo-image-picker | NO | MISSING |
| supabase-storage | NO | MISSING |
| revenucat | YES (line 1027) → key is "revenuecat" | "Use RevenueCat for subscription management..." |
| expo-notifications | YES (line 1026) | "Request notification permissions at appropriate UX moment..." |
| posthog | NO | MISSING |
| sentry | NO | MISSING |
| eas-build | NO | MISSING |
| expo-updates | NO | MISSING |

**Finding**: Only 5 of 13 slugs have TECH_CONVENTIONS entries. The 8 missing slugs will not contribute architecture conventions to CLAUDE.md.
**Impact**: CLAUDE.md's Architecture section will be incomplete. Key missing conventions:
- **supabase-edge-functions**: No guidance on Deno runtime conventions, Edge Function structure
- **tensorflow-lite**: No guidance on model loading, tensor memory management
- **posthog**: No guidance on event naming conventions or user identification
- **sentry**: No guidance on error boundary setup or breadcrumb conventions
- **eas-build**: No guidance on build profile conventions
- **expo-updates**: No guidance on update channel management
**Fix**: Add TECH_CONVENTIONS entries for the missing 8 slugs. Priority entries:
```
"supabase-edge-functions": "Write Edge Functions in Deno TypeScript; use supabase-js client with service role key for server-side operations"
"tensorflow-lite": "Load TFLite models lazily; always dispose tensors after inference with tf.dispose() or tf.tidy()"
"posthog": "Use snake_case for all PostHog event names; identify users after authentication"
"sentry": "Wrap root component in Sentry ErrorBoundary; set user context after auth with Sentry.setUser()"
"eas-build": "Use development profile for simulator, preview for TestFlight, production for App Store"
"expo-updates": "Check for updates on app launch; never force-reload mid-session for non-critical updates"
"expo-image-picker": "Always request permissions before camera/gallery access; compress images before storage"
"supabase-storage": "Use RLS policies on storage buckets; organize files by user ID prefix"
```

### C4 — Common Commands: Mostly Complete (P3 LOW)
**Expected (for mobile-expo platform with supabase-postgresql slug)**:
- `npx expo start`
- `npx expo run:ios`
- `npx expo run:android`
- `npx drizzle-kit push` (because supabase-postgresql is in slugs)
- `npx drizzle-kit generate`

**Finding**: The code at lines 1091-1099 correctly includes Expo commands for mobile-expo platform and Drizzle commands when supabase-postgresql is present. No EAS Build commands are included (`eas build --profile production --platform ios`).
**Fix**: Add conditional commands for eas-build slug:
```
if (selectedTechSlugs.includes("eas-build")) {
  lines.push("- `eas build --profile development --platform ios` — Development build");
  lines.push("- `eas build --profile preview --platform ios` — TestFlight build");
  lines.push("- `eas update --branch production` — Publish OTA update");
}
```

### C5 — Setup Checklist Timing Groups: 5 Missing Registry Entries (P2 MEDIUM)
**Expected SETUP_STEPS_REGISTRY matches**:
| Slug | Registry entry? | Timing | Result |
|------|----------------|--------|--------|
| supabase-auth | YES | before-ep1 | envVars: 3, steps: 2 |
| supabase-postgresql | YES | before-ep1 | envVars: 1, steps: 1 |
| supabase-edge-functions | NO | — | MISSING |
| claude-api | YES (key: "claude-api") | before-ep1 | envVars: 1, steps: 1 |
| tensorflow-lite | NO | — | MISSING |
| expo-image-picker | NO | — | MISSING |
| supabase-storage | YES | after-ep1 | envVars: 0, steps: 1 |
| revenucat | YES (key: "revenuecat") | after-ep2 | envVars: 1, steps: 2 |
| expo-notifications | YES | after-ep2 | envVars: 1, steps: 1 |
| posthog | NO | — | MISSING |
| sentry | YES | after-ep3 | envVars: 2, steps: 2 |
| eas-build | NO | — | MISSING |
| expo-updates | NO | — | MISSING (categorized as analytics in seed, no setup steps) |

**Finding**: 5 slugs (supabase-edge-functions, tensorflow-lite, expo-image-picker, posthog, eas-build) have no SETUP_STEPS_REGISTRY entries.
**Fallback behavior** (lines 1117-1125): For missing slugs, the code checks `techDetails.get(slug).setupComplexity`. If not "drop-in", it adds a generic "Configure {name}" step to before-ep1. Let's check which would fall back:
- supabase-edge-functions: setupComplexity not in seed (it's not in the seed file at all — it's a custom slug from Step 5 customizations). **No techDetails entry.** Falls through silently.
- tensorflow-lite: setupComplexity = "significant-setup". **Would generate fallback**: "Configure TensorFlow Lite — see https://www.tensorflow.org/lite"
- expo-image-picker: setupComplexity = "drop-in". **Skipped** (correct — it's a drop-in install).
- posthog: setupComplexity = "drop-in". **Skipped** (correct — but PostHog requires API key setup, so "drop-in" is misleading).
- eas-build: setupComplexity not in the seed data I've read (need to verify). If present in seed, it would depend on the value.

**Impact**: The CLAUDE.md Setup Checklist will be missing setup steps for supabase-edge-functions (a critical part of the stack) and will have a generic fallback for tensorflow-lite. PostHog is marked "drop-in" but actually requires EXPO_PUBLIC_POSTHOG_API_KEY and EXPO_PUBLIC_POSTHOG_HOST env vars.
**Fix**: Add SETUP_STEPS_REGISTRY entries:
```
"supabase-edge-functions": {
  envVars: [],
  setupSteps: ["Install Supabase CLI: npm i -g supabase", "Run supabase init and supabase functions new"],
  timing: "before-ep1"
}
"posthog": {
  envVars: ["EXPO_PUBLIC_POSTHOG_API_KEY", "EXPO_PUBLIC_POSTHOG_HOST"],
  setupSteps: ["Create PostHog project at app.posthog.com", "Copy API key and host URL"],
  timing: "before-ep1"
}
"eas-build": {
  envVars: [],
  setupSteps: ["Install EAS CLI: npm i -g eas-cli", "Run eas login and eas build:configure"],
  timing: "before-ep1"
}
"expo-updates": {
  envVars: [],
  setupSteps: ["Configure updates URL in app.json after first EAS Build"],
  timing: "after-ep3"
}
```

### C6 — App Screens Grouping: Correct (PASS)
**Expected (from step-5.json promptPlan)**:
- Prompt 1: Welcome & Sign In, Skin Profile Onboarding, Profile & Skin Profile, Settings
- Prompt 2: Beauty Dashboard, Product Scanner, Product Detail, Routine Builder, Routine Detail & Check-In, My Collection, AI Skin Analysis, Ingredient Conflict Report
- Prompt 3: Skin Progress Timeline, Collection Analytics Dashboard, Premium Upgrade, Notification Center

**Finding**: The `buildClaudeMdContent` function at lines 1172-1187 groups screens by `promptOrder` correctly. The screen data from Step 5's `appScreens` array has correct `promptOrder` values (verified: all EP1 screens have promptOrder 1, EP2 screens have 2, EP3 screens have 3).

### C7 — Note on "revenucat" vs "revenuecat" Slug Discrepancy (P2 MEDIUM)
**Source**: step-5.json line 87 uses `"techSlug": "revenucat"`, while SETUP_STEPS_REGISTRY at line 975 and TECH_CONVENTIONS at line 1027 both use `"revenuecat"` (with an 'e').
**Finding**: The Step 5 AI output used `"revenucat"` (missing 'e') but the seed-technologies.ts uses `"revenucat"` as the canonical slug (line 269: `slug: "revenucat"`). The SETUP_STEPS_REGISTRY key is `"revenuecat"` and TECH_CONVENTIONS key is `"revenuecat"` — both use the **different** spelling.
**Impact**: When `buildClaudeMdContent` iterates over selectedTechSlugs with slug `"revenucat"`, it will NOT match SETUP_STEPS_REGISTRY["revenuecat"] or TECH_CONVENTIONS["revenuecat"]. This means:
- RevenueCat's setup steps and env vars will be MISSING from CLAUDE.md
- RevenueCat's architecture convention will be MISSING from CLAUDE.md
**Fix**: Standardize the slug to `"revenucat"` (matching the seed) and update SETUP_STEPS_REGISTRY and TECH_CONVENTIONS to use `"revenucat"` instead of `"revenuecat"`. OR add an alias mapping.

**CORRECTION**: Re-checking the seed file at line 269: `slug: "revenucat"`. And SETUP_STEPS_REGISTRY at line 975: key `"revenuecat"`. These DO NOT MATCH. This is a real bug.

---

## .mcp.json Validation Findings

### M1 — Supabase MCP Server: Correctly Triggered (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 806-813
**Expected**: supabase server triggered by slugs ["supabase-auth", "supabase-postgresql", "supabase-storage", "supabase-realtime"]. The selected slugs include supabase-auth, supabase-postgresql, and supabase-storage (3 matches).
**Finding**: `buildMcpJsonContent` correctly includes supabase server. Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY with `${...}` placeholders.
**Result**: Correct.

### M2 — Sentry MCP Server: Correctly Triggered (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 830-837
**Expected**: sentry server triggered by slug ["sentry"]. Selected slugs include "sentry".
**Finding**: Correctly included. Env vars: SENTRY_AUTH_TOKEN.

### M3 — Playwright Server: Always Included (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 862-869
**Expected**: playwright has triggerSlugs = [] (always included).
**Finding**: Correctly included with no env vars.

### M4 — Context7 Server: Always Included (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 870-877
**Expected**: context7 has triggerSlugs = [] (always included).
**Finding**: Correctly included with no env vars.

### M5 — Stripe Server: Correctly Excluded (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 814-821
**Expected**: stripe server triggered by ["stripe"]. No "stripe" slug in selected techs (GlowStack uses revenucat for payments, not stripe).
**Finding**: Correctly excluded.

### M6 — Firebase Server: Correctly Excluded (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 822-829
**Expected**: firebase server triggered by ["firebase-auth", "firebase-firestore", "firebase-cloud-messaging"]. None of these are in selected slugs.
**Finding**: Correctly excluded.

### M7 — Missing Servers Assessment (P3 LOW)
**Finding**: The following tech slugs have NO corresponding MCP servers in the registry:
- **RevenueCat**: No MCP server exists (RevenueCat does not offer one as of March 2026)
- **PostHog**: No MCP server (PostHog does not offer one)
- **Expo/EAS**: No MCP server (Expo does not offer one)
- **TensorFlow Lite**: No MCP server (not applicable — on-device ML)
- **Claude/Anthropic**: No MCP server in registry (Anthropic does not currently publish an MCP server for their API)

**Impact**: None — these services either don't have MCP servers or the MCP server wouldn't be useful in the IDE context. The 4 included servers (supabase, sentry, playwright, context7) cover the most impactful IDE integrations.

### M8 — Upstash Server Correctly Not Triggered (PASS)
**Source**: MCP_SERVER_REGISTRY at lines 838-845
**Expected**: upstash triggered by ["upstash-redis"]. Not in selected slugs.
**Finding**: Correctly excluded.

### M9 — Env Var Placeholder Format (PASS)
**Finding**: All env var placeholders use the `${VAR_NAME}` format consistently. The CLAUDE.md builder references `.mcp.json` saying "Environment variables marked with `${...}` must be set before use." This is correct and consistent.

### M10 — Reconstructed .mcp.json for GlowStack
The expected output of `buildMcpJsonContent` with the 13 selected slugs:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      }
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```
This is correct and complete for the selected tech stack.

---

## IDE Executability Findings

### I1 — EP3 Contains Zero Code Blocks (PASS)
**Finding**: The entire EP3 output uses prose descriptions, structured markdown, and bold formatting. No triple-backtick code fences were found. The ABSOLUTE RULE and FINAL CHECK in the prompt builder (lines 734, 789) worked.

### I2 — EP3 Is Self-Contained After EP1+EP2 (PASS)
**Finding**: EP3's preamble (line 7) correctly summarizes what EP1 and EP2 have built, establishing context for Claude Code. The preamble mentions specific technologies (Apple Sign-In, Supabase, expo-router v4, Sentry, PostHog, barcode scanning, Open Beauty Facts, Claude 4.5 Sonnet, TFLite, expo-notifications). This gives Claude Code enough context to continue building.

### I3 — EP3 File Structure Overview Is Implementation-Ready (PASS)
**Finding**: Part 12 lists all new files to create (screens, components, hooks, Edge Functions, migrations) grouped by category. This is actionable for Claude Code.

### I4 — Integration Verification Flows Are Executable (PASS)
**Finding**: Part 13 lists 5 end-to-end verification flows that Claude Code can use as test scenarios. Each flow describes a complete user journey with expected state changes. This is well-structured for testing.

### I5 — CLAUDE.md Would Be Missing Critical RevenueCat Info (P1 CRITICAL)
**Source**: C7 finding (slug mismatch)
**Finding**: Due to the "revenucat" vs "revenuecat" slug key mismatch, the generated CLAUDE.md would be missing:
- RevenueCat setup steps (Create RevenueCat project, Configure entitlements)
- REVENUECAT_API_KEY env var in the Setup Checklist
- RevenueCat architecture convention ("Use RevenueCat for subscription management; check entitlements before gating features")

**Impact**: A developer following CLAUDE.md would not be prompted to set up RevenueCat before starting EP prompts. They would encounter errors when EP3 references RevenueCat.

### I6 — supabase-edge-functions Slug Has No Seed Entry (P2 MEDIUM)
**Source**: Step 5 selected slugs include "supabase-edge-functions" but seed-technologies.ts has no entry for this slug.
**Finding**: `techDetails.get("supabase-edge-functions")` will return undefined. The CLAUDE.md builder's fallback (line 1117-1125) checks techDetails.get(slug) and if null, silently skips. This means supabase-edge-functions contributes NOTHING to CLAUDE.md — no setup steps, no conventions, no env vars.
**Impact**: The Supabase Edge Functions are a critical part of the architecture (ingredient engine, RevenueCat webhooks, expiry checks). Missing setup guidance in CLAUDE.md.
**Fix**: Either add "supabase-edge-functions" to seed-technologies.ts or add it to SETUP_STEPS_REGISTRY and TECH_CONVENTIONS.

---

## Scorecard Table

| Dimension | Findings | Critical (P1) | Major (P2) | Minor (P3) | Score |
|-----------|----------|---------------|------------|------------|-------|
| EP3 Hallucinations | 6 | 1 (H1) | 1 (H3) | 4 (H2,H4,H5,H6) | 7/10 |
| EP3 Prompt Weighting | 4 | 1 (W2) | 1 (W3) | 2 (W1,W4) | 7/10 |
| EP3 Efficiency | 3 | 0 | 1 (E1) | 2 (E2,E3) | 9/10 |
| CLAUDE.md Validation | 7 | 1 (C7/I5) | 2 (C3,C5) | 2 (C4,C1/C2/C6) | 6/10 |
| .mcp.json Validation | 10 | 0 | 0 | 1 (M7) | 10/10 |
| IDE Executability | 6 | 1 (I5) | 1 (I6) | 0 | 7/10 |

**Overall Score: 7.7 / 10**

---

## Summary Statistics

- **Total findings**: 36
- **Critical (P1)**: 3 (H1: fabricated social proof, W2: paywall guidelines ineffective, I5/C7: revenucat slug mismatch)
- **Major (P2)**: 6 (H3: free tier limit inconsistency, W3: RevenueCat redundancy, E1: checklist overlap, C3: 8 missing TECH_CONVENTIONS, C5: 5 missing SETUP_STEPS_REGISTRY, I6: supabase-edge-functions missing from seed)
- **Minor (P3)**: 9 (H2, H4, H5, H6, W1, W4, E2, E3, C4, M7)
- **Pass**: 18 (H4, H6, C1, C2, C6, M1-M6, M8-M10, I1-I4)

### Top 3 Priority Fixes
1. **Fix "revenucat"/"revenuecat" slug key mismatch** in SETUP_STEPS_REGISTRY and TECH_CONVENTIONS — P1, causes missing RevenueCat setup in CLAUDE.md
2. **Strengthen PAYWALL GUIDELINES** with negative examples and consider post-generation validation — P1, social proof fabrication despite explicit prohibition
3. **Add missing TECH_CONVENTIONS and SETUP_STEPS_REGISTRY entries** for supabase-edge-functions, posthog, eas-build, expo-updates, tensorflow-lite, sentry, expo-image-picker, supabase-storage — P2, CLAUDE.md is incomplete for 8 of 13 selected techs
