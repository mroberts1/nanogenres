import { error } from '@sveltejs/kit';
import { getAllSlugs, getNanogenre } from '$lib/datasets';
import type { PageLoad, EntryGenerator } from './$types';

export const load: PageLoad = ({ params }) => {
	const data = getNanogenre(params.slug);
	if (!data) throw error(404, `Unknown nanogenre: ${params.slug}`);
	return { nanogenre: data };
};

export const entries: EntryGenerator = () => {
	return getAllSlugs().map((slug) => ({ slug }));
};
