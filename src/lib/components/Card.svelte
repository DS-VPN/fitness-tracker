<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		href,
		padded = true,
		class: className = ''
	}: { children: Snippet; href?: string; padded?: boolean; class?: string } = $props();

	const base = $derived(
		`block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ${padded ? 'p-4' : ''} ${className}`
	);
</script>

{#if href}
	<a {href} class={`${base} transition-transform active:scale-[0.98]`}>
		{@render children()}
	</a>
{:else}
	<div class={base}>
		{@render children()}
	</div>
{/if}
