const fs = require('fs');
const raw = fs.readFileSync('C:/AppFactory/qa-test/scout-output.log', 'utf8');
const lines = raw.split('\n').filter(l => l.startsWith('data: '));

let complete = null, masterIdea = null, errors = [], opportunities = [], gapAnalysis = null, blueOcean = null;

for (const line of lines) {
  try {
    const e = JSON.parse(line.slice(6)); // remove "data: "
    if (e.type === 'complete') complete = e;
    if (e.type === 'master_idea') masterIdea = e.masterIdea;
    if (e.type === 'error') errors.push(e);
    if (e.type === 'opportunity') {
      const o = e.opportunity || e;
      opportunities.push(o);
    }
    if (e.type === 'gap_analysis') gapAnalysis = e.gapAnalysis || e.analysis || e;
    if (e.type === 'blue_ocean') blueOcean = e.blueOcean || e;
  } catch {}
}

console.log('=== COMPLETION ===');
console.log(JSON.stringify(complete, null, 2));
console.log('');

console.log('=== ERRORS ===');
console.log(errors.length ? JSON.stringify(errors, null, 2) : 'None');
console.log('');

console.log('=== OPPORTUNITIES (' + opportunities.length + ') ===');
for (const o of opportunities) {
  const keys = Object.keys(o);
  console.log('Keys in opportunity:', keys.join(', '));
  break; // just show structure once
}
console.log('');

for (const o of opportunities) {
  const title = o.title || o.appTitle || o.name || 'UNKNOWN';
  const score = o.compositeScore || o.composite_score || o.score || 0;
  const rating = o.appScore || o.rating || o.score || '?';
  const ratings = o.ratingsCount || o.ratings || o.reviewCount || '?';
  const dev = o.developer || '?';
  const appId = o.appId || o.id || '?';
  const marketSize = o.marketSize || o.market_size || '?';
  const dissatisfaction = o.dissatisfaction || '?';
  const feasibility = o.feasibility || '?';
  console.log(`${score} | ${title} | rating=${rating} | ratings=${ratings} | mkt=${marketSize} | dissat=${dissatisfaction} | feas=${feasibility} | dev=${dev} | id=${appId}`);
}

// Write master idea to separate file
if (masterIdea) {
  fs.writeFileSync('C:/AppFactory/qa-test/master-idea.json', JSON.stringify(masterIdea, null, 2));
  console.log('\n=== MASTER IDEA (written to qa-test/master-idea.json) ===');
  console.log('Name:', masterIdea.name || masterIdea.appName);
  console.log('Tagline:', masterIdea.tagline);
  if (masterIdea.coreFeatures) {
    console.log('Core Features (' + masterIdea.coreFeatures.length + '):');
    for (const f of masterIdea.coreFeatures) {
      console.log('  -', f.name || f.feature || f.title);
    }
  }
  if (masterIdea.competitorFlaws) {
    console.log('Competitor Flaws (' + masterIdea.competitorFlaws.length + '):');
    for (const f of masterIdea.competitorFlaws) {
      console.log('  -', f.flaw || f.description || f.name || JSON.stringify(f).substring(0, 100));
    }
  }
  if (masterIdea.uniqueValueProps) {
    console.log('Unique Value Props (' + masterIdea.uniqueValueProps.length + '):');
    for (const v of masterIdea.uniqueValueProps) {
      console.log('  -', typeof v === 'string' ? v : (v.prop || v.value || v.description || JSON.stringify(v).substring(0, 100)));
    }
  }
  if (masterIdea.feasibility) {
    console.log('Feasibility:', JSON.stringify(masterIdea.feasibility, null, 2));
  }
  if (masterIdea.marketViability) {
    console.log('Market Viability:', JSON.stringify(masterIdea.marketViability, null, 2));
  }
  if (masterIdea.aiRecommendation) {
    console.log('AI Recommendation:', JSON.stringify(masterIdea.aiRecommendation, null, 2));
  }
}

// Write gap analysis to separate file
if (gapAnalysis) {
  fs.writeFileSync('C:/AppFactory/qa-test/gap-analysis.json', JSON.stringify(gapAnalysis, null, 2));
  console.log('\n=== GAP ANALYSIS (written to qa-test/gap-analysis.json) ===');
  console.log(JSON.stringify(gapAnalysis, null, 2).substring(0, 2000));
}

if (blueOcean) {
  fs.writeFileSync('C:/AppFactory/qa-test/blue-ocean.json', JSON.stringify(blueOcean, null, 2));
  console.log('\n=== BLUE OCEAN (written to qa-test/blue-ocean.json) ===');
  console.log(JSON.stringify(blueOcean, null, 2).substring(0, 1000));
}
