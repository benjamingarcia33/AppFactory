require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const analysisId = '3f9caf6e-097e-4e5a-b655-102ca5709656';

(async () => {
  // Get analysis record
  const analyses = await sql`SELECT * FROM analyses WHERE id = ${analysisId}`;
  if (analyses.length === 0) {
    console.log('Analysis not found!');
    await sql.end();
    return;
  }
  const analysis = analyses[0];
  console.log('=== ANALYSIS ===');
  console.log('Status:', analysis.status);
  console.log('Created:', analysis.created_at);
  console.log('Completed:', analysis.completed_at);

  // Parse steps
  if (analysis.steps_json) {
    const steps = JSON.parse(analysis.steps_json);
    console.log('\n=== STEPS ===');
    for (const step of steps) {
      const contentLen = step.content ? step.content.length : 0;
      console.log('Step ' + step.step + ': ' + step.title + ' | ' + step.status + ' | content=' + contentLen + ' chars');
    }
  }

  // Get documents
  const docs = await sql`SELECT * FROM documents WHERE analysis_id = ${analysisId}`;
  console.log('\n=== DOCUMENTS (' + docs.length + ') ===');
  for (const doc of docs) {
    console.log(doc.type + ': ' + doc.title + ' | ' + doc.content.length + ' chars');
    const filename = 'C:/AppFactory/qa-test/' + doc.type.replace(/_/g, '-') + '.md';
    fs.writeFileSync(filename, doc.content);
    console.log('  -> Written to ' + filename);
  }

  // Get execution prompts
  const eps = await sql`SELECT * FROM execution_prompts WHERE analysis_id = ${analysisId} ORDER BY prompt_number`;
  console.log('\n=== EXECUTION PROMPTS (' + eps.length + ') ===');
  for (const ep of eps) {
    const slugs = ep.tech_slugs_json ? JSON.parse(ep.tech_slugs_json) : [];
    console.log('EP' + ep.prompt_number + ': ' + ep.title + ' | ' + ep.content.length + ' chars | techs: ' + slugs.join(', '));
    const filename = 'C:/AppFactory/qa-test/ep-' + ep.prompt_number + '.md';
    fs.writeFileSync(filename, ep.content);
    console.log('  -> Written to ' + filename);
  }

  await sql.end();
})();
