// Verify stored results for the skincare scan + architect analysis
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const SCAN_ID = "f2a007e9-d8d6-412d-af6a-14a3ab0688cc";

console.log("═".repeat(80));
console.log("DATABASE VERIFICATION — FULL PIPELINE RESULTS");
console.log("═".repeat(80));

// 1. Scan record
const scans = await sql`SELECT id, mode, store, idea_text, total_apps_scraped, master_idea_json, created_at FROM scans WHERE id = ${SCAN_ID}`;
const scan = scans[0];
let masterIdea = null;
if (scan) {
  console.log(`\n[SCAN]`);
  console.log(`  ID: ${scan.id}`);
  console.log(`  Mode: ${scan.mode}`);
  console.log(`  Store: ${scan.store}`);
  console.log(`  Idea: ${(scan.idea_text || "").slice(0, 120)}...`);
  console.log(`  Apps scraped: ${scan.total_apps_scraped}`);
  masterIdea = scan.master_idea_json ? JSON.parse(scan.master_idea_json) : null;
  if (masterIdea) {
    console.log(`  Master idea name: ${masterIdea.name || masterIdea.appName}`);
    console.log(`  Master idea tagline: ${masterIdea.tagline}`);
    console.log(`  Go/No-Go factors: ${masterIdea.goNoGoFactors?.length || 0}`);
    console.log(`  Warnings: ${masterIdea.warnings?.length || 0}`);
    console.log(`  Keys present: ${Object.keys(masterIdea).join(", ")}`);
  }
} else {
  console.log(`\nSCAN NOT FOUND: ${SCAN_ID}`);
  await sql.end();
  process.exit(1);
}

// 2. Opportunities
const opportunities = await sql`SELECT id, title, app_id, feasibility, composite_score FROM opportunities WHERE scan_id = ${SCAN_ID} ORDER BY feasibility DESC`;
console.log(`\n[OPPORTUNITIES] (${opportunities.length}):`);
for (const opp of opportunities) {
  console.log(`  ${opp.title} (${opp.app_id}) — feasibility=${opp.feasibility}, composite=${opp.composite_score}`);
}

