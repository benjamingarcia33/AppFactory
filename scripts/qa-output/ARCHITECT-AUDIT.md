# Architect Pipeline QA Audit — Cognitize Speech Coaching App

## Test Parameters
- **Analysis ID**: 6ce4df9e-e66e-4a59-a7f2-a4339c5f19d0
- **Input**: Master Idea from Scout scan 17bd6049-d15a-452e-9568-66baed301f8c
- **Duration**: ~25-30 minutes total (steps + documents)
- **Steps completed**: 5/5
- **Documents generated**: 5 (PRD, Visual Strategy, EP1, EP2, EP3)
- **Missing documents**: Technical Architecture (failed silently in Batch 1)
- **EP tech slugs**: 17 technologies selected

---

## P0 Issues (Pipeline Crashes or Wrong DB Writes)

### P0-01: PRD Missing Sections 1-5 (Half-Document Accepted) — FIXED
PRD Part A failed during Batch 1 parallel generation. The code at `architect.ts` line 727 used `if (prdA || prdB)`, silently accepting Part B alone. Result: the stored PRD starts at "## 6. Data & Content Requirements" — sections 1-5 (Vision, Goals, User Stories, Core Features, Technical Approach) are completely absent.

**Impact**: A developer receiving this PRD would have no feature specification to build from.
**Root cause**: `Promise.allSettled` caught the failure, `prdA` was null, `prdB` existed, so the OR condition passed.
**Fix applied**: Added retry logic for failed parts + explicit warning if still partial after retry.

### P0-02: Technical Architecture Document Missing
The `technical_architecture` document was not generated — `techArchResult` in Batch 1 was rejected. No retry was attempted. This is the same `Promise.allSettled` pattern where failures are logged but not retried.

**Impact**: One of 6 expected documents is missing entirely.
**Status**: Partially addressed by the PRD fix pattern. Tech Arch already has `else if (rejected)` logging but no retry.

---

## P1 Issues (Factually Wrong or Misleading Output)

### P1-01: Step 1 References Fake Competitors
Step 1 (AI Expectations) references "Gibson", "FreshBooks", and "Google Classroom" as competitors for a speech coaching app. These were passed through from Scout's irrelevant competitor data.

**Impact**: Downstream steps inherit wrong competitive context.
**Root cause**: Upstream Scout data quality (see Scout audit P1-1).
**Fix**: Addressed by Scout relevance filtering fix. No Architect-side fix needed.

### P1-02: Financial Projections Wildly Unrealistic
Visual Strategy contains contradictory projections:
- Monthly projections: 26,000 users at Month 12
- Yearly projections: 4,200 users at Year 1
- Claims 420 paying users in Month 1 (before any marketing)

**Root cause**: The VS prompt doesn't constrain projections to solo builder reality.
**Fix needed**: Add solo builder constraint to VS prompts (similar to Scout master idea fix).

### P1-03: Unit Economics Math Errors
- LTV calculation: States "LTV = $24 × 14.3 months = $342.90" but then shows different values in other sections
- Payback period: Inconsistent with stated CAC and ARPU
- Go/No-Go weighted score: Report says 6.8 but manual calculation yields 6.725

**Root cause**: AI arithmetic errors in free-text generation.
**Fix**: Could add a structured math section in VS prompt, but this is an inherent LLM limitation.

### P1-04: Free Tier Defined 3 Different Ways
- PRD (Section 8, if it existed): Not available (Part A missing)
- Visual Strategy: "3 sessions/week"
- Step 2 Revenue Model: "5 sessions/month"
- Step 4 Dev Plan: "3 sessions/week"

**Root cause**: Each step/document is generated independently with no cross-validation.
**Fix needed**: Include the free tier definition from Step 2 in all downstream document prompts.

### P1-05: Competitive Matrix Excludes Real Competitors
Visual Strategy's competitive matrix scores adjacent/irrelevant apps instead of actual speech coaching competitors (Yoodli, Speeko, Orai). Paradoxically, the risk assessment section correctly identifies Yoodli and Speeko as real threats.

