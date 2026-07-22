<script lang="ts">
	import { INJECTION_SITES, type InjectionSite } from '$lib/utils/peptides';

	let {
		value = $bindable<InjectionSite | null>(null),
		name = 'site',
		suggested = null
	}: { value?: InjectionSite | null; name?: string; suggested?: InjectionSite | null } = $props();

	function pick(site: InjectionSite) {
		value = value === site ? null : site;
	}
</script>

<input type="hidden" {name} value={value ?? ''} />
<div class="grid grid-cols-2 gap-1.5">
	{#each INJECTION_SITES as site (site.value)}
		{@const selected = value === site.value}
		<button
			type="button"
			onclick={() => pick(site.value)}
			aria-pressed={selected}
			class={`relative flex items-center justify-between gap-1 h-10 px-3 rounded-[var(--radius-md)] border text-sm transition-colors ${
				selected
					? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)] font-medium'
					: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
			}`}
		>
			<span>{site.label}</span>
			{#if suggested === site.value && !selected}
				<span class="text-[10px] uppercase tracking-wide text-[var(--color-accent)] font-semibold">next</span>
			{/if}
		</button>
	{/each}
</div>
