import { z } from "zod";
import type { Opportunity } from "@/lib/types";

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
    projectedArpu: z.string(),
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
  })),
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
- Composite Score: ${score.composite}/100

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

SCORES: Market ${score.marketSize} | Dissatisfaction ${score.dissatisfaction} | AI Feasibility ${score.feasibility} | Composite ${score.composite}

SENTIMENT: ${sentiment.overallSentiment} — ${sentiment.summary}

PAIN POINTS:
${topPainPoints || "None identified"}

FEATURE REQUESTS:
${topFeatureRequests || "None identified"}
`.trim();
}

export function buildAiExpectationsPrompt(opportunity: Opportunity): string {
  const context = formatOpportunityContext(opportunity);

  return `You are an expert product strategist specializing in AI-powered applications. Analyze the following app opportunity and answer the question: "What do users expect from an AI-powered alternative to ${opportunity.scrapedApp.title}?"

${context}

Based on the pain points, feature requests, and user reviews above, provide a comprehensive analysis of what users would expect from an AI-powered alternative.

Populate all schema fields:
- coreExpectations: Fundamental capabilities the AI alternative must deliver, each with an importance rating (critical, high, or medium). Include table-stakes features users expect.
- aiEnhancements: For each major pain point, describe how AI could solve it better than ${opportunity.scrapedApp.title}. Include the expected impact.
- featurePriorities: Rank requested features by impact, feasibility, and AI integration potential.
- uxVision: Describe what the AI-powered alternative should feel like to use and how it should differ from ${opportunity.scrapedApp.title}.
- unmetNeeds: Latent needs from the reviews that users haven't explicitly asked for but AI could address.
- antiPatterns: What must be preserved from the original app based on praised aspects. What must NOT be broken.

Reference actual user quotes where relevant.`;
}

export function buildStrategicPlanningPrompt(
  opportunity: Opportunity,
  aiExpectationsSummary: string
): string {
  const context = formatCompactOpportunityContext(opportunity);

  return `You are a senior business strategist specializing in AI SaaS products. Based on the app opportunity and AI expectations analysis below, create a comprehensive business strategy.

${context}

PREVIOUS ANALYSIS - AI EXPECTATIONS (summary):
${aiExpectationsSummary}

Populate all schema fields:
- personas: 3-4 detailed personas. For each, provide a name, demographic profile describing their relationship with ${opportunity.scrapedApp.title}, their key frustrations, goals, and willingness to pay with price sensitivity.
- positioning: How to position against ${opportunity.scrapedApp.title} and competitors. Include a one-sentence value proposition, AI-specific differentiators, and a positioning statement.
- revenueModel: Recommended pricing strategy (freemium/subscription/one-time/usage-based), tier structure with specific price points and features per tier, and projected ARPU with path to profitability.
- goToMarket: Launch channels and initial distribution strategy, a concrete first 90 days plan, and key metrics to track.
- competitiveMoat: Sustainable advantages from AI including data flywheel opportunities, network effects potential, and switching cost creation.

Be concrete with numbers and timelines where possible.`;
}

export function buildAiApproachPrompt(
  opportunity: Opportunity,
  aiExpectationsSummary: string,
  strategicPlanSummary: string
): string {
  const context = formatCompactOpportunityContext(opportunity);

  return `You are a senior AI/ML architect and technical strategist. Based on the app opportunity and previous analyses below, define the technical AI approach for building an AI-powered alternative to ${opportunity.scrapedApp.title}.

${context}

PREVIOUS ANALYSIS - AI EXPECTATIONS (summary):
${aiExpectationsSummary}

PREVIOUS ANALYSIS - STRATEGIC PLAN (summary):
${strategicPlanSummary}

Populate all schema fields:
- modelsAndApis: For each AI use case, specify which foundation model to use (GPT-4, Claude, Gemini, open-source), the specific API service, and the rationale for that choice.
- dataStrategy: What data is needed to power AI features, the collection and pipeline approach, and compliance notes for GDPR/CCPA.
- architecture: Processing model (on-device vs cloud with justification), API architecture (direct calls vs orchestration layer), caching and optimization strategies, and fallback mechanisms when AI fails.
- costAnalysis: Estimated API costs per user per month and cost optimization strategies for scaling.
- risks: Technical risks including AI hallucination/accuracy, latency, vendor lock-in, and scalability bottlenecks, each with a concrete mitigation strategy.

