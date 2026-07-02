// generate-enhanced-data.js — adds weekly time series + population
// Only generates data for weeks 1-current_week (year-to-date)
const fs = require('fs');
const path = require('path');

const SEED = path.join(__dirname, '..', 'data', 'surveillance.json');
const OUT  = path.join(__dirname, '..', 'data', 'surveillance.json');

const data = JSON.parse(fs.readFileSync(SEED, 'utf8'));

// Current MMWR week (mid-June 2026 ≈ week 24)
const CURRENT_WEEK = 24;
const MAX_WEEK = 54;

// Generate weights only up to current week
function genWeights(peakFn, numWeeks) {
  const w = [];
  for (let i = 1; i <= numWeeks; i++) w.push(peakFn(i, numWeeks));
  return w;
}

// COVID: winter peak (weeks 1-8) then summer ramp (weeks 20-24)
const covidFn = (w, n) => 0.5 + 1.5 * Math.exp(-Math.pow((w - 3) / 4, 2)) + 0.3 * Math.exp(-Math.pow((w - 22) / 3, 2));
// Flu: winter peak (weeks 1-10), fading through spring
const fluFn = (w, n) => 0.2 + 2.0 * Math.exp(-Math.pow((w - 4) / 4, 2));
// RSV: winter peak (weeks 1-8), fading
const rsvFn = (w, n) => 0.2 + 2.0 * Math.exp(-Math.pow((w - 3) / 3.5, 2));

const COVID_W = genWeights(covidFn, CURRENT_WEEK);
const FLU_W = genWeights(fluFn, CURRENT_WEEK);
const RSV_W = genWeights(rsvFn, CURRENT_WEEK);

function distributeOverWeeks(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const by_week = {};
  let distributed = 0;
  for (let w = 1; w <= CURRENT_WEEK; w++) {
    const val = Math.round(total * weights[w-1] / sum);
    by_week[w] = val;
    distributed += val;
  }
  // Adjust rounding error
  const diff = total - distributed;
  if (diff !== 0) by_week[CURRENT_WEEK] += diff;
  return by_week;
}

// State populations (2024 estimates)
const STATE_POP = {
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

// Country populations
const COUNTRY_POP = {
  "084":335900000,"124":40100000,"484":129000000,"076":216000000,"032":46000000,
  "826":67700000,"276":84400000,"250":68000000,"724":47500000,"380":58900000,
  "643":144000000,"156":1412000000,"392":124000000,"410":51700000,"356":1451000000,
  "586":245000000,"364":88500000,"792":86000000,"818":112000000,"710":61000000,
  "404":55000000,"566":229000000,"036":26600000,"554":5200000
};

for (const [key, state] of Object.entries(data.us_states)) {
  state.population = STATE_POP[key] || 1000000;
  for (const [disease, v] of Object.entries(state.by_disease)) {
    const total = typeof v === 'number' ? v : v.total || 0;
    const w = disease === 'covid-19' ? COVID_W : disease === 'influenza' ? FLU_W : RSV_W;
    state.by_disease[disease] = { total, by_week: distributeOverWeeks(total, w) };
  }
}

for (const [id, country] of Object.entries(data.countries)) {
  country.population = COUNTRY_POP[id] || 10000000;
  for (const [disease, v] of Object.entries(country.by_disease)) {
    const total = typeof v === 'number' ? v : v.total || 0;
    const w = disease === 'covid-19' ? COVID_W : disease === 'influenza' ? FLU_W : RSV_W;
    country.by_disease[disease] = { total, by_week: distributeOverWeeks(total, w) };
  }
}

data.metadata = {
  year: 2026,
  current_week: CURRENT_WEEK,
  max_week: MAX_WEEK,
  note: "Year-to-date through MMWR week " + CURRENT_WEEK + ". Future weeks show as no data.",
  diseases: {
    "covid-19": { label: "COVID-19", unit: "cases" },
    "influenza": { label: "Influenza", unit: "cases" },
    "rsv": { label: "RSV", unit: "cases" }
  }
};

fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
console.log("Wrote enhanced data to " + OUT + " (" + fs.statSync(OUT).size + " bytes)");
console.log("Data covers YTD through MMWR week " + CURRENT_WEEK + " of " + MAX_WEEK);
