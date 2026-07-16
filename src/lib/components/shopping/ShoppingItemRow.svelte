<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '../Icon.svelte';
	import type { shoppingListItems } from '$lib/server/db/schema';

	type Item = typeof shoppingListItems.$inferSelect;

	let { item, ownerId }: { item: Item; ownerId: number } = $props();

	function confirmSubmit(message: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (!confirm(message)) cancel();
		};
	}
</script>

<div
	class="flex items-center gap-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] pl-2.5 pr-2 py-2"
>
	<form method="POST" action="?/toggleChecked" use:enhance>
		<input type="hidden" name="id" value={item.id} />
		<input type="hidden" name="ownerId" value={ownerId} />
		<input type="hidden" name="checked" value={String(!item.checked)} />
		<button
			type="submit"
			aria-label={item.checked ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`}
			aria-pressed={item.checked}
			class={`h-11 w-11 shrink-0 flex items-center justify-center rounded-[var(--radius-md)] border transition-colors ${
				item.checked
					? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
					: 'border-[var(--color-border)] text-transparent'
			}`}
		>
			<Icon name="check" size={18} />
		</button>
	</form>

	<div class="flex-1 min-w-0">
		<p
			class={`text-[15px] truncate ${item.checked ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}
		>
			{item.name}
		</p>
		{#if item.brand}
			<p class="text-xs text-[var(--color-text-muted)] truncate">{item.brand}</p>
		{/if}
	</div>

	<div class="flex items-center gap-0.5 shrink-0">
		<form method="POST" action="?/setQuantity" use:enhance>
			<input type="hidden" name="id" value={item.id} />
			<input type="hidden" name="ownerId" value={ownerId} />
			<input type="hidden" name="quantity" value={item.quantity - 1} />
			<button
				type="submit"
				aria-label={`Decrease quantity of ${item.name}`}
				disabled={item.quantity <= 1}
				class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] disabled:opacity-30 disabled:pointer-events-none"
			>
				<Icon name="minus" size={16} />
			</button>
		</form>
		<span class="w-6 text-center text-sm font-medium text-[var(--color-text)]">×{item.quantity}</span>
		<form method="POST" action="?/setQuantity" use:enhance>
			<input type="hidden" name="id" value={item.id} />
			<input type="hidden" name="ownerId" value={ownerId} />
			<input type="hidden" name="quantity" value={item.quantity + 1} />
			<button
				type="submit"
				aria-label={`Increase quantity of ${item.name}`}
				class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="plus" size={16} />
			</button>
		</form>
	</div>

	<form method="POST" action="?/removeItem" use:enhance={confirmSubmit(`Remove ${item.name} from the list?`)}>
		<input type="hidden" name="id" value={item.id} />
		<input type="hidden" name="ownerId" value={ownerId} />
		<button
			type="submit"
			aria-label={`Remove ${item.name}`}
			class="h-11 w-11 shrink-0 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
		>
			<Icon name="trash" size={18} />
		</button>
	</form>
</div>
