<script lang="ts">
	import {
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCollide,
		forceX,
		forceY,
		type Simulation,
		type SimulationNodeDatum,
		type SimulationLinkDatum
	} from 'd3-force';
	import type { PageData } from './$types';
	import type {
		DirectorNode,
		DirectorNanogenreNode,
		DirectorLink
	} from '$lib/datasets';
	import { base } from '$app/paths';
	import UsageGuide from '$lib/UsageGuide.svelte';

	let { data }: { data: PageData } = $props();

	type Kind = 'director' | 'nanogenre';
	type SimNode = SimulationNodeDatum & {
		id: string;
		kind: Kind;
		// Director-only fields
		name?: string;
		totalFilms?: number;
		nanogenreCount?: number;
		// Nanogenre-only fields
		slug?: string;
		label?: string;
		size?: number;
	};
	type SimLink = SimulationLinkDatum<SimNode> & { value: number };

	const W = 1100;
	const H = 720;

	// Min nanogenres a director must bridge to be shown.
	let minNanogenres = $state(6);

	// View snapshot, reassigned each tick so Svelte 5 picks up changes.
	let view = $state<{ nodes: SimNode[]; links: SimLink[] }>({ nodes: [], links: [] });

	let hovered = $state<string | null>(null);

	let simNodes: SimNode[] = [];
	let simLinks: SimLink[] = [];
	let sim: Simulation<SimNode, SimLink> | null = null;

	function radius(n: SimNode): number {
		if (n.kind === 'nanogenre') return 5 + Math.sqrt(n.size ?? 0) * 1.4;
		return 4 + Math.sqrt(n.totalFilms ?? 0) * 1.6;
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

		const dirs = data.constellation.directors.filter((d) => d.nanogenreCount >= threshold);
		const dirIds = new Set(dirs.map((d) => d.id));
		const links = data.constellation.links.filter((l) => dirIds.has(l.source));
		const usedNgIds = new Set(links.map((l) => l.target));
		const ngs = data.constellation.nanogenres.filter((n) => usedNgIds.has(n.id));

		// Initial seed: directors on a vertical strip at x=W*0.3,
		// nanogenres at x=W*0.75. Vertical position = index/total.
		simNodes = [
			...dirs.map((d: DirectorNode, i) => ({
				id: d.id,
				kind: 'director' as const,
				name: d.name,
				totalFilms: d.totalFilms,
				nanogenreCount: d.nanogenreCount,
				x: W * 0.3,
				y: H * (0.05 + 0.9 * (i / Math.max(1, dirs.length - 1)))
			})),
			...ngs.map((n: DirectorNanogenreNode, i) => ({
				id: n.id,
				kind: 'nanogenre' as const,
				slug: n.slug,
				label: n.label,
				size: n.size,
				x: W * 0.75,
				y: H * (0.05 + 0.9 * (i / Math.max(1, ngs.length - 1)))
			}))
		];
		simLinks = links.map((l: DirectorLink) => ({ ...l }));

		sim = forceSimulation<SimNode, SimLink>(simNodes)
			.force(
				'link',
				forceLink<SimNode, SimLink>(simLinks)
					.id((d) => d.id)
					.distance(160)
					.strength((l) => Math.min(0.6, (l.value as number) / 10))
			)
			.force('charge', forceManyBody<SimNode>().strength(-180).distanceMax(380))
			.force(
				'x',
				forceX<SimNode>((n) => (n.kind === 'director' ? W * 0.3 : W * 0.75)).strength(0.32)
			)
			.force('y', forceY<SimNode>(H / 2).strength(0.06))
			.force(
				'collide',
				forceCollide<SimNode>()
					.radius((d) => radius(d) + 4)
					.strength(0.95)
			)
			.alpha(1)
			.alphaDecay(0.02)
			.on('tick', () => {
				view = {
					nodes: simNodes.map((n) => ({ ...n })),
					links: simLinks.map((l) => ({ ...l }))
				};
			});
	}

	function stopSim() {
		if (sim) {
			sim.stop();
			sim = null;
		}
	}

	$effect(() => {
		startSim(minNanogenres);
		return stopSim;
	});

	const visibleDirs = $derived(view.nodes.filter((n) => n.kind === 'director').length);
	const visibleNgs = $derived(view.nodes.filter((n) => n.kind === 'nanogenre').length);

	function linkOpacity(l: SimLink): number {
		const s = (l.source as SimNode).id;
		const t = (l.target as SimNode).id;
		if (!hovered) return Math.min(0.7, 0.15 + (l.value as number) / 8);
		return s === hovered || t === hovered ? 0.85 : 0.04;
	}

	function nodeOpacity(n: SimNode): number {
		if (!hovered) return 1;
		return neighborsOf(hovered).has(n.id) ? 1 : 0.18;
	}

	const totalDirsAvailable = $derived(data.constellation.directors.length);
</script>

<svelte:head>
	<title>Director Constellation — 100 Film Aesthetics</title>
</svelte:head>

<a class="back" href="{base}/">← all aesthetics</a>
<h1>Director constellation</h1>
<p class="meta">
	Bipartite graph of directors who appear in at least
	<strong>{minNanogenres}</strong>
	distinct aesthetics (left, blue) and the aesthetics they bridge (right, pink). Edge width =
	number of canonical films from that director in that aesthetic.
	<br />
	{visibleDirs} directors · {visibleNgs} aesthetics · {view.links.length} links. ({totalDirsAvailable}
	directors total bridge ≥2 aesthetics.)
</p>

{#if data.guide}
	<UsageGuide html={data.guide} />
{/if}

<div class="controls">
	<label>
		Min aesthetics bridged
		<input type="range" min="2" max="10" step="1" bind:value={minNanogenres} />
		<span class="num">{minNanogenres}</span>
	</label>
</div>

<div class="graph-wrap">
	<svg
		viewBox="0 0 {W} {H}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="director constellation"
	>
		<g class="links">
			{#each view.links as l, i (i)}
				<line
					x1={(l.source as SimNode).x ?? 0}
					y1={(l.source as SimNode).y ?? 0}
					x2={(l.target as SimNode).x ?? 0}
					y2={(l.target as SimNode).y ?? 0}
					stroke="var(--accent-2)"
					stroke-width={Math.min(3.5, 0.5 + Math.sqrt(l.value as number))}
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
					{#if n.kind === 'nanogenre'}
						<a href="{base}/nanogenres/{n.slug}">
							<circle
								r={radius(n)}
								fill="var(--card)"
								stroke="var(--accent)"
								stroke-width="1.5"
							/>
							<text
								x={radius(n) + 6}
								text-anchor="start"
								dominant-baseline="middle"
								font-size="11"
								fill={hovered === n.id ? 'var(--fg)' : 'var(--dim)'}
							>
								{n.label}
							</text>
						</a>
					{:else}
						<circle
							r={radius(n)}
							fill="var(--card)"
							stroke="var(--accent-2)"
							stroke-width="1.5"
						/>
						<text
							x={-(radius(n) + 6)}
							text-anchor="end"
							dominant-baseline="middle"
							font-size="11"
							fill={hovered === n.id ? 'var(--fg)' : 'var(--dim)'}
						>
							{n.name}
						</text>
					{/if}
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
