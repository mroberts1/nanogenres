import { getSummaries } from '$lib/datasets';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return { summaries: getSummaries() };
};
