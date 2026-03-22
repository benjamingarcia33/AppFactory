require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const analysisId = '091e804a-c7f7-426a-b8b7-dc2386a3e3c1';

(async () => {
  const analyses = await sql`SELECT * FROM analyses WHERE id = ${analysisId}`;
  if (analyses.length === 0) { console.log('Not found'); await sql.end(); return; }
  const analysis = analyses[0];
  console.log('=== ANALYSIS ===');
  console.log('Status:', analysis.status);
  console.log('Completed:', analysis.completed_at);

  const steps = JSON.parse(analysis.steps_json);
  console.log('\n=== STEPS ===');
  for (const step of steps) {
    console.log('Step ' + step.step + ': ' + step.title + ' | ' + step.status + ' | ' + (step.content || '').length + ' chars');
  }

  const docs = await sql`SELECT * FROM documents WHERE analysis_id = ${analysisId}`;
  console.log('\n=== DOCUMENTS (' + docs.length + ') ===');
  for (const doc of docs) {
    const filename = 'C:/AppFactory/qa-test/run2-' + doc.type.replace(/_/g, '-') + '.md';
    fs.writeFileSync(filename, doc.content);
    console.log(doc.type + ': ' + doc.title + ' | ' + doc.content.length + ' chars -> ' + filename);
  }

  const eps = await sql`SELECT * FROM execution_prompts WHERE analysis_id = ${analysisId} ORDER BY prompt_number`;
  console.log('\n=== EXECUTION PROMPTS (' + eps.length + ') ===');
  for (const ep of eps) {
    const slugs = ep.tech_slugs_json ? JSON.parse(ep.tech_slugs_json) : [];
    const filename = 'C:/AppFactory/qa-test/run2-ep-' + ep.prompt_number + '.md';
    fs.writeFileSync(filename, ep.content);
    console.log('EP' + ep.prompt_number + ': ' + ep.title + ' | ' + ep.content.length + ' chars | techs: ' + slugs.join(', ') + ' -> ' + filename);
  }

  await sql.end();
})();
