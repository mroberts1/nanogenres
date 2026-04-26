<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>Nanogenres</h1>
<p class="lede">
	A <em>nanogenre</em> is a community-named, hyper-specific cinema category that cuts across
	traditional genres — a blend of mood, aesthetic, character type, and cultural framing. This
	catalog is computed from Letterboxd user lists: each entry's canonical films are the ones that
	recur across many independent lists using the same phrase.
</p>
<p class="count">
	{data.summaries.length} nanogenres
	<span class="sep">·</span>
	<a href="/graph">overlap graph →</a>
</p>

<div class="grid">
	{#each data.summaries as n (n.slug)}
		<a class="card" href="/nanogenres/{n.slug}">
			<h2>{n.query}</h2>
			<div class="stats">
				{n.source_list_count} lists · {n.canonical_count} canonical films
			</div>
			<div class="top">
				{#each n.top_films as f, i (f.title + i)}
					<strong>{f.title}</strong>
					{#if f.year}({f.year}){/if}{#if i < n.top_films.length - 1} · {/if}
				{/each}
			</div>
		</a>
	{/each}
</div>

<style>
	h1 {
		font-size: 38px;
		margin: 0 0 8px;
		letter-spacing: -0.02em;
	}
	.lede {
		color: var(--dim);
		margin: 0 0 12px;
		max-width: 640px;
	}
	.lede em {
		color: var(--accent);
		font-style: normal;
	}
	.count {
		color: var(--dim);
		font-size: 13px;
		margin: 0 0 28px;
	}
	.sep {
		opacity: 0.5;
		margin: 0 6px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}
	.card {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 18px 20px;
		display: block;
		color: inherit;
		transition:
			border-color 120ms,
			transform 120ms;
	}
	.card:hover {
		border-color: var(--accent);
		transform: translateY(-1px);
		text-decoration: none;
	}
	.card h2 {
		margin: 0 0 6px;
		font-size: 19px;
		letter-spacing: -0.01em;
		color: var(--fg);
	}
	.stats {
		color: var(--dim);
		font-size: 12px;
		margin-bottom: 10px;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.03em;
	}
	.top {
		color: var(--dim);
		font-size: 13px;
	}
	.top strong {
		color: var(--fg);
		font-weight: 500;
	}
</style>
