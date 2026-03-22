import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('scripts/qa-output/opportunities.json', 'utf8'));

console.log('=== FULL OPPORTUNITY AUDIT DATA ===\n');
console.log(`Total opportunities: ${data.length}\n`);

data.forEach((o, i) => {
  let sent = null;
  if (o.sentiment_json) {
    sent = typeof o.sentiment_json === 'string' ? JSON.parse(o.sentiment_json) : o.sentiment_json;
  }

  console.log(`--- App ${i+1}: ${o.title} ---`);
  console.log(`  Store ID: ${o.store_id}`);
  console.log(`  Genre: ${o.genre}`);
  console.log(`  Rating: ${o.score}`);
  console.log(`  Ratings count: ${o.ratings}`);
  console.log(`  Review count: ${o.review_count}`);
  console.log(`  Composite: ${o.composite_score}`);
  console.log(`  Market Size: ${o.market_size}`);
  console.log(`  Dissatisfaction: ${o.dissatisfaction}`);
  console.log(`  Feasibility: ${o.feasibility}`);
  console.log(`  Description: ${(o.description || '').substring(0, 200)}`);

  if (sent) {
    console.log(`  Sentiment: ${sent.overallSentiment}`);
    console.log(`  Pain Points: ${(sent.painPoints || []).length}`);
    (sent.painPoints || []).forEach(p => {
      console.log(`    - [${p.severity}/${p.frequency}] ${p.issue}`);
    });
    console.log(`  Feature Requests: ${(sent.featureRequests || []).length}`);
    console.log(`  Praised: ${(sent.praisedAspects || []).join('; ')}`);
  }
  console.log('');
});

// Score distribution analysis
console.log('=== SCORE DISTRIBUTIONS ===');
const marketSizes = data.map(o => o.market_size);
const dissatisfactions = data.map(o => o.dissatisfaction);
const feasibilities = data.map(o => o.feasibility);
const composites = data.map(o => o.composite_score);

console.log(`Market Size:     min=${Math.min(...marketSizes)}, max=${Math.max(...marketSizes)}, values=[${marketSizes.join(', ')}]`);
console.log(`Dissatisfaction: min=${Math.min(...dissatisfactions)}, max=${Math.max(...dissatisfactions)}, values=[${dissatisfactions.join(', ')}]`);
console.log(`Feasibility:     min=${Math.min(...feasibilities)}, max=${Math.max(...feasibilities)}, values=[${feasibilities.join(', ')}]`);
console.log(`Composite:       min=${Math.min(...composites)}, max=${Math.max(...composites)}, values=[${composites.join(', ')}]`);

// Unique values
console.log(`\nUnique Market Size values: ${[...new Set(marketSizes)].sort((a,b) => a-b).join(', ')}`);
console.log(`Unique Dissatisfaction values: ${[...new Set(dissatisfactions)].sort((a,b) => a-b).join(', ')}`);
console.log(`Unique Feasibility values: ${[...new Set(feasibilities)].sort((a,b) => a-b).join(', ')}`);
console.log(`Unique Composite values: ${[...new Set(composites)].sort((a,b) => a-b).join(', ')}`);
