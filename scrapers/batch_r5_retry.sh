#!/bin/bash
# Retry with --no-strict for the 3 phrases that returned 0 films in the round 5 batch.
set -u
cd "$(dirname "$0")/.."
mkdir -p scrape_logs
PHRASES=("shoegaze" "blaxploitation" "twee")
for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  rm -f "/root/letterboxd-nanogenres/data/${slug}.json"
  echo "=== $(date -u +%H:%M:%S) --no-strict $phrase ==="
  .venv/bin/python scrapers/scrape_nanogenre.py "$phrase" --max-lists 10 --min-films 5 --no-strict > "scrape_logs/r5retry-${slug}.log" 2>&1
  tail -5 "scrape_logs/r5retry-${slug}.log"
  echo "--- sleeping 45s ---"
  sleep 45
done
echo "=== retry complete ==="
for slug in shoegaze blaxploitation twee; do
  f="/root/letterboxd-nanogenres/data/${slug}.json"
  if [ -f "$f" ]; then
    cnt=$(python3 -c "import json; print(len(json.load(open('$f'))['films']))" 2>/dev/null)
    echo "  ${slug}: ${cnt} films"
  else
    echo "  ${slug}: NO FILE"
  fi
done
