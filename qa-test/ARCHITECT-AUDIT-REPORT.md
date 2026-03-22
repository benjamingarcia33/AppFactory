# Architect Pipeline QA Audit Report
**Test Case**: Cognitize — speech coaching app
**Date**: 2026-03-08
**analysisId (run 2)**: 091e804a-c7f7-426a-b8b7-dc2386a3e3c1

---

## Executive Summary

The Architect pipeline completed successfully on run 2 (19.3 min) after increasing timeouts from 300s to 480s. All 5 steps + 6 documents were generated. The **technical quality is exceptionally high** — the tech stack is current, well-justified, and all 19 tech slugs + 13 screen patterns matched the knowledge base. However, there are issues with **PRD completeness** (missing API routes, data model), **Visual Strategy numerical contradictions**, and **Execution Prompt depth** (too much code, not enough architecture).

---

## Pipeline Performance

| Component | Run 1 | Run 2 | Notes |
|-----------|-------|-------|-------|
| Steps 1-4 (Sonnet) | ~95-177s each | ~77-109s each | Within expected range |
| Step 5 (Opus) | ~150s | ~126s | Good |
| Batch 1 (5 calls) | FAILED (2 timeouts) | All passed (72-357s) | 300s→480s timeout fixed it |
| Batch 2 (3 EPs) | Never reached | All passed (139-213s) | Well within 480s limit |
| Total | Timed out at 30min | 19.3 min | SSE timeout increased to 45min |

**Critical Fix Applied**: `DOC_FAST_TIMEOUT_MS` and `EP_TIMEOUT_MS` increased from 300s to 480s. This was necessary because PRD Part A took 357s (would fail at 300s).

---

## Step 5 — Technology Selection Audit

### Tech Slugs: ALL VALID (19/19 match knowledge base)
- Auth: supabase-auth, expo-auth-session
- Database: supabase-postgresql, drizzle-orm
- AI Audio: deepgram, openai-whisper, elevenlabs-tts, assemblyai
- AI Text: openai-gpt4o, claude-api
- Deployment: supabase-edge-functions, eas-build
- Storage: supabase-storage
- Payments: revenucat
- Analytics: posthog, sentry, expo-updates
- Notifications: expo-notifications
- Realtime: supabase-realtime

### Screen Patterns: ALL VALID (13/13 match knowledge base)
All screens mapped to appropriate patterns.

### Tech Currency (Web Search Verified):
- **Deepgram**: Active, Nova-3 is current (Nova-2 still supported). Pricing starts at $0.0043/min. ✅
- **ElevenLabs**: React Native SDK available, Expo integration documented. ✅
- **RevenueCat**: react-native-purchases v9.7.6+, Expo compatible. ✅
- **PostHog**: posthog-react-native v4.37.1 (published 5 days ago). ✅
- **Expo SDK**: EP references SDK 51 (current is 52 in 2026) — minor version gap. ⚠️
- All other technologies current and maintained.

### Assessment: PASS (with note on Expo SDK version)

---

## PRD Audit (86K chars → 95K chars in run 2)

### From audit agent:

| Criterion | Verdict | Key Issue |
|-----------|---------|-----------|
| Completeness | **FAIL** | No data model schema, no API routes, no tech stack section, missing Section 10 |
| Specificity | **PASS (warn)** | Domain-specific, but no formal acceptance criteria |
| Value & No Filler | **WARN** | ~30% redundant justification and marketing language |
| Technical Accuracy | **FAIL** | Latency budget unrealistic; local vs AI metric contradiction |
| Audience Appropriateness | **FAIL** | Scope/NFRs assume funded team, not solo builder |
| Content Quality | **WARN** | Live transcript contradiction; metric count inconsistency |

### Key Issue: The PRD is missing critical implementation details (data model, API routes, tech stack). However, the **Technical Architecture document** (54K chars) fills most of these gaps with detailed schemas, API specs, and architecture decisions. The PRD + Tech Arch together form a reasonably complete specification.

### Root Cause: The PRD prompt is designed as a product vision document, not a technical build specification. The Tech Architecture document is the actual companion that fills the technical gaps.

---

## Visual Strategy Audit (31K chars)

### From audit agent:

| Criterion | Verdict | Key Issue |
|-----------|---------|-----------|
| Value to Founder | **PASS** | Honest "conditional go", specific validation gates |
| Personas | **PASS** | 3 distinct, domain-specific personas |
| Revenue Model | **WARN** | Two incompatible pricing structures ($9.99 vs $7.99, annual plan existence contradicts) |
| Competitive Matrix | **WARN** | Missing Orai, Speeko, Yoodli; includes irrelevant Otsimo |
| Risk Assessment | **PASS** | 5 specific, well-mitigated risks |
| Timeline | **PASS** | Realistic 18-week plan with measurable milestones |
| Go/No-Go Scorecard | **WARN** | Minor numerical errors |
| Data Quality | **FAIL** | 6 internal contradictions, 2 math errors, unverifiable market figures |

