# Incremental Idea System — Implementation Prompt for Claude Code

You are adding a new feature to AppFactory called **Idea Evolution**. This lets users send a chat message describing a new idea or feature they want added to an app that already has a completed Architect analysis. The system reads the full existing context (all 5 analysis steps, all documents, all EPs), determines the most efficient way to integrate the new idea, and produces a single **Incremental Execution Prompt (EP+)** grounded entirely in what already exists — zero hallucination, zero redundancy.

Before making any changes, read these files completely:

- `src/lib/agents/architect.ts` — Understand the full pipeline, how steps build on each other, and how context flows
- `src/lib/ai/architect-prompts.ts` — Understand every schema, builder, anchor, and registry
- `src/lib/db/schema.ts` — Understand the data model
- `src/lib/types.ts` — Understand all type definitions
- `src/actions/architect-actions.ts` — Understand data access patterns
- `src/app/api/architect/stream/route.ts` — Understand the SSE streaming pattern
- `src/components/architect/` — Understand the existing Architect UI components

---

## DESIGN PRINCIPLES

1. **No hallucination**: The EP+ must reference only tables, screens, stores, hooks, and patterns that actually exist in the completed analysis. Every claim must trace back to a stored step result or document.
2. **Token optimization**: Do NOT re-run all 5 steps. Reuse existing step summaries. Run only 2 focused AI calls: one for impact analysis, one for EP+ generation.
3. **Time optimization**: The entire pipeline should complete in under 3 minutes. One structured analysis call (Sonnet, ~30s) + one EP generation call (Opus, ~90s) + deterministic document updates (~1s).
4. **Additive only**: EP+ never recreates what already exists. It specifies only new files to create, existing files to modify, and new dependencies to install.
5. **Consistency enforcement**: EP+ inherits all anchors from the original analysis — pricing, schema, deferred features, tech stack. New ideas cannot contradict these unless explicitly overriding them.

---

## PART 1: DATABASE CHANGES

### 1A. New table: `idea_evolutions`

Add a new table to `src/lib/db/schema.ts` called `idea_evolutions`. Follow the exact same Drizzle ORM patterns used by the existing tables (text columns, UUID primary key, text FK, ISO string timestamps). The table needs these columns:

- **id**: Text primary key, UUID, same pattern as other tables
- **analysisId**: Text, NOT NULL, foreign key referencing `analyses.id` — this links the evolution to its parent analysis
- **ideaText**: Text, NOT NULL — stores the user's raw chat message exactly as they typed it
- **status**: Text, NOT NULL, default "pending" — lifecycle values: "pending", "analyzing", "generating", "completed", "failed"
- **impactAnalysis**: Text, nullable — stores the structured impact analysis result as serialized JSON (same pattern as `stepsJson` on analyses)
- **epContent**: Text, nullable — stores the generated EP+ markdown document
- **documentUpdates**: Text, nullable — serialized JSON array listing which existing documents would need changes. Each entry has: documentType (matching the existing DocumentType enum), a changeDescription string, and which section is affected
- **newDependencies**: Text, nullable — serialized JSON string array of new npm packages this idea requires
- **newEnvVars**: Text, nullable — serialized JSON string array of new environment variables needed
- **newScreens**: Text, nullable — serialized JSON array of objects, each with screenName, route path, and patternSlug for brand new screens
- **modifiedScreens**: Text, nullable — serialized JSON array of objects, each with screenName and changeDescription for screens that need modification
- **newTables**: Text, nullable — serialized JSON array of objects, each with tableName and a columns array for new database tables
- **modifiedTables**: Text, nullable — serialized JSON array of objects, each with tableName and changeDescription for existing tables that need column additions or changes
- **setupSteps**: Text, nullable — serialized JSON string array of manual steps the user must perform before running EP+
- **createdAt**: Text, NOT NULL, default to current ISO timestamp — same pattern as other tables
- **completedAt**: Text, nullable

Add an index on `analysisId` for efficient lookups.

### 1B. Run migration

After adding the table definition, run `npm run db:push` to apply it to the database.

