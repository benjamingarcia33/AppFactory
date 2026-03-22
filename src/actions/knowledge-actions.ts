"use server";

import { db } from "@/lib/db";
import { technologies, screenPatterns, techSynergies, executionPrompts } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import type { Technology, ScreenPattern, TechSynergy, ExecutionPrompt, TechCategory } from "@/lib/types";

// ============================================
// Technology queries
// ============================================

export async function getAllTechnologies(): Promise<Technology[]> {
  const rows = await db.select().from(technologies).orderBy(asc(technologies.category), asc(technologies.name));
  return rows.map(rowToTechnology);
}

export async function getTechnologiesByCategory(category: TechCategory): Promise<Technology[]> {
  const rows = await db
    .select()
    .from(technologies)
    .where(eq(technologies.category, category))
    .orderBy(asc(technologies.name));
  return rows.map(rowToTechnology);
}

/**
 * Compact text table of all technologies organized by category (~3500 tokens).
 * Used by Step 5 to show the AI what's available for selection.
 */
export async function getTechnologyCatalog(): Promise<string> {
  const allTechs = await getAllTechnologies();

  const byCategory = new Map<string, typeof allTechs>();
  for (const tech of allTechs) {
    const list = byCategory.get(tech.category) ?? [];
    list.push(tech);
    byCategory.set(tech.category, list);
  }

  const sections: string[] = [];
  for (const [category, techs] of byCategory) {
    const lines = techs.map((t) => {
      const tags = [t.complexity, t.platforms, t.setupComplexity].join(", ");
      return `  - [${t.slug}] ${t.name} (${tags})`;
    });
    sections.push(`### ${category}\n${lines.join("\n")}`);
  }

  return `# Available Technologies\nSelect by slug.\n\n${sections.join("\n\n")}`;
}

/**
 * Fetch full promptFragment for each selected technology slug.
 * Returns a map of slug → { name, category, promptFragment }.
 */
export async function getSelectedTechFragments(
  slugs: string[]
): Promise<Map<string, { name: string; category: string; promptFragment: string; promptFragmentMobile: string | null }>> {
  if (slugs.length === 0) return new Map();

  const rows = await db
    .select()
    .from(technologies)
    .where(inArray(technologies.slug, slugs));

  const result = new Map<string, { name: string; category: string; promptFragment: string; promptFragmentMobile: string | null }>();
  for (const row of rows) {
    result.set(row.slug, {
      name: row.name,
      category: row.category,
      promptFragment: row.promptFragment,
      promptFragmentMobile: row.promptFragmentMobile,
    });
  }
  return result;
}

// ============================================
// Screen Pattern queries
// ============================================

export async function getAllScreenPatterns(): Promise<ScreenPattern[]> {
  const rows = await db.select().from(screenPatterns).orderBy(asc(screenPatterns.category), asc(screenPatterns.name));
  return rows.map(rowToScreenPattern);
}

/**
 * Compact text table of all screen patterns (~1200 tokens).
 * Used by Step 5 alongside the tech catalog.
 */
export async function getScreenPatternCatalog(): Promise<string> {
  const allPatterns = await getAllScreenPatterns();

  const byCategory = new Map<string, typeof allPatterns>();
  for (const p of allPatterns) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const sections: string[] = [];
  for (const [category, patterns] of byCategory) {
    const lines = patterns.map((p) => {
      const reqTech = p.requiredTechCategories.length > 0
        ? ` | Requires: ${p.requiredTechCategories.join(", ")}`
        : "";
      return `  - [${p.slug}] ${p.name} (${p.platforms})${reqTech}`;
    });
    sections.push(`### ${category}\n${lines.join("\n")}`);
  }

  return `# Screen Patterns\nMap each screen to a pattern slug.\n\n${sections.join("\n\n")}`;
}

/**
 * Fetch full promptFragment for selected screen pattern slugs.
 */
export async function getSelectedScreenFragments(
  slugs: string[]
): Promise<Map<string, { name: string; category: string; promptFragment: string; layoutDescription: string }>> {
  if (slugs.length === 0) return new Map();

  const rows = await db
    .select()
    .from(screenPatterns)
    .where(inArray(screenPatterns.slug, slugs));

  const result = new Map<string, { name: string; category: string; promptFragment: string; layoutDescription: string }>();
  for (const row of rows) {
    result.set(row.slug, {
      name: row.name,
      category: row.category,
      promptFragment: row.promptFragment,
      layoutDescription: row.layoutDescription,
    });
  }
  return result;
}

// ============================================
// Tech Synergy queries
// ============================================

/**
 * Fetch all synergy entries. Used by the Library page to show all tech synergies.
 */
export async function getAllSynergies(): Promise<TechSynergy[]> {
  const rows = await db.select().from(techSynergies).orderBy(asc(techSynergies.techSlugA), asc(techSynergies.techSlugB));
  return rows.map(rowToSynergy);
}

/**
 * Fetch synergy notes for a set of selected tech slugs.
 * Returns only synergies where BOTH slugs are in the selection.
 */