// 3. Analysis
const analyses = await sql`SELECT id, scan_id, opportunity_id, status, steps_json, created_at, completed_at FROM analyses WHERE scan_id = ${SCAN_ID} ORDER BY created_at DESC LIMIT 1`;
const analysis = analyses[0];
if (analysis) {
  console.log(`\n[ANALYSIS]`);
  console.log(`  ID: ${analysis.id}`);
  console.log(`  Status: ${analysis.status}`);
  console.log(`  Created: ${analysis.created_at}`);
  console.log(`  Completed: ${analysis.completed_at || "N/A"}`);
  const steps = analysis.steps_json ? JSON.parse(analysis.steps_json) : null;
  if (steps && Array.isArray(steps)) {
    console.log(`  Steps (${steps.length}):`);
    for (const step of steps) {
      console.log(`    Step ${step.number || step.step}: ${step.title || step.name} — ${step.status}`);
    }
  }

  // 4. Documents
  const docs = await sql`SELECT id, type, title, content FROM documents WHERE analysis_id = ${analysis.id}`;
  console.log(`\n[DOCUMENTS] (${docs.length}):`);
  for (const doc of docs) {
    const contentLen = (doc.content || "").length;
    const preview = (doc.content || "").slice(0, 200).replace(/\n/g, " ");
    const content = doc.content || "";
    const hasSkincare = /skin|derm|facial|beauty|cosmetic|routine/i.test(content);
    console.log(`  ${doc.type} ("${doc.title}"): ${contentLen} chars, skincare-relevant=${hasSkincare}`);
    console.log(`    Preview: ${preview}...`);
  }

  // 5. Execution Prompts
  const eps = await sql`SELECT id, prompt_number, title, content FROM execution_prompts WHERE analysis_id = ${analysis.id} ORDER BY prompt_number`;
  console.log(`\n[EXECUTION PROMPTS] (${eps.length}):`);
  for (const ep of eps) {
    const contentLen = (ep.content || "").length;
    const codeBlocks = ((ep.content || "").match(/```/g) || []).length;
    const content = ep.content || "";
    const hasDermaDiary = /DermaDiary/i.test(content);
    const hasSkincare = /skin|derm|facial|beauty|cosmetic|routine/i.test(content);
    console.log(`  EP${ep.prompt_number}: "${ep.title}" — ${contentLen} chars, code_blocks=${codeBlocks}, DermaDiary=${hasDermaDiary}, skincare=${hasSkincare}`);
    console.log(`    Preview: ${content.slice(0, 250).replace(/\n/g, " ")}...`);
  }

  // ═══════════════════════════════════════════
  // QUALITY CRITERIA
  // ═══════════════════════════════════════════
  console.log(`\n${"═".repeat(80)}`);
  console.log("QUALITY CRITERIA — READY FOR EXTERNAL TESTING?");
  console.log("═".repeat(80));

  const criteria = [];

  criteria.push({
    name: "Scout found >= 5 opportunities",
    pass: opportunities.length >= 5,
    detail: `${opportunities.length} opportunities`,
  });

  criteria.push({
    name: "Master idea generated with name and tagline",
    pass: !!(masterIdea?.name && masterIdea?.tagline),
    detail: masterIdea ? `name="${masterIdea.name}", tagline="${(masterIdea.tagline || "").slice(0, 60)}"` : "Missing",
  });

  const stepsArr = analysis.steps_json ? JSON.parse(analysis.steps_json) : [];
  const completedSteps = Array.isArray(stepsArr) ? stepsArr.filter(s => s.status === "completed").length : 0;
  criteria.push({
    name: "All 5 Architect steps completed",
    pass: completedSteps >= 5,
    detail: `${completedSteps}/5 completed`,
  });

  criteria.push({
    name: "Analysis completed successfully",
    pass: ["completed", "completed_with_warnings"].includes(analysis.status),
    detail: `Status: ${analysis.status}`,
  });

  criteria.push({
    name: "Documents generated (>= 5)",
    pass: docs.length >= 5,
    detail: `${docs.length} docs: ${docs.map(d => d.type).join(", ")}`,
  });

  criteria.push({
    name: "3 Execution Prompts generated",
    pass: eps.length >= 3,
    detail: `${eps.length} EPs`,
  });

  let totalCodeBlocks = 0;
  for (const ep of eps) {
    totalCodeBlocks += ((ep.content || "").match(/```/g) || []).length;
  }
  criteria.push({
    name: "No code blocks in EPs (QA fix A1)",
    pass: totalCodeBlocks === 0,
    detail: `${totalCodeBlocks} code blocks total`,
  });

  const shortDocs = docs.filter(d => (d.content || "").length < 2000);
  criteria.push({
    name: "All documents >= 2000 chars",
    pass: shortDocs.length === 0,
    detail: shortDocs.length === 0 ? "All adequate" : `Short: ${shortDocs.map(d => `${d.type}(${(d.content||"").length})`).join(", ")}`,
  });

  const allContentPieces = [...docs.map(d => d.content || ""), ...eps.map(e => e.content || "")];
  const skincareRefs = allContentPieces.filter(c => /skin|derm|facial|beauty|cosmetic/i.test(c)).length;
  criteria.push({
    name: "All docs/EPs reference skincare domain",
    pass: skincareRefs === allContentPieces.length,
    detail: `${skincareRefs}/${allContentPieces.length} contain skincare references`,
  });

  let allPass = true;
  for (const c of criteria) {
    const icon = c.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${c.name}: ${c.detail}`);
    if (!c.pass) allPass = false;
  }

  console.log(`\n${"═".repeat(80)}`);
  if (allPass) {
    console.log("VERDICT: ALL CRITERIA MET — Ready for external testing");
  } else {
    const failCount = criteria.filter(c => !c.pass).length;
    console.log(`VERDICT: ${failCount} criteria failed — needs investigation`);
  }
  console.log("═".repeat(80));
} else {
  console.log(`\nNo analysis found for scan ${SCAN_ID}`);
}

await sql.end();
