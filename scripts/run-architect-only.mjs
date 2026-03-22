#!/usr/bin/env node
/**
 * Architect-only runner — uses existing scan from Scout.
 * Monitors SSE stream, logs all events, captures errors and timing.
 */

const BASE = "http://localhost:3000";
const SCAN_ID = "3aaa5db5-9189-49d2-9c05-d0f42e45e371"; // From successful Scout run

function ts() { return new Date().toISOString().slice(11, 19); }
function log(msg) { console.log(`[${ts()}] ${msg}`); }

function parseSSE(chunk) {
  const events = [];
  const lines = chunk.split("\n");
  let currentData = "";
  for (const line of lines) {
    if (line.startsWith("data: ")) currentData += line.slice(6);
    else if (line === "" && currentData) {
      try { events.push(JSON.parse(currentData)); } catch {}
      currentData = "";
    }
  }
  return events;
}

async function main() {
  const url = `${BASE}/api/architect/stream?scanId=${SCAN_ID}`;
  log(`Connecting to Architect: ${url}`);
  const startTime = Date.now();

  const res = await fetch(url, {
    headers: { Accept: "text/event-stream" },
    signal: AbortSignal.timeout(2700000), // 45 min
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const docs = [];
  const errors = [];
  let analysisId = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lastDbl = buffer.lastIndexOf("\n\n");
    if (lastDbl < 0) continue;
    const toParse = buffer.slice(0, lastDbl + 2);
    buffer = buffer.slice(lastDbl + 2);
    const events = parseSSE(toParse);

    for (const evt of events) {
      switch (evt.type) {
        case "analysis_started":
          analysisId = evt.analysisId;
          log(`Analysis started: ${analysisId}`);
          break;
        case "progress": {
          const icon = evt.status === "completed" ? "OK" : evt.status === "failed" ? "FAIL" : "...";
          log(`[${icon}] Step ${evt.step || "?"} ${evt.title || ""}: ${evt.status || ""}`);
          break;
        }
        case "document": {
          const d = evt.document || evt;
          docs.push({ type: d.type, title: d.title, size: d.content?.length || 0 });
          log(`DOC: ${d.title || d.type} (${((d.content?.length || 0) / 1024).toFixed(1)} KB)`);
          break;
        }
        case "step_failed":
          errors.push(`Step ${evt.step}: ${evt.error || evt.message}`);
          log(`STEP FAILED: Step ${evt.step} — ${evt.error || evt.message}`);
          break;
        case "complete":
          log(`COMPLETE! Warnings: ${evt.warnings?.length || 0}`);
          if (evt.warnings?.length) evt.warnings.forEach(w => log(`  WARN: ${w}`));
          break;
        case "error":
          errors.push(evt.message || evt.error);
          log(`ERROR: ${evt.message || evt.error}`);
          break;
        default:
          log(`Event: ${evt.type}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`ARCHITECT RESULTS`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Analysis ID: ${analysisId}`);
  console.log(`Duration:    ${elapsed}s (${(elapsed / 60).toFixed(1)} min)`);
  console.log(`Documents:   ${docs.length}`);
  for (const d of docs) console.log(`  - ${d.title || d.type} (${(d.size / 1024).toFixed(1)} KB)`);
  console.log(`Errors:      ${errors.length > 0 ? errors.join("; ") : "None"}`);
  console.log(`${"=".repeat(70)}`);
}

main().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
