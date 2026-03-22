require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
// Use the first analysis which has all 5 steps completed
const analysisId = '3f9caf6e-097e-4e5a-b655-102ca5709656';

(async () => {
  const analyses = await sql`SELECT steps_json FROM analyses WHERE id = ${analysisId}`;
  if (analyses.length === 0) { console.log('Not found'); await sql.end(); return; }

  const steps = JSON.parse(analyses[0].steps_json);
  for (const step of steps) {
    const filename = `C:/AppFactory/qa-test/step-${step.step}.json`;
    fs.writeFileSync(filename, step.content || '{}');
    console.log(`Step ${step.step}: ${step.title} | ${step.status} | ${(step.content || '').length} chars -> ${filename}`);
  }
  await sql.end();
})();
