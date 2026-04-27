<script lang="ts">
	import type { PageData } from './$types';
	import type { DecadeRow } from '$lib/datasets';
	import { base } from '$app/paths';
	import UsageGuide from '$lib/UsageGuide.svelte';

	let { data }: { data: PageData } = $props();

	type SortKey = 'total' | 'earliest' | 'alpha';
	type Norm = 'row' | 'global';

	let sortKey = $state<SortKey>('total');
	let norm = $state<Norm>('row');
	let hovered = $state<{ row: number; col: number } | null>(null);

	const decadeIdx = $derived(
		new Map(data.matrix.decades.map((d, i) => [d, i]))
	);

	function rowSortValue(r: DecadeRow): number | string {
		if (sortKey === 'alpha') return r.label.toLowerCase();
		if (sortKey === 'earliest') {
			const i = r.earliest ? (decadeIdx.get(r.earliest) ?? Infinity) : Infinity;
			return i;
		}
		return -r.total;
	}

	const sortedRows = $derived(
		[...data.matrix.rows].sort((a, b) => {
			const va = rowSortValue(a);
			const vb = rowSortValue(b);
			if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb);
			return (va as number) - (vb as number);
		})
	);

	function intensity(count: number, rowMax: number): number {
		if (count === 0) return 0;
		const max = norm === 'row' ? Math.max(1, rowMax) : Math.max(1, data.matrix.globalMax);
		// Square-root scaling so small counts are still visible.
		return Math.min(1, Math.sqrt(count / max));
	}
</script>

<a class="back" href="{base}/">← all nanogenres</a>
<h1>Catalog decade heatmap</h1>
<p class="meta">
	Each row is a nanogenre; each column is a decade. Cell intensity =
	<strong>{norm === 'row' ? 'films from that decade as a share of this nanogenre' : 'films from that decade in absolute terms'}</strong>.
	Hover any cell for the exact count.
	<br />
	{data.matrix.rows.length} nanogenres · {data.matrix.decades[0]}–{data.matrix.decades.at(-1)}.
</p>

{#if data.guide}
	<UsageGuide html={data.guide} />
{/if}

<div class="controls">
	<label>
		Sort
		<select bind:value={sortKey}>
			<option value="total">By canonical films (most first)</option>
			<option value="earliest">By earliest decade</option>
			<option value="alpha">Alphabetical</option>
		</select>
	</label>
	<label>
		Normalize
		<select bind:value={norm}>
			<option value="row">Per nanogenre (temporal shape)</option>
			<option value="global">Globally (absolute counts)</option>
		</select>
	</label>
</div>

<div class="heatmap-wrap">
	<table class="heatmap">
		<thead>
			<tr>
				<th class="row-head"></th>
				{#each data.matrix.decades as d, ci (d)}
					<th class="col-head" class:active={hovered?.col === ci}>{d}</th>
				{/each}
				<th class="row-head total-head">total</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedRows as r, ri (r.slug)}
				<tr class:active={hovered?.row === ri}>
					<th class="row-head">
						<a href="{base}/nanogenres/{r.slug}">{r.label}</a>
					</th>
					{#each r.counts as c, ci (ci)}
						<td
							class="cell"
							class:zero={c === 0}
							style="--i: {intensity(c, r.rowMax)}"
							title={c > 0 ? `${r.label} · ${data.matrix.decades[ci]} · ${c} canonical films` : ''}
							onmouseenter={() => (hovered = { row: ri, col: ci })}
							onmouseleave={() => (hovered = null)}
						>
							{c > 0 ? c : ''}
						</td>
					{/each}
					<td class="total">{r.total}</td>
				</tr>
			{/each}
		</tbody>
	</table>
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
	.meta strong {
		color: var(--fg);
		font-weight: 500;
	}
	.controls {
		display: flex;
		gap: 18px;
		flex-wrap: wrap;
		margin: 0 0 18px;
		font-size: 13px;
		color: var(--dim);
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
	.heatmap-wrap {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 12px;
		overflow: auto;
	}
	table.heatmap {
		border-collapse: collapse;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}
	th.row-head,
	td.total {
		text-align: left;
		padding: 0 12px;
		font-weight: 500;
		color: var(--fg);
		white-space: nowrap;
	}
	th.row-head a {
		color: inherit;
		font-size: 12px;
	}
	th.row-head a:hover {
		color: var(--accent);
		text-decoration: none;
	}
	th.row-head.total-head {
		color: var(--dim);
		font-weight: 500;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: right;
	}
	td.total {
		text-align: right;
		color: var(--dim);
		font-size: 12px;
	}
	th.col-head {
		color: var(--dim);
		font-weight: 500;
		padding: 0 6px 6px;
		font-size: 11px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		min-width: 48px;
	}
	th.col-head.active {
		color: var(--fg);
	}
	tr.active th.row-head a {
		color: var(--accent);
	}
	td.cell {
		width: 48px;
		min-width: 48px;
		height: 22px;
		text-align: center;
		color: var(--bg);
		background-color: rgba(var(--heat-rgb), var(--i, 0));
		border: 1px solid transparent;
		font-size: 10px;
		font-weight: 600;
		transition:
			background-color 80ms,
			border-color 80ms;
	}
	td.cell.zero {
		background-color: transparent;
		color: transparent;
	}
	td.cell:hover {
		border-color: var(--accent);
		color: var(--fg);
	}
</style>
