# Film cross-membership chips
Route: bottom of every `/aesthetics/[slug]` page (in the canonical-films table).
For each canonical film, small pill-shaped links list **every other aesthetic that same film also appears in**, sorted by descending size of the other aesthetic so prominent labels come first. Films unique to the current aesthetic get no chips. Computed at build time using `getFilmMembership()` from `$lib/datasets`.
## What's on screen
- Each canonical film row in the table shows the film's title, then directly underneath it (when applicable) a wrap-around row of small chips.
- Chips that are present mean: this exact film is also in the canonical set of those other aesthetics.
- The page header now includes a stat: *"X also appear in other aesthetics"* — a quick measure of how porous the current canon is.
## How to interact
- **Click** any chip to jump to that other aesthetic's page.
- **Hover** restyles the chip with the accent color but doesn't change the underlying data.
## How to read it
The chip count per aesthetic is a good proxy for **canonical distinctiveness**:
- **Heavily porous** (~100+ chips): vaporwave (151), post-horror (133). Their canons are deeply shared with other communities — they describe a *vibe* applied to films also claimed elsewhere.
- **Mid-porous** (~30–50): folk horror (37), tourist cinema (29), italian neorealism, suburban malaise. Strong identity, but their canon overlaps a coherent neighborhood.
- **Distinctive** (≤15): giallo (10), splatter horror, romanian cinema, dogme-95 candidates. Most of their canonical films appear in no other aesthetic.
- A film that picks up many chips at once (e.g. *Midsommar* showing chips for cosmic horror, post-horror, elevated horror, folk horror) is a **multi-aesthetic keystone** — useful for spotting "anchors" that unify a cluster.
- Conversely, a row with no chips means the film is currently unique to this aesthetic's canon: a **defining film** of that label rather than a generally-cited canonical film.
