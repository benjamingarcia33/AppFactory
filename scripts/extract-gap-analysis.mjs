import 'dotenv/config';
import postgres from 'postgres';
import { writeFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });
const scanId = '17bd6049-d15a-452e-9568-66baed301f8c';

try {
  const results = await sql`
    SELECT id, title, gap_analysis_json
    FROM opportunities
    WHERE scan_id = ${scanId} AND gap_analysis_json IS NOT NULL
    LIMIT 1
  `;
  if (results.length > 0 && results[0].gap_analysis_json) {
    const gap = JSON.parse(results[0].gap_analysis_json);
    writeFileSync('scripts/qa-output/gap-analysis.json', JSON.stringify(gap, null, 2));
    console.log('Gap analysis extracted from opportunity:', results[0].title);
    console.log('Idea summary:', gap.ideaSummary?.slice(0, 200));
    console.log('Competitor comparisons:', gap.competitorComparisons?.length || 0);
    console.log('Feature gaps:', gap.featureGaps?.length || 0);
    console.log('Unmet needs:', gap.unmetNeeds?.length || 0);
  } else {
    console.log('No gap analysis found in opportunities');
  }
} catch(e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}
