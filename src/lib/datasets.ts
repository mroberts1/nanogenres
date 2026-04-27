import type { Nanogenre, NanogenreSummary } from './types';

// Eager-load all nanogenre datasets at build time. Vite resolves the glob,
// so each JSON ends up bundled into the static build.
const modules = import.meta.glob<Nanogenre>('./data/*.json', {
	eager: true,
	import: 'default'
});

const bySlug = new Map<string, Nanogenre>();

for (const [path, raw] of Object.entries(modules)) {
	const slug = path.replace(/^.*\//, '').replace(/\.json$/, '');
	// File slug wins so the URL is canonical even if a dataset's own slug differs.
	bySlug.set(slug, { ...raw, slug });
}

export function getAllSlugs(): string[] {
	return [...bySlug.keys()].sort();
}

export function getNanogenre(slug: string): Nanogenre | undefined {
	return bySlug.get(slug);
}

export function getAllNanogenres(): Nanogenre[] {
	return [...bySlug.values()];
}

export function getSummaries(): NanogenreSummary[] {
	return getAllNanogenres()
		.map((n) => ({
			slug: n.slug,
			query: n.query,
			source_list_count: n.source_list_count,
			canonical_count: n.canonical_count,
			top_films: n.films.slice(0, 3).map((f) => ({ title: f.title, year: f.year }))
		}))
		.sort((a, b) => b.canonical_count - a.canonical_count);
}

// ---- Cross-nanogenre derivations ----

export interface OverlapNode {
	id: string; // slug
	label: string; // query phrase
	size: number; // canonical_count
}

export interface OverlapLink {
	source: string;
	target: string;
	weight: number; // number of shared canonical films
}

export interface OverlapGraph {
	nodes: OverlapNode[];
	links: OverlapLink[];
}

/**
 * Build a film -> [nanogenre slug, ...] index across the catalog.
 * Useful for cross-membership badges and overlap analysis.
 */
export function getFilmMembership(): Map<string, string[]> {
	const out = new Map<string, string[]>();
	for (const ng of getAllNanogenres()) {
		for (const f of ng.films) {
			const arr = out.get(f.slug) ?? [];
			arr.push(ng.slug);
			out.set(f.slug, arr);
		}
	}
	return out;
}

export interface DecadeRow {
	slug: string;
	label: string;
	/** Counts aligned with the matrix `decades` array. */
	counts: number[];
	total: number;
	rowMax: number;
	/** Earliest/latest decade with a non-zero count, or null if no dated films. */
	earliest: string | null;
	latest: string | null;
}

export interface DecadeMatrix {
	decades: string[];
	rows: DecadeRow[];
	/** Largest single-cell count across the entire matrix (for global normalization). */
	globalMax: number;
}

/**
 * Bucket every nanogenre's canonical-film year aggregates into decades to
 * produce a (nanogenre x decade) matrix suitable for a heatmap.
 */
export function getCatalogDecadeMatrix(): DecadeMatrix {
	const all = getAllNanogenres();

	let minYear = Infinity;
	let maxYear = -Infinity;
	for (const ng of all) {
		for (const y of Object.keys(ng.aggregates.years)) {
			if (!/^\d{4}$/.test(y)) continue;
			const n = +y;
			if (n < minYear) minYear = n;
			if (n > maxYear) maxYear = n;
		}
	}
	if (!isFinite(minYear)) {
		minYear = 2000;
		maxYear = 2020;
	}

	const minDecade = Math.floor(minYear / 10) * 10;
	const maxDecade = Math.floor(maxYear / 10) * 10;
	const decades: string[] = [];
	for (let d = minDecade; d <= maxDecade; d += 10) decades.push(`${d}s`);

	let globalMax = 0;
	const rows: DecadeRow[] = all.map((ng) => {
		const counts = decades.map(() => 0);
		for (const [y, c] of Object.entries(ng.aggregates.years)) {
			if (!/^\d{4}$/.test(y)) continue;
			const decade = Math.floor(+y / 10) * 10;
			const idx = (decade - minDecade) / 10;
			if (idx >= 0 && idx < counts.length) counts[idx] += c;
		}
		const total = counts.reduce((a, b) => a + b, 0);
		const rowMax = Math.max(0, ...counts);
		if (rowMax > globalMax) globalMax = rowMax;
		const firstIdx = counts.findIndex((c) => c > 0);
		const lastIdx =
			firstIdx < 0 ? -1 : counts.length - 1 - [...counts].reverse().findIndex((c) => c > 0);
		return {
			slug: ng.slug,
			label: ng.query,
			counts,
			total,
			rowMax,
			earliest: firstIdx >= 0 ? decades[firstIdx] : null,
			latest: lastIdx >= 0 ? decades[lastIdx] : null
		};
	});

	return { decades, rows, globalMax };
}

/**
 * Compute a weighted, undirected nanogenre-overlap graph.
 * Two nanogenres are connected by an edge iff they share at least
 * `minShared` canonical films; the edge weight is the size of the intersection.
 */
export function getOverlapGraph(minShared = 2): OverlapGraph {
	const all = getAllNanogenres();
	const nodes: OverlapNode[] = all.map((n) => ({
		id: n.slug,
		label: n.query,
		size: n.canonical_count
	}));

	// Pre-compute slug sets for O(1) intersection.
	const slugSets = new Map<string, Set<string>>();
	for (const n of all) slugSets.set(n.slug, new Set(n.films.map((f) => f.slug)));

	const links: OverlapLink[] = [];
	for (let i = 0; i < all.length; i++) {
		for (let j = i + 1; j < all.length; j++) {
			const a = all[i].slug;
			const b = all[j].slug;
			const sa = slugSets.get(a)!;
			const sb = slugSets.get(b)!;
			let shared = 0;
			const small = sa.size <= sb.size ? sa : sb;
			const large = small === sa ? sb : sa;
			for (const slug of small) if (large.has(slug)) shared++;
			if (shared >= minShared) links.push({ source: a, target: b, weight: shared });
		}
	}
	return { nodes, links };
}
