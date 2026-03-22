# AppFactory — Product Vision & Implementation Plan

## Table of Contents

1. [What AppFactory Is](#1-what-appfactory-is)
2. [Current Product: The Research Moat](#2-current-product-the-research-moat)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Future Product: The Execution Moat](#4-future-product-the-execution-moat)
5. [Architecture & Specs for the Execution Moat](#5-architecture--specs-for-the-execution-moat)
6. [Implementation Plan](#6-implementation-plan)
7. [V1 Final Vision](#7-v1-final-vision)
8. [V2 Teaser (Post-Investment)](#8-v2-teaser-post-investment)

---

## 1. What AppFactory Is

AppFactory is an AI-powered platform that takes users from "I have an idea for an app" to "I have a production-ready blueprint I can paste into Claude Code and start building." It is the only product that covers the full pipeline from market research to executable specifications.

The platform has two AI agents:

- **Scout** — Discovers and validates app opportunities by scraping real app store data, analyzing real user reviews, scoring market opportunities, and synthesizing ideas from competitor weaknesses.
- **Architect** — Takes a validated idea and runs it through a 4-step analysis pipeline, producing a production-ready Product Brief and Visual Strategic Analysis.

The core thesis: **The hardest part of building an app is not writing code — it's knowing what to build and why.** Every AI code generation tool (v0, Bolt.new, Lovable, Cursor, Claude Code) assumes you already know what to build. AppFactory is the upstream intelligence layer that feeds into those tools.

---

## 2. Current Product: The Research Moat

### 2.1 Scout Agent

Scout is a multi-mode competitive intelligence agent with three operational modes.

**Category Mode**: Browse top apps in a specific App Store category, filter by market signals, analyze each competitor.

**Idea Mode**: User describes an app idea. Scout generates 8-15 intelligent search queries, finds competitors in the app store, performs gap analysis against the idea.

**Synthesis Mode** (default, most powerful): AI generates a full search strategy (queries + categories + dynamic filter thresholds), scrapes real app store data, analyzes competitors, and synthesizes a "Master Idea" — a single product concept that addresses every identified competitor weakness.

#### Scout Pipeline (Synthesis Mode)

```
User's Idea Text
    |
    v
[1] AI generates search strategy
    - 8-15 diverse search queries (competitor names, features, problems, adjacent markets)
    - 1-2 relevant app store categories
    - Dynamic filter thresholds (adjusted for niche vs. mainstream markets)
    |
    v
[2] Parallel scraping
    - Searches app store for each query (30 results each)
    - Scrapes suggested categories (100 apps each)
    - Deduplicates by app ID across all results
    |
    v
[3] Filtering & ranking
    - Applies AI-suggested filters: minInstalls, maxRating, minRatings
    - Calculates relevance bonus (keyword overlap with idea, title weighted 3x)
    - Ranks by: preScore * 0.5 + relevance * 0.5
    - Selects top 10 most relevant competitors
    |
    v
[4] Batch processing (per competitor app)
    - Fetch 50 real user reviews from app store
    - AI sentiment analysis → structured pain points, feature requests, praised aspects
    - AI feasibility estimation (0-100) considering technical barriers, UX fixes, market dynamics
    - Composite scoring: marketSize * 0.3 + dissatisfaction * 0.4 + feasibility * 0.3
    |
    v
[5] Gap analysis
    - Per-competitor: pain points exploited, feature gaps, strengths to overcome, gap score
    - Blue ocean detection if <3 competitors found
    |
    v
[6] Master Idea synthesis
    - Cross-references pain points across all 5-10 competitors
    - Designs features that address each competitor flaw (with evidence links)
    - Generates: name, tagline, core features, competitor flaws map, unique value props,
      target audience, difficulty breakdown, feasibility assessment, market viability,
      AI recommendation (strong_yes → strong_no) with go/no-go factors
```

#### Real-World Data Scout Accesses

| Data | Source | What We Get |
|------|--------|-------------|
| App listings | App Store / Google Play via scraper | Title, developer, ratings, review count, installs, description, genre, icon, URL |
| User reviews | App Store / Google Play review API | 50 reviews per app: text, score (1-5), date, thumbsUp |
| Install estimates | Star rating count * 4 multiplier (App Store) | Conservative install estimates marked with `~` |
| Category rankings | Top Free + Top Grossing collections | 100 apps per collection, deduplicated |

### 2.2 Architect Agent

Architect takes a validated opportunity or Master Idea and runs a 4-step sequential analysis pipeline, where each step has a specialized role and receives accumulated context from all prior steps.

#### Architect Pipeline

```
Opportunity or Master Idea
    |
    v
[Step 1] AI Expectations Analysis
    Role: Expert product strategist
    Input: Full rich context (all reviews, pain points, feature requests, sample quotes)
    Output: Core expectations, AI enhancements, feature priorities, UX vision,
            unmet needs, anti-patterns
    |
    v  (Step 1 summary compressed: 150-char strings, max 3 array items, depth 2)
    |
[Step 2] Strategic Planning
    Role: Senior business strategist
    Input: Compact context + Step 1 summary
    Output: Personas (with willingness to pay), positioning, revenue model,
            go-to-market strategy, competitive moat analysis
    |
    v  (Step 2 summary compressed)
    |
[Step 3] AI Approach & Architecture
    Role: Senior AI/ML architect
    Input: Compact context + Steps 1-2 summaries
    Output: Model/API selection per use case, data strategy, architecture decisions
            (on-device vs cloud), cost analysis, technical risk mitigation
    |
    v  (Step 3 summary compressed)
    |
[Step 4] Development & Tinkering Plan
    Role: Senior full-stack developer + technical lead
    Input: Compact context + Steps 1-3 summaries
    Output: MVP scope, tech stack with justifications, 12-week sprint plan,
            testing strategy, launch checklist
    |
    v
[Document Generation] (parallel)
    |
    +---> Product Brief (PRD)
    |     - AI Agent-optimized markdown (WHAT and WHY, never HOW)
    |     - 9 sections: Vision, Personas, Screen-by-Screen UX, Features,
    |       Anti-Competitor Directive, Data Requirements, Non-Functional,
    |       Success Criteria, Anti-Patterns
    |     - Designed to be copy-pasted into Claude Code or Cursor
    |
    +---> Visual Strategy (structured JSON → charts)
          - Go/No-Go Scorecard (verdict + weighted dimensions)
          - User Personas (emoji avatars, frustrations, goals)
          - Market Gap Analysis (blue ocean opportunities)
          - Revenue Model + Pricing Tiers + 12-month projections
          - Revenue Projections (CAC, LTV, unit economics, 3-year P&L)
          - Competitive Matrix (score table) + Deep Dive (strengths/weaknesses)
          - Data Model (entity-relationship visualization)
          - Risk Assessment (5 risks across categories)
          - Market Segments (size, growth, our share)
          - Development Timeline (phases with milestones)
```

#### Why the 4-Step Pipeline Beats a Single Prompt

| Problem with single prompt | How the pipeline solves it |
|---|---|
| AI tries to be strategist + architect + developer simultaneously | Each step has a specialized role and focused reasoning |
| All raw evidence (reviews, pain points) must fit in one context | Step 1 extracts insights from evidence; Steps 2-4 work from compressed summaries |
| Architectural decisions contradict business decisions | Step 3 receives Step 2's pricing/positioning → makes cost-aware technical choices |
| MVP scope ignores real technical constraints | Step 4 receives Step 3's cost analysis → plans realistically |
| No audit trail or intermediate reasoning | Each step saved to DB, visible in UI, resumable |

### 2.3 Technical Architecture

| Component | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database | SQLite via Drizzle ORM |
| AI Provider | OpenRouter (Claude Sonnet 4.5 for analysis, Claude Haiku 4.5 for sentiment) |
| Structured Output | Zod schemas + `generateObject()` with raw value extraction on validation errors |
| Streaming | Server-Sent Events (SSE) for real-time pipeline progress |
| UI | shadcn/ui + Recharts for data visualization |
| Scraping | `app-store-scraper` npm package + SerpAPI fallback |

### 2.4 Database Schema (Current)

```
scans
├── id, store, category, status, mode, ideaText, masterIdeaJson
├── totalAppsScraped, totalOpportunities
└── createdAt, completedAt

opportunities
├── id, scanId (FK → scans)
├── appId, title, store, genre, score, ratings, installs, description, icon, url, developer
├── sentimentJson, reviewsJson
├── marketSize, dissatisfaction, feasibility, compositeScore
├── gapAnalysisJson, blueOceanJson
└── createdAt

analyses
├── id, opportunityId (FK → opportunities), scanId (FK → scans)
├── status, stepsJson (serialized AnalysisStep[])
└── createdAt, completedAt

documents
├── id, analysisId (FK → analyses)
├── type ("app_prd" | "strategic_analysis"), title, content
└── createdAt
```

---

## 3. Competitive Landscape

### 3.1 Nobody Covers the Full Pipeline

```
STAGE 1           STAGE 2            STAGE 3          STAGE 4         STAGE 5
Market            Idea               Idea             PRD /           Code
Research          Generation         Validation       Planning        Generation
────────────────────────────────────────────────────────────────────────────────
Sensor Tower      -                  -                ChatPRD         v0
Appfigures        -                  -                Miro AI         Bolt.new
App Radar         -                  -                ClickUp         Lovable
                                                      Figma           Cursor
                                                                      Replit Agent
────────────────────────────────────────────────────────────────────────────────
               AppFactory Scout                       AppFactory Architect
 ◄────────────────────────────────────────────────────────────────────────────►
```

### 3.2 Competitor Breakdown

**Enterprise Data Platforms** (Sensor Tower, Appfigures, App Radar)
- Have real data but charge $thousands/month
- Provide dashboards and numbers, not synthesis
- No PRD generation, no AI analysis, no idea validation
- Serve app marketing teams, not builders

**PRD Generators** (ChatPRD — $15/mo, 100K+ users)
- Zero real-world data. Takes your idea at face value.
- Cannot see what exists in the market
- Generates PRDs from LLM imagination, not evidence
- No competitive analysis, no opportunity scoring

**Code Generators** (v0, Bolt.new, Lovable, Replit Agent)
- All assume you already know exactly what to build
- No research, no planning, no market validation
- v0: Frontend-focused, Vercel ecosystem
- Bolt.new: Full apps but astronomical token costs, degrades past 15 components
- Lovable: Most successful ($75M ARR), full-stack with Supabase
- Replit Agent: Autonomous but slow, breaks things while fixing others

**AI Coding Assistants** (Cursor, Claude Code)
- Developer productivity tools, not idea-to-app pipelines
- Excellent at executing a clear specification
- Zero concept of market research or product strategy
- This is where AppFactory's output GOES — we feed these tools

**Generic LLMs** (ChatGPT, Claude directly)
- Can attempt any stage but with zero real-time data
- Hallucinate competitor names, invent statistics
- Produce generic advice without heavy prompt engineering
- No systematic competitor coverage, no structured scoring
- Stateless — lose context across conversation turns

**OpenClaw**
- Open-source AI personal assistant (WhatsApp/Telegram automation)
- Zero overlap with AppFactory's domain
- Could write a generic PRD same as any LLM — no market intelligence

### 3.3 AppFactory's Current Moat

| What We Do | Who Else Does It |
|---|---|
| Scrape live app store data (ratings, installs, reviews) | Sensor Tower ($$$), but no AI synthesis |
| AI sentiment analysis on real reviews | Nobody in the builder/PRD space |
| Quantitative opportunity scoring (composite formula) | Nobody |
| Competitive gap analysis from real data | Nobody in the builder space |
| Blue ocean detection | Nobody |
| Master Idea synthesis from competitor weaknesses | Nobody |
| Evidence-grounded PRD generation | Nobody |
| Full pipeline (research → analysis → PRD) | Nobody |

---

## 4. Future Product: The Execution Moat

### 4.1 The Insight

The current product answers: **"What should I build and why?"**

The next evolution answers: **"What should I build, why, and here is exactly how to build it — split into executable prompts you paste into Claude Code."**

Right now, the PRD tells Claude Code WHAT the app does but lets it figure out HOW. This caps effectiveness at 50-70% of the app's infrastructure because Claude Code spends its intelligence on architectural decisions (which auth library? which database? how to structure the project?) instead of building features.

If those decisions are pre-made from battle-tested patterns and the output is split into sequential, targeted prompts, Claude Code becomes dramatically more effective — potentially building 80-90% of the infrastructure.

### 4.2 The Component/Pattern Database

A curated database of **architectural blueprints** for common app features. Not raw code — **blueprints** that describe the approach, file structure, dependencies, integration points, and key decisions.

Why blueprints instead of code:
- Code ages fast (dependency versions, framework changes, API deprecations)
- Blueprints age slowly (the approach to auth hasn't changed fundamentally in years)
- Claude Code generates better code from a clear blueprint than it does adapting someone else's existing code
- Blueprints are framework-agnostic — they work whether the user targets Next.js, React Native, or Flutter

#### Example Blueprint: Authentication

```
PATTERN: Authentication (Email + OAuth)
CATEGORY: Core Infrastructure
COMPLEXITY: Medium
DEPENDENCIES: Auth provider (Clerk, NextAuth, Supabase Auth, Firebase Auth)

APPROACH:
- Server-side session management (not client-side JWT storage)
- OAuth providers: Google + Apple minimum for mobile, Google + GitHub for web
- Email/password as fallback with email verification
- Protected route middleware (not per-page checks)
- Role-based access: at minimum "free" and "premium" tiers
- Session persistence across app restarts

FILE STRUCTURE:
- Auth middleware (single file, wraps all protected routes)
- Auth provider component (context wrapper at app root)
- Login/signup screens (2 screens: combined login/signup + email verification)
- Auth hooks (useAuth, useUser, useRequireAuth)
- Auth API routes (if self-hosted: login, signup, verify, refresh, logout)

KEY DECISIONS:
- Hosted auth (Clerk/Auth0) vs self-hosted (NextAuth/Supabase Auth)
  → For MVPs: hosted. Faster setup, handles edge cases (rate limiting, brute force).
  → For cost-sensitive: self-hosted with Supabase Auth (free tier generous).
- Token refresh strategy: silent refresh on 401, not preemptive
- Redirect after login: return to the page that triggered the auth gate

INTEGRATION POINTS:
- Payment system needs user ID for subscription mapping
- Notification system needs user ID for push token registration
- Analytics needs user ID for event attribution

ANTI-PATTERNS:
- Don't store passwords in your own database (use a provider)
- Don't implement "remember me" as a long-lived JWT (use refresh tokens)
- Don't gate content with client-side checks only (middleware or server-side)
```

#### Planned Blueprint Categories

**Core Infrastructure** (every app needs these)
- Authentication (email + OAuth)
- Payments & Subscriptions (Stripe/RevenueCat)
- Push Notifications (FCM/APNs)
- Permissions (camera, location, contacts, photos)
- Onboarding Flow (walkthrough + data collection)
- Settings & Preferences (user profile, notification prefs, theme)

**Data Patterns**
- CRUD Operations (list/detail/create/edit/delete with optimistic updates)
- Real-time Sync (WebSocket/SSE for live data)
- Offline-First (local DB + sync queue)
- File Upload & Media Management (images, documents, video)
- Search & Filtering (full-text search, faceted filters)

**AI Integration Patterns**
- Conversational AI (chat interface with streaming responses)
- Content Generation (text, summaries, recommendations)
- Image Analysis (camera capture → AI processing → structured output)
- Voice Input (speech-to-text → processing → response)
- Smart Suggestions (context-aware AI recommendations)

**UX Patterns**
- Tab-based Navigation (bottom tabs + stack navigation per tab)
- Drawer Navigation (side menu + nested stacks)
- Dashboard Layout (metric cards + charts + action items)
- Social Feed (infinite scroll + pull-to-refresh + like/comment)
- Multi-step Form (wizard with validation + progress indicator)

### 4.3 Technically Prescriptive PRDs (Execution Prompts)

Instead of one generic PRD, the Architect generates **2-3 sequential execution prompts** designed specifically for AI coding agents.

#### Prompt Architecture

```
PROMPT 1: Foundation (Terminal 1)
├── Project setup (framework, dependencies, folder structure)
├── Database schema (entities, relationships, migrations)
├── Authentication (from blueprint: approach + flow + middleware)
├── Base layout (navigation structure, theme, global state)
└── Expected outcome: Running app with auth, empty screens, navigation working

PROMPT 2: Core Features (Terminal 2, after Prompt 1 completes)
├── Feature-by-feature specifications (behavioral, with all states)
├── AI integration points (from blueprint: which pattern, how it connects)
├── Screen specifications (what user sees, interactions, data flow)
├── For each feature: references to foundation from Prompt 1
└── Expected outcome: All core screens built, features functional, AI integrated

PROMPT 3: Polish & Integrations (Terminal 3, after Prompt 2 completes)
├── Payments integration (from blueprint: provider + flow + webhook handling)
├── Push notifications (from blueprint: registration + triggers + deep links)
├── Error handling & edge cases (from PRD anti-patterns section)
├── Performance optimization (loading states, caching, lazy loading)
├── App store preparation (icons, splash screen, metadata)
└── Expected outcome: Production-ready app, store-submittable
```

#### How the Architect Generates These

1. Architect receives the idea + Master Idea context (same as today)
2. Runs the existing 4-step analysis pipeline (unchanged — this is the reasoning backbone)
3. **New step**: Pattern Matching — reads the idea's feature requirements, matches against the blueprint database, selects the most appropriate pattern for each
4. **New document generation**: Instead of one PRD, generates 2-3 execution prompts that reference specific blueprints and make all architectural decisions explicit
5. Visual Strategy generation unchanged (this is for the human, not the AI agent)

### 4.4 Where the Blueprints Come From

**Phase 1 — Seed from existing work (immediate)**
- Extract 10-15 patterns from the developer's own working app
- The user mentioned having a working app with components available on GitHub
- These become the first blueprints: proven, tested, known to work together

**Phase 2 — Curate from high-quality open source (months 1-3)**
- Hand-pick patterns from well-maintained, popular GitHub repos
- Focus on repos with: active maintenance, clean architecture, good documentation
- Normalize into blueprint format (approach + structure + decisions, not raw code)
- Each blueprint reviewed and tested before inclusion

**Phase 3 — Community contributions (months 3-6, post-traction)**
- Allow users to submit their own working patterns
- Review + normalize + include in the database
- Attribution system (blueprint author credited)

**Phase 4 — AI-assisted extraction (v2, post-investment)**
- Point the system at a GitHub repo, AI extracts architectural patterns automatically
- Human review before inclusion
- This is the scalable long-term approach but needs investment in tooling

---

## 5. Architecture & Specs for the Execution Moat

### 5.1 New Database Tables

```sql
-- Blueprint categories
CREATE TABLE blueprint_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,           -- "Authentication", "Payments", "Camera Analysis"
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

-- Architectural blueprints
CREATE TABLE blueprints (
  id TEXT PRIMARY KEY,
  categoryId TEXT NOT NULL REFERENCES blueprint_categories(id),
  name TEXT NOT NULL,            -- "Email + OAuth Authentication"
  slug TEXT NOT NULL UNIQUE,
  complexity TEXT NOT NULL,      -- "low" | "medium" | "high"
  description TEXT NOT NULL,     -- What this pattern does
  approach TEXT NOT NULL,        -- How it works (the blueprint narrative)
  fileStructure TEXT NOT NULL,   -- JSON: key files and their purposes
  dependencies TEXT NOT NULL,    -- JSON: required packages/services
  integrationPoints TEXT NOT NULL, -- JSON: how this connects to other patterns
  keyDecisions TEXT NOT NULL,    -- JSON: decision points with recommendations
  antiPatterns TEXT NOT NULL,    -- JSON: what NOT to do
  promptFragment TEXT NOT NULL,  -- Pre-written prompt text for this pattern
  sourceUrl TEXT,                -- GitHub repo or reference URL
  sourceApp TEXT,                -- Which app this was extracted from
  verified INTEGER NOT NULL DEFAULT 0, -- Has this been tested end-to-end?
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Blueprint compatibility (which blueprints work well together)
CREATE TABLE blueprint_compatibility (
  id TEXT PRIMARY KEY,
  blueprintA TEXT NOT NULL REFERENCES blueprints(id),
  blueprintB TEXT NOT NULL REFERENCES blueprints(id),
  compatibility TEXT NOT NULL,   -- "recommended" | "compatible" | "incompatible"
  notes TEXT                     -- Why / integration tips
);

-- Execution prompts (generated per analysis, references blueprints)
CREATE TABLE execution_prompts (
  id TEXT PRIMARY KEY,
  analysisId TEXT NOT NULL REFERENCES analyses(id),
  promptNumber INTEGER NOT NULL, -- 1, 2, or 3
  title TEXT NOT NULL,           -- "Foundation Setup", "Core Features", "Polish"
  content TEXT NOT NULL,         -- The actual prompt text
  blueprintIds TEXT NOT NULL,    -- JSON array of blueprint IDs used
  createdAt TEXT NOT NULL
);
```

### 5.2 New Architect Pipeline Step

After the existing 4-step analysis and before document generation:

```
[Step 5] Pattern Matching & Execution Planning
    Role: Senior solutions architect with knowledge of the blueprint database
    Input: All step summaries + blueprint catalog (names, categories, descriptions)
    Output:
      - selectedBlueprints: which blueprints apply to this app and why
      - promptPlan: how to split the work into 2-3 sequential prompts
      - decisionOverrides: any blueprint decisions that should differ for this specific app
      - integrationNotes: how the selected blueprints connect to each other
```

### 5.3 Execution Prompt Generation

Replace the current single PRD with a multi-prompt generator:

```
[Document Generation] (sequential, not parallel)
    |
    +---> Execution Prompt 1: Foundation
    |     - Uses: selected infrastructure blueprints (auth, payments setup, DB)
    |     - Includes: project setup, schema, navigation, base layout
    |     - References: specific blueprint approaches and decisions
    |
    +---> Execution Prompt 2: Core Features
    |     - Uses: selected feature blueprints (AI patterns, UX patterns, data patterns)
    |     - Includes: screen-by-screen specs with all states
    |     - References: foundation from Prompt 1 (knows what exists)
    |
    +---> Execution Prompt 3: Polish & Integrations
    |     - Uses: remaining blueprints (notifications, analytics, error handling)
    |     - Includes: edge cases, performance, store preparation
    |     - References: everything from Prompts 1 + 2
    |
    +---> Visual Strategy (unchanged, parallel with Prompt 1)
```

### 5.4 UI Changes

**Architect Output Page (Blueprint Page)**
- Left pane: Visual Strategy (unchanged)
- Right pane: Tabbed view with 3 execution prompts
  - Each tab shows the prompt with a prominent "Copy for Claude Code" button
  - Below the prompt: list of blueprints used (expandable to show details)
  - Sequential indicator: "Run this FIRST" → "Run this SECOND" → "Run this LAST"

**New: Blueprint Library Page**
- Browse all available blueprints by category
- Each blueprint shows: name, complexity, description, compatibility
- Expandable to see: approach, file structure, key decisions, anti-patterns
- Future: "Submit Blueprint" button for community contributions

### 5.5 Technical Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Blueprint storage | SQLite (same as existing DB) | No need for a separate system; blueprints are just another data type |
| Blueprint format | Structured text (not code) | Framework-agnostic, ages slowly, Claude Code generates better from descriptions |
| Prompt splitting | 3 prompts (foundation/features/polish) | Maps to natural development phases; each builds on the previous |
| Pattern matching | AI-assisted (not keyword matching) | The AI needs to understand feature requirements holistically, not just match keywords |
| Blueprint versioning | Soft (updatedAt field, no history) | V1 doesn't need version history; blueprints are manually curated |

---

## 6. Implementation Plan

### Phase 1: Blueprint Database Foundation (Week 1-2)

**Goal**: Create the blueprint storage system and seed it with 10-15 patterns from the user's existing app.

- Add `blueprint_categories`, `blueprints`, `blueprint_compatibility` tables to schema
- Build seed script that populates initial categories (Core Infrastructure, Data Patterns, AI Integration, UX Patterns)
- Extract 10-15 blueprints from the user's working app:
  - Authentication flow
  - Payment/subscription integration
  - Database schema patterns
  - Navigation structure
  - AI integration approach
  - Common UI patterns (forms, lists, modals, etc.)
- Build Blueprint Library page (browse + view details)
- No AI changes yet — this is purely data infrastructure

### Phase 2: Pattern Matching Engine (Week 3-4)

**Goal**: Architect agent can read the blueprint catalog and select appropriate patterns for an idea.

- Add Step 5 to the Architect pipeline: Pattern Matching
  - New Zod schema for pattern matching output
  - New prompt builder that includes blueprint catalog summaries
  - AI selects blueprints, justifies selections, plans prompt split
- Store pattern matching results alongside analysis steps
- Add `execution_prompts` table to schema
- UI: Show selected blueprints on the analysis progress page

### Phase 3: Execution Prompt Generation (Week 5-7)

**Goal**: Architect generates 3 sequential execution prompts instead of one PRD.

- New prompt builders for each execution prompt (foundation, features, polish)
  - Each receives: step summaries + selected blueprints + blueprint details + prior prompts
  - Each outputs: targeted, copy-paste-ready prompt text
- Update document generation flow:
  - Generate execution prompts sequentially (Prompt 2 references Prompt 1's output)
  - Generate Visual Strategy in parallel with Prompt 1
- Update Blueprint page UI:
  - Right pane becomes 3-tab execution prompt viewer
  - Each tab: prompt text + copy button + blueprint references + sequential indicator
- Keep the current PRD generation as a fallback/alternative view (some users may prefer the traditional PRD)

### Phase 4: Testing & Iteration (Week 8-9)

**Goal**: Validate that execution prompts produce 70-90% app infrastructure in Claude Code.

- Run 6-8 test ideas through the full pipeline:
  - 2 competitive market ideas (fitness, productivity)
  - 2 niche ideas (specific professional tools)
  - 2 AI-heavy ideas (content generation, image analysis)
  - 2 blue ocean ideas (novel concepts)
- For each: paste all 3 prompts into Claude Code, measure:
  - How many screens were built correctly?
  - How many features work end-to-end?
  - How many follow-up prompts needed?
  - Which blueprints produced the best results?
- Iterate on blueprints and prompt templates based on results
- Identify blueprint gaps (patterns that are needed but don't exist yet)

### Phase 5: Blueprint Expansion (Week 10-12)

**Goal**: Expand blueprint library from 10-15 to 25-30 patterns.

- Add blueprints identified as gaps during testing
- Curate 10-15 additional patterns from high-quality GitHub repos
- Test each new blueprint through the execution prompt pipeline
- Add blueprint compatibility data (which patterns work well together)
- Polish the Blueprint Library page with search, filtering, and compatibility indicators

---

## 7. V1 Final Vision

### What V1 Looks Like When Complete

**AppFactory V1** is a platform where a user can:

1. **Describe an app idea** in plain English
2. **Scout discovers the market** — scrapes real app stores, analyzes real reviews, finds real competitors, scores opportunities, and synthesizes a Master Idea that addresses every competitor weakness
3. **Architect analyzes the idea** — runs a 5-step pipeline (AI Expectations → Strategic Planning → AI Approach → Dev Plan → Pattern Matching) that produces:
   - **3 sequential execution prompts** — copy-paste into Claude Code terminals, get a working app
   - **Visual Strategic Analysis** — charts, scorecards, projections that help the user understand the market and make a go/no-go decision
4. **The user pastes the prompts** into Claude Code or Cursor and gets 70-90% of their app's infrastructure built automatically. The remaining 10-30% is polishing, edge cases, and custom business logic.

### The Value Proposition

> "AppFactory doesn't just tell you what to build — it tells your AI coding agent how to build it. Go from idea to 80% of a working app in one afternoon."

### Revenue Model (V1)

| Tier | Price | Includes |
|------|-------|---------|
| Free | $0 | 2 Scout scans/month, 1 Architect analysis/month, generic PRD only |
| Pro | $29/mo | Unlimited scans + analyses, execution prompts, full blueprint library |
| Team | $79/mo/seat | Everything in Pro + shared workspace + blueprint submissions |

### Key Metrics for V1 Success

- **North star**: % of app infrastructure built from execution prompts (target: 70%+)
- **Activation**: User completes first Scout scan → Architect analysis → copies execution prompt
- **Retention**: User returns to generate prompts for a second app idea within 30 days
- **Blueprint library size**: 25-30 verified blueprints covering 80% of common app features
- **Prompt quality**: Average follow-up prompts needed after execution prompts < 10

### What V1 is NOT

- Not a code generation tool (we feed Claude Code/Cursor, we don't replace them)
- Not a no-code platform (our users are developers or work with developers)
- Not an enterprise analytics platform (we're for builders, not marketers)
- Not a framework or boilerplate (blueprints describe approaches, not installable packages)

---

## 8. V2 Teaser (Post-Investment)

These are not built in V1 but represent the platform's long-term direction.

**AI-Assisted Blueprint Extraction**: Point at any GitHub repo → AI extracts architectural patterns → human review → add to blueprint library. This is how the library scales from 30 to 300+ patterns.

**Blueprint Marketplace**: Users publish their own blueprints. Top contributors earn revenue share. Creates a flywheel: more users → more blueprints → better execution prompts → more users.

**Continuous Market Monitoring**: Scout runs on a schedule, tracking competitor changes, new market entrants, rating shifts. Alerts when the market landscape changes for your idea.

**Execution Prompt Orchestration**: Instead of copy-paste into 3 terminals, AppFactory directly connects to Claude Code / Cursor APIs and executes the prompts in sequence. The user clicks "Build" and watches the app materialize.

**Multi-Platform Blueprints**: Same idea, different platform targets. Generate execution prompts for: Next.js web app, React Native mobile app, Flutter app, Electron desktop app — all from the same analysis.

**Post-Launch Intelligence**: After the app launches, Scout monitors its app store reviews and compares sentiment against competitors. Feeds insights back into the Architect for v2 planning.

---

*This document represents the product vision as of February 2026. V1 scope is fixed. V2 features are aspirational and subject to change based on market feedback and investment.*
