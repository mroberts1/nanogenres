<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let { children } = $props();

	type Theme = 'dark' | 'light';
	let theme = $state<Theme>('dark');
	let mounted = $state(false);

	onMount(() => {
		const t = (document.documentElement.dataset.theme as Theme | undefined) ?? 'dark';
		theme = t;
		mounted = true;
	});

	$effect(() => {
		if (!mounted) return;
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			/* ignore */
		}
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>100 Nanogenres of Letterboxd</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<header class="site-header">
	<a href="{base}/" class="brand">100 Nanogenres of Letterboxd</a>
	<button
		type="button"
		class="theme-toggle"
		aria-label="Toggle light / dark theme"
		title="Toggle light / dark theme"
		onclick={toggleTheme}
	>
		{#if theme === 'dark'}
			<!-- Sun icon -->
			<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
				<circle cx="12" cy="12" r="4" fill="currentColor" />
				<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
					<line x1="12" y1="2" x2="12" y2="5" />
					<line x1="12" y1="19" x2="12" y2="22" />
					<line x1="2" y1="12" x2="5" y2="12" />
					<line x1="19" y1="12" x2="22" y2="12" />
					<line x1="4.5" y1="4.5" x2="6.6" y2="6.6" />
					<line x1="17.4" y1="17.4" x2="19.5" y2="19.5" />
					<line x1="4.5" y1="19.5" x2="6.6" y2="17.4" />
					<line x1="17.4" y1="6.6" x2="19.5" y2="4.5" />
				</g>
			</svg>
		{:else}
			<!-- Moon icon -->
			<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
				<path
					d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"
					fill="currentColor"
				/>
			</svg>
		{/if}
	</button>
</header>

<main class="site-main">
	{@render children()}
</main>

<footer class="site-footer">
	<small>Data scraped from Letterboxd via Playwright.</small>
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
		--heat-rgb: 229, 142, 168;
		color-scheme: dark;
	}
	:global([data-theme='light']) {
		--bg: #f7f5fa;
		--card: #ffffff;
		--fg: #1a1820;
		--dim: #6a6276;
		--accent: #b8425f;
		--accent-2: #4a5fa8;
		--line: #e5dfee;
		--heat-rgb: 184, 66, 95;
		color-scheme: light;
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--fg);
		cursor: pointer;
		padding: 0;
		transition:
			border-color 120ms,
			color 120ms,
			background 120ms;
	}
	.theme-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
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
