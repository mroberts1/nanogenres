"""Scrape a single nanogenre from Letterboxd.

Pipeline:
  1. Search Letterboxd lists for <query>.
  2. Filter results to those whose title or description contains query phrase.
  3. For each list, collect its films (slug + name).
  4. Compute canonical films (appearing in >=2 lists, ranked by count).
  5. For each canonical film, pull JSON-LD metadata (genres, directors, year, rating).
  6. Dump everything to data/<slug>.json.

Usage: python scrape_nanogenre.py "sad girl cinema" [--max-lists 10]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from collections import Counter
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36")

CDATA_RE = re.compile(
    r"^\s*/\*\s*<!\[CDATA\[\s*\*/\s*(.*?)\s*/\*\s*\]\]>\s*\*/\s*$", re.DOTALL,
)

# Lists whose titles match these patterns are almost never thematic
# nanogenre lists (Top-N, watchlists, year diaries, ratings dumps, etc.).
LOW_QUALITY_TITLE_PATTERNS = [
    r"\btop\s+\d+\b",
    r"\btop\s+(ten|twenty|thirty|fifty|hundred)\b",
    r"\bbest\s+\d+\b",
    r"\bworst\s+\d+\b",
    r"\bbest\s+(films?|movies?)\s+of\s+\d{4}\b",
    r"\b\d{4}\s+(in\s+)?(films?|movies?)\b",
    r"\bfilms?\s+\d{4}\b",
    r"\bmovies?\s+\d{4}\b",
    r"\bwatched\s+(in\s+)?\d{4}\b",
    r"\bseen\s+in\s+\d{4}\b",
    r"\bwatchlist\b",
    r"\bto\s+watch\b",
    r"\bfilm\s+diary\b",
    r"\branked\b",
    r"\brankings?\b",
    r"\bratings?\s+ranked\b",
    r"\broulette\b",
    r"\btier\s*list\b",
    r"\bevery\s+(film|movie)\s+i\b",
    r"\ball\s+the\s+(films?|movies?)\s+i\b",
    r"\bmovies?\s+i'?ve\s+(watched|seen)\b",
    r"\bfilms?\s+i'?ve\s+(watched|seen)\b",
    r"\bmy\s+(favou?rite|fav)\s+(films?|movies?)\b",
    r"\bbest\s+of\s+the\s+(decade|year|century)\b",
    r"\bcollection\s+of\s+\d+\b",
    r"^\d{4}\s*$",
]

_LOW_QUALITY_RE = re.compile("|".join(LOW_QUALITY_TITLE_PATTERNS), re.IGNORECASE)


def is_low_quality_title(title: str) -> bool:
    if not title:
        return True
    return bool(_LOW_QUALITY_RE.search(title))

MANUAL_SEEDS = {
    "sad girl cinema": [
        {
            "href": "/indiasfilms/list/sad-girl-cinema/",
            "user": "indiasfilms",
            "slug": "sad-girl-cinema",
            "title": "sad girl cinema",
            "owner": "india PRO",
        }
    ],
    "sad boy cinema": [
        {
            "href": "/indiasfilms/list/sad-boy-cinema/",
            "user": "indiasfilms",
            "slug": "sad-boy-cinema",
            "title": "sad boy cinema",
            "owner": "india PRO",
        }
    ],
    "tourist cinema": [
        {
            "href": "/dokoissho/list/tourist-cinema/",
            "user": "dokoissho",
            "slug": "tourist-cinema",
            "title": "tourist cinema",
            "owner": "dokoissho",
        }
    ],
    "hauntologies": [
        {
            "href": "/dokoissho/list/hauntologies/",
            "user": "dokoissho",
            "slug": "hauntologies",
            "title": "hauntologies",
            "owner": "dokoissho",
        }
    ],
}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


# -------- search --------

SEARCH_JS = r"""
(query) => {
  const qa = s => Array.from(document.querySelectorAll(s));
  const results = [];
  const articles = qa('article.list-summary, li.search-result article.list-summary');
  for (const art of articles) {
    // title link: .name a (class 'name prettify' wraps it)
    const nameA = art.querySelector('.name a, a.name, h2 a');
    if (!nameA) continue;
    const href = nameA.getAttribute('href') || '';
    const m = href.match(/^\/([^\/]+)\/list\/([^\/?#]+)\/?$/);
    if (!m) continue;
    const title = (nameA.innerText || '').trim();
    const desc = (art.querySelector('.list-description, .body-text, .description, .notes') || {}).innerText || '';
    const owner = art.getAttribute('data-person') ||
                  (art.querySelector('.list-owner, .person-summary a, .attribution a') || {}).innerText || m[1];
    results.push({
      href,
      user: m[1],
      slug: m[2],
      title,
      desc: desc.trim().slice(0, 500),
      owner: (owner || '').trim(),
      list_id: art.getAttribute('data-film-list-id') || null,
    });
    if (results.length >= 40) break;
  }
  return results;
}
"""


def _eval_search(page, url: str, query: str, wait_ms: int = 6000) -> list[dict]:
    print(f"[search] {url}", file=sys.stderr)
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    # Wait for hydrated list cards. Cap so missing-results pages still progress.
    try:
        page.wait_for_selector(
            "article.list-summary", state="attached", timeout=wait_ms,
        )
    except PWTimeout:
        pass
    # Small post-render settle so descriptions/poster ids fill in.
    page.wait_for_timeout(800)
    return page.evaluate(SEARCH_JS, query)


def search_lists(
    page,
    query: str,
    max_lists: int = 10,
    quality_strict: bool = True,
) -> list[dict]:
    q_enc = query.strip().replace(" ", "+")
    tag_slug = slugify(query)
    candidates = []
    seen_hrefs = set()
    manual = MANUAL_SEEDS.get(query.lower().strip(), [])
    for m in manual:
        candidates.append(dict(m))
        seen_hrefs.add(m["href"])
    # 1) /search/lists/<q>/
    try:
        fetched = _eval_search(
            page, f"https://letterboxd.com/search/lists/{q_enc}/", query,
        )
        for r in fetched:
            if r.get("href") and r["href"] not in seen_hrefs:
                candidates.append(r)
                seen_hrefs.add(r["href"])
    except Exception as e:
        print(f"[search] primary err: {e}", file=sys.stderr)
    if len(candidates) == len(manual):
        # One retry after a longer wait to dodge rate-limit/loading races
        time.sleep(3)
        try:
            fetched = _eval_search(
                page, f"https://letterboxd.com/search/lists/{q_enc}/", query,
                wait_ms=10000,
            )
            for r in fetched:
                if r.get("href") and r["href"] not in seen_hrefs:
                    candidates.append(r)
                    seen_hrefs.add(r["href"])
        except Exception as e:
            print(f"[search] retry err: {e}", file=sys.stderr)
    # 2) fallback to /tag/<slug>/lists/
    if len(candidates) == len(manual):
        try:
            tag_candidates = _eval_search(
                page, f"https://letterboxd.com/tag/{tag_slug}/lists/", query,
                wait_ms=2500,
            )
            for r in tag_candidates:
                if r.get("href") and r["href"] not in seen_hrefs:
                    candidates.append(r)
                    seen_hrefs.add(r["href"])
        except Exception as e:
            print(f"[tag] err: {e}", file=sys.stderr)

    q_words = [w for w in re.split(r"\W+", query.lower()) if w]
    q_phrase = query.lower()
    manual_hrefs = {m["href"] for m in manual}

    def _matches_query(rec: dict, title_only: bool) -> bool:
        title = (rec.get("title") or "").lower()
        desc = (rec.get("desc") or "").lower()
        if title_only:
            return q_phrase in title or all(w in title for w in q_words)
        hay = title + " " + desc
        return q_phrase in hay or all(w in hay for w in q_words)

    rejected_low_quality = []
    rejected_off_topic = []

    # Pass 1 (strict): phrase in title AND not low-quality.
    strict = []
    for r in candidates:
        if r["href"] in manual_hrefs:
            strict.append(r)
            continue
        title = r.get("title") or ""
        if is_low_quality_title(title):
            rejected_low_quality.append(r)
            continue
        if not _matches_query(r, title_only=True):
            rejected_off_topic.append(r)
            continue
        strict.append(r)

    relevant = strict[:max_lists]

    # Pass 2 (loose): if strict found < 3, allow phrase-in-desc but still
    # exclude low-quality titles.
    if len(relevant) < 3 and not quality_strict:
        existing = {r["href"] for r in relevant}
        for r in candidates:
            if r["href"] in existing:
                continue
            title = r.get("title") or ""
            if is_low_quality_title(title):
                continue
            if _matches_query(r, title_only=False):
                relevant.append(r)
            if len(relevant) >= max_lists:
                break

    # Last-resort fallback: if nothing matched at all, keep manual seeds (if any)
    # plus the top non-low-quality candidates so we don't fail silently.
    if not relevant:
        for r in candidates:
            title = r.get("title") or ""
            if is_low_quality_title(title):
                continue
            relevant.append(r)
            if len(relevant) >= max_lists:
                break

    print(
        f"[search] {len(candidates)} candidates -> "
        f"{len(relevant)} relevant "
        f"(rejected low-quality={len(rejected_low_quality)}, "
        f"off-topic={len(rejected_off_topic)})",
        file=sys.stderr,
    )
    return relevant


# -------- list films --------

LIST_JS = r"""
() => {
  const qa = s => Array.from(document.querySelectorAll(s));
  const title = document.querySelector("h1.title-1")?.innerText?.trim() || null;
  const owner = document.querySelector("h1.title-4, .list-owner a")?.innerText?.trim() || null;
  const desc = document.querySelector(".body-text, .list-description")?.innerText?.trim() || null;
  const tags = Array.from(new Set(
    qa('a[href*="/tag/"]').map(a => {
      const m = a.getAttribute("href").match(/\/tag\/([^\/?#]+)/);
      return m ? m[1] : null;
    }).filter(Boolean)
  ));
  const films = qa('[data-component-class="LazyPoster"][data-item-link^="/film/"]').map(el => ({
    slug: el.getAttribute("data-item-slug"),
    name: el.getAttribute("data-item-name"),
  })).filter(f => f.slug);
  return {title, owner, desc, tags, films};
}
"""


def list_films(page, href: str) -> dict:
    url = f"https://letterboxd.com{href}"
    print(f"[list] {url}", file=sys.stderr)
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(900)
    d = page.evaluate(LIST_JS)
    # handle pagination — common list URL format is .../page/2/
    for pg in range(2, 20):
        page_url = f"https://letterboxd.com{href}page/{pg}/"
        try:
            page.goto(page_url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(500)
            more = page.evaluate("""() => Array.from(
                document.querySelectorAll('[data-component-class="LazyPoster"][data-item-link^="/film/"]')
              ).map(el => ({
                slug: el.getAttribute('data-item-slug'),
                name: el.getAttribute('data-item-name'),
              })).filter(f => f.slug)""")
            if not more:
                break
            existing_slugs = {f["slug"] for f in d["films"]}
            new = [f for f in more if f["slug"] not in existing_slugs]
            if not new:
                break
            d["films"].extend(new)
        except PWTimeout:
            break
    return d


# -------- film metadata --------

def film_data(page, slug: str) -> dict:
    url = f"https://letterboxd.com/film/{slug}/"
    page.goto(url, wait_until="domcontentloaded", timeout=20000)
    raw = page.eval_on_selector(
        'script[type="application/ld+json"]', "el => el.textContent",
    )
    m = CDATA_RE.match(raw)
    jd = json.loads(m.group(1) if m else raw)
    return {
        "slug": slug,
        "title": jd.get("name"),
        "year": next(
            (e.get("startDate", "")[:4] for e in jd.get("releasedEvent", [])
             if e.get("@type") == "PublicationEvent"),
            None,
        ),
        "genres": jd.get("genre", []),
        "directors": [d.get("name") for d in jd.get("director", [])],
        "actors": [a.get("name") for a in jd.get("actors", [])[:6]],
        "countries": [c.get("name") for c in jd.get("countryOfOrigin", [])],
        "rating": (jd.get("aggregateRating") or {}).get("ratingValue"),
        "rating_count": (jd.get("aggregateRating") or {}).get("ratingCount"),
        "poster": jd.get("image"),
        "url": url,
    }


# -------- main --------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query", help="nanogenre phrase, e.g. 'sad girl cinema'")
    ap.add_argument("--max-lists", type=int, default=10)
    ap.add_argument("--min-list-appearances", type=int, default=2,
                    help="film is canonical if it appears in at least N lists")
    ap.add_argument("--max-canonical", type=int, default=60)
    ap.add_argument("--min-films", type=int, default=5,
                    help="drop source lists with fewer than N films post-fetch")
    ap.add_argument("--max-films", type=int, default=800,
                    help="drop source lists with more than N films (likely generic dumps)")
    ap.add_argument("--strict", dest="strict", action="store_true", default=True,
                    help="require nanogenre phrase in list title (default)")
    ap.add_argument("--no-strict", dest="strict", action="store_false",
                    help="allow phrase in description if too few title hits")
    ap.add_argument("--out-dir", default="/root/letterboxd-nanogenres/data")
    args = ap.parse_args()

    slug = slugify(args.query)
    out_path = Path(args.out_dir) / f"{slug}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=UA, viewport={"width": 1280, "height": 900})
        page = ctx.new_page()

        lists = search_lists(
            page, args.query, args.max_lists, quality_strict=args.strict,
        )

        lists_with_films = []
        for li in lists:
            try:
                d = list_films(page, li["href"])
                merged = {**li, **d}
                n = len(merged.get("films") or [])
                if n < args.min_films:
                    print(f"  drop (only {n} films) {li['href']}", file=sys.stderr)
                    continue
                if n > args.max_films:
                    print(f"  drop ({n} films > max) {li['href']}", file=sys.stderr)
                    continue
                lists_with_films.append(merged)
            except Exception as e:
                print(f"  list error {li['href']}: {e}", file=sys.stderr)

        # Count films across lists
        film_to_lists: dict[str, list[str]] = {}
        film_names: dict[str, str] = {}
        for li in lists_with_films:
            seen_in_list = set()
            for f in li.get("films", []):
                if f["slug"] in seen_in_list:
                    continue
                seen_in_list.add(f["slug"])
                film_to_lists.setdefault(f["slug"], []).append(li["href"])
                film_names[f["slug"]] = f.get("name") or f["slug"]

        canonical = sorted(
            ((s, len(hs)) for s, hs in film_to_lists.items() if len(hs) >= args.min_list_appearances),
            key=lambda x: -x[1],
        )[: args.max_canonical]

        # Enrich canonical films with metadata
        films_meta = []
        for i, (fslug, count) in enumerate(canonical, 1):
            try:
                meta = film_data(page, fslug)
                meta["appears_in_n_lists"] = count
                films_meta.append(meta)
                print(f"  {i:3d}/{len(canonical)} {meta['title']} "
                      f"({meta['year']}) x{count} — {', '.join(meta['genres'])}",
                      file=sys.stderr)
                time.sleep(0.2)  # be polite
            except Exception as e:
                print(f"  film error {fslug}: {e}", file=sys.stderr)

        browser.close()

    # Aggregates
    genre_counts = Counter(g for f in films_meta for g in f["genres"])
    director_counts = Counter(d for f in films_meta for d in f["directors"])
    year_counts = Counter(f["year"] for f in films_meta if f.get("year"))

    output = {
        "query": args.query,
        "slug": slug,
        "min_list_appearances_used": args.min_list_appearances,
        "source_lists": [
            {k: li.get(k) for k in
             ("href", "user", "slug", "title", "desc", "owner", "tags")}
            for li in lists_with_films
        ],
        "source_list_count": len(lists_with_films),
        "films_considered": len(film_to_lists),
        "canonical_count": len(films_meta),
        "films": films_meta,
        "aggregates": {
            "genres": dict(genre_counts.most_common()),
            "directors": dict(director_counts.most_common(20)),
            "years": dict(sorted(year_counts.items())),
        },
    }

    with open(out_path, "w") as fh:
        json.dump(output, fh, indent=2, ensure_ascii=False)
    print(f"\n[done] {out_path}", file=sys.stderr)
    print(json.dumps({
        "slug": slug,
        "lists_used": len(lists_with_films),
        "canonical_films": len(films_meta),
        "top_5": [(f["title"], f["year"], f["appears_in_n_lists"]) for f in films_meta[:5]],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
