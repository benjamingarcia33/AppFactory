// Test Scout synthesis pipeline on App Store — captures SSE events
const ideaText = `A women's app that does facial analysis, skin care routine, product analysis and catalogue. Similar to Lovi Skincare, Lumi Skin, SkinSort, OnSkin and other skincare/dermatology apps.`;

const params = new URLSearchParams({
  store: "app_store",
  mode: "synthesis",
  ideaText,
  advancedFilters: "false",
});

const url = `http://localhost:3000/api/scout/stream?${params.toString()}`;
console.log(`[test] Connecting to: ${url}\n`);

const startTime = Date.now();
let scanId = null;
let eventsReceived = 0;
let appsFound = [];
let opportunities = [];
let errors = [];
let masterIdea = null;
let blueOcean = null;
let gapAnalysis = null;
let searchStrategy = null;

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(600_000) });
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
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      switch (event.type) {
        case "scan_started":
          scanId = event.scanId;
          console.log(`[${elapsed}s] SCAN STARTED — id=${scanId}`);
          break;
        case "search_strategy":
          searchStrategy = event.strategy || event;
          console.log(`[${elapsed}s] SEARCH STRATEGY: ${searchStrategy.queries?.length} queries, ${searchStrategy.categories?.length} categories`);
          break;
        case "progress":
          console.log(`[${elapsed}s] PROGRESS [${event.progress || 0}%] ${event.stage}: ${event.message}`);
          break;
        case "idea_searching":
          console.log(`[${elapsed}s] SEARCHING ${event.queryIndex + 1}/${event.totalQueries}: "${event.query}"`);
          break;
        case "app_found":
          appsFound.push(event.app);
          const a = event.app;
          console.log(`[${elapsed}s] APP #${appsFound.length}: ${a.title} (${a.id}) — ${a.ratings || 0} ratings, ${a.score || "N/A"} rating`);
          break;
        case "opportunity":
          opportunities.push(event.opportunity);
          console.log(`[${elapsed}s] OPPORTUNITY #${opportunities.length}: ${event.opportunity?.scrapedApp?.title || "?"}`);
          break;
        case "gap_analysis":
          gapAnalysis = event.gapAnalysis || event;
          console.log(`[${elapsed}s] GAP ANALYSIS received`);
          break;
        case "blue_ocean":
          blueOcean = event;
          console.log(`[${elapsed}s] BLUE OCEAN: ${JSON.stringify(event).slice(0, 300)}`);
          break;
        case "master_idea":
          masterIdea = event.masterIdea || event;
          console.log(`[${elapsed}s] MASTER IDEA: "${masterIdea.name}" — ${masterIdea.tagline}`);
          break;
        case "complete":
          console.log(`[${elapsed}s] COMPLETE — totalOpportunities=${event.totalOpportunities}`);
          break;
        case "error":
          errors.push(event);
          console.error(`[${elapsed}s] ERROR: ${event.message}`);
          break;
        default:
          console.log(`[${elapsed}s] [${event.type}]`);
      }
    }
  }
} catch (err) {
  console.error(`[test] Connection error: ${err.message}`);
  errors.push({ message: err.message });
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\n${"═".repeat(80)}`);
console.log(`APP STORE SCOUT RESULTS`);
console.log(`${"═".repeat(80)}`);
console.log(`Time: ${totalTime}s | Events: ${eventsReceived} | Errors: ${errors.length}`);
console.log(`Apps found: ${appsFound.length} | Opportunities: ${opportunities.length}`);
console.log(`Scan ID: ${scanId}`);
console.log(`Master idea: ${masterIdea ? `"${masterIdea.name}" — ${masterIdea.tagline}` : "NONE"}`);
console.log(`Gap analysis: ${gapAnalysis ? "YES" : "NO"}`);
console.log(`Blue ocean: ${blueOcean ? "YES" : "NO"}`);

// Skincare relevance check
const skincareApps = appsFound.filter(a =>
  /skin|derm|beauty|face|facial|cosmetic|glow|complexion|acne|routine/i.test(`${a.title} ${a.description || ""} ${a.genre || ""}`)
);
console.log(`Skincare-relevant apps: ${skincareApps.length}/${appsFound.length} (${appsFound.length > 0 ? Math.round(skincareApps.length / appsFound.length * 100) : 0}%)`);

if (errors.length > 0) {
  console.log(`\nERRORS:`);
  for (const e of errors) console.log(`  - ${e.message}`);
}

// Print scan ID for Architect test
if (scanId && opportunities.length > 0) {
  console.log(`\n--- Use this scan ID for Architect test ---`);
  console.log(`node scripts/test-architect-appstore.mjs "${scanId}"`);
}

if (errors.length > 0 || opportunities.length === 0) process.exit(1);
