/**
 * Run Scout synthesis + Architect pipeline for the Ascend looksmaxxing idea
 * Streams SSE events and logs progress
 */

const BASE_URL = "http://localhost:3000";

const IDEA_TEXT = `A looksmaxxing app where people analyze their faces to get results on how they look, same functionality as the app UMAX, copying basically the same format and of other competitors as well but looking to improve features add new ones and improve anything improvable. IMPORTANT MONETIZATION NOTE: Copy the same monetization model that successful competitors use (paywalls, subscriptions). If UMAX and other competitors charge users behind a paywall and it works for them, our app should do the same or improve the paywall experience — do NOT offer free access to core features unless proven competitors already do. Paywalls are a validated revenue model in this space.`;

async function streamSSE(url, label) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Starting ${label}...`);
  console.log(`URL: ${url}`);
  console.log(`${"=".repeat(60)}\n`);

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} failed: ${response.status} ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastScanId = null;
  let lastAnalysisId = null;
  let completedSuccessfully = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));

        // Log progress events
        if (event.type === "progress" || event.type === "stage") {
          const ts = new Date().toLocaleTimeString();
          console.log(`[${ts}] ${event.stage || event.type}: ${event.message || ""}`);
        } else if (event.type === "scan_created") {
          lastScanId = event.scanId;
          console.log(`[SCAN CREATED] ID: ${lastScanId}`);
        } else if (event.type === "analysis_created") {
          lastAnalysisId = event.analysisId;
          console.log(`[ANALYSIS CREATED] ID: ${lastAnalysisId}`);
        } else if (event.type === "complete" || event.type === "completed") {
          completedSuccessfully = true;
          lastScanId = event.scanId || lastScanId;
          lastAnalysisId = event.analysisId || lastAnalysisId;
          console.log(`\n[COMPLETE] ${label} finished successfully!`);
          if (event.scanId) console.log(`  Scan ID: ${event.scanId}`);
          if (event.analysisId) console.log(`  Analysis ID: ${event.analysisId}`);
        } else if (event.type === "error") {
          console.error(`[ERROR] ${event.message}`);
        } else if (event.type === "warning") {
          console.log(`[WARNING] ${event.message}`);
        } else if (event.type === "step_complete") {
          console.log(`[STEP ${event.step}] Complete: ${event.title || ""}`);
        } else if (event.type === "doc_complete") {
          console.log(`[DOC] ${event.docType}: ${event.title || "generated"}`);
        } else {
          // Log other event types briefly
          const ts = new Date().toLocaleTimeString();
          console.log(`[${ts}] ${event.type}: ${JSON.stringify(event).slice(0, 150)}`);
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  return { scanId: lastScanId, analysisId: lastAnalysisId, completed: completedSuccessfully };
}

async function main() {
  const startTime = Date.now();

  // Phase 1: Run Scout synthesis
  console.log("\n>>> PHASE 1: SCOUT SYNTHESIS PIPELINE <<<\n");
  const scoutUrl = `${BASE_URL}/api/scout/stream?store=google_play&mode=synthesis&ideaText=${encodeURIComponent(IDEA_TEXT)}`;

  const scoutResult = await streamSSE(scoutUrl, "Scout Synthesis");

  if (!scoutResult.scanId) {
    console.error("Scout did not return a scanId. Cannot proceed to Architect.");
    process.exit(1);
  }

  const scoutDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\nScout completed in ${scoutDuration} minutes. Scan ID: ${scoutResult.scanId}`);

  // Phase 2: Run Architect on the scan
  console.log("\n>>> PHASE 2: ARCHITECT PIPELINE <<<\n");
  const architectUrl = `${BASE_URL}/api/architect/stream?scanId=${scoutResult.scanId}`;

  const architectResult = await streamSSE(architectUrl, "Architect Pipeline");

  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PIPELINE COMPLETE`);
  console.log(`Total time: ${totalDuration} minutes`);
  console.log(`Scout scan ID: ${scoutResult.scanId}`);
  console.log(`Architect analysis ID: ${architectResult.analysisId || "N/A"}`);
  console.log(`${"=".repeat(60)}`);
}

main().catch(err => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
