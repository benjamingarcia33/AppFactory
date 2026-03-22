import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('scripts/qa-output/opportunities.json', 'utf8'));

// Check first app's sentiment structure
const first = data[0];
if (first.sentiment_json) {
  const sent = typeof first.sentiment_json === 'string' ? JSON.parse(first.sentiment_json) : first.sentiment_json;
  console.log('Sentiment keys:', Object.keys(sent));
  console.log('First sentiment JSON (truncated):', JSON.stringify(sent).substring(0, 2000));
}
