import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('scripts/qa-output/opportunities.json', 'utf8'));
data.forEach((o, i) => {
  let sent = null;
  if (o.sentiment_json) {
    sent = typeof o.sentiment_json === 'string' ? JSON.parse(o.sentiment_json) : o.sentiment_json;
  }
  const flaws = sent ? (sent.topFlaws || sent.pain_points || sent.flaws || []).slice(0, 3) : [];
  console.log(JSON.stringify({
    idx: i,
    title: o.title,
    store_id: o.store_id,
    sentimentAvailable: sent !== null,
    flawCount: flaws.length,
    topFlaws: flaws.map(f => typeof f === 'string' ? f.substring(0, 80) : JSON.stringify(f).substring(0, 80))
  }));
});
