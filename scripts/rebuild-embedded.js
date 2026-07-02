/**
 * rebuild-embedded.js — replace EMBEDDED_SURVEILLANCE in map-embedded-data.js
 * with the latest data from data/surveillance.json.
 *
 * Usage: node scripts/rebuild-embedded.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE   = path.join(__dirname, '..', 'data', 'surveillance.json');
const EMBEDDED    = path.join(__dirname, '..', 'map-embedded-data.js');

if (!fs.existsSync(DATA_FILE)) {
  console.error('[rebuild] data/surveillance.json not found — run fetch-data.js first');
  process.exit(1);
}

const fresh = fs.readFileSync(DATA_FILE, 'utf8');
const existing = fs.readFileSync(EMBEDDED, 'utf8');

// Replace the EMBEDDED_SURVEILLANCE value.
// Match from "var EMBEDDED_SURVEILLANCE = {" up to "};" or "}\n" that precedes "var EMBEDDED_US_TOPO".
// The JSON from surveillance.json ends with "}" (no semicolon), and the embedded file may
// have the semicolon on the same line ("};") or next line ("}\n;...var EMBEDDED_US_TOPO").
const regex = /^(var EMBEDDED_SURVEILLANCE\s*=\s*)\{[\s\S]*?\}(\s*;?\s*)(?=\nvar EMBEDDED_US_TOPO)/m;
if (!regex.test(existing)) {
  console.error('[rebuild] could not find EMBEDDED_SURVEILLANCE boundary in map-embedded-data.js');
  process.exit(1);
}

const updated = existing.replace(regex, '$1' + fresh.trimEnd() + '\n;');

fs.writeFileSync(EMBEDDED, updated);
console.log('[rebuild] updated map-embedded-data.js (' + fs.statSync(EMBEDDED).size + ' bytes)');
