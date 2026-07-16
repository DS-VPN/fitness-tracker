<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();

	const showChrome = $derived(page.url.pathname !== '/login');
</script>

<svelte:head>
	<link rel="icon" href="/icons/icon-192.png" />
</svelte:head>

<div class="min-h-full flex flex-col">
	<main class={`flex-1 ${showChrome ? 'pb-24' : ''}`}>
		{@render children()}
	</main>
	{#if showChrome}
		<BottomNav />
	{/if}
</div>
