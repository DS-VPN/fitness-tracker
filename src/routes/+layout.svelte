<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();

	const showChrome = $derived(page.url.pathname !== '/login');

	if (browser && !dev && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/service-worker.js');
	}
</script>

<svelte:head>
	<link rel="icon" href="/icons/favicon-32.png" sizes="32x32" />
	<link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
</svelte:head>

<div class="min-h-full flex flex-col">
	<main class={`flex-1 ${showChrome ? 'pb-24' : ''}`}>
		{@render children()}
	</main>
	{#if showChrome}
		<BottomNav />
	{/if}
</div>