**Root cause**: Upstream Scout data. Matrix is built from Scout's opportunity data.
**Fix**: Addressed by Scout relevance filtering fix.

### P1-06: 12-Week Timeline Unrealistic for Solo Builder
Step 4 proposes a 12-week timeline with 50-100 beta users, Detox E2E tests, and simultaneous iOS+Android launch. This assumes a team, not a solo builder.

**Root cause**: No solo builder constraint in Architect prompts.
**Fix needed**: Add solo builder context to Architect Step 4 prompt (similar to Scout fix).

---

## P2 Issues (Correct but Low-Value or Generic)

### P2-01: Step 2 Personas — EXCELLENT
The 4 personas (Marcus Chen, Priya Nair, David Okafor, Sofia Reyes) are specific, well-researched, and genuinely useful:
- Each has realistic demographics, budgets, and frustrations
- Willingness-to-pay ranges are plausible
- Sofia Reyes (debate coach) correctly identifies the B2B2C channel
- No "generic user" filler personas

**Rating**: 9/10

### P2-02: Step 3 AI Approach — Strong
- Correctly recommends AssemblyAI for real-time STT (appropriate for streaming)
- GPT-4o for adversarial interruption engine (correct choice for low latency)
- ElevenLabs for TTS (realistic for persona voices)
- Sentry for crash monitoring (correct priority given reliability differentiator)
- RevenueCat for billing (industry standard)
- Supabase Auth with Apple Sign-In (App Store requirement)

**Minor issue**: Suggests both OpenAI Whisper AND AssemblyAI — should clearly mark Whisper as fallback-only.

### P2-03: Step 4 Dev Plan — Good Structure, Wrong Scale
The 7 core MVP features are well-defined and specific. The deferred features list is reasonable. The 12-week timeline has clear weekly milestones. Definition of Done is comprehensive.

**Issue**: Scale assumes a team (50-100 beta users, Detox E2E tests, CI/CD with GitHub Actions). For a solo builder, this should be 3-6 months with 10-20 beta testers.

### P2-04: Step 5 Tech Selection — Very Good
- 17 technologies selected, all real knowledge base entries
- Platform: `mobile-expo` (correct for speech coaching)
- 14 screens mapped across 3 EPs with logical ordering
- 10 synergy notes connecting technologies
- Pricing: $9.99/month or $79.99/year (reasonable indie pricing)

**Minor issues**:
- `expo-updates` category listed as "analytics" (should be "deployment")
- Latency budget (1.2s total end-to-end) may be optimistic for real-time interruption

### P2-05: PRD Anti-Patterns Section (Section 9) — Outstanding
The anti-patterns section is the strongest part of the entire output:
- Identifies real competitor failures (deceptive billing patterns)
- Technical anti-patterns are specific and actionable
- UX anti-patterns grounded in real review data

### P2-06: VS Market Gap Analysis — Strong
The market gap analysis correctly identifies real opportunities in the speech coaching space, even though the competitive matrix uses wrong competitors. The gap identification is based on general market knowledge rather than the flawed Scout data.

