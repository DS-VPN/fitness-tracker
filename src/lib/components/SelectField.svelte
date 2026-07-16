<script lang="ts">
	let {
		label,
		name,
		value = $bindable(''),
		options,
		class: className = ''
	}: {
		label?: string;
		name: string;
		value?: string;
		options: { value: string; label: string }[];
		class?: string;
	} = $props();

	const id = $derived(`field-${name}`);
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
	{/if}
	<select
		{id}
		{name}
		bind:value
		class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
	>
		{#each options as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
</div>
