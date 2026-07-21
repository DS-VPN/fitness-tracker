<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let {
		open = $bindable(false),
		hasPhoto,
		photoSrc
	}: {
		open?: boolean;
		hasPhoto: boolean;
		photoSrc: string;
	} = $props();

	let preview = $state<string | null>(null);
	let submitting = $state(false);
	let photoError = $state('');

	function onFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (preview) URL.revokeObjectURL(preview);
		preview = file ? URL.createObjectURL(file) : null;
	}

	function reset() {
		if (preview) URL.revokeObjectURL(preview);
		preview = null;
		photoError = '';
	}
</script>

<Modal bind:open title={hasPhoto ? 'Replace photo' : 'Add photo'} onclose={reset}>
	<div class="space-y-4">
		<div
			class="flex aspect-video w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-alt)]"
		>
			{#if preview}
				<img src={preview} alt="" class="h-full w-full object-cover" />
			{:else if hasPhoto}
				<img src={photoSrc} alt="" class="h-full w-full object-cover" />
			{:else}
				<Icon name="camera" size={28} class="text-[var(--color-text-muted)]" />
			{/if}
		</div>

		<form
			method="POST"
			action="?/uploadPhoto"
			enctype="multipart/form-data"
			use:enhance={() => {
				photoError = '';
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'success') {
						open = false;
						reset();
					} else if (result.type === 'failure') {
						photoError = (result.data as { photoError?: string } | undefined)?.photoError ?? 'Could not save photo';
					}
					await update();
				};
			}}
		>
			<input
				type="file"
				name="photo"
				accept="image/jpeg,image/png,image/webp"
				onchange={onFileChange}
				class="block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:h-9 file:rounded-full file:border-0 file:bg-[var(--color-surface-alt)] file:px-3.5 file:text-sm file:font-medium file:text-[var(--color-text)]"
			/>
			{#if photoError}
				<p class="mt-2 text-sm text-[var(--color-danger)]">{photoError}</p>
			{/if}
			<Button type="submit" variant="primary" size="lg" full class="mt-3 w-full" disabled={submitting}>
				{hasPhoto ? 'Save new photo' : 'Upload photo'}
			</Button>
		</form>

		{#if hasPhoto}
			<form
				method="POST"
				action="?/deletePhoto"
				use:enhance={() => {
					return async ({ update }) => {
						open = false;
						reset();
						await update();
					};
				}}
			>
				<Button type="submit" variant="danger" size="md" full class="w-full">
					<Icon name="trash" size={16} />
					Remove photo
				</Button>
			</form>
		{/if}
	</div>
</Modal>
