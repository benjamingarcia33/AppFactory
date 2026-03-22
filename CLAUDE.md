# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on localhost:3000 (uses --webpack flag)
npm run build        # Production build
npm run lint         # ESLint (v9, Next.js + TypeScript rules)
npm run db:push      # Push Drizzle schema to PostgreSQL (Supabase)
npm run db:seed      # Seed knowledge base (npx tsx scripts/seed.ts)
```

No test framework is configured. Validation is manual.

## Environment

Requires `.env.local` with:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `OPENROUTER_API_KEY` — OpenRouter API key (validated ≥20 chars, not placeholder)

## Architecture

**AppFactory** is a Next.js 16 app with two AI agents that take a user from "I have an app idea" to "I have a production-ready blueprint."

### Two-Agent Pipeline

**Scout** (`src/lib/agents/scout.ts`) discovers app opportunities:
- Four modes: category, idea, synthesis (default), discovery
- Scrapes Google Play + App Store → deduplicates → batch sentiment analysis (Haiku) → feasibility scoring → gap analysis → master idea synthesis
- Uses SerpAPI as metadata fallback; AI relevance filter (Haiku) before sentiment

**Architect** (`src/lib/agents/architect.ts`) produces production documents:
1. **5 sequential structured steps** (Zod-validated via `generateObject`):
   - Steps 1-4: Sonnet, 8192 tokens, 180s timeout
   - Step 5: Opus, 8192 tokens, 180s timeout — queries knowledge base (technologies, screen patterns, synergies) to select tech stack + map screens
2. **Batch 1 — parallel doc generation** (Sonnet, 480s timeout): PRD Part A/B, Visual Strategy Part A/B, Technical Architecture
3. **Batch 2 — parallel EP generation** (Opus, 480s timeout): 3 page-by-page Execution Prompts (decoupled via `buildEPCrossReference()` ~200-token summary)

### AI Integration (`src/lib/ai/client.ts`)

All AI calls go through OpenRouter, not Anthropic directly. Four model tiers:
- `SCOUT_MODEL` / `ARCHITECT_FAST_MODEL` = `anthropic/claude-sonnet-4.6`
- `ARCHITECT_MODEL` = `anthropic/claude-opus-4.6`
- `SENTIMENT_MODEL` = `anthropic/claude-haiku-4-5`

**Critical pattern for structured output**: `generateObject()` via OpenRouter does NOT enforce Zod field names. The working solution is: call `generateObject()` → on validation error, extract raw JSON from `error.cause.value` (`NoObjectGeneratedError.cause` = `AI_TypeValidationError { value: ... }`). This works because downstream code just `JSON.stringify`'s the data.

Key functions: `callAIWithRetry()` (retry with rate-limit backoff), `callAIStructured()` (generateObject + error recovery), `repairJsonText()` (fix truncated JSON), `cancellableDelay()`, `withTimeout()`.

### Streaming

Both agents stream progress via SSE:
- Scout: `GET /api/scout/stream` — 10min timeout
- Architect: `GET /api/architect/stream` — 45min timeout (doc generation is slow)
- Cancel: `POST /api/{agent}/cancel`
- Cancellation uses `Map<id, AbortController>` tracked per pipeline

### Database

PostgreSQL (Supabase) via Drizzle ORM. Connection uses `prepare: false` (required for Supabase pooler). 8 tables defined in `src/lib/db/schema.ts`:
- `scans`, `opportunities` — Scout results
- `analyses`, `documents`, `executionPrompts` — Architect outputs
- `technologies` (47 entries), `screenPatterns` (15), `techSynergies` (33) — Knowledge base (seeded from `src/lib/db/seed-*.ts`)

Steps and JSON results are stored as serialized JSON strings in text columns.

### Server Actions (`src/actions/`)

- `scout-actions.ts` — getScans, getOpportunitiesByScan, getOpportunityById, getScanById
- `architect-actions.ts` — getAllAnalysesWithContext, getDocumentsByAnalysis, getAnalysisProgress, cleanupStaleAnalyses
- `knowledge-actions.ts` — getTechnologyCatalog, getScreenPatternCatalog, getTechSynergiesForSlugs, getSelectedTechFragments

### Prompt Engineering (`src/lib/ai/architect-prompts.ts`)

This is the largest file (~83KB). Contains:
- 5 Zod schemas for structured steps (`aiExpectationsSchema` through `techSelectionSchema`)
- VS schemas (`visualStrategySchemaA/B`)
- Builder functions for all documents (PRD A/B, VS A/B, TechArch, EP1/2/3, CLAUDE.md, MCP JSON)
- Financial consistency via `checkVSConsistency()` (clamps MRR ≤$8K, users ≤5K, YoY ≤80%)
- Pricing/timeline anchors locked from earlier steps to prevent drift
- `CURRENT_TECH_VERSIONS` constant injected into prompts
- `stripCodeBlocks()` post-processing for EPs

### UI

- shadcn/ui (Radix + Tailwind CSS v4, New York style)
- Recharts for data visualization (revenue, market, timeline)
- Path alias: `@/*` → `./src/*`
- Components organized by feature: `src/components/scout/`, `src/components/architect/`, `src/components/library/`
- Pages: `/scout`, `/architect`, `/blueprint`, `/library`

## Conventions

- Timestamps stored as ISO strings in text columns (not native timestamp type)
- UUIDs generated client-side via `uuid` package
- All scraped/analysis JSON stored as serialized strings (parse on read)
- Scout modes affect which pipeline stages run and which JSON fields get populated on scans/opportunities
- Knowledge base entries have `promptFragment` fields that get injected into Architect prompts at Step 5