Provide specific, implementable recommendations rather than generic advice.`;
}

export function buildDevTinkeringPrompt(
  opportunity: Opportunity,
  previousStepsSummary: string
): string {
  const context = formatCompactOpportunityContext(opportunity);

  return `You are a senior full-stack developer and technical lead specializing in AI-powered applications. Based on the app opportunity and all previous analyses, create a concrete development plan for building an AI-powered alternative to ${opportunity.scrapedApp.title}.

${context}

PREVIOUS ANALYSES (summaries):
${previousStepsSummary}

Populate all schema fields:
- mvpScope: 5-7 core features for v1.0, features explicitly deferred to v2.0, a clear definition of done for the MVP, and expected timeline.
- techStack: Specific recommendations for frontend (framework, UI library, state management), backend (runtime, framework, API style), database (primary DB, caching, search), aiIntegration (SDK, orchestration, prompt management), and infrastructure (hosting, CI/CD, monitoring). Justify each choice.
- twelveWeekPlan: Break the 12 weeks into sprints, each with a weeks range, focus area, and concrete deliverables. Cover foundation/setup, core features, AI integration, polish, testing, and launch prep.
- testingStrategy: Cover unit testing with coverage targets, integration testing for AI components, AI output quality testing, performance/load testing, and A/B testing for AI features.
- launchChecklist: Pre-launch technical requirements, app store submission prep, monitoring/alerting setup, customer support readiness, rollback plan, and day-1 metrics.

Be specific with technology versions and concrete implementation details.`;
}

export const visualStrategySchema = z.object({
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
    scores: z.record(z.string(), z.number()),
  })).describe("Max 4 entries: our app + 3 competitors"),
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
  marketData: z.array(z.object({
    segment: z.string(),
    size: z.number(),
    growth: z.number(),
    ourShare: z.number(),
  })).describe("3-4 market segments"),
});

export function buildPrdDocPrompt(
  opportunity: Opportunity,
  stepsSummary: string
): string {
  const context = formatCompactOpportunityContext(opportunity);

  return `You are a senior product manager creating a Product Requirements Document (PRD) for an AI-powered alternative to ${opportunity.scrapedApp.title}. Focus on WHAT and WHY — not HOW. No implementation details, just behavioral descriptions.

${context}

COMPLETED ANALYSES (summaries):
${stepsSummary}

Generate a complete PRD in clean, well-structured markdown with the following sections:

# Product Requirements Document: [Product Name]
## AI-Powered Alternative to ${opportunity.scrapedApp.title}

### 1. Product Vision & Problem Statement
- Why this app must exist
- Evidence from reviews proving the need
- The core insight that makes this different

### 2. Fixes for Existing Market Failures (Anti-Competitor Directive)
For each competitor pain point identified in the analysis:
- The pain point from reviews (with user quotes)
- The correct behavior our app should exhibit instead
- Why this matters to users

### 3. UX Architecture
Screen-by-screen breakdown of the entire app. For each screen provide:
- Purpose and what users see
- States: empty, loading, populated, error
- Key interactions and what happens when users tap/click
- Navigation to/from other screens
No code, no component names — just behavioral descriptions.

