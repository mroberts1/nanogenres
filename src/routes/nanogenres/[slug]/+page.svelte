<script lang="ts">
	import type { PageData } from './$types';
	import { base } from '$app/paths';

	let { data }: { data: PageData } = $props();

	const ng = $derived(data.nanogenre);

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

<a class="back" href="{base}/">← all nanogenres</a>
<h1>{ng.query}</h1>
<p class="meta">
	{ng.source_list_count} source lists · {ng.canonical_count} canonical films · drawn from {ng.films_considered}
	candidate films · min appearances: {ng.min_list_appearances_used}
</p>

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
					<td><a href={f.url} target="_blank" rel="noopener">{f.title}</a></td>
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
	<h2>Source lists</h2>
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
		margin: 0 0 28px;
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
