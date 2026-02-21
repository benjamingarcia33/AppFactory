# AppFoundry - Mobile App Foundry Implementation Plan

## Context

**Problem**: Moving from "market signal" to "production-ready app blueprint" takes too long. We need infrastructure that autonomously discovers app opportunities and architects them.

**Solution**: A Next.js web app with two AI-powered agents:
- **Scout Agent** (Page 1): Scrapes app stores via SerpAPI, finds high-download/low-rating apps, analyzes review sentiment with AI to identify market gaps
- **Architect Agent** (Page 2): Takes a selected opportunity through a 4-step AI analysis pipeline, producing two documents: (1) App PRD ready for Claude Code, (2) Strategic Analysis document

**Outcome**: User picks a category, Scout finds opportunities, user selects one, Architect generates a complete blueprint - all in under 60 minutes.

---

## Architecture Overview

```
Next.js 15 (App Router) + Tailwind + shadcn/ui
├── SerpAPI for App Store + Google Play data
├── OpenRouter + Vercel AI SDK for Claude AI calls
├── SQLite (Drizzle ORM) for local persistence
├── SSE streaming for real-time agent progress
└── Simple prompt chaining (no heavy agent frameworks)
```

**Key Decisions**:
- **OpenRouter** (`@openrouter/ai-sdk-provider`) as LLM provider - uses user's existing API key, accesses Claude models via `anthropic/claude-sonnet-4`
- **SerpAPI** (`serpapi` npm package) for reliable app store data - endpoints: `google_play` (top charts), `google_play_product` (details+reviews), `apple_app_store` (search), `apple_reviews` (reviews)
- **SQLite + Drizzle** for local-first storage - can migrate to Turso/Postgres later for cloud deployment
- **Prompt chaining** over LangGraph/CrewAI - follows Anthropic's guidance: simple sequential prompts > complex orchestration

---

## Tech Stack

| Layer | Technology | Package |
|-------|-----------|---------|
| Framework | Next.js 15 App Router | `next@^15.3` |
| UI | Tailwind CSS 4 + shadcn/ui | `tailwindcss@^4`, `@radix-ui/*` |
| AI Provider | OpenRouter (Claude models) | `@openrouter/ai-sdk-provider`, `ai@^6.0` |
| Data Source | SerpAPI | `serpapi` |
| Database | SQLite + Drizzle ORM | `better-sqlite3`, `drizzle-orm` |
| Markdown Rendering | react-markdown | `react-markdown` |
| Streaming | SSE via Route Handlers | Native Next.js |

---

## Project Structure

```
C:\AppFactory\
├── .env.local                         # OPENROUTER_API_KEY, SERPAPI_API_KEY
├── package.json
├── next.config.ts
├── drizzle.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout + nav
│   │   ├── page.tsx                   # Redirect to /scout
│   │   ├── globals.css
│   │   ├── scout/page.tsx             # PAGE 1: Scout Dashboard
│   │   ├── architect/page.tsx         # PAGE 2: Architect Blueprint
│   │   └── api/
│   │       ├── scout/stream/route.ts      # SSE endpoint for scout
│   │       └── architect/stream/route.ts  # SSE endpoint for architect
│   ├── lib/
│   │   ├── types.ts                   # SHARED types (contract between agents)
│   │   ├── db/
│   │   │   ├── index.ts               # DB connection
│   │   │   └── schema.ts             # Table definitions
│   │   ├── scraper/
│   │   │   ├── google-play.ts         # SerpAPI Google Play wrapper
│   │   │   ├── app-store.ts           # SerpAPI App Store wrapper
│   │   │   └── index.ts              # Unified scraper interface
│   │   ├── ai/
│   │   │   ├── client.ts              # OpenRouter provider setup
│   │   │   ├── scout-prompts.ts       # Scout AI prompts + functions
│   │   │   └── architect-prompts.ts   # Architect AI prompts (6 prompt builders)
│   │   └── agents/
│   │       ├── scout.ts               # Scout pipeline orchestrator
│   │       └── architect.ts           # Architect pipeline orchestrator
│   ├── actions/
│   │   ├── scout-actions.ts           # Server Actions: getScans, getOpportunities
│   │   └── architect-actions.ts       # Server Actions: getAnalysis, getDocuments
│   └── components/
│       ├── ui/                        # shadcn primitives (auto-generated)
│       ├── layout/
│       │   ├── nav-bar.tsx
│       │   └── page-header.tsx
│       ├── scout/
│       │   ├── scan-controls.tsx      # Store/category selector + run button
│       │   ├── scan-progress.tsx      # SSE-connected progress bar
│       │   ├── opportunity-card.tsx   # Single opportunity display
│       │   ├── opportunity-grid.tsx   # Grid of cards with sorting
│       │   ├── review-sentiment.tsx   # Sentiment breakdown
│       │   └── opportunity-detail-modal.tsx
│       └── architect/
│           ├── opportunity-selector.tsx     # Pick opportunity dropdown
│           ├── analysis-progress.tsx        # 4-step progress tracker
│           ├── analysis-step-card.tsx       # Individual step display
│           ├── document-viewer.tsx          # Markdown renderer
│           └── document-tabs.tsx            # PRD / Strategy tabs
└── data/
    └── appfoundry.db                  # SQLite database (runtime)
```

