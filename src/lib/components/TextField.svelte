<script lang="ts">
	let {
		label,
		name,
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		required = false,
		hint = '',
		class: className = ''
	}: {
		label?: string;
		name: string;
		value?: string;
		type?: 'text' | 'search' | 'password' | 'date';
		placeholder?: string;
		required?: boolean;
		hint?: string;
		class?: string;
	} = $props();

	const id = $derived(`field-${name}`);
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
	{/if}
	<input
		{id}
		{name}
		{type}
		{placeholder}
		{required}
		bind:value
		class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
	/>
	{#if hint}
		<p class="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>
	{/if}
</div>
