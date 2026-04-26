<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCenter,
		forceCollide,
		type Simulation,
		type SimulationNodeDatum,
		type SimulationLinkDatum
	} from 'd3-force';
	import type { PageData } from './$types';
	import type { OverlapNode, OverlapLink } from '$lib/datasets';
	import { base } from '$app/paths';

	let { data }: { data: PageData } = $props();

	type SimNode = OverlapNode & SimulationNodeDatum;
	type SimLink = SimulationLinkDatum<SimNode> & { weight: number };

	const W = 1000;
	const H = 700;

	// Reactive copies of the graph (with x/y filled in by simulation).
	let nodes = $state<SimNode[]>([]);
	let links = $state<SimLink[]>([]);

	// Edge filter: minimum shared films required to draw a link.
	// Recomputed locally — `data.graph` already filters at >= 2.
	let minShared = $state(3);

	const filteredLinks = $derived(data.graph.links.filter((l) => l.weight >= minShared));
	const linkedSlugs = $derived(
		new Set(filteredLinks.flatMap((l) => [l.source as string, l.target as string]))
	);
	const filteredNodes = $derived(data.graph.nodes.filter((n) => linkedSlugs.has(n.id)));

	let hovered = $state<string | null>(null);
	const hoveredNeighbors = $derived(neighborsOf(hovered));

	function neighborsOf(id: string | null): Set<string> {
		if (!id) return new Set();
		const out = new Set<string>([id]);
		for (const l of links) {
			const s = (l.source as SimNode).id ?? (l.source as unknown as string);
			const t = (l.target as SimNode).id ?? (l.target as unknown as string);
			if (s === id) out.add(t as string);
			if (t === id) out.add(s as string);
		}
		return out;
	}

	let sim: Simulation<SimNode, SimLink> | null = null;

	function startSim() {
		stopSim();
		// Clone for d3-force (it mutates the array contents).
		nodes = filteredNodes.map((n) => ({ ...n }));
		links = filteredLinks.map((l) => ({ ...l }));

		// Scale node radius by canonical_count (sqrt for visual area).
		const sizeScale = (s: number) => 6 + Math.sqrt(s) * 1.6;

		sim = forceSimulation<SimNode, SimLink>(nodes)
			.force(
				'link',
				forceLink<SimNode, SimLink>(links)
					.id((d) => d.id)
					.distance((l) => 80 + 40 / Math.sqrt(l.weight))
					.strength((l) => Math.min(1, l.weight / 8))
			)
			.force('charge', forceManyBody().strength(-260))
			.force('center', forceCenter(W / 2, H / 2))
			.force(
				'collide',
				forceCollide<SimNode>().radius((d) => sizeScale(d.size) + 4)
			)
			.alpha(1)
			.alphaDecay(0.025)
			.on('tick', () => {
				// Trigger reactivity by reassigning references.
				nodes = nodes;
				links = links;
			});
	}

	function stopSim() {
		if (sim) {
			sim.stop();
			sim = null;
		}
	}

	onMount(startSim);
	onDestroy(stopSim);

	// Restart when the edge threshold changes.
	$effect(() => {
		// Touch the deps so the effect re-runs.
		void filteredNodes.length;
		void filteredLinks.length;
		startSim();
	});

	function radius(n: SimNode) {
		return 6 + Math.sqrt(n.size) * 1.6;
	}

	function linkOpacity(l: SimLink): number {
		if (!hovered) return Math.min(1, 0.15 + l.weight / 20);
		const s = (l.source as SimNode).id;
		const t = (l.target as SimNode).id;
		return s === hovered || t === hovered ? 0.9 : 0.05;
	}

	function nodeOpacity(n: SimNode): number {
		if (!hovered) return 1;
		return hoveredNeighbors.has(n.id) ? 1 : 0.2;
	}
</script>

<a class="back" href="{base}/">← all nanogenres</a>
<h1>Overlap graph</h1>
<p class="meta">
	Each node is a nanogenre; an edge connects two nanogenres that share at least
	<strong>{minShared}</strong> canonical films. Node size = number of canonical films. Edge opacity =
	intersection weight.
	<br />
	{filteredNodes.length} of {data.graph.nodes.length} nanogenres connected · {filteredLinks.length} edges.
</p>

<div class="controls">
	<label>
		Min shared films
		<input type="range" min="2" max="20" step="1" bind:value={minShared} />
		<span class="num">{minShared}</span>
	</label>
</div>

<div class="graph-wrap">
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="overlap graph">
		<g class="links">
			{#each links as l, i (i)}
				<line
					x1={(l.source as SimNode).x ?? 0}
					y1={(l.source as SimNode).y ?? 0}
					x2={(l.target as SimNode).x ?? 0}
					y2={(l.target as SimNode).y ?? 0}
					stroke="var(--accent-2)"
					stroke-width={Math.min(4, 0.5 + Math.sqrt(l.weight))}
					opacity={linkOpacity(l)}
				/>
			{/each}
		</g>
		<g class="nodes">
			{#each nodes as n (n.id)}
				<g
					transform="translate({n.x ?? 0}, {n.y ?? 0})"
					opacity={nodeOpacity(n)}
					onmouseenter={() => (hovered = n.id)}
					onmouseleave={() => (hovered = null)}
					role="button"
					tabindex="0"
				>
					<a href="{base}/nanogenres/{n.id}">
						<circle r={radius(n)} fill="var(--card)" stroke="var(--accent)" stroke-width="1.5" />
						<text
							y={radius(n) + 12}
							text-anchor="middle"
							font-size="11"
							fill={hovered === n.id ? 'var(--fg)' : 'var(--dim)'}
						>
							{n.label}
						</text>
					</a>
				</g>
			{/each}
		</g>
	</svg>
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
		margin: 0 0 18px;
		font-size: 13px;
		color: var(--dim);
		display: flex;
		gap: 14px;
		align-items: center;
	}
	.controls label {
		display: inline-flex;
		gap: 8px;
		align-items: center;
	}
	.controls input[type='range'] {
		width: 220px;
		accent-color: var(--accent-2);
	}
	.num {
		color: var(--fg);
		font-variant-numeric: tabular-nums;
		min-width: 1.5em;
		text-align: right;
	}
	.graph-wrap {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	g.nodes a {
		text-decoration: none;
	}
	circle {
		transition: fill 120ms;
		cursor: pointer;
	}
	g.nodes g:hover circle {
		fill: var(--accent);
	}
	text {
		pointer-events: none;
		user-select: none;
	}
</style>
