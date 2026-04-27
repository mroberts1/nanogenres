<script lang="ts">
	import type { PageData } from './$types';
	import type { ScatterPoint } from '$lib/datasets';
	import { base } from '$app/paths';

	let { data }: { data: PageData } = $props();

	let focusSlug = $state<string>(''); // '' = no focus, show all in dim gray
	let hovered = $state<ScatterPoint | null>(null);

	// Plot geometry (viewBox coords).
	const W = 1000;
	const H = 600;
	const M = { top: 30, right: 24, bottom: 50, left: 64 };
	const innerW = W - M.left - M.right;
	const innerH = H - M.top - M.bottom;

	const X_MIN = 0.5;
	const X_MAX = 10.5;
	const Y_MIN = 1.5;
	const Y_MAX = 5.0;

	function xScale(v: number): number {
		return M.left + ((v - X_MIN) / (X_MAX - X_MIN)) * innerW;
	}
	function yScale(v: number): number {
		// Inverted: high rating = top of SVG.
		return M.top + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
	}

	// Deterministic horizontal jitter so prerendered SVG matches client.
	function jitter(p: ScatterPoint): number {
		let h = 0;
		const s = `${p.filmSlug}|${p.nanogenreSlug}`;
		for (let i = 0; i < s.length; i++) {
			h = (h * 31 + s.charCodeAt(i)) | 0;
		}
		return ((((h % 1000) + 1000) % 1000) / 1000 - 0.5) * 0.55;
	}

	const xTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const yTicks = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

	const pointsRendered = $derived(
		data.points.map((p) => ({
			p,
			x: xScale(p.appearsInNLists + jitter(p)),
			y: yScale(p.rating)
		}))
	);

	const focusPoints = $derived(
		focusSlug ? data.points.filter((p) => p.nanogenreSlug === focusSlug) : []
	);

	const focusStats = $derived.by(() => {
		if (focusPoints.length === 0) return null;
		const ratings = focusPoints.map((p) => p.rating).sort((a, b) => a - b);
		const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
		const median = ratings[Math.floor(ratings.length / 2)];
		const high = [...focusPoints].sort((a, b) => b.rating - a.rating).slice(0, 3);
		const low = [...focusPoints].sort((a, b) => a.rating - b.rating).slice(0, 3);
		return { count: focusPoints.length, mean, median, high, low };
	});

	function pointFill(p: ScatterPoint): string {
		if (!focusSlug) return 'var(--accent-2)';
		return p.nanogenreSlug === focusSlug ? 'var(--accent)' : 'var(--accent-2)';
	}

	function pointOpacity(p: ScatterPoint): number {
		if (!focusSlug) return 0.35;
		return p.nanogenreSlug === focusSlug ? 0.9 : 0.05;
	}
</script>

<a class="back" href="{base}/">← all nanogenres</a>
<h1>Rating × canonicality</h1>
<p class="meta">
	Every (canonical film, nanogenre) pair as one dot. Horizontal axis = number of source lists the
	film appears in for that nanogenre (1–10). Vertical axis = aggregate Letterboxd rating. Films
	without a Letterboxd rating are dropped.
	<br />
	{data.points.length} points across {data.nanogenres.length} nanogenres.
</p>

