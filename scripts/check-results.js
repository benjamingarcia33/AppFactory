require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const c = postgres(process.env.DATABASE_URL);

async function main() {
  const a = await c`SELECT id, status, created_at, completed_at FROM analyses ORDER BY created_at DESC LIMIT 3`;
  console.log('=== ANALYSES ===');
  for (const r of a) console.log(r.id.slice(0,8) + ' | ' + r.status + ' | ' + r.created_at);

  const latest = a[0];
  if (latest) {
    const docs = await c`SELECT type, title, length(content) as len FROM documents WHERE analysis_id = ${latest.id}`;
    console.log('\n=== DOCUMENTS (analysis ' + latest.id.slice(0,8) + ') ===');
    for (const d of docs) console.log('  ' + d.type + ' | ' + d.title + ' | ' + d.len + ' chars');

    const eps = await c`SELECT prompt_number, title, length(content) as len FROM execution_prompts WHERE analysis_id = ${latest.id}`;
    console.log('\n=== EXECUTION PROMPTS ===');
    for (const e of eps) console.log('  EP' + e.prompt_number + ' | ' + e.title + ' | ' + e.len + ' chars');

    const steps = await c`SELECT steps_json FROM analyses WHERE id = ${latest.id}`;
    const parsed = JSON.parse(steps[0].steps_json);
    console.log('\n=== STEPS ===');
    for (const s of parsed) console.log('  Step ' + s.step + ': ' + s.title + ' - ' + s.status + ' (' + (s.content ? s.content.length : 0) + ' chars)');
  }
  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