---

## Data Flow

```
USER: Selects category + store
  │
  ▼
SCOUT PIPELINE (SSE streaming progress):
  1. SerpAPI: Fetch top charts (google_play engine, chart=topselling_free)
  2. SerpAPI: Fetch details for each app (google_play_product engine)
  3. Filter: minInstalls >= 100k AND rating < 4.0
  4. SerpAPI: Fetch 50 reviews per filtered app (apple_reviews / google_play_product)
  5. AI (Claude via OpenRouter): Analyze sentiment → painPoints, featureRequests
  6. AI (Claude): Score feasibility
  7. Calculate composite score → Store in SQLite
  │
  ▼
USER: Sees opportunity cards, clicks "Analyze" on one
  │
  ▼
ARCHITECT PIPELINE (SSE streaming progress):
  Step 1: AI Expectations (what users expect from AI alternative)
  Step 2: Strategic Business Planning (personas, positioning, revenue)
  Step 3: AI Approach (models, data strategy, architecture)
  Step 4: Development & Tinkering (MVP scope, tech stack, timeline)
  │
  ▼
DOCUMENT GENERATION (Claude via OpenRouter):
  Doc 1: App PRD (product spec for Claude Code input)
  Doc 2: Strategic Analysis (business case + 4-step reasoning)
  │
  ▼
USER: Views/copies documents, feeds PRD into Claude Code
```

---

## Integration Contract (Scout → Architect)

The `Opportunity` type in `src/lib/types.ts` is the single contract between agents. Team 2 calls `getOpportunityById(id)` from `src/actions/scout-actions.ts` and receives:

```typescript
interface Opportunity {
  id: string;
  scrapedApp: ScrapedApp;       // title, store, genre, score, ratings, installs, description, icon, url
  reviews: ScrapedReview[];      // 20-50 reviews with text + score
  sentiment: SentimentAnalysis;  // overallSentiment, painPoints[], featureRequests[], praisedAspects[]
  score: OpportunityScore;       // marketSize, dissatisfaction, feasibility, composite (all 0-100)
  scanId: string;
  createdAt: string;
}
```

**Rules**: Team 2 never imports from `src/lib/scraper/` or `src/lib/ai/scout-prompts.ts`. All data comes through server actions.

---

## Database Schema (SQLite via Drizzle)

4 tables: `scans`, `opportunities`, `analyses`, `documents`

- `scans`: id, store, category, status, totalAppsScraped, totalOpportunities, timestamps
- `opportunities`: id, scanId (FK), all ScrapedApp fields flattened, sentimentJson (TEXT), reviewsJson (TEXT), 4 score columns, createdAt
- `analyses`: id, opportunityId (FK), status, stepsJson (TEXT with 4-step content), timestamps
- `documents`: id, analysisId (FK), type ("app_prd"|"strategic_analysis"), title, content (markdown), createdAt

---

## AI Configuration

```typescript
// src/lib/ai/client.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Usage:
// streamText({ model: openrouter('anthropic/claude-sonnet-4'), prompt: '...' })
```

**Model choices**:
- Sentiment analysis: `anthropic/claude-sonnet-4` (fast, cost-effective)
- Architect 4-step analysis: `anthropic/claude-sonnet-4` (good reasoning)
- Document generation: `anthropic/claude-sonnet-4` (structured output)

---

## Three Agent Teams

### Team 1: Scout Agent Builder
**Scope**: Project scaffolding + scraping service + Scout AI pipeline + Scout UI (Page 1)

