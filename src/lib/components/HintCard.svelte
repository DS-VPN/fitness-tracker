<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		id,
		icon = 'target',
		children
	}: {
		id: string;
		icon?:
			| 'home'
			| 'meals'
			| 'cart'
			| 'dumbbell'
			| 'list'
			| 'target'
			| 'star'
			| 'scan';
		children: Snippet;
	} = $props();

	const key = `hint:${id}`;

	// Render only after mount, and only if this hint hasn't been dismissed before. Kept
	// client-side (localStorage) so it never flashes for users who already dismissed it.
	let show = $state(false);
	$effect(() => {
		try {
			show = localStorage.getItem(key) !== '1';
		} catch {
			show = true;
		}
	});

	function dismiss() {
		show = false;
		try {
			localStorage.setItem(key, '1');
		} catch {
			// ignore — worst case the hint reappears next visit
		}
	}
</script>

{#if show}
	<div
		class="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-3.5 py-3"
	>
		<div class="mt-0.5 shrink-0 text-[var(--color-accent)]">
			<Icon name={icon} size={18} />
		</div>
		<div class="flex-1 text-sm leading-relaxed text-[var(--color-text)]">
			{@render children()}
		</div>
		<button
			type="button"
			onclick={dismiss}
			aria-label="Dismiss tip"
			class="-mr-1 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
		>
			<Icon name="x" size={16} />
		</button>
	</div>
{/if}
