import { generateObject } from "ai";
import { z } from "zod";
import { openrouter, SENTIMENT_MODEL, callAIWithRetry, callAIStructured, STRUCTURED_SYSTEM_MSG, repairJsonText } from "@/lib/ai/client";
import type { AppStore, ScrapedApp, ScrapedReview, SentimentAnalysis, Opportunity, GapAnalysis, BlueOceanResult } from "@/lib/types";

const sentimentSchema = z.object({
  overallSentiment: z.enum(["positive", "mixed", "negative"]),
  painPoints: z.array(
    z.object({
      issue: z.string(),
      frequency: z.enum(["high", "medium", "low"]),
      severity: z.enum(["critical", "major", "minor"]),
      sampleQuotes: z.array(z.string()),
    })
  ),
  featureRequests: z.array(
    z.object({
      feature: z.string(),
      demand: z.enum(["high", "medium", "low"]),
      sampleQuotes: z.array(z.string()),
    })
  ),
  praisedAspects: z.array(z.string()),
  summary: z.string(),
});

const batchSentimentSchema = z.object({
  results: z.array(sentimentSchema),
});

/**
 * Select the most informative reviews: prioritize 1-2 star and 4-5 star,
 * skip 3-star reviews which are least informative for pain point / praise analysis.
 */
function selectInformativeReviews(reviews: ScrapedReview[], limit: number): ScrapedReview[] {
  const extreme = reviews.filter((r) => r.score <= 2 || r.score >= 4);
  const neutral = reviews.filter((r) => r.score === 3);
  // Fill with extreme reviews first, then neutral if needed
  return [...extreme, ...neutral].slice(0, limit);
}

export async function analyzeSentiment(
  reviews: ScrapedReview[],
  appTitle: string,
  signal?: AbortSignal
): Promise<SentimentAnalysis> {
  const selected = selectInformativeReviews(reviews, 20);
  const reviewTexts = selected
    .map((r) => `[${r.score}/5] ${r.text}`)
    .join("\n\n");

  const { object } = await callAIWithRetry(() =>
    generateObject({
      model: openrouter(SENTIMENT_MODEL),
      schema: sentimentSchema,
      system: STRUCTURED_SYSTEM_MSG,
      abortSignal: signal,
      prompt: `Analyze the following user reviews for the app "${appTitle}".
Identify the overall sentiment, key pain points (issues users complain about), feature requests (things users wish the app had), and praised aspects (things users love).

For each pain point, rate its frequency (how often it's mentioned) and severity (how much it impacts user experience).
For each feature request, rate its demand level.
Include 1-2 direct sample quotes for each pain point and feature request.
Provide a concise summary of the overall user sentiment.

Reviews:
${reviewTexts}`,
      experimental_repairText: repairJsonText,
    }),
    3,
    signal
  );

  return object as SentimentAnalysis;
}

export async function analyzeSentimentBatch(
  apps: { reviews: ScrapedReview[]; appTitle: string }[],
  signal?: AbortSignal
): Promise<SentimentAnalysis[]> {
  if (apps.length === 0) return [];
  if (apps.length === 1) return [await analyzeSentiment(apps[0].reviews, apps[0].appTitle, signal)];

  const appsToProcess = apps.slice(0, 3); // Cap batch at 3 apps
  const appsText = appsToProcess
    .map((app, i) => {
      const selected = selectInformativeReviews(app.reviews, 15);
      const reviewTexts = selected
        .map((r) => `[${r.score}/5] ${r.text}`)
        .join("\n");
      return `=== APP ${i + 1}: "${app.appTitle}" ===\n${reviewTexts}`;
    })
    .join("\n\n");

  const { object } = await callAIWithRetry(() =>
    generateObject({
      model: openrouter(SENTIMENT_MODEL),
      schema: batchSentimentSchema,
      system: STRUCTURED_SYSTEM_MSG,
      abortSignal: signal,
      prompt: `Analyze user reviews for ${appsToProcess.length} apps. For EACH app, provide a separate sentiment analysis.

For each app, identify the overall sentiment, key pain points, feature requests, and praised aspects.
For each pain point, rate its frequency and severity.
For each feature request, rate its demand level.
Include 1-2 direct sample quotes for each pain point and feature request.
Provide a concise summary of each app's user sentiment.

Return results in the same order as the apps below.

${appsText}`,
      experimental_repairText: repairJsonText,
    }),
    3,
    signal
  );

  const batchResults = object.results as SentimentAnalysis[];

  // If we capped the batch, process remaining apps individually
  if (apps.length > appsToProcess.length) {
    const remaining = apps.slice(appsToProcess.length);
    const extraResults = await Promise.all(
      remaining.map((app) => analyzeSentiment(app.reviews, app.appTitle, signal))
    );
    return [...batchResults, ...extraResults];
  }

  return batchResults;
}

