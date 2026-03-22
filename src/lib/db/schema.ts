import { pgTable, text, integer, real, boolean, index, unique } from "drizzle-orm/pg-core";

// ============================================
// Existing Tables (migrated from SQLite to PostgreSQL)
// ============================================

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  store: text("store").notNull(), // "google_play" | "app_store"
  category: text("category").notNull(),
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed"
  totalAppsScraped: integer("total_apps_scraped").notNull().default(0),
  totalOpportunities: integer("total_opportunities").notNull().default(0),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
  mode: text("mode").notNull().default("category"), // "category" | "idea" | "synthesis"
  ideaText: text("idea_text"),
  focusText: text("focus_text"),
  discoveryAngle: text("discovery_angle"),
  masterIdeaJson: text("master_idea_json"),
  blueOceanJson: text("blue_ocean_json"),
  gapAnalysisJson: text("gap_analysis_json"),
  traceJson: text("trace_json"),
});

export const opportunities = pgTable("opportunities", {
  id: text("id").primaryKey(),
  scanId: text("scan_id").notNull().references(() => scans.id),
  // ScrapedApp fields (flattened)
  appId: text("app_id").notNull(),
  title: text("title").notNull(),
  store: text("store").notNull(),
  genre: text("genre").notNull(),
  score: real("score").notNull(),
  ratings: integer("ratings").notNull(),
  installs: text("installs").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  url: text("url").notNull(),
  developer: text("developer").notNull(),
  reviewCount: integer("review_count"),
  // Pricing & histogram
  price: real("price"),
  free: boolean("free"),
  offersIAP: boolean("offers_iap"),
  priceText: text("price_text"),
  histogramJson: text("histogram_json"),
  // JSON fields
  sentimentJson: text("sentiment_json").notNull(),
  reviewsJson: text("reviews_json").notNull(),
  // Scores
  marketSize: real("market_size").notNull(),
  dissatisfaction: real("dissatisfaction").notNull(),
  feasibility: real("feasibility").notNull(),
  compositeScore: real("composite_score").notNull(),
  dataConfidence: text("data_confidence"),
  featureGapScore: real("feature_gap_score"),
  createdAt: text("created_at").notNull(),
  // Gap analysis & Blue ocean (idea mode)
  gapAnalysisJson: text("gap_analysis_json"),
  blueOceanJson: text("blue_ocean_json"),
}, (table) => [
  index("idx_opportunities_scan_id").on(table.scanId),
]);

export const analyses = pgTable("analyses", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").references(() => opportunities.id),
  scanId: text("scan_id").references(() => scans.id),
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed"
  stepsJson: text("steps_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [
  index("idx_analyses_opportunity_id").on(table.opportunityId),
  index("idx_analyses_scan_id").on(table.scanId),
]);

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  type: text("type").notNull(), // "app_prd" | "strategic_analysis" | "execution_prompt_1" | "execution_prompt_2" | "execution_prompt_3"
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_documents_analysis_id").on(table.analysisId),
]);

// ============================================
// Architectural Knowledge Base Tables
// ============================================

export const technologies = pgTable("technologies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // TechCategory
  description: text("description").notNull(),
  bestFor: text("best_for").notNull(),
  limitations: text("limitations").notNull(),
  pricing: text("pricing").notNull(),
  complexity: text("complexity").notNull(), // "low" | "medium" | "high"
  platforms: text("platforms").notNull(), // "web" | "mobile" | "both"
  mobileFramework: text("mobile_framework"), // "expo" | "react-native" | "any" | null
  npmPackagesJson: text("npm_packages_json").notNull().default("[]"),
  npmPackagesMobileJson: text("npm_packages_mobile_json").default("[]"),
  setupComplexity: text("setup_complexity").notNull(), // "drop-in" | "config-required" | "significant-setup"
  promptFragment: text("prompt_fragment").notNull(),
  promptFragmentMobile: text("prompt_fragment_mobile"),
  requiresJson: text("requires_json").notNull().default("[]"),
  pairsWellJson: text("pairs_well_json").notNull().default("[]"),
  conflictsJson: text("conflicts_json").notNull().default("[]"),
  docsUrl: text("docs_url"),
  verified: boolean("verified").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const screenPatterns = pgTable("screen_patterns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // "auth" | "core" | "content" | "social" | "utility"
  description: text("description").notNull(),
  layoutPattern: text("layout_pattern").notNull(),
  layoutDescription: text("layout_description").notNull(),
  interactionsJson: text("interactions_json").notNull().default("[]"),
  statesJson: text("states_json").notNull().default("{}"),
  requiredTechCategoriesJson: text("required_tech_categories_json").notNull().default("[]"),
  optionalTechCategoriesJson: text("optional_tech_categories_json").notNull().default("[]"),
  stateApproach: text("state_approach").notNull(), // "local" | "global-context" | "server-state" | "hybrid"
  dataFlowDescription: text("data_flow_description").notNull(),
  navigatesToJson: text("navigates_to_json").notNull().default("[]"),
  navigatesFromJson: text("navigates_from_json").notNull().default("[]"),
  promptFragment: text("prompt_fragment").notNull(),
  platforms: text("platforms").notNull().default("both"),
  verified: boolean("verified").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const techSynergies = pgTable("tech_synergies", {
  id: text("id").primaryKey(),
  techSlugA: text("tech_slug_a").notNull().references(() => technologies.slug),
  techSlugB: text("tech_slug_b").notNull().references(() => technologies.slug),
  relationship: text("relationship").notNull(), // "recommended" | "compatible" | "redundant" | "incompatible"
  reason: text("reason").notNull(),
  promptNote: text("prompt_note"),
});

export const ideaEvolutions = pgTable("idea_evolutions", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  ideaText: text("idea_text").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "analyzing" | "generating" | "completed" | "failed" | "cancelled"
  impactAnalysis: text("impact_analysis"), // serialized JSON
  epContent: text("ep_content"), // EP+ markdown
  documentUpdates: text("document_updates"), // JSON array
  newDependencies: text("new_dependencies"), // JSON string array
  newEnvVars: text("new_env_vars"), // JSON string array
  setupSteps: text("setup_steps"), // JSON string array
  newScreens: text("new_screens"), // JSON array of objects
  modifiedScreens: text("modified_screens"), // JSON array of objects
  newTables: text("new_tables"), // JSON array of objects
  modifiedTables: text("modified_tables"), // JSON array of objects
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [
  index("idx_idea_evolutions_analysis_id").on(table.analysisId),
]);

export const executionPrompts = pgTable("execution_prompts", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  promptNumber: integer("prompt_number").notNull(), // 1, 2, or 3
  title: text("title").notNull(),
  content: text("content").notNull(),
  techSlugsJson: text("tech_slugs_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_execution_prompts_analysis_id").on(table.analysisId),
  unique("uq_execution_prompts_analysis_prompt").on(table.analysisId, table.promptNumber),
]);
