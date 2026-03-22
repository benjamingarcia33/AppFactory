import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });

try {
  // List recent analyses
  const rows = await sql`SELECT id, status, created_at, completed_at FROM analyses ORDER BY created_at DESC LIMIT 5`;
  console.log('Recent analyses:');
  for (const r of rows) {
    console.log(`  ${r.id} | ${r.status} | created=${r.created_at} | completed=${r.completed_at}`);
  }

  // Check the latest running or recent analysis
  const latest = rows[0];
  const analysisId = latest.id;
  console.log('\nChecking analysis:', analysisId);
  const [analysis] = await sql`SELECT id, status, steps_json, created_at, completed_at FROM analyses WHERE id = ${latest.id}`;
  if (analysis) {
    console.log('\nTarget analysis found:');
    console.log('Status:', analysis.status);
    console.log('Created:', analysis.created_at);
    console.log('Completed:', analysis.completed_at);
    if (analysis.steps_json) {
      const steps = JSON.parse(analysis.steps_json);
      for (const s of steps) {
        console.log(`  Step ${s.step} (${s.title}): ${s.status}, content=${s.content ? s.content.length + ' chars' : 'none'}`);
      }
    } else {
      console.log('No steps_json');
    }
  } else {
    console.log('\nTarget analysis NOT FOUND');
  }

  // Check documents
  const docs = await sql`SELECT type, title, length(content) as len FROM documents WHERE analysis_id = ${latest.id}`;
  console.log('\nDocuments:', docs.length);
  for (const d of docs) console.log(`  ${d.type}: ${d.title} (${d.len} chars)`);

  // Check EPs
  const eps = await sql`SELECT prompt_number, title, length(content) as len FROM execution_prompts WHERE analysis_id = ${latest.id} ORDER BY prompt_number`;
  console.log('\nExecution Prompts:', eps.length);
  for (const ep of eps) console.log(`  EP${ep.prompt_number}: ${ep.title} (${ep.len} chars)`);

} catch(e) {
  console.error('Error:', e.message);
  console.error(e.stack);
} finally {
  await sql.end();
}
