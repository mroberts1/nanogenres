import { marked } from 'marked';

// Pull every visualization guide as raw markdown at build time. Each entry
// in the glob's keys looks like '/docs/visualizations/overlap-graph.md'.
const rawGuides = import.meta.glob<string>('/docs/visualizations/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

const guideHtml = new Map<string, string>();

marked.setOptions({ gfm: true, breaks: false });

for (const [path, raw] of Object.entries(rawGuides)) {
	const slug = path.replace(/^.*\//, '').replace(/\.md$/, '');
	if (slug === 'README') continue;

	// Drop the document's own H1 — the page already has its own headline,
	// and the route line just below the H1 (e.g. "Route: /graph"). The
	// description text after that is what we want to render.
	const trimmed = raw.replace(/^#\s+[^\n]*\n+/, '').replace(/^Route:[^\n]*\n+/, '');

	const html = marked.parse(trimmed) as string;
	guideHtml.set(slug, html);
}

export function getGuide(slug: string): string | null {
	return guideHtml.get(slug) ?? null;
}
