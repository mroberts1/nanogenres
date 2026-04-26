<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Nanogenres of Letterboxd</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<header class="site-header">
	<a href="/" class="brand">Nanogenres of Letterboxd</a>
</header>

<main class="site-main">
	{@render children()}
</main>

<footer class="site-footer">
	<small>Prototype. Data scraped from Letterboxd via Playwright.</small>
</footer>

<style>
	:global(:root) {
		--bg: #0f0d14;
		--card: #17141c;
		--fg: #e7dfef;
		--dim: #a196ae;
		--accent: #e58ea8;
		--accent-2: #8ba4e8;
		--line: #2a2432;
	}
	:global(html, body) {
		margin: 0;
		background: var(--bg);
		color: var(--fg);
		font:
			15px/1.55 -apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}
	:global(a) {
		color: var(--accent-2);
		text-decoration: none;
	}
	:global(a:hover) {
		text-decoration: underline;
	}
	.site-header {
		padding: 24px 24px 0;
		max-width: 1080px;
		margin: 0 auto;
	}
	.brand {
		color: var(--fg);
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.site-main {
		max-width: 1080px;
		margin: 0 auto;
		padding: 24px;
	}
	.site-footer {
		color: var(--dim);
		text-align: center;
		padding: 32px 0 64px;
	}
</style>
