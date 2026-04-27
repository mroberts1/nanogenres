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

	return { nanogenre: data, crossMemberships };
};

export const entries: EntryGenerator = () => {
	return getAllSlugs().map((slug) => ({ slug }));
};
