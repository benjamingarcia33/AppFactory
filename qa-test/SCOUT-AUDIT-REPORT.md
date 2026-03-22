# Scout Pipeline QA Audit Report
**Test Case**: Cognitize — speech coaching app
**Mode**: Synthesis, App Store
**Date**: 2026-03-08
**scanId**: fceeb718-5c98-4761-b59a-4f7d7f1fc08b

---

## Executive Summary

The Scout pipeline completed without errors and produced a master idea, gap analysis, and 11 opportunities. The **master idea quality is surprisingly good** — well-grounded, realistic, and actionable. However, there are **serious issues with competitor relevance** (only 4 of 11 apps are speech-related) and **scoring accuracy** (7 of 11 have zero metadata).

---

## 1. Competitor Relevance Audit

### Relevance Ratings (1-5 scale)

| # | App | Relevance | Reason |
|---|-----|-----------|--------|
| 1 | Otsimo - Speech Therapy SLP | 3/5 | Speech therapy (kids), not coaching. Adjacent but different market. |
| 2 | Vocal Image: AI Speaking Coach | 5/5 | **Direct competitor** — AI speaking coach |
| 3 | Credible: Speech Coach | 5/5 | **Direct competitor** — speech coaching app |
| 4 | Public Speaking with AJ | 4/5 | Public speaking focused, but relaxation-based approach |
| 5 | Babbel - Language Learning | 1/5 | **IRRELEVANT** — Language learning, not speech coaching |
| 6 | LangLearn: AI English Tutor | 2/5 | Language learning with some speaking features |
| 7 | HelloTalk - Language Learning | 1/5 | **IRRELEVANT** — Language exchange platform |
| 8 | IXL - Math, English, & More | 1/5 | **IRRELEVANT** — Math/English education for kids |
| 9 | Gibson: Learn to Play Guitar | 1/5 | **IRRELEVANT** — Guitar learning app |
| 10 | memoryOS - Improve Memory | 1/5 | **IRRELEVANT** — Memory training app |
| 11 | EWA English Language Learning | 1/5 | **IRRELEVANT** — Language learning app |

### Verdict: FAIL
- Only **4 of 11** apps (36%) are relevant to speech coaching
- **7 apps are completely unrelated** (guitar, memory, math, language learning)
- The synthesis mode is pulling in broad "Education" category apps instead of focusing on the speech coaching niche

### Root Cause Analysis
The search queries were good ("speech coaching app", "Orai speech coach", "Speeko public speaking") but the App Store scraper returned broad Education category results that diluted the pool. The pipeline's filtering/ranking step didn't remove irrelevant apps before sentiment analysis.

---

## 2. Missing Competitors (CRITICAL)

These established speech coaching apps were NOT found by the Scout:

| App | Why It Matters |
|-----|---------------|
| **Orai** | #1 AI speech coaching app, direct competitor. Searched for by name but not found. |
| **Speeko** | Major public speaking coach app, searched for by name but not found. |
| **Yoodli** | AI speech coach endorsed by Toastmasters. Very relevant. |
| **Ummo** | Dedicated filler word tracker — directly adjacent. |
| **LikeSo** | Verbal fitness app, directly relevant. |
| **VirtualSpeech** | VR public speaking practice, different approach but same market. |
| **BoldVoice** | Pronunciation/speaking coach. |

### Verdict: FAIL
The Scout missed ALL major direct competitors. This is a critical gap — the gap analysis and master idea are built on comparisons against irrelevant apps rather than actual competitors.

---

## 3. Scoring Accuracy Audit

### Market Size Scores
All 11 apps have **marketSize = 14**. This is because:
- App Store doesn't expose install counts (all show "N/A")
- The scoring formula falls back to ratings-only weighting
- Most of these apps have <300 ratings, yielding the minimum tier

**Issue**: No differentiation between a 234-rating app (Credible) and a 5-rating app (Public Speaking with AJ). Both get marketSize=14.

### Dissatisfaction Scores
- 8 of 11 apps show **dissatisfaction = 25** (the default for score=0 apps)
- Only 3 have real scores: Otsimo (41), Credible (15), Vocal Image (12)

**Issue**: The enrichment step failed for 7 apps — they have score=0 and ratings=0 despite being real apps with real ratings.

### Feasibility Scores
- Range from 35-72 across all apps
- The AI-estimated feasibility seems reasonable where data exists

### Composite Scores
- Range: 25-36 across all 11 apps
- Very little differentiation — only 11 points separate best from worst
- This makes the "top opportunities" list essentially meaningless

### Verdict: FAIL
Scoring is unreliable due to:
1. App Store metadata enrichment failing for 7/11 apps
2. All marketSize scores being identical (14)
3. Default dissatisfaction (25) masking real differences

