<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';

	// Sub-tabs for the "Health" bottom-nav slot, which groups the Body suite and Peptides.
	const tabs = [
		{ href: '/body', label: 'Body', icon: 'scale' as const },
		{ href: '/peptides', label: 'Peptides', icon: 'vial' as const }
	];

	function active(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="mx-auto max-w-md px-4 pt-1 pb-3">
	<div class="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				aria-current={active(tab.href) ? 'page' : undefined}
				class={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[calc(var(--radius-md)-4px)] text-sm font-medium transition-colors ${
					active(tab.href)
						? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-soft)]'
						: 'text-[var(--color-text-muted)]'
				}`}
			>
				<Icon name={tab.icon} size={16} />
				{tab.label}
			</a>
		{/each}
	</div>
</div>
