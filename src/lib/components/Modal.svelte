<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import Icon from './Icon.svelte';

	let {
		open = $bindable(false),
		title,
		children,
		onclose
	}: { open?: boolean; title: string; children: Snippet; onclose?: () => void } = $props();

	// Respect reduced-motion by collapsing the enter/exit animations to instant.
	const reduceMotion = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const scrimDur = reduceMotion ? 0 : 160;
	const sheetDur = reduceMotion ? 0 : 240;

	function close() {
		open = false;
		onclose?.();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
		<button
			type="button"
			aria-label="Close dialog"
			class="absolute inset-0 bg-[var(--color-scrim)] backdrop-blur-[1px]"
			transition:fade={{ duration: scrimDur }}
			onclick={close}
		></button>
		<div
			class="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-[var(--color-surface)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] px-5 pt-2.5 sm:pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
			transition:fly={{ y: reduceMotion ? 0 : 28, duration: sheetDur, easing: cubicOut }}
		>
			<div class="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)] sm:hidden" aria-hidden="true"></div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg text-[var(--color-text)]">{title}</h2>
				<button
					type="button"
					aria-label="Close"
					class="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"
					onclick={close}
				>
					<Icon name="x" size={20} />
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}
