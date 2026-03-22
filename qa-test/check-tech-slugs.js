require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const step5 = JSON.parse(fs.readFileSync('C:/AppFactory/qa-test/step-5.json', 'utf8'));
const selectedSlugs = step5.selectedTechnologies.map(t => t.techSlug);

(async () => {
  const dbTechs = await sql`SELECT slug, name, category FROM technologies`;
  const dbSlugs = new Set(dbTechs.map(t => t.slug));

  console.log('=== SELECTED TECHS (' + selectedSlugs.length + ') ===\n');
  for (const slug of selectedSlugs) {
    const inDB = dbSlugs.has(slug);
    const dbEntry = dbTechs.find(t => t.slug === slug);
    if (inDB) {
      console.log('  OK  | ' + slug + ' (' + dbEntry.category + ': ' + dbEntry.name + ')');
    } else {
      console.log('  MISSING | ' + slug + ' — NOT in knowledge base');
    }
  }

  console.log('\n=== SCREEN PATTERNS ===\n');
  const dbScreens = await sql`SELECT slug, name, category FROM screen_patterns`;
  const dbScreenSlugs = new Set(dbScreens.map(s => s.slug));
  for (const screen of step5.appScreens) {
    const inDB = dbScreenSlugs.has(screen.patternSlug);
    if (inDB) {
      console.log('  OK  | ' + screen.screenName + ' -> ' + screen.patternSlug);
    } else {
      console.log('  MISSING | ' + screen.screenName + ' -> ' + screen.patternSlug + ' — NOT in screen patterns');
    }
  }

  await sql.end();
})();
