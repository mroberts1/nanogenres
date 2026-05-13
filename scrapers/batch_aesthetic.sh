#!/bin/bash
set -u
cd ~/nanogenres
PY=.venv/bin/python
PHRASES=(
  "fairycore"
  "witchcore"
  "grandmacore"
  "kitschcore"
  "frutiger aero"
  "bloomcore"
  "angelcore"
  "dollcore"
  "babygirl cinema"
  "feral cinema"
  "messy cinema"
  "millennial malaise"
  "climate grief"
  "solarpunk"
  "biopunk"
  "retrofuturism"
)
mkdir -p scrape_logs
for phrase in "${PHRASES[@]}"; do
  slug=$(echo "$phrase" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-')
  echo "=== [$phrase] -> $slug ==="
  $PY scrapers/scrape_nanogenre.py "$phrase" --max-lists 10 --min-films 5 \
      > scrape_logs/$slug.log 2>&1
  tail -1 scrape_logs/$slug.log
  sleep 15
done
echo "ALL DONE"
ls -la /root/letterboxd-nanogenres/data/ 2>/dev/null | tail -20
