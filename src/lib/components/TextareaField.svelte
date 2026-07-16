<script lang="ts">
	let {
		label,
		name,
		value = $bindable(''),
		placeholder = '',
		rows = 3,
		class: className = ''
	}: {
		label?: string;
		name: string;
		value?: string;
		placeholder?: string;
		rows?: number;
		class?: string;
	} = $props();

	const id = $derived(`field-${name}`);
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
	{/if}
	<textarea
		{id}
		{name}
		{placeholder}
		{rows}
		bind:value
		class="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-none"
	></textarea>
</div>