### P2-07: VS Risk Assessment — Well-Calibrated
The risk assessment identifies real, non-obvious risks:
- Correctly flags Yoodli as the strongest competitive threat (despite not being in Scout's data)
- Identifies speech recognition accuracy as the make-or-break technical risk
- Latency requirements for real-time interruption correctly flagged
- App Store audio permission rejection risk noted

---

## Execution Prompts Audit

### EP1 (Foundation) — Rating: 8/10
**Strengths**:
- Contains actual bash commands for project initialization
- SQL schema with proper RLS policies
- Supabase config, auth setup, and navigation all specified
- Expo SDK version specified (51)

**Issues**:
- Very detailed — may exceed what Claude Code can process in a single prompt
- Some config values are placeholder-quality

### EP2 (Core Features) — Rating: 8/10
**Strengths**:
- Extends DB schema with session_recordings table
- Builds the core Pressure Sparring Session screen
- Integrates AssemblyAI streaming + GPT-4o interruption engine
- Post-session analytics with Victory Native charts

**Issues**:
- Complex real-time audio + AI pipeline described in a single prompt
- WebSocket + Supabase Realtime integration is underspecified for error recovery

### EP3 (Polish & Production) — Rating: 7/10
**Strengths**:
- Covers remaining screens, payments (RevenueCat), notifications
- Production readiness checklist
- App Store submission guidance

**Issues**:
- Achievement system adds scope creep
- Some sections feel less detailed than EP1/EP2

### EP Technology Currency (15 PASS, 2 FAIL)

**PASS (15):**
- Supabase (auth, postgres, edge functions, storage, realtime) — all actively maintained
- AssemblyAI — actively maintained, 300ms P50 latency, Universal-Streaming API
- ElevenLabs TTS — actively maintained, official React Native SDK, 75ms latency with Flash v2.5
- RevenueCat — v9.7.6 (Feb 2026), full Expo support, now supports web too
- Sentry — v8.2.0 (Feb 2026), comprehensive Expo support
- PostHog — v4.36.1 (Feb 2026), auto-capture + session replay
- Vercel AI SDK — AI SDK 5, official Expo Getting Started guide
- Claude API — Opus 4.6 / Sonnet 4.6, 1M token context
- EAS Build — Expo SDK 55 (Feb 2026), React Native 0.83
- expo-updates — Hermes bytecode diffing for smaller updates
- expo-notifications — part of SDK 55 (breaking: must use config plugin now)

**FAIL (2) — Knowledge base updated:**
- **OpenAI GPT-4o** → DEPRECATED. Being phased out, pricing now HIGHER than GPT-5.1. KB updated to reference GPT-5.1/5.2.
- **OpenAI Whisper** → SUPERSEDED. `gpt-4o-mini-transcribe` is 50% cheaper ($0.003/min vs $0.006/min), more accurate (8.9% vs 10.6% WER), and supports real-time streaming. KB updated.

---

## Overall Scores

| Component | Score | Notes |
|-----------|-------|-------|
| Step 1 (AI Expectations) | 5/10 | Good structure, wrong competitor references |
| Step 2 (Strategic Planning) | 9/10 | Outstanding personas and positioning |
| Step 3 (AI Approach) | 8/10 | Correct tech choices for speech coaching |
| Step 4 (Dev Plan) | 7/10 | Good features, wrong scale for solo builder |
| Step 5 (Tech Selection) | 8/10 | Solid KB selections, good screen mapping |
| PRD | 3/10 | Half missing (Part A failed), Part B sections are good |
| Visual Strategy | 6.5/10 | Great strategy sections, bad financial math |
| EP1 | 8/10 | Highly actionable, appropriate detail level |
| EP2 | 8/10 | Core features well-specified |
| EP3 | 7/10 | Good but some scope creep |
| Tech Architecture | N/A | Not generated |

---

## Fixes Applied

| Issue | Fix | File |
|-------|-----|------|
| P0-01: PRD half-document | Added retry + warning for failed parts | `architect.ts` |
| P0-01: VS half-document | Added retry + warning for failed parts | `architect.ts` |
| P0-02: Tech Arch doc missing | Added retry on failure | `architect.ts` |
| P1-01: Wrong competitors | Fixed via Scout relevance filtering | `scout.ts` |
| P1-02: Unrealistic projections | Added solo builder constraints to VS A+B | `architect-prompts.ts` |
| P1-06: Solo builder scale | Added solo builder context to Step 4 + Scout prompts | `architect-prompts.ts`, `scout-prompts.ts` |
| TECH: GPT-4o deprecated | Updated KB to GPT-5.1/5.2 with deprecation warning | `seed-technologies.ts` |
| TECH: Whisper superseded | Updated KB to gpt-4o-mini-transcribe ($0.003/min) | `seed-technologies.ts` |

## Fixes Still Needed

| Issue | Priority | File |
|-------|----------|------|
| P1-04: Free tier inconsistency | P2 | `architect-prompts.ts` (pass Step 2 definition downstream) |
