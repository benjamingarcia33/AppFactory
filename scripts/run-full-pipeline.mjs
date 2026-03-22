#!/usr/bin/env node
/**
 * Full Pipeline Runner: Scout (synthesis) → Architect
 * Monitors SSE streams, logs all events, captures errors and timing.
 */

const BASE = "http://localhost:3000";
const IDEA_TEXT = "A looksmaxxing app that follows the same core idea as apps in that field, such as UMAX or PSL: facial analysis, improvement plans, ratings. Look at the competitors' features and let's build the same core idea but totally improving them in terms of features and functionality. The monetization plan will definitely be a paywall so don't mind any free feature.";

// ── Helpers ──────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString().slice(11, 19);
}

function log(prefix, msg) {
  console.log(`[${ts()}] [${prefix}] ${msg}`);
}

function logError(prefix, msg) {
  console.error(`[${ts()}] [${prefix}] ❌ ${msg}`);
}

/** Parse SSE text into individual events */
function parseSSE(chunk) {
  const events = [];
  const lines = chunk.split("\n");
  let currentData = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      currentData += line.slice(6);
    } else if (line === "" && currentData) {
      try {
        events.push(JSON.parse(currentData));
      } catch {
        // partial JSON, accumulate
      }
      currentData = "";
    }
  }
  return events;
}

/** Stream SSE endpoint, call onEvent for each parsed event */
async function streamSSE(url, label, onEvent, timeoutMs = 600000) {
  log(label, `Connecting to ${url}`);
  const controller = new AbortController();
  const timer = setTimeout(() => {
    logError(label, `Timeout after ${timeoutMs / 1000}s`);
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/event-stream" },
    });

    if (!res.ok) {
      logError(label, `HTTP ${res.status}: ${await res.text()}`);
      clearTimeout(timer);
      return null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = parseSSE(buffer);

      // Keep unparsed remainder
      const lastNewline = buffer.lastIndexOf("\n\n");
      if (lastNewline >= 0) {
        buffer = buffer.slice(lastNewline + 2);
      }

      for (const evt of events) {
        result = onEvent(evt) || result;
      }
    }

    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      logError(label, "Aborted (timeout)");
    } else {
      logError(label, `Stream error: ${err.message}`);
    }
    return null;
  }
}

// ── Scout Phase ──────────────────────────────────────────────────────────────

