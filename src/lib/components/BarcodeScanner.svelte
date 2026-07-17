<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let { open = $bindable(false), onscan }: { open?: boolean; onscan: (code: string) => void } = $props();

	let video = $state<HTMLVideoElement | null>(null);
	let status = $state<'starting' | 'scanning' | 'error'>('starting');
	let errorMsg = $state('');
	let engine = $state<'native' | 'zxing' | null>(null);

	// One guard per open-cycle so a code is only ever emitted once even if a frame double-fires.
	let emitted = false;

	function emit(code: string) {
		if (emitted) return;
		emitted = true;
		onscan(code.replace(/\D/g, ''));
		open = false;
	}

	$effect(() => {
		if (!open || !video) return;
		emitted = false;
		status = 'starting';
		errorMsg = '';

		let cancelled = false;
		let stream: MediaStream | null = null;
		let pollHandle: ReturnType<typeof setInterval> | undefined;
		let zxingControls: { stop: () => void } | null = null;

		const hasNative = typeof window !== 'undefined' && 'BarcodeDetector' in window;
		engine = hasNative ? 'native' : 'zxing';

		async function start() {
			try {
				if (!navigator.mediaDevices?.getUserMedia) {
					throw new Error('Camera not available — the app must be opened over HTTPS for camera access.');
				}

				if (hasNative) {
					// Chrome/Edge/Android: built-in detector, we drive the camera ourselves.
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const detector = new (window as any).BarcodeDetector({
						formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
					});
					stream = await navigator.mediaDevices.getUserMedia({
						video: { facingMode: 'environment' },
						audio: false
					});
					if (cancelled || !video) return;
					video.srcObject = stream;
					await video.play();
					status = 'scanning';
					pollHandle = setInterval(async () => {
						if (cancelled || !video || video.readyState < 2) return;
						try {
							const codes = await detector.detect(video);
							if (codes.length > 0 && codes[0].rawValue) emit(codes[0].rawValue);
						} catch {
							// Individual frame failures are normal (e.g. video not ready) — keep polling.
						}
					}, 250);
				} else {
					// iOS Safari / Firefox: ZXing fallback, loaded only when actually needed.
					const { BrowserMultiFormatReader } = await import('@zxing/browser');
					if (cancelled || !video) return;
					const reader = new BrowserMultiFormatReader();
					status = 'scanning';
					zxingControls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
						if (result) emit(result.getText());
					});
				}
			} catch (e) {
				if (cancelled) return;
				status = 'error';
				errorMsg =
					e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
						? 'Camera access was denied. Allow camera access for this site and try again.'
						: e instanceof Error
							? e.message
							: 'Could not start the camera.';
			}
		}

		start();

		return () => {
			cancelled = true;
			if (pollHandle) clearInterval(pollHandle);
			zxingControls?.stop();
			stream?.getTracks().forEach((t) => t.stop());
			if (video) video.srcObject = null;
		};
	});
</script>

<Modal bind:open title="Scan barcode">
	<div class="space-y-3">
		<div class="relative overflow-hidden rounded-[var(--radius-md)] bg-black aspect-[4/3]">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={video} playsinline muted class="h-full w-full object-cover"></video>
			{#if status === 'scanning'}
				<div class="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--color-accent)] opacity-80"></div>
			{/if}
		</div>
		{#if status === 'starting'}
			<p class="text-sm text-[var(--color-text-muted)] text-center">Starting camera…</p>
		{:else if status === 'scanning'}
			<p class="text-sm text-[var(--color-text-muted)] text-center">Point the camera at the barcode</p>
		{:else}
			<p class="text-sm text-[var(--color-danger)] text-center">{errorMsg}</p>
		{/if}
	</div>
</Modal>
