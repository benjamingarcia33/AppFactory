import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 15 });

try {
  const result = await sql`SELECT 1 as ok`;
  console.log('DB connected:', JSON.stringify(result[0]));

  const techs = await sql`SELECT count(*) as cnt FROM technologies`;
  const patterns = await sql`SELECT count(*) as cnt FROM screen_patterns`;
  const synergies = await sql`SELECT count(*) as cnt FROM tech_synergies`;
  console.log('technologies:', techs[0].cnt);
  console.log('screenPatterns:', patterns[0].cnt);
  console.log('techSynergies:', synergies[0].cnt);
} catch(e) {
  console.error('Error:', e.message, e.code);
}
await sql.end();
