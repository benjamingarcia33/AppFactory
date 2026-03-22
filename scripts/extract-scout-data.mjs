// Extract all Scout output from DB for audit
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });
const { scanId } = JSON.parse(readFileSync('scripts/scout-result.json', 'utf-8'));

mkdirSync('scripts/qa-output', { recursive: true });

try {
  // 1. Get scan record
  const [scan] = await sql`SELECT * FROM scans WHERE id = ${scanId}`;
  if (!scan) { console.error('Scan not found!'); process.exit(1); }
  console.log('Scan status:', scan.status);
  console.log('Scan store:', scan.store);
  console.log('Scan mode:', scan.mode);

  writeFileSync('scripts/qa-output/scan-record.json', JSON.stringify(scan, null, 2));
  console.log('Wrote scan-record.json');

  // 2. Get master idea
  if (scan.master_idea_json) {
    const masterIdea = typeof scan.master_idea_json === 'string'
      ? JSON.parse(scan.master_idea_json)
      : scan.master_idea_json;
    writeFileSync('scripts/qa-output/master-idea.json', JSON.stringify(masterIdea, null, 2));
    console.log('Wrote master-idea.json');
  }

  // 3. Get blue ocean
  if (scan.blue_ocean_json) {
    const blueOcean = typeof scan.blue_ocean_json === 'string'
      ? JSON.parse(scan.blue_ocean_json)
      : scan.blue_ocean_json;
    writeFileSync('scripts/qa-output/blue-ocean.json', JSON.stringify(blueOcean, null, 2));
    console.log('Wrote blue-ocean.json');
  }

  // 4. Get gap analysis (from scan record, or fallback to first opportunity)
  let gapSource = scan.gap_analysis_json;
  if (!gapSource) {
    const [firstOpp] = await sql`
      SELECT gap_analysis_json FROM opportunities
      WHERE scan_id = ${scanId} AND gap_analysis_json IS NOT NULL
      LIMIT 1
    `;
    if (firstOpp) gapSource = firstOpp.gap_analysis_json;
  }
  if (gapSource) {
    const gap = typeof gapSource === 'string'
      ? JSON.parse(gapSource)
      : gapSource;
    writeFileSync('scripts/qa-output/gap-analysis.json', JSON.stringify(gap, null, 2));
    console.log('Wrote gap-analysis.json');
  }

  // 5. Get all opportunities ordered by composite score
  const opps = await sql`
    SELECT * FROM opportunities
    WHERE scan_id = ${scanId}
    ORDER BY composite_score DESC
  `;
  console.log(`Found ${opps.length} opportunities`);
  writeFileSync('scripts/qa-output/opportunities.json', JSON.stringify(opps, null, 2));
  console.log('Wrote opportunities.json');

  // Print summary
  console.log('\n=== OPPORTUNITY SUMMARY ===');
  for (const opp of opps) {
    console.log(`${opp.composite_score?.toFixed(1) ?? 'N/A'} | ${opp.title} | ${opp.score}★ | ${opp.ratings} ratings | dissatisfaction=${opp.dissatisfaction?.toFixed(1) ?? 'N/A'} | feasibility=${opp.feasibility?.toFixed(1) ?? 'N/A'}`);
  }

} catch(e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}
