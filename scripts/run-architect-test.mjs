// Phase 4: Run Architect Pipeline - Master Idea mode
import { readFileSync } from 'fs';

const { scanId } = JSON.parse(readFileSync('scripts/scout-result.json', 'utf-8'));
const url = `http://localhost:3000/api/architect/stream?scanId=${scanId}`;

console.log("=== ARCHITECT PIPELINE TEST ===");
console.log("Mode: masterIdea");
console.log("Scan ID:", scanId);
console.log("URL:", url);
console.log("Started at:", new Date().toISOString());
console.log("---");

let analysisId = null;
let eventCount = 0;

try {
  const controller = new AbortController();
  // 45-minute timeout to match server side
  const timeout = setTimeout(() => controller.abort(), 45 * 60 * 1000);
  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) {
    const text = await response.text();
    console.error("HTTP Error:", response.status, text);
    process.exit(1);
  }

  const reader = response.body.getReader();
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
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr);
        eventCount++;
        const ts = new Date().toISOString().slice(11, 19);

        switch (event.type) {
          case "analysis_started":
            analysisId = event.analysisId;
            console.log(`[${ts}] ANALYSIS_STARTED analysisId=${analysisId}`);
            break;
          case "step_complete":
            console.log(`[${ts}] STEP_COMPLETE: Step ${event.step} — ${event.title || ''}`);
            break;
          case "step_started":
            console.log(`[${ts}] STEP_STARTED: Step ${event.step} — ${event.title || ''}`);
            break;
          case "document_started":
            console.log(`[${ts}] DOCUMENT_STARTED: ${event.documentType}`);
            break;
          case "document_complete":
            console.log(`[${ts}] DOCUMENT_COMPLETE: ${event.documentType}`);
            break;
          case "batch_started":
            console.log(`[${ts}] BATCH_STARTED: ${event.batchName || event.message || ''}`);
            break;
          case "batch_complete":
            console.log(`[${ts}] BATCH_COMPLETE: ${event.batchName || event.message || ''}`);
            break;
          case "complete":
            console.log(`[${ts}] COMPLETE — analysis finished`);
            break;
          case "error":
            console.error(`[${ts}] ERROR: ${event.message}`);
            break;
          case "progress":
            console.log(`[${ts}] PROGRESS: ${event.message} (${event.progress}%)`);
            break;
          default:
            console.log(`[${ts}] ${event.type}: ${JSON.stringify(event).slice(0, 300)}`);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  clearTimeout(timeout);
} catch (err) {
  console.error("Fetch error:", err.message);
}

console.log("---");
console.log("Finished at:", new Date().toISOString());
console.log("Total events:", eventCount);
console.log("Analysis ID:", analysisId);

// Write analysisId to file for extraction phase
if (analysisId) {
  const fs = await import("fs");
  fs.writeFileSync("scripts/architect-result.json", JSON.stringify({ analysisId, scanId, timestamp: new Date().toISOString() }));
  console.log("Wrote analysisId to scripts/architect-result.json");
}
