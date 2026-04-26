import adapter from '@sveltejs/adapter-static';

// Set BASE_PATH=/nanogenres in CI for GitHub Pages, leave empty for local dev/preview.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		paths: { base }
	}
};

export default config;
