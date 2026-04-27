import { error } from '@sveltejs/kit';
import {
	getAllNanogenres,
	getAllSlugs,
	getFilmMembership,
	getNanogenre
} from '$lib/datasets';
import type { PageLoad, EntryGenerator } from './$types';

export interface CrossMember {
	slug: string;
	query: string;
}

export interface SankeyNode {
	id: string;
	name: string;
	/** 0 = genre, 1 = country */
	layer: 0 | 1;
	total: number;
}

export interface SankeyLink {
	source: string;
	target: string;
	value: number;
}

export interface SankeyData {
	nodes: SankeyNode[];
	links: SankeyLink[];
}

// Abbreviate verbose country names so Sankey labels fit cleanly without
// the truncated look. Letterboxd already returns 'UK' and 'USA' short, so
// we only need to handle the few long names that survive its normalization.
const COUNTRY_ABBR: Record<string, string> = {
	'United Arab Emirates': 'UAE',
	'Bosnia and Herzegovina': 'Bosnia',
	'Democratic Republic of Congo': 'DR Congo',
	'North Macedonia': 'N. Macedonia'
};

function abbrCountry(name: string): string {
	return COUNTRY_ABBR[name] ?? name;
}

function computeSankey(films: { genres: string[]; countries: string[] }[]): SankeyData {
	const TOP_GENRES = 8;
	const TOP_COUNTRIES = 10;

	const pairCounts = new Map<string, number>();
	const genreTotals = new Map<string, number>();
	const countryTotals = new Map<string, number>();

	for (const f of films) {
		if (!f.genres?.length || !f.countries?.length) continue;
		for (const g of f.genres) {
			for (const cRaw of f.countries) {
				const c = abbrCountry(cRaw);
				const key = `${g}\u0001${c}`;
				pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
				genreTotals.set(g, (genreTotals.get(g) ?? 0) + 1);
				countryTotals.set(c, (countryTotals.get(c) ?? 0) + 1);
			}
		}
	}

	const topGenres = [...genreTotals.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_GENRES);
	const topCountries = [...countryTotals.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_COUNTRIES);

	const genreSet = new Set(topGenres.map(([g]) => g));
	const countrySet = new Set(topCountries.map(([c]) => c));

	const nodes: SankeyNode[] = [
		...topGenres.map(([g, total]) => ({ id: `g:${g}`, name: g, layer: 0 as const, total })),
		...topCountries.map(([c, total]) => ({ id: `c:${c}`, name: c, layer: 1 as const, total }))
	];

	const links: SankeyLink[] = [];
	for (const [key, v] of pairCounts) {
		const [g, c] = key.split('\u0001');
		if (!genreSet.has(g) || !countrySet.has(c)) continue;
		links.push({ source: `g:${g}`, target: `c:${c}`, value: v });
	}

	return { nodes, links };
}

export const load: PageLoad = ({ params }) => {
	const data = getNanogenre(params.slug);
	if (!data) throw error(404, `Unknown nanogenre: ${params.slug}`);

	// Map: film slug -> [{ slug, query }] for every OTHER nanogenre this film
	// also belongs to. Sorted by descending size of the other nanogenre so
	// the most prominent labels appear first.
	const membership = getFilmMembership();
	const all = getAllNanogenres();
	const labelBySlug = new Map(all.map((n) => [n.slug, n.query]));
	const sizeBySlug = new Map(all.map((n) => [n.slug, n.canonical_count]));

	const crossMemberships: Record<string, CrossMember[]> = {};
	for (const f of data.films) {
		const slugs = membership.get(f.slug) ?? [];
		const others = slugs
			.filter((s) => s !== params.slug)
			.sort((a, b) => (sizeBySlug.get(b) ?? 0) - (sizeBySlug.get(a) ?? 0));
		if (others.length === 0) continue;
		crossMemberships[f.slug] = others.map((s) => ({
			slug: s,
			query: labelBySlug.get(s) ?? s
		}));
	}

	const sankey = computeSankey(data.films);

	return { nanogenre: data, crossMemberships, sankey };
};

export const entries: EntryGenerator = () => {
	return getAllSlugs().map((slug) => ({ slug }));
};
