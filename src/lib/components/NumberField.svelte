<script lang="ts">
	let {
		label,
		name,
		value = $bindable<number | null>(null),
		step = 1,
		min,
		placeholder = '',
		required = false,
		suffix = '',
		class: className = ''
	}: {
		label?: string;
		name: string;
		value?: number | null;
		step?: number;
		min?: number;
		placeholder?: string;
		required?: boolean;
		suffix?: string;
		class?: string;
	} = $props();

	const id = $derived(`field-${name}`);
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
	{/if}
	<div class="relative">
		<input
			{id}
			{name}
			type="number"
			inputmode="decimal"
			{step}
			{min}
			{placeholder}
			{required}
			bind:value
			class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
		/>
		{#if suffix}
			<span
				class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]"
				>{suffix}</span
			>
		{/if}
	</div>
</div>
