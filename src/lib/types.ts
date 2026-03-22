// ============================================
// AppFoundry - Shared Type Definitions
// Single source of truth for all interfaces
// ============================================

// --- App Store Data ---

export type AppStore = "google_play" | "app_store";

export interface ScrapedApp {
  id: string;
  title: string;
  store: AppStore;
  genre: string;
  score: number;
  ratings: number;
  reviewCount?: number;
  installs: string;
  description: string;
  icon: string;
  url: string;
  developer: string;
  isEstimatedInstalls?: boolean;
  price?: number;
  free?: boolean;
  offersIAP?: boolean;
  priceText?: string;
  histogram?: Record<string, number>;
  dataConfidence?: "high" | "medium" | "low";
}

export interface ScrapedReview {
  id: string;
  text: string;
  score: number;
  date: string;
  thumbsUp?: number;
}

// --- Sentiment Analysis ---

export interface PainPoint {
  issue: string;
  category?: "technical" | "feature_gap" | "monetization";
  frequency: "high" | "medium" | "low";
  severity: "critical" | "major" | "minor";
  sampleQuotes: string[];
}

export interface FeatureRequest {
  feature: string;
  demand: "high" | "medium" | "low";
  sampleQuotes: string[];
}

export interface SentimentAnalysis {
  overallSentiment: "positive" | "mixed" | "negative";
  painPoints: PainPoint[];
  featureRequests: FeatureRequest[];
  praisedAspects: string[];
  featureInventory?: string[];  // Key features users mention the app having
  summary: string;
}

// --- Scoring ---

export interface OpportunityScore {
  marketSize: number;      // 0-100
  dissatisfaction: number; // 0-100
  feasibility: number;     // 0-100
  featureGapScore: number; // 0-100 (feature gap opportunity signal)
  compositeScore: number;  // 0-100 weighted average (DB column: composite_score)
}

// --- Scout Mode ---

export type ScoutMode = "category" | "idea" | "synthesis" | "discovery";

// --- Gap Analysis (Scout Idea Mode) ---

export interface CompetitorGapItem {
  competitorName: string;
  competitorId: string;
  painPointsExploited: string[];
  featureGaps: string[];
  strengthsToOvercome: string[];
  gapScore: number; // 0-100
}

export interface ProvenFormatAnalysis {
  topPerformer: string;
  successFactors: string[];
  featureBaseline: string[];
  exploitableGaps: string[];
}

export interface GapAnalysis {
  ideaSummary: string;
  competitorComparisons: CompetitorGapItem[];
  uniqueAdvantages: string[];
  marketPositioning: string;
  provenFormatAnalysis?: ProvenFormatAnalysis;
}

export interface BlueOceanResult {
  isBlueOcean: boolean;
  confidence: number; // 0-100
  reasoning: string;
  adjacentMarkets: string[];
  risks: string[];
  nextSteps: string[];
  immediateArchitectHandoff: boolean;
}

// --- Master Idea (Synthesis Pipeline) ---

export interface MasterIdeaFeature {
  name: string;
  description: string;
  addressesFlaws: string[];
  evidenceAppIds: string[];
  priority: "critical" | "high" | "medium";
}

export interface CompetitorFlawSynthesis {
  competitorAppId: string;
  competitorName: string;
  flaws: string[];
  featureGaps: string[];
  strengths: string[];
  marketData: { installs: string; rating: number; ratings: number };
}

export interface DifficultyBreakdown {
  technicalComplexity: "low" | "medium" | "high";
  timeToMvp: string;
  teamSize: string;
  keyTechnicalChallenges: string[];
  requiredExpertise: string[];
}

export interface FeasibilityAssessment {
  isRealistic: boolean;
  score: number;
  reasoning: string;
  majorBlockers: string[];
  costEstimate: string;
}

export interface MarketViability {
  score: number;
  willMakeDifference: boolean;
  reasoning: string;
  revenueModel: string;
  userAcquisitionStrategy: string;
  competitiveAdvantageType: "feature" | "ux" | "price" | "niche" | "technology";
}

export interface GoNoGoFactor {
  factor: string;
  assessment: "go" | "caution" | "no_go";
  explanation: string;
}