<div class="controls">
	<label>
		Focus a nanogenre
		<select bind:value={focusSlug}>
			<option value="">All (dim view)</option>
			{#each data.nanogenres as ng (ng.slug)}
				<option value={ng.slug}>{ng.label}</option>
			{/each}
		</select>
	</label>
	{#if focusSlug}
		<button class="clear" onclick={() => (focusSlug = '')}>clear</button>
	{/if}
</div>

<div class="layout">
	<div class="plot-wrap">
		<svg
			viewBox="0 0 {W} {H}"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label="rating vs canonicality scatter"
		>
			<!-- gridlines -->
			<g class="grid">
				{#each xTicks as t (t)}
					<line
						x1={xScale(t)}
						y1={M.top}
						x2={xScale(t)}
						y2={H - M.bottom}
						stroke="var(--line)"
						stroke-width="1"
					/>
				{/each}
				{#each yTicks as t (t)}
					<line
						x1={M.left}
						y1={yScale(t)}
						x2={W - M.right}
						y2={yScale(t)}
						stroke="var(--line)"
						stroke-width="1"
					/>
				{/each}
			</g>

			<!-- points -->
			<g class="points">
				{#each pointsRendered as { p, x, y } (p.filmSlug + '|' + p.nanogenreSlug)}
					<circle
						cx={x}
						cy={y}
						r={focusSlug && p.nanogenreSlug === focusSlug ? 4.5 : 3}
						fill={pointFill(p)}
						opacity={pointOpacity(p)}
						onmouseenter={() => (hovered = p)}
						onmouseleave={() => (hovered = null)}
					>
						<title>
							{p.title}{p.year ? ` (${p.year})` : ''} · {p.nanogenreLabel} · rating {p.rating} · in {p.appearsInNLists}
							lists
						</title>
					</circle>
				{/each}
			</g>

			<!-- axes -->
			<g class="axes">
				<line
					x1={M.left}
					y1={H - M.bottom}
					x2={W - M.right}
					y2={H - M.bottom}
					stroke="var(--dim)"
					stroke-width="1"
				/>
				<line x1={M.left} y1={M.top} x2={M.left} y2={H - M.bottom} stroke="var(--dim)" stroke-width="1" />
				{#each xTicks as t (t)}
					<text x={xScale(t)} y={H - M.bottom + 16} text-anchor="middle" font-size="11" fill="var(--dim)">{t}</text>
				{/each}
				{#each yTicks as t (t)}
					<text x={M.left - 8} y={yScale(t) + 4} text-anchor="end" font-size="11" fill="var(--dim)">{t.toFixed(1)}</text>
				{/each}
				<text x={M.left + innerW / 2} y={H - 12} text-anchor="middle" font-size="12" fill="var(--fg)">
					Number of source lists the film appears in
				</text>
				<text
					x={-((H - M.bottom) / 2 + M.top / 2)}
					y={16}
					text-anchor="middle"
					font-size="12"
					fill="var(--fg)"
					transform="rotate(-90)"
				>
					Letterboxd rating
				</text>
			</g>
		</svg>
	</div>

	<aside class="side">
		{#if focusStats && focusSlug}
			{@const focusLabel = data.nanogenres.find((n) => n.slug === focusSlug)?.label ?? focusSlug}
			<div class="card">
				<h3>
					<a href="{base}/nanogenres/{focusSlug}">{focusLabel}</a>
				</h3>
				<dl>
					<div>
						<dt>Films with rating</dt>
						<dd>{focusStats.count}</dd>
					</div>
					<div>
						<dt>Mean rating</dt>
						<dd>{focusStats.mean.toFixed(2)}</dd>
					</div>
					<div>
						<dt>Median rating</dt>
						<dd>{focusStats.median.toFixed(2)}</dd>
					</div>
				</dl>
				<h4>Highest-rated</h4>
				<ul>
					{#each focusStats.high as f (f.filmSlug)}
						<li>
							<span class="rating">{f.rating}</span>
							<span class="title">{f.title}{f.year ? ` (${f.year})` : ''}</span>
						</li>
					{/each}
				</ul>
				<h4>Lowest-rated</h4>
				<ul>
					{#each focusStats.low as f (f.filmSlug)}
						<li>
							<span class="rating">{f.rating}</span>
							<span class="title">{f.title}{f.year ? ` (${f.year})` : ''}</span>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<div class="card hint">
				<p>Select a nanogenre to highlight its films, see its rating summary, and surface the highest/lowest-rated entries in its canon.</p>
				<p>The dim view above shows every (film, nanogenre) pair across the catalog at once — useful for spotting global structure (e.g. is the catalog rating-skewed? does canonicality correlate with rating?).</p>
			</div>
		{/if}
		{#if hovered}
			<div class="card hover">
				<h4>{hovered.title}{hovered.year ? ` (${hovered.year})` : ''}</h4>
				<p>
					<a href="{base}/nanogenres/{hovered.nanogenreSlug}">{hovered.nanogenreLabel}</a>
					· rating {hovered.rating} · in {hovered.appearsInNLists} lists
				</p>
			</div>
		{/if}
	</aside>
</div>

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
		margin: 0 0 18px;
	}
	.controls {
		margin: 0 0 18px;
		font-size: 13px;
		color: var(--dim);
		display: flex;
		gap: 12px;
		align-items: center;
	}
	.controls label {
		display: inline-flex;
		gap: 8px;
		align-items: center;
	}
	.controls select {
		background: var(--card);
		color: var(--fg);
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 4px 6px;
		font-size: 13px;
	}
	.controls .clear {
		background: transparent;
		color: var(--dim);
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 12px;
		cursor: pointer;
	}
	.controls .clear:hover {
		color: var(--fg);
		border-color: var(--accent);
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 280px;
		gap: 18px;
		align-items: start;
	}
	@media (max-width: 880px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	.plot-wrap {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 8px;
		overflow: hidden;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	circle {
		transition: r 80ms;
		cursor: pointer;
	}
	circle:hover {
		r: 6;
	}
	.side .card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 14px 16px;
		font-size: 13px;
		margin-bottom: 12px;
	}
	.side h3 {
		margin: 0 0 10px;
		font-size: 16px;
	}
	.side h3 a {
		color: var(--fg);
	}
	.side h4 {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--dim);
		margin: 12px 0 6px;
		font-weight: 500;
	}
	.side dl {
		margin: 0;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 4px 12px;
		font-variant-numeric: tabular-nums;
	}
	.side dl div {
		display: contents;
	}
	.side dt {
		color: var(--dim);
		font-size: 12px;
	}
	.side dd {
		margin: 0;
		text-align: right;
		color: var(--fg);
	}
	.side ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.side li {
		display: flex;
		gap: 8px;
		padding: 3px 0;
		font-size: 12px;
	}
	.side .rating {
		color: var(--accent);
		font-variant-numeric: tabular-nums;
		min-width: 2.5em;
	}
	.side .title {
		color: var(--fg);
		flex: 1;
	}
	.side .hint p {
		margin: 0 0 8px;
		color: var(--dim);
	}
	.side .hover h4 {
		color: var(--fg);
		text-transform: none;
		letter-spacing: 0;
		margin: 0 0 4px;
		font-size: 13px;
	}
	.side .hover p {
		margin: 0;
		color: var(--dim);
	}
</style>
