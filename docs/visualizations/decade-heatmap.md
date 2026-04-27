# Catalog decade heatmap
Route: `/decades`
A grid of **62 nanogenres × 11 decades** (1920s–2020s), where each cell's color intensity scales with the number of canonical films from that decade. Built from `getCatalogDecadeMatrix()` in `$lib/datasets`; sqrt scaling keeps small counts visible.
## What's on screen
- Rows are nanogenres; columns are decades.
- Cell intensity is the number of canonical films that nanogenre has from that decade, after the chosen normalization is applied.
- The rightmost column shows the row total; row labels are clickable.
## How to interact
- **Sort dropdown**:
  - *By canonical-film total (default)*: most populous nanogenres on top.
  - *By earliest decade*: chronological wall — old movements at the top, internet-era ones at the bottom.
  - *Alphabetical*: useful for finding a specific nanogenre.
- **Normalize dropdown**:
  - *Per nanogenre (default)*: each row's max decade is "full intensity". Reveals the **temporal shape** of each canon.
  - *Globally*: max across the whole catalog is full intensity. Reveals **absolute volume** — many rows go nearly invisible because their decade run is dwarfed by the largest cell.
- **Hover** any cell for an exact-count tooltip (`<nanogenre> · <decade> · <N> canonical films`).
- **Click** a row label to drill into that nanogenre's page.
## Patterns to look for
- **Mid-century concentrations**: *italian neorealism*, *british kitchen sink*, *new hollywood* concentrate in the 1940s–1970s.
- **Reagan-era horror corridor**: *video nasty*, *splatter horror*, *backwoods horror*, *giallo* are heavy in the 1970s–80s.
- **Internet-era aesthetics applied retroactively**: *vaporwave*, *backrooms*, *analog horror*, *liminal spaces*, *weirdcore*, *cassette futurism* concentrate in the 2010s–20s — often pulling in much older films, but the bulk lives recent.
- **A24-era horror clump**: *post-horror*, *elevated horror*, *folk horror* (modern revival), *cosmic horror* are 2010s-skewed.
- **Continuous canons**: *cyberpunk*, *coming-of-age*, *slow cinema* spread fairly evenly across multiple decades — these are stable critical categories rather than aesthetic moments.
- **Switch to *global normalization*** to see which nanogenres have absolute volume vs. just temporal shape — many rows go nearly invisible because their entire decade run is dwarfed by, say, *mumblecore*'s 2000s peak.
- **Switch to *earliest decade* sort** to surface a chronological wall: pre-war canons (italian neorealism, classical hollywood) at the top, internet-era stuff at the bottom.
