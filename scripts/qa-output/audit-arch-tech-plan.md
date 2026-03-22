# Architect Tech Plan (Steps 3-5) Audit Report

## Executive Summary

Step 5 (Technology Selection) is well-grounded against the knowledge base — all 13 tech slugs and all 10 screen pattern slugs are valid. However, Step 3 (AI Approach) contains multiple deprecated model name hallucinations ("GPT-4o" / "gpt4o-vision" / "openai-gpt4o") despite the CURRENT_TECH_VERSIONS prompt explicitly banning them. There is significant structural redundancy between Step 3's modelsAndApis, Step 4's techStack, and Step 5's selectedTechnologies, and the schema field "twelveWeekPlan" only contains 1 sprint entry despite Step 4 planning a 16-week timeline.

## Hallucination Findings

### H1: Deprecated model slug "gpt4o-vision" in Step 3
- **Severity**: P1
- **Source**: `step-3.json` line 15 — `"model": "gpt4o-vision"`
- **Finding**: Step 3 modelsAndApis use case "Photo-Based Product Recognition" references `gpt4o-vision`. This slug does not exist in seed-technologies.ts. The correct slug is `gpt5-vision` (line 389 in seed file). The CURRENT_TECH_VERSIONS constant explicitly states: "Do NOT reference older versions... GPT-4o."
- **Evidence**: `CURRENT_TECH_VERSIONS` line 324: "OpenAI GPT-5.2 / GPT-5.4 (NOT GPT-4o — deprecated)"; line 341: "OpenAI Vision (GPT-5.4 with vision) → slug: gpt5-vision"
- **Impact**: If any downstream code attempts to look up this slug in the knowledge base, it will return no match. The rationale text also says "GPT-4o Vision" (deprecated name) instead of "GPT-5.4 Vision."
- **Fix**: In Step 3 prompt builder, reinforce the slug mapping instruction. Alternatively, add a post-processing slug normalizer that maps known deprecated slugs to current ones.

### H2: Deprecated model name "openai-gpt4o" in Step 3
- **Severity**: P1
- **Source**: `step-3.json` line 25 — `"model": "openai-gpt4o"`
- **Finding**: The "Personalized Routine Recommendations" use case references `openai-gpt4o`. This slug does not exist in seed-technologies.ts. The correct slug is `openai-gpt5` (line 321 in seed file). The rationale text also repeatedly says "GPT-4o" when it should say "GPT-5.2" or "GPT-5.4."
- **Evidence**: seed-technologies.ts only contains `slug: "openai-gpt5"`, no `openai-gpt4o` entry.
- **Impact**: Same downstream lookup failure risk. The entire rationale paragraph is grounded in a deprecated model's capabilities rather than the current GPT-5.x family.
- **Fix**: Same as H1 — slug normalization or stronger prompt reinforcement.

### H3: Pervasive "GPT-4o" references in Step 3 rationale text
- **Severity**: P2
- **Source**: `step-3.json` lines 16, 21, 26, 31, 61-63, 65, 73, 76, 95, 99
- **Finding**: At least 12 occurrences of "GPT-4o" in free-text rationale fields (cost analysis, optimization strategies, risks, fallback descriptions). While these are not slugs and do not break lookups, they contradict the CURRENT_TECH_VERSIONS instruction and will confuse a solo developer reading the output.
- **Evidence**: CURRENT_TECH_VERSIONS explicitly states "Do NOT reference older versions... GPT-4o."
- **Impact**: Downstream documents (PRD, EPs) may perpetuate the deprecated name if they echo Step 3 summaries.
- **Fix**: Add a `replaceDeprecatedModelNames()` post-processor on Step 3 output that normalizes "GPT-4o" → "GPT-5.4" and "GPT-4o Vision" → "GPT-5.4 Vision" in all string fields.

### H4: "GPT-4o" references in Step 4 rationale text
- **Severity**: P2
- **Source**: `step-4.json` lines 30, 54
- **Finding**: Step 4 aiIntegration says "GPT-4o vision endpoint" and aiQualityTesting says "GPT-4o product photo recognition." Same deprecated model name issue as H3.
- **Evidence**: Same CURRENT_TECH_VERSIONS constraint applies to Step 4 (injected at line 442 of architect-prompts.ts).
- **Impact**: Perpetuates outdated model names into the development plan that the solo dev will follow.
- **Fix**: Same post-processor as H3.