### Key Issue: Revenue model contradicts itself (two different pricing models in different sections). Competitive matrix inherits Scout's missing competitor problem.

---

## Technical Architecture Audit (54K chars)

### Assessment: PASS

This is the strongest document in the set. It covers:
- Full data model with specific column names, types, and indexes ✅
- 6 core entities + local SQLite schema + migration strategy ✅
- AI integration architecture with 3 fallback tiers (cloud/degraded/offline) ✅
- Interruption engine design with specific trigger signals ✅
- Edge Function architecture for API proxying ✅
- Security and compliance section ✅
- Technology synergies and integration notes ✅
- Technical risks with specific mitigations ✅

### Minor issues:
- References Expo SDK 51 instead of current SDK 52
- Some cost estimates may be outdated (check Deepgram pricing tiers)

---

## Execution Prompts Audit

### EP1: Foundation (53K chars, 1634 lines, 47 code blocks)
- Project setup, auth, onboarding, settings, database schema
- Contains complete file implementations (AudioManager class, Supabase config, auth flows)
- All install commands use real, current packages

### EP2: Core Features (55K chars, 1362 lines, 23 code blocks)
- Scenario library, live pressure session, feedback report
- The Live Pressure Session section has a full AudioManager class implementation
- Edge function for Deepgram WebSocket proxying is well-designed

### EP3: Polish & Production (38K chars, 1203 lines, 23 code blocks)
- Progress history, profile, premium upgrade, notifications, EAS build
- RevenueCat integration is well-specified
- App Store submission checklist included

### Depth Assessment: WARN — Too Code-Heavy

Per the user's quality standards, EPs should be at the "what/why/how" architectural level, NOT containing exact code. The current EPs contain:
- Full TypeScript class implementations
- Complete React Native component code
- Exact config file contents (app.json, tailwind.config.js, metro.config.js)
- Complete Supabase Edge Function implementations

This is closer to a **tutorial codebase** than a **technical blueprint**. While this is arguably MORE useful for Claude Code automation, it violates the spec.

**Recommendation**: The EPs should describe:
- What each file/module does and why
- What interfaces/types it exports
- How it connects to other modules
- What API calls it makes and to where
- Key architectural decisions and tradeoffs

And leave the actual code implementation to Claude Code.

### Claude Code Automation Estimate: ~70-80%
The EPs provide enough detail for Claude Code to build most of the app autonomously. The remaining 20-30% would require:
- API key configuration and environment setup
- Deepgram WebSocket streaming integration (real-time audio is notoriously tricky)
- ElevenLabs TTS integration with audio ducking
- App Store submission and review process
- Production monitoring and scaling

---

## Cross-Document Consistency Issues

1. **Expo SDK version**: EP1 says "Expo SDK 51" but current is SDK 52
2. **Metric count**: PRD has 5 metrics, Tech Arch has 6, EPs reference varying numbers
3. **Pricing**: Visual Strategy has two contradictory pricing models
4. **Timeline**: Risk section says "16-week plan" but timeline adds to 18 weeks
5. **Live transcript**: PRD prohibits it in one place, requires it in another
6. **Scenario count**: PRD describes 9 categories but MVP scope says 5 scenarios

---

## Issues Summary for Fix Phase

### P0 — Pipeline Fixes (already done)
1. ✅ DOC_FAST_TIMEOUT_MS increased to 480s
2. ✅ EP_TIMEOUT_MS increased to 480s
3. ✅ SSE stream timeout increased to 45min

### P1 — Prompt Fixes Needed
4. **PRD prompt**: Add instructions to include data model schemas, API routes, and tech stack
5. **Visual Strategy prompt**: Ensure revenue model section generates ONE consistent pricing structure
6. **EP prompts**: Reduce code density — instruct AI to provide architectural descriptions, not full implementations
7. **Master idea prompt**: Instruct AI to only cite competitors directly relevant to the user's idea

### P1 — Scout Fixes Needed
8. **Relevance filtering**: `calculateIdeaRelevanceBonus` uses loose keyword matching; needs semantic relevance or AI-assisted filtering
9. **App Store enrichment**: 7/11 apps had score=0 because `enrichAppMetadata` failed silently
10. **Market size scoring**: All App Store apps get marketSize=14 due to no install data; needs ratings-weighted alternative

### P2 — Knowledge Base Updates
11. **Expo SDK version**: Update seed data to reference SDK 52
12. **Deepgram**: Note that Nova-3 is current, Nova-2 is legacy

### P3 — Cosmetic
13. Fix "16-week" → "18-week" cross-reference in VS risk section
14. Add "as of" dates to competitor rating data
