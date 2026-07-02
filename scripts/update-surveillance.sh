#!/usr/bin/env bash
# update-surveillance.sh — run weekly to refresh CDC/WHO data and rebuild the embedded map
# Compatible with cron (Mac/Linux) and can be triggered from Windows via WSL or Git Bash.

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "[update] fetching fresh data..."
node scripts/fetch-data.js

echo "[update] rebuilding embedded map data..."
node scripts/rebuild-embedded.js

echo "[update] done."
