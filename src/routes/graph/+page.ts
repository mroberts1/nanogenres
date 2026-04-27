import { getOverlapGraph } from '$lib/datasets';
import { getGuide } from '$lib/guides';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Edge threshold default: at least 2 shared canonical films to draw a link.
	const graph = getOverlapGraph(2);
	return { graph, guide: getGuide('overlap-graph') };
};
