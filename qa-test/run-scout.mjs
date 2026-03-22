import fs from 'fs';

const ideaText = 'Cognitize — a speech coaching app that helps users improve their speaking by interrupting them, applying pressure questions, and simulating real conversational pressure';
const url = `http://localhost:3000/api/scout/stream?store=app_store&mode=synthesis&ideaText=${encodeURIComponent(ideaText)}`;

console.log('Starting Scout pipeline...');
console.log('Time:', new Date().toISOString());

const events = [];
let scanId = null;

try {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // keep incomplete chunk

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.substring(6));
        events.push(event);

        const ts = new Date().toISOString().substring(11, 19);

        if (event.type === 'scan_started') {
          scanId = event.scanId;
          console.log(`[${ts}] SCAN STARTED - scanId: ${scanId}`);
        } else if (event.type === 'step_started') {
          console.log(`[${ts}] STEP: ${event.step}`);
        } else if (event.type === 'step_completed') {
          console.log(`[${ts}] STEP DONE: ${event.step}`);
        } else if (event.type === 'error' || event.type === 'step_failed') {
          console.log(`[${ts}] ERROR: ${event.message || event.error}`);
        } else if (event.type === 'complete') {
          console.log(`[${ts}] COMPLETE - opportunities: ${event.totalOpportunities}`);
        } else if (event.type === 'app_found') {
          console.log(`[${ts}] APP: ${event.app?.title || event.appName || 'unknown'}`);
        } else if (event.type === 'progress') {
          console.log(`[${ts}] PROGRESS: ${event.message}`);
        } else {
          const summary = JSON.stringify(event).substring(0, 120);
          console.log(`[${ts}] ${event.type}: ${summary}`);
        }
      } catch {
        // partial data, skip
      }
    }
  }

  // Write all events to file
  fs.writeFileSync('qa-test/scout-events.json', JSON.stringify(events, null, 2));
  fs.writeFileSync('qa-test/scout-scanId.txt', scanId || 'NO_SCAN_ID');
  console.log(`\nDone! ${events.length} events saved to qa-test/scout-events.json`);
  console.log('Scan ID:', scanId);
} catch (e) {
  console.error('FETCH ERROR:', e.message);
  process.exit(1);
}