---

## 4. Master Idea Quality Audit

Despite the competitor issues, the master idea is **surprisingly strong**:

### Strengths (PASS)
- **Name & tagline**: "Cognitize" with "Real conversational pressure. Real speaking growth. No fluff, no paywalls." — clear, compelling
- **Core features** (8): All grounded in real pain points, even if sourced from irrelevant apps. The pattern recognition (paywall issues, billing fraud, progress reset) transfers across app categories.
- **Pricing**: Realistic — $7.99/mo, $49.99/yr, $79.99 lifetime. Perfect for solo builder audience.
- **Cost estimate**: $800-$3,000 for MVP — accurate and realistic
- **AI Recommendation**: Honest "maybe" verdict with specific warnings about latency and user acquisition
- **Go/No-Go factors**: 6 factors, all specific and actionable (3 go, 3 caution)
- **Target audience**: Specific (professionals, job seekers, students, 18-40)
- **Unique value props**: 5 genuinely differentiated props

### Issues (WARN)
- **Competitor flaws cite irrelevant apps**: Gibson (guitar), memoryOS (memory), IXL (math) are listed as competitors with flaws. While the flaw patterns (paywall, billing) are real, citing a guitar app as a competitor undermines credibility.
- **Missing direct competitor analysis**: No analysis of Orai, Speeko, or Yoodli means the differentiation claims are untested against actual competitors.
- **Market viability score**: 58/100 is reasonable but based on incomplete competitor landscape.
- **Confidence score**: 62/100 — appropriate given data quality.

### Verdict: WARN (Good quality but built on weak competitor data)

---

## 5. Gap Analysis Quality Audit

The gap analysis compares Cognitize against all 11 competitors:
- **Otsimo** (gapScore: 78) — relevant comparison, real pain points
- **Vocal Image** (relevant) — good analysis of billing/trust issues
- **Credible** (relevant) — good analysis of paywall issues
- **Irrelevant apps** — the gap analysis generates plausible-sounding but meaningless comparisons with guitar and memory apps

### Verdict: PARTIAL PASS
Relevant competitor comparisons are strong. Irrelevant app comparisons pollute the analysis.

---

## 6. Overall Quality Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| **Accuracy** | FAIL | 7/11 competitors irrelevant, all major competitors missed |
| **Clarity** | PASS | All output is clear, jargon-free, well-structured |
| **Value** | WARN | Good insights despite bad data, but missing real competitors hurts |
| **Realistic Pricing** | PASS | $800-$3K MVP, $7.99/mo subscription — perfect for target audience |
| **Usefulness** | WARN | Solo builder could act on this, but would miss competitive threats |
| **Scoring** | FAIL | No differentiation, enrichment failures |

---

## Issues to Fix (Priority Order)

### P1 — Competitor Relevance Filtering
**Problem**: The synthesis pipeline doesn't filter out irrelevant apps before running expensive sentiment analysis.
**Fix location**: `src/lib/agents/scout.ts` — add relevance scoring step after scraping and before sentiment analysis. Use a lightweight AI call to rate relevance to the original idea.
**Impact**: Would reduce from 7 irrelevant apps to 0-1.

### P1 — Missing Competitor Discovery
**Problem**: Direct competitors (Orai, Speeko, Yoodli) not found despite being searched by name.
**Fix location**: `src/lib/scraper/app-store.ts` — investigate why `searchByQuery("Orai speech coach")` returned no results. May need to try multiple query variations or use the SerpAPI fallback.
**Impact**: Would surface the actual competitive landscape.

### P1 — App Store Metadata Enrichment Failures
**Problem**: 7 of 11 apps have score=0, ratings=0 despite being real apps.
**Fix location**: `src/lib/scraper/app-store.ts` — the `enrichAppMetadata()` function is failing silently for some apps. Need to add retry logic or use alternative data source.
**Impact**: Would fix scoring for all enriched apps.

### P2 — Market Size Scoring for App Store
**Problem**: All apps get marketSize=14 because App Store doesn't expose installs.
**Fix location**: `src/lib/agents/scout.ts` — when store is App Store, weight ratings more heavily and use larger rating tiers (100 ratings = moderate market, 1000 = large).
**Impact**: Would differentiate between small and popular apps.

### P3 — Irrelevant App Labeling in Master Idea
**Problem**: Master idea cites guitar and memory apps as competitors.
**Fix location**: `src/lib/ai/scout-prompts.ts` — add instruction to only reference apps directly relevant to the user's idea in the master idea synthesis prompt.
**Impact**: More credible master idea output.