**Tasks (in order)**:
1. **Scaffold**: `npx create-next-app@latest`, install all deps, init shadcn/ui
2. **Shared foundation**: Create `src/lib/types.ts`, `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `src/lib/ai/client.ts`
3. **Config files**: `drizzle.config.ts`, `next.config.ts` (serverExternalPackages for better-sqlite3, image domains), `.env.local`
4. **Layout + Nav**: `src/app/layout.tsx`, `src/components/layout/nav-bar.tsx`, `src/components/layout/page-header.tsx`
5. **SerpAPI scrapers**: `src/lib/scraper/google-play.ts`, `src/lib/scraper/app-store.ts`, `src/lib/scraper/index.ts`
6. **Scout AI**: `src/lib/ai/scout-prompts.ts` (analyzeSentiment, estimateFeasibility functions)
7. **Scout pipeline**: `src/lib/agents/scout.ts` (scrape → filter → analyze → score → store)
8. **Scout SSE**: `src/app/api/scout/stream/route.ts`
9. **Scout server actions**: `src/actions/scout-actions.ts` (getScans, getOpportunitiesByScan, getOpportunityById, getAllOpportunities)
10. **Scout UI components**: scan-controls, scan-progress, opportunity-card, opportunity-grid, review-sentiment, opportunity-detail-modal
11. **Scout page**: `src/app/scout/page.tsx`
12. **Root page**: `src/app/page.tsx` (redirect to /scout)

**Key output for Team 2**: Tasks 2-3 (foundation) and Task 9 (server actions with `getOpportunityById`)

### Team 2: Architect Agent Builder
**Scope**: Architect AI pipeline + Document generation + Architect UI (Page 2)

**Blocked by**: Team 1 tasks 1-4, 9 (foundation + scout server actions)

**Tasks (in order)**:
1. **Architect prompts**: `src/lib/ai/architect-prompts.ts` (6 prompt builders: aiExpectations, strategicPlanning, aiApproach, devTinkering, prdDoc, strategyDoc)
2. **Architect pipeline**: `src/lib/agents/architect.ts` (sequential 4-step chained prompts + 2 document generators)
3. **Architect SSE**: `src/app/api/architect/stream/route.ts`
4. **Architect server actions**: `src/actions/architect-actions.ts` (getAnalysisByOpportunity, getDocumentsByAnalysis)
5. **Architect UI components**: opportunity-selector, analysis-step-card, analysis-progress, document-viewer, document-tabs
6. **Architect page**: `src/app/architect/page.tsx`

### Team 3: Reviewer
**Scope**: Integration validation + E2E testing + code quality

**Begins after**: Team 1 completes scrapers (task 5), Team 2 completes pipeline (task 2)

**Tasks**:
1. **Type safety audit**: Verify `types.ts` used consistently, no untyped JSON parses
2. **DB schema validation**: Verify schema matches types, test INSERT/SELECT round-trips
3. **SerpAPI integration test**: Test one category scrape, verify response mapping
4. **Integration contract test**: Verify `getOpportunityById()` returns correct `Opportunity` shape for architect pipeline
5. **Scout E2E**: Full scrape → filter → analyze → display flow
6. **Architect E2E**: Full 4-step analysis → 2 documents generated
7. **SSE validation**: Both streams send correct events, progress is monotonic
8. **Cross-page flow**: Scout scan → click Analyze → Architect loads → analysis runs → documents display
9. **Error handling**: Missing API keys, SerpAPI failures, AI errors, DB errors
10. **Fix all issues found**

---

## Execution Sequence

```
Team 1 [Scaffold + Foundation]  ████████░░░░░░░░░░░░░░░░░░░░░░░░
Team 1 [Scrapers + AI Pipeline] ░░░░░░░░████████░░░░░░░░░░░░░░░░
Team 1 [Scout UI]               ░░░░░░░░░░░░░░░░████████░░░░░░░░

Team 2 [Architect AI Pipeline]  ░░░░░░░░████████████████░░░░░░░░  (starts after T1 foundation)
Team 2 [Architect UI]           ░░░░░░░░░░░░░░░░░░░░░░░░████████

Team 3 [Incremental Review]     ░░░░░░░░░░░░░░░░██░░░░██░░██████  (reviews as pieces complete)
```

**Sync points**:
1. Team 1 publishes `types.ts` + `schema.ts` + `db/index.ts` + `ai/client.ts` → **Team 2 starts**
2. Team 1 publishes `scout-actions.ts` → **Team 2 unblocked for SSE route**
3. Both teams complete → **Team 3 does full E2E review**

---

## Environment Variables

```env
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
SERPAPI_API_KEY=xxxxxxxxxxxxx
```

---

## Verification Plan

1. **Smoke test**: `npm run dev` → navigate to `localhost:3000/scout` → page loads with controls
2. **Scout test**: Select "Google Play > Tools" → Start Scan → verify progress bar streams → opportunities appear as cards
3. **Data check**: Open `data/appfoundry.db` with any SQLite viewer → verify `scans` and `opportunities` tables populated
4. **Architect test**: Click "Analyze" on an opportunity card → navigate to `/architect` → verify 4-step progress streams → two documents render
5. **Document quality**: Read generated PRD → verify it describes the app end-to-end with features, UX flows, and technical requirements (but NOT specific file structures)
6. **Strategic doc check**: Read Strategic Analysis → verify it contains AI expectations, business planning, AI approach, and development strategy sections
7. **Copy test**: Copy PRD content → paste into a new Claude Code session → verify it's actionable as a starting point

---

## Critical Files (Must-Read Before Implementation)

| File | Purpose | Owner |
|------|---------|-------|
| `src/lib/types.ts` | Single source of truth for all TypeScript interfaces | Team 1 creates, both use |
| `src/lib/db/schema.ts` | Database table definitions | Team 1 |
| `src/lib/agents/scout.ts` | Scout pipeline orchestration | Team 1 |
| `src/lib/agents/architect.ts` | Architect pipeline orchestration | Team 2 |
| `src/actions/scout-actions.ts` | Integration bridge (getOpportunityById) | Team 1 creates, Team 2 consumes |
| `src/lib/ai/architect-prompts.ts` | 6 prompt builders for architect analysis | Team 2 |
| `src/lib/ai/client.ts` | OpenRouter provider config | Team 1 creates, both use |
