<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		icon = 'list',
		title,
		description = '',
		children
	}: {
		icon?: 'home' | 'meals' | 'cart' | 'dumbbell' | 'list' | 'search';
		title: string;
		description?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center text-center py-14 px-6">
	<div
		class="h-14 w-14 flex items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] mb-4"
	>
		<Icon name={icon} size={26} />
	</div>
	<h3 class="text-base font-medium text-[var(--color-text)] mb-1">{title}</h3>
	{#if description}
		<p class="text-sm text-[var(--color-text-muted)] max-w-xs mb-4">{description}</p>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>
