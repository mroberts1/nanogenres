import { getOverlapGraph } from '$lib/datasets';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Edge threshold default: at least 2 shared canonical films to draw a link.
	const graph = getOverlapGraph(2);
	return { graph };
};
