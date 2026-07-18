<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import MealForm from '$lib/components/meals/MealForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let importUrl = $state('');
	let importing = $state(false);
	let creating = $state(false);

	const imported = $derived(form?.imported ?? null);

	// Review state, re-seeded whenever a fresh import lands.
	let reviewName = $state('');
	let reviewPortions = $state<number | null>(1);
	let included = $state<boolean[]>([]);
	$effect(() => {
		if (imported) {
			reviewName = imported.name;
			reviewPortions = imported.portions ?? 1;
			included = imported.lines.map((line) => line.match != null);
		}
	});

	const matchedCount = $derived((imported?.lines ?? []).filter((line) => line.match).length);
	const host = $derived.by(() => {
		if (!imported) return '';
		try {
			return new URL(imported.sourceUrl).hostname.replace(/^www\./, '');
		} catch {
			return '';
		}
	});
	const payload = $derived(
		JSON.stringify(
			(imported?.lines ?? [])
				.map((line, i) => ({ line, i }))
				.filter(({ line, i }) => included[i] && line.match)
				.map(({ line }) => ({ kind: line.match!.kind, id: line.match!.id, amount: line.match!.amount }))
		)
	);
</script>

<svelte:head><title>New meal · Fitness Tracker</title></svelte:head>

<PageHeader title="New meal" back="/meals" />

<div class="mx-auto max-w-md px-4 pt-2 space-y-5 pb-6">
	{#if imported}
		<Card>
			<h2 class="section-label mb-1">Imported from {host}</h2>
			<p class="mb-4 text-xs text-[var(--color-text-muted)]">
				{matchedCount} of {imported.lines.length} ingredients matched. Untick anything that looks
				off — amounts stay editable on the meal.
			</p>
			<form
				method="POST"
				action="?/createImported"
				class="space-y-4"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						creating = false;
						await update();
					};
				}}
			>
				<TextField label="Name" name="name" bind:value={reviewName} required />
				<NumberField
					label="Portions the recipe makes"
					name="portions"
					bind:value={reviewPortions}
					min={0.25}
					step={0.5}
					decimalText
					required
				/>
				<input type="hidden" name="payload" value={payload} />

				<div class="space-y-1">
					{#each imported.lines as line, i (i)}
						<label
							class={`flex items-start gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 ${
								line.match ? 'hover:bg-[var(--color-surface-alt)]' : 'opacity-60'
							}`}
						>
							{#if line.match}
								<input
									type="checkbox"
									bind:checked={included[i]}
									class="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
								/>
							{:else}
								<span class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"></span>
							{/if}
							<span class="min-w-0">
								<span class="block text-sm text-[var(--color-text)]">{line.raw}</span>
								{#if line.match}
									<span class="block text-xs text-[var(--color-text-muted)] tabular-nums">
										→ {line.match.name}{#if line.match.brand}&nbsp;· {line.match.brand}{/if} —
										{line.match.amount}&nbsp;{line.match.unit}
									</span>
								{:else}
									<span class="block text-xs text-[var(--color-text-muted)]">
										No match — add it to the meal afterwards
									</span>
								{/if}
							</span>
						</label>
					{/each}
				</div>

				{#if form?.importError}
					<p class="text-sm text-[var(--color-danger)]">{form.importError}</p>
				{/if}

				<div class="flex gap-2">
					<Button href="/meals/new" variant="ghost">Start over</Button>
					<Button type="submit" variant="primary" full class="flex-1" disabled={creating}>
						{creating ? 'Creating…' : 'Create meal'}
					</Button>
				</div>
			</form>
		</Card>
	{:else}
		<Card>
			<h2 class="section-label mb-2">Import from a link</h2>
			<form
				method="POST"
				action="?/importRecipe"
				class="flex items-end gap-2"
				use:enhance={() => {
					importing = true;
					return async ({ update }) => {
						importing = false;
						await update();
					};
				}}
			>
				<TextField label="Recipe URL" name="url" bind:value={importUrl} placeholder="https://…" class="flex-1" />
				<Button type="submit" variant="secondary" disabled={importing}>
					{importing ? 'Fetching…' : 'Fetch'}
				</Button>
			</form>
			{#if form?.importError}
				<p class="mt-2 text-sm text-[var(--color-danger)]">{form.importError}</p>
			{/if}
			<p class="mt-2 text-xs text-[var(--color-text-muted)]">
				Works with most recipe sites — the ingredient list is read and matched against your
				products and the catalog.
			</p>
		</Card>

		<div class="flex items-center gap-3" aria-hidden="true">
			<div class="h-px flex-1 bg-[var(--color-border)]"></div>
			<span class="text-xs text-[var(--color-text-muted)]">or build it yourself</span>
			<div class="h-px flex-1 bg-[var(--color-border)]"></div>
		</div>

		<MealForm categories={data.categories} submitLabel="Add meal" formError={form?.error} action="?/create" />
	{/if}
</div>
