import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const scans = sqliteTable("scans", {
  id: text("id").primaryKey(),
  store: text("store").notNull(), // "google_play" | "app_store"
  category: text("category").notNull(),
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed"
  totalAppsScraped: integer("total_apps_scraped").notNull().default(0),
  totalOpportunities: integer("total_opportunities").notNull().default(0),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
  mode: text("mode").notNull().default("category"), // "category" | "idea"
  ideaText: text("idea_text"),
});

export const opportunities = sqliteTable("opportunities", {
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
  // JSON fields
  sentimentJson: text("sentiment_json").notNull(),
  reviewsJson: text("reviews_json").notNull(),
  // Scores
  marketSize: real("market_size").notNull(),
  dissatisfaction: real("dissatisfaction").notNull(),
  feasibility: real("feasibility").notNull(),
  compositeScore: real("composite_score").notNull(),
  createdAt: text("created_at").notNull(),
  // Gap analysis & Blue ocean (idea mode)
  gapAnalysisJson: text("gap_analysis_json"),
  blueOceanJson: text("blue_ocean_json"),
});

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull().references(() => opportunities.id),
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed"
  stepsJson: text("steps_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id").notNull().references(() => analyses.id),
  type: text("type").notNull(), // "app_prd" | "strategic_analysis" | "starter_payload"
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});