export interface AIRecommendation {
  verdict: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  summary: string;
  warnings: string[];
  goNoGoFactors: GoNoGoFactor[];
}

export interface MasterIdea {
  name: string;
  tagline: string;
  description: string;
  originalIdea: string;
  coreFeatures: MasterIdeaFeature[];
  competitorFlaws: CompetitorFlawSynthesis[];
  uniqueValueProps: string[];
  targetAudience: string;
  marketOpportunity: string;
  estimatedDifficulty: "low" | "medium" | "high";
  confidenceScore: number;
  searchStrategy: {
    queries: string[];
    categories: string[];
    reasoning: string;
  };
  difficultyBreakdown?: DifficultyBreakdown;
  feasibilityAssessment?: FeasibilityAssessment;
  marketViability?: MarketViability;
  aiRecommendation?: AIRecommendation;
}

// --- Core Opportunity (Scout → Architect contract) ---

export interface Opportunity {
  id: string;
  scrapedApp: ScrapedApp;
  reviews: ScrapedReview[];
  sentiment: SentimentAnalysis;
  score: OpportunityScore;
  scanId: string;
  createdAt: string;
  gapAnalysis: GapAnalysis | null;
  blueOcean: BlueOceanResult | null;
}

// --- Scan ---

export interface Scan {
  id: string;
  store: AppStore;
  category: string;
  status: "running" | "completed" | "failed" | "cancelled";
  totalAppsScraped: number;
  totalOpportunities: number;
  createdAt: string;
  completedAt: string | null;
  mode: ScoutMode;
  ideaText: string | null;
  masterIdea: MasterIdea | null;
  blueOcean: BlueOceanResult | null;
  focusText: string | null;
  discoveryAngle: string | null;
}

// --- Architect Analysis ---

export interface AnalysisStep {
  step: number;
  title: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  content: string;
}

export interface Analysis {
  id: string;
  opportunityId: string | null;
  scanId: string | null;
  status: "running" | "completed" | "completed_with_warnings" | "failed" | "cancelled";
  steps: AnalysisStep[];
  createdAt: string;
  completedAt: string | null;
}

export type DocumentType = "app_prd" | "strategic_analysis" | "technical_architecture" | "execution_prompt_1" | "execution_prompt_2" | "execution_prompt_3" | "claude_md" | "mcp_json" | "env_example" | "claude_commands" | "claude_agents" | "build_strategy" | "claude_settings" | "claude_skills" | "setup_walkthrough";

export interface AnalysisDocument {
  id: string;
  analysisId: string;
  type: DocumentType;
  title: string;
  content: string;
  createdAt: string;
}

// --- Visual Strategy Types (Architect) ---

export interface VisualPersona {
  name: string;
  tagline: string;
  demographics: string;
  frustrations: string[];
  goals: string[];
  willingnessToPay: string;
  avatar: string; // emoji
}

export interface RevenueModelVisual {
  strategy: string;
  tiers: {
    name: string;
    price: string;
    features: string[];
    isPopular: boolean;
  }[];
  projectedArpu: string;
  monthlyProjections: {
    month: number;
    users: number;
    revenue: number;
  }[];
}

export interface CompetitiveMatrixEntry {
  name: string;
  isOurs: boolean;
  scores: { category: string; score: number }[];
}

export interface RiskItem {
  risk: string;
  category: "market" | "technical" | "financial" | "operational" | "competitive";
  probability: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  mitigation: string;
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  milestones: string[];
  keyDeliverables: string[];
}

export interface MarketDataPoint {
  segment: string;
  size: number;
  growth: number;
  ourShare: number;
}

// --- New Visual Strategy Types (Enhanced) ---

export interface MarketGapItem {
  gap: string;
  category: "unserved_need" | "underserved_segment" | "blue_ocean" | "feature_gap";
  currentAlternatives: string;
  opportunitySize: string;
  difficultyToAddress: "low" | "medium" | "high";
  ourApproach: string;
}

export interface CompetitiveDetail {
  name: string;
  isOurs: boolean;
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  pricing: string;
  userBase: string;
}

