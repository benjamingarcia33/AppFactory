import { z } from "zod";
import type { Opportunity, MasterIdea } from "@/lib/types";

// Discriminated union for architect input context
export type ArchitectContext =
  | { type: "opportunity"; opportunity: Opportunity }
  | { type: "masterIdea"; masterIdea: MasterIdea; opportunities: Opportunity[] };

// ============================================
// Architect Agent - Prompt Builders
// Each function returns a string prompt for AI generation
// ============================================

// --- Zod Schemas for Structured Output (Steps 1-4) ---

export const aiExpectationsSchema = z.object({
  coreExpectations: z.array(z.object({
    capability: z.string(),
    description: z.string(),
    importance: z.enum(["critical", "high", "medium"]),
  })),
  aiEnhancements: z.array(z.object({
    painPoint: z.string(),
    aiSolution: z.string(),
    expectedImpact: z.string(),
  })),
  featurePriorities: z.array(z.object({
    feature: z.string(),
    impact: z.enum(["critical", "high", "medium", "low"]),
    feasibility: z.enum(["high", "medium", "low"]),
    aiIntegration: z.string(),
  })),
  uxVision: z.object({
    overallExperience: z.string(),
    keyDifferences: z.array(z.string()),
    emotionalTone: z.string(),
  }),
  unmetNeeds: z.array(z.object({
    need: z.string(),
    description: z.string(),
  })),
  antiPatterns: z.array(z.object({
    pattern: z.string(),
    type: z.enum(["preserve", "avoid"]),
    reasoning: z.string(),
  })),
  ageRating: z.enum(["4+", "9+", "12+", "17+"]).describe("Recommended App Store/Play Store age rating"),
});

export const strategicPlanSchema = z.object({
  personas: z.array(z.object({
    name: z.string(),
    profile: z.string(),
    frustrations: z.array(z.string()),
    goals: z.array(z.string()),
    willingnessToPay: z.string(),
  })),
  positioning: z.object({
    valueProposition: z.string(),
    differentiators: z.array(z.string()),
    positioningStatement: z.string(),
  }),
  revenueModel: z.object({
    strategy: z.string(),
    tiers: z.array(z.object({
      name: z.string(),
      price: z.string(),
      features: z.array(z.string()),
    })),
    projectedArpu: z.string().describe("Dollar amount like '$9.99/month'"),
  }),
  goToMarket: z.object({
    launchChannels: z.array(z.string()),
    first90DaysPlan: z.string(),
    keyMetrics: z.array(z.string()),
  }),
  competitiveMoat: z.array(z.object({
    advantage: z.string(),
    description: z.string(),
  })),
});

export const aiApproachSchema = z.object({
  modelsAndApis: z.array(z.object({
    useCase: z.string(),
    model: z.string(),
    rationale: z.string(),
  })),
  dataStrategy: z.object({
    dataNeeded: z.array(z.string()),
    collectionApproach: z.string(),
    complianceNotes: z.string(),
  }),
  architecture: z.object({
    processingModel: z.string(),
    apiArchitecture: z.string(),
    cachingStrategy: z.string(),
    fallbackMechanisms: z.array(z.string()),
  }),
  costAnalysis: z.object({
    estimatedCostPerUser: z.string(),
    optimizationStrategies: z.array(z.string()),
  }),
  risks: z.array(z.object({
    risk: z.string(),
    mitigation: z.string(),
  })),
});

export const devPlanSchema = z.object({
  mvpScope: z.object({
    coreFeatures: z.array(z.string()),
    deferredFeatures: z.array(z.string()),
    definitionOfDone: z.string(),
    timeline: z.string(),
  }),
  techStack: z.object({
    frontend: z.string(),
    backend: z.string(),
    database: z.string(),
    aiIntegration: z.string(),
    infrastructure: z.string(),
  }),
  twelveWeekPlan: z.array(z.object({
    weeks: z.string(),
    focus: z.string(),
    deliverables: z.array(z.string()),
  })).min(1),
  testingStrategy: z.object({
    unitTesting: z.string(),
    integrationTesting: z.string(),
    aiQualityTesting: z.string(),
    performanceTesting: z.string(),
    abTesting: z.string(),
  }),
  launchChecklist: z.array(z.object({
    item: z.string(),
    category: z.string(),
  })),
});

function formatOpportunityContext(opportunity: Opportunity): string {
  const { scrapedApp, sentiment, score, reviews } = opportunity;

  const topPainPoints = sentiment.painPoints
    .slice(0, 5)
    .map(
      (p) =>
        `- [${p.severity}/${p.frequency}] ${p.issue}${p.sampleQuotes.length > 0 ? ` (e.g., "${p.sampleQuotes[0]}")` : ""}`
    )
    .join("\n");

  const topFeatureRequests = sentiment.featureRequests
    .slice(0, 5)
    .map(
      (f) =>
        `- [${f.demand} demand] ${f.feature}${f.sampleQuotes.length > 0 ? ` (e.g., "${f.sampleQuotes[0]}")` : ""}`
    )
    .join("\n");

  const sampleNegativeReviews = reviews
    .filter((r) => r.score <= 2)
    .slice(0, 5)
    .map((r) => `- "${r.text}" (${r.score}/5 stars)`)
    .join("\n");

  const samplePositiveReviews = reviews
    .filter((r) => r.score >= 4)
    .slice(0, 3)
    .map((r) => `- "${r.text}" (${r.score}/5 stars)`)
    .join("\n");

  return `
APP DETAILS:
- Name: ${scrapedApp.title}
- Store: ${scrapedApp.store === "google_play" ? "Google Play" : "App Store"}
- Category: ${scrapedApp.genre}
- Rating: ${scrapedApp.score}/5 (${scrapedApp.ratings.toLocaleString()} ratings)
- Installs: ${scrapedApp.installs}
- Developer: ${scrapedApp.developer}
- Description: ${scrapedApp.description.slice(0, 500)}${scrapedApp.description.length > 500 ? "..." : ""}

OPPORTUNITY SCORES:
- Market Size: ${score.marketSize}/100
- User Dissatisfaction: ${score.dissatisfaction}/100
- AI Feasibility: ${score.feasibility}/100
- Composite Score: ${score.compositeScore}/100

SENTIMENT OVERVIEW:
- Overall: ${sentiment.overallSentiment}
- Summary: ${sentiment.summary}
- Praised Aspects: ${sentiment.praisedAspects.join(", ")}

TOP PAIN POINTS:
${topPainPoints || "None identified"}

TOP FEATURE REQUESTS:
${topFeatureRequests || "None identified"}

SAMPLE NEGATIVE REVIEWS:
${sampleNegativeReviews || "None available"}

SAMPLE POSITIVE REVIEWS (what to preserve):
${samplePositiveReviews || "None available"}
`.trim();
}

/**
 * Compact opportunity context for steps 2-4 and document generation.
 * Omits sample quotes, sample reviews, and truncates description further.
 */
export function formatCompactOpportunityContext(opportunity: Opportunity): string {
  const { scrapedApp, sentiment, score } = opportunity;

  const topPainPoints = sentiment.painPoints
    .slice(0, 5)
    .map((p) => `- [${p.severity}/${p.frequency}] ${p.issue}`)
    .join("\n");

  const topFeatureRequests = sentiment.featureRequests
    .slice(0, 5)
    .map((f) => `- [${f.demand} demand] ${f.feature}`)
    .join("\n");

  return `
APP: ${scrapedApp.title} (${scrapedApp.store === "google_play" ? "Google Play" : "App Store"}, ${scrapedApp.genre})
Rating: ${scrapedApp.score}/5 (${scrapedApp.ratings.toLocaleString()} ratings) | Installs: ${scrapedApp.installs}
Description: ${scrapedApp.description.slice(0, 200)}${scrapedApp.description.length > 200 ? "..." : ""}

SCORES: Market ${score.marketSize} | Dissatisfaction ${score.dissatisfaction} | AI Feasibility ${score.feasibility} | Composite ${score.compositeScore}

SENTIMENT: ${sentiment.overallSentiment} — ${sentiment.summary}

PAIN POINTS:
${topPainPoints || "None identified"}

FEATURE REQUESTS:
${topFeatureRequests || "None identified"}
`.trim();
}

export function formatMasterIdeaContext(masterIdea: MasterIdea, opportunities: Opportunity[]): string {
  const competitorDetails = masterIdea.competitorFlaws
    .map((cf, i) => {
      const opp = opportunities.find((o) => o.scrapedApp.id === cf.competitorAppId);
      const negReviews = opp?.reviews
        .filter((r) => r.score <= 2)
        .slice(0, 3)
        .map((r) => `- "${r.text}" (${r.score}/5 stars)`)
        .join("\n") ?? "";
      return `${i + 1}. "${cf.competitorName}" (${cf.marketData.installs} installs, ${cf.marketData.rating}/5, ${cf.marketData.ratings} ratings)
   Flaws: ${cf.flaws.join("; ")}
   Feature Gaps: ${cf.featureGaps.join("; ")}
   Strengths: ${cf.strengths.join("; ")}${negReviews ? `\n   Sample Negative Reviews:\n${negReviews}` : ""}`;
    })
    .join("\n\n");

  const coreFeatures = masterIdea.coreFeatures
    .map((f) => `- [${f.priority}] ${f.name}: ${f.description} (addresses: ${f.addressesFlaws.join(", ")})`)
    .join("\n");

  return `
MASTER IDEA: ${masterIdea.name}
Tagline: ${masterIdea.tagline}
Original User Idea: ${masterIdea.originalIdea}
Estimated Difficulty: ${masterIdea.estimatedDifficulty}
Confidence Score: ${masterIdea.confidenceScore}/100

CONCEPT DESCRIPTION:
${masterIdea.description}

CORE FEATURES:
${coreFeatures}

UNIQUE VALUE PROPOSITIONS:
${masterIdea.uniqueValueProps.map((p) => `- ${p}`).join("\n")}

TARGET AUDIENCE: ${masterIdea.targetAudience}
MARKET OPPORTUNITY: ${masterIdea.marketOpportunity}

COMPETITOR FIELD ANALYSIS (${masterIdea.competitorFlaws.length} competitors):
${competitorDetails}

SEARCH STRATEGY:
- Queries used: ${masterIdea.searchStrategy.queries.join(", ")}
- Categories: ${masterIdea.searchStrategy.categories.join(", ")}
- Reasoning: ${masterIdea.searchStrategy.reasoning}
`.trim();
}

export function formatCompactMasterIdeaContext(masterIdea: MasterIdea): string {
  const coreFeatures = masterIdea.coreFeatures
    .slice(0, 6)
    .map((f) => `- [${f.priority}] ${f.name}: ${f.description}`)
    .join("\n");

  const competitors = masterIdea.competitorFlaws
    .map((cf) => `- "${cf.competitorName}" (${cf.marketData.rating}/5, ${cf.marketData.installs}): flaws=${cf.flaws.length}, gaps=${cf.featureGaps.length}`)
    .join("\n");

  return `
MASTER IDEA: ${masterIdea.name} — ${masterIdea.tagline}
Original Idea: ${masterIdea.originalIdea}
Difficulty: ${masterIdea.estimatedDifficulty} | Confidence: ${masterIdea.confidenceScore}/100

DESCRIPTION: ${masterIdea.description.slice(0, 400)}${masterIdea.description.length > 400 ? "..." : ""}

CORE FEATURES:
${coreFeatures}

UNIQUE VALUE PROPS: ${masterIdea.uniqueValueProps.join("; ")}

TARGET AUDIENCE: ${masterIdea.targetAudience}
MARKET OPPORTUNITY: ${masterIdea.marketOpportunity}

COMPETITORS:
${competitors}
`.trim();
}

// Last verified: 2026-03-21
export const CURRENT_TECH_VERSIONS = `CURRENT TECHNOLOGY VERSIONS (as of March 2026 — use ONLY these, never older):
- Expo SDK 55, React Native 0.83+, React 19.x
- Expo Router: v55.x (now matches SDK version numbering)
- Next.js 16 (App Router)
- Deepgram Nova-3, ElevenLabs Eleven v3 (Turbo v2.5 for real-time)
- Claude 4.6 Sonnet / Claude 4.6 Opus (NOT Claude 3.5 Sonnet)
- OpenAI GPT-5.4 / GPT-5.4 Mini / o3 / o4-mini (NOT GPT-4.1 or GPT-4o — retired Feb 2026)
- Google Gemini 2.5 Pro/Flash, Gemini 3.1 Pro Preview (Gemini 2.0 Flash retiring Jun 2026)
- Supabase JS v2, Drizzle ORM
- Stripe React Native SDK 0.39+, RevenueCat SDK 9+
- Algolia: v4.x client SDK
- Meilisearch: v1.x
- Upstash Redis: @upstash/redis latest
- shadcn/ui: latest (copy-paste, no version lock)
- Background Jobs: Inngest v3.x OR Trigger.dev v3.x (pick ONE — they are alternatives, not complementary)
- Sanity: v3.x Studio + next-sanity
- Payload CMS: v3.x (Next.js native)
- Mux: @mux/mux-player latest + mux-node SDK
- Zustand: v5.x (with immer middleware)
- TanStack Query: v5.x (@tanstack/react-query)
- React Hook Form: v7.x + @hookform/resolvers
- NativeWind: v4.x (Tailwind CSS for React Native)
- React Native Reanimated: v4.x
- Zod: v4.x (schema validation)
- TanStack Router: v1.x (type-safe web routing)
Do NOT reference older versions (SDK 52 or earlier, Nova-2, Claude 3.5, Claude 4.5 Sonnet, RN 0.76 or earlier, GPT-4o, GPT-4.1, Gemini 2.0 Flash).

DEPRECATED PACKAGES — do NOT use:
- expo-barcode-scanner: REMOVED in SDK 52. Use expo-camera with barcode scanning mode instead.
- @tensorflow/tfjs-react-native: Outdated/heavy. Use react-native-fast-tflite for on-device ML inference.
- GPT-4o / GPT-4.1: RETIRED Feb 2026. Use GPT-5.4 or GPT-5.4 Mini.
- sentry-expo: DEPRECATED. Use @sentry/react-native directly.

When referencing AI models, use these knowledge base slugs:
- Claude 4.6 Sonnet / Claude 4.6 Opus → slug: claude-api
- OpenAI GPT-5.4 / GPT-5.4 Mini / o3 → slug: openai-gpt4
- OpenAI Vision (GPT-5.4 with vision / o4-mini with vision) → slug: openai-vision
- TensorFlow Lite (via react-native-fast-tflite) / Core ML → slug: tensorflow-lite
- Deepgram Nova-3 → slug: deepgram
- ElevenLabs → slug: elevenlabs-tts
- AssemblyAI → slug: assemblyai`;

function getContextAndLabel(ctx: ArchitectContext): { full: string; compact: string; label: string; altLabel: string } {
  if (ctx.type === "opportunity") {
    return {
      full: formatOpportunityContext(ctx.opportunity),
      compact: formatCompactOpportunityContext(ctx.opportunity),
      label: ctx.opportunity.scrapedApp.title,
      altLabel: `an AI-powered alternative to ${ctx.opportunity.scrapedApp.title}`,
    };
  }
  return {
    full: formatMasterIdeaContext(ctx.masterIdea, ctx.opportunities),
    compact: formatCompactMasterIdeaContext(ctx.masterIdea),
    label: ctx.masterIdea.name,
    altLabel: `${ctx.masterIdea.name} — a synthesized concept backed by ${ctx.masterIdea.competitorFlaws.length} competitor analyses`,
  };
}

export function buildAiExpectationsPrompt(ctx: ArchitectContext): string {
  const { full, label, altLabel } = getContextAndLabel(ctx);

  if (ctx.type === "masterIdea") {
    return `You are an expert product strategist specializing in AI-powered applications. Analyze the following synthesized app concept and answer: "What do users expect from ${altLabel}?"

${full}

Based on the competitor flaws, feature gaps, and user reviews above, provide a comprehensive analysis of what users would expect.

Analyze what makes the top competitors successful FIRST (praised aspects, high ratings, large install bases). Then identify feature gaps in those proven models. The goal is to build on proven success, not just fix complaints.

When analyzing competitor pricing/monetization, treat existing revenue models as proven and validated. User complaints about pricing indicate willingness to pay, not a flaw to exploit.

PAYWALL INTELLIGENCE: If successful competitors use paywalls (which is the norm in mobile apps), a paywall is a VALIDATED and PROVEN revenue approach. Do NOT automatically prioritize "free access" or "no paywall" as a critical differentiator. Only recommend a generous free tier as a critical feature if at least 2 successful competitors in the dataset already offer meaningful free tiers. If all competitors monetize behind paywalls and have high ratings, the market has validated that approach — recommend the SAME model with better value, not free access. "No paywall" is NOT automatically a competitive advantage; it is often a path to zero revenue.

GROUNDING RULE: When describing competitor issues, lawsuits, scandals, or controversies, always qualify with "according to user reviews" or "users report that..." — never state these as verified facts. A single user review claiming a competitor "has a lawsuit" is NOT evidence of an actual lawsuit. Only state facts that are directly verifiable from the scraped data (ratings, review text, app description).

Populate all schema fields: coreExpectations (table-stakes + differentiators with importance), aiEnhancements (how AI solves each major competitor flaw), featurePriorities (ranked by impact, feasibility, AI integration), uxVision (how ${label} should feel vs competitors), unmetNeeds (latent needs AI could address), antiPatterns (what to preserve/avoid from competitors). Reference actual competitor data.`;
  }

  // Legacy opportunity path
  const opportunity = ctx.opportunity;
  return `You are an expert product strategist specializing in AI-powered applications. Analyze the following app opportunity and answer the question: "What do users expect from ${altLabel}?"

${full}

Based on the pain points, feature requests, and user reviews above, provide a comprehensive analysis of what users would expect from an AI-powered alternative.

Analyze what makes ${opportunity.scrapedApp.title} successful FIRST (praised aspects, high ratings, large install base). Then identify feature gaps in this proven model. The goal is to build on proven success, not just fix complaints.

When analyzing competitor pricing/monetization, treat existing revenue models as proven and validated. User complaints about pricing indicate willingness to pay, not a flaw to exploit.

PAYWALL INTELLIGENCE: If successful competitors use paywalls (which is the norm in mobile apps), a paywall is a VALIDATED and PROVEN revenue approach. Do NOT automatically prioritize "free access" or "no paywall" as a critical differentiator. Only recommend a generous free tier as a critical feature if at least 2 successful competitors in the dataset already offer meaningful free tiers. If all competitors monetize behind paywalls and have high ratings, the market has validated that approach — recommend the SAME model with better value, not free access. "No paywall" is NOT automatically a competitive advantage; it is often a path to zero revenue.

GROUNDING RULE: When describing competitor issues, lawsuits, scandals, or controversies, always qualify with "according to user reviews" or "users report that..." — never state these as verified facts. A single user review claiming a competitor "has a lawsuit" is NOT evidence of an actual lawsuit. Only state facts that are directly verifiable from the scraped data (ratings, review text, app description).

Populate all schema fields: coreExpectations (table-stakes + differentiators with importance), aiEnhancements (how AI solves each pain point better than ${opportunity.scrapedApp.title}), featurePriorities (ranked by impact, feasibility, AI integration), uxVision (how the alternative should feel vs ${opportunity.scrapedApp.title}), unmetNeeds (latent needs AI could address), antiPatterns (what to preserve/avoid from praised aspects). Reference actual user quotes.`;
}

export function buildStrategicPlanningPrompt(
  ctx: ArchitectContext,
  aiExpectationsSummary: string
): string {
  const { compact, label } = getContextAndLabel(ctx);

  return `You are a senior business strategist specializing in AI SaaS products. Based on the app ${ctx.type === "masterIdea" ? "concept" : "opportunity"} and AI expectations analysis below, create a comprehensive business strategy.

${compact}

PREVIOUS ANALYSIS - AI EXPECTATIONS (summary):
${aiExpectationsSummary}

Generate a comprehensive business strategy. personas (3-4): name, profile, frustrations, goals, willingness to pay. positioning: value proposition, AI differentiators, positioning statement vs ${ctx.type === "masterIdea" ? label : label + " and competitors"}. revenueModel: strategy (freemium/subscription/etc), tiers with prices and features, projected ARPU. goToMarket: launch channels, 90-day plan, key metrics. competitiveMoat: sustainable AI advantages, data flywheel, network effects, switching costs. Be concrete with numbers and timelines.

CRITICAL PROJECTION CONSTRAINTS FOR SOLO INDIE DEVELOPER:
- Month 1 users: 50-200 (organic only, no ad spend). Month 6: 500-2,000. Month 12: 1,500-5,000 MAX.
- MRR projections: Month 3: $100-500. Month 6: $500-2,000. Month 12: $2,000-8,000. These are realistic indie benchmarks.
- Free-to-paid conversion: 2-5% is realistic for freemium mobile apps. Do NOT project above 8%.
- Do NOT include a Teams/Enterprise tier unless the user explicitly asks for B2B — solo developers should focus on B2C at launch.
- Pricing tiers: Maximum 2-3 tiers. Free + $5-$15/month is the indie standard. Do NOT price above $15/month for a new unproven app.
- COMPETITIVE MOAT SCALING: All moat claims must be grounded in solo indie scale (1,500-5,000 users at Month 12). Do NOT claim platform-scale effects requiring >10,000 users (e.g., "50,000+ catalog items", "millions of data points"). Network-effect claims must include realistic Month 12 numbers.
- FREE TIER DEFINITION: Define free tier explicitly with tier name, features list, and usage limits. This definition will be reused verbatim across all downstream documents.
- FREE TIER CALIBRATION: The free tier should be a TASTE, not a meal. It must create clear conversion pressure. If competitors successfully monetize with aggressive paywalls (e.g., paywall after first scan, paywall before results), do NOT offer a significantly more generous free tier — you will undercut your own revenue. Match or slightly improve the competitor free tier, do not demolish it. A free tier that gives away 80% of the value leaves no reason to upgrade.

PROVEN MONETIZATION PRINCIPLE: Base the revenue model on what is PROVEN to work in this sector. If Scout data shows competitors successfully charging $9.99/month with paywalls, that validates freemium + $9.99/month as the right model. User complaints about pricing are a POSITIVE signal — they mean users value the product enough to discuss its cost. Do NOT avoid proven monetization models because of negative sentiment. Paywalls are the STANDARD revenue model for mobile apps — they are not evil, they are how solo developers earn a living. Only offer free access to features that competitors also offer for free.`;
}

export function buildAiApproachPrompt(
  ctx: ArchitectContext,
  aiExpectationsSummary: string,
  strategicPlanSummary: string,
  techCatalog: string
): string {
  const { compact, label, altLabel } = getContextAndLabel(ctx);

  return `${CURRENT_TECH_VERSIONS}

You are a senior AI/ML architect and technical strategist. Based on the app ${ctx.type === "masterIdea" ? "concept" : "opportunity"} and previous analyses below, define the technical AI approach for building ${altLabel}.

${compact}

PREVIOUS ANALYSIS - AI EXPECTATIONS (summary):
${aiExpectationsSummary}

PREVIOUS ANALYSIS - STRATEGIC PLAN (summary):
${strategicPlanSummary}

AVAILABLE TECHNOLOGY CATALOG:
${techCatalog}

When designing the AI approach and selecting models/APIs, reference specific technologies from the catalog above where appropriate. Use their exact slugs when recommending specific services. Do NOT reference models or services not in the catalog unless absolutely necessary.

Populate all schema fields: modelsAndApis (model per use case with rationale), dataStrategy (data needs, collection, GDPR/CCPA compliance), architecture (on-device vs cloud, API architecture, caching, fallbacks), costAnalysis (per-user costs, optimization strategies), risks (hallucination, latency, vendor lock-in, scalability — each with concrete mitigation). Be specific and implementable.`;
}

export function buildDevTinkeringPrompt(
  ctx: ArchitectContext,
  previousStepsSummary: string
): string {
  const { compact, altLabel } = getContextAndLabel(ctx);

  return `${CURRENT_TECH_VERSIONS}

You are a senior full-stack developer and technical lead specializing in AI-powered applications. Based on the app ${ctx.type === "masterIdea" ? "concept" : "opportunity"} and all previous analyses, create a concrete development plan for building ${altLabel}.

${compact}

PREVIOUS ANALYSES (summaries):
${previousStepsSummary}

CRITICAL CONTEXT: This app will be built by a SOLO INDIE DEVELOPER. All plans MUST reflect this reality:
- Team size is 1 person. Do NOT suggest multi-person sprints, team roles, or parallel workstreams.
- Timeline should be 12-20 weeks for one person (not 12 weeks for a team).
- MVP scope should be 5-7 core features — aggressive but achievable for one person.
- Infrastructure budget: $50-$200/month using free tiers and managed services.
- Testing: unit tests on critical paths + manual QA. No dedicated QA team, no E2E test suites like Detox at launch.
- Beta testing: 10-20 users, not 50-100.
- Launch on ONE platform first (iOS or Android), not both simultaneously.

The twelveWeekPlan MUST cover all 12 weeks in 2-week blocks (6 entries minimum). Never truncate the plan early.

Populate all schema fields: mvpScope (5-7 core features, deferred features, definition of done, timeline), techStack (frontend, backend, database, aiIntegration, infrastructure — justify each), twelveWeekPlan (6+ entries covering foundation, core features, AI, polish, testing, launch), testingStrategy (unit, integration, AI quality, performance, A/B), launchChecklist (technical, store submission, monitoring, support, rollback, metrics). Be specific with technology versions and implementation details.`;
}

