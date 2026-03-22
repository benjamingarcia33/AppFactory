// Test Architect pipeline via SSE, with a long timeout and progress tracking
const SCAN_ID = process.argv[2] || "caf781ba-195e-4d02-9dc9-5654c1522ef4";
const params = new URLSearchParams({ scanId: SCAN_ID });
const url = `http://localhost:3000/api/architect/stream?${params.toString()}`;
console.log(`[test] Connecting to Architect: ${url}\n`);

const startTime = Date.now();
let analysisId = null;
let eventsReceived = 0;
let errors = [];
let steps = {};
let documents = {};
let lastEvent = null;

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(2700_000) });
  if (!res.ok) {
    console.error(`[test] HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      let event;
      try { event = JSON.parse(raw); } catch { continue; }
      eventsReceived++;
      lastEvent = event;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      switch (event.type) {
        case "analysis_started":
          analysisId = event.analysisId;
          console.log(`[${elapsed}s] ANALYSIS STARTED — id=${analysisId}`);
          break;
        case "progress":
          if (event.step) {
            const status = event.status || "";
            steps[event.step] = { title: event.title, status };
            console.log(`[${elapsed}s] STEP ${event.step}: ${event.title} — ${status}`);
          } else {
            console.log(`[${elapsed}s] PROGRESS: ${event.message || JSON.stringify(event).slice(0, 200)}`);
          }
          break;
        case "document":
          const doc = event.document || event;
          const docType = doc.type || doc.documentType || "unknown";
          const docLen = (doc.content || "").length;
          documents[docType] = doc;
          console.log(`[${elapsed}s] DOCUMENT: ${docType} ("${doc.title || ""}") — ${docLen} chars`);
          break;
        case "complete":
          console.log(`[${elapsed}s] COMPLETE`);
          break;
        case "error":
          errors.push(event);
          console.error(`[${elapsed}s] ERROR: ${event.message}`);
          break;
        default:
          console.log(`[${elapsed}s] [${event.type}]: ${JSON.stringify(event).slice(0, 200)}`);
      }
    }
  }
} catch (err) {
  errors.push({ message: `Connection: ${err.message}` });
  console.error(`[test] Connection error: ${err.message}`);
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

// If SSE dropped, check DB directly for results
console.log(`\n${"═".repeat(80)}`);
console.log(`ARCHITECT PIPELINE — SSE RESULTS`);
console.log(`${"═".repeat(80)}`);
console.log(`Time: ${totalTime}s | Events: ${eventsReceived} | Errors: ${errors.length}`);
console.log(`Analysis ID: ${analysisId}`);
console.log(`Steps: ${Object.entries(steps).map(([k, v]) => `${k}:${v.status}`).join(", ") || "none via SSE"}`);
console.log(`Documents via SSE: ${Object.keys(documents).length} — ${Object.keys(documents).join(", ") || "none"}`);

if (errors.length > 0) {
  console.log(`\nERRORS:`);
  for (const e of errors) console.log(`  - ${e.message}`);
}

// Now verify from database regardless of SSE status
console.log(`\nVerifying from database...`);
import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const analyses = await sql`SELECT id, status, steps_json, completed_at FROM analyses WHERE scan_id = ${SCAN_ID} ORDER BY created_at DESC LIMIT 1`;
const analysis = analyses[0];

if (!analysis) {
  // Might still be running — wait and retry
  console.log("No analysis found yet. Pipeline may still be running...");
  console.log("Waiting 5 min and retrying...");
  await new Promise(r => setTimeout(r, 300_000));
  const retry = await sql`SELECT id, status, steps_json, completed_at FROM analyses WHERE scan_id = ${SCAN_ID} ORDER BY created_at DESC LIMIT 1`;
  if (retry[0]) {
    Object.assign(analysis || {}, retry[0]);
  }
}

if (analysis) {
  console.log(`\nDB Analysis: ${analysis.id} — status=${analysis.status}`);

  const stepsArr = analysis.steps_json ? JSON.parse(analysis.steps_json) : [];
  const completedSteps = Array.isArray(stepsArr) ? stepsArr.filter(s => s.status === "completed").length : 0;
  console.log(`Steps completed: ${completedSteps}/5`);

  if (Array.isArray(stepsArr)) {
    for (const s of stepsArr) {
      console.log(`  Step ${s.number || s.step}: ${s.title || s.name} — ${s.status}`);
    }
  }

  const docs = await sql`SELECT type, title, LENGTH(content) as len FROM documents WHERE analysis_id = ${analysis.id}`;
  console.log(`\nDocuments (${docs.length}):`);
  for (const d of docs) {
    console.log(`  ${d.type} ("${d.title}") — ${d.len} chars`);
  }

  const eps = await sql`SELECT prompt_number, title, LENGTH(content) as len, content FROM execution_prompts WHERE analysis_id = ${analysis.id} ORDER BY prompt_number`;
  console.log(`\nExecution Prompts (${eps.length}):`);
  for (const e of eps) {
    const codeBlocks = ((e.content || "").match(/```/g) || []).length;
    console.log(`  EP${e.prompt_number} ("${e.title}") — ${e.len} chars, code_blocks=${codeBlocks}`);
  }

  // Quality criteria
  console.log(`\n${"═".repeat(80)}`);
  console.log("QUALITY CRITERIA");
  console.log("═".repeat(80));

  const criteria = [
    { name: "Analysis completed", pass: ["completed", "completed_with_warnings"].includes(analysis.status), detail: analysis.status },
    { name: "All 5 steps completed", pass: completedSteps >= 5, detail: `${completedSteps}/5` },
    { name: "Documents >= 5", pass: docs.length >= 5, detail: `${docs.length}: ${docs.map(d=>d.type).join(", ")}` },
    { name: "3 Execution Prompts", pass: eps.length >= 3, detail: `${eps.length}` },
    { name: "No code blocks in EPs", pass: eps.every(e => !((e.content||"").match(/```/))), detail: eps.map(e => ((e.content||"").match(/```/g)||[]).length).join(",") },
    { name: "All docs >= 200 chars", pass: docs.every(d => d.len >= 200), detail: docs.filter(d => d.len < 200).map(d => `${d.type}(${d.len})`).join(",") || "all ok" },
  ];

  let allPass = true;
  for (const c of criteria) {
    const icon = c.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${c.name}: ${c.detail}`);
    if (!c.pass) allPass = false;
  }

  console.log(`\n${"═".repeat(80)}`);
  console.log(allPass ? "VERDICT: ALL CRITERIA MET — Ready for Claude Code testing" : `VERDICT: ${criteria.filter(c=>!c.pass).length} criteria failed`);
  console.log("═".repeat(80));

  await sql.end();
  if (!allPass) process.exit(1);
} else {
  console.log("Analysis still not found in DB. Pipeline may have failed silently.");
  await sql.end();
  process.exit(1);
}