async function runScout() {
  console.log("\n" + "═".repeat(80));
  console.log("  PHASE 1: SCOUT (Synthesis Mode)");
  console.log("═".repeat(80));
  log("SCOUT", `Idea: "${IDEA_TEXT.slice(0, 80)}..."`);

  const url = `${BASE}/api/scout/stream?store=app_store&mode=synthesis&ideaText=${encodeURIComponent(IDEA_TEXT)}`;
  const startTime = Date.now();

  const stats = {
    scanId: null,
    appsFound: 0,
    opportunities: 0,
    blueOceans: 0,
    masterIdea: null,
    errors: [],
    warnings: [],
    stages: [],
  };

  const scanId = await streamSSE(url, "SCOUT", (evt) => {
    switch (evt.type) {
      case "scan_started":
        stats.scanId = evt.scanId;
        log("SCOUT", `✓ Scan started: ${evt.scanId}`);
        break;

      case "progress":
        log("SCOUT", `[${evt.progress || 0}%] ${evt.stage}: ${evt.message}`);
        if (!stats.stages.includes(evt.stage)) stats.stages.push(evt.stage);
        break;

      case "search_strategy":
        log("SCOUT", `🔍 Search strategy generated (${evt.queries?.length || 0} queries)`);
        break;

      case "app_found":
        stats.appsFound++;
        log("SCOUT", `📱 App found: ${evt.app?.title || "unknown"} (${evt.app?.score || "?"} ★)`);
        break;

      case "opportunity":
        stats.opportunities++;
        const opp = evt.opportunity || {};
        log("SCOUT", `💡 Opportunity: ${opp.title || "?"} | Feasibility: ${opp.feasibilityScore || "?"} | Gap: ${opp.gapScore || "?"}`);
        break;

      case "gap_analysis":
        log("SCOUT", `📊 Gap analysis received`);
        break;

      case "blue_ocean":
        stats.blueOceans++;
        log("SCOUT", `🌊 Blue Ocean: ${evt.title || evt.blueOcean?.title || "?"}`);
        break;

      case "master_idea":
        stats.masterIdea = evt.masterIdea || evt;
        log("SCOUT", `🎯 Master Idea: ${stats.masterIdea?.title || stats.masterIdea?.name || "generated"}`);
        break;

      case "complete":
        log("SCOUT", `✅ Complete! ${evt.totalOpportunities || 0} opportunities found`);
        break;

      case "error":
        stats.errors.push(evt.message || evt.error || "unknown error");
        logError("SCOUT", `${evt.message || evt.error}`);
        break;

      case "warning":
        stats.warnings.push(evt.message || "unknown warning");
        log("SCOUT", `⚠️  Warning: ${evt.message}`);
        break;

      default:
        log("SCOUT", `Event: ${evt.type} ${JSON.stringify(evt).slice(0, 200)}`);
    }

    return stats.scanId;
  }, 600000); // 10 min timeout

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "─".repeat(80));
  console.log("  SCOUT SUMMARY");
  console.log("─".repeat(80));
  console.log(`  Scan ID:       ${stats.scanId}`);
  console.log(`  Duration:      ${elapsed}s`);
  console.log(`  Apps found:    ${stats.appsFound}`);
  console.log(`  Opportunities: ${stats.opportunities}`);
  console.log(`  Blue Oceans:   ${stats.blueOceans}`);
  console.log(`  Master Idea:   ${stats.masterIdea ? "Yes" : "No"}`);
  console.log(`  Stages:        ${stats.stages.join(" → ")}`);
  console.log(`  Errors:        ${stats.errors.length > 0 ? stats.errors.join("; ") : "None"}`);
  console.log(`  Warnings:      ${stats.warnings.length > 0 ? stats.warnings.join("; ") : "None"}`);
  console.log("─".repeat(80));

  return { scanId: stats.scanId, stats };
}

// ── Architect Phase ──────────────────────────────────────────────────────────

