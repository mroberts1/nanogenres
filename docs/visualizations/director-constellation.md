# Director constellation
Route: `/directors`
A bipartite force-directed graph: **directors** who appear in at least N distinct aesthetics on the left (blue), **aesthetics** they bridge on the right (pink). Each link weight = number of canonical films from that director in that aesthetic. Built from `getDirectorConstellation()` in `$lib/datasets`; layout runs client-side in `d3-force` with a horizontal `forceX` constraint that keeps the bipartite split readable.
## What's on screen
- **Left column (blue)**: directors. Node size = total canonical-film count across the catalog.
- **Right column (pink)**: aesthetics they appear in. Node size = canonical-film count of the aesthetic.
- **Edge thickness**: number of canonical films contributed by that director to that aesthetic.
- The bipartite split is enforced by a force pulling each kind toward its column; vertical position is settled by the simulation.
## How to interact
- **Min aesthetics bridged** slider (default 3): only show directors who span at least N distinct aesthetics. At 2, the graph is dense (426 directors, 1494 links); at 5 or 6 it collapses to a handful of true bridge-builders.
- **Hover** any node: dims everything not connected to it. Hover a director to see exactly which aesthetics they bridge; hover an aesthetic to see which directors recur within it.
- **Click** an aesthetic node to drill into its page; director nodes are not clickable (Letterboxd doesn't have stable director profile URLs we control).
## Patterns to look for
- **The biggest bridges** at the catalog level are exactly the directors with cross-genre auteurist reputations:
  - **David Lynch** is the single biggest bridge — 15 aesthetics, 34 films. He turns up in everything from *neon-noir* and *dreamcore* to *body-horror*, *desert-noir*, and *doomer-film*.
  - **Stanley Kubrick** (14 aesthetics, 18 films) bridges retro-futurism (*atompunk*, *cassette-futurism*), horror (*cosmic-horror*), and high-canon clusters (*new-hollywood*, *transcendental-cinema*).
  - **Sofia Coppola** (13 aesthetics, 23 films) anchors the *a24* / *barbiecore* / *girlhood* / *sad-girl-cinema* corner of the constellation.
  - **Robert Eggers** (13 aesthetics, 16 films) is the modern horror bridge — *folk-horror*, *cosmic-horror*, *elevated-horror*, *post-horror* all touch him.
  - **Nicolas Winding Refn** (11 aesthetics, 19 films) ties together neon/nordic noir with the *dirtbag-cinema* / *midnight-movie* fringe.
  - **Andrei Tarkovsky**, **David Cronenberg**, **Gaspar Noé** each bridge ~9 aesthetics but with very different cluster profiles.
- **National-canon specialists** show up as long, thin connections: **Abbas Kiarostami** has 20 films across only 4 aesthetics (mostly *iranian-new-wave*, *slow-cinema*, *transcendental-cinema*). They appear as outliers when the slider is low and disappear quickly as you raise it.
- **Cluster signatures**: hover a horror aesthetic and you'll see a recurring set (Eggers, Aster, Carpenter, Cronenberg) light up; hover a vibe-y aesthetic (vaporwave, weirdcore, dreamcore) and the directors are typically much more diffuse (no strong auteur signature).
- **Empty centers**: a few aesthetics barely have multi-genre directors (e.g. *romanian-cinema*, *italian-neorealism*, *british-kitchen-sink*) — their canons are made by directors who *don't* travel across aesthetics. They sit on the periphery of the right column.