// ============================================
// Tech Selection Schema & Prompt (Step 5)
// ============================================

export const techSelectionSchema = z.object({
  platform: z.enum(["web-nextjs", "mobile-expo", "both"]),
  selectedTechnologies: z.array(z.object({
    techSlug: z.string(),
    category: z.string(),
    justification: z.string(),
    customizations: z.array(z.string()),
  })),
  appScreens: z.array(z.object({
    screenName: z.string(),
    patternSlug: z.string(),
    assignedTechSlugs: z.array(z.string()),
    customNotes: z.string(),
    promptOrder: z.number(),
  })),
  synergyNotes: z.array(z.object({
    techSlugA: z.string(),
    techSlugB: z.string(),
    note: z.string(),
  })),
  promptPlan: z.object({
    prompt1Screens: z.array(z.string()),
    prompt1Focus: z.string(),
    prompt2Screens: z.array(z.string()),
    prompt2Focus: z.string(),
    prompt3Screens: z.array(z.string()),
    prompt3Focus: z.string(),
  }),
  databaseSchema: z.array(z.object({
    tableName: z.string(),
    description: z.string(),
    columns: z.array(z.object({
      name: z.string(),
      type: z.string(),
      constraints: z.string(),
    })),
  })),
});

// Schema for AI-driven setup filtering
export const setupFilterSchema = z.object({
  filteredTechnologies: z.array(z.object({
    techSlug: z.string(),
    include: z.boolean(),
    reason: z.string(),
  })),
  filteredMcpServers: z.array(z.object({
    serverName: z.string(),
    include: z.boolean(),
    reason: z.string(),
  })),
  filteredPlugins: z.array(z.object({
    repoOrSkill: z.string(),
    include: z.boolean(),
    reason: z.string(),
  })),
  additionalRecommendations: z.array(z.string()),
});

export function buildSetupFilterPrompt(
  appName: string,
  appPurpose: string,
  platform: string,
  selectedTechs: Array<{ techSlug: string; category: string; justification: string }>,
  mcpServers: string[],
  plugins: Array<{ repo: string; skills: string[] }>,
): string {
  const techList = selectedTechs.map(t => `- ${t.techSlug} (${t.category}): ${t.justification}`).join("\n");
  const mcpList = mcpServers.map(s => `- ${s}`).join("\n");
  const pluginList = plugins.map(p => `- ${p.repo}: ${p.skills.join(", ")}`).join("\n");

  return `You are a project setup advisor for "${appName}" — ${appPurpose}.
Platform: ${platform}

Review each proposed inclusion and decide whether it should be included for THIS specific app. Remove anything that's generic/not needed.

## Proposed Technologies
${techList}

## Proposed MCP Servers
${mcpList}

## Proposed Plugin Marketplaces
${pluginList}

For each item, provide an include/exclude verdict with a brief reason specific to this app. Also suggest any additional recommendations for this specific app concept.

Be conservative — only exclude items that are clearly unnecessary for this app. When in doubt, include.`;
}

/**
 * Deterministic formatter for database schema from Step 5 structured output.
 * Produces a compact multi-line string for injection into EP and TechArch prompts.
 * Replaces the fragile regex-based extractSchemaAnchor() approach.
 */
export function formatSchemaAnchor(
  databaseSchema: Array<{ tableName: string; description: string; columns: Array<{ name: string; type: string; constraints: string }> }>
): string {
  if (!databaseSchema?.length) return "";
  const lines = databaseSchema.map(table => {
    const cols = table.columns.map(c => c.name).join(", ");
    return `- ${table.tableName}: ${cols}`;
  });
  return `Tables and canonical field names:\n${lines.join("\n")}`;
}

export function buildTechSelectionPrompt(
  ctx: ArchitectContext,
  allStepsSummary: string,
  techCatalog: string,
  screenCatalog: string,
): string {
  const { compact, altLabel } = getContextAndLabel(ctx);

  return `You are a senior solutions architect selecting specific technologies and mapping screens for building ${altLabel}.

${compact}

COMPLETED ANALYSES (summaries):
${allStepsSummary}

${techCatalog}

${screenCatalog}

Your job:
1. CHOOSE A PLATFORM: "web-nextjs" (Next.js web app), "mobile-expo" (Expo/React Native mobile app), or "both". Base this on the app concept — mobile-first apps that need camera/GPS/push notifications should be "mobile-expo"; business dashboards should be "web-nextjs".

2. SELECT TECHNOLOGIES: Pick specific technologies from the catalog above for each need this app has. Use the exact slug from the catalog. Only select what this app actually needs — don't include payments tech if the app is free, don't include maps if there's no location feature. For each, explain why it was chosen and any app-specific customizations.

3. MAP APP SCREENS: List every screen this app needs. For each screen:
   - Give it an app-specific name (e.g., "Recipe Feed", "Ingredient Scanner", not generic "Feed")
   - Map it to a screen pattern slug from the catalog
   - Assign the specific technology slugs used on that screen
   - Add custom notes about app-specific behavior
   - Set promptOrder (1, 2, or 3) for which execution prompt builds it

4. NOTE SYNERGIES: Flag any important integration notes between selected technologies.

5. PLAN 3 EXECUTION PROMPTS:
   - Prompt 1 (Foundation): Auth, database setup, navigation, settings, onboarding — screens with promptOrder=1
   - Prompt 2 (Core Features): Main app screens, AI features, primary user flows — screens with promptOrder=2
   - Prompt 3 (Polish & Extras): Secondary screens, payments, notifications, production readiness — screens with promptOrder=3

6. DEFINE DATABASE SCHEMA: List every database table the app needs. For each table:
   - Use snake_case for table and column names (e.g., "user_profiles", "routine_logs")
   - Every table MUST have: id (uuid, primary key), created_at (timestamp, default now()), updated_at (timestamp, default now())
   - Include all foreign keys with explicit "references table_name(id)" constraints
   - Use appropriate types: uuid for IDs, text for strings, timestamp for dates, jsonb for flexible data, integer for counts, boolean for flags
   - These exact names will be used VERBATIM in all execution prompts — choose carefully

Use ONLY the model names from the TECHNOLOGY CATALOG above. If previous steps reference different model names (e.g., older model versions), use the catalog names — the catalog is authoritative.

DECISION GATES — justify these selections if chosen:

BACKGROUND JOBS (inngest / trigger-dev): Only include if the app requires: parallel processing steps, automatic retries on failure, or long-running workflows (> 60s). If the app pipeline is simple (< 5 steps, < 30s total), prefer direct edge function orchestration instead. If selected, justify WHY a background job system is needed.

ON-DEVICE ML (tensorflow-lite): Only select if (a) offline support is critical, (b) latency < 100ms is required, (c) privacy prevents sending images/data to cloud APIs, or (d) per-inference cost must be near-zero at scale. If cloud API inference (openai-vision or claude-api) suffices, do NOT select tensorflow-lite. If selected, specify which pre-trained model to use and how to bundle the .tflite file in assets.

Populate all schema fields. Use exact slugs from the catalogs. Be specific — every decision you make here becomes a concrete instruction in the execution prompts.`;
}

// ============================================
// Execution Prompt Builders (3 sequential prompts)
// Page-by-page format with specific technologies per screen
// ============================================

export interface ExecutionPromptScreen {
  screenName: string;
  patternFragment: string;
  techs: Array<{
    name: string;
    category: string;
    promptFragment: string;
  }>;
  customNotes: string;
}

export interface ExecutionPromptInput {
  ctx: ArchitectContext;
  allStepsSummary: string;
  platform: string;
  screens: ExecutionPromptScreen[];
  synergyNotes: string[];
  selectedTechSlugs?: string[];
  schemaAnchor?: string;
  freeTierLimits?: string;
  deferredFeatures?: string[];
  pricingAnchor?: string;
}

export function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '[See technology documentation for implementation details]');
}

function formatScreenInstructions(screens: ExecutionPromptScreen[]): string {
  return screens.map((screen) => {
    const techList = screen.techs.map((t) => t.name).join(", ");
    const techDetails = screen.techs.map((t) =>
      `#### ${t.category}: ${t.name}\n${stripCodeBlocks(t.promptFragment)}`
    ).join("\n\n");

    return `## Screen: ${screen.screenName}
**Technologies**: ${techList}

### Layout & Pattern
${stripCodeBlocks(screen.patternFragment)}

### Technology Implementation
${techDetails}

### App-Specific Behavior
${screen.customNotes}`;
  }).join("\n\n---\n\n");
}

/** Check if a slug list includes a specific slug. */
function selectedTechSlugsHas(slugs: string[], slug: string): boolean {
  return slugs.includes(slug);
}

/**
 * Build concrete install commands from SETUP_STEPS_REGISTRY npm packages.
 * Groups packages from all selected techs into a single install block.
 */
function buildInstallCommands(selectedSlugs: string[], platform: string): string {
  const packages = new Set<string>();

  // Collect npm packages from each selected tech's registry entry
  for (const slug of selectedSlugs) {
    const registry = SETUP_STEPS_REGISTRY[slug];
    if (!registry) continue;
    // The registry has setupSteps with human-readable text, but the actual
    // npm packages come from the seed-technologies data via the pipeline.
    // We'll reference them generically here.
  }

  // Build a descriptive install section rather than exact package names
  // (exact packages come from the tech knowledge base prompt fragments)
  const lines: string[] = [];
  lines.push("- Install all packages listed in the Technology Implementation sections below");
  lines.push("- Use npx expo install for Expo-compatible packages, npm install for others");

  // Add well-known package groups based on slug patterns
  const slugSet = new Set(selectedSlugs);
  if (slugSet.has("supabase-auth") || slugSet.has("supabase-postgresql")) {
    lines.push("- Supabase: @supabase/supabase-js, drizzle-orm, drizzle-kit");
  }
  if (slugSet.has("claude-api")) lines.push("- AI: @anthropic-ai/sdk");
  if (slugSet.has("openai-gpt4") || slugSet.has("openai-vision")) lines.push("- AI: openai");
  if (slugSet.has("stripe")) lines.push("- Payments: stripe, @stripe/stripe-react-native");
  if (slugSet.has("revenucat")) lines.push("- Payments: react-native-purchases");
  if (slugSet.has("sentry")) lines.push("- Monitoring: @sentry/react-native");
  if (slugSet.has("posthog")) lines.push("- Analytics: posthog-react-native");
  if (slugSet.has("upstash-redis")) lines.push("- Cache: @upstash/redis");
  if (slugSet.has("deepgram")) lines.push("- Speech: @deepgram/sdk");
  if (slugSet.has("elevenlabs-tts")) lines.push("- TTS: elevenlabs");
  if (slugSet.has("algolia")) lines.push("- Search: algoliasearch, react-instantsearch");
  if (slugSet.has("meilisearch")) lines.push("- Search: meilisearch");
  if (slugSet.has("resend")) lines.push("- Email: resend");
  if (slugSet.has("expo-notifications")) lines.push("- Notifications: expo-notifications");
  if (slugSet.has("tensorflow-lite")) lines.push("- ML: react-native-fast-tflite");

  return lines.join("\n");
}

/**
 * Build a reminder of env vars needed before the next EP phase.
 */
function buildEPEnvVarReminder(selectedSlugs: string[], phase: "ep2" | "ep3", platform: string = "web-nextjs"): string {
  const vars = getEnvVarsForPhase(selectedSlugs, phase, platform);
  if (vars.length === 0) return "- No additional environment variables needed for the next prompt.";
  return vars.map(v => `- \`${v}\``).join("\n");
}

export function buildExecutionPrompt1(input: ExecutionPromptInput, epCrossRef: string): string {
  const { ctx, allStepsSummary, platform, screens, synergyNotes, schemaAnchor } = input;
  const { compact, label } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const productName = isMasterIdea ? ctx.masterIdea.name : label;
  const synergySection = synergyNotes.length > 0
    ? `\n## Integration Notes\n${synergyNotes.map((n) => `- ${n}`).join("\n")}\n`
    : "";
  const schemaLock = schemaAnchor
    ? `\nLOCKED DATABASE SCHEMA (from Technical Architecture — use these EXACT table and field names):\n${schemaAnchor}\nWhen defining tables, columns, or referencing data entities, use ONLY the names listed above. Do NOT rename, abbreviate, or invent alternative names.\n`
    : "";

  const deferredBlock = input.deferredFeatures && input.deferredFeatures.length > 0
    ? `\nSCOPE COHERENCE — DEFERRED FEATURES (from Development Plan):\nThese features are explicitly deferred to post-MVP. Do NOT include them in this prompt:\n${input.deferredFeatures.map(f => `- ${f}`).join('\n')}\nIf any screen below references a deferred feature, stub it with a "Coming Soon" placeholder instead of building the full integration.\n`
    : "";

  // Build manual actions section from SETUP_STEPS_REGISTRY
  const ep1ManualActions: string[] = [];
  for (const slug of (input.selectedTechSlugs ?? [])) {
    const setup = SETUP_STEPS_REGISTRY[slug];
    if (!setup || setup.timing !== "before-ep1") continue;
    for (const step of setup.setupSteps) {
      if (!ep1ManualActions.includes(step)) {
        ep1ManualActions.push(step);
      }
    }
  }

  const manualActionsBlock = ep1ManualActions.length > 0 ? `
## MANUAL ACTIONS REQUIRED (Complete before running this prompt)
${ep1ManualActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

After completing these manual actions, all subsequent prompts (EP2, EP3) should require zero manual intervention.` : "";

  const ep1ScreenNames = screens.map(s => s.screenName).join(", ") || "as specified above";
  const ep1BuildCmd = platform === "mobile-expo" ? "npx expo export" : "npm run build";

  const ep1ExecutionBlock = `
## [EXECUTION APPROACH]

### Tools & Verification
- Use Supabase MCP server to verify database schema after migration (if Supabase selected)
- Use Playwright MCP to verify the auth flow renders correctly after setup
- Use /check-env command to verify all EP1 environment variables before starting
- Use /verify-build command after each major section to catch errors early

### Execution Order
1. Project scaffolding and dependency installation
2. Environment configuration and verification
3. Database schema definition and migration
4. Authentication setup and middleware
5. Base navigation structure and layouts
6. Foundation screens (${ep1ScreenNames})

### Checkpoint
After completing EP1, verify:
- \`${ep1BuildCmd}\` succeeds
- Auth flow works (signup → login → logout)
- Database tables exist (verify via Supabase MCP or direct query)
- All EP1 screens render without errors

### Manual Placeholders
Mark every location needing API keys with: // TODO: [MANUAL] Add your KEY_NAME from https://...
All manual placeholders should be resolved before starting EP2.`;

  const foundationReportBlock = `
## Foundation Report
After completing all EP1 tasks, produce a brief FOUNDATION_REPORT.md listing:
1. **Tables created**: List all database tables with their column names
2. **Auth method**: Which auth provider and OAuth methods configured
3. **Routes created**: List all route files and their paths
4. **Components created**: List all shared/layout components
5. **Environment variables**: List all env vars that are set and verified

This report will be referenced by EP2 and EP3 to avoid recreating existing components.`;

  return `ABSOLUTE RULE: This document must contain ZERO code blocks (no triple-backtick fences ${'`'}${'`'}${'`'}). Write everything in prose and structured markdown (headers, bullets, bold). Any code blocks render the document unusable.

${CURRENT_TECH_VERSIONS}
${schemaLock}${deferredBlock}

You are generating Execution Prompt 1 of 3 for "${productName}". This prompt will be copy-pasted directly into Claude Code to build the foundation of the app.

Write this as a comprehensive architectural blueprint for Claude Code. Describe WHAT to build, WHY each piece exists, and HOW components connect — but do NOT write actual code implementations. Claude Code will write the code itself. Your job is to specify the architecture, interfaces, data flows, and design decisions so precisely that no ambiguity remains.

CRITICAL INSTRUCTION: Do NOT include TypeScript/JavaScript code blocks, complete class implementations, or exact file contents. Instead describe:
- What each module/file does and why it exists
- What interfaces/types it exports and their shape
- How it connects to other modules (imports, data flow)
- What API calls it makes and to which endpoints
- Key architectural decisions and tradeoffs
- Configuration values and environment variables needed

Format every screen section using these prose headings: **Purpose**, **Data Model**, **User Interactions**, **API Calls**, **State Management**, **Edge Cases**. Describe interfaces and data shapes in prose (e.g., 'User entity with fields: id (UUID), email (string), displayName (string)') — never in code syntax.

${compact}

ANALYSIS SUMMARY:
${allStepsSummary}

EXECUTION PROMPT OVERVIEW:
${epCrossRef}

PLATFORM: ${platform}

Generate a comprehensive architectural blueprint for Claude Code. Structure it exactly as follows:

## Project Initialization

THIS IS THE FIRST PROMPT — Claude Code must create the entire project from scratch.

### Step 1: Create the Project
- Run: npx create-expo-app@latest [app-name] --template tabs
- cd into the new project directory

### Step 2: Install All Dependencies
Install ALL packages needed for the entire app upfront (not incrementally):
${buildInstallCommands(input.selectedTechSlugs ?? [], platform)}

### Step 3: Project Structure
Create the following folder structure per platform conventions:
${platform === "mobile-expo" || platform === "both" ? `- app/ (Expo Router pages)
- components/ (reusable UI components)
- lib/ (utilities, API clients, hooks)
- lib/supabase.ts (Supabase client init)
- constants/ (theme colors, config)
- assets/ (images, fonts)` : `- app/ (Next.js App Router pages)
- components/ (reusable UI components)
- lib/ (utilities, API clients, hooks)
- lib/supabase.ts (Supabase client init)
- public/ (static assets)`}

### Step 4: Configuration Files
- Set up app.config.ts (or next.config.ts) with all plugins
- Configure TypeScript (tsconfig.json)
- Set up Tailwind CSS / NativeWind

### Step 5: Environment Setup
- Copy .env.example to .env (or .env.local for Next.js)
- The file already has placeholder values — the user will fill in real keys
- Create the Supabase client initialization module that reads env vars

### Step 6: Database Schema
- Design and implement the complete database schema covering ALL entities the app needs
- All tables, relationships, indexes, RLS policies, and constraints
- Run initial schema push
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "supabase-storage") ? "\n### Step 7: Storage Setup\n- Create Supabase storage buckets for user uploads\n- Configure bucket policies (public vs private)" : ""}
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "supabase-edge-functions") ? "\n### Edge Function Stubs\n- Create supabase/functions/ directory\n- Add stub function directories for server-side logic needed by the app" : ""}

### Test Infrastructure
- Configure Jest with React Native Testing Library (for mobile) or Vitest (for web)
- Create jest.config.js (or vitest.config.ts) and a __tests__/ directory
- Write at least one smoke test for the root layout that verifies it mounts without crashing

### Structured Logging
- Configure a logging utility module with structured JSON output
- Every edge function must log: function name, user ID (sanitized), execution time, and outcome (success/error)
- Use consistent log levels: debug (development only), info (key actions), warn (recoverable errors), error (failures)

### Version Control Setup
- Create a comprehensive .gitignore appropriate for the platform (${platform === "mobile-expo" || platform === "both" ? "node_modules, .env*, .expo, ios/Pods, android/build, *.tflite" : "node_modules, .env*, .next, out"})
- Initialize git: git init && git add -A && git commit -m "Initial commit from EP1"
- Recommended: Create a GitHub repository and push before continuing to EP2

### Shared Configuration
- Theme system (light/dark mode)
- Global loading and error boundary components
- Navigation structure (tab bar, sidebar, or stack as appropriate for ${platform})
- API client configuration for external services
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "zustand") || selectedTechSlugsHas(input.selectedTechSlugs ?? [], "tanstack-query")
  ? `\n### State Management\n${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "zustand") ? "- Set up Zustand stores for client-side state (user session, UI preferences, cached data). Create a stores/ directory with typed store definitions.\n" : ""}${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "tanstack-query") ? "- Set up TanStack Query (React Query) provider at the app root. Configure default staleTime, gcTime, and retry behavior. All server data fetching should use useQuery/useMutation hooks — do NOT use raw fetch or useEffect for data loading.\n" : ""}`
  : ""}${synergySection}
---

# SCREENS TO BUILD (Foundation)

${formatScreenInstructions(screens)}

---

## Post-Build Verification

After building everything above, perform these checks:

1. Run /check-env to verify environment variables are set
2. Run the dev server and verify the app compiles without errors
3. Verify authentication flow works end-to-end (sign up, log in, log out)
4. Verify database tables were created successfully
5. Verify navigation between all main sections works

**IMPORTANT — Before continuing to Prompt 2**, the user must fill in these environment variables in their .env file:
${buildEPEnvVarReminder(input.selectedTechSlugs ?? [], "ep2", platform)}
${ep1ExecutionBlock}
${manualActionsBlock}
${foundationReportBlock}

## EP1 Completion Checklist
At the end of EP1, verify these artifacts exist and work:
- All foundation screens render without errors
- Auth flow works end-to-end (signup, login, logout)
- Database tables exist and match the schema anchor
- Navigation structure connects all screens
- Theme system (light/dark) is functional
- Git repository is initialized with initial commit

FINAL CHECK: Review your entire output. If ANY section contains triple-backtick code fences, you MUST remove them and rewrite that section as prose descriptions. This document is an architecture specification, not a code tutorial.

Format as clean markdown. Be extremely specific about what each module does, what data flows between components, and what the expected behavior is. Every technology decision is already made above — Claude Code should not need to choose technologies or patterns. Do NOT include code blocks or implementations — describe the architecture, not the code.`;
}

export function buildExecutionPrompt2(
  input: ExecutionPromptInput,
  epCrossRef: string,
): string {
  const { ctx, allStepsSummary, platform, screens, synergyNotes, schemaAnchor } = input;
  const { label } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const productName = isMasterIdea ? ctx.masterIdea.name : label;
  const synergySection = synergyNotes.length > 0
    ? `\n## Integration Notes\n${synergyNotes.map((n) => `- ${n}`).join("\n")}\n`
    : "";
  const schemaLock = schemaAnchor
    ? `\nLOCKED DATABASE SCHEMA (from Technical Architecture — use these EXACT table and field names):\n${schemaAnchor}\nCRITICAL: Tables and field names were defined in EP1. You MUST reference the exact same names. Do NOT rename columns (e.g., use "barcode" not "barcode_upc", use "date" not "log_date", use "step_name" not "custom_label").\n`
    : "";
  const deferredBlock = input.deferredFeatures && input.deferredFeatures.length > 0
    ? `\nSCOPE COHERENCE — DEFERRED FEATURES (from Development Plan):\nThese features are explicitly deferred to post-MVP. Do NOT build full integrations for them:\n${input.deferredFeatures.map(f => `- ${f}`).join('\n')}\nIf a screen references a deferred feature, use a "Coming Soon" placeholder or simplified fallback.\n`
    : "";

  const screenCount = screens.length;
  const useParallel = screenCount >= 4;

  const ep2ExecutionBlock = `
## [EXECUTION APPROACH]

### Execution Strategy
${useParallel
    ? `This EP has ${screenCount} screens. Use agent teams for parallel screen building:
- Create a team with @screen-builder teammates for independent screens
- Build shared components first, then dispatch parallel screen builds
- Screens that share no data dependencies can be built simultaneously`
    : `Build screens sequentially in dependency order. Complete each screen before starting the next.`}

### Tools & Verification
- Use Playwright MCP to verify each screen renders correctly after building
- Use /verify-build after each screen completion
- Use the screen-spec skill for layout guidance per screen pattern

### Checkpoint
After completing EP2, verify:
- Each screen renders with loading, error, empty, and populated states
- Navigation between all screens works
- AI features return responses (if applicable)
- No TypeScript errors (\`npx tsc --noEmit\`)`;

  const ep2FoundationRefBlock = `
## Foundation Reference
Before building screens, read FOUNDATION_REPORT.md (created by EP1) to understand:
- What database tables already exist (do NOT recreate them)
- What shared components are available (import, don't rebuild)
- What routes are set up (add screens to existing navigation)
- What auth patterns are in place (follow the same pattern)`;

  return `ABSOLUTE RULE: This document must contain ZERO code blocks (no triple-backtick fences ${'`'}${'`'}${'`'}). Write everything in prose and structured markdown (headers, bullets, bold). Any code blocks render the document unusable.

