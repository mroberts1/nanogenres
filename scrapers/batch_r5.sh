#!/bin/bash
# Brainstorm batch — May 2026 round 5.
# 13 phrases, 60s sleeps to be safely below rate-limit.
# Estimated runtime: ~14 min.
set -u
cd "$(dirname "$0")/.."

LOG_DIR="$(pwd)/scrape_logs"
mkdir -p "$LOG_DIR"

PHRASES=(
  "erotic thriller"
  "neo noir"
  "queercore"
  "coquette"
  "shoegaze"
  "wuxia"
  "chaos cinema"
  "mall goth"
  "coastal grandmother"
  "normcore"
  "slacker cinema"
  "blaxploitation"
  "twee"
)

for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  log="$LOG_DIR/r5-${slug}.log"
  echo "=== $(date -u +%H:%M:%S) scraping: $phrase ==="
  .venv/bin/python scrapers/scrape_nanogenre.py "$phrase" \
    --max-lists 10 --min-films 5 > "$log" 2>&1
  tail -5 "$log"
  echo "--- sleeping 60s ---"
  sleep 60
done

echo "=== brainstorm batch complete ==="
echo "--- summary ---"
for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  f="/root/letterboxd-nanogenres/data/${slug}.json"
  if [ -f "$f" ]; then
    count=$(python3 -c "import json; print(len(json.load(open('$f'))['films']))" 2>/dev/null)
    echo "  ${slug}: ${count} films"
  else
    echo "  ${slug}: NO FILE"
  fi
done
