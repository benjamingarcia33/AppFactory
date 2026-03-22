# Scout Pipeline QA Audit — Cognitize Speech Coaching App

## Test Parameters
- **Mode**: synthesis
- **Store**: App Store
- **Idea**: "Cognitize — a speech coaching app that helps users improve their speaking by interrupting them, applying pressure questions, and simulating real conversational pressure"
- **Scan ID**: 17bd6049-d15a-452e-9568-66baed301f8c
- **Duration**: ~6.5 minutes (20:31:14 → 20:37:44 UTC)
- **Apps scraped**: 516
- **Opportunities found**: 11

---

## P0 Issues (Pipeline Crashes or Wrong DB Writes)

None found. Pipeline completed without crashes, all data written correctly.

---

## P1 Issues (Factually Wrong or Misleading Output)

### P1-1: CATASTROPHIC — 10 of 11 "Competitors" Are Irrelevant

Only **1 of 11** apps found is even tangentially relevant to speech coaching:

| App | Relevant? | Actual Category |
|-----|-----------|-----------------|
| Public Speaking S Video Audio | Partially | Teleprompter/speech recording |
| Langua: AI language learning | NO | Language learning |
| Speak: Language Learning | NO | Language learning |
| Babbel - Language Learning | NO | Language learning |
| LangLearn: AI English Tutor | NO | Language learning |
| IXL - Math, English, & More | NO | K-12 education (math!) |
| memoryOS | NO | Memory training |
| Gibson: Learn to Play Guitar | NO | Guitar learning |
| FreshBooks Invoicing App | NO | Accounting/invoicing |
| Google Classroom | NO | Classroom management |
| Language Learning: Pingo AI | NO | Language learning |

**The AI itself acknowledged this**: "The competitor dataset here is mostly language learning apps, not direct speech coaching competitors"

**Root causes**:
1. Search queries returned language learning apps (they match "speaking" keyword)
2. Category 6000 (Business) is too broad — returns accounting, CRM, invoicing apps
3. Apps from search queries bypass all relevance filtering (code bug at line 989-996)
4. `calculateIdeaRelevanceBonus()` is naive keyword matching — "speaking" in a language app description gives false positive
5. No genre-level or semantic relevance filtering exists anywhere in the pipeline

**Fix location**: `src/lib/agents/scout.ts` (relevance filtering), `src/lib/ai/scout-prompts.ts` (search strategy)

### P1-2: ALL Major Real Competitors Missing

These actual speech coaching apps were completely missed:

| App | iOS ID | Rating | Status |
|-----|--------|--------|--------|
| **Speeko** | 1071468459 | 4.7★ | Most established mobile speech coach |
| **Orai** | 1203178170 | 4.5★ | Strong brand, AI-powered feedback |
| **LikeSo** | 1074943747 | Active | Speech fitness / filler word tracking |
| **Credible** | 6470220669 | 25K+ downloads | Real-time filler word detection |
| **BoldVoice** | 1567841142 | 4.8★, 38-70K ratings | Pronunciation/accent training |
| **VirtualSpeech** | Available | 370K+ users | VR-based public speaking practice |
| **SpeakUp** | 6740540874 | Active | AI speech analysis, body language |

**Fix location**: `src/lib/agents/scout.ts` (search query strategy needs speech-specific terms), `src/lib/ai/scout-prompts.ts` (prompt should emphasize finding DIRECT competitors, not adjacent category apps)

### P1-3: Rating/Install Data Broken for App Store

10 of 11 apps show **0 stars and 0 ratings**. Only "Public Speaking S Video Audio" has data (1.67★).

**Root cause**: App Store scraper (`src/lib/scraper/app-store.ts`) returns `score: 0, ratings: 0` for apps where the store API doesn't expose this data, or the scraper isn't parsing it correctly.

**Impact**: Cascading — makes dissatisfaction calculation meaningless (all get 50.0 default), composite scores nearly identical (46.0 for 9 apps), and rankings arbitrary.

**Fix location**: `src/lib/scraper/app-store.ts`

### P1-4: Cost Estimate Wildly Wrong for Solo Builder

- Master idea says: "$150,000–$350,000 MVP" and "4-6 people team"
- Target audience is a solo builder with limited budget ($500-$5K MVP)
- This is off by 30-70x

**Fix location**: `src/lib/ai/scout-prompts.ts` (master idea prompt should explicitly target solo builder/indie dev scope)

---

## P2 Issues (Correct but Low-Value or Generic)

### P2-1: Dissatisfaction Score Default Too High

Apps with `score === 0` (unknown rating) get dissatisfaction=50, same as a legitimate 3.0★ app. Since dissatisfaction carries 40% weight in composite score, this inflates rankings of unrated apps.

**Formula**: `if (score <= 0) return 50;`
**Fix**: Should return 25 or lower, or weight down unrated apps separately.
**Fix location**: `src/lib/agents/scout.ts` line ~104

### P2-2: Blue Ocean Not Triggered

Blue ocean detection requires <3 competitors. With 11 (even irrelevant) opportunities, it wasn't triggered. The blue ocean check doesn't consider relevance — it just counts results.

**Fix location**: `src/lib/agents/scout.ts` (should count only relevant competitors)

### P2-3: Pricing Slightly Aggressive

$19.99/month and $149/year is on the high end for a new, unproven app. More realistic for solo builder would be $5-$15/month.

**Fix location**: `src/lib/ai/scout-prompts.ts` (master idea prompt revenue model guidance)

### P2-4: Gap Analysis References Irrelevant Apps

The gap analysis includes comparisons to FreshBooks (gap score 60), Gibson Guitar (65), and Google Classroom (68) — completely useless for a speech coaching competitive analysis.

**Fix location**: Upstream — fix P1-1 (relevance filtering) and gap analysis will improve automatically.

---

## P3 Issues (Cosmetic/Minor)

### P3-1: Search Strategy Had Good Queries

The 15 search queries were actually well-chosen: "speech coaching app", "public speaking practice", "debate practice app", "toastmasters alternative app", etc. The problem is not query generation but what happens to the results.

### P3-2: Master Idea Quality Actually Good (Given Bad Input)

Despite terrible competitor data, the master idea:
- Has 8 well-structured core features
- Each feature cites evidence from competitor flaws
- Unique value props are genuinely differentiated
- Target audience is specific
- AI recommendation has thoughtful warnings
- Self-identifies the competitor data problem

The master idea generation prompt is doing good work — it's the upstream competitor data that's failing.

---

## Scoring Formula Summary

| Formula | Weights | Issue |
|---------|---------|-------|
| Pre-score | market×0.4 + dissatisfaction×0.6 | Dissatisfaction dominates; 0-rated apps get inflated 50 |
| Composite | market×0.3 + dissatisfaction×0.4 + feasibility×0.3 | Same dissatisfaction inflation |
| Synthesis ranking | preScore×0.5 + relevance×0.5 | Relevance function is naive keyword matching |
| Market size (App Store) | installs×0.2 + ratings×0.8 | Reasonable weighting but data is 0 for most apps |

---

## Recommended Fixes Priority

1. **P1-1/P1-2**: Add AI-based semantic relevance filtering (send top candidates through a quick AI call to classify relevance 0-100)
2. **P1-1**: Fix search-sourced apps bypassing relevance pre-filter (line 989-996 bug)
3. **P1-3**: Debug App Store scraper — ratings returning 0 for known apps
4. **P1-4**: Add solo builder context to master idea prompt
5. **P2-1**: Lower dissatisfaction default for unknown ratings
6. **P2-2**: Count only relevant competitors for blue ocean trigger
