import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

const analysisId = process.argv[2] || 'dc52b8f2-341a-442e-9b22-e54b15730472';

const [analysis] = await sql`SELECT id, status, completed_at FROM analyses WHERE id = ${analysisId}`;
if (!analysis) {
  console.log('Analysis not found:', analysisId);
  await sql.end();
  process.exit(1);
}
console.log('Analysis:', analysis.id, 'status:', analysis.status, 'completed:', analysis.completed_at);

const docs = await sql`SELECT type, title, length(content) as len FROM documents WHERE analysis_id = ${analysisId} ORDER BY type`;
console.log('Documents (' + docs.length + '):');
for (const d of docs) {
  console.log(' ', d.type, '|', d.title, '|', d.len, 'chars');
}

await sql.end();
