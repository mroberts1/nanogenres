#!/bin/bash
# Round 7 — final push to 100. 7 phrases with --no-strict, 60s sleeps.
#  - midnight-movies (replaces existing midnight-movie singular)
#  - chanbara, queer-horror, post-noir, cozy-cinema, pulp-cinema
#  - sapphic (bare; "sapphic cinema" was dead earlier)
set -u
cd "$(dirname "$0")/.."
mkdir -p scrape_logs

PHRASES=(
  "midnight movies"
  "chanbara"
  "queer horror"
  "post noir"
  "cozy cinema"
  "pulp cinema"
  "sapphic"
)

for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  log="scrape_logs/r7-${slug}.log"
  rm -f "/root/letterboxd-nanogenres/data/${slug}.json"
  echo "=== $(date -u +%H:%M:%S) --no-strict $phrase ==="
  .venv/bin/python scrapers/scrape_nanogenre.py "$phrase" \
    --max-lists 10 --min-films 5 --no-strict > "$log" 2>&1
  tail -5 "$log"
  echo "--- sleeping 60s ---"
  sleep 60
done

echo "=== r7 complete ==="
echo "--- summary ---"
for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-')
  f="/root/letterboxd-nanogenres/data/${slug}.json"
  if [ -f "$f" ]; then
    cnt=$(python3 -c "import json; print(len(json.load(open('$f'))['films']))" 2>/dev/null)
    echo "  ${slug}: ${cnt} films"
  else
    echo "  ${slug}: NO FILE"
  fi
done