---

## PART 2: TYPE DEFINITIONS

### 2A. Add types to `src/lib/types.ts`

Add the following type definitions to the existing types file. Study the existing patterns in `types.ts` (how interfaces are organized, how discriminated unions work for SSE events, how analysis-related types are structured) and follow them exactly.

**IdeaEvolutionInput**: An interface with two fields — `analysisId` (string) and `ideaText` (string). This is what the API route receives.

**ImpactAnalysis**: A structured interface representing the AI's assessment of how a new idea affects the existing app. It must contain:
- `feasibility`: A string union of "straightforward", "moderate", or "complex"
- `estimatedEffort`: A human-readable string like "2-4 hours with Claude Code"
- `affectedScreens`: An array where each entry has a screenName (string), changeType ("new" or "modify"), and changeDescription (string)
- `affectedTables`: Same shape as affectedScreens but for database tables
- `newTechnologies`: An array where each entry has a techSlug (string matching slugs from the technologies table) and a justification (string)
- `removedTechnologies`: A string array of tech slugs that are no longer needed
- `pricingImpact`: A string union of "none", "minor", or "major"
- `pricingNotes`: A string explaining any pricing implications
- `conflictsWithExisting`: An array where each entry has an area (string), conflict (string), and resolution (string) — these flag when the new idea contradicts something in the existing analysis
- `implementationOrder`: An array where each entry has a step number, action description, and reason — this is the AI's recommended build sequence

**IdeaEvolutionSSEEvent**: A discriminated union type (same pattern as `ArchitectSSEEvent` in the existing code) with these variants:
- `idea_started` with evolutionId
- `impact_analysis_complete` with the full ImpactAnalysis object
- `ep_generation_started` (no extra data)
- `ep_generated` with evolutionId
- `idea_complete` with evolutionId
- `idea_error` with a message string
- `idea_cancelled` with evolutionId

---

## PART 3: ARCHITECT PROMPTS — NEW BUILDERS

### 3A. Add to `src/lib/ai/architect-prompts.ts`

Create two new prompt builder functions. Place them after the existing EP builder functions. Study how the existing builders work — how they receive context, how they format prompts, how they use anchors and constraints — and follow those patterns exactly.

**New Zod schema: `impactAnalysisSchema`**

Create a Zod schema that validates the ImpactAnalysis interface from Part 2. Follow the same patterns used by `aiExpectationsSchema`, `strategicPlanSchema`, etc. — use `z.object()` with `z.array()`, `z.enum()`, and `z.string()` as appropriate.

**Function 1: `buildImpactAnalysisPrompt()`**

This function builds the prompt for the first AI call (Sonnet, structured output). It takes these parameters:
- The user's idea text (raw string)
- Compact summaries of all 5 existing analysis steps (one string per step, ~100-200 tokens each)
- The list of existing screens (name, pattern slug, and route for each)
- The list of existing database tables (name and column names for each)
- The list of currently selected tech slugs
- The pricing anchor string (extracted from Step 2)
- The free tier anchor string (extracted from Step 2)
- The deferred features list (extracted from Step 4)

The prompt you build must instruct the AI model to:
- Analyze the user's idea against the full existing context that's provided
- Determine which screens need modification vs which are entirely new — be conservative, prefer modifying existing screens over creating new ones
- Determine if new database tables or columns are needed, referencing the existing schema
- Identify if new technologies are required by checking against the provided tech list
- Flag any conflicts where the new idea contradicts existing pricing, schema, or deferred features
- Produce a step-by-step implementation order (what to build first, second, third...)
- If the idea overlaps with something in the deferred features list, note that explicitly and reference the existing plan for it

The function returns the prompt string. It will be called with `callAIStructured()` using the `impactAnalysisSchema`, the ARCHITECT_FAST_MODEL (Sonnet), max_tokens of 4096, and a timeout of 60 seconds.

**Function 2: `buildIncrementalEPPrompt()`**

