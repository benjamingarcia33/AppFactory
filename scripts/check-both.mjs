import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });

try {
  // Check first analysis
  const id1 = '53865d6a-1898-4e6d-9bbf-ae1504773af8';
  const eps1 = await sql`SELECT prompt_number, title, length(content) as len FROM execution_prompts WHERE analysis_id = ${id1} ORDER BY prompt_number`;
  console.log(`Analysis 1 (53865d6a) EPs: ${eps1.length}`);
  for (const ep of eps1) console.log(`  EP${ep.prompt_number}: "${ep.title}" (${ep.len} chars)`);

  // Check second analysis
  const id2 = '63ec879f-b9a4-4aa1-814e-930e7cd10698';
  const [a2] = await sql`SELECT status FROM analyses WHERE id = ${id2}`;
  console.log(`\nAnalysis 2 (63ec879f) Status: ${a2?.status}`);
  const eps2 = await sql`SELECT prompt_number, title, length(content) as len FROM execution_prompts WHERE analysis_id = ${id2} ORDER BY prompt_number`;
  console.log(`Analysis 2 EPs: ${eps2.length}`);
  for (const ep of eps2) console.log(`  EP${ep.prompt_number}: "${ep.title}" (${ep.len} chars)`);
} catch(e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}
