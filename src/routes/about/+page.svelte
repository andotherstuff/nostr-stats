<script lang="ts">
import { base } from '$app/paths'
</script>

<svelte:head>
	<title>About | Nostr Stats</title>
	<meta name="description" content="About Nostr Stats and the Pensieve indexer" />

	<!-- Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
	<!-- Background -->
	<div class="fixed inset-0 -z-10">
		<div class="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/5 blur-3xl"></div>
		<div class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-600/5 blur-3xl"></div>
	</div>

	<div class="mx-auto max-w-3xl px-4 py-8">
		<!-- Header -->
		<header class="mb-8">
			<a href="{base}/" class="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-4">
				<span>←</span>
				<span>Back to Dashboard</span>
			</a>
			<h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-200">
				<img src="{base}/logo/SVG/Mark Color on Dark.svg" alt="Nostr Stats" class="h-8 w-8" />
				<span>About Nostr Stats</span>
			</h1>
		</header>

		<!-- Content -->
		<main class="space-y-8">
			<!-- Data Source -->
			<section class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-6">
				<h2 class="text-xl font-semibold text-violet-400 mb-4">Where does the data come from?</h2>
				<p class="text-slate-300 leading-relaxed mb-4">
					All data displayed on this dashboard is sourced from
					<a href="https://github.com/andotherstuff/pensieve" class="text-violet-400 hover:text-violet-300 hover:underline font-medium" target="_blank" rel="noopener noreferrer">Pensieve</a>,
					an archive-first Nostr indexer that stores canonical events and provides analytics via ClickHouse.
				</p>
				<p class="text-slate-400 text-sm leading-relaxed">
					Pensieve connects to dozens of public Nostr relays in real-time, ingesting and deduplicating events as they're published across the network.
					This provides a comprehensive view of Nostr activity, though it doesn't capture 100% of all events (private relays, offline relays, etc. are not included).
				</p>
			</section>

			<!-- How It Works -->
			<section class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-6">
				<h2 class="text-xl font-semibold text-cyan-400 mb-4">How does Pensieve work?</h2>
				<div class="space-y-4 text-slate-300 leading-relaxed">
					<div class="flex gap-4">
						<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-sm">1</div>
						<div>
							<h3 class="font-medium text-slate-200 mb-1">Live Relay Ingestion</h3>
							<p class="text-sm text-slate-400">Connects to Nostr relays via WebSocket and streams events in real-time. Includes automatic relay discovery via NIP-65.</p>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-sm">2</div>
						<div>
							<h3 class="font-medium text-slate-200 mb-1">Deduplication</h3>
							<p class="text-sm text-slate-400">Events are deduplicated using RocksDB, ensuring each event is only stored once even if seen on multiple relays.</p>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-sm">3</div>
						<div>
							<h3 class="font-medium text-slate-200 mb-1">Archive Storage</h3>
							<p class="text-sm text-slate-400">Canonical events are stored in notepack segments (gzip compressed) as the source of truth.</p>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-sm">4</div>
						<div>
							<h3 class="font-medium text-slate-200 mb-1">Analytics Index</h3>
							<p class="text-sm text-slate-400">ClickHouse serves as a derived analytics index, enabling fast queries for dashboards like this one.</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Architecture Diagram -->
			<section class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-6">
				<h2 class="text-xl font-semibold text-emerald-400 mb-4">Architecture</h2>
				<div class="font-mono text-xs sm:text-sm text-slate-400 bg-slate-800/50 p-4 rounded-lg overflow-x-auto">
					<pre class="whitespace-pre">┌─────────────────────────────────────────────────────────────────┐
│                        Event Sources                            │
│   [Live Relays]    [JSONL Backfill]    [Proto Backfill]         │
└──────────┬─────────────────┬─────────────────┬──────────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Ingestion Pipeline                          │
│   validate → dedupe (RocksDB) → segment writer → indexer        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌──────────────────────────┐     ┌──────────────────────────────┐
│   Notepack Archive       │     │   ClickHouse                 │
│   (source of truth)      │     │   (analytics index)          │
└──────────────────────────┘     └──────────────────────────────┘</pre>
				</div>
			</section>

			<!-- Links -->
			<section class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-6">
				<h2 class="text-xl font-semibold text-amber-400 mb-4">Learn More</h2>
				<div class="flex flex-wrap gap-4">
					<a
						href="https://github.com/andotherstuff/pensieve"
						class="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/20 transition-colors"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
						<span>Pensieve on GitHub</span>
					</a>
				</div>
			</section>

			<!-- Disclaimer -->
			<section class="text-sm text-slate-500 leading-relaxed">
				<p>
					<strong class="text-slate-400">Note:</strong> Nostr Stats provides an approximation of network activity based on events collected from public relays.
					It does not represent 100% of all Nostr activity. Private relays, paid relays, and events published before indexing began are not included.
				</p>
			</section>
		</main>

		<!-- Footer -->
		<footer class="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
			Nostr Stats is an <a href="https://andotherstuff.org" class="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer">And Other Stuff</a> project. Built and maintained by <a href="https://primal.net/jeffg" class="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer">JeffG</a>.
		</footer>
	</div>
</div>

<style>
:global(body) {
	font-family: 'Outfit', system-ui, sans-serif;
}
:global(.font-mono) {
	font-family: 'JetBrains Mono', ui-monospace, monospace;
}
</style>
