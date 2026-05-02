#!/usr/bin/env bash
# Broad first-wave nanogenre discovery pass.
# Each entry is a candidate phrase. The scraper now applies a low-quality
# title filter (Top 10/ranked/watchlist/etc.) and prefers phrase-in-title
# matches over phrase-in-desc to avoid generic lists.
#
# Usage:
#   ./batch_scrape.sh                 # all candidates, strict mode
#   ./batch_scrape.sh new             # only the new first-wave additions
#   ./batch_scrape.sh "folk horror"   # one specific phrase

set -u
cd /root/letterboxd-nanogenres
. .venv/bin/activate

MODE="${1:-all}"

# Existing seeds that already produced wiki pages.
EXISTING=(
  "hauntologies"
  "tourist cinema"
  "sad girl cinema"
  "sad boy cinema"
  "liminal cinema"
  "dark academia"
  "barbiecore"
  "A24"
  "mumblecore"
  "slow cinema"
  "cottagecore"
  "elevated horror"
  "coming of age"
  "cyberpunk"
)

# First-wave additions: community microgenres with a real Letterboxd
# footprint, weighted toward thematic/aesthetic clusters likely to have
# user-curated lists rather than algorithmic dumps.
NEW=(
  "folk horror"
  "new french extremity"
  "neon noir"
  "nordic noir"
  "post-horror"
  "cosmic horror"
  "backrooms"
  "liminal spaces"
  "weirdcore"
  "dreamcore"
  "vaporwave"
  "girlhood"
  "boyhood"
  "unhinged women"
  "transcendental cinema"
  "new hollywood"
  "found footage"
  "mockumentary"
  "cinema du look"
  "maximalist cinema"
  "minimalist cinema"
  "video nasty"
  "chamber drama"
  "suburban malaise"
)

# Second-wave additions: candidates targeted to fill gaps not covered by
# the first-wave set — horror sub-niches, retro/futurism aesthetics,
# national new-wave movements, mood/character clusters, and form/setting
# tropes. Phrases are chosen to match how Letterboxd users actually title
# curated lists.
SECOND_WAVE=(
  # Horror sub-niches
  "body horror"
  "ecohorror"
  "analog horror"
  "backwoods horror"
  "giallo"
  "splatterpunk"
  "creature feature"
  "midnight movie"
  # Retro / futurism aesthetics
  "cassette futurism"
  "dieselpunk"
  "atompunk"
  "afrofuturism"
  "y2k aesthetic"
  # National movements / canon
  "new queer cinema"
  "dogme 95"
  "british kitchen sink"
  "italian neorealism"
  "iranian new wave"
  "romanian new wave"
  # Mood / character clusters
  "doomer cinema"
  "divorced dad cinema"
  "weird girl cinema"
  "dirtbag cinema"
  "manic pixie dream girl"
  # Form / hangout / setting
  "hangout movie"
  "hyperlink cinema"
  "desert noir"
)

if [ "$MODE" = "all" ]; then
  NANOGENRES=("${EXISTING[@]}" "${NEW[@]}" "${SECOND_WAVE[@]}")
elif [ "$MODE" = "new" ]; then
  NANOGENRES=("${NEW[@]}")
elif [ "$MODE" = "second" ]; then
  NANOGENRES=("${SECOND_WAVE[@]}")
elif [ "$MODE" = "existing" ]; then
  NANOGENRES=("${EXISTING[@]}")
else
  NANOGENRES=("$MODE")
fi

run_one() {
  local q="$1"
  echo ""
  echo "================================================================"
  echo "Scraping: $q"
  echo "================================================================"
  # Manual seeds for tiny known-good lists need min-list-appearances=1.
  case "$q" in
    "tourist cinema"|"hauntologies")
      python scrapers/scrape_nanogenre.py "$q" \
        --max-lists 10 --min-list-appearances 1 \
        --min-films 4 2>&1 | tail -16
      ;;
    *)
      python scrapers/scrape_nanogenre.py "$q" \
        --max-lists 10 --min-list-appearances 2 \
        --min-films 5 2>&1 | tail -16
      ;;
  esac
}

for q in "${NANOGENRES[@]}"; do
  run_one "$q"
  echo "--- sleeping 15s ---"
  sleep 15
done

echo ""
echo "================================================================"
echo "SUMMARY"
echo "================================================================"
for f in /root/letterboxd-nanogenres/data/*.json; do
  printf "%-30s  lists=%2s  canon=%3s\n" "$(basename "$f" .json)" \
    "$(python -c 'import json,sys; print(json.load(open(sys.argv[1])).get("source_list_count",0))' "$f")" \
    "$(python -c 'import json,sys; print(json.load(open(sys.argv[1])).get("canonical_count",0))' "$f")"
done
