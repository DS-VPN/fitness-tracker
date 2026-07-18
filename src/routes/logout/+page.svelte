<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
</script>

<svelte:head><title>Sign out · Fitness Tracker</title></svelte:head>

<div class="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 bg-[var(--color-bg)]">
	<p class="text-sm text-[var(--color-text-muted)]">Sign out of Fitness Tracker?</p>
	<form method="POST" use:enhance>
		<Button type="submit" variant="secondary">Sign out</Button>
	</form>
</div>
