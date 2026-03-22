// Poll analysis status every 15 seconds until complete
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });
const analysisId = '6ce4df9e-e66e-4a59-a7f2-a4339c5f19d0';

async function check() {
  const [analysis] = await sql`SELECT status, completed_at FROM analyses WHERE id = ${analysisId}`;
  const steps = await sql`SELECT steps_json FROM analyses WHERE id = ${analysisId}`;
  const parsed = JSON.parse(steps[0].steps_json);

  const stepSummary = parsed.map(s => `${s.step}:${s.status}`).join(' | ');
  const docs = await sql`SELECT id, type FROM documents WHERE analysis_id = ${analysisId}`;
  const eps = await sql`SELECT id, prompt_number FROM execution_prompts WHERE analysis_id = ${analysisId}`;

  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] Status: ${analysis.status} | Steps: ${stepSummary} | Docs: ${docs.length} | EPs: ${eps.length}`);

  if (analysis.status === 'completed' || analysis.status === 'failed') {
    console.log('Pipeline finished with status:', analysis.status);
    if (docs.length > 0) {
      console.log('Documents:', docs.map(d => d.type).join(', '));
    }
    if (eps.length > 0) {
      console.log('Execution Prompts:', eps.map(e => `EP${e.prompt_number}`).join(', '));
    }
    await sql.end();
    process.exit(0);
  }
}

// Poll every 15 seconds
const interval = setInterval(async () => {
  try {
    await check();
  } catch (e) {
    console.error('Poll error:', e.message);
  }
}, 15000);

// Initial check
await check();

// Timeout after 20 minutes
setTimeout(async () => {
  clearInterval(interval);
  console.log('Polling timed out');
  await sql.end();
  process.exit(1);
}, 20 * 60 * 1000);
