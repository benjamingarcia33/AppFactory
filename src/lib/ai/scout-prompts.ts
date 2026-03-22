import { generateObject } from "ai";
import { z } from "zod";
import { openrouter, SCOUT_MODEL, SENTIMENT_MODEL, callAIWithRetry, callAIStructured, STRUCTURED_SYSTEM_MSG, repairJsonText } from "@/lib/ai/client";
import type { AppStore, ScrapedApp, ScrapedReview, SentimentAnalysis, Opportunity, GapAnalysis, BlueOceanResult, MasterIdea, ScoutFilterSettings } from "@/lib/types";

const sentimentSchema = z.object({
  overallSentiment: z.enum(["positive", "mixed", "negative"]),
  painPoints: z.array(
    z.object({
      issue: z.string(),
      category: z.enum(["technical", "feature_gap", "monetization"]),
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
  featureInventory: z.array(z.string()).describe("Key features users mention the app actually having (not requesting)"),
  summary: z.string(),
});

const batchSentimentItemSchema = z.object({
  appName: z.string(),
  ...sentimentSchema.shape,
});

const batchSentimentSchema = z.object({
  results: z.array(batchSentimentItemSchema),
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
      maxOutputTokens: 4096,
      prompt: `Analyze the following user reviews for the app "${appTitle}".
Identify the overall sentiment, key pain points (issues users complain about), feature requests (things users wish the app had), and praised aspects (things users love).

For each pain point, rate its frequency (how often it's mentioned) and severity (how much it impacts user experience).

Categorize each pain point into one of three categories:
- "technical": Crashes, bugs, slow performance, poor UI/UX, battery drain, storage issues
- "feature_gap": Missing functionality users want, features that could be better, capabilities competitors lack
- "monetization": Complaints about pricing, paywalls, subscriptions, in-app purchases, ads

IMPORTANT: Monetization complaints (paywalls, pricing, ads) are NOT weaknesses — they validate that the monetization model works. Categorize them as "monetization" so they can be treated separately.

DISAMBIGUATION GUIDE — use these examples to categorize correctly:
- "App crashes when I try to export" → TECHNICAL (crash/bug is a technical issue)
- "No way to export my data" → FEATURE_GAP (missing capability entirely)
- "Export is slow and unreliable" → TECHNICAL (performance bug)
- "Would love to export to PDF" → FEATURE_GAP (missing specific feature/format)
- "Too many ads" → MONETIZATION (advertising is monetization)
- "Subscription is too expensive" → MONETIZATION (pricing complaint)
- "App needs a dark mode" → FEATURE_GAP (missing feature users want)
- "Dark mode doesn't work properly" → TECHNICAL (broken existing feature)

For featureInventory: List ONLY features that users EXPLICITLY MENTION USING in their reviews (not features from the app store description). This creates a ground-truth inventory of what the app actually delivers.

For each feature request, rate its demand level.
Include 1-2 sample quotes for each pain point and feature request. Use EXACT VERBATIM text from the reviews above — copy the user's words exactly as written. Do NOT paraphrase, summarize, or invent quotes.
List the key features users mention this app actually having (not requesting, but actually using and discussing). This helps identify what features exist in the market.
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

  const appsToProcess = apps.slice(0, 5); // Cap batch at 5 apps for efficiency
  const appsText = appsToProcess
    .map((app, i) => {
      const selected = selectInformativeReviews(app.reviews, 8);
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
      maxOutputTokens: 8192,
      prompt: `Analyze user reviews for ${appsToProcess.length} apps. For EACH app, provide a separate sentiment analysis.

For each app, identify the overall sentiment, key pain points, feature requests, and praised aspects.
For each pain point, rate its frequency and severity.

Categorize each pain point into one of three categories:
- "technical": Crashes, bugs, slow performance, poor UI/UX, battery drain, storage issues
- "feature_gap": Missing functionality users want, features that could be better, capabilities competitors lack
- "monetization": Complaints about pricing, paywalls, subscriptions, in-app purchases, ads

IMPORTANT: Monetization complaints (paywalls, pricing, ads) are NOT weaknesses — they validate that the monetization model works. Categorize them as "monetization" so they can be treated separately.

DISAMBIGUATION GUIDE — use these examples to categorize correctly:
- "App crashes when I try to export" → TECHNICAL (crash/bug is a technical issue)
- "No way to export my data" → FEATURE_GAP (missing capability entirely)
- "Export is slow and unreliable" → TECHNICAL (performance bug)
- "Would love to export to PDF" → FEATURE_GAP (missing specific feature/format)
- "Too many ads" → MONETIZATION (advertising is monetization)
- "Subscription is too expensive" → MONETIZATION (pricing complaint)
- "App needs a dark mode" → FEATURE_GAP (missing feature users want)
- "Dark mode doesn't work properly" → TECHNICAL (broken existing feature)

For featureInventory: List ONLY features that users EXPLICITLY MENTION USING in their reviews (not features from the app store description). This creates a ground-truth inventory of what the app actually delivers.

For each feature request, rate its demand level.
Include 1-2 sample quotes for each pain point and feature request. Use EXACT VERBATIM text from the reviews above — copy the user's words exactly as written. Do NOT paraphrase, summarize, or invent quotes.
List the key features users mention this app actually having (not requesting, but actually using and discussing). This helps identify what features exist in the market.
Provide a concise summary of each app's user sentiment.

IMPORTANT: Include the "appName" field in each result, set to the EXACT app title from the header (e.g. "My App Name").

${appsText}`,
      experimental_repairText: repairJsonText,
    }),
    3,
    signal
  );

  // Map results by app name instead of relying on array order
  const resultsByName = new Map<string, SentimentAnalysis>();
  for (const item of object.results) {
    const { appName, ...sentiment } = item;
    resultsByName.set(appName.toLowerCase(), sentiment as SentimentAnalysis);
  }

  const defaultSentiment: SentimentAnalysis = {
    overallSentiment: "mixed",
    painPoints: [],
    featureRequests: [],
    praisedAspects: [],
    summary: "Sentiment analysis unavailable — batch mapping failed for this app.",
  };

  const batchResults: SentimentAnalysis[] = appsToProcess.map((app) => {
    const matched = resultsByName.get(app.appTitle.toLowerCase());
    if (matched) return matched;
    // Fallback: try partial match (AI may truncate or slightly alter the name)
    for (const [name, sentiment] of resultsByName) {
      if (name.includes(app.appTitle.toLowerCase()) || app.appTitle.toLowerCase().includes(name)) {
        return sentiment;
      }
    }
    return defaultSentiment;
  });

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
      maxOutputTokens: 1024,
      prompt: `Evaluate the feasibility of building a better alternative to "${app.title}" (${app.genre} category).

Current app details:
- Rating: ${app.score}/5 with ${app.ratings} ratings
- Installs: ${app.installs}
- Description: ${app.description.slice(0, 500)}

Key pain points users have:
${painPointsSummary}

Feature requests from users:
${featureRequestsSummary}

Rate feasibility (0-100) for a solo indie developer building a better alternative. Score by evaluating these 5 components and averaging them:

1. **UI Complexity** (weight 25%): How many unique screens and complex interactions? Simple forms/lists = 85-95. Rich animations/custom components = 50-70. AR/VR/real-time canvas = 20-40.
2. **Backend Complexity** (weight 25%): Static content/local-only = 90+. Standard CRUD + auth = 65-80. Real-time sync/AI pipeline/complex data = 40-65.
3. **Third-Party Integrations** (weight 20%): 0-1 simple APIs = 85-95. 2-3 APIs (payments, social auth) = 55-75. 4+ APIs or complex SDKs = 30-55.
4. **Data/Content Requirements** (weight 15%): User-generated only = 85-95. Small curated dataset = 60-78. Large curated database or licensed content = 30-55.
5. **Regulatory/Compliance** (weight 15%): None = 90-95. Basic privacy (GDPR) = 65-82. Health/medical/financial/children's data = 25-50.

ANCHORED EXAMPLES:
- 85-95: Simple utility (calculator, timer, notes) — straightforward UI, no backend, no integrations
- 75-84: Standard app (habit tracker, social feed) — moderate backend, standard auth, 1-2 API calls
- 55-74: Moderate-complex app (AI features, real-time sync, marketplace) — significant backend, 3+ integrations
- 30-54: Very complex (health/medical AI, financial trading, AR/VR) — regulatory, custom ML, real-time data
- <30: Extremely complex (autonomous systems, novel hardware integration)

IMPORTANT: Apps in the same category should still differ by 5-15 points based on their specific feature scope. A simple skincare tips app (mostly static content) should score 15-20 points higher than a skincare AI scanner (computer vision + product database).

ANTI-CLUSTERING CHECK: After scoring, if your result falls between 70-74, re-examine whether the app is truly "average complexity" or you defaulted to the middle. If two apps in the same batch have different feature scopes, their scores MUST differ by at least 5 points.`,
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
      maxOutputTokens: 2048,
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

// --- Synthesis Pipeline Functions ---

const searchStrategySchema = z.object({
  queries: z.array(z.string()),
  categories: z.array(z.string()),
  reasoning: z.string(),
  filters: z.object({
    minInstalls: z.number(),
    maxRating: z.number(),
    minRatings: z.number(),
  }),
});

export type SearchStrategy = z.infer<typeof searchStrategySchema>;

export async function generateSearchStrategy(
  ideaText: string,
  store: AppStore,
  signal?: AbortSignal
): Promise<SearchStrategy> {
  const storeLabel = store === "google_play" ? "Google Play" : "App Store";

  const categoryList = store === "google_play"
    ? "TOOLS, PRODUCTIVITY, HEALTH_AND_FITNESS, FINANCE, EDUCATION, BUSINESS, LIFESTYLE, TRAVEL_AND_LOCAL, FOOD_AND_DRINK, SHOPPING, SOCIAL, COMMUNICATION, PHOTOGRAPHY, WEATHER, MUSIC_AND_AUDIO"
    : "6002 (Utilities), 6007 (Productivity), 6013 (Health & Fitness), 6015 (Finance), 6017 (Education), 6000 (Business), 6012 (Lifestyle), 6003 (Travel), 6023 (Food & Drink), 6024 (Shopping), 6005 (Social Networking), 6008 (Photo & Video), 6001 (Weather), 6011 (Music)";

  return callAIStructured<SearchStrategy>(
    `Expert app market researcher. Generate a search strategy to find ALL competitors for this idea on ${storeLabel}.

APP IDEA:
${ideaText}

Generate:
- queries (8-15): Diverse — direct competitor names, feature searches, problem searches, category terms, adjacent solutions. No near-duplicates.
- categories (1-2): DIRECTLY relevant store category IDs from: ${categoryList}. Return category VALUE. Only select categories DIRECTLY relevant — prefer 1-2 specific over 3-4 broad.
- reasoning: Brief strategy explanation.
- filters: minInstalls (1000-5000 niche, 10000-100000 mainstream), maxRating (4.5 for dissatisfied markets, 5 for broad), minRatings (50-100 niche, 100-500 mainstream).`,
    searchStrategySchema,
    "SearchStrategy",
    "App store search strategy with queries, categories, and dynamic filters",
    signal,
    SCOUT_MODEL,
    4096,
  );
}

const masterIdeaSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  coreFeatures: z.array(z.object({
    name: z.string(),
    description: z.string(),
    addressesFlaws: z.array(z.string()),
    evidenceAppIds: z.array(z.string()),
    priority: z.enum(["critical", "high", "medium"]),
  })),
  competitorFlaws: z.array(z.object({
    competitorAppId: z.string(),
    competitorName: z.string(),
    flaws: z.array(z.string()),
    featureGaps: z.array(z.string()),
    strengths: z.array(z.string()),
    marketData: z.object({
      installs: z.string(),
      rating: z.number(),
      ratings: z.number(),
    }),
  })),
  uniqueValueProps: z.array(z.string()),
  targetAudience: z.string(),
  marketOpportunity: z.string(),
  estimatedDifficulty: z.enum(["low", "medium", "high"]),
  confidenceScore: z.number(),
  difficultyBreakdown: z.object({
    technicalComplexity: z.enum(["low", "medium", "high"]),
    timeToMvp: z.string(),
    teamSize: z.string(),
    keyTechnicalChallenges: z.array(z.string()),
    requiredExpertise: z.array(z.string()),
  }),
  feasibilityAssessment: z.object({
    isRealistic: z.boolean(),
    score: z.number(),
    reasoning: z.string(),
    majorBlockers: z.array(z.string()),
    costEstimate: z.string(),
  }),
  marketViability: z.object({
    score: z.number(),
    willMakeDifference: z.boolean(),
    reasoning: z.string(),
    revenueModel: z.string(),
    userAcquisitionStrategy: z.string(),
    competitiveAdvantageType: z.enum(["feature", "ux", "price", "niche", "technology"]),
  }),
  aiRecommendation: z.object({
    verdict: z.enum(["strong_yes", "yes", "maybe", "no", "strong_no"]),
    summary: z.string(),
    warnings: z.array(z.string()),
    goNoGoFactors: z.array(z.object({
      factor: z.string(),
      assessment: z.enum(["go", "caution", "no_go"]),
      explanation: z.string(),
    })),
  }),
});

export async function synthesizeMasterIdea(
  ideaText: string,
  competitors: Opportunity[],
  searchStrategy: { queries: string[]; categories: string[]; reasoning: string },
  signal?: AbortSignal,
  blueOcean?: BlueOceanResult | null,
  modelOverride?: string,
): Promise<MasterIdea> {
  let prompt: string;

  if (competitors.length === 0) {
    // Blue ocean / zero-competitor prompt variant
    const blueOceanContext = blueOcean
      ? `\nBLUE OCEAN ASSESSMENT:
- Is Blue Ocean: ${blueOcean.isBlueOcean} (Confidence: ${blueOcean.confidence}%)
- Reasoning: ${blueOcean.reasoning}
- Adjacent Markets: ${blueOcean.adjacentMarkets.join(", ") || "None identified"}
- Risks: ${blueOcean.risks.join(", ") || "None identified"}
- Next Steps: ${blueOcean.nextSteps.join(", ") || "None identified"}`
      : "";

    prompt = `You are a visionary product strategist AND a brutally honest business advisor. Analyze a blue ocean app concept — NO direct competitors were found in the app stores. Assess whether this is a genuine opportunity or a sign of low demand.

ORIGINAL APP IDEA:
${ideaText}

SEARCH STRATEGY: ${searchStrategy.queries.join(", ")} | Categories: ${searchStrategy.categories.join(", ")} | ${searchStrategy.reasoning}
${blueOceanContext}

NO DIRECT COMPETITORS FOUND — This means either:
1. A genuine untapped market opportunity (blue ocean)
2. Low demand / niche too small to sustain an app
3. The problem is solved by non-app solutions (web tools, physical products, etc.)
4. Search queries may not have captured all competitors

Create a MASTER IDEA that: starts from the user's vision, proposes the strongest possible product for this uncontested space, and critically evaluates demand risk.

REQUIREMENTS:
- name: Creative memorable name. tagline: One-line value prop (<100 chars). description: 2-3 paragraphs.
- coreFeatures (5-8): Each describes a key feature for this product. addressesFlaws: set to empty arrays (no competitors). evidenceAppIds: set to empty arrays. priority: critical/high/medium.
- competitorFlaws: MUST be an empty array (no competitors found).
- uniqueValueProps (3-5), targetAudience, estimatedDifficulty, confidenceScore (0-100).
- marketOpportunity: Do NOT cite global market sizes ("$180B skincare market"). Instead estimate the ADDRESSABLE market for a solo indie app based on adjacent categories: how many potential users might exist for this niche? Ground claims in realistic estimates. Example: "Adjacent category apps have 50,000-200,000 combined users. Capturing 1-3% (500-2,000 users) in 12 months is a realistic starting point for an uncontested niche."
- difficultyBreakdown: technicalComplexity, timeToMvp (realistic for 1 person — typically 3-6 months for MVP), teamSize (MUST be "1 person" — this is for a solo indie developer), keyTechnicalChallenges, requiredExpertise.
- feasibilityAssessment: Be brutally honest. isRealistic, score 0-100, reasoning, majorBlockers, costEstimate (MUST target solo builder budget: $500-$5,000 for MVP using free tiers and open-source tools — NOT $50K+ enterprise budgets).
- marketViability: score 0-100, willMakeDifference, reasoning, revenueModel (realistic indie pricing: $5-$15/month or freemium — NOT enterprise pricing), userAcquisitionStrategy (organic/low-budget channels suitable for solo builders), competitiveAdvantageType.
- aiRecommendation: verdict (strong_yes/yes/maybe/no/strong_no), summary. warnings MUST include "No direct competitors found — demand validation needed". goNoGoFactors (4-6 with go/caution/no_go) — include a "Market Demand" factor with caution or no_go assessment explaining the lack of competitors.

CRITICAL CONTEXT: The target builder is a SOLO INDIE DEVELOPER with a limited budget. All estimates for cost, team size, timeline, and pricing MUST reflect this reality. Do NOT suggest enterprise-scale budgets ($50K+), multi-person teams, or aggressive pricing ($20+/month for a new unproven app).`;
  } else {
    // Cap at top 10 competitors for prompt efficiency, add compact summaries for the rest
    const sortedCompetitors = [...competitors].sort((a, b) => b.score.compositeScore - a.score.compositeScore);
    const topCompetitors = sortedCompetitors.slice(0, 10);
    const extraCompetitors = sortedCompetitors.slice(10);

    const competitorSummaries = topCompetitors
      .map((opp) => {
        const featureGaps = opp.sentiment.painPoints
          .filter((p) => p.category === "feature_gap" || !p.category)
          .map((p) => `[${p.severity}] ${p.issue}`)
          .join("; ");
        const technicalIssues = opp.sentiment.painPoints
          .filter((p) => p.category === "technical")
          .map((p) => `[${p.severity}] ${p.issue}`)
          .join("; ");
        const monetizationValidated = opp.sentiment.painPoints
          .filter((p) => p.category === "monetization")
          .map((p) => p.issue)
          .join("; ");
        const featureRequests = opp.sentiment.featureRequests
          .map((f) => `[${f.demand}] ${f.feature}`)
          .join("; ");
        const praised = opp.sentiment.praisedAspects.join(", ");
        const pricing = opp.scrapedApp.free === true ? "Free" : opp.scrapedApp.priceText || "Paid";
        const iap = opp.scrapedApp.offersIAP ? " (has IAP)" : "";
        return `### "${opp.scrapedApp.title}" (ID: ${opp.scrapedApp.id}) — ${opp.scrapedApp.score}/5, ${opp.scrapedApp.ratings.toLocaleString()} ratings, ${opp.scrapedApp.installs}
${opp.scrapedApp.genre} | ${opp.sentiment.overallSentiment} | Composite: ${opp.score.compositeScore}/100
Pricing: ${pricing}${iap}
Feature Gaps: ${featureGaps || "None"}
Wants: ${featureRequests || "None"}
Technical Issues: ${technicalIssues || "None"}
Monetization Validated: ${monetizationValidated || "None (no pricing complaints = unproven monetization)"}
Liked: ${praised || "None"}`;
      })
      .join("\n\n");

    const extraSummaries = extraCompetitors.length > 0
      ? "\n\nADDITIONAL COMPETITORS (summary only):\n" + extraCompetitors.map(
          (opp) => `"${opp.scrapedApp.title}" (ID: ${opp.scrapedApp.id}) — ${opp.scrapedApp.score}/5, ${opp.scrapedApp.ratings.toLocaleString()} ratings, ${opp.scrapedApp.installs}`
        ).join("\n")
      : "";

    prompt = `You are a product strategist who finds proven app formats with exploitable feature gaps.
Your job is NOT to collect complaints — it's to identify successful app models where key features are missing or could be done significantly better. Then critically assess whether it's worth building.

PROVEN FORMAT PRINCIPLE: Every analysis should be grounded in what is already proven to work in the market. You are looking for successful models with exploitable feature gaps — not just collecting complaints. Specifically:
- Identify the top-performing apps (highest installs, highest ratings count) as PROVEN FORMATS
- Analyze what makes them successful (praised aspects, core features)
- Then find where they fall short in FUNCTIONALITY (feature gaps)
- Build the Master Idea around filling those gaps while preserving what works
- Technical fixes and quality improvements are secondary layers

ANALYSIS PRIORITY ORDER:
1. FEATURE GAPS (highest priority): What capabilities are missing from successful apps in this sector? What do users explicitly request that no competitor provides? These gaps are the core opportunity.
2. FEATURE IMPROVEMENTS: Where can existing successful features be enhanced, combined, or reimagined in ways competitors haven't done?
3. TECHNICAL ISSUES (supporting only): Recurring technical problems (crashes, poor performance) to avoid in our implementation. These inform quality requirements, NOT the core idea.

MONETIZATION IS NOT A WEAKNESS: Do NOT treat user complaints about paywalls, subscriptions, or pricing as flaws. These complaints validate that the monetization model works. A successful app with paywall complaints means "users value the product enough to discuss its pricing" — that's a positive signal.

CRITICAL — FREE ACCESS IS NOT A DEFAULT FEATURE: Do NOT automatically include "free access", "no paywall", "meaningful free tier", or "no credit card required" as a core feature or critical differentiator UNLESS at least 2 successful competitors in the dataset already offer meaningful free tiers. If ALL successful competitors use paywalls (which is normal for mobile apps), the Master Idea MUST also recommend a paywall — the market has proven this works. "Free access" as a core feature when no competitor offers it is a path to zero revenue, NOT a competitive advantage. Match the market's monetization model, then differentiate on FEATURES and QUALITY, not on giving things away for free.

PRIORITY HIERARCHY FOR CORE FEATURES:
1. FEATURE GAPS (highest priority): Capabilities that successful apps DON'T have.
   At least 4 of your 5-8 coreFeatures MUST be feature gaps identified from the 'Wants' data.
2. FEATURE IMPROVEMENTS: Existing features done poorly by competitors.
   At most 2 of your coreFeatures may be improvements.
3. TECHNICAL FIXES (lowest priority, excluded from coreFeatures):
   Crashes, performance issues, etc. — mention ONLY in competitorFlaws, never as a core feature.

VALIDATION: If any coreFeature is primarily a technical fix (e.g., "faster loading", "fewer crashes", "better stability"),
REPLACE IT with a feature gap or improvement.

ORIGINAL APP IDEA:
${ideaText}

SEARCH STRATEGY: ${searchStrategy.queries.join(", ")} | Categories: ${searchStrategy.categories.join(", ")} | ${searchStrategy.reasoning}

COMPETITOR ANALYSIS (${competitors.length} apps):
${competitorSummaries}${extraSummaries}

IMPORTANT: Only reference competitors that are DIRECTLY relevant to the user's idea domain. If a competitor is from a different category (e.g. a language learning app when the idea is about speech coaching, or an education app unrelated to the core concept), ignore it entirely — do not include it in competitorFlaws, do not reference its data, and do not let it influence the analysis. Focus exclusively on apps that a user of the proposed product would actually consider as alternatives.

Create a MASTER IDEA that: starts from the user's vision, fills the biggest feature gaps that no competitor addresses well, then layers in fixes for recurring competitor pain points, preserves competitor strengths, and has a unique differentiating angle.

REQUIREMENTS:
- name: Creative memorable name. tagline: One-line value prop (<100 chars). description: 2-3 paragraphs.
- coreFeatures (5-8): Lead with FEATURE GAP opportunities — capabilities missing from the market that users are requesting. At least 3 of the 5-8 features must address unmet feature requests (from the 'Wants' data). The remaining may address recurring technical pain points. addressesFlaws: use EXACT text from Wants or Pain data above. evidenceAppIds: relevant competitor IDs. priority: critical/high/medium.
- COMPETITORFLAWS FILTER: In the competitorFlaws array, ONLY include apps that are directly relevant to the user's app idea (same category or use-case). Do NOT include apps from unrelated categories. If a competitor's genre, title, or description clearly indicates it serves a different domain (e.g., guitar learning when the idea is speech coaching), EXCLUDE it from competitorFlaws entirely even if it appeared in the competitor data.
- competitorFlaws: For EACH relevant competitor — flaws, featureGaps, strengths, marketData (installs, rating, ratings). Use competitor app IDs above.
- uniqueValueProps (3-5), targetAudience, estimatedDifficulty, confidenceScore (0-100).
- marketOpportunity: Do NOT cite global market sizes ("$180B skincare market"). Instead estimate the ADDRESSABLE market for a solo indie app: how many potential users exist based on competitor data above? Ground claims in actual metrics. Example: "Top 5 competitors have 5,000+ combined ratings, indicating 50,000-200,000 potential users. Capturing 1-3% (1,500-5,000 users) in 12 months is realistic."
- difficultyBreakdown: technicalComplexity, timeToMvp (realistic for 1 person — typically 3-6 months for MVP), teamSize (MUST be "1 person" — this is for a solo indie developer), keyTechnicalChallenges, requiredExpertise.
- feasibilityAssessment: Be brutally honest. isRealistic, score 0-100, reasoning, majorBlockers, costEstimate (MUST target solo builder budget: $500-$5,000 for MVP using free tiers and open-source tools — NOT $50K+ enterprise budgets).
- marketViability: score 0-100, willMakeDifference, reasoning, revenueModel (Research what monetization models are PROVEN and successful in this specific sector. Look at actual pricing structures used by successful competitors above. Recommend a model based on what works in the market, regardless of negative user sentiment about paywalls or pricing. If competitors charge $9.99/month and have millions of users, that price point is validated. Realistic indie pricing: $5-$15/month or freemium.), userAcquisitionStrategy (organic/low-budget channels suitable for solo builders), competitiveAdvantageType.
PRICING VALIDATION: When recommending a price point, you MUST cite specific competitors as evidence. Format: "Competitor X charges $Y/month and has Z ratings, validating this price point." If 3+ competitors use freemium with a specific price tier, that IS the validated pricing model for this space. Do NOT criticize pricing models that have large proven user bases — if users pay, it works.
- aiRecommendation: verdict (strong_yes/yes/maybe/no/strong_no), summary, warnings, goNoGoFactors (4-6 with go/caution/no_go).

CRITICAL CONTEXT: The target builder is a SOLO INDIE DEVELOPER with a limited budget. All estimates for cost, team size, timeline, and pricing MUST reflect this reality. Do NOT suggest enterprise-scale budgets ($50K+), multi-person teams, or aggressive pricing ($20+/month for a new unproven app).`;
  }

  const result = await callAIStructured<Omit<MasterIdea, "originalIdea" | "searchStrategy">>(
    prompt,
    masterIdeaSchema,
    "MasterIdea",
    "Synthesized master app concept from competitor analysis",
    signal,
    modelOverride ?? SCOUT_MODEL,
    12288,
  );

  // Replace AI-generated marketData with real scraped values
  if (competitors.length > 0 && result.competitorFlaws) {
    const competitorById = new Map(
      competitors.map((opp) => [opp.scrapedApp.id, opp.scrapedApp])
    );
    const competitorByName = new Map(
      competitors.map((opp) => [opp.scrapedApp.title.toLowerCase(), opp.scrapedApp])
    );

    for (const cf of result.competitorFlaws) {
      const realApp = competitorById.get(cf.competitorAppId)
        ?? competitorByName.get(cf.competitorName.toLowerCase());
      if (realApp) {
        cf.marketData = {
          installs: realApp.installs,
          rating: realApp.score,
          ratings: realApp.ratings,
        };
        cf.competitorAppId = realApp.id;
      }
    }

    // Filter out competitor flaws for apps not in the actual competitors list
    const validIds = new Set(competitors.map((opp) => opp.scrapedApp.id));
    const beforeCount = result.competitorFlaws.length;
    result.competitorFlaws = result.competitorFlaws.filter((cf) => validIds.has(cf.competitorAppId));
    const removedCount = beforeCount - result.competitorFlaws.length;
    if (removedCount > 0) {
      console.log(`[scout] Removed ${removedCount} competitor flaws with unmatched app IDs`);
    }
  }

  // Validate marketOpportunity doesn't cite global market sizes
  if (result.marketOpportunity) {
    const globalMarketPattern = /\$\d+(?:\.\d+)?\s*(?:billion|trillion|B\b|T\b)/i;
    if (globalMarketPattern.test(result.marketOpportunity)) {
      console.warn("[scout] marketOpportunity cites global market size — sanitizing");
      result.marketOpportunity = result.marketOpportunity.replace(
        /(?:The\s+)?(?:global\s+)?(?:\w+\s+)*market\s+(?:is\s+)?(?:worth\s+|valued\s+at\s+|estimated\s+at\s+)?\$\d+(?:\.\d+)?\s*(?:billion|trillion|B|T)\b[^.]*\.\s*/gi,
        ""
      ).trim();
      if (!result.marketOpportunity) {
        result.marketOpportunity = "Market opportunity based on competitor install data — see competitor analysis for specific numbers.";
      }
    }
  }

  // Validate cost estimate against solo builder budget
  if (result.feasibilityAssessment?.costEstimate) {
    const costMatches = result.feasibilityAssessment.costEstimate.match(/\$\s*([\d,]+)/g);
    if (costMatches) {
      const exceedsLimit = costMatches.some((match) => {
        const num = parseInt(match.replace(/[\$,\s]/g, ""), 10);
        return !isNaN(num) && num > 10000;
      });
      if (exceedsLimit) {
        if (!result.aiRecommendation) {
          (result as Record<string, unknown>).aiRecommendation = { verdict: "maybe", summary: "", warnings: [], goNoGoFactors: [] };
        }
        const rec = result.aiRecommendation!;
        if (!Array.isArray(rec.warnings)) {
          rec.warnings = [];
        }
        rec.warnings.push("Cost estimate exceeds $10K solo builder budget");
      }
    }
  }

  return {
    ...result,
    originalIdea: ideaText,
    searchStrategy,
  };
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
  provenFormatAnalysis: z.object({
    topPerformer: z.string(),
    successFactors: z.array(z.string()),
    featureBaseline: z.array(z.string()),
    exploitableGaps: z.array(z.string()),
  }).optional(),
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
   - Composite score: ${opp.score.compositeScore}/100`;
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
4. gapScore: Score gaps based on FEATURE OPPORTUNITIES in proven formats, not just complaint volume. A high-rated app (4.5★) with a missing feature is a bigger opportunity than a low-rated app (2.0★) that's broken — because the proven format validates demand. 0-100 scale (100 = massive feature gap, easy to differentiate).

IMPORTANT: Do NOT list monetization strategies (paywalls, subscription pricing, in-app purchases) as "pain points to exploit." Users complain about paying, but successful monetization validates the revenue model. Focus featureGaps on missing FUNCTIONALITY, not pricing structure.

Also provide:
- ideaSummary: A concise 1-2 sentence summary of what the proposed app would do
- uniqueAdvantages: List of unique advantages the proposed idea has over ALL competitors
- marketPositioning: How the app should position itself in the market to stand out

PROVEN FORMAT ANALYSIS (required):
1. Identify the TOP PERFORMER — the app with the most installs + highest ratings count. This is the PROVEN FORMAT that validates demand.
2. List its SUCCESS FACTORS — what makes it successful (from praised aspects, high ratings).
3. Define the FEATURE BASELINE — features that ALL or most top apps share. These are table-stakes.
4. Identify EXPLOITABLE GAPS — where the top performer falls SHORT in functionality (from feature gaps and requests, NOT technical issues).
5. These exploitable gaps in the proven format represent the HIGHEST-VALUE opportunities for a new entrant.`,
    gapAnalysisSchema,
    "GapAnalysis",
    "Competitive gap analysis between an app idea and existing competitors",
    signal,
    SCOUT_MODEL,
    6144,
  );
}

// --- Discovery Mode Functions ---

export interface DiscoveryAngle {
  angle: string;
  reasoning: string;
  searchQueries: string[];
}

const discoveryAngleSchema = z.object({
  angle: z.string(),
  reasoning: z.string(),
  searchQueries: z.array(z.string()),
});

/**
 * When user provides NO focus text — AI analyzes shuffled category apps and picks an underserved niche.
 */
export async function generateDiscoveryAngle(
  category: string,
  categoryLabel: string,
  store: AppStore,
  appSummaries: string,
  signal?: AbortSignal,
): Promise<DiscoveryAngle> {
  const storeLabel = store === "google_play" ? "Google Play" : "App Store";

  return callAIStructured<DiscoveryAngle>(
    `You are a creative app market researcher who specializes in finding UNDERSERVED niches within app categories.

CATEGORY: ${categoryLabel} (${category}) on ${storeLabel}

Here are summaries of existing apps in this category (randomized sample):
${appSummaries}

YOUR TASK:
Analyze the landscape of existing apps above and identify a SPECIFIC underserved niche or angle that is NOT well-served by current apps. Be creative and specific — avoid generic or obvious ideas.

Look for:
- User segments that are poorly served (age groups, professions, lifestyles)
- Use cases that existing apps handle poorly or ignore
- Emerging trends or needs that current apps haven't adapted to
- Intersection opportunities between this category and adjacent domains
- Pain points that multiple apps share but none have solved

IMPORTANT: Vary your choices. Do NOT always pick the most obvious niche. Consider unconventional angles.

Return:
- angle: A clear, specific description of the underserved niche (1-2 sentences). E.g., "Productivity tools for shift workers who need flexible scheduling around irregular hours"
- reasoning: Why this niche is underserved based on the apps you see (2-3 sentences)
- searchQueries: 8-12 search queries to find apps that attempt to serve this niche (include direct competitors, feature searches, problem searches, adjacent solutions)`,
    discoveryAngleSchema,
    "DiscoveryAngle",
    "AI-discovered underserved niche within an app category",
    signal,
    SCOUT_MODEL,
    2048,
  );
}

/**
 * When user DOES provide a focus text — generate targeted search queries combining the focus with the category.
 */
export async function generateDiscoverySearchStrategy(
  category: string,
  categoryLabel: string,
  focusText: string,
  store: AppStore,
  signal?: AbortSignal,
): Promise<SearchStrategy> {
  const storeLabel = store === "google_play" ? "Google Play" : "App Store";

  const categoryList = store === "google_play"
    ? "TOOLS, PRODUCTIVITY, HEALTH_AND_FITNESS, FINANCE, EDUCATION, BUSINESS, LIFESTYLE, TRAVEL_AND_LOCAL, FOOD_AND_DRINK, SHOPPING, SOCIAL, COMMUNICATION, PHOTOGRAPHY, WEATHER, MUSIC_AND_AUDIO"
    : "6002 (Utilities), 6007 (Productivity), 6013 (Health & Fitness), 6015 (Finance), 6017 (Education), 6000 (Business), 6012 (Lifestyle), 6003 (Travel), 6023 (Food & Drink), 6024 (Shopping), 6005 (Social Networking), 6008 (Photo & Video), 6001 (Weather), 6011 (Music)";

  return callAIStructured<SearchStrategy>(
    `Expert app market researcher. Generate a search strategy to find apps in the ${categoryLabel} category on ${storeLabel} that are relevant to a specific user focus.

CATEGORY: ${categoryLabel} (${category})
USER FOCUS: ${focusText}

The user wants to discover app opportunities in ${categoryLabel} specifically focused on: "${focusText}".

Generate:
- queries (8-12): Diverse search queries combining the category with the focus. Include:
  1. Direct searches: "${focusText}" + category terms
  2. Specific app names that might serve this niche
  3. Problem-oriented queries (what pain point does this focus address?)
  4. Feature-oriented queries (what features would such an app need?)
  5. Adjacent solutions that partially address this focus
- categories (1-2): Store category IDs from: ${categoryList}. Return category VALUE only.
- reasoning: Brief explanation of the search approach.
- filters: Relaxed — minInstalls: 5000, maxRating: 5, minRatings: 50 (we want to find niche apps too).`,
    searchStrategySchema,
    "DiscoverySearchStrategy",
    "Search strategy for discovery mode with user-provided focus",
    signal,
    SCOUT_MODEL,
    4096,
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
    signal,
    SCOUT_MODEL,
    2048,
  );
}
