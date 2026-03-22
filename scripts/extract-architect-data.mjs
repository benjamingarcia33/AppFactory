// Extract all Architect output from DB for audit
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });
const { analysisId } = JSON.parse(readFileSync('scripts/architect-result.json', 'utf-8'));

mkdirSync('scripts/qa-output/architect', { recursive: true });

try {
  // 1. Get analysis record
  const [analysis] = await sql`SELECT * FROM analyses WHERE id = ${analysisId}`;
  console.log('Analysis status:', analysis.status);
  console.log('Completed at:', analysis.completed_at);

  // 2. Extract steps
  const stepsJson = JSON.parse(analysis.steps_json);
  for (const step of stepsJson) {
    const filename = `scripts/qa-output/architect/step-${step.step}.json`;
    if (step.content) {
      try {
        const parsed = JSON.parse(step.content);
        writeFileSync(filename, JSON.stringify(parsed, null, 2));
      } catch {
        writeFileSync(filename, step.content);
      }
      console.log(`Step ${step.step} (${step.title}): ${step.status}, content=${step.content.length} chars`);
    } else {
      console.log(`Step ${step.step} (${step.title}): ${step.status}, NO content`);
    }
  }

  // 3. Get documents
  const docs = await sql`SELECT * FROM documents WHERE analysis_id = ${analysisId}`;
  console.log(`\nDocuments found: ${docs.length}`);
  for (const doc of docs) {
    const safeName = doc.type.replace(/[^a-z0-9_-]/g, '_');
    writeFileSync(`scripts/qa-output/architect/doc-${safeName}.md`, doc.content);
    console.log(`  ${doc.type}: "${doc.title}" (${doc.content.length} chars)`);
  }

  // 4. Get execution prompts
  const eps = await sql`SELECT * FROM execution_prompts WHERE analysis_id = ${analysisId} ORDER BY prompt_number`;
  console.log(`\nExecution Prompts found: ${eps.length}`);
  for (const ep of eps) {
    writeFileSync(`scripts/qa-output/architect/ep-${ep.prompt_number}.md`, ep.content);
    const techSlugs = JSON.parse(ep.tech_slugs_json || '[]');
    console.log(`  EP${ep.prompt_number}: "${ep.title}" (${ep.content.length} chars, ${techSlugs.length} tech slugs: ${techSlugs.join(', ')})`);
  }

  // 5. Summary
  console.log('\n=== EXTRACTION SUMMARY ===');
  console.log(`Steps: ${stepsJson.filter(s => s.status === 'completed').length}/5 completed`);
  console.log(`Documents: ${docs.length}`);
  console.log(`Execution Prompts: ${eps.length}`);
  console.log('Files written to scripts/qa-output/architect/');

} catch(e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}
