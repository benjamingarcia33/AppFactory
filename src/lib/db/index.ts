import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(path.join(dataDir, "appfoundry.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 3000");

export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    store TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    total_apps_scraped INTEGER NOT NULL DEFAULT 0,
    total_opportunities INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    mode TEXT NOT NULL DEFAULT 'category',
    idea_text TEXT
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES scans(id),
    app_id TEXT NOT NULL,
    title TEXT NOT NULL,
    store TEXT NOT NULL,
    genre TEXT NOT NULL,
    score REAL NOT NULL,
    ratings INTEGER NOT NULL,
    installs TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    url TEXT NOT NULL,
    developer TEXT NOT NULL,
    sentiment_json TEXT NOT NULL,
    reviews_json TEXT NOT NULL,
    market_size REAL NOT NULL,
    dissatisfaction REAL NOT NULL,
    feasibility REAL NOT NULL,
    composite_score REAL NOT NULL,
    created_at TEXT NOT NULL,
    gap_analysis_json TEXT,
    blue_ocean_json TEXT
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
    status TEXT NOT NULL DEFAULT 'running',
    steps_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL REFERENCES analyses(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Idempotent ALTER TABLE migrations for new columns
const migrations = [
  "ALTER TABLE scans ADD COLUMN mode TEXT NOT NULL DEFAULT 'category'",
  "ALTER TABLE scans ADD COLUMN idea_text TEXT",
  "ALTER TABLE opportunities ADD COLUMN gap_analysis_json TEXT",
  "ALTER TABLE opportunities ADD COLUMN blue_ocean_json TEXT",
];

for (const sql of migrations) {
  try {
    sqlite.exec(sql);
  } catch {
    // Column already exists — ignore
  }
}

// Create indexes for query performance
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_opportunities_scan_id ON opportunities(scan_id);
  CREATE INDEX IF NOT EXISTS idx_opportunities_composite_score ON opportunities(composite_score DESC);
  CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
  CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_analyses_opportunity_id ON analyses(opportunity_id);
  CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
  CREATE INDEX IF NOT EXISTS idx_documents_analysis_id ON documents(analysis_id);
`);
