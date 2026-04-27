# Overlap graph
Route: `/graph`
A force-directed network where each **node is a nanogenre** and an **edge connects two nanogenres that share canonical films**. Built from the `getOverlapGraph()` derivation in `$lib/datasets`; the simulation runs client-side in `d3-force`.
## What's on screen
- Initial frame already shows nodes laid out on a circle around the center, so you're not staring at a phyllotactic clump while the simulation warms up.
- Over the next ~5 seconds the simulation cools and the cluster structure emerges: tightly linked groups of nanogenres pull toward each other; loosely connected outliers drift to the edges.
- **Node size** is proportional to the number of canonical films in that nanogenre.
- **Edge width** is proportional to the number of shared canonical films; edges fade with low intersection weight.
## How to interact
- **Min shared films slider (default 3)**: thins or thickens the graph by raising the edge threshold. At 2, almost everything is connected; at 8+, only the densest clusters survive. Restarts the simulation cleanly each time.
- **Hover** a node: dims everything except that node and its direct neighbors. Useful for tracing one nanogenre's cluster of related labels.
- **Click** a node: navigates to that nanogenre's page.
## Patterns to look for
- **Horror sub-cluster**: folk horror, cosmic horror, post-horror, elevated horror, body horror, giallo, midnight movie, video nasty all clump tightly.
- **Aesthetic / vibe sub-cluster**: vaporwave, weirdcore, dreamcore, y2k aesthetic, barbiecore, backrooms, liminal spaces — internet-era aesthetics that share a heavy 2000s+ canon.
- **Noir family**: neon noir, nordic noir, desert noir form their own pole, often with thin edges to new hollywood.
- **National movements** (italian neorealism, british kitchen sink, romanian cinema, iranian new wave) tend to sit at the periphery — they share little with the vibe-y interior.
- **Bridges** are interesting: nanogenres that connect two clusters often capture a real critical move (e.g. *folk horror* bridging horror and pastoral/British strands).
- Outliers with few or no edges at high thresholds (cottagecore-cinema, dark-academia-cinema, hangout-movie, doomer-film) are nanogenres whose canons are thin or genuinely distinctive.
