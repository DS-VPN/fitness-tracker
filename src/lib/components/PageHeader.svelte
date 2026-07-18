<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		title,
		back,
		actions
	}: { title: string; back?: string; actions?: Snippet } = $props();
</script>

<header
	class="sticky top-0 z-20 flex items-center gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-[var(--color-bg)]/90 backdrop-blur-sm"
>
	{#if back}
		<a
			href={back}
			aria-label="Back"
			class="h-9 w-9 -ml-1.5 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
		>
			<Icon name="chevron-left" size={22} />
		</a>
	{/if}
	<h1 class="flex-1 text-[1.375rem] leading-7 truncate text-[var(--color-text)]">{title}</h1>
	{#if actions}
		<div class="flex items-center gap-1.5">
			{@render actions()}
		</div>
	{/if}
</header>
