<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '../Icon.svelte';
	import type { ShoppingListProductItem, ShoppingListManualItem } from '$lib/server/repositories/shoppingList';

	type Item = ShoppingListProductItem | ShoppingListManualItem;

	let { item, ownerId }: { item: Item; ownerId: number } = $props();

	let expanded = $state(false);

	function confirmSubmit(message: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (!confirm(message)) cancel();
		};
	}
</script>

<div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] pl-2.5 pr-2 py-2">
	<div class="flex items-center gap-2.5">
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
						? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-on-accent)]'
						: 'border-[var(--color-border)] text-transparent'
				}`}
			>
				<Icon name="check" size={18} />
			</button>
		</form>

		<button
			type="button"
			class="flex-1 min-w-0 text-left"
			disabled={item.kind !== 'product' || item.sources.length <= 1}
			onclick={() => (expanded = !expanded)}
		>
			{#if item.kind === 'product'}
				<p class={`text-[15px] truncate ${item.checked ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
					{item.name} — {item.totalAmount} {item.unit}
				</p>
				{#if item.brand}
					<p class="text-xs text-[var(--color-text-muted)] truncate">{item.brand}</p>
				{/if}
				{#if item.sources.length === 1}
					<p class="text-xs text-[var(--color-text-muted)] truncate">{item.sources[0].label}</p>
				{/if}
			{:else}
				<p class={`text-[15px] truncate ${item.checked ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
					{item.name}
				</p>
				{#if item.brand}
					<p class="text-xs text-[var(--color-text-muted)] truncate">{item.brand}</p>
				{/if}
			{/if}
		</button>

		{#if item.kind === 'product' && item.sources.length > 1}
			<button
				type="button"
				aria-label={expanded ? 'Hide breakdown' : 'Show breakdown'}
				onclick={() => (expanded = !expanded)}
				class="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="chevron-right" size={16} class={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
			</button>
		{/if}

		{#if item.kind === 'manual'}
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
		{/if}

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

	{#if item.kind === 'product' && expanded && item.sources.length > 1}
		<div class="mt-1.5 ml-[52px] space-y-1 border-l border-[var(--color-border)] pl-3">
			{#each item.sources as source (source.mealId ?? 'direct')}
				<div class="flex items-center justify-between gap-2">
					<span class="text-xs text-[var(--color-text-muted)]">
							{#if source.mealId != null}
								<a href={`/meals/${source.mealId}`} class="text-[var(--color-accent)] hover:underline">{source.label}</a>
							{:else}
								{source.label}
							{/if}
							{source.amount}{item.unit}
						</span>
					<form method="POST" action="?/removeMealSource" use:enhance>
						<input type="hidden" name="id" value={item.id} />
						<input type="hidden" name="ownerId" value={ownerId} />
						{#if source.mealId != null}
							<input type="hidden" name="mealId" value={source.mealId} />
						{/if}
						<button
							type="submit"
							aria-label={`Remove ${source.label}'s contribution`}
							class="h-6 w-6 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
						>
							<Icon name="x" size={12} />
						</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}
</div>
