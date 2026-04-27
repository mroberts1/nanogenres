# Genre → country Sankey
Route: bottom of every `/nanogenres/[slug]` page.
A two-layer Sankey diagram showing how each nanogenre's canonical films decompose by **traditional genre** (left) and **country of origin** (right). Each ribbon represents films that have both that genre tag and that country. Computed at build time in `[slug]/+page.ts`; laid out client-side with `d3-sankey`.
## What's on screen
- **Left column**: top 8 traditional genres for the canonical films (Horror, Drama, Mystery, etc.), with the per-genre film count next to each label.
- **Right column**: top 10 countries of origin (UK, USA, Italy, France, etc.).
- **Flows**: each ribbon connects a genre to a country; ribbon width is proportional to the number of canonical films with both that genre and that country.
- The section is **omitted entirely** if a nanogenre's films don't have both genre and country populated (none in the current catalog actually fall through).
## How to interact
- **Hover** a node (genre or country bar): dims everything not connected to it, isolating that node's flows.
- **Hover** a flow: shows an exact tooltip (`<genre> → <country> · N films`).
- The view is non-interactive otherwise — the layout is deterministic per page.
## Patterns to look for
- **Hyper-local national movements**: *italian neorealism* dumps almost everything into Italy; *iranian new wave* into Iran; *romanian cinema* into Romania. The Sankey collapses to a stack of bars on the right.
- **National horror traditions**: *giallo* shows Horror+Mystery streams almost entirely to Italy; *british kitchen sink* shows Drama→UK; *new french extremity* (under `french-extremity`) shows Horror+Drama→France with a thin USA spillover.
- **USA-saturated movements**: *new hollywood* and *mumblecore* are very USA-heavy across multiple genre buckets.
- **Internet aesthetics with diffuse origins**: *vaporwave*, *weirdcore*, *dreamcore*, *liminal spaces* spread across many genres × many countries — these are aesthetics applied to world cinema rather than national movements.
- **Tourist cinema**: Drama-dominated but the country distribution is wide. The whole point of the nanogenre is that the films travel; the Sankey shows it directly.
- **Bridges in the genre column**: when one genre fans out to many countries, you're looking at a global format (e.g. Drama, Horror); when many genres collapse to one country, you're looking at a national tradition.
