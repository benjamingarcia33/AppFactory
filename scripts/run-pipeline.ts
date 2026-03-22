// Run Scout + Architect pipeline and monitor for errors
const BASE = "http://localhost:3000";

async function streamSSE(url: string, label: string): Promise<Record<string, unknown>[]> {
  const events: Record<string, unknown>[] = [];
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[${label}] HTTP ${res.status}: ${await res.text()}`);
    return events;
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push(data);

          if (data.type === "progress") {
            const ts = new Date().toLocaleTimeString();
            console.log(`[${label}] ${ts} Step ${data.step}: ${data.status} - ${data.title || ""}`);
          } else if (data.type === "document") {
            const doc = data.document as { type: string; title: string; content?: string };
            const len = doc.content?.length || 0;
            console.log(`[${label}] Document: ${doc.type} - ${doc.title} (${len} chars)`);
          } else if (data.type === "complete") {
            console.log(`[${label}] COMPLETE - warnings: ${JSON.stringify((data as any).warnings?.length || 0)}`);
          } else if (data.type === "error") {
            console.error(`[${label}] ERROR: ${(data as any).message}`);
          } else if (data.type === "scan_complete" || data.type === "synthesis_complete") {
            console.log(`[${label}] ${data.type} - scanId: ${(data as any).scanId}`);
          } else if (data.type === "master_idea") {
            console.log(`[${label}] Master idea: ${(data as any).masterIdea?.name || "unnamed"}`);
          } else if (data.type === "stage") {
            console.log(`[${label}] Stage: ${(data as any).stage} - ${(data as any).message}`);
          } else if (data.type === "cancelled") {
            console.log(`[${label}] CANCELLED`);
          } else {
            console.log(`[${label}] Event: ${data.type}`);
          }
        } catch {
          // non-JSON line
        }
      }
    }
  }
  return events;
}

async function main() {
  const idea = "A looksmaxxing app that follows the same core idea as apps in that field, such as UMAX or PSL: facial analysis, improvement plans, ratings. Look at the competitors' features and let's build the same core idea but totally improving them in terms of features and functionality. The monetization plan will definitely be a paywall so don't mind any free feature.";

  // Step 1: Run Scout
  console.log("=== STARTING SCOUT ===");
  console.log(`Idea: ${idea.substring(0, 80)}...`);
  const startScout = Date.now();

  const scoutUrl = `${BASE}/api/scout/stream?mode=synthesis&store=google_play&ideaText=${encodeURIComponent(idea)}`;
  const scoutEvents = await streamSSE(scoutUrl, "SCOUT");

  const scoutTime = ((Date.now() - startScout) / 1000).toFixed(1);
  console.log(`\n=== SCOUT FINISHED in ${scoutTime}s (${scoutEvents.length} events) ===\n`);

  // Extract scanId from scout events
  const completeEvent = scoutEvents.find(e => e.type === "scan_complete" || e.type === "synthesis_complete");
  const scanId = (completeEvent as any)?.scanId;
  if (!scanId) {
    console.error("No scanId found! Scout events:", scoutEvents.map(e => e.type));
    return;
  }
  console.log(`Scan ID: ${scanId}`);

  // Step 2: Run Architect on the scan master idea
  console.log("\n=== STARTING ARCHITECT ===");
  const startArch = Date.now();

  const archUrl = `${BASE}/api/architect/stream?scanId=${scanId}`;
  const archEvents = await streamSSE(archUrl, "ARCH");

  const archTime = ((Date.now() - startArch) / 1000).toFixed(1);
  console.log(`\n=== ARCHITECT FINISHED in ${archTime}s (${archEvents.length} events) ===\n`);

  // Analyze results
  console.log("=== ANALYSIS ===");

  // Check for errors
  const errors = archEvents.filter(e => e.type === "error" || e.type === "step_failed");
  if (errors.length > 0) {
    console.error("ERRORS:", JSON.stringify(errors, null, 2));
  } else {
    console.log("No errors detected.");
  }

  // Check documents
  const docs = archEvents.filter(e => e.type === "document") as Array<{ document: { type: string; title: string; content: string } }>;
  console.log(`\nDocuments generated: ${docs.length}`);
  for (const d of docs) {
    const doc = (d as any).document;
    const content = doc.content || "";
    const lastChars = content.trim().slice(-5);
    const lastLine = content.trim().split("\n").pop() || "";
    const truncated = lastLine.length < 10 && !lastLine.match(/[.}`\-\]:!*)]$/);
    console.log(`  ${doc.type}: ${content.length} chars ${truncated ? "POSSIBLE TRUNCATION" : "OK"}`);
    if (doc.type.includes("execution_prompt")) {
      console.log(`    Last 150 chars: ...${content.slice(-150).replace(/\n/g, "\\n")}`);
    }
  }

  // Check for deprecated model names in ALL outputs
  const allContent = docs.map(d => (d as any).document.content || "").join(" ");
  console.log("\n--- Deprecated Model Check ---");
  const patterns: [string, RegExp][] = [
    ["GPT-4o (exact)", /\bGPT-4o\b/g],
    ["GPT-4.1 (exact)", /\bGPT-4\.1\b/g],
    ["gpt-4o (code)", /gpt-4o(?!-mini-transcribe)/g],
    ["gpt-4.1 (code)", /gpt-4\.1/g],
  ];
  for (const [name, regex] of patterns) {
    const matches = allContent.match(regex);
    if (matches) {
      console.log(`  WARNING: "${name}" found ${matches.length} times`);
    } else {
      console.log(`  OK: "${name}" not found`);
    }
  }

  // Check warnings from complete event
  const completeArch = archEvents.find(e => e.type === "complete") as any;
  if (completeArch?.warnings) {
    console.log(`\nPipeline warnings (${completeArch.warnings.length}):`);
    for (const w of completeArch.warnings) {
      console.log(`  [${w.severity}] ${w.category}/${w.document}: ${w.message}`);
    }
  }

  // Check 12-week plan in Step 4
  const completedSteps = archEvents.filter(e => e.type === "progress" && (e as any).status === "completed");
  const step4 = completedSteps.find(e => (e as any).step === 4) as any;
  if (step4?.content) {
    const weekBlocks = step4.content.match(/"weeks"\s*:\s*"/gi);
    console.log(`\nStep 4 twelve-week plan blocks: ${weekBlocks?.length || 0} ${(weekBlocks?.length || 0) >= 6 ? "OK" : "INSUFFICIENT (<6)"}`);
  }

  // Check age rating in Step 1
  const step1 = completedSteps.find(e => (e as any).step === 1) as any;
  if (step1?.content) {
    const hasAgeRating = step1.content.toLowerCase().includes("agerating") || step1.content.toLowerCase().includes("age_rating") || step1.content.includes("ageRating");
    console.log(`Step 1 has ageRating field: ${hasAgeRating ? "YES" : "NO"}`);
  }

  // Check steps 3+4 ran in parallel
  const step3Running = archEvents.findIndex(e => e.type === "progress" && (e as any).step === 3 && (e as any).status === "running");
  const step4Running = archEvents.findIndex(e => e.type === "progress" && (e as any).step === 4 && (e as any).status === "running");
  console.log(`\nSteps 3+4 parallel: Step 3 running at event #${step3Running}, Step 4 running at event #${step4Running}`);
  if (Math.abs(step3Running - step4Running) <= 1) {
    console.log("CONFIRMED: Steps 3 and 4 started together (parallel)");
  } else {
    console.log("WARNING: Steps 3 and 4 did NOT start together");
  }

  // Check CLAUDE.md for platform-appropriate packages
  const claudeMdDoc = docs.find(d => (d as any).document.type === "claude_md");
  if (claudeMdDoc) {
    const c = (claudeMdDoc as any).document.content;
    const isMobile = c.includes("Expo SDK") || c.includes("mobile-expo");
    if (isMobile) {
      console.log("\nCLAUDE.md platform check (mobile detected):");
      const badPackages = ["@sentry/nextjs", "posthog-js", "@supabase/ssr", "@clerk/nextjs"];
      for (const pkg of badPackages) {
        const found = c.includes(pkg);
        console.log(`  ${pkg}: ${found ? "FOUND (wrong for mobile!)" : "not found (correct)"}`);
      }
    } else {
      console.log("\nCLAUDE.md platform: web (no mobile-specific checks needed)");
    }
  }

  // EP2 truncation check (most critical)
  const ep2Doc = docs.find(d => (d as any).document.type === "execution_prompt_2");
  if (ep2Doc) {
    const ep2 = (ep2Doc as any).document.content;
    const sections = ep2.split(/^#{1,3}\s/m);
    console.log(`\nEP2 analysis: ${ep2.length} chars, ${sections.length} sections`);
    const lastSection = sections[sections.length - 1];
    const lastSectionTitle = lastSection.split("\n")[0].trim();
    console.log(`  Last section heading: "${lastSectionTitle}"`);
    console.log(`  Last 200 chars: ...${ep2.slice(-200).replace(/\n/g, "\\n")}`);
  }

  console.log(`\n=== TOTAL TIME: Scout ${scoutTime}s + Architect ${archTime}s = ${(parseFloat(scoutTime) + parseFloat(archTime)).toFixed(1)}s ===`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
