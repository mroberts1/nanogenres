import { getCatalogDecadeMatrix } from '$lib/datasets';
import { getGuide } from '$lib/guides';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return { matrix: getCatalogDecadeMatrix(), guide: getGuide('decade-heatmap') };
};