${CURRENT_TECH_VERSIONS}
${schemaLock}${deferredBlock}

You are generating Execution Prompt 2 of 3 for "${productName}". This prompt will be copy-pasted directly into Claude Code AFTER Prompt 1 has been executed.

The foundation is already built (auth, database, navigation, settings). Now build the core feature screens.

## Pre-Build Checklist (run before building screens)

Before starting, verify the EP1 foundation is intact:
1. Run /check-env — verify all EP2-required environment variables are filled in
2. Verify the project compiles (npx tsc --noEmit)
3. Confirm auth, database, navigation, and theme system from EP1 are working
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "supabase-edge-functions") ? "4. Deploy Edge Functions if not yet deployed: run /deploy-edge-functions" : ""}
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "supabase-storage") ? "5. Verify Supabase storage buckets exist and policies are configured" : ""}

If any checks fail, fix them before proceeding with screen implementation.

---

Write this as a comprehensive architectural blueprint for Claude Code. Describe WHAT to build, WHY each piece exists, and HOW components connect — but do NOT write actual code implementations. Claude Code will write the code itself.

CRITICAL INSTRUCTION: Do NOT include TypeScript/JavaScript code blocks, complete class implementations, or exact file contents. Instead describe the architecture, interfaces, data flows, and design decisions.

Format every screen section using these prose headings: **Purpose**, **Data Model**, **User Interactions**, **API Calls**, **State Management**, **Edge Cases**. Describe interfaces and data shapes in prose (e.g., 'User entity with fields: id (UUID), email (string), displayName (string)') — never in code syntax.

PLATFORM: ${platform}

ANALYSIS SUMMARY:
${allStepsSummary}

EXECUTION PROMPT OVERVIEW:
${epCrossRef}
${synergySection}
---

# SCREENS TO BUILD (Core Features)

${formatScreenInstructions(screens)}

---

## Expected Outcome
After running this prompt, the developer should have:
- All core feature screens built and functional
- AI features integrated with streaming responses where applicable
- Data can be created, read, updated, deleted across all entities
- Search and filtering operational
- The app should be functionally complete — a user can accomplish all primary tasks

**IMPORTANT — Before continuing to Prompt 3**, the user must fill in these environment variables in their .env file:
${buildEPEnvVarReminder(input.selectedTechSlugs ?? [], "ep3", platform)}
${ep2ExecutionBlock}
${ep2FoundationRefBlock}

## Error Handling & Logging
- Every client-side catch block that affects the user must show a user-facing error message AND call the error reporting service (Sentry.captureException if Sentry is selected)
- Use the structured logging utility from EP1 for all server-side/edge function error handling
- Add Sentry breadcrumbs (if selected) for key state transitions: screen navigation, data mutations, API calls

## Screen Tests
Write a basic render test for each screen that verifies it mounts without crashing. Use the test framework configured in EP1.

## EP2 Completion Checklist
At the end of EP2, verify these artifacts exist and work:
- Each core feature screen renders with loading, error, empty, and populated states
- AI features return responses (if applicable)
- CRUD operations work across all entities
- Navigation between all screens works
- All screen render tests pass
- No TypeScript errors (npx tsc --noEmit)
- Git commit before proceeding to EP3

CRITICAL: Do NOT recreate any component, hook, store, or utility that was built in EP1.
Import from existing paths. If you need to modify an existing component, edit it — do not create a duplicate.

FINAL CHECK: Review your entire output. If ANY section contains triple-backtick code fences, you MUST remove them and rewrite that section as prose descriptions. This document is an architecture specification, not a code tutorial.

Format as clean markdown. Be extremely specific about what each screen does, what data it shows, and how interactions work. Every technology decision is already made — Claude Code should implement exactly what's specified above. Reference the existing project structure from Prompt 1. Do NOT include code blocks or implementations — describe the architecture, not the code.`;
}

export function buildExecutionPrompt3(
  input: ExecutionPromptInput,
  epCrossRef: string,
): string {
  const { ctx, allStepsSummary, platform, screens, synergyNotes, schemaAnchor } = input;
  const { label } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const productName = isMasterIdea ? ctx.masterIdea.name : label;
  const synergySection = synergyNotes.length > 0
    ? `\n## Integration Notes\n${synergyNotes.map((n) => `- ${n}`).join("\n")}\n`
    : "";
  const deferredBlock = input.deferredFeatures && input.deferredFeatures.length > 0
    ? `\nSCOPE COHERENCE — DEFERRED FEATURES (from Development Plan):\nThese features are explicitly deferred to post-MVP. Do NOT build full integrations for them:\n${input.deferredFeatures.map(f => `- ${f}`).join('\n')}\nIf a screen references a deferred feature, use a "Coming Soon" placeholder.\n`
    : "";
  const schemaLock = schemaAnchor
    ? `\nLOCKED DATABASE SCHEMA (from Technical Architecture — use these EXACT table and field names):\n${schemaAnchor}\nCRITICAL: Tables and field names were defined in EP1. You MUST reference the exact same names. Do NOT rename columns (e.g., use "barcode" not "barcode_upc", use "date" not "log_date", use "step_name" not "custom_label").\n`
    : "";

  const ep3ExecutionBlock = `
## [EXECUTION APPROACH]

### Tools & Verification
- Use Stripe MCP to verify product/price creation (if Stripe selected)
- Use Playwright MCP to test the full payment flow in test mode
- Use /deploy command for platform-specific production deployment
- Use /check-consistency to verify pricing matches across all documents

### Checkpoint
After completing EP3, verify:
- Test mode payment flow completes end-to-end
- Push notifications received on device (if applicable)
- Analytics events firing correctly
- Production build succeeds
- All environment variables set for production

### Zero Manual Intervention
EP3 should require NO manual steps. All API keys and service configurations should have been completed before EP1 and EP2.`;

  const ep3FoundationRefBlock = `
## Prior Work Reference
Read FOUNDATION_REPORT.md and review the EP2 implementation to understand:
- All database tables and their current state
- All screens built and their component locations
- Auth and navigation patterns in use
EP3 builds ON TOP of EP1+EP2 — never recreate what already exists.`;

  return `ABSOLUTE RULE: This document must contain ZERO code blocks (no triple-backtick fences ${'`'}${'`'}${'`'}). Write everything in prose and structured markdown (headers, bullets, bold). Any code blocks render the document unusable.

${CURRENT_TECH_VERSIONS}
${schemaLock}${deferredBlock}

You are generating Execution Prompt 3 of 3 for "${productName}". This prompt will be copy-pasted directly into Claude Code AFTER Prompts 1 and 2 have been executed.

The foundation (auth, DB, nav) and core features (main screens, AI, CRUD) are built. Now add polish screens, payments, notifications, and production readiness.

## Pre-Build Checklist (run before building screens)

Before starting, verify EP1 + EP2 foundations are intact:
1. Run /check-env — verify all EP3-required environment variables are filled in
2. Verify the project compiles (npx tsc --noEmit)
3. Confirm all EP2 core feature screens are functional
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "revenucat") ? "4. Configure RevenueCat products and entitlements in the RevenueCat dashboard" : ""}
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "sentry") ? "5. Set up Sentry project and copy DSN to environment" : ""}
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "posthog") ? "6. Set up PostHog project and copy API key to environment" : ""}

If any checks fail, fix them before proceeding with screen implementation.
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "posthog") ? `
## Analytics Integration (PostHog)
- Initialize PostHog in root layout provider using PostHogProvider
- Call posthog.identify() after authentication with user ID and email
- Track minimum events: app_opened, sign_up_completed, paywall_viewed, purchase_completed, and app-specific core action events
- Configure conversion funnel: paywall_viewed → purchase_completed → core_action → results_viewed
- Use feature flags (useFeatureFlagEnabled) for gradual feature rollouts
` : ""}
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "revenucat") ? `
## RevenueCat Webhook
- Implement webhook edge function with signature validation (X-RevenueCat-Webhook-Signature header)
- Handle events: INITIAL_PURCHASE (activate premium), CANCELLATION (set pending expiry), EXPIRATION (downgrade to free), BILLING_ISSUE (show in-app warning), PRODUCT_CHANGE (update tier), RENEWAL (extend subscription)
- Track analytics events: paywall_viewed, package_selected, purchase_initiated, purchase_completed, purchase_failed, restore_completed
- Implement grace period handling for billing issues — do not immediately revoke access
` : ""}

---

Write this as a comprehensive architectural blueprint for Claude Code. Describe WHAT to build, WHY each piece exists, and HOW components connect — but do NOT write actual code implementations.

CRITICAL INSTRUCTION: Do NOT include TypeScript/JavaScript code blocks, complete class implementations, or exact file contents. Instead describe the architecture, interfaces, data flows, and design decisions.

Format every screen section using these prose headings: **Purpose**, **Data Model**, **User Interactions**, **API Calls**, **State Management**, **Edge Cases**. Describe interfaces and data shapes in prose (e.g., 'User entity with fields: id (UUID), email (string), displayName (string)') — never in code syntax.

PLATFORM: ${platform}

ANALYSIS SUMMARY:
${allStepsSummary}

EXECUTION PROMPT OVERVIEW:
${epCrossRef}
${synergySection}
---

# SCREENS TO BUILD (Polish & Secondary)

${formatScreenInstructions(screens)}

ABSOLUTE RULE — PAYWALL & UPGRADE SCREEN GUIDELINES:
These rules apply to ANY screen above that involves payments, subscriptions, upgrades, or trial conversion:
1. Do NOT include fabricated social proof. NEGATIVE EXAMPLE (do NOT write anything like this): "Join 10,000+ skincare lovers", "Trusted by 5,000+ users", "Rated #1 in skincare". These are LIES for an unreleased app.
2. INSTEAD use benefit-focused copy: "Unlock unlimited skin analyses", "Get personalized routines", "Your AI skincare companion — premium".
3. Use pricing tiers exactly as defined in the Strategic Plan — do not invent prices.${input.pricingAnchor ? `\n\nLOCKED PRICING (from Strategic Plan — use these EXACT values):\n${input.pricingAnchor}\nDo NOT use different prices. These are the canonical pricing tiers from Step 2.` : ""}
4. Never claim specific user counts, download numbers, or review counts unless dynamically loaded from verified analytics at runtime.
5. For trial/conversion copy, emphasize feature benefits and value — not fake urgency or fabricated social proof.
6. FEATURE LIMITS per tier must match the Development Plan: use the exact daily/monthly limits defined in Step 4 (e.g., if Step 4 says "20 ingredient checks/day free tier", do NOT write "3 per day"). When unsure, use the STRICTER limit to preserve conversion pressure — a generous free tier kills revenue.${input.freeTierLimits ? `\n\nLOCKED FREE TIER LIMITS (from Development Plan — use these EXACT values):\n${input.freeTierLimits}\nDo NOT invent different limits. Do NOT make the free tier more generous than specified. These are canonical.` : ""}
7. PAYWALL POSITIONING: The paywall is how the developer earns revenue — it is NOT an obstacle or a "blockade." Design the paywall as a compelling, well-designed conversion screen. Paywalls are standard in mobile apps and should be presented confidently, not apologetically. Show clear value differentiation between free and paid tiers. The goal is CONVERSION, not minimizing friction.

---

## Integration Tests
- Write integration tests for the core user flow (signup → main action → results)
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "supabase-edge-functions") ? "- Write edge function tests using Deno test runner for each edge function" : ""}
- Ensure all existing render tests still pass after EP3 changes

## Production Readiness Checklist
- Environment variable documentation
- Security headers and CORS configuration
- SEO meta tags and social sharing (web) / App Store metadata (mobile)
- Error monitoring (integrate analytics tech specified above)
- Replace all remaining console.error calls with structured error reporting via Sentry (if selected) or the structured logging utility from EP1
- Logging for key user actions
${platform.includes("mobile") || platform === "both" ? "- EAS Build configuration (eas.json with development/preview/production profiles)" : "- CI/CD pipeline configuration"}

## Post-Build Verification

After building everything above, perform these final checks:

1. Run /verify-build — confirm the full app compiles with zero errors
2. Run /run-tests — execute any test suites
${selectedTechSlugsHas(input.selectedTechSlugs ?? [], "supabase-edge-functions") ? "3. Run /deploy-edge-functions — deploy all Edge Functions to production" : ""}
${platform.includes("mobile") || platform === "both" ? `4. Run: eas build --profile preview --platform all — verify build succeeds
5. Prepare App Store metadata (screenshots, description, keywords)` : "3. Verify production build succeeds and can be deployed"}

## Expected Outcome
After running this prompt, the app should be:
- Production-ready with proper error handling
- All secondary screens built
- Monetized (if applicable) with working payments
- Notifications working
- Performant with optimized loading
- Secure with proper headers and validation
- Ready for deployment${platform.includes("mobile") || platform === "both" ? " and store submission" : ""}
${ep3ExecutionBlock}
${ep3FoundationRefBlock}

## EP3 Completion Checklist
At the end of EP3, verify these artifacts exist and work:
- All polish and secondary screens render correctly
- Payment flow works end-to-end in test mode (if applicable)
- Push notifications are received on device (if applicable)
- Analytics events are firing correctly (if applicable)
- Error monitoring is capturing errors (if applicable)
- Production build succeeds without errors
- All environment variables are set for production
- App is ready for deployment and/or store submission

CRITICAL: Do NOT recreate any component, hook, store, or utility that was built in EP1 or EP2.
Import from existing paths. If you need to modify an existing component, edit it — do not create a duplicate.

FINAL CHECK: Review your entire output. If ANY section contains triple-backtick code fences, you MUST remove them and rewrite that section as prose descriptions. This document is an architecture specification, not a code tutorial.