This function builds the prompt for the second AI call (Opus, freeform markdown). It takes these parameters:
- The user's idea text
- The completed ImpactAnalysis object from the first call
- The same compact step summaries as above
- The same existing screens and tables lists
- The currently selected tech slugs
- A map of tech slug to prompt fragment for any NEW technologies identified by the impact analysis (fetched from the technologies table)
- The schema anchor string (built using the existing `formatSchemaAnchor()` function from Step 5 data)
- The pricing anchor string
- The platform string ("web-nextjs" or "mobile-expo")
- The EP cross-reference string (built using the existing `buildEPCrossReference()` function)

The prompt you build must instruct the AI model to:
- Generate a document titled "EP+ — [Short Title]" where it derives a concise title from the idea
- Follow the exact same prose-only format as EP1/EP2/EP3 — absolutely zero code blocks, zero triple-backtick fences
- Structure the output with these 10 sections in order:
  1. **Context Recap** (~50 words) — What the app is and what already exists, referencing EP1/2/3 by name
  2. **Idea Summary** (~30 words) — What is being added
  3. **Prerequisites** — Any manual setup needed BEFORE running EP+ (new API keys, dashboard configuration, etc.)
  4. **Database Changes** — New tables with full column specs, or modifications to existing tables. Must reference the schema anchor to show current state.
  5. **Screen Changes** — For each affected screen: if NEW, provide a full screen spec matching the EP2 format (Purpose, Data Model, User Interactions, API Calls, State Management, Edge Cases). If MODIFIED, specify exactly what changes, referencing the existing screen by its name and route path.
  6. **New Edge Functions** — Any new Supabase edge functions needed, with input shapes, output shapes, and orchestration flow
  7. **Store & Hook Changes** — New Zustand stores or hooks needed, or specific modifications to existing ones (always reference by name)
  8. **Dependency Changes** — New npm packages to install
  9. **Environment Variable Changes** — New .env entries needed with their source service
  10. **Verification Checklist** — Concrete steps to confirm the idea was implemented correctly

- Embed these critical constraints directly in the prompt text:
  - "You are writing an ADDITIVE prompt. The app already has [N] screens, [N] tables, [N] stores, [N] hooks. Do NOT recreate any of them. Reference them by their existing names and paths."
  - "The schema anchor below shows the CURRENT database state. Any new tables must not conflict with existing table names. Any column additions must reference the existing table structure."
  - "The pricing anchor is: [pricing]. Do not contradict this unless the impact analysis explicitly flags a pricing change."
  - "These features were deferred and should NOT be built unless the user's idea specifically asks for them: [deferred features list]"
  - Inject the actual values from the parameters into these constraint strings.

The function returns the prompt string. It will be called with `callAIWithRetry()` (NOT structured output — this is freeform markdown), using the ARCHITECT_MODEL (Opus), max_tokens of 8192, and a timeout of 180 seconds. Apply the existing `stripCodeBlocks()` function to the output before storing.

---

## PART 4: PIPELINE FUNCTION

### 4A. Create `src/lib/agents/idea-evolution.ts`

This is a streamlined 2-call pipeline. Study `src/lib/agents/architect.ts` thoroughly — you will reuse many of its patterns (SSE event sending, cancellation checking, error handling, database updates, the `callAIStructured()` and `callAIWithRetry()` import patterns). But this pipeline is much simpler: no 5-step sequential analysis, no parallel document batches.

