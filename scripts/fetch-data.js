/**
 * fetch-data.js — refresh surveillance map with REAL data.
 *
 * Sources:
 *   - CDC NSSP Emergency Department Visit Trajectories by State
 *     (COVID-19, Influenza, RSV percent of ED visits)
 *   - WHO Disease Outbreak News (latest global events)
 *
 *   node scripts/fetch-data.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'data', 'surveillance.json');

// --- HTTP helper ---
function fetch(url, timeoutMs) {
  timeoutMs = timeoutMs || 20000;
  return new Promise(function(resolve, reject) {
    var req = https.get(url, { timeout: timeoutMs }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, timeoutMs).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      var body = '';
      res.setEncoding('utf8');
      res.on('data', function(c) { body += c; });
      res.on('end', function() { resolve(body); });
    });
    req.on('timeout', function() { req.destroy(new Error('Timeout')); });
    req.on('error', reject);
  });
}

// --- Real US population (2024 Census estimates) ---
var STATE_POP = {
  "alabama":5108468,"alaska":736081,"arizona":7431344,"arkansas":3067755,
  "california":38929342,"colorado":5861758,"connecticut":3626205,"delaware":1031890,
  "district-of-columbia":678972,"florida":22984993,"georgia":11029227,"hawaii":1435138,
  "idaho":1973751,"illinois":12510561,"indiana":6861195,"iowa":3200517,
  "kansas":2940586,"kentucky":4526154,"louisiana":4574536,"maine":1395722,
  "maryland":6185278,"massachusetts":7001399,"michigan":10037391,"minnesota":5751563,
  "mississippi":2939291,"missouri":6195966,"montana":1132812,"nebraska":1983485,
  "nevada":3194176,"new-hampshire":1401954,"new-jersey":9290449,"new-mexico":2114344,
  "new-york":19571216,"north-carolina":10834771,"north-dakota":783926,"ohio":11785935,
  "oklahoma":4053824,"oregon":4246155,"pennsylvania":12961683,"rhode-island":1095962,
  "south-carolina":5373555,"south-dakota":919501,"tennessee":7126489,"texas":30503301,
  "utah":3423592,"vermont":647818,"virginia":8715698,"washington":7812880,
  "west-virginia":1770070,"wisconsin":5898473,"wyoming":584057
};

var COUNTRY_POP = {
  "084":335900000,"124":40100000,"484":129000000,"076":216000000,"032":46000000,
  "826":67700000,"276":84400000,"250":68000000,"724":47500000,"380":58900000,
  "643":144000000,"156":1412000000,"392":124000000,"410":51700000,"356":1451000000,
  "586":245000000,"364":88500000,"792":86000000,"818":112000000,"710":61000000,
  "404":55000000,"566":229000000,"036":26600000,"554":5200000
};

function stateKey(name) {
  if (!name) return null;
  return name.toLowerCase().replace(/[\.\s]+/g, '-');
}

function dateToMMWRWeek(dateStr) {
  var d = new Date(dateStr);
  var jan1 = new Date(d.getFullYear(), 0, 1);
  var days = Math.floor((d - jan1) / 86400000);
  return Math.min(Math.floor(days / 7) + 1, 54);
}

function round1(v) { return Math.round(v * 10) / 10; }

// --- Build state name lookup ---
var stateNameToKey = {};
Object.keys(STATE_POP).forEach(function(k) {
  var name = k.split('-').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
  stateNameToKey[name] = k;
  stateNameToKey[k] = k;
});

// --- Fetch CDC NSSP ED data ---
async function fetchCDCNSSP() {
  console.log('[ellis] fetching CDC NSSP ED visit trajectories...');
  var body = await fetch('https://data.cdc.gov/api/views/7mra-9cq9/rows.json?$limit=30000');
  var json = JSON.parse(body);

  var cols = json.meta.view.columns;
  var idx = {};
  cols.forEach(function(c, i) { idx[c.name] = i; });

  var byWeek = {};
  var allWeeks = [];
  var stateKeys = {};

  json.data.forEach(function(row) {
    var weekEnd = row[idx.week_end];
    var pathogen = row[idx.pathogen];
    var geo = row[idx.geography];
    var pct = parseFloat(row[idx.percent_visits]);
    if (!weekEnd || !pathogen || !geo || isNaN(pct)) return;
    if (pathogen === 'Combined') return;
    if (geo === 'National' || geo.indexOf('Region') === 0) return;
    var sk = stateNameToKey[geo];
    if (!sk) return;

    var wk = weekEnd.slice(0, 10);
    if (!byWeek[wk]) { byWeek[wk] = {}; allWeeks.push(wk); }
    if (!byWeek[wk][sk]) byWeek[wk][sk] = {};
    byWeek[wk][sk][pathogen] = pct;
    stateKeys[sk] = true;
  });

  allWeeks.sort();
  console.log('[ellis] weeks: ' + allWeeks[0] + ' to ' + allWeeks[allWeeks.length-1]);
  console.log('[ellis] states: ' + Object.keys(stateKeys).length);

  var us_states = {};
  Object.keys(stateKeys).forEach(function(key) {
    var name = key.split('-').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
    us_states[key] = {
      name: name,
      population: STATE_POP[key] || 1000000,
      by_disease: {
        'covid-19': { total: 0, by_week: {} },
        'influenza': { total: 0, by_week: {} },
        'rsv': { total: 0, by_week: {} }
      }
    };
  });

  var diseaseMap = { 'COVID-19': 'covid-19', 'Influenza': 'influenza', 'RSV': 'rsv' };
  allWeeks.forEach(function(wk) {
    var mmwr = dateToMMWRWeek(wk);
    var weekStates = byWeek[wk];
    Object.keys(weekStates).forEach(function(sk) {
      ['COVID-19', 'Influenza', 'RSV'].forEach(function(p) {
        if (weekStates[sk][p] != null) {
          var v = round1(weekStates[sk][p]);
          var disease = diseaseMap[p];
          us_states[sk].by_disease[disease].by_week[mmwr] = v;
          us_states[sk].by_disease[disease].total = round1(
            (us_states[sk].by_disease[disease].total || 0) + weekStates[sk][p]
          );
        }
      });
    });
  });

  return us_states;
}

// --- Fetch WHO Disease Outbreak News ---
async function fetchWHONews() {
  console.log('[ellis] fetching WHO Disease Outbreak News...');
  try {
    var body = await fetch('https://www.who.int/api/news/diseaseoutbreaknews?$top=20&$orderby=PublicationDate%20desc');
    var json = JSON.parse(body);
    var items = json.value || [];

    var countryKeywords = [
      'China', 'United States', 'Uganda', 'Cambodia', 'Egypt', 'Indonesia',
      'Saudi Arabia', 'Pakistan', 'Congo', 'Korea', 'India', 'Brazil',
      'Democratic Republic of the Congo', 'Nepal', 'Peru', 'Colombia',
      'Senegal', 'Rwanda', 'Turkiye', 'Iran', 'South Africa', 'Nigeria',
      'Mexico', 'Canada', 'Australia', 'Japan', 'Germany', 'France',
      'Italy', 'Spain', 'United Kingdom', 'Russia', 'Argentina', 'Chile'
    ];

    return items.map(function(n) {
      var title = n.Title || '';
      var country = null;
      for (var i = 0; i < countryKeywords.length; i++) {
        if (title.indexOf(countryKeywords[i]) >= 0) { country = countryKeywords[i]; break; }
      }
      return {
        title: title,
        date: (n.PublicationDate || '').slice(0, 10),
        country: country,
        url: n.UrlName ? 'https://www.who.int/emergencies/disease-outbreak-news/item/' + n.UrlName : 'https://www.who.int/news'
      };
    }).filter(function(n) { return n.date && n.date >= '2023-01-01'; });
  } catch (e) {
    console.warn('[ellis] WHO news failed: ' + e.message);
    return [];
  }
}

// --- Main ---
(async function() {
  console.log('[ellis] refreshing surveillance data from real sources...');

  var now = new Date();
  var currentWeek = dateToMMWRWeek(now.toISOString());

  var result = {
    generated_at: now.toISOString(),
    source: 'live',
    notes: 'Real data from CDC NSSP (ED visit %) and WHO Disease Outbreak News. ED visit % is not case count.',
    us_states: {},
    countries: {},
    who_news: [],
    metadata: {
      current_week: currentWeek,
      max_week: 54,
      note: 'ED visit % from CDC NSSP (COVID-19, Flu, RSV). Real data.',
      diseases: {
        'covid-19': { label: 'COVID-19', unit: '% of ED visits' },
        'influenza': { label: 'Influenza', unit: '% of ED visits' },
        'rsv': { label: 'RSV', unit: '% of ED visits' }
      }
    },
    feeds: []
  };

  // CDC NSSP
  try {
    result.us_states = await fetchCDCNSSP();
    result.feeds.push({ id: 'cdc-nssp', ok: true, error: null });
    console.log('[ellis] CDC NSSP: ' + Object.keys(result.us_states).length + ' states');
  } catch (e) {
    console.warn('[ellis] CDC NSSP FAILED: ' + e.message);
    result.feeds.push({ id: 'cdc-nssp', ok: false, error: e.message });
  }

  // WHO news
  try {
    result.who_news = await fetchWHONews();
    result.feeds.push({ id: 'who-don', ok: true, error: null });
  } catch (e) {
    console.warn('[ellis] WHO news FAILED: ' + e.message);
    result.feeds.push({ id: 'who-don', ok: false, error: e.message });
  }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log('[ellis] wrote ' + OUT + ' (' + fs.statSync(OUT).size + ' bytes)');
  console.log('[ellis] done.');
})();
