<script lang="ts">
	import type { PageData } from './$types';
	import { base } from '$app/paths';
	import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';
	import UsageGuide from '$lib/UsageGuide.svelte';

	let { data }: { data: PageData } = $props();

	const ng = $derived(data.nanogenre);
	const overlapping = $derived(
		ng.films.filter((f) => (data.crossMemberships[f.slug]?.length ?? 0) > 0).length
	);

	// --- Genre/country Sankey layout ---
	// Wider viewBox + label gutters so genre/country names + counts have room
	// to extend outside the bars without being clipped at the SVG edge.
	const SK_W = 900;
	const SK_H = 380;
	const SK_LABEL_PAD_L = 140;
	const SK_LABEL_PAD_R = 140;
	const skLayout = $derived.by(() => {
		if (data.sankey.nodes.length === 0 || data.sankey.links.length === 0) return null;
		const sk = sankey<
			{ id: string; name: string; layer: 0 | 1; total: number },
			{ source: string; target: string; value: number }
		>()
			.nodeId((d) => d.id)
			.nodeAlign(sankeyLeft)
			.nodeWidth(12)
			.nodePadding(10)
			.extent([
				[SK_LABEL_PAD_L, 10],
				[SK_W - SK_LABEL_PAD_R, SK_H - 10]
			]);
		return sk({
			nodes: data.sankey.nodes.map((n) => ({ ...n })),
			links: data.sankey.links.map((l) => ({ ...l }))
		});
	});
	const skLinkPath = sankeyLinkHorizontal();
	let skHovered = $state<string | null>(null);

	const topGenres = $derived(
		Object.entries(ng.aggregates.genres)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
	);
	const topDirectors = $derived(
		Object.entries(ng.aggregates.directors)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
	);
	const yearBuckets = $derived(buildDecadeBuckets(ng.aggregates.years));

	function buildDecadeBuckets(years: Record<string, number>) {
		const buckets = new Map<string, number>();
		for (const [y, n] of Object.entries(years)) {
			if (!/^\d{4}$/.test(y)) continue;
			const decade = `${y.slice(0, 3)}0s`;
			buckets.set(decade, (buckets.get(decade) ?? 0) + n);
		}
		return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	}

	const genreMax = $derived(Math.max(1, ...topGenres.map(([, n]) => n)));
	const directorMax = $derived(Math.max(1, ...topDirectors.map(([, n]) => n)));
	const yearMax = $derived(Math.max(1, ...yearBuckets.map(([, n]) => n)));
</script>

<svelte:head>
	<title>{ng.query} — 100 Film Aesthetics</title>
	<meta name="description" content="{ng.canonical_count} canonical films across {ng.source_list_count} Letterboxd lists for the '{ng.query}' aesthetic." />
</svelte:head>

