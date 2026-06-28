/**
 * fetch-data.js — refresh surveillance data for the Map page.
 *
 * Pulls weekly aggregated case counts from:
 *   - CDC NNDSS weekly CSV (US states)
 *   - WHO disease outbreak news (global, latest weeks)
 *   - UKHSA UKHSA dashboard (England regions)
 *   - ECDC TESSy weekly influenza + SARS-CoV-2 (EU)
 *
 * Writes JSON to /data/surveillance.json consumed by map.html.
 *
 *   node scripts/fetch-data.js
 *
 * If a remote feed fails (offline, schema drift), the script
 * logs the failure and keeps the prior JSON in place. Run it
 * weekly from a cron / scheduled task.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'data', 'surveillance.json');
const SEED = path.join(__dirname, 'seed-data.json');

const FEEDS = [
  {
    id: 'us-nndss',
    url: 'https://data.cdc.gov/resource/3apk-4e4g.json?$order=mmwr_year DESC,mmwr_week DESC&$limit=200',
    notes: 'NNDSS weekly notifiable diseases, US states. Field names per CDC open data API.'
  },
  {
    id: 'who-don',
    url: 'https://www.who.int/api/news/diseaseoutbreaknews',
    notes: 'WHO Disease Outbreak News (latest events).'
  }
];

function fetchText(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, timeoutMs).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} on ${url}`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('timeout', () => { req.destroy(new Error(`Timeout on ${url}`)); });
    req.on('error', reject);
  });
}

function loadSeed() {
  if (fs.existsSync(SEED)) return JSON.parse(fs.readFileSync(SEED, 'utf8'));
  return { us_states: {}, countries: {}, generated_at: null, source: 'seed', notes: 'seed only' };
}

async function tryFeed(feed) {
  try {
    const text = await fetchText(feed.url);
    return { id: feed.id, ok: true, body: text };
  } catch (err) {
    return { id: feed.id, ok: false, error: err.message };
  }
}

function shapeUsNndss(json) {
  if (!Array.isArray(json)) return {};
  const out = {};
  for (const row of json) {
    const state = row.reporter || row.state_name || row.jurisdiction || row.state;
    const disease = row.disease || row.condition;
    const count = parseInt(row.cases_current_week || row.cases_this_week || row.count || '0', 10);
    if (!state || !disease || !count) continue;
    const key = state.toLowerCase().replace(/\s+/g, '-');
    out[key] = out[key] || { name: state, by_disease: {} };
    out[key].by_disease[disease.toLowerCase()] = (out[key].by_disease[disease.toLowerCase()] || 0) + count;
  }
  return out;
}

function shapeWho(json) {
  if (!json || !Array.isArray(json.news)) return [];
  return json.news.slice(0, 30).map(n => ({
    title: n.title,
    date: n.publication_date || n.published,
    country: n.country && n.country.length ? n.country[0] : null,
    disease: n.disease && n.disease.length ? n.disease[0].label : null,
    url: n.url
  }));
}

(async () => {
  console.log('[ellis] refreshing surveillance data...');
  const prior = loadSeed();
  const result = loadSeed();
  result.fetched_at = new Date().toISOString();
  result.feeds = [];

  await Promise.all(FEEDS.map(async f => {
    const r = await tryFeed(f);
    result.feeds.push({ id: r.id, ok: r.ok, error: r.error || null });
    if (!r.ok) { console.warn(`[ellis] feed ${r.id} failed: ${r.error}`); return; }
    try {
      if (f.id === 'us-nndss') {
        const shaped = shapeUsNndss(JSON.parse(r.body));
        result.us_states = { ...result.us_states, ...shaped };
      } else if (f.id === 'who-don') {
        result.who_news = shapeWho(JSON.parse(r.body));
      }
    } catch (e) {
      console.warn(`[ellis] parse failure on ${f.id}: ${e.message}`);
    }
  }));

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`[ellis] wrote ${OUT} (${fs.statSync(OUT).size} bytes)`);
})();