Format as clean markdown. Reference the existing project structure. Focus on completeness — this is the final prompt before launch. Every technology choice is already specified — describe what to build with each. Do NOT include code blocks or implementations — describe the architecture, not the code.`;
}

// ============================================
// CLAUDE.md + .mcp.json Generation (Deterministic)
// ============================================

export interface McpServerEntry {
  serverName: string;
  transport: "stdio" | "http";
  // stdio fields
  command?: string;
  args?: string[];
  // http fields
  url?: string;
  headers?: Record<string, string>;
  // common
  env: Record<string, string>;
  description: string;
  triggerSlugs: string[];
  platformFilter?: "mobile-expo" | "web-nextjs" | "both";
}

export const MCP_SERVER_REGISTRY: Record<string, McpServerEntry> = {
  supabase: {
    serverName: "supabase",
    transport: "http",
    url: "https://mcp.supabase.com",
    env: { SUPABASE_URL: "${SUPABASE_URL}", SUPABASE_SERVICE_KEY: "${SUPABASE_SERVICE_KEY}" },
    description: "Supabase project management, database, and auth",
    triggerSlugs: ["supabase-auth", "supabase-postgresql", "supabase-storage", "supabase-realtime"],
  },
  stripe: {
    serverName: "stripe",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@stripe/mcp", "--api-key", "${STRIPE_SECRET_KEY}"],
    env: { STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY}" },
    description: "Stripe payments, products, and subscriptions",
    triggerSlugs: ["stripe"],
  },
  firebase: {
    serverName: "firebase",
    transport: "stdio",
    command: "npx",
    args: ["-y", "firebase-tools@latest", "mcp"],
    env: {},
    description: "Firebase project management and Firestore",
    triggerSlugs: ["firebase-auth", "firebase-firestore", "firebase-cloud-messaging"],
  },
  sentry: {
    serverName: "sentry",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@sentry/mcp-server"],
    env: { SENTRY_AUTH_TOKEN: "${SENTRY_AUTH_TOKEN}" },
    description: "Error monitoring and issue tracking",
    triggerSlugs: ["sentry"],
  },
  upstash: {
    serverName: "upstash",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@upstash/mcp-server@latest"],
    env: { UPSTASH_EMAIL: "${UPSTASH_EMAIL}", UPSTASH_API_KEY: "${UPSTASH_API_KEY}" },
    description: "Upstash Redis caching and rate limiting",
    triggerSlugs: ["upstash-redis"],
  },
  resend: {
    serverName: "resend",
    transport: "stdio",
    command: "npx",
    args: ["-y", "resend-mcp"],
    env: { RESEND_API_KEY: "${RESEND_API_KEY}" },
    description: "Transactional email sending",
    triggerSlugs: ["resend"],
  },
  cloudflare: {
    serverName: "cloudflare",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@cloudflare/mcp-server-cloudflare"],
    env: { CLOUDFLARE_API_TOKEN: "${CLOUDFLARE_API_TOKEN}" },
    description: "Cloudflare Workers, D1, KV, R2",
    triggerSlugs: ["cloudflare-workers"],
  },
  playwright: {
    serverName: "playwright",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@playwright/mcp"],
    env: {},
    description: "Browser automation and testing",
    triggerSlugs: [],
  },
  context7: {
    serverName: "context7",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@upstash/context7-mcp@latest"],
    env: {},
    description: "Up-to-date library documentation lookup",
    triggerSlugs: [],
  },
  expo: {
    serverName: "expo",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/expo-mcp-server@latest"],
    env: { EXPO_ACCESS_TOKEN: "${EXPO_ACCESS_TOKEN}" },
    description: "Expo SDK knowledge, EAS integration, simulator screenshots",
    triggerSlugs: ["eas-build", "expo-updates", "expo-notifications"],
    platformFilter: "mobile-expo",
  },
  revenuecat: {
    serverName: "revenuecat",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/revenuecat-mcp-server@latest"],
    env: { REVENUECAT_SECRET_KEY: "${REVENUECAT_SECRET_KEY}" },
    description: "RevenueCat subscription management and entitlements",
    triggerSlugs: ["revenucat"],
  },
  figma: {
    serverName: "figma",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/figma-mcp-server@latest"],
    env: { FIGMA_ACCESS_TOKEN: "${FIGMA_ACCESS_TOKEN}" },
    description: "Figma design-to-code bridge and bidirectional sync",
    triggerSlugs: [],
    platformFilter: "both",
  },
  vercel: {
    serverName: "vercel",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic-ai/vercel-mcp-server@latest"],
    env: { VERCEL_TOKEN: "${VERCEL_TOKEN}" },
    description: "Vercel deployment management and project configuration",
    triggerSlugs: [],
    platformFilter: "web-nextjs",
  },
};

export const SETUP_STEPS_REGISTRY: Record<string, {
  envVars: string[];
  setupSteps: string[];
  timing: "before-ep1" | "after-ep1" | "after-ep2" | "after-ep3";
}> = {
  "supabase-auth": {
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"],
    setupSteps: ["Create Supabase project at supabase.com/dashboard", "Copy project URL and anon key to .env.local"],
    timing: "before-ep1",
  },
  "supabase-postgresql": {
    envVars: ["DATABASE_URL"],
    setupSteps: ["Copy Supabase connection string to DATABASE_URL"],
    timing: "before-ep1",
  },
  "supabase-storage": {
    envVars: [],
    setupSteps: ["Create storage buckets in Supabase dashboard after EP1"],
    timing: "after-ep1",
  },
  "supabase-realtime": {
    envVars: [],
    setupSteps: ["Enable Realtime on required tables in Supabase dashboard"],
    timing: "after-ep1",
  },
  "firebase-auth": {
    envVars: ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
    setupSteps: ["Create Firebase project at console.firebase.google.com", "Enable Authentication and configure sign-in methods"],
    timing: "before-ep1",
  },
  "firebase-firestore": {
    envVars: [],
    setupSteps: ["Enable Firestore in Firebase console", "Set up security rules"],
    timing: "before-ep1",
  },
  "firebase-cloud-messaging": {
    envVars: ["FIREBASE_SERVER_KEY"],
    setupSteps: ["Enable Cloud Messaging in Firebase console", "Generate server key for push notifications"],
    timing: "after-ep2",
  },
  stripe: {
    envVars: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    setupSteps: ["Create Stripe account at stripe.com", "Copy API keys from Stripe Dashboard", "Create products and price IDs in Stripe Dashboard"],
    timing: "after-ep2",
  },
  "claude-api": {
    envVars: ["ANTHROPIC_API_KEY"],
    setupSteps: ["Get API key from console.anthropic.com"],
    timing: "before-ep1",
  },
  "openai-gpt4": {
    envVars: ["OPENAI_API_KEY"],
    setupSteps: ["Get API key from platform.openai.com"],
    timing: "before-ep1",
  },
  "openai-vision": {
    envVars: ["OPENAI_API_KEY"],
    setupSteps: ["Get API key from platform.openai.com (same key as GPT-5.4 text)"],
    timing: "before-ep1",
  },
  deepgram: {
    envVars: ["DEEPGRAM_API_KEY"],
    setupSteps: ["Create account at deepgram.com and get API key"],
    timing: "before-ep1",
  },
  "elevenlabs-tts": {
    envVars: ["ELEVENLABS_API_KEY"],
    setupSteps: ["Create account at elevenlabs.io and get API key"],
    timing: "before-ep1",
  },
  assemblyai: {
    envVars: ["ASSEMBLYAI_API_KEY"],
    setupSteps: ["Create account at assemblyai.com and get API key"],
    timing: "before-ep1",
  },
  "upstash-redis": {
    envVars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    setupSteps: ["Create Redis database at console.upstash.com", "Copy REST URL and token to .env.local"],
    timing: "before-ep1",
  },
  resend: {
    envVars: ["RESEND_API_KEY"],
    setupSteps: ["Create account at resend.com", "Verify sending domain", "Copy API key"],
    timing: "after-ep2",
  },
  sentry: {
    envVars: ["NEXT_PUBLIC_SENTRY_DSN", "SENTRY_AUTH_TOKEN"],
    setupSteps: ["Create Sentry project at sentry.io", "Copy DSN to environment"],
    timing: "after-ep3",
  },
  "expo-notifications": {
    envVars: ["EXPO_ACCESS_TOKEN"],
    setupSteps: ["Configure push notifications in Expo dashboard"],
    timing: "after-ep2",
  },
  "revenucat": {
    envVars: ["REVENUECAT_API_KEY"],
    setupSteps: ["Create RevenueCat project at app.revenuecat.com", "Configure entitlements and offerings"],
    timing: "after-ep2",
  },
  algolia: {
    envVars: ["NEXT_PUBLIC_ALGOLIA_APP_ID", "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", "ALGOLIA_ADMIN_KEY"],
    setupSteps: ["Create Algolia app at algolia.com", "Create index and configure searchable attributes"],
    timing: "after-ep1",
  },
  meilisearch: {
    envVars: ["MEILISEARCH_HOST", "MEILISEARCH_API_KEY"],
    setupSteps: ["Deploy Meilisearch instance (Meilisearch Cloud or self-hosted)", "Create index and configure settings"],
    timing: "after-ep1",
  },
  "supabase-edge-functions": {
    envVars: [],
    setupSteps: ["Install Supabase CLI: npm i -g supabase", "Initialize edge functions: supabase functions new <name>", "Deploy with: supabase functions deploy"],
    timing: "after-ep1",
  },
  posthog: {
    envVars: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
    setupSteps: ["Create PostHog project at app.posthog.com", "Copy project API key and host URL"],
    timing: "after-ep3",
  },
  "eas-build": {
    envVars: ["EXPO_ACCESS_TOKEN"],
    setupSteps: ["Install EAS CLI: npm i -g eas-cli", "Run eas build:configure to set up build profiles", "Configure eas.json with development/preview/production profiles"],
    timing: "after-ep3",
  },
  "expo-updates": {
    envVars: [],
    setupSteps: ["Configure expo-updates in app.config.js", "Set up update channels for preview and production"],
    timing: "after-ep3",
  },
  "tensorflow-lite": {
    envVars: [],
    setupSteps: ["Install react-native-fast-tflite", "Add .tflite model files to assets directory", "Configure metro.config.js to bundle .tflite files"],
    timing: "after-ep1",
  },
  figma: {
    envVars: ["FIGMA_ACCESS_TOKEN"],
    setupSteps: ["Create Figma personal access token at figma.com/settings", "Copy token to .env.local"],
    timing: "before-ep1",
  },
  vercel: {
    envVars: ["VERCEL_TOKEN"],
    setupSteps: ["Create Vercel account at vercel.com", "Generate API token at vercel.com/account/tokens", "Link project: npx vercel link"],
    timing: "after-ep3",
  },
  "zustand": {
    envVars: [],
    setupSteps: ["Install zustand: npm install zustand"],
    timing: "before-ep1",
  },
  "tanstack-query": {
    envVars: [],
    setupSteps: ["Install @tanstack/react-query", "Wrap app with QueryClientProvider"],
    timing: "before-ep1",
  },
  "react-hook-form": {
    envVars: [],
    setupSteps: ["Install react-hook-form and @hookform/resolvers"],
    timing: "before-ep1",
  },
  "expo-router": {
    envVars: [],
    setupSteps: ["Configure expo-router in app.json", "Set up app/ directory structure"],
    timing: "before-ep1",
  },
  "nativewind": {
    envVars: [],
    setupSteps: ["Install nativewind and tailwindcss", "Configure babel.config.js and metro.config.js", "Create tailwind.config.js"],
    timing: "before-ep1",
  },
  "react-native-reanimated": {
    envVars: [],
    setupSteps: ["Install react-native-reanimated", "Add babel plugin to babel.config.js"],
    timing: "before-ep1",
  },
  "zod": {
    envVars: [],
    setupSteps: ["Install zod: npm install zod"],
    timing: "before-ep1",
  },
  "tanstack-router": {
    envVars: [],
    setupSteps: ["Install @tanstack/react-router", "Configure route generation plugin"],
    timing: "before-ep1",
  },
};

// ============================================
// PLUGIN_MARKETPLACE_REGISTRY — external skill repos to install via /plugin marketplace
// ============================================

export const PLUGIN_MARKETPLACE_REGISTRY: Record<string, {
  repo: string;
  skills: string[];
  description: string;
  triggerSlugs: string[];
  platformFilter?: "mobile-expo" | "web-nextjs" | "both";
  verified: boolean;
}> = {
  _expo_core: {
    repo: "expo/skills",
    skills: ["building-native-ui", "native-data-fetching", "expo-dev-client", "expo-tailwind-setup"],
    description: "Core Expo development: native UI, data fetching, dev client, Tailwind setup",
    triggerSlugs: [],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _expo_deployment: {
    repo: "expo/skills",
    skills: ["expo-deployment", "expo-cicd-workflows"],
    description: "Expo deployment and CI/CD workflow skills",
    triggerSlugs: ["eas-build", "expo-updates"],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _expo_api_routes: {
    repo: "expo/skills",
    skills: ["expo-api-routes"],
    description: "Expo API Routes for server-side logic",
    triggerSlugs: ["supabase-edge-functions"],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _expo_native_ui: {
    repo: "expo/skills",
    skills: ["expo-ui-swift-ui", "expo-ui-jetpack-compose", "use-dom"],
    description: "Native platform UI: SwiftUI, Jetpack Compose, DOM components",
    triggerSlugs: [],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _expo_upgrade: {
    repo: "expo/skills",
    skills: ["upgrading-expo"],
    description: "Expo SDK upgrade guidance",
    triggerSlugs: [],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _rn_callstack: {
    repo: "callstackincubator/agent-skills",
    skills: ["react-native-best-practices"],
    description: "Callstack React Native best practices and patterns",
    triggerSlugs: [],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _rn_swm: {
    repo: "software-mansion-labs/react-native-skills",
    skills: ["react-native-best-practices"],
    description: "Software Mansion: animations, gestures, on-device AI, multimedia, multithreading",
    triggerSlugs: [],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _rn_community: {
    repo: "mhuxain/react-native-dev",
    skills: ["react-native-dev"],
    description: "Community RN: project setup, navigation, performance, storage, platform handling",
    triggerSlugs: [],
    platformFilter: "mobile-expo",
    verified: false,
  },
  _anthropic_official: {
    repo: "anthropics/claude-plugins-official",
    skills: ["typescript-lsp", "feature-dev", "code-review", "security-guidance"],
    description: "Anthropic first-party plugins: TypeScript LSP, feature dev, code review, security",
    triggerSlugs: [],
    verified: false,
  },
  _gsd: {
    repo: "gsd-build/get-shit-done",
    skills: [],
    description: "6-phase spec-driven parallel dev workflow — useful for multi-screen EP2 building",
    triggerSlugs: [],
    verified: false,
  },
};

// ============================================
// BUNDLED_SKILL_REGISTRY — project-specific skills bundled as .claude/skills/*/SKILL.md
// These are generated from pipeline data and auto-trigger in Claude Code sessions.
// ============================================

export interface BundledSkillInput {
  appName: string;
  platform: string;
  selectedTechSlugs: string[];
  selectedTechnologies: Array<{ techSlug: string; category: string; justification: string }>;
  techDetails: Map<string, { name: string; category: string; setupComplexity: string; docsUrl: string | null; npmPackages: string[] }>;
  appScreens: Array<{ screenName: string; promptOrder: number; patternSlug?: string; techSlugs?: string[] }>;
  schemaAnchor?: string;
  pricingAnchor?: string;
  freeTierLimits?: string;
  deferredFeatures?: string[];
  epSummaries: { ep1Focus: string; ep2Focus: string; ep3Focus: string };
}

export function buildBundledSkills(input: BundledSkillInput): Record<string, string> {
  const skills: Record<string, string> = {};
  const { appName, platform, selectedTechSlugs, selectedTechnologies, techDetails, appScreens, schemaAnchor, pricingAnchor, freeTierLimits, deferredFeatures, epSummaries } = input;
  const slugSet = new Set(selectedTechSlugs);

  // 1. project-conventions — always included
  {
    const techList = selectedTechnologies.map((t) => {
      const detail = techDetails.get(t.techSlug);
      return `- **${detail?.name ?? t.techSlug}** (${t.category}): ${t.justification}`;
    }).join("\n");

    const platformLabel = platform === "web-nextjs" ? "Next.js 16 (App Router)"
      : platform === "mobile-expo" ? "Expo SDK 55 (React Native)"
      : "Next.js 16 + Expo SDK 55 (cross-platform)";

    const conventions = PLATFORM_CONVENTIONS[platform] ?? PLATFORM_CONVENTIONS["web-nextjs"]!;
    const techConvLines = selectedTechSlugs
      .filter((slug) => TECH_CONVENTIONS[slug])
      .map((slug) => `- ${TECH_CONVENTIONS[slug]}`);

    const deferredBlock = deferredFeatures && deferredFeatures.length > 0
      ? `\n## Deferred Features (NOT in MVP scope)\n${deferredFeatures.map((f) => `- ${f}`).join("\n")}\n\nDo NOT implement these features. They are planned for post-launch iterations.`
      : "";

    skills["project-conventions/SKILL.md"] = `---
name: "Project Conventions"
description: "Tech stack, naming conventions, and architecture rules for ${appName}"
---

# ${appName} — Project Conventions

## Platform
${platformLabel}

## Selected Tech Stack
${techList}

## Architecture Rules
${conventions.map((c) => `- ${c}`).join("\n")}
${techConvLines.length > 0 ? "\n## Tech-Specific Conventions\n" + techConvLines.join("\n") : ""}

## Build Phases
- **EP1 (Foundation)**: ${epSummaries.ep1Focus}
- **EP2 (Core Features)**: ${epSummaries.ep2Focus}
- **EP3 (Polish)**: ${epSummaries.ep3Focus}
${deferredBlock}`;
  }

  // 2. database-schema — only if Supabase or Firebase selected
  if (schemaAnchor && (slugSet.has("supabase-postgresql") || slugSet.has("firebase-firestore"))) {
    const dbTech = slugSet.has("supabase-postgresql") ? "Supabase PostgreSQL (Drizzle ORM)" : "Firebase Firestore";
    skills["database-schema/SKILL.md"] = `---
name: "Database Schema"
description: "Canonical database schema, table relationships, and RLS policies for ${appName}"
---

# ${appName} — Database Schema

## Database Technology
${dbTech}

## Canonical Schema
${schemaAnchor}

## Rules
- All table and column names in code MUST match the canonical schema above
- Do not add, rename, or remove tables without updating this skill
- Use RLS (Row Level Security) policies for all user-owned data
- Run migrations after any schema change: \`npx drizzle-kit push\``;
  }

  // 3. screen-spec — always included
  {
    const screensByEp = new Map<number, typeof appScreens>();
    for (const screen of appScreens) {
      const order = screen.promptOrder || 2;
      const list = screensByEp.get(order) ?? [];
      list.push(screen);
      screensByEp.set(order, list);
    }

    const screenLines: string[] = [];
    for (const [ep, screens] of [...screensByEp.entries()].sort((a, b) => a[0] - b[0])) {
      screenLines.push(`\n### EP${ep} Screens`);
      for (const s of screens) {
        const techNote = s.techSlugs && s.techSlugs.length > 0 ? ` (uses: ${s.techSlugs.join(", ")})` : "";
        const patternNote = s.patternSlug ? ` [pattern: ${s.patternSlug}]` : "";
        screenLines.push(`- **${s.screenName}**${patternNote}${techNote}`);
      }
    }

    skills["screen-spec/SKILL.md"] = `---
name: "Screen Spec"
description: "Screen-to-pattern mapping and per-screen tech assignments for ${appName}"
---

# ${appName} — Screen Specifications

## Total Screens: ${appScreens.length}
${screenLines.join("\n")}

## Rules
- When creating a new screen, check the pattern assignment above for layout guidance
- Each screen must handle: loading, error, empty, and populated states
- Connect screens to the navigation structure established in EP1`;
  }

  // 4. payment-integration — only if Stripe or RevenueCat selected
  if (slugSet.has("stripe") || slugSet.has("revenucat")) {
    const paymentTech = slugSet.has("revenucat") ? "RevenueCat" : "Stripe";
    const pricingBlock = pricingAnchor ? `\n## Locked Pricing Tiers\n${pricingAnchor}` : "";
    const freeTierBlock = freeTierLimits ? `\n## Free Tier Limits\n${freeTierLimits}` : "";

    skills["payment-integration/SKILL.md"] = `---
name: "Payment Integration"
description: "Pricing tiers, free tier limits, and paywall rules for ${appName}"
---

# ${appName} — Payment Integration

## Payment Provider
${paymentTech}
${pricingBlock}
${freeTierBlock}

## Paywall Rules
- All premium features MUST check entitlements before rendering
- Free tier users should see a clear upgrade prompt, not a blank screen
- Never hard-code prices in the UI — fetch from ${paymentTech} dynamically
- Test in sandbox/test mode before any production deployment
- Do NOT use inflated social proof (e.g., "Join 10,000+ users") for an unreleased app`;
  }

  // 5. deployment-checklist — only if EAS or Vercel selected
  if (slugSet.has("eas-build") || slugSet.has("expo-updates") || platform === "web-nextjs") {
    const isEAS = slugSet.has("eas-build");
    const isVercel = platform === "web-nextjs" || platform === "both";

    const steps: string[] = [];
    if (isEAS) {
      steps.push("1. Run `eas build:configure` to set up build profiles");
      steps.push("2. Configure `eas.json` with development/preview/production profiles");
      steps.push("3. Set all production env vars in EAS secrets: `eas secret:create`");
      steps.push("4. Build for stores: `eas build --platform all --profile production`");
      steps.push("5. Submit: `eas submit --platform ios` / `eas submit --platform android`");
    }
    if (isVercel) {
      steps.push(`${isEAS ? "6" : "1"}. Link project: \`npx vercel link\``);
      steps.push(`${isEAS ? "7" : "2"}. Set env vars in Vercel dashboard`);
      steps.push(`${isEAS ? "8" : "3"}. Deploy: \`npx vercel --prod\``);
    }

    skills["deployment-checklist/SKILL.md"] = `---
name: "Deployment Checklist"
description: "Env var requirements, build profiles, and submission guidelines for ${appName}"
---

# ${appName} — Deployment Checklist

## Steps
${steps.join("\n")}

## Pre-Deployment Verification
- All environment variables are set with production values
- No test/development API keys in production config
- TypeScript compilation passes (\`npx tsc --noEmit\`)
- All tests pass
- Payment flows tested in sandbox before going live`;
  }

  // 6. ai-integration — only if AI tech selected
  const aiSlugs = selectedTechSlugs.filter((s) =>
    s.startsWith("claude-") || s.startsWith("openai-") || s === "deepgram" || s === "elevenlabs-tts" || s === "assemblyai" || s === "tensorflow-lite"
  );
  if (aiSlugs.length > 0) {
    const aiTechLines = aiSlugs.map((slug) => {
      const detail = techDetails.get(slug);
      return `- **${detail?.name ?? slug}**: ${detail?.category ?? "AI"}`;
    }).join("\n");

    skills["ai-integration/SKILL.md"] = `---
name: "AI Integration"
description: "Model selection, prompt patterns, and cost optimization for ${appName}"
---

# ${appName} — AI Integration Guide

## Selected AI Technologies
${aiTechLines}

## Rules
- All AI API calls MUST happen server-side (API routes / edge functions) — never expose API keys to the client
- Implement streaming for any user-facing AI text generation
- Set explicit \`max_tokens\` limits on all AI API calls to control costs
- Add fallback behavior when AI services are unavailable or rate-limited
- Cache AI responses where appropriate to reduce API costs
- Log token usage for cost monitoring`;
  }

  // 7. project-setup — always included, the first thing users run
  {
    const envVarNames: string[] = [];
    const isMobile = platform === "mobile-expo";
    for (const slug of selectedTechSlugs) {
      const source = ENV_VAR_SOURCES[slug];
      if (source) {
        for (const v of source.vars) {
          const adapted = isMobile ? v.name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_") : v.name;
          if (!envVarNames.includes(adapted)) envVarNames.push(adapted);
        }
      }
    }

    const installCmd = platform === "mobile-expo" ? "npx expo install" : "npm install";

    skills["project-setup/SKILL.md"] = `---
name: "Project Setup"
description: "First-run setup: env vars, dependencies, database, and MCP verification for ${appName}"
---

# ${appName} — Project Setup

Run this skill after cloning the project to set up your development environment.

## Step 1: Environment Variables
Copy \`.env.example\` to \`.env${isMobile ? "" : ".local"}\` and fill in all values marked REQUIRED.

Required variables:
${envVarNames.map((v) => `- \`${v}\``).join("\n")}

## Step 2: Install Dependencies
\`\`\`bash
${installCmd}
\`\`\`

## Step 3: Database Setup
${slugSet.has("supabase-postgresql") ? "```bash\nnpx drizzle-kit push\n```" : slugSet.has("firebase-firestore") ? "Set up Firestore security rules in the Firebase console." : "No database setup required."}

## Step 4: Verify
Run \`/check-env\` to validate all environment variables are set correctly.
Run \`/verify-build\` to ensure the project compiles.`;
  }

  // 8. data-sync — TanStack Query patterns
  if (slugSet.has("tanstack-query")) {
    const dbTech = slugSet.has("supabase-postgresql") ? "Supabase" : slugSet.has("firebase-firestore") ? "Firestore" : "your database";
    skills["data-sync/SKILL.md"] = `---
name: "Data Sync Patterns"
description: "TanStack Query patterns for ${appName}: cache keys, optimistic updates, and invalidation"
---

# ${appName} — Data Sync Patterns

## Query Key Convention
Use hierarchical keys: \`['entity', ...filters]\`
- \`['todos']\` — all todos
- \`['todos', userId]\` — user's todos
- \`['todos', userId, { status: 'active' }]\` — filtered

## Mutation Pattern
Every mutation should:
1. Call the API via mutationFn
2. Invalidate related queries in onSuccess
3. Optionally implement optimistic updates for instant UI feedback

## Cache Configuration
- staleTime: 60_000 (1 minute) for frequently changing data
- staleTime: 300_000 (5 minutes) for stable data
- gcTime: 600_000 (10 minutes) for all queries

## Rules
- Never manually set query data without also invalidating — stale data causes bugs
- Use queryClient.invalidateQueries() after mutations, not queryClient.setQueryData() alone
- Wrap ${dbTech} calls in query functions, don't call ${dbTech} directly in components`;
  }

  // 9. form-patterns — React Hook Form + Zod patterns
  if (slugSet.has("react-hook-form")) {
    skills["form-patterns/SKILL.md"] = `---
name: "Form Patterns"
description: "Form validation, multi-step wizards, and error handling patterns for ${appName}"
---

# ${appName} — Form Patterns

## Standard Form Template
1. Define Zod schema in \`src/lib/schemas/\`
2. Use \`useForm({ resolver: zodResolver(schema) })\`
3. Wrap fields with FormField/FormItem/FormMessage (shadcn) or Controller (RN)
4. Handle submission with \`form.handleSubmit(onSubmit)\`

## Multi-Step Form Pattern
1. Single useForm instance shared across all steps
2. Validate per-step with \`form.trigger(['field1', 'field2'])\`
3. Store step index in local state
4. Show progress indicator with completed/current/future states

## Error Handling
- Display field errors inline below each input
- Show form-level errors (API failures) in a toast or alert
- Disable submit button while \`form.formState.isSubmitting\`

## Rules
- Define ALL form schemas in \`src/lib/schemas/\` for reuse
- Never use uncontrolled inputs with React Native — always use Controller
- Use \`form.reset()\` after successful submission`;
  }

  // 10. state-management — Zustand patterns
  if (slugSet.has("zustand")) {
    skills["state-management/SKILL.md"] = `---
name: "State Management"
description: "Zustand store patterns, selectors, and persistence for ${appName}"
---

# ${appName} — State Management with Zustand

## Store Location
\`src/store/\` — one file per domain (useAuthStore, useUIStore, etc.)

## Store Template
\`\`\`
create<State>()(immer((set, get) => ({
  // state
  items: [],
  isLoading: false,
  // actions
  addItem: (item) => set((state) => { state.items.push(item) }),
  fetchItems: async () => {
    set({ isLoading: true });
    const items = await api.getItems();
    set({ items, isLoading: false });
  },
})))
\`\`\`

## Rules
- Always use selectors: \`useStore(s => s.field)\` — never \`useStore()\`
- Keep server data in TanStack Query, NOT in Zustand
- Use Zustand only for: UI state, user preferences, draft data, modal states
- Use immer middleware for nested state updates
- Use persist middleware for state that should survive app restarts`;
  }

  return skills;
}

// ============================================
// BUILD_AGENT_REGISTRY — subagent templates for .claude/agents/*.md
// ============================================

export const BUILD_AGENT_REGISTRY: Record<string, {
  filename: string;
  name: string;
  description: string;
  epNumber: 1 | 2 | 3 | null;
  model: string;
  tools: string[];
  permissionMode: string;
  skillsToPreload: string[];
  isolation: string | null;
  successCriteria: string[];
  prerequisites: string[];
  requiredSkills: string[];
  systemPromptTemplate: string;
}> = {
  "foundation-builder": {
    filename: "foundation-builder.md",
    name: "Foundation Builder",
    description: "Builds project foundation: init, dependencies, database schema, auth, navigation",
    epNumber: 1,
    model: "sonnet",
    tools: [],
    permissionMode: "bypassPermissions",
    skillsToPreload: ["building-native-ui", "expo-tailwind-setup", "native-data-fetching"],
    isolation: null,
    successCriteria: ["Auth flow works (signup, login, logout)", "Database tables exist and match schema", "All EP1 screens render without errors", "Build passes (npx tsc --noEmit)", "Git repository initialized with initial commit"],
    prerequisites: [".env configured with all EP1 variables", "Required accounts created (see SETUP_WALKTHROUGH.md)", "Plugin marketplaces installed"],
    requiredSkills: ["project-conventions", "database-schema", "screen-spec", "project-setup"],
    systemPromptTemplate: `You are the Foundation Builder for {appName}.

Your job is to execute Execution Prompt 1 (EP1) — the project foundation phase.

## Focus
{epFocus}

## Screens to build
{screenList}

## Rules
- Follow CLAUDE.md conventions exactly
- Install all dependencies before writing feature code
- Set up the database schema and run migrations first
- Configure auth before building any authenticated screens
- Set up navigation structure before individual screens
- Commit after each major milestone (deps, schema, auth, navigation, screens)
- Run /verify-build after each commit to catch errors early`,
  },
  "feature-builder": {
    filename: "feature-builder.md",
    name: "Feature Builder",
    description: "Builds core feature screens: AI integration, CRUD operations, main app functionality",
    epNumber: 2,
    model: "opus",
    tools: [],
    permissionMode: "bypassPermissions",
    skillsToPreload: ["building-native-ui", "native-data-fetching"],
    isolation: null,
    successCriteria: ["All EP2 screens render with loading, error, empty, and populated states", "AI features return responses", "CRUD operations work across all entities", "No TypeScript errors (npx tsc --noEmit)", "All screen render tests pass"],
    prerequisites: ["EP1 complete and verified", "FOUNDATION_REPORT.md exists", "All EP2 env vars set"],
    requiredSkills: ["project-conventions", "screen-spec", "ai-integration"],
    systemPromptTemplate: `You are the Feature Builder for {appName}.

Your job is to execute Execution Prompt 2 (EP2) — the core features phase.

## Focus
{epFocus}

## Screens to build
{screenList}

## Parallelization guidance
If there are 4+ screens and some are independent of each other, consider creating an agent team with @screen-builder teammates for parallel screen building. Screens that share no data dependencies can be built simultaneously in separate worktrees.

## Rules
- Follow CLAUDE.md conventions exactly
- Build screens in dependency order — shared components first, then screens that use them
- Each screen should be fully functional before moving to the next
- Implement proper loading, error, and empty states for every screen
- Connect all screens to the navigation structure from EP1
- Run /verify-build after completing each screen
- Commit after each screen is working`,
  },
  "polish-builder": {
    filename: "polish-builder.md",
    name: "Polish Builder",
    description: "Handles payments, notifications, production readiness, and final polish",
    epNumber: 3,
    model: "sonnet",
    tools: [],
    permissionMode: "bypassPermissions",
    skillsToPreload: ["expo-deployment", "expo-cicd-workflows"],
    isolation: null,
    successCriteria: ["Payment flow works end-to-end in test mode", "Push notifications received on device", "Analytics events firing correctly", "Production build succeeds without errors", "All environment variables set for production"],
    prerequisites: ["EP1 + EP2 complete and verified", "RevenueCat products configured (if applicable)", "Sentry project created (if applicable)", "PostHog project created (if applicable)"],
    requiredSkills: ["project-conventions", "payment-integration", "deployment-checklist"],
    systemPromptTemplate: `You are the Polish Builder for {appName}.

Your job is to execute Execution Prompt 3 (EP3) — the polish and production readiness phase.

## Focus
{epFocus}

## Screens to build
{screenList}

## Rules
- Follow CLAUDE.md conventions exactly
- Integrate payments/subscriptions before building paywall UI
- Configure push notifications after the notification service is set up
- Add analytics tracking to key user flows
- Build settings/profile screens after all services are configured
- Run /verify-build after each major integration
- Test the full user flow end-to-end before marking complete
- Commit after each integration milestone`,
  },
  "screen-builder": {
    filename: "screen-builder.md",
    name: "Screen Builder",
    description: "Specialized single-screen builder for agent team parallel construction",
    epNumber: null,
    model: "sonnet",
    tools: [],
    permissionMode: "bypassPermissions",
    skillsToPreload: ["building-native-ui", "native-data-fetching"],
    isolation: "worktree",
    successCriteria: ["Screen renders all 4 states (loading, error, empty, populated)", "TypeScript check passes (npx tsc --noEmit)", "Screen-specific render test passes", "No modifications to shared components or global state"],
    prerequisites: ["EP1 foundation complete", "Git repository initialized (required for worktree)", "Shared components and navigation structure in place"],
    requiredSkills: ["project-conventions", "screen-spec"],
    systemPromptTemplate: `You are a Screen Builder for {appName}.

You build exactly ONE screen from the Execution Prompt spec. You run in an isolated git worktree so your work does not conflict with other screen builders working in parallel.

## Important: Git Worktree Requirements
This agent runs in a git worktree. The main project MUST have git initialized (git init) before spawning screen-builder agents. After completion, merge the worktree branch back: git merge <worktree-branch> --no-ff.

## Rules
- Build only the screen assigned to you — do not modify other screens
- Follow CLAUDE.md conventions exactly
- Import shared components from the foundation (EP1) — do not recreate them
- Create the screen component, its styles, any screen-specific hooks, and its navigation entry
- Handle all states: loading, error, empty, and populated
- Write a basic render test for the screen
- Run /verify-build when done to ensure no TypeScript errors
- Commit your work with a clear message: "feat: build [ScreenName] screen"
- Do not modify global state, navigation structure, or shared utilities`,
  },
};

const PLATFORM_CONVENTIONS: Record<string, string[]> = {
  "web-nextjs": [
    "Use server components by default; add 'use client' only for interactivity",
    "Colocate API routes under app/api/ using Route Handlers",
    "Use Next.js Image component for all images",
    "Environment variables: prefix with NEXT_PUBLIC_ for client-side access",
    "Use loading.tsx and error.tsx for route-level loading/error states",
  ],
  "mobile-expo": [
    "Use Expo Router for file-based navigation",
    "Use expo-secure-store for sensitive data, AsyncStorage for preferences",
    "Test on both iOS and Android simulators before committing",
    "Use expo-constants for environment variables",
    "Prefer React Native core components over web-based alternatives",
  ],
  both: [
    "Share business logic via a common /shared directory",
    "Platform-specific code uses .web.tsx and .native.tsx extensions",
    "Use responsive design utilities that work across platforms",
    "Environment variables: use platform-appropriate config for each target",
  ],
};

