// Full Scout synthesis pipeline test — captures SSE events + writes detailed analysis
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
let appsFound = [];
let opportunities = [];
let errors = [];
let masterIdea = null;
let blueOcean = null;
let gapAnalysis = null;
let searchStrategy = null;

try {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(600_000),
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
          searchStrategy = event.strategy || event;
          console.log(`[${elapsed}s] SEARCH STRATEGY:`);
          console.log(`  Queries (${searchStrategy.queries?.length}): ${JSON.stringify(searchStrategy.queries)}`);
          console.log(`  Categories: ${JSON.stringify(searchStrategy.categories)}`);
          if (searchStrategy.filters) {
            console.log(`  Filters: minInstalls=${searchStrategy.filters.minInstalls}, maxRating=${searchStrategy.filters.maxRating}, minRatings=${searchStrategy.filters.minRatings}`);
          }
          break;

        case "progress":
          console.log(`[${elapsed}s] PROGRESS [${event.progress || 0}%] ${event.stage}: ${event.message}`);
          break;

        case "idea_searching":
          console.log(`[${elapsed}s] SEARCHING query ${event.queryIndex + 1}/${event.totalQueries}: "${event.query}"`);
          break;

        case "app_found":
          appsFound.push(event.app);
          const a = event.app;
          console.log(`[${elapsed}s] APP FOUND #${appsFound.length}: ${a.title} (${a.id}) — ${a.installs || "N/A"} installs, ${a.score || "N/A"} rating`);
          break;

        case "processing_batch":
          console.log(`[${elapsed}s] PROCESSING BATCH ${event.batchIndex + 1}/${event.totalBatches} (${event.batchSize} apps)`);
          break;

        case "opportunity":
          opportunities.push(event.opportunity);
          const opp = event.opportunity;
          console.log(`[${elapsed}s] OPPORTUNITY #${opportunities.length}: ${opp?.appName || opp?.scrapedApp?.title} — feasibility=${opp?.feasibilityScore}`);
          break;

        case "gap_analysis":
          gapAnalysis = event.gapAnalysis || event;
          console.log(`[${elapsed}s] GAP ANALYSIS: ${gapAnalysis.ideaSummary?.slice(0, 150)}...`);
          break;

        case "blue_ocean":
          blueOcean = event;
          console.log(`[${elapsed}s] BLUE OCEAN: isBlueOcean=${event.isBlueOcean}, reason=${event.reason?.slice(0, 200)}`);
          break;

        case "master_idea":
          masterIdea = event.masterIdea || event;
          console.log(`[${elapsed}s] MASTER IDEA:`);
          console.log(`  Name: ${masterIdea.appName || masterIdea.name}`);
          console.log(`  Tagline: ${masterIdea.tagline}`);
          break;

        case "complete":
          console.log(`[${elapsed}s] COMPLETE — scanId=${event.scanId}, totalOpportunities=${event.totalOpportunities}`);
          break;

        case "error":
          errors.push(event);
          console.error(`[${elapsed}s] ERROR: ${event.message}`);
          if (event.stack) console.error(`  Stack: ${event.stack.slice(0, 300)}`);
          break;

        default:
          console.log(`[${elapsed}s] EVENT [${event.type}]: ${JSON.stringify(event).slice(0, 300)}`);
      }
    }
  }
} catch (err) {
  console.error(`[test] Connection error: ${err.message}`);
  errors.push({ message: err.message });
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

// ══════════════════════════════════════════════════════
// DETAILED ANALYSIS
// ══════════════════════════════════════════════════════
console.log(`\n${"═".repeat(80)}`);
console.log(`SCOUT SYNTHESIS PIPELINE — FULL ANALYSIS`);
console.log(`${"═".repeat(80)}`);

console.log(`\n📊 PIPELINE METRICS:`);
console.log(`  Total time:           ${totalTime}s`);
console.log(`  SSE events received:  ${eventsReceived}`);
console.log(`  Apps found (post-filter): ${appsFound.length}`);
console.log(`  Opportunities stored: ${opportunities.length}`);
console.log(`  Errors:               ${errors.length}`);
console.log(`  Scan ID:              ${scanId}`);

console.log(`\n🔍 SEARCH STRATEGY ANALYSIS:`);
if (searchStrategy) {
  console.log(`  Queries: ${searchStrategy.queries?.length}`);
  console.log(`  Categories: ${searchStrategy.categories?.length}`);
  if (searchStrategy.filters) {
    console.log(`  AI Filters: minInstalls=${searchStrategy.filters.minInstalls}, maxRating=${searchStrategy.filters.maxRating}, minRatings=${searchStrategy.filters.minRatings}`);
  }
}

console.log(`\n📱 APPS FOUND (${appsFound.length}):`);
for (const app of appsFound) {
  const isSkincare = /skin|derm|beauty|face|facial|cosmetic|glow|complexion|acne|routine/i.test(
    `${app.title} ${app.description || ""} ${app.genre || ""}`
  );
  console.log(`  ${isSkincare ? "✅" : "⚠️"} ${app.title} (${app.id})`);
  console.log(`     Genre: ${app.genre || "N/A"} | Installs: ${app.installs || "N/A"} | Rating: ${app.score || "N/A"}`);
  console.log(`     Skincare-relevant: ${isSkincare}`);
}

console.log(`\n🎯 OPPORTUNITIES (${opportunities.length}):`);
for (const opp of opportunities) {
  console.log(`  - ${opp.appName || opp.scrapedApp?.title} — feasibility=${opp.feasibilityScore}`);
}

if (gapAnalysis) {
  console.log(`\n📊 GAP ANALYSIS:`);
  console.log(`  Idea: ${gapAnalysis.ideaSummary?.slice(0, 200)}`);
  if (gapAnalysis.gaps) {
    for (const gap of gapAnalysis.gaps.slice(0, 5)) {
      console.log(`  Gap: ${gap.gap || gap.name} — severity=${gap.severity || gap.score}`);
    }
  }
}

if (blueOcean) {
  console.log(`\n🌊 BLUE OCEAN:`);
  console.log(`  ${JSON.stringify(blueOcean).slice(0, 500)}`);
}

if (masterIdea) {
  console.log(`\n💡 MASTER IDEA:`);
  console.log(`  Name: ${masterIdea.appName || masterIdea.name}`);
  console.log(`  Tagline: ${masterIdea.tagline}`);
  if (masterIdea.goNoGoVerdict) {
    console.log(`  Go/No-Go: ${masterIdea.goNoGoVerdict}`);
  }
  if (masterIdea.goNoGoFactors) {
    console.log(`  Factors:`);
    for (const f of masterIdea.goNoGoFactors) {
      console.log(`    ${f.assessment === "go" ? "✅" : f.assessment === "no-go" ? "❌" : "⚠️"} ${f.factor}: ${f.explanation?.slice(0, 120)}`);
    }
  }
  if (masterIdea.warnings) {
    console.log(`  Warnings:`);
    for (const w of masterIdea.warnings) {
      console.log(`    ⚠️ ${w.slice(0, 150)}`);
    }
  }
}

// ══════════════════════════════════════════════════════
// QUALITY CRITERIA CHECK
// ══════════════════════════════════════════════════════
console.log(`\n${"═".repeat(80)}`);
console.log(`QUALITY CRITERIA FOR ARCHITECT HANDOFF`);
console.log(`${"═".repeat(80)}`);

const criteria = [];

// C1: Pipeline completed without errors
criteria.push({
  name: "Pipeline completed without errors",
  pass: errors.length === 0,
  detail: errors.length === 0 ? "No errors" : `${errors.length} error(s): ${errors.map(e => e.message).join("; ")}`,
});

// C2: Opportunities found
criteria.push({
  name: "Opportunities found (>= 1)",
  pass: opportunities.length >= 1,
  detail: `${opportunities.length} opportunities`,
});

// C3: Apps are skincare-relevant
const skincareRelevantCount = appsFound.filter(app =>
  /skin|derm|beauty|face|facial|cosmetic|glow|complexion|acne|routine/i.test(
    `${app.title} ${app.description || ""} ${app.genre || ""}`
  )
).length;
criteria.push({
  name: "Apps are skincare-relevant (>= 50%)",
  pass: appsFound.length > 0 && (skincareRelevantCount / appsFound.length) >= 0.5,
  detail: `${skincareRelevantCount}/${appsFound.length} apps (${appsFound.length > 0 ? Math.round(skincareRelevantCount / appsFound.length * 100) : 0}%)`,
});

// C4: Master idea generated
criteria.push({
  name: "Master idea generated",
  pass: !!masterIdea,
  detail: masterIdea ? `"${masterIdea.appName || masterIdea.name}"` : "None",
});

// C5: Gap analysis present
criteria.push({
  name: "Gap analysis generated",
  pass: !!gapAnalysis,
  detail: gapAnalysis ? "Present" : "Missing",
});

// C6: Master idea has required fields for Architect
const requiredFields = ["appName", "name", "tagline", "goNoGoVerdict", "goNoGoFactors"];
const presentFields = requiredFields.filter(f => masterIdea && masterIdea[f]);
criteria.push({
  name: "Master idea has key fields for Architect",
  pass: presentFields.length >= 3,
  detail: `${presentFields.length}/${requiredFields.length} fields present: ${presentFields.join(", ")}`,
});

// C7: Enough data for meaningful analysis
criteria.push({
  name: "Enough apps for competitive analysis (>= 3)",
  pass: appsFound.length >= 3,
  detail: `${appsFound.length} apps`,
});

let allPass = true;
for (const c of criteria) {
  const icon = c.pass ? "✅" : "❌";
  console.log(`  ${icon} ${c.name}: ${c.detail}`);
  if (!c.pass) allPass = false;
}

console.log(`\n${"═".repeat(80)}`);
if (allPass) {
  console.log(`VERDICT: ✅ READY FOR ARCHITECT — all criteria met`);
} else {
  const failCount = criteria.filter(c => !c.pass).length;
  console.log(`VERDICT: ❌ NOT READY — ${failCount} criteria failed`);
}
console.log(`${"═".repeat(80)}`);

if (!allPass) process.exit(1);
