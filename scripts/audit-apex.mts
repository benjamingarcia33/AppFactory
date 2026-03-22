import postgres from "postgres";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { prepare: false, max: 3, idle_timeout: 10, connect_timeout: 10 });

async function main() {
  // Find opportunities matching "Apex"
  const apexOpps = await sql`SELECT id, title FROM opportunities WHERE title ILIKE ${'%Apex%'}`;
  console.log(`\n=== Found ${apexOpps.length} opportunities matching "Apex" ===`);
  for (const opp of apexOpps) {
    console.log(`  - ${opp.id}: ${opp.title}`);
  }

  // Find scans matching "Apex"
  const apexScans = await sql`SELECT id, idea_text, focus_text FROM scans WHERE idea_text ILIKE ${'%Apex%'} OR focus_text ILIKE ${'%Apex%'}`;
  console.log(`\n=== Found ${apexScans.length} scans matching "Apex" ===`);
  for (const s of apexScans) {
    console.log(`  - ${s.id}: idea="${s.idea_text}", focus="${s.focus_text}"`);
  }

  // Find analyses linked to Apex opportunities or scans
  const oppIds = apexOpps.map((o: any) => o.id);
  const scanIds = apexScans.map((s: any) => s.id);

  let analyses: any[] = [];

  if (oppIds.length > 0) {
    const a = await sql`SELECT * FROM analyses WHERE opportunity_id = ANY(${oppIds}) ORDER BY created_at DESC`;
    analyses.push(...a);
  }
  if (scanIds.length > 0) {
    const a = await sql`SELECT * FROM analyses WHERE scan_id = ANY(${scanIds}) ORDER BY created_at DESC`;
    analyses.push(...a);
  }

  // Also search steps_json
  if (analyses.length === 0) {
    console.log("\nNo analyses found via join. Searching steps_json...");
    const a = await sql`SELECT * FROM analyses WHERE steps_json ILIKE ${'%Apex%'} ORDER BY created_at DESC`;
    analyses.push(...a);
  }

  // Also search documents content for Apex
  if (analyses.length === 0) {
    console.log("Searching document content for Apex...");
    const docAnalysisIds = await sql`SELECT DISTINCT analysis_id FROM documents WHERE content ILIKE ${'%Apex%'}`;
    if (docAnalysisIds.length > 0) {
      const ids = docAnalysisIds.map((d: any) => d.analysis_id);
      const a = await sql`SELECT * FROM analyses WHERE id = ANY(${ids}) ORDER BY created_at DESC`;
      analyses.push(...a);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  analyses = analyses.filter((a: any) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  console.log(`\n=== Found ${analyses.length} analyses related to "Apex" ===`);
  for (const a of analyses) {
    console.log(`  - ${a.id} | status=${a.status} | created=${a.created_at} | completed=${a.completed_at}`);
  }

  if (analyses.length === 0) {
    console.log("\nNo Apex analyses found. Listing ALL analyses for reference:");
    const all = await sql`SELECT a.*, o.title as opp_title FROM analyses a LEFT JOIN opportunities o ON a.opportunity_id = o.id ORDER BY a.created_at DESC`;
    for (const a of all) {
      console.log(`  - ${a.id} | opp="${a.opp_title}" | status=${a.status} | created=${a.created_at}`);
    }
    await sql.end();
    return;
  }

  const latest = analyses[0];
  console.log(`\n${"=".repeat(80)}`);
  console.log(`LATEST APEX ANALYSIS: ${latest.id}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`Status: ${latest.status}`);
  console.log(`Opportunity ID: ${latest.opportunity_id}`);
  console.log(`Scan ID: ${latest.scan_id}`);
  console.log(`Created: ${latest.created_at}`);
  console.log(`Completed: ${latest.completed_at}`);

  // Steps
  console.log(`\n${"=".repeat(80)}`);
  console.log("ANALYSIS STEPS (steps_json):");
  console.log(`${"=".repeat(80)}`);
  try {
    const steps = JSON.parse(latest.steps_json);
    console.log(JSON.stringify(steps, null, 2));
  } catch {
    console.log(latest.steps_json);
  }

  // Documents
  const docs = await sql`SELECT * FROM documents WHERE analysis_id = ${latest.id} ORDER BY type`;
  console.log(`\n${"=".repeat(80)}`);
  console.log(`DOCUMENTS (${docs.length} found):`);
  console.log(`${"=".repeat(80)}`);

  for (const doc of docs) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`Document ID: ${doc.id}`);
    console.log(`Type: ${doc.type}`);
    console.log(`Title: ${doc.title}`);
    console.log(`Created: ${doc.created_at}`);
    console.log(`${"─".repeat(80)}`);
    console.log("CONTENT:");
    console.log(doc.content);
  }

  // Execution Prompts
  const eps = await sql`SELECT * FROM execution_prompts WHERE analysis_id = ${latest.id} ORDER BY prompt_number`;
  console.log(`\n${"=".repeat(80)}`);
  console.log(`EXECUTION PROMPTS (${eps.length} found):`);
  console.log(`${"=".repeat(80)}`);

  for (const ep of eps) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`EP ID: ${ep.id}`);
    console.log(`Prompt Number: ${ep.prompt_number}`);
    console.log(`Title: ${ep.title}`);
    console.log(`Tech Slugs: ${ep.tech_slugs_json}`);
    console.log(`Created: ${ep.created_at}`);
    console.log(`${"─".repeat(80)}`);
    console.log("CONTENT:");
    console.log(ep.content);
  }

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