const TECH_CONVENTIONS: Record<string, string> = {
  "supabase-auth": "Use Supabase Auth helpers for session management; never store tokens manually",
  "supabase-postgresql": "Use Drizzle ORM for type-safe database queries; run migrations with drizzle-kit push",
  "supabase-storage": "Use Supabase Storage SDK for file uploads; create separate buckets for public vs private assets",
  "supabase-edge-functions": "Use Deno-based Edge Functions for server-side logic; deploy with supabase functions deploy",
  stripe: "All Stripe API calls MUST happen server-side only; use webhooks for payment status updates",
  "claude-api": "Use the Anthropic SDK with streaming for long responses; implement max_tokens limits",
  "openai-gpt4": "Use the OpenAI SDK with GPT-4.1 or o3; prefer streaming for user-facing AI features",
  "openai-vision": "Use the OpenAI SDK with GPT-4.1 vision or o4-mini with vision for image analysis",
  "firebase-auth": "Use Firebase Auth SDK; configure auth state persistence",
  "firebase-firestore": "Use Firestore security rules; batch writes for related operations",
  "upstash-redis": "Use @upstash/redis REST client; set TTL on all cache entries",
  algolia: "Index data server-side; use InstantSearch components for search UI",
  meilisearch: "Use meilisearch-js client; configure filterable and sortable attributes at index creation",
  "expo-notifications": "Request notification permissions at appropriate UX moment, not on app launch",
  "expo-image-picker": "Use expo-image-picker for camera/gallery access; handle permissions gracefully with fallback messaging",
  revenucat: "Use RevenueCat for subscription management; check entitlements before gating features",
  "tensorflow-lite": "Use react-native-fast-tflite for on-device ML inference; bundle .tflite models in assets",
  sentry: "Initialize Sentry early in app lifecycle; configure source maps for production builds",
  posthog: "Use PostHog SDK for analytics; identify users after auth for cohort analysis",
  "eas-build": "Use EAS Build for cloud builds; configure separate profiles for development, preview, and production",
  "expo-updates": "Configure expo-updates for OTA updates; use separate channels for staging and production",
  zustand: "Use selectors to access store state; never subscribe to the entire store object",
  "tanstack-query": "Use queryKey arrays for cache management; invalidate queries after mutations",
  "react-hook-form": "Use zodResolver for validation; prefer Controller for custom components",
  "expo-router": "Use file-based routing with typed Link components; handle deep links via scheme config",
  nativewind: "Use className prop with Tailwind utilities; configure metro.config.js for NativeWind",
  "react-native-reanimated": "Add reanimated/plugin as last Babel plugin; use worklets for UI-thread animations",
  zod: "Define schemas in src/lib/schemas/; use z.infer for TypeScript types; validate at system boundaries",
  "tanstack-router": "Use createFileRoute for type-safe routes; validate search params with Zod schemas",
};

// ============================================
// ENV_VAR_SOURCES — maps tech slugs to required environment variables
// Used by buildEnvExampleContent() and EP preambles
// ============================================