export async function getTechSynergiesForSlugs(slugs: string[]): Promise<TechSynergy[]> {
  if (slugs.length < 2) return [];

  const allSynergies = await db.select().from(techSynergies);

  const slugSet = new Set(slugs);
  return allSynergies
    .filter((s) => slugSet.has(s.techSlugA) && slugSet.has(s.techSlugB))
    .map(rowToSynergy);
}

// ============================================
// Execution Prompt queries (kept from blueprint-actions.ts)
// ============================================

export async function getExecutionPromptsByAnalysis(
  analysisId: string
): Promise<ExecutionPrompt[]> {
  const rows = await db
    .select()
    .from(executionPrompts)
    .where(eq(executionPrompts.analysisId, analysisId))
    .orderBy(asc(executionPrompts.promptNumber));

  return rows.map((row) => ({
    id: row.id,
    analysisId: row.analysisId,
    promptNumber: row.promptNumber as 1 | 2 | 3,
    title: row.title,
    content: row.content,
    techSlugs: JSON.parse(row.techSlugsJson),
    createdAt: row.createdAt,
  }));
}

// ============================================
// Selected tech details (for CLAUDE.md generation)
// ============================================

export interface TechDetail {
  name: string;
  category: string;
  setupComplexity: string;
  docsUrl: string | null;
  npmPackages: string[];
  npmPackagesMobile: string[];
}

/**
 * Fetch setup-relevant metadata for each selected technology slug.
 * Used by the pipeline to populate ClaudeMdInput.techDetails.
 */
export async function getSelectedTechDetails(
  slugs: string[]
): Promise<Map<string, TechDetail>> {
  if (slugs.length === 0) return new Map();

  const rows = await db
    .select()
    .from(technologies)
    .where(inArray(technologies.slug, slugs));

  const result = new Map<string, TechDetail>();
  for (const row of rows) {
    result.set(row.slug, {
      name: row.name,
      category: row.category,
      setupComplexity: row.setupComplexity,
      docsUrl: row.docsUrl,
      npmPackages: JSON.parse(row.npmPackagesJson),
      npmPackagesMobile: JSON.parse(row.npmPackagesMobileJson ?? "[]"),
    });
  }
  return result;
}

// ============================================
// Slug validation helpers
// ============================================

/**
 * Return the set of all technology slugs in the knowledge base.
 * Used by the pipeline to validate Step 5 tech selections.
 */
export async function getTechSlugs(): Promise<Set<string>> {
  const rows = await db.select({ slug: technologies.slug }).from(technologies);
  return new Set(rows.map((r) => r.slug));
}

/**
 * Return the set of all screen pattern slugs in the knowledge base.
 * Used by the pipeline to validate Step 5 screen mappings.
 */
export async function getScreenPatternSlugs(): Promise<Set<string>> {
  const rows = await db.select({ slug: screenPatterns.slug }).from(screenPatterns);
  return new Set(rows.map((r) => r.slug));
}

// ============================================
// Row mappers
// ============================================

function rowToTechnology(row: typeof technologies.$inferSelect): Technology {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as TechCategory,
    description: row.description,
    bestFor: row.bestFor,
    limitations: row.limitations,
    pricing: row.pricing,
    complexity: row.complexity as Technology["complexity"],
    platforms: row.platforms as Technology["platforms"],
    mobileFramework: row.mobileFramework,
    npmPackages: JSON.parse(row.npmPackagesJson),
    setupComplexity: row.setupComplexity as Technology["setupComplexity"],
    promptFragment: row.promptFragment,
    promptFragmentMobile: row.promptFragmentMobile,
    requires: JSON.parse(row.requiresJson),
    pairsWith: JSON.parse(row.pairsWellJson),
    conflictsWith: JSON.parse(row.conflictsJson),
    docsUrl: row.docsUrl,
    verified: row.verified,
    createdAt: row.createdAt,
  };
}

function rowToScreenPattern(row: typeof screenPatterns.$inferSelect): ScreenPattern {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as ScreenPattern["category"],
    description: row.description,
    layoutPattern: row.layoutPattern,
    layoutDescription: row.layoutDescription,
    interactions: JSON.parse(row.interactionsJson),
    states: JSON.parse(row.statesJson),
    requiredTechCategories: JSON.parse(row.requiredTechCategoriesJson),
    optionalTechCategories: JSON.parse(row.optionalTechCategoriesJson),
    stateApproach: row.stateApproach,
    dataFlowDescription: row.dataFlowDescription,
    navigatesTo: JSON.parse(row.navigatesToJson),
    navigatesFrom: JSON.parse(row.navigatesFromJson),
    promptFragment: row.promptFragment,
    platforms: row.platforms,
    verified: row.verified,
    createdAt: row.createdAt,
  };
}

function rowToSynergy(row: typeof techSynergies.$inferSelect): TechSynergy {
  return {
    id: row.id,
    techSlugA: row.techSlugA,
    techSlugB: row.techSlugB,
    relationship: row.relationship as TechSynergy["relationship"],
    reason: row.reason,
    promptNote: row.promptNote,
  };
}