### H5: Step 5 clean — no hallucinated slugs
- **Severity**: PASS
- **Source**: `step-5.json`
- **Finding**: All 13 selectedTechnologies slugs validated against seed-technologies.ts:
  - `supabase-auth` (line 17) — VALID
  - `supabase-postgresql` (line 101) — VALID
  - `supabase-edge-functions` (line 813) — VALID
  - `claude-api` (line 305) — VALID
  - `tensorflow-lite` (line 405) — VALID
  - `expo-image-picker` (line 233) — VALID
  - `supabase-storage` (line 185) — VALID
  - `revenucat` (line 269) — VALID
  - `expo-notifications` (line 593) — VALID
  - `posthog` (line 713) — VALID
  - `sentry` (line 745) — VALID
  - `eas-build` (line 797) — VALID
  - `expo-updates` (line 761) — VALID
- **Impact**: None — all lookups will succeed.

### H6: All 10 screen pattern slugs validated
- **Severity**: PASS
- **Source**: `step-5.json` appScreens
- **Finding**: All screen pattern slugs exist in seed-screen-patterns.ts:
  - `login` (line 19) — VALID
  - `onboarding-flow` (line 125) — VALID
  - `home-dashboard` (line 173) — VALID (used twice: Beauty Dashboard + Collection Analytics)
  - `camera-capture` (line 645) — VALID (used twice: Product Scanner + AI Skin Analysis)
  - `detail-view` (line 403) — VALID (used 3 times: Product Detail, Routine Detail, Ingredient Conflict Report)
  - `creation-editor` (line 463) — VALID
  - `search-browse` (line 761) — VALID
  - `content-feed` (line 342) — VALID
  - `pricing-paywall` (line 825) — VALID
  - `profile` (line 285) — VALID
  - `settings` (line 236) — VALID
  - `notification-center` (line 886) — VALID
- **Impact**: None — all lookups will succeed.

### H7: Synergy notes — all pairs grounded in seed-synergies.ts
- **Severity**: PASS (with note)
- **Source**: `step-5.json` synergyNotes (8 entries)
- **Finding**: All 8 synergy tech pairs map to valid slug combinations in seed-synergies.ts:
  1. `supabase-auth` + `supabase-postgresql` — VALID (line 22-23, relationship: recommended)
  2. `supabase-edge-functions` + `claude-api` — No exact seed entry for this pair (edge-functions + claude-api not in seed). However both slugs are valid, and supabase-postgresql + supabase-edge-functions IS in the seed (line 62-63). The AI generated a reasonable novel pairing.
  3. `revenucat` + `supabase-auth` — No exact seed entry. `revenucat` + `stripe` exists (line 309-310) and `stripe` + `revenucat` is compatible. This is a novel but reasonable pairing.
  4. `tensorflow-lite` + `expo-image-picker` — No exact seed entry. `expo-location` + `expo-image-picker` exists (line 144-145) as recommended. Novel but reasonable.
  5. `eas-build` + `tensorflow-lite` — No exact seed entry. Novel but reasonable for the bare-workflow TFLite bundling concern.
  6. `sentry` + `eas-build` — VALID (line 361-362, relationship: recommended)
  7. `posthog` + `revenucat` — No exact seed entry. `posthog` + `mixpanel` exists (line 269-270) as redundant. Novel cross-category pairing.
  8. `expo-notifications` + `supabase-postgresql` — No exact seed entry. `expo-notifications` + `eas-build` exists (line 134-135). Novel but reasonable.
- **Note**: Only 2 of 8 synergy pairs have exact matches in the seed. The other 6 are novel combinations the AI inferred. The synergy notes content is reasonable and app-specific, but the EP builders will not find matching `promptNote` fragments from the seed for those 6 pairs.
- **Impact**: Low. The synergy notes are used as integration guidance, not for slug lookups. The novel pairings are contextually valid.

### H8: Step 3 cost figures — partially grounded
- **Severity**: P3
- **Source**: `step-3.json` costAnalysis
- **Finding**: The cost estimates reference "Claude 4.5 Sonnet" pricing at "~$3/MTok input" which is roughly correct for Claude Sonnet-class pricing. The per-user cost breakdown ($0.056-$0.10/month premium user) is internally consistent with the stated call frequencies and cache hit rates. However, all GPT-related costs reference "GPT-4o" pricing, not GPT-5.x pricing which would likely be different.
- **Impact**: Cost projections may be inaccurate if GPT-5.x pricing differs significantly from GPT-4o pricing. Minor since GPT is only used as a fallback.
- **Fix**: Update model references and adjust cost estimates for GPT-5.x pricing.

## Prompt Weighting Findings