Create an exported async function called `runIdeaEvolutionPipeline`. It accepts three parameters: the IdeaEvolutionInput, a sendEvent callback (same pattern as the Architect's sendEvent), and an optional AbortSignal for cancellation. It returns the evolutionId string.

The pipeline has 3 internal steps:

**Step 0: Load existing analysis context** (database reads only, no AI calls)

Fetch the analysis record by the input's analysisId. Parse its `stepsJson` to get all 5 step results. Also fetch all documents and execution prompts for this analysis.

From the parsed steps, extract:
- A compact summary from each of the 5 steps (use the summary field if it exists in the step content, otherwise create a brief extraction — target ~100-200 tokens per step, ~800 tokens total for all 5)
- From Step 2: the pricing anchor and free tier anchor
- From Step 4: the deferred features list
- From Step 5: the platform, selectedTechnologies array, appScreens array, databaseSchema array, and synergyNotes

Use the existing `formatSchemaAnchor()` function to build the schema anchor from the Step 5 database schema. Use the existing `buildEPCrossReference()` function to build the cross-reference string.

Create a new `idea_evolutions` record in the database with status "analyzing" and the user's idea text. Generate a UUID for it.

Send the SSE event: idea_started with the evolutionId.

**Step 1: Impact Analysis** (~30 seconds)

Call `buildImpactAnalysisPrompt()` with all the context loaded in Step 0 plus the user's idea text. Execute it using `callAIStructured()` with the `impactAnalysisSchema` — this is the same pattern used for Steps 1-5 in the main Architect pipeline. Use ARCHITECT_FAST_MODEL (Sonnet), max_tokens 4096, timeout 60 seconds.

On success: Update the idea_evolutions record with the impactAnalysis JSON. Send the SSE event: impact_analysis_complete with the parsed result.

On failure: Update the record status to "failed". Send the SSE event: idea_error with the error message. Return early.

Check for cancellation between Step 1 and Step 2, using the same `checkCancelled(signal)` pattern from the Architect pipeline.

**Step 2: EP+ Generation** (~90 seconds)

Before calling the builder: if the impact analysis identified any newTechnologies, fetch their prompt fragments from the technologies table in the database. Build a map of tech slug to prompt fragment string.

Call `buildIncrementalEPPrompt()` with the impact analysis result plus all original context plus the tech fragment map. Execute it using `callAIWithRetry()` (freeform markdown, NOT structured output). Use ARCHITECT_MODEL (Opus), max_tokens 8192, timeout 180 seconds.

Apply `stripCodeBlocks()` to the returned text.

On success: Update the idea_evolutions record with:
- epContent: the cleaned markdown
- newDependencies, newEnvVars, newScreens, modifiedScreens, newTables, modifiedTables: all extracted from the impact analysis result (these are already structured from Step 1)
- setupSteps: parse the Prerequisites section from the EP+ content to extract manual steps, or derive from the impact analysis

Update status to "generating". Send SSE event: ep_generated with evolutionId.

On failure: Update status to "failed". Send idea_error event.

**Step 3: Document updates summary** (deterministic, no AI calls)

Based on the impact analysis, programmatically determine which existing documents would need updates:
- If newTables or modifiedTables are non-empty → flag that CLAUDE.md's database schema section needs updating
- If newEnvVars is non-empty → flag that .env.example needs new entries
- If newTechnologies is non-empty → flag that the dependency manifest in CLAUDE.md needs updating
- If newScreens is non-empty → flag that the navigation section in CLAUDE.md needs updating

Store this as the documentUpdates JSON on the record.

Mark status "completed". Set completedAt. Send SSE event: idea_complete with evolutionId.

**Cancellation**: Implement the same `Map<evolutionId, AbortController>` pattern used by the Architect pipeline. Export a `cancelIdeaEvolution` function that aborts the controller and updates the database record.

---

## PART 5: API ROUTES

### 5A. Create `src/app/api/idea-evolution/stream/route.ts`

Follow the exact same SSE streaming pattern as `src/app/api/architect/stream/route.ts`. Study that file and replicate its structure.

This is a GET endpoint that accepts query parameters: `analysisId` (required) and `idea` (required, URL-encoded).

URL-decode the idea parameter. Validate both parameters are present (return 400 if not).

Create a ReadableStream that runs `runIdeaEvolutionPipeline()` internally, using the same sendEvent-to-stream-enqueue pattern as the Architect. Set the timeout to 5 minutes (much shorter than the Architect's 45 minutes, since this pipeline only makes 2 AI calls).

Return the Response with Content-Type "text/event-stream" and appropriate caching/connection headers, matching the Architect's response headers.

### 5B. Create `src/app/api/idea-evolution/cancel/route.ts`

A POST endpoint that accepts a JSON body with `evolutionId`. Calls the exported `cancelIdeaEvolution()` function from the pipeline module. Returns a success/failure JSON response. Follow the exact same pattern as the Architect cancel route.

---

## PART 6: SERVER ACTIONS

### 6A. Create `src/actions/idea-evolution-actions.ts`

Study `src/actions/architect-actions.ts` and follow its patterns exactly (async server action functions, Drizzle query patterns, error handling).

Create three exported async functions:

1. **getEvolutionsByAnalysis(analysisId)**: Query the idea_evolutions table filtered by analysisId, ordered by createdAt descending. Return the full records. This is used by the evolution history component.

2. **getEvolutionById(evolutionId)**: Query a single idea_evolution by its id. Parse all the JSON text fields (impactAnalysis, documentUpdates, newDependencies, newEnvVars, newScreens, modifiedScreens, newTables, modifiedTables, setupSteps) into their proper typed objects before returning. This is used by the detail viewer.

3. **getEvolutionEPContent(evolutionId)**: Query just the epContent field for a single evolution. This is a lightweight fetch for when you only need the EP+ document text, not all the metadata.

---

## PART 7: UI COMPONENTS

### 7A. Chat input component: `src/components/architect/IdeaChatInput.tsx`

Study the existing Architect UI components in `src/components/architect/` to match their styling patterns (shadcn/ui components, Tailwind classes, color scheme).

Build a component that renders a chat-like input for submitting new ideas. Requirements:
- A multiline text area, 3 rows by default and expandable, with placeholder text: "Describe a new feature or change you want to add..."
- A send button positioned beside or below the text area, disabled when the input is empty or when a pipeline is currently running
- A character count display showing current/max (cap at 2000 characters to keep token costs predictable)
- When a pipeline is running: show a loading/spinner state on the send button and display a cancel button
- The component accepts props for: onSubmit callback (receives the idea text string), isRunning boolean, onCancel callback

### 7B. Impact analysis display: `src/components/architect/ImpactAnalysisCard.tsx`

Build a card component that displays the structured ImpactAnalysis result in a scannable format. Requirements:
- A feasibility badge at the top — use green for "straightforward", yellow/amber for "moderate", red for "complex"
- The estimated effort string displayed prominently
- A list of affected screens, each showing the screen name with a visual badge indicating "new" (green) vs "modify" (blue)
- A list of affected tables with the same new/modify badge pattern
- If newTechnologies is non-empty, show them with their justifications
- If conflictsWithExisting is non-empty, show them as warning alerts (yellow/amber styling)
- The implementation order rendered as a numbered list with step descriptions
- The component accepts the ImpactAnalysis object as a prop

### 7C. EP+ viewer: `src/components/architect/IncrementalEPViewer.tsx`

Build a component that displays the generated EP+ document. Study how the existing Execution Prompt viewer renders markdown and match that approach.

Requirements:
- Render the EP+ markdown content with the same styling as existing EP documents in the blueprint page
- A prominent copy-to-clipboard button that copies the full EP+ text (this is what the user pastes into Claude Code)
- A metadata sidebar or collapsible section showing: new dependencies list, new env vars list, and manual setup steps
- An "Apply to Project" section at the bottom that clearly lists exactly what manual actions the user needs to take before and after running EP+ in Claude Code
- The component accepts props for: epContent string, the parsed metadata fields (newDependencies, newEnvVars, setupSteps, documentUpdates)

### 7D. Evolution history: `src/components/architect/IdeaEvolutionHistory.tsx`

Build a component that shows all past EP+ evolutions for an analysis in a timeline or list format.

Requirements:
- Each entry shows: a preview of the idea text (truncated to ~100 chars), the status badge (pending/analyzing/generating/completed/failed), the timestamp, and the feasibility rating if completed
- Clicking an entry expands it to show the full ImpactAnalysisCard and IncrementalEPViewer for that evolution
- At the top, show cumulative totals: total new screens added across all evolutions, total new tables, total modified screens — this gives the user a sense of how much the app has evolved beyond the original blueprint
- The component accepts props for: an array of evolution records, and an optional onSelect callback

---

## PART 8: PAGE INTEGRATION

### 8A. Modify the blueprint page (`src/app/blueprint/page.tsx`)

Study the existing blueprint page to understand its tab/section structure. Add a new tab or section called **"Evolve"** alongside the existing document tabs (PRD, Visual Strategy, Technical Architecture, Execution Prompts).

The Evolve section contains, in vertical order:
1. The `IdeaChatInput` component — always visible at the top when viewing a completed analysis
2. The `ImpactAnalysisCard` — appears after the impact analysis call completes (hidden until then)
3. The `IncrementalEPViewer` — appears after the EP+ generates (hidden until then)
4. The `IdeaEvolutionHistory` — always visible below, showing all past evolutions for this analysis

The chat input should be the primary focus of this tab. The flow the user experiences: type idea → see impact analysis appear → see EP+ appear → copy EP+ to Claude Code.

### 8B. SSE client hook: `src/hooks/useIdeaEvolution.ts`

Study the existing Architect SSE client hook to understand the EventSource connection pattern, state management, and cleanup approach.

Create a custom hook called `useIdeaEvolution` that:
- Accepts an analysisId parameter
- Exposes a `submitIdea(ideaText: string)` function that initiates the SSE connection to `/api/idea-evolution/stream`
- Tracks pipeline status as a state value cycling through: "idle" → "analyzing" → "generating" → "complete" (or "error")
- Stores the impact analysis result in state when the `impact_analysis_complete` event arrives
- Stores the EP+ content in state when the `ep_generated` event arrives
- Exposes a `cancel()` function that POSTs to `/api/idea-evolution/cancel`
- On completion, triggers a refetch of the evolution history (either via callback or by invalidating a TanStack Query key)
- Cleans up the EventSource connection on unmount or cancellation

---

## PART 9: CONTEXT EXTRACTION HELPERS

### 9A. Add helper functions to `src/lib/agents/idea-evolution.ts`

These helpers are critical for token optimization. The full analysis steps contain 4K+ tokens each, but the incremental pipeline only needs ~800 tokens total from all 5 steps combined. Create these as private helper functions within the pipeline module.

**Helper 1: Extract compact step summaries**

Takes the raw stepsJson string from the analysis record. Parses it into the AnalysisStep array. For each of the 5 steps, extracts only the summary or a compact representation of the key decisions made. Target ~100-200 tokens per step summary. Return an object with step1 through step5 as string fields.

Study how the existing Architect pipeline extracts summaries between steps (look at how step results are summarized before being passed to the next step) and use the same extraction patterns.

**Helper 2: Extract structured data from Step 5**

Takes the Step 5 content (the tech selection result). Parses out the structured data needed for the impact analysis: the list of tables with their columns, the list of screens with their names and routes, and the list of selected tech slugs. Return these as typed arrays.

**Helper 3: Extract anchors from steps**

Takes the full AnalysisStep array. Extracts:
- The pricing anchor from Step 2 (look at how the main Architect pipeline extracts `pricingAnchor` from the strategic planning result)
- The deferred features list from Step 4 (look at how `deferredFeatures` is extracted from the dev tinkering result)
- The free tier limits from Step 2

Return these as simple strings.

These three helpers ensure the incremental pipeline uses ~2K tokens of context instead of ~15K, making each AI call faster and cheaper.

---

## PART 10: QUALITY GATES

### 10A. Impact analysis validation

After the impact analysis returns from the AI but before storing it, validate its references against the actual existing data:

- Every entry in `affectedScreens` with changeType "modify" must reference a screenName that exists in the original Step 5 `appScreens` array. If a screen name doesn't match any existing screen, remove that entry from the array and log a warning.
- Every entry in `affectedTables` with changeType "modify" must reference a tableName that exists in the original Step 5 `databaseSchema` array. Same removal + warning logic.
- Every entry in `newTechnologies` must have a techSlug that exists in the technologies table in the database. Query the technologies table to validate. Remove invalid entries with a warning.
- Do NOT fail the entire pipeline on validation issues. Just clean the data and continue.

This is the primary anti-hallucination gate. It ensures the AI cannot reference screens or tables that don't exist.

### 10B. EP+ content validation

After the EP+ markdown is generated and code blocks are stripped, run these checks:

- Verify the output does not contain any remaining triple-backtick code fences (strip again if found)
- Check that table names mentioned in the EP+ match either the existing schema anchor OR tables listed in the impact analysis's newTables — flag any unrecognized table names as warnings
- Scan for patterns that suggest recreating existing infrastructure (phrases like "Create a new auth provider", "Set up Supabase client", "Initialize the navigation structure" when those already exist) — add warnings if detected
- Length check: if the EP+ is shorter than 1,000 characters, the idea was probably too vague — add a warning suggesting the user provide more detail. If longer than 15,000 characters, the scope is probably creeping — add a warning suggesting the idea be split into multiple evolutions.

---

## PART 11: CUMULATIVE CONTEXT

### 11A. Modify the pipeline's Step 0 to load previous evolutions

When the user sends a 2nd, 3rd, or Nth idea for the same analysis, the pipeline must account for ALL previous evolutions so ideas don't conflict with each other.

After loading the original analysis context in Step 0, also fetch all completed idea_evolutions for the same analysisId (status "completed", ordered by createdAt ascending).

For each previous evolution, extract a compact summary containing: the idea text (first 100 characters), the lists of new screens and modified screens, the lists of new tables and modified tables, and any new dependencies. Format each as a ~100-token block.

Inject this as a "Previous Evolutions" context block into both the impact analysis prompt and the EP+ generation prompt. The format should be: "The following ideas have already been added to this app via EP+ prompts: [list]. Their screens and tables already exist. Do not duplicate their work. Reference their additions as part of the existing app."

### 11B. Token budget for cumulative context

Cap the number of previous evolutions included in context at 10. Each evolution summary is ~100 tokens, so this adds ~1,000 tokens maximum. If more than 10 completed evolutions exist, include only the 10 most recent and prepend a note: "There are [N] additional prior evolutions not shown. Assume all screens and tables from the original analysis plus the evolutions listed above already exist."

This keeps the total context budget predictable regardless of how many times the user evolves the same app.

---

## IMPLEMENTATION ORDER

Build these in sequence, verifying each step compiles and works before moving to the next:

1. **Database**: Add the `idea_evolutions` table to the schema file, run migration
2. **Types**: Add all new types (IdeaEvolutionInput, ImpactAnalysis, IdeaEvolutionSSEEvent) to types.ts
3. **Prompts**: Add the `impactAnalysisSchema` Zod schema, `buildImpactAnalysisPrompt()`, and `buildIncrementalEPPrompt()` to architect-prompts.ts
4. **Pipeline**: Create `src/lib/agents/idea-evolution.ts` with the full pipeline function, context extraction helpers, quality gates, and cancellation support
5. **API routes**: Create the SSE stream endpoint and cancel endpoint
6. **Server actions**: Create the three query functions
7. **UI components**: Build all 4 components (IdeaChatInput, ImpactAnalysisCard, IncrementalEPViewer, IdeaEvolutionHistory)
8. **Page integration**: Add the "Evolve" tab to the blueprint page
9. **SSE hook**: Create the useIdeaEvolution client hook
10. **Testing**: Submit 3 different test ideas to a completed analysis and verify: impact analysis validates correctly, EP+ references only existing artifacts, cumulative context works on the 2nd and 3rd ideas

---

## TOKEN & COST ESTIMATES

Per idea evolution:
- Impact Analysis (Sonnet): ~3K input + ~2K output = ~5K tokens ≈ $0.015
- EP+ Generation (Opus): ~5K input + ~4K output = ~9K tokens ≈ $0.135
- **Total per idea: ~$0.15 and ~2 minutes**

Compare to full Architect run: ~120K tokens, ~$3.50, ~15 minutes.
That's a **23x cost reduction and 7x time reduction** per incremental idea.
