<script lang="ts">
	let { html, label = 'Usage guide' }: { html: string; label?: string } = $props();
</script>

<details class="guide">
	<summary>
		<span class="icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="14" height="14"><path
					d="M12 4v16M4 12h16"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/></svg>
		</span>
		{label}
	</summary>
	<div class="body">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	</div>
</details>

<style>
	.guide {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 0;
		margin: 0 0 18px;
		overflow: hidden;
		font-size: 13px;
	}
	summary {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		cursor: pointer;
		color: var(--dim);
		list-style: none;
		user-select: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		color: var(--fg);
	}
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-2);
		transition: transform 120ms;
	}
	details[open] .icon {
		transform: rotate(45deg);
	}
	.body {
		padding: 4px 18px 18px;
		border-top: 1px solid var(--line);
		color: var(--fg);
		line-height: 1.55;
	}
	.body :global(h2) {
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--dim);
		margin: 18px 0 8px;
		font-weight: 500;
	}
	.body :global(h2:first-child),
	.body :global(p:first-child),
	.body :global(ul:first-child) {
		margin-top: 8px;
	}
	.body :global(p) {
		margin: 0 0 10px;
		max-width: 70ch;
	}
	.body :global(ul) {
		margin: 0 0 10px;
		padding-left: 20px;
	}
	.body :global(li) {
		margin-bottom: 4px;
	}
	.body :global(a) {
		color: var(--accent-2);
	}
	.body :global(strong) {
		color: var(--fg);
	}
	.body :global(em) {
		color: var(--accent);
		font-style: normal;
	}
	.body :global(code) {
		background: var(--bg);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 0 4px;
		font-size: 12px;
	}
</style>
