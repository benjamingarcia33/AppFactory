import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const SCAN_ID = "caf781ba-195e-4d02-9dc9-5654c1522ef4";

console.log("═".repeat(80));
console.log("APP STORE PIPELINE — DATABASE VERIFICATION");
console.log("═".repeat(80));

// Scan
const [scan] = await sql`SELECT id, mode, store, idea_text, total_apps_scraped, master_idea_json FROM scans WHERE id = ${SCAN_ID}`;
const masterIdea = scan?.master_idea_json ? JSON.parse(scan.master_idea_json) : null;
console.log(`\n[SCAN] ${scan.store} | ${scan.total_apps_scraped} apps | Master: "${masterIdea?.name}" — ${masterIdea?.tagline}`);

// Opportunities
const opps = await sql`SELECT title, app_id, feasibility, composite_score FROM opportunities WHERE scan_id = ${SCAN_ID} ORDER BY feasibility DESC`;
console.log(`\n[OPPORTUNITIES] ${opps.length}:`);
for (const o of opps) console.log(`  ${o.title} — feasibility=${o.feasibility}, composite=${o.composite_score}`);

// Analysis
const [analysis] = await sql`SELECT id, status, steps_json, completed_at FROM analyses WHERE scan_id = ${SCAN_ID} ORDER BY created_at DESC LIMIT 1`;
console.log(`\n[ANALYSIS] ${analysis.id} — status=${analysis.status}, completed=${analysis.completed_at || "N/A"}`);

const steps = analysis.steps_json ? JSON.parse(analysis.steps_json) : [];
if (Array.isArray(steps)) {
  for (const s of steps) console.log(`  Step ${s.number||s.step}: ${s.title||s.name} — ${s.status}`);
}

// Documents
const docs = await sql`SELECT type, title, LENGTH(content) as len, content FROM documents WHERE analysis_id = ${analysis.id}`;
console.log(`\n[DOCUMENTS] ${docs.length}:`);
for (const d of docs) {
  const skinRef = /skin|derm|facial|beauty|cosmetic|routine|GlowIQ/i.test(d.content || "");
  console.log(`  ${d.type} ("${d.title}") — ${d.len} chars, skincare=${skinRef}`);
}

// EPs
const eps = await sql`SELECT prompt_number, title, LENGTH(content) as len, content FROM execution_prompts WHERE analysis_id = ${analysis.id} ORDER BY prompt_number`;
console.log(`\n[EXECUTION PROMPTS] ${eps.length}:`);
for (const e of eps) {
  const codeBlocks = ((e.content||"").match(/```/g)||[]).length;
  const hasGlowIQ = /GlowIQ/i.test(e.content || "");
  const hasSkincare = /skin|derm|facial|beauty|cosmetic|routine/i.test(e.content || "");
  console.log(`  EP${e.prompt_number} ("${e.title}") — ${e.len} chars, code_blocks=${codeBlocks}, GlowIQ=${hasGlowIQ}, skincare=${hasSkincare}`);
  console.log(`    Preview: ${(e.content||"").slice(0, 250).replace(/\n/g, " ")}...`);
}

// Quality criteria
console.log(`\n${"═".repeat(80)}`);
console.log("QUALITY CRITERIA");
console.log("═".repeat(80));

const completedSteps = Array.isArray(steps) ? steps.filter(s => s.status === "completed").length : 0;
let totalCB = 0;
for (const e of eps) totalCB += ((e.content||"").match(/```/g)||[]).length;

const criteria = [
  { name: "Pipeline completed", pass: ["completed","completed_with_warnings"].includes(analysis.status), detail: analysis.status },
  { name: "All 5 steps completed", pass: completedSteps >= 5, detail: `${completedSteps}/5` },
  { name: "Documents >= 5", pass: docs.length >= 5, detail: `${docs.length}` },
  { name: "3 Execution Prompts", pass: eps.length >= 3, detail: `${eps.length}` },
  { name: "0 code blocks in EPs", pass: totalCB === 0, detail: `${totalCB}` },
  { name: "PRD exists and is substantial", pass: docs.some(d => d.type === "app_prd" && d.len > 10000), detail: docs.find(d=>d.type==="app_prd")?.len || 0 },
  { name: "TechArch exists and is substantial", pass: docs.some(d => d.type === "technical_architecture" && d.len > 10000), detail: docs.find(d=>d.type==="technical_architecture")?.len || 0 },
  { name: "All EPs reference app name", pass: eps.every(e => /GlowIQ/i.test(e.content||"")), detail: eps.map(e => /GlowIQ/i.test(e.content||"")).join(",") },
  { name: "All EPs are skincare-relevant", pass: eps.every(e => /skin|derm|facial|beauty|cosmetic|routine/i.test(e.content||"")), detail: "all skincare" },
  { name: "Scout found >= 5 opps", pass: opps.length >= 5, detail: `${opps.length}` },
  { name: "Master idea generated", pass: !!(masterIdea?.name), detail: masterIdea?.name || "missing" },
];

let allPass = true;
for (const c of criteria) {
  const icon = c.pass ? "PASS" : "FAIL";
  console.log(`  [${icon}] ${c.name}: ${c.detail}`);
  if (!c.pass) allPass = false;
}

console.log(`\n${"═".repeat(80)}`);
console.log(allPass
  ? "VERDICT: ALL CRITERIA MET — Ready for Claude Code testing"
  : `VERDICT: ${criteria.filter(c=>!c.pass).length} criteria failed`);
console.log("═".repeat(80));

await sql.end();
if (!allPass) process.exit(1);