export async function estimateFeasibility(
  app: ScrapedApp,
  sentiment: SentimentAnalysis,
  signal?: AbortSignal
): Promise<number> {
  const painPointsSummary = sentiment.painPoints
    .map((p) => `- ${p.issue} (${p.severity}, ${p.frequency} frequency)`)
    .join("\n");

  const featureRequestsSummary = sentiment.featureRequests
    .map((f) => `- ${f.feature} (${f.demand} demand)`)
    .join("\n");

  const { object } = await callAIWithRetry(() =>
    generateObject({
      model: openrouter(SENTIMENT_MODEL),
      schema: z.object({
        feasibilityScore: z
          .number()
          .describe(
            "Feasibility score from 0-100 representing how feasible it is for an indie developer to build a better alternative"
          ),
        reasoning: z.string(),
      }),
      system: STRUCTURED_SYSTEM_MSG,
      abortSignal: signal,
      prompt: `Evaluate the feasibility of building a better alternative to "${app.title}" (${app.genre} category).

Current app details:
- Rating: ${app.score}/5 with ${app.ratings} ratings
- Installs: ${app.installs}
- Description: ${app.description.slice(0, 500)}

Key pain points users have:
${painPointsSummary}

Feature requests from users:
${featureRequestsSummary}

Rate the feasibility (0-100) of an indie developer or small team building a competitive alternative that addresses these pain points. Consider:
- Technical complexity of the core features
- Whether the pain points are solvable with better UX/engineering
- Market barriers to entry (API access, data requirements, network effects)
- Regulatory or licensing requirements
- Time to build an MVP (lower score if > 6 months)

A score of 80+ means highly feasible (simple app category, clear UX improvements possible).
A score of 50-79 means moderately feasible (some technical challenges but doable).
A score below 50 means challenging (complex domain, strong network effects, etc.).`,
      experimental_repairText: repairJsonText,
    }),
    3,
    signal
  );

  return object.feasibilityScore;
}

// --- Idea Mode Functions ---

const searchQueriesSchema = z.object({
  queries: z.array(z.string()),
});

export async function generateSearchQueries(
  ideaText: string,
  store: AppStore,
  signal?: AbortSignal
): Promise<string[]> {
  const storeLabel = store === "google_play" ? "Google Play" : "App Store";

  const { object } = await callAIWithRetry(() =>
    generateObject({
      model: openrouter(SENTIMENT_MODEL),
      schema: searchQueriesSchema,
      system: STRUCTURED_SYSTEM_MSG,
      abortSignal: signal,
      prompt: `Generate 8-15 app store search queries to find potential competitors for the following app idea. Return diverse queries covering ALL of these categories:

1. **Direct competitor names** — specific well-known apps that do something similar
2. **Feature-specific queries** — searches for the core functionality (e.g. "habit tracker with reminders")
3. **Problem-specific queries** — searches for the problem the app solves (e.g. "stop procrastinating app")
4. **Broader category terms** — general category searches (e.g. "productivity tools", "fitness apps")
5. **Adjacent solutions** — alternative approaches to the same problem

Ensure query diversity — avoid near-duplicate queries that would return the same results.

App idea: ${ideaText}
Target store: ${storeLabel}

Return an array of 8-15 search query strings that would surface apps competing in the same space.`,
      experimental_repairText: repairJsonText,
    }),
    3,
    signal
  );

  return object.queries;
}

