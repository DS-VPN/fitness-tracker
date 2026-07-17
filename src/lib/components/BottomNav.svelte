<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';

	const items = [
		{ href: '/', label: 'Home', icon: 'home' as const },
		{ href: '/meals', label: 'Meals', icon: 'meals' as const },
		{ href: '/shopping-list', label: 'Shopping', icon: 'cart' as const },
		{ href: '/workouts', label: 'Workouts', icon: 'dumbbell' as const }
	];

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<!-- pt gives the row its height; the bottom clearance is ONLY the iPhone home-indicator safe
     area (no extra padding stacked on top of it), so on a home-indicator device the labels sit
     just above the gesture bar like a native tab bar, and on devices without one the bar hugs
     the very bottom. bg fills the safe-area strip so no page background shows through. -->
<nav
	class="shrink-0 flex bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]"
>
	{#each items as item (item.href)}
		{@const active = isActive(item.href)}
		<a
			href={item.href}
			class={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-xs font-medium transition-colors ${
				active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
			}`}
		>
			<Icon name={item.icon} size={22} />
			{item.label}
		</a>
	{/each}
</nav>
