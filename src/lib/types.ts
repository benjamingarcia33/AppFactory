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
  installs: string;
  description: string;
  icon: string;
  url: string;
  developer: string;
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
  summary: string;
}

// --- Scoring ---

export interface OpportunityScore {
  marketSize: number;      // 0-100
  dissatisfaction: number; // 0-100
  feasibility: number;     // 0-100
  composite: number;       // 0-100 weighted average
}

// --- Scout Mode ---

export type ScoutMode = "category" | "idea";

// --- Gap Analysis (Scout Idea Mode) ---

export interface CompetitorGapItem {
  competitorName: string;
  competitorId: string;
  painPointsExploited: string[];
  featureGaps: string[];
  strengthsToOvercome: string[];
  gapScore: number; // 0-100
}

export interface GapAnalysis {
  ideaSummary: string;
  competitorComparisons: CompetitorGapItem[];
  uniqueAdvantages: string[];
  marketPositioning: string;
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
  opportunityId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  steps: AnalysisStep[];
  createdAt: string;
  completedAt: string | null;
}

export type DocumentType = "app_prd" | "strategic_analysis" | "starter_payload";

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
  scores: Record<string, number>; // category → 0-10
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

export interface VisualStrategy {
  personas: VisualPersona[];
  revenueModel: RevenueModelVisual;
  competitiveMatrix: CompetitiveMatrixEntry[];
  risks: RiskItem[];
  timeline: TimelinePhase[];
  marketData: MarketDataPoint[];
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
  | ScoutBlueOceanEvent;

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
  | ArchitectCancelledEvent;

// --- Composite Types ---

export interface AnalysisWithContext {
  id: string;
  opportunityId: string;
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
