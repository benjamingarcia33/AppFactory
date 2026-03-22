// Test Scout synthesis pipeline via SSE endpoint
const ideaText = `A women's app that does facial analysis, skin care routine, product analysis and catalogue. Similar to Lovi Skincare, Lumi Skin, SkinSort, OnSkin and other skincare/dermatology apps.`;

const params = new URLSearchParams({
  store: "google_play",
  mode: "synthesis",
  ideaText,
  advancedFilters: "false",
});

const url = `http://localhost:3000/api/scout/stream?${params.toString()}`;
console.log(`[test] Connecting to: ${url}\n`);

const startTime = Date.now();
let scanId = null;
let eventsReceived = 0;
let appsFound = 0;
let opportunitiesStored = 0;
let errors = [];
let masterIdea = null;
let blueOcean = null;
let gapAnalysis = null;
let lastProgress = null;

try {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(600_000), // 10 min timeout
  });

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
      try {
        event = JSON.parse(raw);
      } catch {
        console.error(`[test] Failed to parse: ${raw.slice(0, 200)}`);
        continue;
      }

      eventsReceived++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      switch (event.type) {
        case "scan_started":
          scanId = event.scanId;
          console.log(`[${elapsed}s] SCAN STARTED — id=${scanId}`);
          break;

        case "search_strategy":
          console.log(`[${elapsed}s] SEARCH STRATEGY:`);
          console.log(`  Queries: ${JSON.stringify(event.strategy?.queries || event.queries)}`);
          console.log(`  Categories: ${JSON.stringify(event.strategy?.categories || event.categories)}`);
          break;

        case "progress":
          lastProgress = event;
          console.log(`[${elapsed}s] PROGRESS [${event.progress || 0}%] ${event.stage}: ${event.message}`);
          break;

        case "idea_searching":
          console.log(`[${elapsed}s] SEARCHING query ${event.queryIndex + 1}/${event.totalQueries}: "${event.query}"`);
          break;

        case "app_found":
          appsFound++;
          const a = event.app;
          console.log(`[${elapsed}s] APP FOUND #${appsFound}: ${a.title} (${a.id}) — ${a.installs || "N/A"} installs, ${a.score || "N/A"} rating`);
          break;

        case "processing_batch":
          console.log(`[${elapsed}s] PROCESSING BATCH ${event.batchIndex + 1}/${event.totalBatches} (${event.batchSize} apps)`);
          break;

        case "opportunity_stored":
          opportunitiesStored++;
          console.log(`[${elapsed}s] OPPORTUNITY #${opportunitiesStored}: ${event.opportunity?.appName || event.appName} — feasibility=${event.opportunity?.feasibilityScore || event.feasibilityScore}`);
          break;

        case "gap_analysis":
          gapAnalysis = event;
          console.log(`[${elapsed}s] GAP ANALYSIS received (${JSON.stringify(event).slice(0, 300)}...)`);
          break;

        case "blue_ocean":
          blueOcean = event;
          console.log(`[${elapsed}s] BLUE OCEAN: ${JSON.stringify(event).slice(0, 500)}`);
          break;

        case "master_idea":
          masterIdea = event.masterIdea || event;
          console.log(`[${elapsed}s] MASTER IDEA received`);
          console.log(`  Name: ${masterIdea.appName || masterIdea.name || "N/A"}`);
          console.log(`  Tagline: ${masterIdea.tagline || "N/A"}`);
          break;

        case "complete":
          console.log(`[${elapsed}s] COMPLETE — scanId=${event.scanId}`);
          break;

        case "error":
          errors.push(event);
          console.error(`[${elapsed}s] ERROR: ${event.message}`);
          break;

        case "cancelled":
          console.log(`[${elapsed}s] CANCELLED`);
          break;

        default:
          console.log(`[${elapsed}s] EVENT [${event.type}]: ${JSON.stringify(event).slice(0, 200)}`);
      }
    }
  }
} catch (err) {
  console.error(`[test] Connection error: ${err.message}`);
  errors.push({ message: err.message });
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\n${"=".repeat(80)}`);
console.log(`SCOUT SYNTHESIS PIPELINE RESULTS`);
console.log(`${"=".repeat(80)}`);
console.log(`Total time:          ${totalTime}s`);
console.log(`Events received:     ${eventsReceived}`);
console.log(`Apps found:          ${appsFound}`);
console.log(`Opportunities stored: ${opportunitiesStored}`);
console.log(`Errors:              ${errors.length}`);
console.log(`Scan ID:             ${scanId}`);
console.log(`Blue ocean:          ${blueOcean ? "yes" : "no"}`);
console.log(`Gap analysis:        ${gapAnalysis ? "yes" : "no"}`);
console.log(`Master idea:         ${masterIdea ? "yes" : "no"}`);

if (errors.length > 0) {
  console.log(`\nERRORS:`);
  for (const e of errors) console.log(`  - ${e.message}`);
}

if (masterIdea) {
  console.log(`\nMASTER IDEA DETAILS:`);
  console.log(JSON.stringify(masterIdea, null, 2));
}

// Verdict
console.log(`\n${"=".repeat(80)}`);
if (errors.length > 0) {
  console.log(`VERDICT: FAILED — ${errors.length} error(s)`);
  process.exit(1);
} else if (opportunitiesStored === 0) {
  console.log(`VERDICT: WARNING — 0 opportunities stored (the bug may still exist)`);
  process.exit(1);
} else {
  console.log(`VERDICT: PASSED — ${opportunitiesStored} opportunities, ${appsFound} apps found`);
}