export interface RevenueProjections {
  cac: string;
  ltv: string;
  ltvCacRatio: number;
  monthlyChurnRate: string;
  grossMargin: string;
  breakEvenMonth: number;
  unitEconomics: {
    metric: string;
    value: string;
    notes: string;
  }[];
  yearlyProjections: {
    year: number;
    users: number;
    revenue: number;
    costs: number;
    profit: number;
  }[];
}

export interface DataModelEntity {
  entity: string;
  description: string;
  keyAttributes: string[];
  relationships: {
    relatedEntity: string;
    type: "one_to_one" | "one_to_many" | "many_to_many";
    description: string;
  }[];
}

export interface GoNoGoScorecard {
  overallVerdict: "strong_go" | "go" | "conditional_go" | "no_go";
  investmentThesis: string;
  scores: {
    dimension: string;
    score: number;
    weight: number;
    reasoning: string;
  }[];
  weightedScore: number;
  keyRisks: string[];
  keyOpportunities: string[];
  recommendation: string;
}

export interface VisualStrategy {
  personas: VisualPersona[];
  revenueModel: RevenueModelVisual;
  competitiveMatrix: CompetitiveMatrixEntry[];
  risks: RiskItem[];
  timeline: TimelinePhase[];
  marketData: MarketDataPoint[];
  // Enhanced sections (optional for backward compat)
  marketGapAnalysis?: MarketGapItem[];
  competitiveDetails?: CompetitiveDetail[];
  revenueProjections?: RevenueProjections;
  dataModel?: DataModelEntity[];
  goNoGoScorecard?: GoNoGoScorecard;
}

// --- SSE Events ---

export interface ScoutProgressEvent {
  type: "progress";
  stage: string;
  message: string;
  progress: number; // 0-100
}

export interface ScoutAppFoundEvent {
  type: "app_found";
  app: ScrapedApp;
}

export interface ScoutOpportunityEvent {
  type: "opportunity";
  opportunity: Opportunity;
}

export interface ScoutCompleteEvent {
  type: "complete";
  scanId: string;
  totalOpportunities: number;
}

export interface ScoutErrorEvent {
  type: "error";
  message: string;
}

export interface ScoutScanStartedEvent {
  type: "scan_started";
  scanId: string;
}

export interface ScoutCancelledEvent {
  type: "cancelled";
  scanId: string;
}

export interface ScoutIdeaQueriesGeneratedEvent {
  type: "idea_queries_generated";
  queries: string[];
}

export interface ScoutIdeaSearchingEvent {
  type: "idea_searching";
  query: string;
  queryIndex: number;
  totalQueries: number;
}

export interface ScoutGapAnalysisEvent {
  type: "gap_analysis";
  gapAnalysis: GapAnalysis;
}

export interface ScoutBlueOceanEvent {
  type: "blue_ocean";
  blueOcean: BlueOceanResult;
}

export interface ScoutSearchStrategyEvent {
  type: "search_strategy";
  strategy: {
    queries: string[];
    categories: string[];
    reasoning: string;
    filters: ScoutFilterSettings;
  };
}

export interface ScoutMasterIdeaEvent {
  type: "master_idea";
  masterIdea: MasterIdea;
}

export interface ScoutMasterIdeaErrorEvent {
  type: "master_idea_error";
  message: string;
}

export interface ScoutDiscoveryAngleEvent {
  type: "discovery_angle";
  angle: string;
  reasoning: string;
}

export type ScoutSSEEvent =
  | ScoutProgressEvent
  | ScoutAppFoundEvent
  | ScoutOpportunityEvent
  | ScoutCompleteEvent
  | ScoutErrorEvent
  | ScoutScanStartedEvent
  | ScoutCancelledEvent
  | ScoutIdeaQueriesGeneratedEvent
  | ScoutIdeaSearchingEvent
  | ScoutGapAnalysisEvent
  | ScoutBlueOceanEvent
  | ScoutSearchStrategyEvent
  | ScoutMasterIdeaEvent
  | ScoutMasterIdeaErrorEvent
  | ScoutDiscoveryAngleEvent;

export interface ArchitectProgressEvent {
  type: "progress";
  step: number;
  title: string;
  status: "running" | "completed";
  content?: string;
}

