#!/bin/bash
# Mall-movie special search: try 4 different phrasings to find the best coverage.
set -u
cd "$(dirname "$0")/.."

LOG_DIR="$(pwd)/scrape_logs"
mkdir -p "$LOG_DIR"

PHRASES=(
  "mallsoft"
  "mallcore"
  "mall movies"
  "mall"
)

for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  log="$LOG_DIR/mall-${slug}.log"
  echo "=== $(date -u +%H:%M:%S) scraping: $phrase ==="
  .venv/bin/python scrapers/scrape_nanogenre.py "$phrase" \
    --max-lists 10 --min-films 5 > "$log" 2>&1
  tail -8 "$log"
  echo "--- sleeping 45s ---"
  sleep 45
done

echo "=== mall search complete ==="
