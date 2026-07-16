/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `app-shell-${version}`;
// Precache the built JS/CSS bundle plus everything in /static (icons, manifest, fonts) —
// this is what lets the installed PWA repaint its shell instantly, offline or on a flaky connection.
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim())
	);
});

// Network-first for everything (this app is a live, single-user tool backed by SQLite — data must
// always come from the server when reachable). Precached shell assets are the offline fallback only.
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			try {
				const response = await fetch(event.request);
				if (response.ok && ASSETS.includes(new URL(event.request.url).pathname)) {
					cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				const cached = await cache.match(event.request);
				if (cached) return cached;
				if (event.request.mode === 'navigate') {
					const offline = await cache.match('/offline.html');
					if (offline) return offline;
				}
				throw new Error('offline and not cached');
			}
		})()
	);
});