### 4. Feature Logic & Edge Cases
For each major feature:
- Behavioral description (what it does from the user's perspective)
- AI integration points (where AI enhances the experience)
- Fallback behavior when AI is unavailable or fails
- Edge cases and how the app handles them

### 5. User Personas & Journeys
- Day-in-the-life scenarios showing how each persona uses the app
- The emotional journey from frustration with current solutions to satisfaction with ours

### 6. Success Metrics
- North star metric (the ONE number that matters most)
- Leading indicators (early signals of success)
- AI quality bars (minimum acceptable AI performance)

### 7. Scope Boundaries
- In scope for v1 (concrete list)
- Out of scope for v1 (explicit exclusions)
- Open questions that need answers before building

Format this as clean, professional markdown. Be specific and actionable. Include user quotes from reviews wherever they strengthen the argument.`;
}

export function buildVisualStrategyPrompt(
  opportunity: Opportunity,
  stepsSummary: string
): string {
  const context = formatCompactOpportunityContext(opportunity);

  return `You are a senior strategy consultant creating visual strategic analysis data for an AI-powered alternative to ${opportunity.scrapedApp.title}. Provide CONCRETE NUMBERS for charts — no vague ranges.

${context}

COMPLETED ANALYSES (summaries):
${stepsSummary}

Generate data for the following visualizations. Be specific with all numbers. Keep responses concise.

Populate all schema fields:

- personas: 3 user personas. Each: name, tagline, demographics, 3 frustrations, 3 goals, willingnessToPay, avatar (single emoji).

- revenueModel:
  - strategy, 2-3 pricing tiers (name, price, features, isPopular), projectedArpu
  - monthlyProjections: Exactly 6 entries for months 1, 3, 5, 7, 9, 12. Realistic growth.

- competitiveMatrix: 4 entries — "Our App" (isOurs=true), ${opportunity.scrapedApp.title}, and 2 competitors. scores: record of category→score (0-10), categories: "AI Features", "UX/Design", "Pricing", "Performance".

- risks: 5 risk items across market/technical/financial/operational/competitive. Each: risk, category, probability, impact, mitigation.

- timeline: 3-4 development phases. Each: phase, duration, 3 milestones, 2-3 deliverables.

- marketData: 3 market segments. Each: segment, size (millions), growth (%), ourShare (%).

All numbers must be realistic and internally consistent.`;
}

export function buildStarterPayloadPrompt(
  opportunity: Opportunity,
  prdContent: string
): string {
  return `You are creating a concise starter payload for Claude Code to begin building an AI-powered alternative to ${opportunity.scrapedApp.title}. This should be under 500 words — a copy-paste block that gives Claude Code everything it needs to start.

PRD CONTENT:
${prdContent}

Generate a plain text block (NO markdown fences, NO JSON) with these sections:

ROLE: You are building [app name], an AI-powered alternative to ${opportunity.scrapedApp.title}. [One sentence about what makes it special.]

TECH STACK:
- Frontend: [specific framework + UI library]
- Backend: [specific runtime + framework]
- Database: [specific DB]
- AI: [specific AI SDK + model recommendations]
- Hosting: [specific platform]

PRD SUMMARY:
[3-5 bullet points capturing the most critical requirements from the PRD]

KEY CONSTRAINTS:
- [3-4 hard constraints: performance budgets, must-have features, compatibility requirements]

FIRST 5 STEPS:
1. [Concrete first step with specific files/commands]
2. [Second step]
3. [Third step]
4. [Fourth step]
5. [Fifth step]

ANTI-PATTERNS — DO NOT:
- [3-4 specific things to avoid based on competitor failures]

Keep it tight and actionable. No fluff, no explanations — just instructions.`;
}

export function buildStrategyDocPrompt(
  opportunity: Opportunity,
  stepsSummary: string
): string {
  const context = formatCompactOpportunityContext(opportunity);

  return `You are a senior strategy consultant creating a comprehensive Strategic Analysis document for an AI-powered alternative to ${opportunity.scrapedApp.title}. This document should serve as the definitive business strategy reference.

${context}

COMPLETED ANALYSES (summaries):
${stepsSummary}

Generate a comprehensive Strategic Analysis document in clean, well-structured markdown:

# Strategic Analysis: AI-Powered Alternative to ${opportunity.scrapedApp.title}

### 1. Executive Summary
- One-page overview of the opportunity
- Key findings and recommendation
- Expected market impact
- Investment thesis

### 2. Market Analysis
- Market size and growth trends
- Current market landscape
- Key players and their market share
- Market gaps and whitespace
- Regulatory environment

### 3. Competitive Positioning
- Detailed competitor analysis (${opportunity.scrapedApp.title} and alternatives)
- Competitive matrix (features, pricing, ratings)
- Our differentiation strategy
- Competitive advantages and disadvantages
- Positioning map

### 4. AI Expectations Analysis
- What users expect from AI-powered solutions
- AI capability gap in current market
- Opportunities for AI differentiation
- Risk of AI commoditization

### 5. Business Model
- Revenue model recommendation (with financial projections)
- Pricing strategy and tiers
- Unit economics (CAC, LTV, margins)
- Break-even analysis
- Funding requirements (if applicable)

### 6. Go-to-Market Plan
- Launch strategy and timeline
- Channel strategy (organic, paid, partnerships)
- Content and community strategy
- Key marketing messages by persona
- First 90 days tactical plan

### 7. Development Roadmap
- Phase 1: MVP (features, timeline, resources)
- Phase 2: Growth (features, timeline, resources)
- Phase 3: Scale (features, timeline, resources)
- Technology decisions and rationale
- Build vs buy analysis

### 8. Risk Assessment
For each risk, provide:
- Risk description
- Probability (High/Medium/Low)
- Impact (High/Medium/Low)
- Mitigation strategy
- Early warning indicators

Categories: Market risks, Technical risks, Financial risks, Operational risks, Competitive risks

### 9. Recommendation & Next Steps
- Go/No-Go recommendation with justification
- Immediate action items (next 2 weeks)
- Resource requirements
- Key decisions needed

Format as clean, professional markdown. Use data and specific numbers throughout. Be honest about risks while presenting a clear strategic path forward.`;
}
