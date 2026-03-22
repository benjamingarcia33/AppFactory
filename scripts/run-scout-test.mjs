// Phase 2: Run Scout Pipeline - Synthesis mode, App Store
// Idea: Cognitize speech coaching app

const ideaText = "GlowLog - a skincare logging and routine tracking app";
const url = `http://localhost:3000/api/scout/stream?store=app_store&mode=synthesis&ideaText=${encodeURIComponent(ideaText)}`;

console.log("=== SCOUT PIPELINE TEST ===");
console.log("Mode: synthesis");
console.log("Store: app_store");
console.log("Idea:", ideaText);
console.log("URL:", url);
console.log("Started at:", new Date().toISOString());
console.log("---");

let scanId = null;
let eventCount = 0;

try {
  const response = await fetch(url);
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
          case "scan_started":
            scanId = event.scanId;
            console.log(`[${ts}] SCAN_STARTED scanId=${scanId}`);
            break;
          case "step":
            console.log(`[${ts}] STEP: ${event.step} — ${event.message}`);
            break;
          case "search_result":
            console.log(`[${ts}] SEARCH_RESULT: Found "${event.appName}" (${event.rating}★, ${event.reviews} reviews)`);
            break;
          case "opportunity":
            console.log(`[${ts}] OPPORTUNITY: ${event.appName} — score=${event.compositeScore}`);
            break;
          case "master_idea":
            console.log(`[${ts}] MASTER_IDEA generated`);
            break;
          case "blue_ocean":
            console.log(`[${ts}] BLUE_OCEAN generated`);
            break;
          case "complete":
            console.log(`[${ts}] COMPLETE — totalOpportunities=${event.totalOpportunities}`);
            break;
          case "error":
            console.error(`[${ts}] ERROR: ${event.message}`);
            break;
          case "step_failed":
            console.error(`[${ts}] STEP_FAILED: ${event.step} — ${event.message}`);
            break;
          default:
            console.log(`[${ts}] ${event.type}: ${JSON.stringify(event).slice(0, 200)}`);
        }
      } catch (e) {
        // Ignore parse errors for partial data
      }
    }
  }
} catch (err) {
  console.error("Fetch error:", err.message);
}

console.log("---");
console.log("Finished at:", new Date().toISOString());
console.log("Total events:", eventCount);
console.log("Scan ID:", scanId);

// Write scanId to file for Architect phase
if (scanId) {
  const fs = await import("fs");
  fs.writeFileSync("scripts/scout-result.json", JSON.stringify({ scanId, timestamp: new Date().toISOString() }));
  console.log("Wrote scanId to scripts/scout-result.json");
}