<a class="back" href="{base}/">← all aesthetics</a>
<h1>{ng.query}</h1>
<p class="meta">
	Sampled from {ng.source_list_count} Letterboxd lists · {ng.canonical_count} canonical films · drawn from {ng.films_considered}
	candidate films · min appearances: {ng.min_list_appearances_used}
	{#if overlapping > 0}
		· {overlapping} also appear in other nanogenres
	{/if}
</p>
<p class="lb-link">
	<a
		href="https://letterboxd.com/search/lists/{ng.query.replace(/ /g, '+')}/"
		target="_blank"
		rel="noopener"
	>
		→ See all "{ng.query}" lists on Letterboxd
	</a>
</p>

{#if data.chipsGuide}
	<UsageGuide html={data.chipsGuide} label="Usage guide — cross-membership chips" />
{/if}

<section>
	<h2>Canonical films</h2>
	<table>
		<thead>
			<tr>
				<th>#</th>
				<th>Film</th>
				<th>Year</th>
				<th>Directors</th>
				<th>Genres</th>
				<th class="num" title="Number of source lists this film appears in">Lists</th>
				<th class="num">Rating</th>
			</tr>
		</thead>
		<tbody>
			{#each ng.films as f, i (f.slug)}
				<tr>
					<td class="num">{i + 1}</td>
					<td>
						<a href={f.url} target="_blank" rel="noopener">{f.title}</a>
						{#if data.crossMemberships[f.slug]?.length}
							<div class="chips">
								{#each data.crossMemberships[f.slug] as m (m.slug)}
									<a class="chip" href="{base}/nanogenres/{m.slug}">{m.query}</a>
								{/each}
							</div>
						{/if}
					</td>
					<td>{f.year ?? ''}</td>
					<td>{f.directors.join(', ')}</td>
					<td class="dim">{f.genres.join(', ')}</td>
					<td class="num">{f.appears_in_n_lists}</td>
					<td class="num">{f.rating ?? ''}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<section class="agg-grid">
	<div>
		<h2>Top genres</h2>
		<ul class="bars">
			{#each topGenres as [g, n] (g)}
				<li>
					<span class="bar-label">{g}</span>
					<span class="bar"><span class="fill" style="width: {(n / genreMax) * 100}%"></span></span>
					<span class="bar-num">{n}</span>
				</li>
			{/each}
		</ul>
	</div>
	<div>
		<h2>Recurring directors</h2>
		<ul class="bars">
			{#each topDirectors as [d, n] (d)}
				<li>
					<span class="bar-label">{d}</span>
					<span class="bar"
						><span class="fill" style="width: {(n / directorMax) * 100}%"></span></span
					>
					<span class="bar-num">{n}</span>
				</li>
			{/each}
		</ul>
	</div>
	<div>
		<h2>Years (by decade)</h2>
		<ul class="bars">
			{#each yearBuckets as [decade, n] (decade)}
				<li>
					<span class="bar-label">{decade}</span>
					<span class="bar"><span class="fill" style="width: {(n / yearMax) * 100}%"></span></span>
					<span class="bar-num">{n}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section>
	<h2>Sampled lists</h2>
	<p class="sources-note">
		These are the {ng.source_list_count} Letterboxd lists this nanogenre's canonical films were computed from.
		Letterboxd hosts many more lists for most nanogenres — see the full set on the Letterboxd search page linked above.
	</p>
	<ul class="sources">
		{#each ng.source_lists as src (src.href)}
			<li>
				<a href="https://letterboxd.com{src.href}" target="_blank" rel="noopener">
					{src.title ?? src.slug}
				</a>
				<span class="dim">— {src.user}</span>
			</li>
		{/each}
	</ul>
</section>

{#if skLayout}
	<section>
		<h2>Genre → country flow</h2>
		{#if data.sankeyGuide}
			<UsageGuide html={data.sankeyGuide} label="Usage guide — genre → country flow" />
		{/if}
		<p class="sankey-meta">
			How this nanogenre's canonical films decompose by traditional genre and country of
			origin. Top {data.sankey.nodes.filter((n) => n.layer === 0).length} genres on the left, top
			{data.sankey.nodes.filter((n) => n.layer === 1).length} countries on the right; flow width
			= number of canonical films with that genre/country pairing.
		</p>
		<div class="sankey-wrap">
			<svg
				viewBox="0 0 {SK_W} {SK_H}"
				preserveAspectRatio="xMidYMid meet"
				role="img"
				aria-label="genre to country sankey"
			>
				<g class="sk-links">
					{#each skLayout.links as l, i (i)}
						{@const sId = (typeof l.source === 'object' ? l.source.id : l.source) as string}
						{@const tId = (typeof l.target === 'object' ? l.target.id : l.target) as string}
						<path
							d={skLinkPath(l) ?? ''}
							stroke="var(--accent-2)"
							stroke-width={Math.max(1, l.width ?? 0)}
							fill="none"
							opacity={!skHovered || skHovered === sId || skHovered === tId ? 0.45 : 0.08}
						>
							<title>{sId.slice(2)} → {tId.slice(2)} · {l.value} films</title>
						</path>
					{/each}
				</g>
				<g class="sk-nodes">
					{#each skLayout.nodes as n (n.id)}
						<g
							onmouseenter={() => (skHovered = n.id)}
							onmouseleave={() => (skHovered = null)}
						>
							<rect
								x={n.x0}
								y={n.y0}
								width={Math.max(1, (n.x1 ?? 0) - (n.x0 ?? 0))}
								height={Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0))}
								fill="var(--accent)"
							/>
							<text
								x={n.layer === 0 ? (n.x0 ?? 0) - 6 : (n.x1 ?? 0) + 6}
								y={(((n.y0 ?? 0) + (n.y1 ?? 0)) / 2)}
								text-anchor={n.layer === 0 ? 'end' : 'start'}
								dominant-baseline="middle"
								font-size="11"
								fill="var(--fg)"
							>
								{n.name}
								<tspan fill="var(--dim)" font-size="10"> · {n.total}</tspan>
							</text>
						</g>
					{/each}
				</g>
			</svg>
		</div>
	</section>
{/if}

<style>
	.back {
		display: inline-block;
		margin-bottom: 12px;
		color: var(--dim);
		font-size: 13px;
	}
	h1 {
		font-size: 32px;
		margin: 0 0 6px;
		letter-spacing: -0.02em;
	}
	.meta {
		color: var(--dim);
		font-size: 13px;
		margin: 0 0 8px;
	}
	.lb-link {
		margin: 0 0 28px;
		font-size: 13px;
	}
	.lb-link a {
		color: var(--accent);
		text-decoration: none;
	}
	.lb-link a:hover {
		text-decoration: underline;
	}
	.sources-note {
		color: var(--dim);
		font-size: 13px;
		margin: 0 0 12px;
		max-width: 640px;
	}
	section {
		margin-bottom: 40px;
	}
	h2 {
		font-size: 18px;
		margin: 0 0 12px;
		color: var(--fg);
	}
	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 13px;
	}
	th,
	td {
		padding: 8px 10px;
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}
	th {
		color: var(--dim);
		font-weight: 500;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	td.num,
	th.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.dim {
		color: var(--dim);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}
	.chip {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--bg);
		border: 1px solid var(--line);
		color: var(--dim);
		font-size: 11px;
		line-height: 1.4;
		white-space: nowrap;
		transition:
			border-color 120ms,
			color 120ms,
			background 120ms;
	}
	.chip:hover {
		border-color: var(--accent);
		color: var(--fg);
		background: var(--card);
		text-decoration: none;
	}
	.sankey-meta {
		color: var(--dim);
		font-size: 13px;
		margin: 0 0 12px;
		max-width: 640px;
	}
	.sankey-wrap {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 12px;
		overflow: hidden;
	}
	.sankey-wrap svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.sk-links path {
		transition: opacity 100ms;
	}
	.sk-nodes rect {
		cursor: default;
	}
	.agg-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 24px;
	}
	.bars {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 13px;
	}
	.bars li {
		display: grid;
		grid-template-columns: 130px 1fr 30px;
		gap: 8px;
		align-items: center;
		padding: 4px 0;
	}
	.bar-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bar {
		background: var(--line);
		height: 6px;
		border-radius: 3px;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		background: var(--accent-2);
	}
	.bar-num {
		text-align: right;
		color: var(--dim);
		font-variant-numeric: tabular-nums;
	}
	.sources {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 14px;
	}
	.sources li {
		padding: 6px 0;
		border-bottom: 1px solid var(--line);
	}
</style>
