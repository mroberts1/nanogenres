import { getDirectorConstellation } from '$lib/datasets';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Load all directors that bridge >= 2 nanogenres. Client-side slider
	// can raise the threshold further without re-fetching.
	return { constellation: getDirectorConstellation(2) };
};
