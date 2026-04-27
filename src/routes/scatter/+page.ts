import { getAllNanogenres, getScatterPoints } from '$lib/datasets';
import { getGuide } from '$lib/guides';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		points: getScatterPoints(),
		nanogenres: getAllNanogenres()
			.map((n) => ({ slug: n.slug, label: n.query }))
			.sort((a, b) => a.label.localeCompare(b.label)),
		guide: getGuide('rating-canonicality-scatter')
	};
};