async function runArchitect(scanId) {
  console.log("\n" + "═".repeat(80));
  console.log("  PHASE 2: ARCHITECT (from Master Idea)");
  console.log("═".repeat(80));
  log("ARCHITECT", `Using scan: ${scanId}`);

  const url = `${BASE}/api/architect/stream?scanId=${scanId}`;
  const startTime = Date.now();

  const stats = {
    analysisId: null,
    steps: [],
    documents: [],
    errors: [],
    warnings: [],
    stepFailures: [],
  };

  await streamSSE(url, "ARCHITECT", (evt) => {
    switch (evt.type) {
      case "analysis_started":
        stats.analysisId = evt.analysisId;
        log("ARCHITECT", `✓ Analysis started: ${evt.analysisId}`);
        break;

      case "progress":
        const stepInfo = evt.step ? `Step ${evt.step}` : "";
        const statusIcon = evt.status === "completed" ? "✅" : evt.status === "failed" ? "❌" : "⏳";
        log("ARCHITECT", `${statusIcon} ${stepInfo} ${evt.title || ""}: ${evt.status || ""}`);
        if (evt.step && !stats.steps.find(s => s.step === evt.step)) {
          stats.steps.push({ step: evt.step, title: evt.title, status: evt.status });
        } else if (evt.step) {
          const existing = stats.steps.find(s => s.step === evt.step);
          if (existing) existing.status = evt.status;
        }
        break;

      case "document":
        const doc = evt.document || evt;
        stats.documents.push({
          type: doc.type,
          title: doc.title,
          size: doc.content?.length || 0,
        });
        log("ARCHITECT", `📄 Document: ${doc.title || doc.type} (${((doc.content?.length || 0) / 1024).toFixed(1)} KB)`);
        break;

      case "step_failed":
        stats.stepFailures.push({ step: evt.step, error: evt.error || evt.message });
        logError("ARCHITECT", `Step ${evt.step} failed: ${evt.error || evt.message}`);
        break;

      case "complete":
        log("ARCHITECT", `✅ Complete! Analysis: ${evt.analysisId}`);
        if (evt.warnings?.length) {
          stats.warnings.push(...evt.warnings);
          evt.warnings.forEach(w => log("ARCHITECT", `⚠️  ${w}`));
        }
        break;

      case "error":
        stats.errors.push(evt.message || evt.error || "unknown error");
        logError("ARCHITECT", `${evt.message || evt.error}`);
        break;

      default:
        log("ARCHITECT", `Event: ${evt.type}`);
    }
  }, 2700000); // 45 min timeout

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "─".repeat(80));
  console.log("  ARCHITECT SUMMARY");
  console.log("─".repeat(80));
  console.log(`  Analysis ID:   ${stats.analysisId}`);
  console.log(`  Duration:      ${elapsed}s`);
  console.log(`  Steps:`);
  for (const s of stats.steps) {
    console.log(`    Step ${s.step}: ${s.title || "?"} → ${s.status}`);
  }
  console.log(`  Documents (${stats.documents.length}):`);
  for (const d of stats.documents) {
    console.log(`    - ${d.title || d.type} (${(d.size / 1024).toFixed(1)} KB)`);
  }
  console.log(`  Step Failures: ${stats.stepFailures.length > 0 ? stats.stepFailures.map(f => `Step ${f.step}: ${f.error}`).join("; ") : "None"}`);
  console.log(`  Errors:        ${stats.errors.length > 0 ? stats.errors.join("; ") : "None"}`);
  console.log(`  Warnings:      ${stats.warnings.length > 0 ? stats.warnings.join("; ") : "None"}`);
  console.log("─".repeat(80));

  return stats;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔" + "═".repeat(78) + "╗");
  console.log("║  APPFACTORY FULL PIPELINE: Scout → Architect                               ║");
  console.log("║  App: Apex (Looksmaxxing)                                                  ║");
  console.log("╚" + "═".repeat(78) + "╝");
  console.log(`Started: ${new Date().toISOString()}\n`);

  // Phase 1: Scout
  const { scanId, stats: scoutStats } = await runScout();

  if (!scanId) {
    logError("MAIN", "Scout failed — no scanId returned. Aborting.");
    process.exit(1);
  }

  if (scoutStats.errors.length > 0) {
    logError("MAIN", `Scout completed with ${scoutStats.errors.length} error(s). Proceeding to Architect anyway...`);
  }

  // Phase 2: Architect
  const architectStats = await runArchitect(scanId);

  // ── Final Report ───────────────────────────────────────────────────────────
  console.log("\n" + "╔" + "═".repeat(78) + "╗");
  console.log("║  FINAL PIPELINE REPORT                                                     ║");
  console.log("╚" + "═".repeat(78) + "╝");

  const totalErrors = scoutStats.errors.length + architectStats.errors.length;
  const totalWarnings = scoutStats.warnings.length + architectStats.warnings.length;

  console.log(`\n  Total Errors:   ${totalErrors}`);
  console.log(`  Total Warnings: ${totalWarnings}`);
  console.log(`  Scout:          ${scoutStats.errors.length === 0 ? "✅ OK" : `❌ ${scoutStats.errors.length} errors`}`);
  console.log(`  Architect:      ${architectStats.errors.length === 0 ? "✅ OK" : `❌ ${architectStats.errors.length} errors`}`);
  console.log(`  Documents:      ${architectStats.documents.length} generated`);
  console.log(`  Step Failures:  ${architectStats.stepFailures.length}`);

  if (totalErrors > 0 || architectStats.stepFailures.length > 0) {
    console.log("\n  ── ALL ERRORS ──");
    for (const e of scoutStats.errors) console.log(`    [SCOUT] ${e}`);
    for (const e of architectStats.errors) console.log(`    [ARCHITECT] ${e}`);
    for (const f of architectStats.stepFailures) console.log(`    [ARCHITECT STEP ${f.step}] ${f.error}`);
  }

  console.log(`\nFinished: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