export interface ArchitectDocumentEvent {
  type: "document";
  document: AnalysisDocument;
}

export interface ArchitectCompleteEvent {
  type: "complete";
  analysisId: string;
  warnings?: string[];
}

export interface ArchitectStepFailedEvent {
  type: "step_failed";
  step: number;
  title: string;
  message: string;
}

export interface ArchitectErrorEvent {
  type: "error";
  message: string;
}

export interface ArchitectAnalysisStartedEvent {
  type: "analysis_started";
  analysisId: string;
}

export interface ArchitectCancelledEvent {
  type: "cancelled";
  analysisId: string;
}

export type ArchitectSSEEvent =
  | ArchitectProgressEvent
  | ArchitectDocumentEvent
  | ArchitectCompleteEvent
  | ArchitectErrorEvent
  | ArchitectAnalysisStartedEvent
  | ArchitectCancelledEvent
  | ArchitectStepFailedEvent;

// --- Composite Types ---

export interface AnalysisWithContext {
  id: string;
  opportunityId: string | null;
  scanId: string | null;
  status: Analysis["status"];
  steps: AnalysisStep[];
  createdAt: string;
  completedAt: string | null;
  opportunityTitle: string;
  opportunityIcon: string;
  documents: AnalysisDocument[];
}

// --- Scout Filter Settings ---

export interface ScoutFilterSettings {
  minInstalls: number;
  maxRating: number;
  minRatings: number;
}

// --- Architectural Knowledge Base Types ---

export type TechCategory =
  | "auth" | "database" | "file-storage" | "payments"
  | "ai-text" | "ai-vision" | "ai-audio" | "realtime"
  | "notifications" | "maps-location" | "analytics" | "deployment"
  | "search" | "caching" | "ui-components" | "background-jobs"
  | "cms" | "video" | "email-marketing";

export const TECH_CATEGORIES: { value: TechCategory; label: string }[] = [
  { value: "auth", label: "Authentication" },
  { value: "database", label: "Database" },
  { value: "file-storage", label: "File Storage" },
  { value: "payments", label: "Payments" },
  { value: "ai-text", label: "AI Text" },
  { value: "ai-vision", label: "AI Vision" },
  { value: "ai-audio", label: "AI Audio" },
  { value: "realtime", label: "Realtime" },
  { value: "notifications", label: "Notifications" },
  { value: "maps-location", label: "Maps & Location" },
  { value: "analytics", label: "Analytics" },
  { value: "deployment", label: "Deployment" },
  { value: "search", label: "Search" },
  { value: "caching", label: "Caching" },
  { value: "ui-components", label: "UI Components" },
  { value: "background-jobs", label: "Background Jobs" },
  { value: "cms", label: "CMS" },
  { value: "video", label: "Video" },
  { value: "email-marketing", label: "Email Marketing" },
];

export interface Technology {
  id: string;
  name: string;
  slug: string;
  category: TechCategory;
  description: string;
  bestFor: string;
  limitations: string;
  pricing: string;
  complexity: "low" | "medium" | "high";
  platforms: "web" | "mobile" | "both";
  mobileFramework: string | null;
  npmPackages: string[];
  setupComplexity: "drop-in" | "config-required" | "significant-setup";
  promptFragment: string;
  promptFragmentMobile: string | null;
  requires: string[];
  pairsWith: string[];
  conflictsWith: string[];
  docsUrl: string | null;
  verified: boolean;
  createdAt: string;
}

export interface ScreenPattern {
  id: string;
  name: string;
  slug: string;
  category: "auth" | "core" | "content" | "social" | "utility";
  description: string;
  layoutPattern: string;
  layoutDescription: string;
  interactions: string[];
  states: Record<string, string>;
  requiredTechCategories: TechCategory[];
  optionalTechCategories: TechCategory[];
  stateApproach: string;
  dataFlowDescription: string;
  navigatesTo: string[];
  navigatesFrom: string[];
  promptFragment: string;
  platforms: string;
  verified: boolean;
  createdAt: string;
}

