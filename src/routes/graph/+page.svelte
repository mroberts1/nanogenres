<script lang="ts">
	import {
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCenter,
		forceCollide,
		forceX,
		forceY,
		type Simulation,
		type SimulationNodeDatum,
		type SimulationLinkDatum
	} from 'd3-force';
	import type { PageData } from './$types';
	import type { OverlapNode, OverlapLink } from '$lib/datasets';
	import { base } from '$app/paths';
	import UsageGuide from '$lib/UsageGuide.svelte';

	let { data }: { data: PageData } = $props();

	type SimNode = OverlapNode & SimulationNodeDatum;
	type SimLink = SimulationLinkDatum<SimNode> & { weight: number };

	const W = 1000;
	const H = 700;

	// Slider-controlled edge threshold.
	let minShared = $state(3);

	// Hover state for highlight.
	let hovered = $state<string | null>(null);

	// Reactive view: rebuilt as a fresh array on every simulation tick so
	// Svelte 5's runes reactivity actually picks up the change.
	let view = $state<{ nodes: SimNode[]; links: SimLink[] }>({ nodes: [], links: [] });

	// Underlying d3-force-owned arrays (NOT $state — d3 mutates these in place).
	let simNodes: SimNode[] = [];
	let simLinks: SimLink[] = [];
	let sim: Simulation<SimNode, SimLink> | null = null;

	function radius(n: { size: number }) {
		return 6 + Math.sqrt(n.size) * 1.6;
	}

	function neighborsOf(id: string | null): Set<string> {
		if (!id) return new Set();
		const out = new Set<string>([id]);
		for (const l of view.links) {
			const s = (l.source as SimNode).id ?? (l.source as unknown as string);
			const t = (l.target as SimNode).id ?? (l.target as unknown as string);
			if (s === id) out.add(t as string);
			if (t === id) out.add(s as string);
		}
		return out;
	}

	function startSim(threshold: number) {
		stopSim();

		const filteredLinks = data.graph.links.filter((l) => l.weight >= threshold);
		const linkedSlugs = new Set(
			filteredLinks.flatMap((l) => [l.source as string, l.target as string])
		);
		const filteredNodes = data.graph.nodes.filter((n) => linkedSlugs.has(n.id));

		// Seed positions across the canvas so the first frame already shows
		// nodes spread out instead of clumped at the phyllotactic origin.
		simNodes = filteredNodes.map((n, i) => {
			const angle = (i / filteredNodes.length) * Math.PI * 2;
			const r = Math.min(W, H) * 0.35;
			return {
				...n,
				x: W / 2 + Math.cos(angle) * r,
				y: H / 2 + Math.sin(angle) * r
			};
		});
		simLinks = filteredLinks.map((l) => ({ ...l }));

		sim = forceSimulation<SimNode, SimLink>(simNodes)
			.force(
				'link',
				forceLink<SimNode, SimLink>(simLinks)
					.id((d) => d.id)
					.distance((l) => 80 + 40 / Math.sqrt(l.weight))
					.strength((l) => Math.min(1, l.weight / 10))
			)
			.force('charge', forceManyBody<SimNode>().strength(-280).distanceMax(450))
			.force('center', forceCenter(W / 2, H / 2).strength(1))
			.force('x', forceX<SimNode>(W / 2).strength(0.05))
			.force('y', forceY<SimNode>(H / 2).strength(0.05))
			.force(
				'collide',
				forceCollide<SimNode>()
					.radius((d) => radius(d) + 6)
					.strength(0.9)
			)
			.alpha(1)
			.alphaDecay(0.02)
			.on('tick', () => {
				// Snapshot positions into a brand-new array so the runes proxy
				// sees a real change and the template re-renders.
				view = {
					nodes: simNodes.map((n) => ({ ...n })),
					links: simLinks.map((l) => ({
						...l,
						source: l.source,
						target: l.target
					}))
				};
			});
	}

	function stopSim() {
		if (sim) {
			sim.stop();
			sim = null;
		}
	}

	// Single effect drives both initial start and slider-triggered restart.
	$effect(() => {
		startSim(minShared);
		return stopSim;
	});

	const linkedNodeCount = $derived(view.nodes.length);
	const linkCount = $derived(view.links.length);

	function linkOpacity(l: SimLink): number {
		if (!hovered) return Math.min(1, 0.15 + l.weight / 20);
		const s = (l.source as SimNode).id;
		const t = (l.target as SimNode).id;
		return s === hovered || t === hovered ? 0.9 : 0.05;
	}

	function nodeOpacity(n: SimNode): number {
		if (!hovered) return 1;
		return neighborsOf(hovered).has(n.id) ? 1 : 0.2;
	}
</script>

<svelte:head>
	<title>Overlap Graph — 100 Nanogenres of Letterboxd</title>
</svelte:head>

<a class="back" href="{base}/">← all nanogenres</a>
<h1>Overlap graph</h1>
<p class="meta">
	Each node is a nanogenre; an edge connects two nanogenres that share at least
	<strong>{minShared}</strong> canonical films. Node size = number of canonical films. Edge opacity =
	intersection weight.
	<br />
	{linkedNodeCount} of {data.graph.nodes.length} nanogenres connected · {linkCount} edges.
</p>

{#if data.guide}
	<UsageGuide html={data.guide} />
{/if}

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
			{#each view.links as l, i (i)}
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
			{#each view.nodes as n (n.id)}
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
