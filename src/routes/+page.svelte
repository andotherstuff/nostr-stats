<script lang="ts">
import { asset } from '$app/paths'
</script>

<svelte:head>
	<title>Nostr Stats</title>
	<meta name="description" content="Nostr Stats is now offline." />

	<!-- Open Graph (Facebook, LinkedIn, Discord, etc.) -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Nostr Stats" />
	<meta property="og:description" content="Nostr Stats is now offline." />
	<meta property="og:url" content="https://stats.andotherstuff.org" />
	<meta property="og:image" content="https://stats.andotherstuff.org/og-image.webp" />
	<meta property="og:site_name" content="Nostr Stats" />

	<!-- Twitter/X Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://stats.andotherstuff.org" />
	<meta name="twitter:title" content="Nostr Stats" />
	<meta name="twitter:description" content="Nostr Stats is now offline." />
	<meta name="twitter:image" content="https://stats.andotherstuff.org/og-image.webp" />

	<!-- Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-slate-950 text-slate-100">
	<!-- Background -->
	<div class="fixed inset-0 -z-10">
		<div class="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/5 blur-3xl"></div>
		<div class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-600/5 blur-3xl"></div>
	</div>

	<div class="mx-auto w-full max-w-7xl px-3 py-3">
		<!-- Header -->
		<header>
			<h1 class="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-200">
				<img src={asset('logo/SVG/Mark Color on Dark.svg')} alt="Nostr Stats" class="h-7 w-7" />
				<span>Nostr Stats</span>
			</h1>
		</header>
	</div>

	<main class="flex flex-1 items-center justify-center px-4 py-16">
		<div class="max-w-xl text-center">
			<h2 class="text-2xl font-bold tracking-tight text-violet-400 sm:text-3xl">Nostr Stats is offline</h2>
			<p class="mt-4 leading-relaxed text-slate-400">Thanks to everyone who used it.</p>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
		Nostr Stats was an <a href="https://andotherstuff.org" class="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer">And Other Stuff</a> project. Built and maintained by <a href="https://primal.net/jeffg" class="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer">JeffG</a>.
	</footer>
</div>

<style>
:global(body) {
	font-family: 'Outfit', system-ui, sans-serif;
}
</style>