export interface TechSynergy {
  id: string;
  techSlugA: string;
  techSlugB: string;
  relationship: "recommended" | "compatible" | "redundant" | "incompatible";
  reason: string;
  promptNote: string | null;
}

export interface ExecutionPrompt {
  id: string;
  analysisId: string;
  promptNumber: 1 | 2 | 3;
  title: string;
  content: string;
  techSlugs: string[];
  createdAt: string;
}

// --- Idea Evolution Types ---

export interface IdeaEvolutionInput {
  analysisId: string;
  ideaText: string;
}

export interface ImpactAnalysis {
  feasibility: "straightforward" | "moderate" | "complex";
  estimatedEffort: string;
  affectedScreens: Array<{ screenName: string; action: "new" | "modify"; changes: string }>;
  affectedTables: Array<{ tableName: string; action: "new" | "modify"; changes: string }>;
  newTechnologies: Array<{ slug: string; justification: string }>;
  removedTechnologies: Array<{ slug: string; reason: string }>;
  pricingImpact: "none" | "minor" | "major";
  pricingNotes: string;
  conflictsWithExisting: string[];
  implementationOrder: string[];
}

export interface IdeaEvolution {
  id: string;
  analysisId: string;
  ideaText: string;
  status: "pending" | "analyzing" | "generating" | "completed" | "failed" | "cancelled";
  impactAnalysis: ImpactAnalysis | null;
  epContent: string | null;
  documentUpdates: string[] | null;
  newDependencies: string[] | null;
  newEnvVars: string[] | null;
  setupSteps: string[] | null;
  newScreens: Array<{ screenName: string; description: string }> | null;
  modifiedScreens: Array<{ screenName: string; changes: string }> | null;
  newTables: Array<{ tableName: string; description: string }> | null;
  modifiedTables: Array<{ tableName: string; changes: string }> | null;
  createdAt: string;
  completedAt: string | null;
}

export type IdeaEvolutionSSEEvent =
  | { type: "idea_started"; evolutionId: string }
  | { type: "impact_analysis_complete"; evolutionId: string; impactAnalysis: ImpactAnalysis }
  | { type: "ep_generation_started"; evolutionId: string }
  | { type: "ep_generated"; evolutionId: string; epContent: string }
  | { type: "idea_complete"; evolutionId: string; evolution: IdeaEvolution }
  | { type: "idea_error"; evolutionId: string; message: string }
  | { type: "idea_cancelled"; evolutionId: string };

export const DEFAULT_SCOUT_FILTERS: ScoutFilterSettings = {
  minInstalls: 10_000,
  maxRating: 4.5,
  minRatings: 100,
};

// --- Category Definitions ---

export const GOOGLE_PLAY_CATEGORIES = [
  { value: "TOOLS", label: "Tools" },
  { value: "PRODUCTIVITY", label: "Productivity" },
  { value: "HEALTH_AND_FITNESS", label: "Health & Fitness" },
  { value: "FINANCE", label: "Finance" },
  { value: "EDUCATION", label: "Education" },
  { value: "BUSINESS", label: "Business" },
  { value: "LIFESTYLE", label: "Lifestyle" },
  { value: "TRAVEL_AND_LOCAL", label: "Travel & Local" },
  { value: "FOOD_AND_DRINK", label: "Food & Drink" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "SOCIAL", label: "Social" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "WEATHER", label: "Weather" },
  { value: "MUSIC_AND_AUDIO", label: "Music & Audio" },
] as const;

// App Store categories mapped to the numeric IDs expected by app-store-scraper
export const APP_STORE_CATEGORIES = [
  { value: "6002", label: "Utilities" },
  { value: "6007", label: "Productivity" },
  { value: "6013", label: "Health & Fitness" },
  { value: "6015", label: "Finance" },
  { value: "6017", label: "Education" },
  { value: "6000", label: "Business" },
  { value: "6012", label: "Lifestyle" },
  { value: "6003", label: "Travel" },
  { value: "6023", label: "Food & Drink" },
  { value: "6024", label: "Shopping" },
  { value: "6005", label: "Social Networking" },
  { value: "6008", label: "Photo & Video" },
  { value: "6001", label: "Weather" },
  { value: "6011", label: "Music" },
] as const;