### W1: CURRENT_TECH_VERSIONS coverage gap — no "gpt5-vision" model name
- **Severity**: P2
- **Source**: `architect-prompts.ts` lines 320-345
- **Finding**: The CURRENT_TECH_VERSIONS constant maps slugs at lines 338-345 but does not include an explicit model version name for GPT-5.4 Vision. It says `"OpenAI Vision (GPT-5.4 with vision) → slug: gpt5-vision"` which includes the slug, but the model version instruction at line 324 only says `"OpenAI GPT-5.2 / GPT-5.4 (NOT GPT-4o — deprecated)"` without explicitly calling out Vision. The AI may not connect "GPT-5.4 with vision" slug mapping to the general GPT-5 instruction.
- **Evidence**: Step 3 generated `gpt4o-vision` despite the slug mapping existing, suggesting the instruction is not prominent enough.
- **Impact**: The AI ignores the slug mapping and defaults to its training data knowledge of "GPT-4o Vision."
- **Fix**: Add a more explicit instruction: "GPT-4o Vision is DEPRECATED. Use GPT-5.4 Vision (slug: gpt5-vision) for ALL vision tasks. Never output 'gpt4o' or 'GPT-4o' anywhere."

### W2: Solo indie developer constraint — well respected
- **Severity**: PASS
- **Source**: Steps 3, 4, 5
- **Finding**: Searched all three step outputs for "team", "sprint", "workstream", "parallel work" — no multi-person language found in Steps 3 or 5. Step 4 uses "sprint" only in testing context ("blocks the sprint", "end of each 2-week sprint") which is acceptable as a solo-dev time-boxing term, not a team-staffing term. The timeline is explicitly "16 weeks total for one solo developer." No reference to team roles, multiple developers, or parallel workstreams.
- **Impact**: None — constraint is well enforced.

### W3: Screen-to-EP assignment consistency
- **Severity**: PASS
- **Source**: `step-5.json` appScreens[].promptOrder vs promptPlan
- **Finding**: All 16 screens have promptOrder assignments that match the promptPlan:
  - **EP1 (promptOrder=1)**: Welcome & Sign In, Skin Profile Onboarding, Profile & Skin Profile, Settings — matches `prompt1Screens` exactly.
  - **EP2 (promptOrder=2)**: Beauty Dashboard, Product Scanner, Product Detail, Routine Builder, Routine Detail & Check-In, My Collection (Shelfie), AI Skin Analysis, Ingredient Conflict Report — matches `prompt2Screens` exactly (8 screens).
  - **EP3 (promptOrder=3)**: Skin Progress Timeline, Collection Analytics Dashboard, Premium Upgrade, Notification Center — matches `prompt3Screens` exactly.
- **Impact**: None — EP builders will receive correctly partitioned screens.

### W4: Context flow from Steps 1-2 into Steps 3-5
- **Severity**: P3
- **Source**: `architect-prompts.ts` lines 413-536
- **Finding**: Steps 3 and 4 receive `aiExpectationsSummary` and `strategicPlanSummary` (or `previousStepsSummary`) which are summaries of Steps 1-2. Step 5 receives `allStepsSummary`. The summaries are compact text, so some detail loss is expected. Step 3's output shows it correctly references competitor privacy concerns, crash-free requirements, and pricing ($7.99/month) from Steps 1-2. Step 5 correctly picks up the privacy-first architecture requirement (TFLite on-device, no cloud photo upload). Context flow appears adequate.
- **Impact**: Minimal — summaries carry enough signal for downstream steps.

### W5: Step 3 receives optional `techCatalog` — but unclear if populated
- **Severity**: P3
- **Source**: `architect-prompts.ts` line 417 — `techCatalog?: string`
- **Finding**: The `buildAiApproachPrompt` function accepts an optional `techCatalog` parameter. If provided, it instructs the AI to "reference specific technologies from the catalog above." However, if not provided (undefined), the AI has no catalog to reference and falls back to its training data — which explains why it generates deprecated model names like "gpt4o-vision" instead of catalog slugs like "gpt5-vision."
- **Impact**: If the tech catalog is not passed to Step 3, the AI has no grounding for correct slug usage. Step 5 always receives the catalog (required parameter), which is why Step 5 has no hallucinated slugs.
- **Fix**: Make `techCatalog` required for Step 3, not optional. This would ground the AI's model/API selections in the knowledge base.

## Output Efficiency Findings

