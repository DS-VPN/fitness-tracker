<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import Button from '$lib/components/Button.svelte';
	import SitePicker from './SitePicker.svelte';
	import { todayIso } from '$lib/utils/todayIso';
	import { syringeUnits } from '$lib/utils/reconstitution';
	import { ROUTE_LABELS, type InjectionRoute, type InjectionSite } from '$lib/utils/peptides';

	type PeptideOpt = { id: number; name: string; vialMg: number | null };
	type VialOpt = { id: number; peptideId: number; vialMg: number; bacWaterMl: number | null };
	type Initial = { peptideId?: number; doseMcg?: number | null; protocolId?: number | null } | null;

	let {
		open = $bindable(false),
		peptides,
		vials,
		suggestedSite = null,
		initial = null
	}: {
		open?: boolean;
		peptides: PeptideOpt[];
		vials: VialOpt[];
		suggestedSite?: InjectionSite | null;
		initial?: Initial;
	} = $props();

	let peptideId = $state<number | null>(null);
	let date = $state(todayIso());
	let doseMcg = $state<number | null>(null);
	let site = $state<InjectionSite | null>(null);
	let route = $state<InjectionRoute | ''>('');
	let vialId = $state<number | null>(null);
	let time = $state('');
	let notes = $state('');
	let error = $state('');

	$effect(() => {
		if (!open) return;
		peptideId = initial?.peptideId ?? peptides[0]?.id ?? null;
		date = todayIso();
		doseMcg = initial?.doseMcg ?? null;
		site = null;
		route = '';
		vialId = null;
		time = '';
		notes = '';
		error = '';
	});

	const vialsForPeptide = $derived(vials.filter((v) => v.peptideId === peptideId));
	const selectedVial = $derived(vialsForPeptide.find((v) => v.id === vialId) ?? null);
	const units = $derived(
		selectedVial && selectedVial.bacWaterMl && doseMcg
			? syringeUnits({ vialMg: selectedVial.vialMg, bacWaterMl: selectedVial.bacWaterMl, doseMcg })
			: null
	);
</script>

<Modal bind:open title="Log a dose">
	<form
		method="POST"
		action="/peptides?/logDose"
		class="space-y-4"
		use:enhance={() => {
			error = '';
			return async ({ result, update }) => {
				if (result.type === 'success') open = false;
				else if (result.type === 'failure') error = (result.data?.error as string) ?? 'Could not log dose';
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="protocolId" value={initial?.protocolId ?? ''} />
		<input type="hidden" name="unitsShown" value={units ?? ''} />

		<div>
			<label for="dose-peptide" class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Peptide</label>
			<select
				id="dose-peptide"
				name="peptideId"
				bind:value={peptideId}
				class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
			>
				{#each peptides as p (p.id)}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="dose-date" class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Date</label>
				<input
					id="dose-date"
					type="date"
					name="date"
					bind:value={date}
					max={todayIso()}
					class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
				/>
			</div>
			<NumberField label="Dose" name="doseMcg" bind:value={doseMcg} decimalText suffix="mcg" />
		</div>

		<div>
			<p class="section-label mb-2">Injection site</p>
			<SitePicker bind:value={site} suggested={suggestedSite} />
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="dose-route" class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Route</label>
				<select
					id="dose-route"
					name="route"
					bind:value={route}
					class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
				>
					<option value="">—</option>
					<option value="subq">{ROUTE_LABELS.subq}</option>
					<option value="im">{ROUTE_LABELS.im}</option>
				</select>
			</div>
			<div>
				<label for="dose-time" class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Time</label>
				<input
					id="dose-time"
					type="time"
					name="time"
					bind:value={time}
					class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
				/>
			</div>
		</div>

		{#if vialsForPeptide.length > 0}
			<div>
				<label for="dose-vial" class="block text-sm font-medium text-[var(--color-text)] mb-1.5">From vial (optional)</label>
				<select
					id="dose-vial"
					name="vialId"
					bind:value={vialId}
					class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
				>
					<option value={null}>—</option>
					{#each vialsForPeptide as v (v.id)}
						<option value={v.id}>{v.vialMg} mg{#if v.bacWaterMl} in {v.bacWaterMl} mL{/if}</option>
					{/each}
				</select>
				{#if units != null}
					<p class="mt-1.5 text-xs text-[var(--color-accent)] tabular-nums">≈ {units} units on a U-100 syringe</p>
				{/if}
			</div>
		{/if}

		<TextareaField label="Notes" name="notes" bind:value={notes} rows={2} placeholder="Optional — effects, side effects, etc." />

		{#if error}<p class="text-sm text-[var(--color-danger)]">{error}</p>{/if}
		<Button type="submit" variant="primary" full class="w-full">Log dose</Button>
	</form>
</Modal>
