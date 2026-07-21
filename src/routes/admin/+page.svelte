<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import CreateUserModal from '$lib/components/admin/CreateUserModal.svelte';
	import ManageUserModal from '$lib/components/admin/ManageUserModal.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let createOpen = $state(false);
	let manageOpen = $state(false);
	let selected = $state<PageData['users'][number] | null>(null);
	let message = $state('');

	const adminCount = $derived(data.users.filter((u) => u.isAdmin).length);

	function openManage(u: PageData['users'][number]) {
		selected = u;
		manageOpen = true;
	}

	function maint() {
		return async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: () => Promise<void> }) => {
			if (result.type === 'success') message = (result.data?.message as string) ?? 'Done';
			else if (result.type === 'failure') message = (result.data?.error as string) ?? 'Failed';
			await update();
		};
	}

	function formatBytes(n: number): string {
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
		if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
		return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}

	function fmtDate(d: Date | string) {
		return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head><title>Admin · Fitness Tracker</title></svelte:head>

<PageHeader title="Admin" back="/">
	{#snippet actions()}
		<button type="button" aria-label="Add user" onclick={() => (createOpen = true)} class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]">
			<Icon name="plus" size={20} />
		</button>
	{/snippet}
</PageHeader>

<div class="mx-auto max-w-md px-4 pb-4 space-y-5">
	{#if message}
		<div class="rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm text-[var(--color-text)]">{message}</div>
	{/if}

	<!-- Instance overview -->
	<Card>
		<h2 class="section-label mb-3">Instance</h2>
		<div class="grid grid-cols-3 gap-3">
			<StatCard label="Users" value={data.stats.users} />
			<StatCard label="Meals" value={data.stats.meals} />
			<StatCard label="Workouts" value={data.stats.workouts} />
			<StatCard label="Photos" value={data.stats.photos} />
			<StatCard label="Products" value={data.stats.products} />
			<StatCard label="Catalog" value={data.stats.catalogProducts} />
		</div>
		<div class="mt-3 space-y-1 text-xs text-[var(--color-text-muted)]">
			<p>Database {formatBytes(data.stats.dbBytes)} · Uploads {formatBytes(data.stats.uploadsBytes)}</p>
			<p>
				Photo encryption:
				<span class={data.stats.photoEncryption ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
					{data.stats.photoEncryption ? 'enabled' : 'not configured'}
				</span>
				· Barcode cache: {data.stats.barcodeCache}
			</p>
			<p>App version {data.stats.appVersion}</p>
		</div>
	</Card>

	<!-- Users -->
	<div>
		<div class="flex items-center justify-between mb-2 px-1">
			<h2 class="section-label">Users ({data.users.length})</h2>
			<button type="button" onclick={() => (createOpen = true)} class="text-xs text-[var(--color-accent)]">Add user</button>
		</div>
		<Card padded={false} class="divide-y divide-[var(--color-border)]">
			{#each data.users as u (u.id)}
				<button type="button" onclick={() => openManage(u)} class="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-alt)]">
					<div class="flex-1 min-w-0">
						<p class="text-sm text-[var(--color-text)] flex items-center gap-1.5">
							<span class="truncate">{u.username}</span>
							{#if u.isAdmin}<span class="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">admin</span>{/if}
							{#if u.id === data.meId}<span class="shrink-0 text-[10px] text-[var(--color-text-muted)]">you</span>{/if}
						</p>
						<p class="text-xs text-[var(--color-text-muted)] tabular-nums">
							{u.meals} meals · {u.workouts} workouts · {u.photos} photos{#if u.lastActive} · active {fmtDate(u.lastActive)}{/if}
						</p>
					</div>
					<Icon name="chevron-right" size={16} class="shrink-0 text-[var(--color-text-muted)]" />
				</button>
			{/each}
		</Card>
	</div>

	<!-- Maintenance -->
	<div>
		<h2 class="section-label mb-2 px-1">Maintenance</h2>
		<Card class="space-y-2">
			{#each [{ action: '?/reseedCatalog', label: 'Re-seed product catalog' }, { action: '?/reseedPresets', label: 'Re-seed presets for all users' }, { action: '?/clearBarcodeCache', label: 'Clear barcode cache' }] as m (m.action)}
				<form method="POST" action={m.action} use:enhance={maint}>
					<Button type="submit" variant="secondary" full class="w-full justify-between">
						{m.label}
						<Icon name="chevron-right" size={16} />
					</Button>
				</form>
			{/each}
			<p class="pt-1 text-xs text-[var(--color-text-muted)]">All three are safe to run anytime — seeding is idempotent; clearing the barcode cache just forces fresh lookups.</p>
		</Card>
	</div>
</div>

<CreateUserModal bind:open={createOpen} />
<ManageUserModal bind:open={manageOpen} user={selected} meId={data.meId} {adminCount} />
