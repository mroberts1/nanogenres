# Rating × canonicality scatter
Route: `/scatter`
A scatter plot where each dot is a single **(film, nanogenre)** pair. The horizontal axis is the number of source lists the film appears in for that nanogenre (1–10); the vertical axis is the film's aggregate Letterboxd rating. 2929 points total (films without a Letterboxd rating are dropped). Built from `getScatterPoints()` in `$lib/datasets`.
## What's on screen
- Every canonical film appears once per nanogenre it belongs to, so a film in three nanogenres becomes three dots.
- A small deterministic horizontal jitter spreads dots that share the same integer x value so they don't pile up.
- In the default "All (dim view)" mode every point is rendered semi-transparent — you're looking at the global cloud.
- A side panel on the right summarizes the focused nanogenre (or shows usage hints when no focus is set), plus a hover card for whatever dot the cursor is over.
## How to interact
- **Focus a nanogenre dropdown**: pick one of the 62 nanogenres and its dots are colored pink and brought to the foreground; the other ~2900 points fade nearly out of view.
- **Clear** button next to the dropdown returns to the dim global view.
- **Hover any dot** for a tooltip with the film, year, nanogenre, exact rating, and exact appearance count. The hover card in the side panel mirrors the same info with a clickable link to the nanogenre page.
- The headline of the focus card links to the focused nanogenre's page.
## Patterns to look for
- **Canonicality and rating are essentially uncorrelated catalog-wide.** The global Pearson r between appearance count and rating is **0.004** — appearing in 9/10 of a nanogenre's source lists doesn't predict that the film is highly-rated, and vice versa. This is a useful null finding: "canonical to a nanogenre" and "good film" are different signals.
- **Highest-mean-rating nanogenres (cinephile-coded)**: *transcendental cinema* (4.02), *minimalist cinema* (4.02), *slow cinema* (4.01), *doomer film* (4.00), *new hollywood* (3.99), *sad boy cinema* (3.98), *iranian new wave* (3.98), *chamber drama* (3.91). Their clouds sit visibly higher in the plot than the catalog mean.
- **Lowest-mean-rating nanogenres (trash/horror genre clusters)**: *video nasty* (2.88), *found footage* (2.90), *backwoods horror* (3.13), *ecohorror* (3.15), *splatter horror* (3.20), *elevated horror* (3.29), *mumblecore* (3.29), *cosmic horror* (3.31). These clouds visibly drop below 3.5.
- **Top-right corner films** (highly canonical AND highly rated) are the cross-cluster pillars worth knowing: *The Godfather Part II* (4.59 / 9 lists in new hollywood), *Paris Is Burning* (4.55 / 8 in new queer cinema), *The Godfather* (4.52 / 9 in new hollywood), *Stalker* (4.4 / 9 in slow cinema), *Sátántangó* (4.39 / 8 in slow cinema), *Perfect Blue* (4.38 / 8 in sad girl cinema).
- **Bottom-right corner** is the fascinating one: films that are *highly canonical* to a nanogenre but rated mediocre. These are usually genre-specific cult favorites. Focus *video nasty* or *found footage* and you'll see a wall of points in the high-x, low-y region — the ratings pull down because the wider Letterboxd audience doesn't share the niche taste.
- **Vertical compression** of a nanogenre's cloud (a tight band of ratings) suggests a stylistically coherent canon; **vertical spread** suggests a label that gathers very different kinds of films under one umbrella (e.g. *vaporwave* spans films with very disparate critical receptions).
- **Horizontal stretch** without vertical movement reveals which films are most repeatedly cited by community curators of the nanogenre — these are the "definers" regardless of how the wider audience rates them.
