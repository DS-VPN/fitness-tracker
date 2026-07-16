<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let password = $state('');
</script>

<svelte:head><title>Sign in · Fitness Tracker</title></svelte:head>

<div class="min-h-dvh flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
	<div class="w-full max-w-xs">
		<div class="text-center mb-8">
			<div
				class="mx-auto mb-4 h-14 w-14 rounded-[var(--radius-lg)] bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-serif font-semibold"
			>
				F
			</div>
			<h1 class="text-2xl text-[var(--color-text)]">Fitness Tracker</h1>
			<p class="text-sm text-[var(--color-text-muted)] mt-1">Enter your password to continue</p>
		</div>

		<form method="POST" class="space-y-4">
			<TextField label="Password" name="password" type="password" bind:value={password} required />
			{#if form?.error}
				<p class="text-sm text-[var(--color-danger)]">{form.error}</p>
			{/if}
			<Button type="submit" full variant="primary" class="w-full" size="lg">Sign in</Button>
		</form>
	</div>
</div>