const gapAnalysisSchema = z.object({
  ideaSummary: z.string(),
  competitorComparisons: z.array(
    z.object({
      competitorName: z.string(),
      competitorId: z.string(),
      painPointsExploited: z.array(z.string()),
      featureGaps: z.array(z.string()),
      strengthsToOvercome: z.array(z.string()),
      gapScore: z.number(),
    })
  ),
  uniqueAdvantages: z.array(z.string()),
  marketPositioning: z.string(),
});

export async function analyzeCompetitorGap(
  ideaText: string,
  competitors: Opportunity[],
  signal?: AbortSignal
): Promise<GapAnalysis> {
  const competitorSummaries = competitors
    .map((opp, i) => {
      const painPoints = opp.sentiment.painPoints
        .map((p) => p.issue)
        .join(", ");
      const featureGaps = opp.sentiment.featureRequests
        .map((f) => f.feature)
        .join(", ");
      return `${i + 1}. "${opp.scrapedApp.title}" (ID: ${opp.scrapedApp.id})
   - Rating: ${opp.scrapedApp.score}/5 with ${opp.scrapedApp.ratings} ratings
   - Pain points: ${painPoints || "None identified"}
   - Feature gaps: ${featureGaps || "None identified"}
   - Composite score: ${opp.score.composite}/100`;
    })
    .join("\n\n");

  return callAIStructured<GapAnalysis>(
    `Analyze the competitive gaps between a proposed app idea and its existing competitors.

APP IDEA:
${ideaText}

EXISTING COMPETITORS:
${competitorSummaries}

For each competitor, analyze:
1. painPointsExploited: Which of their user pain points could the new app idea exploit?
2. featureGaps: What features are missing from the competitor that the idea could provide?
3. strengthsToOvercome: What does the competitor do well that the new app must match or surpass?
4. gapScore: A 0-100 score indicating how large the opportunity gap is (100 = massive gap, easy to differentiate)

Also provide:
- ideaSummary: A concise 1-2 sentence summary of what the proposed app would do
- uniqueAdvantages: List of unique advantages the proposed idea has over ALL competitors
- marketPositioning: How the app should position itself in the market to stand out`,
    gapAnalysisSchema,
    "GapAnalysis",
    "Competitive gap analysis between an app idea and existing competitors",
    signal
  );
}

const blueOceanSchema = z.object({
  isBlueOcean: z.boolean(),
  confidence: z.number(),
  reasoning: z.string(),
  adjacentMarkets: z.array(z.string()),
  risks: z.array(z.string()),
  nextSteps: z.array(z.string()),
  immediateArchitectHandoff: z.boolean(),
});

export async function detectBlueOcean(
  ideaText: string,
  competitorsFound: number,
  searchQueries: string[],
  signal?: AbortSignal
): Promise<BlueOceanResult> {
  return callAIStructured<BlueOceanResult>(
    `Evaluate whether the following app idea represents a "Blue Ocean" opportunity — meaning there is little to no direct competition in the app stores.

APP IDEA:
${ideaText}

SEARCH RESULTS CONTEXT:
- We searched ${searchQueries.length} different queries: ${searchQueries.join(", ")}
- Only ${competitorsFound} potential competitor(s) were found

A "Blue Ocean" market is one where:
- There are few or no direct competitors addressing this specific problem
- The idea creates a new market space rather than competing in an existing one
- Users currently have no good app-based solution for this need

Evaluate and return:
- isBlueOcean: true if this appears to be a blue ocean opportunity
- confidence: 0-100 score of how confident you are in this assessment
- reasoning: Detailed explanation of why this is or isn't a blue ocean opportunity
- adjacentMarkets: Related markets or app categories that could expand into this space
- risks: Key risks if pursuing this opportunity (e.g., "low search volume may indicate low demand")
- nextSteps: Recommended next steps for validating and pursuing this opportunity
- immediateArchitectHandoff: true if the opportunity is strong enough to immediately proceed to detailed architecture planning`,
    blueOceanSchema,
    "BlueOceanResult",
    "Blue ocean market opportunity assessment",
    signal
  );
}
