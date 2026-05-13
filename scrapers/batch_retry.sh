#!/bin/bash
# Retry batch for phrases that hit rate-limiting in Round 4 contemporary batch.
# Uses 45s sleeps (vs default 15s) to avoid Letterboxd's per-IP throttle.

set -u
cd "$(dirname "$0")/.."

LOG_DIR="$(pwd)/scrape_logs"
mkdir -p "$LOG_DIR"

PHRASES=(
  "eat the rich"
  "eurosploitation"
  "good for her"
  "mommy issues"
  "sapphic cinema"
  "steampunk"
)

for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  log="$LOG_DIR/${slug}.log"
  echo "=== $(date -u +%H:%M:%S) scraping: $phrase ==="
  .venv/bin/python scrapers/scrape_nanogenre.py "$phrase" \
    --max-lists 10 --min-films 5 > "$log" 2>&1
  tail -3 "$log"
  echo "--- sleeping 45s ---"
  sleep 45
done

echo "=== retry batch complete ==="
ls -la /root/letterboxd-nanogenres/data/ | grep -E "(eat-the-rich|eurosploitation|good-for-her|mommy-issues|sapphic-cinema|steampunk)" || echo "no matching outputs found"
