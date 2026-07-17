<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();

	const showChrome = $derived(page.url.pathname !== '/login');

	let mainEl = $state<HTMLElement>();
	// The content area (not the window) is the scroller in this app-shell layout, so reset it to
	// the top on real page changes. Same-path navigations — e.g. the meals search updating query
	// params — keep their scroll position so filtering doesn't jump.
	afterNavigate((nav) => {
		if (nav.from?.url.pathname !== nav.to?.url.pathname) mainEl?.scrollTo(0, 0);
	});

	if (browser && !dev && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/service-worker.js');
	}
</script>

<svelte:head>
	<link rel="icon" href="/icons/favicon-32.png" sizes="32x32" />
	<link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
</svelte:head>

<div class="flex h-[100dvh] flex-col">
	<main bind:this={mainEl} class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
		{@render children()}
	</main>
	{#if showChrome}
		<BottomNav />
	{/if}
</div>