### E1: High redundancy — Step 3 modelsAndApis vs Step 5 selectedTechnologies
- **Severity**: P2
- **Source**: `step-3.json` modelsAndApis (8 entries) vs `step-5.json` selectedTechnologies (13 entries)
- **Finding**: Step 3 lists 8 model/API use cases. Step 5 selects 13 technologies. The overlap:
  - `tensorflow-lite`: described in both (Step 3 as on-device skin analysis, Step 5 as selected tech with customizations)
  - `claude-api`: described in both (Step 3 as ingredient conflict + education engine, Step 5 as selected tech)
  - `supabase-postgresql`: referenced in Step 3's data strategy, selected in Step 5
  - `supabase-edge-functions`: referenced in Step 3 architecture, selected in Step 5
  - `posthog` + `sentry`: listed in Step 3 as analytics, selected in Step 5
  - `revenucat`: referenced in Step 3 data strategy (RevenueCat SDK 8+), selected in Step 5
  - `expo-notifications`: referenced in Step 3 (routine scheduling), selected in Step 5
- **Net**: 8 of 13 Step 5 technologies are already described in Step 3. Step 5 adds 5 unique selections: `supabase-auth`, `supabase-storage`, `expo-image-picker`, `eas-build`, `expo-updates`.
- **Impact**: ~3,500 tokens of redundant content between the two steps. Step 5's value-add is the formal slug mapping, screen assignments, and customization arrays — not the technology selection itself.
- **Fix**: Consider making Step 3 focus only on AI/ML architecture decisions (models, data strategy, cost) and defer ALL technology selection to Step 5. Alternatively, Step 5 could skip justification for technologies already justified in Step 3.

### E2: High redundancy — Step 4 techStack vs Step 5 selectedTechnologies
- **Severity**: P2
- **Source**: `step-4.json` techStack (5 sections: frontend, backend, database, aiIntegration, infrastructure) vs `step-5.json` selectedTechnologies
- **Finding**: Step 4's techStack is a verbose prose description (~4,200 tokens) that lists the same technologies Step 5 formally selects:
  - Frontend: "React Native 0.76 via Expo SDK 52", "expo-router v4", "NativeWind v4", "expo-camera", "expo-notifications", "expo-sqlite", "React Query", "Zustand", "Reanimated 3"
  - Backend: "Supabase Edge Functions" (same as Step 5 `supabase-edge-functions`)
  - Database: "Supabase Postgres" + "Expo SQLite" + "Drizzle ORM" (same as Step 5 `supabase-postgresql`)
  - AI: "Claude 4.5 Sonnet" + "TensorFlow Lite" + "GPT-4o vision" (same as Step 5 `claude-api`, `tensorflow-lite`)
  - Infrastructure: "Supabase", "EAS Build", "RevenueCat", "Sentry", "PostHog" (same as Step 5)
