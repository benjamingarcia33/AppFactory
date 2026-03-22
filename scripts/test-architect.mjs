// Test Architect pipeline via SSE endpoint using the latest scan's master idea
const SCAN_ID = process.argv[2];

if (!SCAN_ID) {
  console.error("Usage: node scripts/test-architect.mjs <scanId>");
  process.exit(1);
}

const params = new URLSearchParams({ scanId: SCAN_ID });
const url = `http://localhost:3000/api/architect/stream?${params.toString()}`;
console.log(`[test] Connecting to Architect: ${url}\n`);

const startTime = Date.now();
let analysisId = null;
let eventsReceived = 0;
let errors = [];
let steps = {};
let documents = {};
let executionPrompts = {};
let currentStep = null;

try {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(2700_000), // 45 min timeout
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
        console.error(`[test] Parse error: ${raw.slice(0, 200)}`);
        continue;
      }

      eventsReceived++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      switch (event.type) {
        case "analysis_started":
          analysisId = event.analysisId;
          console.log(`[${elapsed}s] ANALYSIS STARTED — id=${analysisId}`);
          break;

        case "step_started":
          currentStep = event.step;
          console.log(`[${elapsed}s] STEP ${event.step} STARTED: ${event.title || ""}`);
          break;

        case "step_completed":
          const stepData = event.data || event.result;
          steps[event.step] = stepData;
          const dataPreview = JSON.stringify(stepData)?.slice(0, 200);
          console.log(`[${elapsed}s] STEP ${event.step} COMPLETED (${dataPreview}...)`);
          break;

        case "document_started":
          console.log(`[${elapsed}s] DOC STARTED: ${event.documentType || event.docType}`);
          break;

        case "document_completed":
          const docType = event.documentType || event.docType;
          documents[docType] = event;
          const docLen = (event.content || event.text || "").length;
          console.log(`[${elapsed}s] DOC COMPLETED: ${docType} (${docLen} chars)`);
          break;

        case "ep_started":
          console.log(`[${elapsed}s] EP STARTED: ${event.epNumber || event.ep}`);
          break;

        case "ep_completed":
          const epNum = event.epNumber || event.ep;
          executionPrompts[epNum] = event;
          const epLen = (event.content || event.text || "").length;
          console.log(`[${elapsed}s] EP COMPLETED: EP${epNum} (${epLen} chars)`);
          break;

        case "progress":
          console.log(`[${elapsed}s] PROGRESS [${event.progress || 0}%] ${event.stage || ""}: ${event.message || ""}`);
          break;

        case "complete":
          console.log(`[${elapsed}s] COMPLETE`);
          break;

        case "error":
          errors.push(event);
          console.error(`[${elapsed}s] ERROR: ${event.message}`);
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

console.log(`\n${"═".repeat(80)}`);
console.log(`ARCHITECT PIPELINE — FULL ANALYSIS`);
console.log(`${"═".repeat(80)}`);

console.log(`\n📊 PIPELINE METRICS:`);
console.log(`  Total time:       ${totalTime}s`);
console.log(`  Events received:  ${eventsReceived}`);
console.log(`  Analysis ID:      ${analysisId}`);
console.log(`  Steps completed:  ${Object.keys(steps).length}`);
console.log(`  Docs completed:   ${Object.keys(documents).length} — ${Object.keys(documents).join(", ") || "none"}`);
console.log(`  EPs completed:    ${Object.keys(executionPrompts).length} — ${Object.keys(executionPrompts).join(", ") || "none"}`);
console.log(`  Errors:           ${errors.length}`);

if (errors.length > 0) {
  console.log(`\n❌ ERRORS:`);
  for (const e of errors) console.log(`  - ${e.message}`);
}

// Document content analysis
console.log(`\n📄 DOCUMENT ANALYSIS:`);
for (const [docType, doc] of Object.entries(documents)) {
  const content = doc.content || doc.text || "";
  console.log(`  ${docType}:`);
  console.log(`    Length: ${content.length} chars`);
  console.log(`    Preview: ${content.slice(0, 150).replace(/\n/g, " ")}...`);
}

console.log(`\n📋 EXECUTION PROMPTS:`);
for (const [ep, data] of Object.entries(executionPrompts)) {
  const content = data.content || data.text || "";
  console.log(`  EP${ep}:`);
  console.log(`    Length: ${content.length} chars`);
  console.log(`    Preview: ${content.slice(0, 150).replace(/\n/g, " ")}...`);
  // Check for code blocks (should be absent per QA fix A1)
  const codeBlocks = (content.match(/```/g) || []).length;
  console.log(`    Code blocks: ${codeBlocks} (should be 0)`);
}

// Quality criteria
console.log(`\n${"═".repeat(80)}`);
console.log(`QUALITY CRITERIA`);
console.log(`${"═".repeat(80)}`);

const criteria = [];

criteria.push({
  name: "Pipeline completed without errors",
  pass: errors.length === 0,
  detail: errors.length === 0 ? "No errors" : `${errors.length} error(s)`,
});

criteria.push({
  name: "All 5 analysis steps completed",
  pass: Object.keys(steps).length >= 5,
  detail: `${Object.keys(steps).length}/5 steps`,
});

// Check documents: PRD A, PRD B, VS A, VS B, TechArch
const expectedDocs = ["prd_a", "prd_b", "vs_a", "vs_b", "tech_arch"];
const docKeys = Object.keys(documents).map(k => k.toLowerCase());
const docsFound = expectedDocs.filter(d => docKeys.some(k => k.includes(d.replace("_", "")) || k.includes(d)));
criteria.push({
  name: "All 5 documents generated (PRD A/B, VS A/B, TechArch)",
  pass: Object.keys(documents).length >= 5,
  detail: `${Object.keys(documents).length} docs: ${Object.keys(documents).join(", ")}`,
});

criteria.push({
  name: "All 3 Execution Prompts generated",
  pass: Object.keys(executionPrompts).length >= 3,
  detail: `${Object.keys(executionPrompts).length} EPs`,
});

// Check EP code blocks (should be 0)
let totalCodeBlocks = 0;
for (const [ep, data] of Object.entries(executionPrompts)) {
  const content = data.content || data.text || "";
  totalCodeBlocks += (content.match(/```/g) || []).length;
}
criteria.push({
  name: "No code blocks in EPs (QA fix A1)",
  pass: totalCodeBlocks === 0,
  detail: `${totalCodeBlocks} code blocks found`,
});

// Check document lengths (minimum content)
const minDocLength = 2000; // chars
let shortDocs = [];
for (const [docType, doc] of Object.entries(documents)) {
  const content = doc.content || doc.text || "";
  if (content.length < minDocLength) shortDocs.push(`${docType}(${content.length})`);
}
criteria.push({
  name: `Documents have substantial content (>= ${minDocLength} chars)`,
  pass: shortDocs.length === 0,
  detail: shortDocs.length === 0 ? "All docs sufficient" : `Short: ${shortDocs.join(", ")}`,
});

let allPass = true;
for (const c of criteria) {
  const icon = c.pass ? "✅" : "❌";
  console.log(`  ${icon} ${c.name}: ${c.detail}`);
  if (!c.pass) allPass = false;
}

console.log(`\n${"═".repeat(80)}`);
if (allPass) {
  console.log(`VERDICT: ✅ ALL CRITERIA MET — Ready for testing outside platform`);
} else {
  const failCount = criteria.filter(c => !c.pass).length;
  console.log(`VERDICT: ❌ ${failCount} criteria failed`);
}
console.log(`${"═".repeat(80)}`);

if (!allPass) process.exit(1);