export const ENV_VAR_SOURCES: Record<string, {
  vars: { name: string; description: string; url: string; requiredBefore: "ep1" | "ep2" | "ep3"; setupGuide?: string }[];
}> = {
  "supabase-auth": {
    vars: [
      { name: "EXPO_PUBLIC_SUPABASE_URL", description: "Supabase project URL", url: "https://supabase.com/dashboard → Project Settings → API", requiredBefore: "ep1", setupGuide: "Create a new Supabase project at supabase.com/dashboard. Go to Project Settings → API. Copy the Project URL." },
      { name: "EXPO_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anonymous/public key", url: "https://supabase.com/dashboard → Project Settings → API", requiredBefore: "ep1", setupGuide: "In the same API settings page, copy the anon/public key (NOT the service_role key — that is for server-side only)." },
    ],
  },
  "supabase-postgresql": {
    vars: [
      { name: "DATABASE_URL", description: "Supabase PostgreSQL connection string", url: "https://supabase.com/dashboard → Project Settings → Database", requiredBefore: "ep1", setupGuide: "Go to Project Settings → Database → Connection string. Use the URI format. IMPORTANT: Use the pooler URL ending in :6543 (not the direct connection on :5432) for serverless environments." },
    ],
  },
  "firebase-auth": {
    vars: [
      { name: "NEXT_PUBLIC_FIREBASE_API_KEY", description: "Firebase API key", url: "https://console.firebase.google.com → Project Settings", requiredBefore: "ep1" },
      { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", description: "Firebase Auth domain", url: "https://console.firebase.google.com → Project Settings", requiredBefore: "ep1" },
      { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", description: "Firebase project ID", url: "https://console.firebase.google.com → Project Settings", requiredBefore: "ep1" },
    ],
  },
  "claude-api": {
    vars: [
      { name: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude", url: "https://console.anthropic.com → API Keys", requiredBefore: "ep2" },
    ],
  },
  "openai-gpt4": {
    vars: [
      { name: "OPENAI_API_KEY", description: "OpenAI API key", url: "https://platform.openai.com → API Keys", requiredBefore: "ep2" },
    ],
  },
  "openai-vision": {
    vars: [
      { name: "OPENAI_API_KEY", description: "OpenAI API key (same key as GPT-5.4 text)", url: "https://platform.openai.com → API Keys", requiredBefore: "ep2" },
    ],
  },
  openrouter: {
    vars: [
      { name: "OPENROUTER_API_KEY", description: "OpenRouter API key (single key for all AI models)", url: "https://openrouter.ai → Keys", requiredBefore: "ep2" },
    ],
  },
  deepgram: {
    vars: [
      { name: "DEEPGRAM_API_KEY", description: "Deepgram speech-to-text API key", url: "https://deepgram.com → Dashboard → API Keys", requiredBefore: "ep2" },
    ],
  },
  "elevenlabs-tts": {
    vars: [
      { name: "ELEVENLABS_API_KEY", description: "ElevenLabs text-to-speech API key", url: "https://elevenlabs.io → Profile → API Keys", requiredBefore: "ep2" },
    ],
  },
  assemblyai: {
    vars: [
      { name: "ASSEMBLYAI_API_KEY", description: "AssemblyAI transcription API key", url: "https://assemblyai.com → Dashboard → API Keys", requiredBefore: "ep2" },
    ],
  },
  "upstash-redis": {
    vars: [
      { name: "UPSTASH_REDIS_REST_URL", description: "Upstash Redis REST endpoint", url: "https://console.upstash.com → Redis → Details", requiredBefore: "ep1" },
      { name: "UPSTASH_REDIS_REST_TOKEN", description: "Upstash Redis REST token", url: "https://console.upstash.com → Redis → Details", requiredBefore: "ep1" },
    ],
  },
  stripe: {
    vars: [
      { name: "STRIPE_SECRET_KEY", description: "Stripe secret API key", url: "https://dashboard.stripe.com → Developers → API Keys", requiredBefore: "ep3" },
      { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", description: "Stripe publishable key", url: "https://dashboard.stripe.com → Developers → API Keys", requiredBefore: "ep3" },
      { name: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook signing secret", url: "https://dashboard.stripe.com → Developers → Webhooks", requiredBefore: "ep3" },
    ],
  },
  revenucat: {
    vars: [
      { name: "REVENUECAT_API_KEY", description: "RevenueCat public API key", url: "https://app.revenuecat.com → Project → API Keys", requiredBefore: "ep3", setupGuide: "Create a RevenueCat project. Create an entitlement named 'premium'. Create an Offering with packages (weekly/monthly/annual/lifetime). Connect App Store Connect and/or Google Play Console. Copy the PUBLIC API key (not secret)." },
      { name: "REVENUECAT_SECRET_KEY", description: "RevenueCat secret API key (server-side)", url: "https://app.revenuecat.com → Project → API Keys", requiredBefore: "ep3", setupGuide: "In the same API Keys page, copy the Secret API key. This is used server-side only for webhook validation and server-to-server calls." },
    ],
  },
  sentry: {
    vars: [
      { name: "NEXT_PUBLIC_SENTRY_DSN", description: "Sentry Data Source Name", url: "https://sentry.io → Project → Settings → Client Keys", requiredBefore: "ep3", setupGuide: "Create a React Native project in Sentry (not Node.js). Copy the DSN from Project Settings → Client Keys (DSN)." },
      { name: "SENTRY_AUTH_TOKEN", description: "Sentry auth token for source maps", url: "https://sentry.io → Settings → Auth Tokens", requiredBefore: "ep3", setupGuide: "Go to Settings → Auth Tokens → Create New Token. Select scopes: project:releases, org:read. Configure org/project slugs in app.config.ts." },
    ],
  },
  posthog: {
    vars: [
      { name: "NEXT_PUBLIC_POSTHOG_KEY", description: "PostHog project API key", url: "https://app.posthog.com → Project → Settings", requiredBefore: "ep3", setupGuide: "Create a PostHog project. Copy the Project API Key from Project Settings." },
      { name: "NEXT_PUBLIC_POSTHOG_HOST", description: "PostHog instance host URL", url: "https://app.posthog.com → Project → Settings", requiredBefore: "ep3", setupGuide: "Note the host URL: us.i.posthog.com (US region) or eu.i.posthog.com (EU region). Use the appropriate region for your data residency requirements." },
    ],
  },
  "expo-notifications": {
    vars: [
      { name: "EXPO_ACCESS_TOKEN", description: "Expo access token for push notifications", url: "https://expo.dev → Account Settings → Access Tokens", requiredBefore: "ep3" },
    ],
  },
  resend: {
    vars: [
      { name: "RESEND_API_KEY", description: "Resend email API key", url: "https://resend.com → API Keys", requiredBefore: "ep2" },
    ],
  },
  "firebase-cloud-messaging": {
    vars: [
      { name: "FIREBASE_SERVER_KEY", description: "Firebase Cloud Messaging server key", url: "https://console.firebase.google.com → Project Settings → Cloud Messaging", requiredBefore: "ep3" },
    ],
  },
  algolia: {
    vars: [
      { name: "NEXT_PUBLIC_ALGOLIA_APP_ID", description: "Algolia application ID", url: "https://algolia.com → Dashboard → API Keys", requiredBefore: "ep2" },
      { name: "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", description: "Algolia search-only API key", url: "https://algolia.com → Dashboard → API Keys", requiredBefore: "ep2" },
      { name: "ALGOLIA_ADMIN_KEY", description: "Algolia admin API key (server-side only)", url: "https://algolia.com → Dashboard → API Keys", requiredBefore: "ep2" },
    ],
  },
  meilisearch: {
    vars: [
      { name: "MEILISEARCH_HOST", description: "Meilisearch instance URL", url: "https://cloud.meilisearch.com or self-hosted", requiredBefore: "ep2" },
      { name: "MEILISEARCH_API_KEY", description: "Meilisearch master/admin key", url: "https://cloud.meilisearch.com → Project → API Keys", requiredBefore: "ep2" },
    ],
  },
  "eas-build": {
    vars: [
      { name: "EXPO_ACCESS_TOKEN", description: "Expo access token for EAS builds", url: "https://expo.dev → Account Settings → Access Tokens", requiredBefore: "ep3" },
    ],
  },
  figma: {
    vars: [
      { name: "FIGMA_ACCESS_TOKEN", description: "Figma personal access token for MCP design bridge", url: "https://figma.com → Settings → Personal Access Tokens", requiredBefore: "ep1" },
    ],
  },
  vercel: {
    vars: [
      { name: "VERCEL_TOKEN", description: "Vercel API token for deployment management", url: "https://vercel.com → Settings → Tokens", requiredBefore: "ep3" },
    ],
  },
  inngest: {
    vars: [
      { name: "INNGEST_EVENT_KEY", description: "Inngest event key for sending events", url: "https://app.inngest.com → Manage → Keys", requiredBefore: "ep3" },
      { name: "INNGEST_SIGNING_KEY", description: "Inngest signing key for serve handler", url: "https://app.inngest.com → Manage → Keys", requiredBefore: "ep3" },
    ],
  },
};

/**
 * Build .env.example file content from selected tech slugs.
 * Groups vars by service with documentation URLs.
 * Deterministic — no AI call.
 */
export function buildEnvExampleContent(selectedTechSlugs: string[], platform: string = "web-nextjs"): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  const isMobile = platform === "mobile-expo";

  lines.push("# Environment Variables");
  lines.push(isMobile
    ? "# Copy this file to .env and fill in your values"
    : "# Copy this file to .env (or .env.local for Next.js) and fill in your values");
  lines.push("# Lines marked [EP1] are needed before running Execution Prompt 1");
  lines.push("# Lines marked [EP2] are needed before running Execution Prompt 2");
  lines.push("# Lines marked [EP3] are needed before running Execution Prompt 3");
  lines.push("");

  // Group by requiredBefore for ordering
  const byPhase: Record<string, { slug: string; vars: typeof ENV_VAR_SOURCES[string]["vars"] }[]> = {
    ep1: [], ep2: [], ep3: [],
  };

  for (const slug of selectedTechSlugs) {
    const source = ENV_VAR_SOURCES[slug];
    if (!source) continue;
    for (const phase of ["ep1", "ep2", "ep3"] as const) {
      const phaseVars = source.vars.filter(v => v.requiredBefore === phase);
      if (phaseVars.length > 0) {
        byPhase[phase].push({ slug, vars: phaseVars });
      }
    }
  }

  for (const phase of ["ep1", "ep2", "ep3"] as const) {
    const entries = byPhase[phase];
    if (entries.length === 0) continue;

    const phaseLabel = phase === "ep1" ? "REQUIRED BEFORE PROMPT 1 (Foundation)"
      : phase === "ep2" ? "REQUIRED BEFORE PROMPT 2 (Core Features)"
      : "REQUIRED BEFORE PROMPT 3 (Polish & Production)";
    lines.push(`# === ${phaseLabel} ===`);
    lines.push("");

    for (const { slug, vars } of entries) {
      const serviceName = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const firstUrl = vars[0]?.url ?? "";
      lines.push(`# ${serviceName} — ${firstUrl}`);
      for (const v of vars) {
        // Swap NEXT_PUBLIC_ ↔ EXPO_PUBLIC_ based on platform
        const envName = isMobile
          ? v.name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_")
          : v.name;
        if (seen.has(envName)) continue;
        seen.add(envName);
        lines.push(`${envName}=your_${envName.toLowerCase().replace(/^(next_public_|expo_public_)/, "")}_here`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Build SETUP_WALKTHROUGH.md content — step-by-step manual setup instructions.
 * Groups services by EP phase with detailed walkthroughs and common gotchas.
 * Deterministic — no AI call.
 */
export function buildSetupWalkthroughContent(selectedTechSlugs: string[], platform: string = "web-nextjs"): string {
  const lines: string[] = [];
  const isMobile = platform === "mobile-expo";
  const adaptEnvName = (name: string) => isMobile ? name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_") : name;

  lines.push("# Setup Walkthrough");
  lines.push("");
  lines.push("Complete all steps below **before running Execution Prompt 1**.");
  lines.push("Each section tells you what to create, what to copy, what to configure, and common gotchas.");
  lines.push("");

  const byPhase: Record<string, Array<{ slug: string; serviceName: string; vars: typeof ENV_VAR_SOURCES[string]["vars"] }>> = { ep1: [], ep2: [], ep3: [] };

  for (const slug of selectedTechSlugs) {
    const source = ENV_VAR_SOURCES[slug];
    if (!source) continue;
    const serviceName = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    for (const phase of ["ep1", "ep2", "ep3"] as const) {
      const phaseVars = source.vars.filter(v => v.requiredBefore === phase);
      if (phaseVars.length > 0) {
        // Avoid duplicate service entries within a phase
        if (!byPhase[phase].some(e => e.slug === slug)) {
          byPhase[phase].push({ slug, serviceName, vars: phaseVars });
        }
      }
    }
  }

  for (const phase of ["ep1", "ep2", "ep3"] as const) {
    const entries = byPhase[phase];
    if (entries.length === 0) continue;

    const phaseLabel = phase === "ep1" ? "Before EP1 (Foundation)"
      : phase === "ep2" ? "Before EP2 (Core Features)"
      : "Before EP3 (Polish & Production)";
    lines.push(`## ${phaseLabel}`);
    lines.push("");

    for (const { serviceName, vars } of entries) {
      lines.push(`### ${serviceName}`);
      lines.push("");

      // What to create
      lines.push("**What to create:**");
      const firstUrl = vars[0]?.url?.split(" → ")[0] ?? "";
      lines.push(`- Sign up / log in at ${firstUrl}`);
      lines.push(`- Create a new project for your app`);
      lines.push("");

      // What to copy
      lines.push("**What to copy to .env:**");
      for (const v of vars) {
        const envName = adaptEnvName(v.name);
        lines.push(`- [ ] \`${envName}\` — ${v.description}`);
        if (v.setupGuide) {
          lines.push(`  - ${v.setupGuide}`);
        }
      }
      lines.push("");

      // Common gotchas per service
      const gotchas = getServiceGotchas(vars[0]?.url ?? "");
      if (gotchas) {
        lines.push("**Common gotchas:**");
        lines.push(gotchas);
        lines.push("");
      }
    }
  }

  // Apple Sign-In section for mobile
  if (isMobile && selectedTechSlugs.includes("supabase-auth")) {
    lines.push("### Apple Sign-In (Required for iOS apps with third-party auth)");
    lines.push("");
    lines.push("**What to create:**");
    lines.push("- [ ] Apple Developer Console → Certificates, Identifiers & Profiles → Identifiers → App IDs → Create App ID");
    lines.push("- [ ] Enable Sign In with Apple capability");
    lines.push("- [ ] Certificates → Create Key → Enable Sign In with Apple → Download .p8 file");
    lines.push("- [ ] Configure the Service ID in Supabase Dashboard → Auth → Providers → Apple");
    lines.push("");
    lines.push("**Common gotchas:**");
    lines.push("- The .p8 key file can only be downloaded ONCE — store it securely");
    lines.push("- You need both the Key ID and Team ID for Supabase configuration");
    lines.push("- Apple Sign-In is REQUIRED by App Store Review if you offer any third-party login");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Verification");
  lines.push("After completing all steps above, run `/check-env` in Claude Code to verify all environment variables are set.");
  lines.push("");

  return lines.join("\n");
}

function getServiceGotchas(url: string): string | null {
  if (url.includes("supabase")) {
    return "- Use the **pooler** connection string (port 6543), not the direct connection (port 5432)\n- The anon key is safe for client-side; the service_role key must NEVER be exposed to clients";
  }
  if (url.includes("revenuecat")) {
    return "- Use the PUBLIC API key for the mobile SDK, not the secret key\n- Products must be created in App Store Connect / Google Play Console FIRST, then mapped in RevenueCat";
  }
  if (url.includes("sentry")) {
    return "- Create a React Native project type (not Node.js or Browser JavaScript)\n- The auth token is for source map uploads — different from the DSN";
  }
  if (url.includes("posthog")) {
    return "- Make sure to use the correct regional host (us.i.posthog.com or eu.i.posthog.com)";
  }
  if (url.includes("stripe")) {
    return "- Use TEST mode keys during development (prefix sk_test_ and pk_test_)\n- Webhook secret is different from the API keys — get it from Developers → Webhooks";
  }
  return null;
}

/**
 * Build Claude Code commands (skills) as a JSON map of { filename: markdownContent }.
 * Deterministic — no AI call.
 */
export function buildClaudeCommandsContent(selectedTechSlugs: string[], platform: string = "web-nextjs"): string {
  const slugSet = new Set(selectedTechSlugs);
  const commands: Record<string, string> = {};
  const isMobile = platform === "mobile-expo";
  const adaptEnvName = (name: string) => isMobile ? name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_") : name;

  // check-env.md — always included
  const envVarNames: string[] = [];
  for (const slug of selectedTechSlugs) {
    const source = ENV_VAR_SOURCES[slug];
    if (source) {
      for (const v of source.vars) {
        const adapted = adaptEnvName(v.name);
        if (!envVarNames.includes(adapted)) envVarNames.push(adapted);
      }
    }
  }
  commands["check-env.md"] = `# Check Environment Variables

Read the .env (or .env.local) file and verify that all required environment variables are set with real values (not placeholder text like "your_..._here").

Required variables to check:
${envVarNames.map(v => `- ${v}`).join("\n")}

For any missing or placeholder variables:
- List which ones are missing
- Show where to get each value (service dashboard URL)
- Do NOT proceed with the build until all variables for the current phase are set`;

  // verify-build.md — always included
  commands["verify-build.md"] = `# Verify Build

Run the build verification to ensure the project compiles without errors.

Steps:
1. Run TypeScript compilation check: npx tsc --noEmit
2. ${isMobile ? "Run: npx expo export --dump-sourcemap to verify the Expo build compiles" : "Run: npm run build to verify production build compiles"}
3. Verify all imports resolve correctly — check for any module not found errors
4. Report any warnings or errors found

If errors are found, fix them before proceeding to the next execution prompt.`;

  // deploy-edge-functions.md — only if supabase-edge-functions
  if (slugSet.has("supabase-edge-functions")) {
    commands["deploy-edge-functions.md"] = `# Deploy Supabase Edge Functions

Deploy all Edge Functions in the supabase/functions/ directory to your Supabase project.

Steps:
1. List all directories under supabase/functions/
2. For each function, run: supabase functions deploy <function-name>
3. Verify each deployment succeeded
4. Test each function endpoint with a basic health check

Prerequisites:
- Supabase CLI must be installed (npm i -g supabase)
- Must be linked to your project (supabase link --project-ref <your-ref>)`;
  }

  // run-tests.md — always included
  commands["run-tests.md"] = `# Run Tests

Run the project test suite to verify all functionality works correctly.

Steps:
1. Run unit and component tests: ${isMobile ? "npx jest --passWithNoTests" : "npx vitest run --passWithNoTests || npx jest --passWithNoTests"}
2. Run E2E tests if Playwright is configured: npx playwright test
3. Run TypeScript type checking: npx tsc --noEmit
4. Report results with pass/fail counts
5. For any failures, show the failing test name and error message
6. Fix any failures before proceeding`;

  // setup-database.md — only if Supabase or Firebase
  if (slugSet.has("supabase-postgresql") || slugSet.has("firebase-firestore")) {
    const dbSteps = slugSet.has("supabase-postgresql")
      ? `Steps:
1. Verify DATABASE_URL is set in .env${isMobile ? "" : ".local"}
2. Run \`npx drizzle-kit push\` to push the schema to the database
3. Verify all tables were created by checking the Supabase dashboard
4. If there are seed data files, run them: \`npx tsx scripts/seed.ts\`
5. Report which tables were created and any errors encountered`
      : `Steps:
1. Verify Firebase project ID is set in environment
2. Deploy Firestore security rules: \`firebase deploy --only firestore:rules\`
3. Verify rules are active in the Firebase console
4. Report deployment status`;
    commands["setup-database.md"] = `# Setup Database

Initialize the database schema and verify the connection.

${dbSteps}`;
  }

  // create-screen.md — always included
  commands["create-screen.md"] = `# Create Screen

Scaffold a new screen from the project's screen pattern catalog.

$arguments
name: The name of the screen to create (e.g., "ProfileScreen")
pattern: Optional pattern to use (e.g., "list-detail", "form", "dashboard")

Steps:
1. Check .claude/skills/screen-spec/SKILL.md for existing screen patterns and assignments
2. Create the screen component file in the appropriate directory
3. Add loading, error, empty, and populated states
4. Register the screen in the navigation structure
5. Add any screen-specific hooks or utilities
6. Run /verify-build to ensure no TypeScript errors`;

  // check-consistency.md — always included
  commands["check-consistency.md"] = `# Check Consistency

Verify pricing, schema, and scope consistency across the project.

Steps:
1. Read .claude/skills/project-conventions/SKILL.md for deferred features list
2. Check that no deferred features are implemented in the codebase
3. If payment integration exists, verify pricing tiers match .claude/skills/payment-integration/SKILL.md
4. If database schema exists, verify table names match .claude/skills/database-schema/SKILL.md
5. Report any inconsistencies found`;

  // deploy.md — always included, content varies by platform
  {
    const deploySteps = isMobile
      ? `Steps:
1. Run /check-env to verify all production env vars are set
2. Run /verify-build to ensure clean compilation
3. Run /run-tests to verify all tests pass
4. Build for production: \`eas build --platform all --profile production\`
5. Submit to app stores: \`eas submit --platform ios\` and \`eas submit --platform android\`
6. Monitor the build status on expo.dev`
      : `Steps:
1. Run /check-env to verify all production env vars are set
2. Run /verify-build to ensure clean compilation
3. Run /run-tests to verify all tests pass
4. Deploy to Vercel: \`npx vercel --prod\`
5. Verify the deployment at the provided URL
6. Check that all environment variables are set in the Vercel dashboard`;
    commands["deploy.md"] = `# Deploy

Deploy the application to production.

${deploySteps}`;
  }

  return JSON.stringify(commands, null, 2);
}

/**
 * Get the list of env vars needed before a specific EP phase.
 */
export function getEnvVarsForPhase(selectedTechSlugs: string[], phase: "ep1" | "ep2" | "ep3", platform: string = "web-nextjs"): string[] {
  const vars: string[] = [];
  const seen = new Set<string>();
  const isMobile = platform === "mobile-expo";
  const adaptEnvName = (name: string) => isMobile ? name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_") : name;
  for (const slug of selectedTechSlugs) {
    const source = ENV_VAR_SOURCES[slug];
    if (!source) continue;
    for (const v of source.vars) {
      const adapted = adaptEnvName(v.name);
      if (v.requiredBefore === phase && !seen.has(adapted)) {
        seen.add(adapted);
        vars.push(adapted);
      }
    }
  }
  return vars;
}

export interface ClaudeMdInput {
  appName: string;
  appPurpose: string;
  platform: string;
  selectedTechSlugs: string[];
  selectedTechnologies: Array<{ techSlug: string; category: string; justification: string }>;
  techDetails: Map<string, { name: string; category: string; setupComplexity: string; docsUrl: string | null; npmPackages: string[]; npmPackagesMobile: string[] }>;
  appScreens: Array<{ screenName: string; promptOrder: number }>;
  epSummaries: { ep1Focus: string; ep2Focus: string; ep3Focus: string };
}

export function buildClaudeMdContent(input: ClaudeMdInput): string {
  const { appName, appPurpose, platform, selectedTechSlugs, selectedTechnologies, techDetails, appScreens, epSummaries } = input;
  const lines: string[] = [];

  // Header
  lines.push(`# ${appName}`);
  lines.push(appPurpose);
  lines.push("");

  // Tech Stack
  lines.push("## Tech Stack");
  const platformLabel = platform === "web-nextjs" ? "Next.js 16 (App Router)"
    : platform === "mobile-expo" ? "Expo SDK 55 (React Native)"
    : "Next.js 16 + Expo SDK 55";
  lines.push(`- **Platform**: ${platformLabel}`);

  // Group techs by category for display
  const categoryMap = new Map<string, string[]>();
  for (const tech of selectedTechnologies) {
    const detail = techDetails.get(tech.techSlug);
    const displayName = detail?.name ?? tech.techSlug;
    const list = categoryMap.get(tech.category) ?? [];
    list.push(displayName);
    categoryMap.set(tech.category, list);
  }
  for (const [category, names] of categoryMap) {
    lines.push(`- **${category}**: ${names.join(", ")}`);
  }
  lines.push("");

  // Architecture conventions
  lines.push("## Architecture");
  const platformConventions = PLATFORM_CONVENTIONS[platform] ?? PLATFORM_CONVENTIONS["web-nextjs"]!;
  for (const conv of platformConventions) {
    lines.push(`- ${conv}`);
  }
  for (const slug of selectedTechSlugs) {
    if (TECH_CONVENTIONS[slug]) {
      lines.push(`- ${TECH_CONVENTIONS[slug]}`);
    }
  }
  lines.push("");

  // Version Control
  lines.push("## Version Control");
  lines.push("- Initialize: `git init && git add -A && git commit -m \"Initial commit from EP1\"`");
  lines.push("- Branch strategy: `main` (production), `develop` (integration), `feature/*` (per-screen)");
  const gitignoreItems = platform === "mobile-expo" || platform === "both"
    ? "node_modules, .env*, .expo, ios/Pods, android/build, *.tflite"
    : "node_modules, .env*, .next, out";
  lines.push(`- Create \`.gitignore\` covering: ${gitignoreItems}`);
  lines.push("- Recommended: Create GitHub repo and push before starting EP2");
  lines.push("");

  // Common Commands
  lines.push("## Common Commands");
  if (platform === "web-nextjs" || platform === "both") {
    lines.push("- `npm run dev` — Start development server");
    lines.push("- `npm run build` — Production build");
    lines.push("- `npm run lint` — Run ESLint");
  }
  if (platform === "mobile-expo" || platform === "both") {
    lines.push("- `npx expo start` — Start Expo dev server");
    lines.push("- `npx expo run:ios` — Run on iOS simulator");
    lines.push("- `npx expo run:android` — Run on Android emulator");
  }
  if (selectedTechSlugs.includes("supabase-postgresql")) {
    lines.push("- `npx drizzle-kit push` — Push schema changes to database");
    lines.push("- `npx drizzle-kit generate` — Generate migration files");
  }
  lines.push("");

  // Required Accounts — things the user must sign up for in a browser
  const isMobilePlatform = platform === "mobile-expo";
  const adaptEnvName = (name: string) => isMobilePlatform ? name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_") : name;
  const accountEntries: { service: string; url: string; whatToCopy: string }[] = [];
  for (const slug of selectedTechSlugs) {
    const source = ENV_VAR_SOURCES[slug];
    if (!source) continue;
    for (const v of source.vars) {
      // Only list the service once (use the first var's URL)
      const serviceName = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      if (!accountEntries.some(a => a.service === serviceName)) {
        accountEntries.push({
          service: serviceName,
          url: v.url.split(" → ")[0],
          whatToCopy: source.vars.map(sv => adaptEnvName(sv.name)).join(", "),
        });
      }
    }
  }
  if (accountEntries.length > 0) {
    lines.push("## Required Accounts");
    lines.push("Create these accounts/projects BEFORE starting. You will need API keys from each.");
    lines.push("");
    for (const entry of accountEntries) {
      lines.push(`- **${entry.service}** — ${entry.url}`);
      lines.push(`  Copy to .env: \`${entry.whatToCopy}\``);
    }
    lines.push("");
  }

  // Environment Variables
  lines.push("## Environment Variables");
  lines.push("See `.env.example` for all required variables with documentation links.");
  lines.push("Fill these in after EP1 builds the project foundation.");
  lines.push("");

  // Setup Flow — numbered instructions for getting started
  lines.push("## Setup Flow");
  lines.push("Follow these steps in order after creating your project directory:");
  lines.push("");
  lines.push("### Automatic (Claude Code handles these)");
  lines.push("1. Project initialization and dependency installation");
  lines.push("2. Database schema creation and migration");
  lines.push("3. Auth configuration and middleware setup");
  lines.push("4. Navigation structure and layout setup");
  lines.push("");
  lines.push("### Manual (you must do these in a browser)");

  const manualSteps: string[] = [];
  let stepNum = 1;
  for (const slug of selectedTechSlugs) {
    const setup = SETUP_STEPS_REGISTRY[slug];
    if (!setup) continue;
    for (const step of setup.setupSteps) {
      if (!manualSteps.includes(step)) {
        manualSteps.push(step);
        lines.push(`${stepNum}. ${step}`);
        stepNum++;
      }
    }
  }
  if (manualSteps.length === 0) {
    lines.push("No manual steps required — all setup is automated.");
  }
  lines.push("");

  // Available Commands
  lines.push("## Available Commands");
  lines.push("Custom Claude Code commands are in `.claude/commands/`. Use them during the build:");
  lines.push("");
  lines.push("- `/check-env` — Verify all environment variables are set (run before each EP)");
  lines.push("- `/verify-build` — Check compilation and TypeScript errors");
  if (selectedTechSlugs.includes("supabase-edge-functions")) {
    lines.push("- `/deploy-edge-functions` — Deploy Supabase Edge Functions");
  }
  if (selectedTechSlugs.includes("supabase-postgresql") || selectedTechSlugs.includes("firebase-firestore")) {
    lines.push("- `/setup-database` — Initialize database schema and verify connection");
  }
  lines.push("- `/create-screen` — Scaffold a new screen from the screen pattern catalog");
  lines.push("- `/check-consistency` — Verify pricing, schema, and scope against anchors");
  lines.push("- `/deploy` — Platform-specific production deployment");
  lines.push("- `/run-tests` — Run test suite (unit + E2E)");
  lines.push("");

  // Plugin marketplaces section
  const pluginSection = buildPluginSetupSection(selectedTechSlugs, platform);
  if (pluginSection) {
    lines.push(pluginSection);
  }

  // Build Strategy inline summary
  const screensByEpForStrategy = new Map<number, string[]>();
  for (const screen of appScreens) {
    const order = screen.promptOrder || 2;
    const list = screensByEpForStrategy.get(order) ?? [];
    list.push(screen.screenName);
    screensByEpForStrategy.set(order, list);
  }
  const ep2ScreenCount = (screensByEpForStrategy.get(2) ?? []).length;

  lines.push("## Build Strategy");
  lines.push("This project uses specialized Claude Code subagents for each build phase.");
  lines.push("Agent definitions are in `.claude/agents/`. See `BUILD_STRATEGY.md` for full details.");
  lines.push("");
  lines.push(`- **EP1 (Foundation)**: \`@foundation-builder\` — ${epSummaries.ep1Focus}`);
  if (ep2ScreenCount >= 4) {
    lines.push(`- **EP2 (Core Features)**: Agent team with \`@screen-builder\` teammates for parallel building (${ep2ScreenCount} screens), or \`@feature-builder\` for sequential`);
  } else {
    lines.push(`- **EP2 (Core Features)**: \`@feature-builder\` — ${epSummaries.ep2Focus}`);
  }
  lines.push(`- **EP3 (Polish)**: \`@polish-builder\` — ${epSummaries.ep3Focus}`);
  lines.push("");
  lines.push("`settings.json` enables agent teams. See `BUILD_STRATEGY.md` for invocation prompts.");
  lines.push("");

  // Screens overview
  lines.push("## App Screens");
  const screensByPrompt = new Map<number, string[]>();
  for (const screen of appScreens) {
    const order = screen.promptOrder || 2;
    const list = screensByPrompt.get(order) ?? [];
    list.push(screen.screenName);
    screensByPrompt.set(order, list);
  }
  if (screensByPrompt.has(1)) {
    lines.push(`### Prompt 1 (Foundation): ${(screensByPrompt.get(1) ?? []).join(", ")}`);
  }
  if (screensByPrompt.has(2)) {
    lines.push(`### Prompt 2 (Core): ${(screensByPrompt.get(2) ?? []).join(", ")}`);
  }
  if (screensByPrompt.has(3)) {
    lines.push(`### Prompt 3 (Polish): ${(screensByPrompt.get(3) ?? []).join(", ")}`);
  }
  lines.push("");

  // Dependency Manifest — consolidated npm install command with platform filtering
  lines.push("## Dependency Manifest");
  const KNOWN_CONFLICTS: Record<string, string[]> = {
    "mobile-expo": ["@sentry/nextjs", "sentry-expo"],
    "web-nextjs": [],
  };
  const platformConflicts = new Set(KNOWN_CONFLICTS[platform] ?? []);
  // Only include tensorflow packages if tensorflow-lite is selected
  if (!selectedTechSlugs.includes("tensorflow-lite")) {
    platformConflicts.add("@tensorflow/tfjs");
    platformConflicts.add("@tensorflow/tfjs-react-native");
  }
  // Only include postgres package if using direct PostgreSQL (not just Supabase client)
  if (!selectedTechSlugs.includes("supabase-postgresql")) {
    platformConflicts.add("postgres");
  }

  const allPackages = new Set<string>();
  const packageCategories = new Map<string, string[]>();
  for (const slug of selectedTechSlugs) {
    const detail = techDetails.get(slug);
    if (detail) {
      const packages = platform === "mobile-expo"
        ? (detail.npmPackagesMobile.length > 0 ? detail.npmPackagesMobile : detail.npmPackages)
        : detail.npmPackages;
      const categoryPkgs: string[] = [];
      for (const pkg of packages) {
        if (!platformConflicts.has(pkg)) {
          allPackages.add(pkg);
          categoryPkgs.push(pkg);
        }
      }
      if (categoryPkgs.length > 0) {
        const existing = packageCategories.get(detail.category) ?? [];
        existing.push(...categoryPkgs);
        packageCategories.set(detail.category, existing);
      }
    }
  }
  if (allPackages.size > 0) {
    const installCmd = platform === "mobile-expo" ? "npx expo install" : "npm install";
    lines.push("All project dependencies grouped by category:");
    lines.push("```bash");
    for (const [category, pkgs] of packageCategories) {
      const uniquePkgs = [...new Set(pkgs)].sort();
      lines.push(`# ${category.charAt(0).toUpperCase() + category.slice(1)}`);
      lines.push(`${installCmd} ${uniquePkgs.join(" ")}`);
    }
    lines.push("```");
  }
  lines.push("");

  // Readiness Checklist
  lines.push("## Readiness Checklist");
  lines.push("Verify these before starting EP2:");
  lines.push("- [ ] All EP1 env vars set (run `/check-env`)");
  lines.push("- [ ] Database schema pushed (`npx drizzle-kit push` or Firestore rules deployed)");
  lines.push("- [ ] Auth flow working (can sign up, log in, log out)");
  lines.push("- [ ] Navigation structure in place (all route files exist)");
  lines.push("- [ ] Build passes (`npm run build` or `npx expo export`)");
  lines.push("");

  // MCP reference
  lines.push("## MCP Servers");
  lines.push("See .mcp.json for configured MCP servers. Environment variables marked with `${...}` must be set before use.");
  lines.push("");

  return lines.join("\n");
}

export function validateClaudeMd(
  claudeMdContent: string,
  selectedTechSlugs: string[],
  platform: string
): string[] {
  const issues: string[] = [];

  // Check: every selected tech slug has a corresponding convention or mention
  for (const slug of selectedTechSlugs) {
    if (!claudeMdContent.toLowerCase().includes(slug.replace(/-/g, " ").toLowerCase()) &&
        !claudeMdContent.includes(slug)) {
      // Check if the tech name (not slug) appears
      const convention = TECH_CONVENTIONS[slug];
      if (convention && !claudeMdContent.includes(convention.split(";")[0])) {
        issues.push(`Tech "${slug}" not mentioned in CLAUDE.md`);
      }
    }
  }

  // Check: every env var source has a matching line
  for (const slug of selectedTechSlugs) {
    const source = ENV_VAR_SOURCES[slug];
    if (!source) continue;
    for (const v of source.vars) {
      const envName = platform === "mobile-expo" ? v.name.replace(/^NEXT_PUBLIC_/, "EXPO_PUBLIC_") : v.name;
      if (!claudeMdContent.includes(envName)) {
        issues.push(`Env var "${envName}" from tech "${slug}" not referenced in CLAUDE.md`);
      }
    }
  }

  // Check: MCP server references are valid
  const mcpMentions = claudeMdContent.match(/MCP|mcp\.json/gi);
  if (!mcpMentions && selectedTechSlugs.some(s =>
    Object.values(MCP_SERVER_REGISTRY).some(m => m.triggerSlugs.includes(s))
  )) {
    issues.push("CLAUDE.md does not mention MCP servers despite having tech-triggered MCP inclusions");
  }

  return issues;
}

export function buildMcpJsonContent(selectedTechSlugs: string[], platform: string = "web-nextjs"): string {
  const slugSet = new Set(selectedTechSlugs);
  const mcpServers: Record<string, Record<string, unknown>> = {};
  const includedServerNames: string[] = [];

  for (const [_key, server] of Object.entries(MCP_SERVER_REGISTRY)) {
    // Platform filter: skip servers that don't match the project platform
    if (server.platformFilter && server.platformFilter !== "both") {
      if (server.platformFilter !== platform && platform !== "both") continue;
    }

    // Include if always-on (empty triggerSlugs) or if any trigger slug matches
    const shouldInclude = server.triggerSlugs.length === 0 ||
      server.triggerSlugs.some((slug) => slugSet.has(slug));

    if (shouldInclude) {
      if (server.transport === "http" && server.url) {
        // HTTP transport — simpler config, no npx required
        const entry: Record<string, unknown> = { url: server.url };
        if (Object.keys(server.env).length > 0) {
          entry.headers = Object.fromEntries(
            Object.entries(server.env).map(([k, v]) => [`x-${k.toLowerCase().replace(/_/g, "-")}`, v])
          );
        }
        mcpServers[server.serverName] = entry;
      } else {
        // stdio transport
        const entry: Record<string, unknown> = {
          command: server.command!,
          args: server.args!,
        };
        if (Object.keys(server.env).length > 0) {
          entry.env = server.env;
        }
        mcpServers[server.serverName] = entry;
      }
      includedServerNames.push(server.serverName);
    }
  }

  const result = JSON.stringify({ mcpServers }, null, 2);

  // Append Windows compatibility note for stdio servers
  const hasStdioServers = includedServerNames.some((name) => {
    const entry = Object.values(MCP_SERVER_REGISTRY).find((s) => s.serverName === name);
    return entry?.transport === "stdio";
  });

  if (hasStdioServers) {
    const windowsNote = [
      "",
      "// NOTE: Windows users (not WSL) need to wrap stdio commands with cmd /c.",
      "// Example: change { \"command\": \"npx\", \"args\": [\"-y\", \"@package\"] }",
      "// to: { \"command\": \"cmd\", \"args\": [\"/c\", \"npx\", \"-y\", \"@package\"] }",
    ].join("\n");
    return result + "\n" + windowsNote;
  }

  return result;
}

/** Get the list of MCP server names included for a given tech stack + platform. Used by settings generation. */
export function getIncludedMcpServerNames(selectedTechSlugs: string[], platform: string = "web-nextjs"): string[] {
  const slugSet = new Set(selectedTechSlugs);
  const names: string[] = [];
  for (const [_key, server] of Object.entries(MCP_SERVER_REGISTRY)) {
    if (server.platformFilter && server.platformFilter !== "both") {
      if (server.platformFilter !== platform && platform !== "both") continue;
    }
    const shouldInclude = server.triggerSlugs.length === 0 ||
      server.triggerSlugs.some((slug) => slugSet.has(slug));
    if (shouldInclude) names.push(server.serverName);
  }
  return names;
}

// ============================================
// buildPluginSetupSection — generates plugin marketplace commands for CLAUDE.md
// Uses modern /plugin marketplace add + /plugin install syntax
// ============================================

export function buildPluginSetupSection(
  selectedTechSlugs: string[],
  platform: string
): string | null {
  const slugSet = new Set(selectedTechSlugs);
  const isMobile = platform === "mobile-expo" || platform === "both";

  // Collect repos and their skills
  const repoSkills = new Map<string, { skills: string[]; description: string }>();

  for (const [_key, entry] of Object.entries(PLUGIN_MARKETPLACE_REGISTRY)) {
    // Platform filter
    if (entry.platformFilter === "mobile-expo" && !isMobile) continue;
    if (entry.platformFilter === "web-nextjs" && platform === "mobile-expo") continue;

    // Slug-triggered entries: include if any trigger slug matches
    const slugTriggered = entry.triggerSlugs.length > 0;
    if (slugTriggered && !entry.triggerSlugs.some((s) => slugSet.has(s))) continue;

    const existing = repoSkills.get(entry.repo);
    if (existing) {
      for (const skill of entry.skills) {
        if (!existing.skills.includes(skill)) existing.skills.push(skill);
      }
    } else {
      repoSkills.set(entry.repo, { skills: [...entry.skills], description: entry.description });
    }
  }

  if (repoSkills.size === 0) return null;

  const lines: string[] = [];
  lines.push("## Plugin Marketplaces (Manual Setup)");
  lines.push("> Plugin commands must be run manually by the user in Claude Code. They cannot be automated within execution prompts.");
  lines.push("");
  lines.push("Run these commands yourself before starting EP1:");
  lines.push("");

  for (const [repo, { skills, description }] of repoSkills) {
    lines.push(`### ${repo}`);
    lines.push(description);
    lines.push("");
    lines.push(`- [ ] \`/plugin marketplace add ${repo}\``);
    for (const skill of skills) {
      lines.push(`- [ ] \`/plugin install ${skill}@${repo}\``);
    }
    lines.push("");
  }

  lines.push("### Bundled Project Skills");
  lines.push("Project-specific skills are bundled in `.claude/skills/`. They auto-load based on context.");
  lines.push("");

  return lines.join("\n");
}

// ============================================
// buildAgentDefinitions — generates .claude/agents/*.md files
// ============================================

export function buildAgentDefinitions(input: ClaudeMdInput): Record<string, string> {
  const { appName, selectedTechSlugs, appScreens, epSummaries } = input;
  const slugSet = new Set(selectedTechSlugs);

  const screensByEp = new Map<number, string[]>();
  for (const screen of appScreens) {
    const order = screen.promptOrder || 2;
    const list = screensByEp.get(order) ?? [];
    list.push(screen.screenName);
    screensByEp.set(order, list);
  }

  // Map each agent to relevant bundled skill directories
  const getBundledSkills = (epNumber: 1 | 2 | 3 | null): string[] => {
    const skills: string[] = ["project-conventions"];
    if (slugSet.has("supabase-postgresql") || slugSet.has("firebase-firestore")) {
      skills.push("database-schema");
    }
    if (epNumber === 1) {
      skills.push("screen-spec");
    }
    if (epNumber === 2) {
      skills.push("screen-spec");
      if (slugSet.has("claude-api") || slugSet.has("openai-gpt4") || slugSet.has("openai-vision")) {
        skills.push("ai-integration");
      }
    }
    if (epNumber === 3) {
      if (slugSet.has("stripe") || slugSet.has("revenucat")) {
        skills.push("payment-integration");
      }
      skills.push("deployment-checklist");
    }
    return skills;
  };

  const result: Record<string, string> = {};

  for (const [_key, agent] of Object.entries(BUILD_AGENT_REGISTRY)) {
    // Determine EP focus and screen list for this agent
    let epFocus = "";
    let screenList = "N/A — utility agent";

    if (agent.epNumber === 1) {
      epFocus = epSummaries.ep1Focus;
      screenList = (screensByEp.get(1) ?? []).join(", ") || "None assigned";
    } else if (agent.epNumber === 2) {
      epFocus = epSummaries.ep2Focus;
      screenList = (screensByEp.get(2) ?? []).join(", ") || "None assigned";
    } else if (agent.epNumber === 3) {
      epFocus = epSummaries.ep3Focus;
      screenList = (screensByEp.get(3) ?? []).join(", ") || "None assigned";
    }

    // Get bundled skills for this agent's EP
    const bundledSkills = getBundledSkills(agent.epNumber);

    // Build YAML frontmatter with skills array
    const frontmatter: string[] = ["---"];
    frontmatter.push(`name: "${agent.name}"`);
    frontmatter.push(`description: "${agent.description}"`);
    frontmatter.push(`model: ${agent.model}`);
    if (agent.tools.length > 0) {
      frontmatter.push(`tools: [${agent.tools.map((t) => `"${t}"`).join(", ")}]`);
    }
    if (bundledSkills.length > 0) {
      frontmatter.push(`skills: [${bundledSkills.map((s) => `"${s}"`).join(", ")}]`);
    }
    if (agent.isolation) {
      frontmatter.push(`isolation: ${agent.isolation}`);
    }
    frontmatter.push("---");
    frontmatter.push("");

    // Substitute template variables
    const systemPrompt = agent.systemPromptTemplate
      .replace(/\{appName\}/g, appName)
      .replace(/\{epFocus\}/g, epFocus)
      .replace(/\{screenList\}/g, screenList);

    // Append success criteria and prerequisites
    const extraSections: string[] = [];
    if (agent.prerequisites.length > 0) {
      extraSections.push(`\n## Prerequisites\n${agent.prerequisites.map(p => `- ${p}`).join("\n")}`);
    }
    if (agent.successCriteria.length > 0) {
      extraSections.push(`\n## Success Criteria\n${agent.successCriteria.map(c => `- [ ] ${c}`).join("\n")}`);
    }

    result[agent.filename] = frontmatter.join("\n") + systemPrompt + extraSections.join("\n");
  }

  return result;
}

// ============================================
// buildBuildStrategyContent — generates BUILD_STRATEGY.md
// ============================================

export function buildBuildStrategyContent(input: ClaudeMdInput): string {
  const { appName, appScreens, epSummaries } = input;

  const screensByEp = new Map<number, string[]>();
  for (const screen of appScreens) {
    const order = screen.promptOrder || 2;
    const list = screensByEp.get(order) ?? [];
    list.push(screen.screenName);
    screensByEp.set(order, list);
  }

  const ep1Screens = screensByEp.get(1) ?? [];
  const ep2Screens = screensByEp.get(2) ?? [];
  const ep3Screens = screensByEp.get(3) ?? [];

  const { selectedTechSlugs, platform } = input;
  const slugSet = new Set(selectedTechSlugs);

  const lines: string[] = [];
  lines.push(`# Build Strategy: ${appName}`);
  lines.push("");
  lines.push("## Overview");
  lines.push("This project uses a 3-phase sequential build with specialized Claude Code subagents.");
  lines.push("Each phase has a dedicated agent optimized for that type of work.");
  lines.push("**Start with Phase 0** to set up your Claude Code environment before writing any code.");
  lines.push("");

  // Phase 0: Environment Setup
  lines.push("## Phase 0: Environment Setup");
  lines.push("**Before writing any code, set up your Claude Code environment:**");
  lines.push("");
  lines.push("### 1. Plugin Marketplaces");
  lines.push("Install external skill marketplaces for domain-specific guidance:");
  lines.push("```bash");
  const isMobile = platform === "mobile-expo" || platform === "both";
  if (isMobile) {
    lines.push("/plugin marketplace add expo/skills");
    lines.push("/plugin marketplace add callstackincubator/agent-skills");
    lines.push("/plugin marketplace add software-mansion-labs/react-native-skills");
  }
  lines.push("/plugin marketplace add anthropics/claude-plugins-official");
  lines.push("```");
  lines.push("");
  lines.push("### 2. Bundled Skills");
  lines.push("Project-specific skills are already bundled in `.claude/skills/`. They auto-load based on context:");
  lines.push("- `project-conventions` — Tech stack, naming, and architecture rules");
  if (slugSet.has("supabase-postgresql") || slugSet.has("firebase-firestore")) {
    lines.push("- `database-schema` — Canonical tables, columns, and RLS policies");
  }
  lines.push("- `screen-spec` — Screen-to-pattern mapping and per-screen tech assignments");
  if (slugSet.has("stripe") || slugSet.has("revenucat")) {
    lines.push("- `payment-integration` — Pricing tiers, free limits, and paywall rules");
  }
  lines.push("- `deployment-checklist` — Build profiles and submission guidelines");
  lines.push("- `project-setup` — First-run environment setup guide");
  lines.push("");
  lines.push("### 3. Manual Setup");
  lines.push("Complete all manual setup steps in `SETUP_WALKTHROUGH.md` — create accounts, configure services, and collect API keys.");
  lines.push("");
  lines.push("### 4. Environment Variables");
  lines.push("Copy `.env.example` to `.env.local` and fill in all values marked REQUIRED.");
  lines.push("");
  lines.push("### 5. Version Control");
  lines.push("Initialize git repository and create a remote on GitHub:");
  lines.push("```bash");
  lines.push("git init && git add -A && git commit -m \"Initial project setup\"");
  lines.push("```");
  lines.push("");
  lines.push("### 6. Verify Setup");
  lines.push("Run `/check-env` to validate your environment before proceeding.");
  lines.push("");

  // Phase 1
  lines.push("## Phase 1: Foundation");
  lines.push(`**Agent**: \`@foundation-builder\``);
  lines.push(`**Focus**: ${epSummaries.ep1Focus}`);
  lines.push(`**Screens**: ${ep1Screens.length > 0 ? ep1Screens.join(", ") : "N/A"} (${ep1Screens.length} screens)`);
  lines.push("**Prerequisites**: .env configured, required accounts created");
  lines.push("**Deliverables**: Project scaffolding, database schema, auth flow, navigation structure");
  lines.push("");
  lines.push("### How to run");
  lines.push("```");
  lines.push("@foundation-builder Execute EP1. The full Execution Prompt 1 is in the Execution Prompts document.");
  lines.push("```");
  lines.push("");
  lines.push("### Verification");
  lines.push("- Run `/verify-build` — must compile with no TypeScript errors");
  lines.push("- Run `/check-env` — all EP1 env vars must be set");
  lines.push("- Manual: confirm auth flow works (sign up, sign in, sign out)");
  lines.push("- Git commit before proceeding to Phase 2");
  lines.push("");

  // Phase 2
  lines.push("## Phase 2: Core Features");
  lines.push(`**Agent**: ${ep2Screens.length >= 4 ? "Agent team with `@screen-builder` teammates (recommended)" : "`@feature-builder`"}`);
  lines.push(`**Focus**: ${epSummaries.ep2Focus}`);
  lines.push(`**Screens**: ${ep2Screens.join(", ")} (${ep2Screens.length} screens)`);
  lines.push("**Prerequisites**: Phase 1 complete and verified");
  lines.push("**Deliverables**: All core feature screens functional with proper states");
  lines.push("");

  if (ep2Screens.length >= 4) {
    lines.push("### Option A: Agent Team (Recommended for 4+ screens)");
    lines.push("Use an agent team to build independent screens in parallel:");
    lines.push("```");
    lines.push(`Create a team to build EP2 screens for ${appName}. Use @screen-builder as the teammate agent.`);
    lines.push(`Assign each teammate one screen from EP2. The screens are: ${ep2Screens.join(", ")}.`);
    lines.push("Build independent screens in parallel, then integrate shared state.");
    lines.push("```");
    lines.push("");
    lines.push("### Option B: Sequential Build");
    lines.push("For simpler coordination, use the feature builder sequentially:");
    lines.push("```");
    lines.push("@feature-builder Execute EP2. The full Execution Prompt 2 is in the Execution Prompts document.");
    lines.push("```");
  } else {
    lines.push("### How to run");
    lines.push("```");
    lines.push("@feature-builder Execute EP2. The full Execution Prompt 2 is in the Execution Prompts document.");
    lines.push("```");
  }
  lines.push("");
  lines.push("### Verification");
  lines.push("- Run `/verify-build` — must compile with no TypeScript errors");
  lines.push("- Manual: test each screen's loading, error, and populated states");
  lines.push("- Manual: verify navigation between all screens works");
  lines.push("- Git commit before proceeding to Phase 3");
  lines.push("");

  // Phase 3
  lines.push("## Phase 3: Polish & Production");
  lines.push(`**Agent**: \`@polish-builder\``);
  lines.push(`**Focus**: ${epSummaries.ep3Focus}`);
  lines.push(`**Screens**: ${ep3Screens.length > 0 ? ep3Screens.join(", ") : "N/A"} (${ep3Screens.length} screens)`);
  lines.push("**Prerequisites**: Phase 2 complete and verified");
  lines.push("**Deliverables**: Payments, notifications, analytics, production config");
  lines.push("");
  lines.push("### How to run");
  lines.push("```");
  lines.push("@polish-builder Execute EP3. The full Execution Prompt 3 is in the Execution Prompts document.");
  lines.push("```");
  lines.push("");
  lines.push("### Verification");
  lines.push("- Run `/verify-build` — must compile with no TypeScript errors");
  lines.push("- Run `/check-env` — all env vars must be set");
  lines.push("- Manual: test payment flow end-to-end (use RevenueCat sandbox mode / Stripe test mode as applicable)");
  lines.push("- Manual: verify push notifications on device");
  lines.push("- Run `/run-tests` — all tests should pass");
  lines.push("- Git commit and tag as v1.0.0");
  lines.push("");

  // Agent Teams section
  if (ep2Screens.length >= 4) {
    lines.push("## Agent Teams for Parallel Screen Building");
    lines.push("");
    lines.push("When EP2 has 4+ screens, parallel building with agent teams significantly speeds up development.");
    lines.push("Each `@screen-builder` teammate works in an isolated git worktree, preventing merge conflicts.");
    lines.push("");
    lines.push("### How it works");
    lines.push("1. The team lead analyzes EP2 screen dependencies");
    lines.push("2. Independent screens are assigned to `@screen-builder` teammates");
    lines.push("3. Each teammate builds their screen in a worktree branch");
    lines.push("4. The lead merges completed screens and handles integration");
    lines.push("");
    lines.push("### Prerequisites");
    lines.push("- `settings.json` must have `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` set to `\"1\"`");
    lines.push("- Phase 1 must be complete (shared components and navigation exist)");
    lines.push("");
  }

  // Settings reference
  lines.push("## Settings");
  lines.push("The `settings.json` file in `.claude/` enables agent teams and pre-approves common build operations.");
  lines.push("See the generated `settings.json` for the full configuration.");

  return lines.join("\n");
}

// ============================================
// buildClaudeSettingsContent — generates .claude/settings.json
// ============================================

export function buildClaudeSettingsContent(input: ClaudeMdInput): string {
  const settings: {
    env: Record<string, string>;
    permissions: { allow: string[] };
  } = {
    env: {
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1",
    },
    permissions: {
      allow: [
        "Edit",
        "Write",
        "Bash(npm *)",
        "Bash(npx *)",
      ],
    },
  };

  // Add platform-specific permissions
  if (input.platform === "mobile-expo" || input.platform === "both") {
    settings.permissions.allow.push("Bash(expo *)");
    settings.permissions.allow.push("Bash(eas *)");
  }

  // Add MCP tool permissions for included servers
  const mcpServerNames = getIncludedMcpServerNames(input.selectedTechSlugs, input.platform);
  for (const name of mcpServerNames) {
    settings.permissions.allow.push(`mcp__${name}__*`);
  }

  return JSON.stringify(settings, null, 2);
}

// Visual Strategy is split into two schemas to stay within provider grammar limits.
// Part A: Business & Market (personas, revenue, competitive, market gaps)
// Part B: Technical & Financial (risks, timeline, projections, data model, go/no-go)

export const visualStrategySchemaA = z.object({
  personas: z.array(z.object({
    name: z.string(),
    tagline: z.string(),
    demographics: z.string(),
    frustrations: z.array(z.string()),
    goals: z.array(z.string()),
    willingnessToPay: z.string(),
    avatar: z.string(),
  })),
  revenueModel: z.object({
    strategy: z.string(),
    tiers: z.array(z.object({
      name: z.string(),
      price: z.string(),
      features: z.array(z.string()),
      isPopular: z.boolean(),
    })),
    projectedArpu: z.string(),
    monthlyProjections: z.array(z.object({
      month: z.number(),
      users: z.number(),
      revenue: z.number(),
    })).describe("6 entries: months 1, 3, 5, 7, 9, 12"),
  }),
  competitiveMatrix: z.array(z.object({
    name: z.string(),
    isOurs: z.boolean(),
    scores: z.array(z.object({ category: z.string(), score: z.number() })),
  })).describe("Max 4 entries: our app + 3 competitors"),
  competitiveDetails: z.array(z.object({
    name: z.string(),
    isOurs: z.boolean(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    marketPosition: z.string(),
    pricing: z.string(),
    userBase: z.string(),
  })).describe("Same 4 entries as competitiveMatrix"),
  marketData: z.array(z.object({
    segment: z.string(),
    size: z.number().describe("Segment size in millions USD, $10M-$500M for niche categories"),
    growth: z.number(),
    ourShare: z.number().describe("Our market share %, must be < 0.5% Year 1 for indie app"),
  })).describe("3-4 market segments"),
  marketGapAnalysis: z.array(z.object({
    gap: z.string(),
    category: z.enum(["unserved_need", "underserved_segment", "blue_ocean", "feature_gap"]),
    currentAlternatives: z.string(),
    opportunitySize: z.string(),
    difficultyToAddress: z.enum(["low", "medium", "high"]),
    ourApproach: z.string(),
  })).describe("4-6 market gaps"),
});

export const visualStrategySchemaB = z.object({
  risks: z.array(z.object({
    risk: z.string(),
    category: z.enum(["market", "technical", "financial", "operational", "competitive"]),
    probability: z.enum(["high", "medium", "low"]),
    impact: z.enum(["high", "medium", "low"]),
    mitigation: z.string(),
  })).describe("Max 5 risks"),
  timeline: z.array(z.object({
    phase: z.string(),
    duration: z.string(),
    milestones: z.array(z.string()),
    keyDeliverables: z.array(z.string()),
  })),
  revenueProjections: z.object({
    cac: z.string(),
    ltv: z.string(),
    ltvCacRatio: z.number(),
    monthlyChurnRate: z.string(),
    grossMargin: z.string(),
    breakEvenMonth: z.number(),
    unitEconomics: z.array(z.object({
      metric: z.string(),
      value: z.string(),
      notes: z.string(),
    })),
    yearlyProjections: z.array(z.object({
      year: z.number(),
      users: z.number(),
      revenue: z.number(),
      costs: z.number(),
      profit: z.number(),
    })).describe("3 years"),
  }),
  dataModel: z.array(z.object({
    entity: z.string(),
    description: z.string(),
    keyAttributes: z.array(z.string()),
    relationships: z.array(z.object({
      relatedEntity: z.string(),
      type: z.enum(["one_to_one", "one_to_many", "many_to_many"]),
      description: z.string(),
    })),
  })).describe("5-8 core data entities"),
  goNoGoScorecard: z.object({
    overallVerdict: z.enum(["strong_go", "go", "conditional_go", "no_go"]),
    investmentThesis: z.string(),
    scores: z.array(z.object({
      dimension: z.string(),
      score: z.number(),
      weight: z.number(),
      reasoning: z.string(),
    })).describe("6-8 dimensions"),
    weightedScore: z.number(),
    keyRisks: z.array(z.string()),
    keyOpportunities: z.array(z.string()),
    recommendation: z.string(),
  }),
});

/**
 * Format real Scout data as "ground truth" anchors for the Visual Strategy prompt.
 * Extracts actual store metrics, sentiment data, pricing signals, and composite scores
 * so the AI calibrates its charts/scorecards against real numbers instead of fabricating them.
 */
export function formatRealDataContext(ctx: ArchitectContext): string {
  const sections: string[] = [];

  if (ctx.type === "opportunity") {
    const { scrapedApp, sentiment, score, reviews } = ctx.opportunity;

    // Scout composite scores
    sections.push(`REAL DATA — SCOUT COMPOSITE SCORES:
- Market Size: ${score.marketSize}/100
- Feature Gap Opportunity: ${score.featureGapScore}/100
- AI Feasibility: ${score.feasibility}/100
- User Dissatisfaction: ${score.dissatisfaction}/100
- Composite: ${score.compositeScore}/100 (weighted: 30% market + 40% feature gap + 30% feasibility)`);

    // Store metrics
    const storeLines = [
      `- "${scrapedApp.title}": ${scrapedApp.score}/5 rating, ${scrapedApp.ratings.toLocaleString()} ratings, ${scrapedApp.installs} installs`,
    ];
    if (scrapedApp.price != null) storeLines.push(`  Price: ${scrapedApp.priceText ?? `$${scrapedApp.price}`}`);
    if (scrapedApp.free != null) storeLines.push(`  Free: ${scrapedApp.free ? "Yes" : "No"}${scrapedApp.offersIAP ? " (offers IAP)" : ""}`);
    if (scrapedApp.histogram) {
      const h = scrapedApp.histogram;
      storeLines.push(`  Rating distribution: 1★=${h["1"] ?? 0}, 2★=${h["2"] ?? 0}, 3★=${h["3"] ?? 0}, 4★=${h["4"] ?? 0}, 5★=${h["5"] ?? 0}`);
      // Use histogram sum as install proxy when installs shows "N/A"
      const histSum = (h["1"] ?? 0) + (h["2"] ?? 0) + (h["3"] ?? 0) + (h["4"] ?? 0) + (h["5"] ?? 0);
      if (histSum > 0 && (!scrapedApp.installs || scrapedApp.installs === "N/A")) {
        storeLines.push(`  Estimated installs (from ratings × ~40): ~${(histSum * 40).toLocaleString()}`);
      }
    }
    sections.push(`REAL DATA — COMPETITOR STORE METRICS:\n${storeLines.join("\n")}`);

    // Sample user quotes
    const negativeQuotes = reviews.filter((r) => r.score <= 2).slice(0, 3).map((r) => `- "${r.text}" (${r.score}★)`);
    if (negativeQuotes.length > 0) {
      sections.push(`REAL DATA — SAMPLE NEGATIVE REVIEWS:\n${negativeQuotes.join("\n")}`);
    }

  } else {
    // Master Idea — aggregate across all competitor opportunities
    const { masterIdea, opportunities } = ctx;

    // Scout composite scores (aggregated)
    if (opportunities.length > 0) {
      const avgMarket = Math.round(opportunities.reduce((s, o) => s + o.score.marketSize, 0) / opportunities.length);
      const avgFeatureGap = Math.round(opportunities.reduce((s, o) => s + o.score.featureGapScore, 0) / opportunities.length);
      const avgFeasibility = Math.round(opportunities.reduce((s, o) => s + o.score.feasibility, 0) / opportunities.length);
      const avgDissatisfaction = Math.round(opportunities.reduce((s, o) => s + o.score.dissatisfaction, 0) / opportunities.length);
      const avgComposite = Math.round(opportunities.reduce((s, o) => s + o.score.compositeScore, 0) / opportunities.length);
      sections.push(`REAL DATA — SCOUT COMPOSITE SCORES (averaged across ${opportunities.length} competitors):
- Market Size: ${avgMarket}/100
- Feature Gap Opportunity: ${avgFeatureGap}/100
- AI Feasibility: ${avgFeasibility}/100
- User Dissatisfaction: ${avgDissatisfaction}/100
- Composite: ${avgComposite}/100 (weighted: 30% market + 40% feature gap + 30% feasibility)`);
    }

    // Feasibility / Viability from master idea if available
    if (masterIdea.feasibilityAssessment) {
      sections.push(`REAL DATA — FEASIBILITY SCORE: ${masterIdea.feasibilityAssessment.score}/100 — ${masterIdea.feasibilityAssessment.reasoning}`);
    }
    if (masterIdea.marketViability) {
      sections.push(`REAL DATA — MARKET VIABILITY SCORE: ${masterIdea.marketViability.score}/100 — ${masterIdea.marketViability.reasoning}`);
    }

    // Filter competitors: exclude those with low gap scores (likely irrelevant)
    const relevantCompetitors = masterIdea.competitorFlaws.filter((cf) => {
      const opp = opportunities.find((o) => o.scrapedApp.id === cf.competitorAppId);
      if (opp?.gapAnalysis) {
        const gapComparison = opp.gapAnalysis.competitorComparisons.find(
          (c) => c.competitorId === cf.competitorAppId
        );
        if (gapComparison && gapComparison.gapScore <= 60) {
          console.log(`[architect] Filtering out low-relevance competitor "${cf.competitorName}" (gapScore=${gapComparison.gapScore})`);
          return false;
        }
      }
      return true;
    });

    // Competitor store metrics
    const storeLines: string[] = [];
    for (const cf of relevantCompetitors) {
      const opp = opportunities.find((o) => o.scrapedApp.id === cf.competitorAppId);
      const app = opp?.scrapedApp;
      let line = `- "${cf.competitorName}": ${cf.marketData.rating}/5 rating, ${cf.marketData.ratings.toLocaleString()} ratings, ${cf.marketData.installs} installs`;
      if (app?.price != null) line += `, price: ${app.priceText ?? `$${app.price}`}`;
      if (app?.free != null) line += `, free: ${app.free ? "yes" : "no"}${app.offersIAP ? " (IAP)" : ""}`;
      if (app?.histogram) {
        const h = app.histogram;
        line += `\n  Rating distribution: 1★=${h["1"] ?? 0}, 2★=${h["2"] ?? 0}, 3★=${h["3"] ?? 0}, 4★=${h["4"] ?? 0}, 5★=${h["5"] ?? 0}`;
        // Use histogram sum as install proxy when installs shows "N/A"
        const histSum = (h["1"] ?? 0) + (h["2"] ?? 0) + (h["3"] ?? 0) + (h["4"] ?? 0) + (h["5"] ?? 0);
        if (histSum > 0 && (!cf.marketData.installs || cf.marketData.installs === "N/A")) {
          line += `\n  Estimated installs (from ratings × ~40): ~${(histSum * 40).toLocaleString()}`;
        }
      }
      storeLines.push(line);
    }
    if (storeLines.length > 0) {
      sections.push(`REAL DATA — COMPETITOR STORE METRICS:\n${storeLines.join("\n")}`);
    }

    // Pricing signals
    const pricingSignals: string[] = [];
    const monetizationModels: string[] = [];
    for (const cf of relevantCompetitors) {
      const opp = opportunities.find((o) => o.scrapedApp.id === cf.competitorAppId);
      if (opp?.scrapedApp.price != null && opp.scrapedApp.price > 0) {
        pricingSignals.push(`"${cf.competitorName}" charges ${opp.scrapedApp.priceText ?? `$${opp.scrapedApp.price}`}`);
      }
      // Detect monetization model from app metadata
      if (opp?.scrapedApp) {
        const app = opp.scrapedApp;
        if (app.free && app.offersIAP) monetizationModels.push(`"${cf.competitorName}": freemium with IAP`);
        else if (!app.free && app.price) monetizationModels.push(`"${cf.competitorName}": paid (${app.priceText ?? `$${app.price}`})`);
        else if (app.free) monetizationModels.push(`"${cf.competitorName}": free`);
      }
    }
    if (pricingSignals.length > 0) {
      sections.push(`REAL DATA — PRICING SIGNALS:\n${pricingSignals.map((s) => `- ${s}`).join("\n")}`);
    }

    // Proven monetization signals
    if (monetizationModels.length > 0 || pricingSignals.length > 0) {
      const monetizationLines = [
        `- Competitors in this sector successfully use: ${[...new Set(monetizationModels.map(m => m.split(": ")[1]))].join(", ") || "various models"}`,
        ...pricingSignals.map(s => `- ${s}`),
        `- The presence of paywall complaints in reviews VALIDATES these price points`,
        `- Recommendation: Match or slightly undercut proven sector pricing`,
      ];
      sections.push(`PROVEN MONETIZATION SIGNALS:\n${monetizationLines.join("\n")}`);
    }
  }

  if (sections.length === 0) return "";

  return `
═══════════════════════════════════════════════
GROUND TRUTH DATA FROM SCOUT ANALYSIS
Use these real numbers as anchors — do NOT invent metrics that contradict them.
═══════════════════════════════════════════════

${sections.join("\n\n")}

ANCHORING INSTRUCTIONS:
1. GoNoGoScorecard: Calibrate dimension scores from Scout's composite scores above. Feature Gap Opportunity is the primary signal — a high score (70+) means significant unmet demand.
2. CompetitiveMatrix: Use actual store ratings for Performance/UX scores. A 4.2/5 app ≈ 8/10, a 3.1/5 app ≈ 6/10.
3. RevenueProjections: Use install counts as TAM signal. If top competitor has 1M+ installs, TAM is substantial. Use proven monetization signals for ARPU anchoring.
4. MarketGapAnalysis: Prioritize gaps by Feature Gap Opportunity score and feature request demand levels. High feature gap score = larger opportunity.
5. Personas: Ground frustrations in actual review quotes provided above.
6. ProvenMonetization: If competitor pricing is listed above, treat those price points as market-validated. Structure pricing within the same range.
`;
}

/**
 * PRD is split into two parts (A + B) to prevent truncation.
 * Part A: Sections 1-5 (Vision, Personas, UX, Features, Anti-Competitor)
 * Part B: Sections 6-13 (Data Requirements, Non-Functional, Success Criteria, Anti-Patterns, API Surface, Timeline, Design, Risks)
 */
export function buildPrdDocPromptA(
  ctx: ArchitectContext,
  stepsSummary: string,
  pricingAnchor?: string,
  freeTierAnchor?: string
): string {
  const { compact, label, altLabel } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const productName = isMasterIdea ? ctx.masterIdea.name : "[Product Name]";
  const pricingLock = pricingAnchor ? `\nLOCKED PRICING (from Strategic Plan): ${pricingAnchor}. Reference these exact prices when discussing monetization.\n` : "";
  const freeTierLock = freeTierAnchor ? `\nFREE TIER DEFINITION (do NOT change): ${freeTierAnchor}\n` : "";

  return `You are creating Part 1 (Sections 1-5) of a production-ready product brief that an AI coding agent (Claude Code, Cursor) can use to build an app. Write this as a direct instruction to a brilliant developer who knows how to code but doesn't know what to build.

Focus entirely on WHAT the app does and WHY each feature matters. Never include technical implementation details, specific technologies, database schemas, API designs, or step-by-step instructions. The receiving AI agent will determine all technical decisions independently.

${compact}
${pricingLock}${freeTierLock}
AUDIENCE CALIBRATION: This PRD is for a SOLO INDIE DEVELOPER building an MVP. Scope all requirements to what one person can build and maintain. Do NOT include enterprise-grade requirements (SSO, dedicated account managers, compliance certifications, 99.99% SLA) unless inherently required. Focus on 'good enough for App Store launch' — not enterprise-grade. Feature count: 5-7 core features for MVP.
You MUST include at least one dedicated paragraph addressing how scope decisions were made with solo-developer capacity in mind. Explicitly mention: what was cut or deferred to keep MVP achievable by one person, resource-constraint trade-offs, and realistic success metrics for a one-person launch (not startup-scale KPIs).

COMPLETED ANALYSES (summaries):
${stepsSummary}

Generate Sections 1-5 of the brief in clean, well-structured markdown:

# ${productName}: Product Brief for AI Development Agent

## 1. Vision & Mission
- What this app is, who it serves, why it must exist
- Core market insight that makes this different
- Evidence from ${isMasterIdea ? "competitor analysis" : "market research and user reviews"} proving the need

## 2. User Personas & Their Problems
For each of 3-4 personas:
- Who they are, their context
- Frustrations with existing solutions
- What success looks like for them
- Day-in-the-life scenario showing app usage

## 3. Core User Experiences (High-Level Flow)
For every major user flow (NOT individual screens — the Execution Prompts handle screen-level detail):
- What the user is trying to accomplish
- Key decision points and branches
- How flows connect (e.g., onboarding → home → first action)
- What makes each flow feel good vs. frustrating
(Keep this at journey level — do NOT describe individual screen states, loading indicators, or UI interactions. Those details belong in the Execution Prompts.)

## 4. Feature Specifications
For each major feature:
- What it does from the user's perspective
- Why it matters (which persona need it addresses)
- Where AI enhances the experience
- Fallback behavior when AI is unavailable
- Edge cases and how the app handles them

## 5. What Must Be Different (Anti-Competitor Directive)
For each competitor flaw identified:
- The problem users face today${isMasterIdea ? "" : " (with evidence from reviews)"}
- The correct behavior our app must exhibit
- Why this difference is critical

Format as clean, professional markdown. Be exhaustive on behavioral detail — the AI agent needs enough context to build 50-70% of the app's infrastructure from this document alone.${isMasterIdea ? "" : " Include user quotes from reviews wherever they strengthen the argument."}`;
}

export function buildPrdDocPromptB(
  ctx: ArchitectContext,
  stepsSummary: string,
  pricingAnchor?: string,
  freeTierAnchor?: string
): string {
  const { compact } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const productName = isMasterIdea ? ctx.masterIdea.name : "[Product Name]";
  const pricingLock = pricingAnchor ? `\nLOCKED PRICING (from Strategic Plan): ${pricingAnchor}. Reference these exact prices when discussing monetization or data entities.\n` : "";
  const freeTierLock = freeTierAnchor ? `\nFREE TIER DEFINITION (do NOT change): ${freeTierAnchor}\n` : "";

  return `You are creating Part 2 (Sections 6-13) of a production-ready product brief for "${productName}". This continues from sections 1-5 which have already been written. Write this as a direct instruction to a brilliant developer.

Focus entirely on WHAT the app does and WHY each feature matters. Never include technical implementation details, specific technologies, database schemas, API designs, or step-by-step instructions.

${compact}
${pricingLock}${freeTierLock}
AUDIENCE CALIBRATION: This PRD is for a SOLO INDIE DEVELOPER building an MVP. Scope all requirements to what one person can build and maintain. Do NOT include enterprise-grade requirements (SSO, dedicated account managers, compliance certifications, 99.99% SLA) unless inherently required. Focus on 'good enough for App Store launch' — not enterprise-grade. Feature count: 5-7 core features for MVP.
You MUST include at least one dedicated paragraph addressing how scope decisions were made with solo-developer capacity in mind. Explicitly mention: what was cut or deferred to keep MVP achievable by one person, resource-constraint trade-offs, and realistic success metrics for a one-person launch (not startup-scale KPIs).

COMPLETED ANALYSES (summaries):
${stepsSummary}

Generate Sections 6-13 of the brief in clean, well-structured markdown. Start directly with section 6 (do NOT repeat sections 1-5):

## 6. Data & Content Requirements
- List EVERY data entity the app manages (e.g. User, Session, Result, Subscription)
- For each entity: what attributes it has, what it relates to, and its lifecycle (created when, updated when, deleted when)
- What content the app creates, stores, and displays
- User-generated vs. system-generated data
- Data that must persist offline vs. cloud-only
(Describe the information architecture thoroughly — not database DDL, but enough for a developer to design the schema)

## 7. Non-Functional Requirements
- Performance expectations (from the user's perspective)
- Accessibility requirements
- Platform/device requirements
- Offline behavior expectations

## 8. Success Criteria & Scope
- North star metric
- Leading indicators of success
- AI quality bars (minimum acceptable performance)
- v1 scope: concrete in-scope and out-of-scope lists
- Open questions for development

## 9. Anti-Patterns
- Things that must NOT be built (from competitor failures)
- Common pitfalls to avoid

## 10. API Surface Area
- What external services the app communicates with and why
- What the app's own API needs to support (user actions that require server processing)
- Real-time vs. request-response interactions
(Describe the communication needs — not endpoint paths or HTTP methods)

REQUIRED SECTIONS CHECKLIST — your output MUST include ALL of these with substantive content. Missing ANY section is a FAILURE:
- ## 6. Data & Content Requirements (minimum 3 entities described)
- ## 7. Non-Functional Requirements (minimum 4 subsections)
- ## 8. Success Criteria & Scope (must include in-scope AND out-of-scope lists)
- ## 9. Anti-Patterns (minimum 3 anti-patterns from competitor analysis)
- ## 10. API Surface Area (list every external service integration)
- ## 11. Timeline & Milestones — MANDATORY. Reproduce the development timeline from the Development Plan step. Include week-by-week phases, milestone deliverables, and MVP launch target date. If this section is missing, the PRD is incomplete and unusable.
- ## 12. Design Requirements — MANDATORY. Visual design system: color palette (specific hex values or theme tokens), typography (font families and scale), spacing system, dark mode support, icon style, animation guidelines, accessibility standards (WCAG AA minimum).
- ## 13. Risks & Mitigations — MANDATORY. Formal risk register with at minimum 4 risks covering: App Store rejection scenarios, AI API cost overruns, low user retention, and data privacy compliance (GDPR/CCPA).
PRIORITY ORDER: If running low on space, keep sections 6-10 concise to ensure sections 11-13 are present. Sections 11, 12, and 13 are the most commonly missing — write them FIRST, then fill in 6-10.

Format as clean, professional markdown. Be thorough — this completes the product brief.`;
}

export function buildTechnicalArchitecturePrompt(
  ctx: ArchitectContext,
  techStepsSummary: string,
  schemaAnchor?: string,
): string {
  const { compact, label, altLabel } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const productName = isMasterIdea ? ctx.masterIdea.name : label;

  return `${CURRENT_TECH_VERSIONS}

You are a senior solutions architect writing a Technical Architecture Document for "${productName}" — ${altLabel}.

${compact}

TECHNICAL ANALYSES (Steps 3-5):
${techStepsSummary}

Write a comprehensive, readable Technical Architecture Document. This document bridges the product brief (what to build) and the execution prompts (how to code it). Write for a technical lead reviewing the architecture. Be specific about technologies and design decisions. Do NOT include code — describe what will be built and why, not how to implement it.

Structure the document in clean markdown with these sections:

## 1. Platform & Technology Stack
For each selected technology: what it is, why it was chosen over alternatives, and how it fits the app's requirements. Group by category (auth, database, AI, etc.).

## 2. System Architecture Overview
High-level component diagram description. Services, their responsibilities, and how they communicate. Client-server boundaries. Third-party service integrations.

## 3. Data Model & Database Schema
${schemaAnchor
    ? `Use these EXACT table and field names (defined in Technology Selection — do NOT rename):\n${schemaAnchor}\n\nDescribe each entity, its purpose, relationships, indexing strategy, and RLS policies.`
    : `Core entities, their attributes, and relationships. Indexing strategy. Data lifecycle (creation, updates, archival). Migration approach.`}

## 4. AI Integration Architecture
Which AI models/APIs are used and for what. On-device vs cloud processing decisions. Request/response patterns. Fallback mechanisms when AI is unavailable. Cost optimization strategies. Prompt management approach.

## 5. API Architecture
Key endpoints and their purposes. Authentication and authorization flow. Caching strategy. Rate limiting approach. Error handling patterns.

## 6. Infrastructure & Deployment
Hosting and deployment targets. CI/CD pipeline overview. Environment strategy (dev/staging/prod). Monitoring and observability approach.

## 7. Security & Compliance
Authentication strategy details. Data privacy approach (GDPR/CCPA considerations). Input validation strategy. API security measures.

## 8. Technology Synergies & Integration Notes
How selected technologies work together. Known integration patterns or gotchas. Shared configuration requirements.

## 9. Technical Risks & Mitigations
Key technical risks identified during analysis, each with a specific mitigation strategy.

Format as clean, professional markdown. Reference specific technology names from the analysis data. Be concrete and actionable — avoid generic architecture advice.`;
}

export function buildVisualStrategyPromptA(
  ctx: ArchitectContext,
  stepsSummary: string,
  pricingAnchor?: string,
  conversionRateAnchor?: string,
  projectionAnchor?: string,
  freeTierAnchor?: string
): string {
  const { compact, label, altLabel } = getContextAndLabel(ctx);
  const isMasterIdea = ctx.type === "masterIdea";
  const appName = isMasterIdea ? ctx.masterIdea.name : "Our App";
  const competitorRef = isMasterIdea
    ? `top 3 competitors from the analysis`
    : `${label}, and 2 competitors`;

  const realData = formatRealDataContext(ctx);
  const pricingLock = pricingAnchor ? `\n\nLOCKED PRICING (from Strategic Plan — do NOT change): ${pricingAnchor}. Use these exact prices throughout.\n` : "";
  const monetizationContext = pricingAnchor ? `\nMONETIZATION CONTEXT: The pricing above is based on proven sector pricing. Do not recommend lower pricing to "undercut" competitors based on review complaints about pricing. Proven prices should be matched or positioned within the same range.\n` : "";
  const conversionLock = conversionRateAnchor ? `\nABSOLUTE RULE — LOCKED CONVERSION RATE: Freemium-to-paid conversion MUST be ${conversionRateAnchor}. Do NOT use any other conversion rate. SHOW YOUR MATH: monthly_revenue = total_users × conversion_rate × price_per_user. Write this formula with actual numbers for every monthly projection entry so the math can be verified.\n` : "";
  const projectionLock = projectionAnchor ? `\nLOCKED PROJECTIONS: ${projectionAnchor}. All projections MUST stay within these bounds.\n` : "";
  const freeTierLock = freeTierAnchor ? `\nFREE TIER DEFINITION (do NOT change): ${freeTierAnchor}\n` : "";

  return `You are a senior strategy consultant creating visual strategic analysis data for ${altLabel}. Provide CONCRETE NUMBERS for charts — no vague ranges.

${compact}

COMPLETED ANALYSES (summaries):
${stepsSummary}
${realData}${pricingLock}${monetizationContext}${conversionLock}${projectionLock}${freeTierLock}
Generate data for the following visualizations (Part 1: Business & Market). Be specific with all numbers. Keep responses concise.

Populate all schema fields:

- personas: 3 user personas. Each: name, tagline, demographics, 3 frustrations, 3 goals, willingnessToPay, avatar (single emoji).

- revenueModel:
  - strategy, 2-3 pricing tiers (name, price with indie-friendly pricing $5-$15/month, features, isPopular), projectedArpu
  - IMPORTANT: Choose ONE specific price point for the primary paid tier (e.g. "$9.99/month") and use it consistently. Do NOT mention different prices elsewhere. This exact pricing will be reused in Part B's financial projections.
  - monthlyProjections: Exactly 6 entries for months 1, 3, 5, 7, 9, 12. MUST be realistic for a solo indie developer with near-zero marketing budget: Month 1 should have 0-50 users (organic only), scaling to 500-3,000 by Month 12 through word-of-mouth and content marketing. Do NOT project hundreds of users in Month 1.
  - LOCKED MRR CAP (from Strategic Plan): Monthly revenue MUST NOT exceed $8,000 at Month 12. If users x conversion x price exceeds this, reduce the user projection. This is the realistic ceiling for a solo indie app.
  - USER GROWTH CONSTRAINT: Month-over-month user growth must decelerate over time. Month 1→3 can grow fast (small base), but Month 9→12 growth rate must be under 15% monthly. Do NOT project hockey-stick growth — organic indie growth is gradual.

- competitiveMatrix: 4 entries — "${appName}" (isOurs=true), ${competitorRef}. scores: array of {category, score} objects for categories: "AI Features", "UX/Design", "Pricing", "Performance" (scores 0-10). For the competitive matrix, include ONLY direct competitors serving the same primary use-case. Exclude apps from different categories. If fewer than 3 direct competitors exist, use 'Market Average' as a placeholder rather than including irrelevant apps.
  SELF-SCORE CONSTRAINT: "${appName}" (isOurs=true) is an UNRELEASED app — it has zero users, zero reviews, and zero market presence. Maximum self-score is 7/10 for any category. Score it based on PLANNED capabilities, not aspirational perfection. A score of 9-10 is only appropriate for established apps with proven track records.
  VARIATION REQUIREMENT: Self-scores must NOT be flat (e.g., 7/7/7/7 is rejected). At least one category must score 5 or below (the app's weakest area) and at least one must score 6-7 (its strongest planned area). A realistic unreleased app has clear strengths and weaknesses — not uniform scores.

- competitiveDetails: Same 4 entries as competitiveMatrix. Each: name, isOurs, 3-4 strengths, 3-4 weaknesses, marketPosition description, pricing info, userBase description.

- marketData: 3 market segments. Each: segment, size (millions), growth (%), ourShare (%).
  CONSTRAINTS: (1) Segment sizes must be $10M-$500M for niche app categories — do NOT claim billion-dollar segments.
  (2) ourShare MUST be < 0.5% in Year 1 for a solo indie app with <5,000 users. Never project shares > 2%.
  (3) Label all sizes as estimates — these are not verified market research numbers.

- marketGapAnalysis: 4-6 market gaps. Each: gap description, category (unserved_need/underserved_segment/blue_ocean/feature_gap), currentAlternatives, opportunitySize, difficultyToAddress (low/medium/high), ourApproach.
  opportunitySize must be grounded in competitor data — estimate relative to competitor install/rating counts. Do NOT cite global TAM figures like '$100B market'.

All numbers must be realistic and internally consistent.`;
}

export function buildVisualStrategyPromptB(
  ctx: ArchitectContext,
  stepsSummary: string,
  pricingAnchor?: string,
  timelineAnchor?: string,
  mvpFeatureCount?: number,
  projectionAnchor?: string
): string {
  const { compact, altLabel } = getContextAndLabel(ctx);

  const realData = formatRealDataContext(ctx);
  const pricingLock = pricingAnchor ? `\n\nLOCKED PRICING (from Strategic Plan): ${pricingAnchor}. Use these exact values for all financial calculations.\n` : "";
  const timelineLock = timelineAnchor ? `\nLOCKED TIMELINE: ${timelineAnchor}. Your timeline phases must sum to this exact duration.${mvpFeatureCount ? ` MVP includes exactly ${mvpFeatureCount} core features.` : ""}\n` : "";
  const projectionLock = projectionAnchor ? `\nLOCKED PROJECTIONS: ${projectionAnchor}. All projections MUST stay within these bounds.\n` : "";

  return `You are a senior strategy consultant creating visual strategic analysis data for ${altLabel}. Provide CONCRETE NUMBERS for charts — no vague ranges.

${compact}

COMPLETED ANALYSES (summaries):
${stepsSummary}
${realData}${pricingLock}${timelineLock}${projectionLock}
Generate data for the following visualizations (Part 2: Technical & Financial). Be specific with all numbers. Keep responses concise.

Populate all schema fields:

- risks: 5 risk items across market/technical/financial/operational/competitive. Each: risk, category, probability, impact, mitigation.

- timeline: 3-4 development phases. Each: phase, duration, 3 milestones, 2-3 deliverables.

- revenueProjections: Unit economics — cac (customer acquisition cost), ltv (lifetime value), ltvCacRatio (number), monthlyChurnRate, grossMargin, breakEvenMonth (number). unitEconomics: 4-6 key metrics. yearlyProjections: 3 years with users, revenue, costs, profit. IMPORTANT: Use the SAME pricing tiers from Part A's revenue model (which are based on Step 2's strategic plan). Do NOT invent different price points — the subscription price must be identical to Part A.

- dataModel: 5-8 core entities the app manages. Each: entity name, description, 3-5 keyAttributes, relationships to other entities with type (one_to_one/one_to_many/many_to_many).

- goNoGoScorecard: overallVerdict (strong_go/go/conditional_go/no_go), investmentThesis (1-2 sentences), 6-8 scoring dimensions (dimension, score 1-10, weight 0-1 summing to 1, reasoning), weightedScore (calculated — MUST equal the sum of score*weight for all dimensions), 3-4 keyRisks, 3-4 keyOpportunities, recommendation paragraph.

CRITICAL CONTEXT FOR PROJECTIONS: This app is built by a SOLO INDIE DEVELOPER with near-zero marketing budget. Financial projections MUST be conservative and realistic:
- Month 1: 0-50 organic users (not hundreds). No paid marketing at launch.
- Year 1: 500-3,000 total users is realistic for a solo dev with organic growth.
- Revenue: $5-$15/month subscription pricing. Freemium conversion rate 3-8%.
- CAC: Near-zero for organic, $10-$30 if running small paid campaigns.
- Infrastructure costs: $50-$200/month.
- Timeline: 3-4 phases over 12-20 weeks for one person.
- Do NOT project enterprise-scale growth. This is a bootstrapped indie app.
- LOCKED MRR CAP: No monthly revenue figure may exceed $8,000.
  Year 1 total revenue: $5,000-$50,000.
  Year 2: $20,000-$70,000.
  Year 3: $40,000-$120,000 MAX.
- YoY GROWTH CONSTRAINT: Apply 50-80% year-over-year revenue growth. If Year 1 is $20K, Year 2 should be $30K-$36K — NOT $80K. Do NOT assume exponential scaling.
- CONVERSION RATE: Freemium-to-paid must be 2-5%. Show math: revenue = paying_users × price, where paying_users = total_users × conversion_rate.

Revenue projection MUST equal: (total users × conversion rate × weighted average price). Show the arithmetic explicitly. If the projected revenue does not match this formula, adjust the user count — not the price.

All numbers must be realistic, internally consistent, and reflect solo builder economics.`;
}

// ============================================
// Idea Evolution - Impact Analysis Schema & Prompt Builders
// ============================================

export const impactAnalysisSchema = z.object({
  feasibility: z.enum(["straightforward", "moderate", "complex"]),
  estimatedEffort: z.string(),
  affectedScreens: z.array(z.object({
    screenName: z.string(),
    action: z.enum(["new", "modify"]),
    changes: z.string(),
  })),
  affectedTables: z.array(z.object({
    tableName: z.string(),
    action: z.enum(["new", "modify"]),
    changes: z.string(),
  })),
  newTechnologies: z.array(z.object({
    slug: z.string(),
    justification: z.string(),
  })),
  removedTechnologies: z.array(z.object({
    slug: z.string(),
    reason: z.string(),
  })),
  pricingImpact: z.enum(["none", "minor", "major"]),
  pricingNotes: z.string(),
  conflictsWithExisting: z.array(z.string()),
  implementationOrder: z.array(z.string()),
});

export function buildImpactAnalysisPrompt(
  ideaText: string,
  stepSummaries: string,
  existingScreens: string[],
  existingTables: string[],
  selectedTechSlugs: string[],
  pricingAnchor: string,
  freeTierAnchor: string,
  deferredFeatures: string[],
  previousEvolutionsSummary: string,
): string {
  const screenList = existingScreens.map(s => `- ${s}`).join("\n");
  const tableList = existingTables.map(t => `- ${t}`).join("\n");
  const techList = selectedTechSlugs.map(t => `- ${t}`).join("\n");
  const deferredBlock = deferredFeatures.length > 0
    ? `\nDEFERRED FEATURES (already planned for later phases — flag overlaps):\n${deferredFeatures.map(f => `- ${f}`).join("\n")}\n`
    : "";
  const previousBlock = previousEvolutionsSummary
    ? `\nPREVIOUS IDEA EVOLUTIONS (already added — do NOT duplicate):\n${previousEvolutionsSummary}\n`
    : "";

  return `You are a senior solutions architect analyzing the impact of a new feature idea against an existing app blueprint.

EXISTING APP ANALYSIS (summaries of all 5 analysis steps):
${stepSummaries}

EXISTING SCREENS:
${screenList}

EXISTING DATABASE TABLES:
${tableList}

SELECTED TECHNOLOGIES:
${techList}

PRICING ANCHOR: ${pricingAnchor || "Not set"}
FREE TIER: ${freeTierAnchor || "Not set"}
${deferredBlock}${previousBlock}
NEW IDEA FROM USER:
"${ideaText}"

Analyze the impact of adding this feature to the existing app:

1. FEASIBILITY: Is this straightforward, moderate, or complex given the existing architecture?
2. ESTIMATED EFFORT: How long would this take as an additive change (e.g., "2-4 hours", "1-2 days")?
3. AFFECTED SCREENS: Which existing screens need modification? Are any new screens needed? PREFER modifying existing screens over creating new ones.
4. AFFECTED TABLES: Which existing tables need modification? Are any new tables needed?
5. NEW TECHNOLOGIES: Are any new technology integrations needed? Only suggest technologies from the standard catalog. Use exact slugs.
6. REMOVED TECHNOLOGIES: Should any existing technologies be removed or replaced?
7. PRICING IMPACT: Does this change the pricing structure? (none/minor/major)
8. CONFLICTS: Does this idea conflict with any existing design decisions, deferred features, or pricing constraints?
9. IMPLEMENTATION ORDER: What's the logical order to implement this change?

CRITICAL: Only reference screen names and table names that actually exist in the lists above for "modify" actions. New screens/tables use "new" action.`;
}

export function buildIncrementalEPPrompt(
  ideaText: string,
  impactAnalysis: string,
  stepSummaries: string,
  existingScreens: string[],
  existingTables: string[],
  selectedTechSlugs: string[],
  newTechFragments: Map<string, string>,
  schemaAnchor: string,
  pricingAnchor: string,
  platform: string,
  epCrossRef: string,
  deferredFeatures: string[],
  previousEvolutionsSummary: string,
): string {
  const screenList = existingScreens.map(s => `- ${s}`).join("\n");
  const tableList = existingTables.map(t => `- ${t}`).join("\n");
  const techFragmentBlock = newTechFragments.size > 0
    ? `\nNEW TECHNOLOGY REFERENCES:\n${Array.from(newTechFragments.entries()).map(([slug, fragment]) => `### ${slug}\n${stripCodeBlocks(fragment)}`).join("\n\n")}\n`
    : "";
  const deferredBlock = deferredFeatures.length > 0
    ? `\nDEFERRED FEATURES (LOCKED — do not implement these):\n${deferredFeatures.map(f => `- ${f}`).join("\n")}\n`
    : "";
  const previousBlock = previousEvolutionsSummary
    ? `\nPREVIOUS IDEA EVOLUTIONS (already added — reference but do NOT recreate):\n${previousEvolutionsSummary}\n`
    : "";

  return `${CURRENT_TECH_VERSIONS}

LOCKED CONSTRAINTS — do NOT deviate:
- Schema anchor: ${schemaAnchor || "N/A"}
- Pricing anchor: ${pricingAnchor || "N/A"}
- Platform: ${platform}
${deferredBlock}${previousBlock}
You are generating an incremental Execution Prompt (EP+) for adding a new feature to an existing app. This EP+ will be copy-pasted directly into Claude Code AFTER the original 3 Execution Prompts have been executed.

The existing app is fully built with foundation, core features, and polish. Now the user wants to add:

"${ideaText}"

IMPACT ANALYSIS (from prior step):
${impactAnalysis}

EXISTING APP CONTEXT (step summaries):
${stepSummaries}

EXISTING SCREENS:
${screenList}

EXISTING DATABASE TABLES:
${tableList}

EP CROSS-REFERENCE (what EP1/2/3 built):
${epCrossRef}
${techFragmentBlock}
Write "EP+ — [Short Feature Title]" as a comprehensive additive prompt for Claude Code.

CRITICAL RULES:
- Do NOT include any code blocks (no \`\`\`). Write prose-only descriptions, same style as EP1/2/3.
- Do NOT recreate any existing screens, tables, stores, hooks, or components. Only describe NEW additions and MODIFICATIONS to existing ones.
- Reference existing artifacts by their exact names from the lists above.
- Describe WHAT to build and WHY, not HOW to implement it. Claude Code writes the code.

REQUIRED SECTIONS:
1. **Context Recap** — Brief summary of what the idea adds and why
2. **Idea Summary** — The feature in detail
3. **Prerequisites** — What must already exist (from EP1/2/3) before this EP+ runs
4. **Database Changes** — New tables with full column specs, or modifications to existing tables (ALTER-style additions only)
5. **Screen Changes** — New screens with layout/pattern descriptions, or modifications to existing screens (describe what to add/change, not recreate)
6. **New Edge Functions / API Routes** — Any new server-side logic needed
7. **Store & Hook Changes** — New Zustand stores or hooks, or additions to existing ones
8. **Dependency Changes** — New npm packages to install (with exact versions from CURRENT TECHNOLOGY VERSIONS)
9. **Environment Variable Changes** — New env vars needed (with descriptions and where to get them)
10. **Verification Checklist** — Steps to verify the feature works correctly after implementation`;
}