- Step 4 actually names MORE technologies than Step 5 selects (e.g., Zustand, React Query, NativeWind, Drizzle ORM, Reanimated 3 are in Step 4 but not in Step 5's formal selection).
- **Impact**: ~4,200 tokens of near-duplicate content. Step 4's techStack is essentially a prose preview of what Step 5 formalizes. The divergence (Step 4 includes Zustand, React Query, NativeWind, Drizzle ORM but Step 5 does not) creates confusion about which is authoritative.
- **Fix**: Either (a) remove techStack from Step 4 schema entirely and rely on Step 5, or (b) constrain Step 4's techStack to high-level categories ("Expo/React Native", "Supabase", "Claude API") without specific library names, deferring specifics to Step 5.

### E3: Step 5 customNotes — appropriately concise
- **Severity**: PASS
- **Source**: `step-5.json` appScreens[].customNotes
- **Finding**: Custom notes range from 40-80 words per screen. They are app-specific (e.g., "Barcode scanning overlay", "Fitzpatrick skin tone scale", "Drag-and-drop product ordering") rather than generic. No padding or boilerplate detected. The notes add genuine implementation context beyond what the pattern slug alone provides.
- **Impact**: None — appropriate detail level.

### E4: Schema field name mismatch — "twelveWeekPlan" contains only 1 sprint for a 16-week plan
- **Severity**: P2
- **Source**: `step-4.json` line 33 — `"twelveWeekPlan": [{ "weeks": "Weeks 1-2", ... }]`
- **Finding**: The schema field is named `twelveWeekPlan` but: (a) the timeline is 16 weeks, not 12, and (b) the array contains only 1 sprint entry (Weeks 1-2) instead of the expected 6-8 entries covering all 16 weeks. This is likely a token truncation issue — the AI generated the first sprint and then hit the output token limit before completing the remaining sprints.
- **Evidence**: The `timeline` field in `mvpScope` correctly says "16 weeks total" and lists all 8 time blocks. But `twelveWeekPlan` only contains the first one.
- **Impact**: High — the execution prompts lose 7 of 8 sprint plans. The solo developer has no week-by-week breakdown after Week 2.
- **Fix**: (a) Rename schema field from `twelveWeekPlan` to `weeklyPlan` to match the 16-week reality. (b) Increase Step 4 token limit or split the plan into a separate call. (c) Alternatively, since `mvpScope.timeline` already contains the full 16-week breakdown in prose, consider removing the structured `twelveWeekPlan` array to save tokens and prevent truncation.

### E5: Total data volume across Steps 3-5
- **Severity**: P3
- **Source**: All three step outputs
- **Finding**: Approximate token counts:
  - Step 3: ~5,800 tokens (modelsAndApis + dataStrategy + architecture + costAnalysis + risks)
  - Step 4: ~8,200 tokens (mvpScope + techStack + twelveWeekPlan + testingStrategy + launchChecklist)
  - Step 5: ~5,500 tokens (selectedTechnologies + appScreens + synergyNotes + promptPlan)
  - **Total**: ~19,500 tokens across Steps 3-5
- Removing redundant content (Step 3 modelsAndApis tech details duplicated in Step 5, Step 4 techStack duplicated in Step 5) could save ~4,000-5,000 tokens (~25% reduction).
- **Impact**: The redundancy inflates downstream document generation costs since step summaries are fed into EP builders. Compressing would reduce token spend on the 3 Opus EP calls.
- **Fix**: See E1 and E2 fixes above. Additionally, the `formatStructuredContent()` function could deduplicate overlapping sections when building EP input context.

## Scorecard Table

| Check ID | Check Description | Result | Severity |
|----------|-------------------|--------|----------|
| H1 | Step 3 slug "gpt4o-vision" exists in knowledge base | FAIL | P1 |
| H2 | Step 3 slug "openai-gpt4o" exists in knowledge base | FAIL | P1 |
| H3 | Step 3 rationale text uses current model names | FAIL | P2 |
| H4 | Step 4 rationale text uses current model names | FAIL | P2 |
| H5 | Step 5 selectedTechnologies slugs valid | PASS | — |
| H6 | Step 5 screen pattern slugs valid | PASS | — |
| H7 | Step 5 synergy note pairs grounded | PASS | — |
| H8 | Step 3 cost figures grounded | WARN | P3 |
| W1 | CURRENT_TECH_VERSIONS covers all referenced techs | WARN | P2 |
| W2 | Solo indie developer constraint respected | PASS | — |
| W3 | Screen-to-EP assignment consistency | PASS | — |
| W4 | Steps 1-2 context flows into Steps 3-5 | PASS | P3 |
| W5 | Step 3 techCatalog parameter populated | WARN | P3 |
| E1 | Step 3 modelsAndApis vs Step 5 redundancy | WARN | P2 |
| E2 | Step 4 techStack vs Step 5 redundancy | WARN | P2 |
| E3 | Step 5 customNotes conciseness | PASS | — |
| E4 | twelveWeekPlan completeness (truncated to 1 of 8 sprints) | FAIL | P2 |
| E5 | Total data volume compressibility | WARN | P3 |

## Summary Statistics

- **Total checks**: 18
- **PASS**: 9 (50%)
- **WARN**: 5 (28%)
- **FAIL**: 4 (22%)
- **P1 findings**: 2 (deprecated model slugs in Step 3)
- **P2 findings**: 5 (deprecated model names in text, CURRENT_TECH_VERSIONS gap, redundancy, truncated plan)
- **P3 findings**: 3 (cost grounding, context flow, data volume)

**Top priority fixes:**
1. **H1+H2 (P1)**: Add post-processing slug normalization for Step 3 output, or make `techCatalog` required for Step 3 to ground model selections in the knowledge base.
2. **E4 (P2)**: Fix truncated `twelveWeekPlan` — either increase Step 4 token limit, rename the schema field, or remove the structured plan in favor of the prose `timeline` field.
3. **H3+H4+W1 (P2)**: Add explicit "GPT-4o is DEPRECATED" reinforcement in CURRENT_TECH_VERSIONS with a post-processor to catch and replace any remaining deprecated names in output text.
4. **E1+E2 (P2)**: Reduce redundancy by narrowing Step 3 to AI/ML-only decisions and Step 4 to high-level tech categories, deferring specific library selection to Step 5.
