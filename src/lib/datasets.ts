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
