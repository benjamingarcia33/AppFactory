require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const scanId = 'fceeb718-5c98-4761-b59a-4f7d7f1fc08b';

(async () => {
  const opps = await sql`SELECT * FROM opportunities WHERE scan_id = ${scanId} ORDER BY composite_score DESC`;
  console.log('=== OPPORTUNITIES (' + opps.length + ') ===\n');
  for (const o of opps) {
    console.log('---');
    console.log('Title:', o.title);
    console.log('AppId:', o.app_id, '| Store:', o.store, '| Genre:', o.genre);
    console.log('Score:', o.score, '| Ratings:', o.ratings, '| Installs:', o.installs);
    console.log('Composite:', o.composite_score, '| MarketSize:', o.market_size, '| Dissatisfaction:', o.dissatisfaction, '| Feasibility:', o.feasibility);
    console.log('Developer:', o.developer);
    console.log('URL:', o.url);
    console.log('Free:', o.free, '| Price:', o.price);

    if (o.sentiment_json) {
      try {
        const s = JSON.parse(o.sentiment_json);
        const painPoints = s.painPoints || s.pain_points || [];
        const featureReqs = s.featureRequests || s.feature_requests || [];
        const praised = s.praisedAspects || s.praised_aspects || [];
        console.log('Pain Points:', painPoints.length, '| Feature Requests:', featureReqs.length, '| Praised:', praised.length);
        if (painPoints.length > 0) {
          console.log('  Top Pain Points:');
          for (const pp of painPoints.slice(0, 3)) {
            console.log('    -', pp.issue || pp.pain_point || pp.description || JSON.stringify(pp).substring(0, 100));
          }
        }
        console.log('Summary:', (s.summary || s.overallSentiment || '').substring(0, 200));
      } catch (e) {
        console.log('Sentiment parse error:', e.message);
      }
    } else {
      console.log('No sentiment data');
    }
    console.log('');
  }
  await sql.end();
})();
