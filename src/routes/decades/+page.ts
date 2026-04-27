import { getCatalogDecadeMatrix } from '$lib/datasets';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return { matrix: getCatalogDecadeMatrix() };
};
