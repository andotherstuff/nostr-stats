<script lang="ts">
import { onMount } from 'svelte'
import { asset, resolve } from '$app/paths'
import {
	type ActiveUsersRow,
	type DashboardData,
	type HourlyActivityRow,
	type NewUsersRow,
	type RelayDistributionRow,
	type ThroughputStats,
	type ZapHistogramBucket,
	type ZapStatsAggregate,
	type ZapStatsByPeriod,
} from '#lib/api.ts'
import Chart from '#lib/components/Chart.svelte'
import LoadingSkeleton from '#lib/components/LoadingSkeleton.svelte'
import InfoTooltip from '#lib/components/InfoTooltip.svelte'
import { formatDate, formatNumber, formatSats, percentChange, formatPercent } from '#lib/format.ts'

let { data }: { data: { dashboard: DashboardData } } = $props()

// Header stats - hydrated from server-rendered dashboard payload
let headerCountsLoading = $state(false)
let headerDatesLoading = $state(false)
let totalEvents = $state<number | null>(null)
let totalPubkeys = $state<number | null>(null)
let totalKinds = $state<number | null>(null)
let earliestEvent = $state<number | null>(null)
let latestEvent = $state<number | null>(null)
let lastUpdated = $state<Date | null>(null)

// Section loading states
let dauChartLoading = $state(false)
let wauChartLoading = $state(false)
let mauChartLoading = $state(false)
let newUsersLoading = $state(false)
let newUsersChartLoading = $state(false)
let zapsSummaryLoading = $state(false)
let zapsChartLoading = $state(false)
let zapsHistogramLoading = $state(false)
let throughputLoading = $state(false)
let hourlyActivityLoading = $state(false)
let relayDistributionLoading = $state(false)
let refreshing = $state(false)

// Data
let dailyActiveUsers = $state<ActiveUsersRow[]>([])
let weeklyActiveUsers = $state<ActiveUsersRow[]>([])
let monthlyActiveUsers = $state<ActiveUsersRow[]>([])
let throughput = $state<ThroughputStats | null>(null)
let newUsers = $state<NewUsersRow[]>([])
let newUsersWeekly = $state<NewUsersRow[]>([])
let newUsersMonthly = $state<NewUsersRow[]>([])
let hourlyActivity = $state<HourlyActivityRow[]>([])
let zapStats30d = $state<ZapStatsAggregate | null>(null)
let zapStats90d = $state<ZapStatsAggregate | null>(null)
let zapStatsAllTime = $state<ZapStatsAggregate | null>(null)
let zapsByDay = $state<ZapStatsByPeriod[]>([])
let zapHistogram = $state<ZapHistogramBucket[]>([])
let relayDistribution = $state<RelayDistributionRow[]>([])

// Relay reachability status: 'checking' | 'reachable' | 'unreachable'
let relayStatus = $state<Map<string, 'checking' | 'reachable' | 'unreachable'>>(new Map())

// Check if a relay is reachable via WebSocket (non-blocking)
// Note: Browser console will still show connection errors for unreachable relays -
// these cannot be suppressed from JavaScript as they're logged by the browser's networking layer
function checkRelayReachability(relayUrl: string): void {
	relayStatus.set(relayUrl, 'checking')
	relayStatus = new Map(relayStatus) // Trigger reactivity

	const timeout = 5000 // 5 second timeout
	let ws: WebSocket | null = null
	let timeoutId: ReturnType<typeof setTimeout> | null = null
	let settled = false

	const cleanup = () => {
		if (settled) return
		settled = true
		if (timeoutId) clearTimeout(timeoutId)
		if (ws) {
			ws.onopen = null
			ws.onerror = null
			ws.onclose = null
			try {
				if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
					ws.close()
				}
			} catch {
				// Ignore close errors
			}
		}
	}

	const markReachable = () => {
		if (settled) return
		cleanup()
		relayStatus.set(relayUrl, 'reachable')
		relayStatus = new Map(relayStatus)
	}

	const markUnreachable = () => {
		if (settled) return
		cleanup()
		relayStatus.set(relayUrl, 'unreachable')
		relayStatus = new Map(relayStatus)
	}

	try {
		ws = new WebSocket(relayUrl)
		ws.onopen = markReachable
		ws.onerror = () => markUnreachable() // Wrap to swallow event object
		ws.onclose = (e) => {
			// If closed without ever opening successfully, mark unreachable
			if (!settled && e.code !== 1000) markUnreachable()
		}
		timeoutId = setTimeout(markUnreachable, timeout)
	} catch {
		markUnreachable()
	}
}

// Check all relays in the distribution list
function checkAllRelays(): void {
	for (const relay of relayDistribution) {
		checkRelayReachability(relay.relay_url)
	}
}

// Global error state
let globalError = $state<string | null>(null)

// DAU breakdown chart - skip index 0 (current incomplete day), show last 30 complete days
const dauChartLabels = $derived(
	dailyActiveUsers.slice(1, 31).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const dauChartData = $derived([
	{ label: 'Publishing Users', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.active_users), color: '#56b4e9', fill: true },
	{ label: 'With Profile', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.has_profile), color: '#e69f00', fill: false },
	{ label: 'With Follows', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.has_follows_list), color: '#cc79a7', fill: false },
	{ label: 'Profile + Follows', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.has_profile_and_follows_list), color: '#009e73', fill: false },
])

// WAU breakdown chart - skip index 0 (current incomplete week), show last 24 complete weeks
const wauChartLabels = $derived(
	weeklyActiveUsers.slice(1, 25).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const wauChartData = $derived([
	{ label: 'Publishing Users', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.active_users), color: '#56b4e9', fill: true },
	{ label: 'With Profile', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile), color: '#e69f00', fill: false },
	{ label: 'With Follows', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.has_follows_list), color: '#cc79a7', fill: false },
	{ label: 'Profile + Follows', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile_and_follows_list), color: '#009e73', fill: false },
])

// MAU breakdown chart - skip index 0 (current incomplete month), show last 24 complete months
const mauChartLabels = $derived(
	monthlyActiveUsers.slice(1, 25).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
	})
)

const mauChartData = $derived([
	{ label: 'Publishing Users', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.active_users), color: '#56b4e9', fill: true },
	{ label: 'With Profile', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile), color: '#e69f00', fill: false },
	{ label: 'With Follows', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.has_follows_list), color: '#cc79a7', fill: false },
	{ label: 'Profile + Follows', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile_and_follows_list), color: '#009e73', fill: false },
])

// Calculate % changes for active users (comparing last complete period vs previous)
const dauChange = $derived(() => {
	if (dailyActiveUsers.length < 3) return null
	return percentChange(dailyActiveUsers[1].active_users, dailyActiveUsers[2].active_users)
})

const wauChange = $derived(() => {
	if (weeklyActiveUsers.length < 3) return null
	return percentChange(weeklyActiveUsers[1].active_users, weeklyActiveUsers[2].active_users)
})

const mauChange = $derived(() => {
	if (monthlyActiveUsers.length < 3) return null
	return percentChange(monthlyActiveUsers[1].active_users, monthlyActiveUsers[2].active_users)
})

// Get last complete period data (index 1, since index 0 is current incomplete period)
const lastCompleteDay = $derived(dailyActiveUsers.length > 1 ? dailyActiveUsers[1] : null)
const lastCompleteWeek = $derived(weeklyActiveUsers.length > 1 ? weeklyActiveUsers[1] : null)
const lastCompleteMonth = $derived(monthlyActiveUsers.length > 1 ? monthlyActiveUsers[1] : null)

// Calculate % changes for new users (comparing last complete period vs previous)
const newUsersDailyChange = $derived(() => {
	if (newUsers.length < 3) return null
	return percentChange(newUsers[1]?.new_users ?? 0, newUsers[2]?.new_users ?? 0)
})

const newUsersWeeklyChange = $derived(() => {
	if (newUsers.length < 15) return null
	const thisWeek = newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0)
	const lastWeek = newUsers.slice(8, 15).reduce((a, b) => a + b.new_users, 0)
	return percentChange(thisWeek, lastWeek)
})

const newUsersMonthlyChange = $derived(() => {
	if (newUsers.length < 61) return null
	const thisMonth = newUsers.slice(1, 31).reduce((a, b) => a + b.new_users, 0)
	const lastMonth = newUsers.slice(31, 61).reduce((a, b) => a + b.new_users, 0)
	return percentChange(thisMonth, lastMonth)
})


// New users chart data
// Skip index 0 (current incomplete day), show last 30 complete days
const newUsersLabels = $derived(
	newUsers.slice(1, 31).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const newUsersData = $derived([
	{ label: 'New Users', data: newUsers.slice(1, 31).reverse().map((d) => d.new_users), color: '#009e73', fill: true },
])

// Weekly new users chart data - skip index 0 (current incomplete week), show last 24 complete weeks
const newUsersWeeklyLabels = $derived(
	newUsersWeekly.slice(1, 25).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const newUsersWeeklyData = $derived([
	{ label: 'New Users', data: newUsersWeekly.slice(1, 25).reverse().map((d) => d.new_users), color: '#10b981', fill: true },
])

// Monthly new users chart data - skip index 0 (current incomplete month), show last 24 complete months
const newUsersMonthlyLabels = $derived(
	newUsersMonthly.slice(1, 25).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
	})
)

const newUsersMonthlyData = $derived([
	{ label: 'New Users', data: newUsersMonthly.slice(1, 25).reverse().map((d) => d.new_users), color: '#22c55e', fill: true },
])

// Hourly activity chart data (bar chart for hours 0-23)
const hourlyLabels = $derived(
	hourlyActivity.map((d) => `${d.hour.toString().padStart(2, '0')}:00`)
)

const hourlyData = $derived([
	{ label: 'Avg Events/Day', data: hourlyActivity.map((d) => d.avg_per_day), color: '#cc79a7', fill: true },
])

// Zaps chart data
// Zaps chart - skip index 0 (current incomplete day), show last 30 complete days
const zapsLabels = $derived(
	zapsByDay.slice(1, 31).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

// Combined zaps chart with dual axes (sats on left, count on right)
const zapsCombinedData = $derived([
	{ label: 'Total Sats', data: zapsByDay.slice(1, 31).reverse().map((d) => d.total_sats), color: '#f0e442', fill: true },
	{ label: 'Zap Count', data: zapsByDay.slice(1, 31).reverse().map((d) => d.total_zaps), color: '#d55e00', fill: false },
])

// Zap histogram chart data
const histogramLabels = $derived(
	zapHistogram.map((b) => b.bucket)
)

const histogramData = $derived([
	{ label: 'Zap Count', data: zapHistogram.map((b) => b.count), color: '#e69f00', fill: true },
])

function applyDashboardData(dashboard: DashboardData): void {
	totalEvents = dashboard.totalEvents
	totalPubkeys = dashboard.totalPubkeys
	totalKinds = dashboard.totalKinds
	earliestEvent = dashboard.earliestEvent
	latestEvent = dashboard.latestEvent
	lastUpdated = new Date(dashboard.generatedAt)
	dailyActiveUsers = dashboard.dailyActiveUsers
	weeklyActiveUsers = dashboard.weeklyActiveUsers
	monthlyActiveUsers = dashboard.monthlyActiveUsers
	throughput = dashboard.throughput
	newUsers = dashboard.newUsers
	newUsersWeekly = dashboard.newUsersWeekly
	newUsersMonthly = dashboard.newUsersMonthly
	hourlyActivity = dashboard.hourlyActivity
	zapStats30d = dashboard.zapStats30d
	zapStats90d = dashboard.zapStats90d
	zapStatsAllTime = dashboard.zapStatsAllTime
	zapsByDay = dashboard.zapsByDay
	zapHistogram = dashboard.zapHistogram
	relayDistribution = dashboard.relayDistribution
}

$effect(() => {
	applyDashboardData(data.dashboard)
})

function scheduleRelayChecks(): void {
	relayStatus = new Map()
	const runChecks = () => {
		if (relayDistribution.length > 0) {
			checkAllRelays()
		}
	}

	if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
		window.requestIdleCallback(runChecks, { timeout: 1500 })
		return
	}

	setTimeout(runChecks, 100)
}

async function fetchDashboard(): Promise<DashboardData> {
	const res = await fetch(resolve('/api/dashboard'), {
		cache: 'no-store',
	})

	if (!res.ok) {
		throw new Error(`Dashboard refresh failed: ${res.status} ${res.statusText}`)
	}

	return res.json()
}

async function loadAllData() {
	if (refreshing) return
	refreshing = true
	globalError = null

	try {
		const dashboard = await fetchDashboard()
		applyDashboardData(dashboard)
		scheduleRelayChecks()
	} catch (error) {
		console.warn('Dashboard refresh failed:', error)
		globalError = error instanceof Error ? error.message : 'Failed to refresh dashboard data.'
	} finally {
		refreshing = false
	}
}

const isAnyLoading = $derived(refreshing)

onMount(() => {
	scheduleRelayChecks()
	const interval = setInterval(loadAllData, 5 * 60 * 1000)
	return () => clearInterval(interval)
})
</script>

<svelte:head>
	<title>Nostr Stats</title>
	<meta name="description" content="Real-time analytics for the Nostr network" />

	<!-- Open Graph (Facebook, LinkedIn, Discord, etc.) -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Nostr Stats" />
	<meta property="og:description" content="Real-time analytics for the Nostr network" />
	<meta property="og:url" content="https://stats.andotherstuff.org" />
	<meta property="og:image" content="https://stats.andotherstuff.org/og-image.webp" />
	<meta property="og:site_name" content="Nostr Stats" />

	<!-- Twitter/X Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://stats.andotherstuff.org" />
	<meta name="twitter:title" content="Nostr Stats" />
	<meta name="twitter:description" content="Real-time analytics for the Nostr network" />
	<meta name="twitter:image" content="https://stats.andotherstuff.org/og-image.webp" />

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

	<div class="mx-auto max-w-7xl px-3 py-3">
		<!-- Header -->
		<header class="mb-8">
			<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
				<h1 class="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-200">
					<img src={asset('logo/SVG/Mark Color on Dark.svg')} alt="Nostr Stats" class="h-7 w-7" />
					<span>Nostr Stats</span>
				</h1>
				<div class="flex items-center gap-2 sm:gap-3 text-xs order-last sm:order-none w-full sm:w-auto">
					{#if headerCountsLoading}
						<LoadingSkeleton type="header-stat" />
					{:else if totalEvents !== null}
						<span class="text-slate-500">
							<span class="text-slate-400">Indexed:</span>
							<span class="font-mono text-slate-300">{formatNumber(totalEvents)}</span> events
							{#if headerDatesLoading}
								<span class="text-slate-600 mx-1">·</span>
								<span class="text-slate-600 animate-pulse">loading dates...</span>
							{:else if earliestEvent !== null && latestEvent !== null}
								<span class="text-slate-600 mx-1">·</span>
								<span>{formatDate(earliestEvent)} – {formatDate(latestEvent)}</span>
							{/if}
						</span>
					{/if}
				</div>
			<div class="flex items-center gap-2 text-xs">
				<a href={resolve('/about')} class="font-semibold text-slate-400 underline decoration-slate-600 hover:text-violet-400 hover:decoration-violet-400 transition-colors">About</a>
				{#if lastUpdated}
					<span class="text-slate-500 hidden sm:inline">{lastUpdated.toLocaleTimeString()}</span>
				{/if}
				<button onclick={loadAllData} disabled={isAnyLoading} class="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-300 hover:border-violet-500/50 disabled:opacity-50">
					{isAnyLoading ? '...' : '↻'}
				</button>
			</div>
			</div>
		</header>

		{#if globalError}
			<div class="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
				<strong>Error:</strong> {globalError}
			</div>
		{/if}

		<!-- Publishing Users Section -->
		<section class="mb-12">
			<h2 class="mb-4">
				<div class="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">Publishing Users</div>
				<div class="mt-1 text-xs font-normal text-slate-500">Users publishing events, excludes single-use keys (gift wraps, Marmot)</div>
			</h2>

			<!-- Active Users Summary (last complete period) -->
			{#if dauChartLoading || wauChartLoading || mauChartLoading}
				<div class="mb-3">
					<LoadingSkeleton type="stat-row" />
				</div>
			{:else if lastCompleteDay && lastCompleteWeek && lastCompleteMonth}
				<div class="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="rounded-lg border border-violet-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>Publishing Yesterday<InfoTooltip text="Unique pubkeys that published at least one event yesterday (last complete day). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-violet-500/20 px-1.5 py-0.5 text-violet-400">DPU</span>
						</div>
						<div class="mt-1.5 flex items-baseline gap-2">
							<span class="font-mono text-3xl font-bold text-violet-400">{formatNumber(lastCompleteDay.active_users)}</span>
							{#if dauChange() !== null}
								<span class="text-sm {dauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(dauChange()!)}</span>
							{/if}
						</div>
					</div>

					<div class="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>Publishing Last Week<InfoTooltip text="Unique pubkeys that published at least one event last week (last complete 7-day period). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-400">WPU</span>
						</div>
						<div class="mt-1.5 flex items-baseline gap-2">
							<span class="font-mono text-3xl font-bold text-cyan-400">{formatNumber(lastCompleteWeek.active_users)}</span>
							{#if wauChange() !== null}
								<span class="text-sm {wauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(wauChange()!)}</span>
							{/if}
						</div>
					</div>

					<div class="rounded-lg border border-pink-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>Publishing Last Month<InfoTooltip text="Unique pubkeys that published at least one event last month (last complete calendar month). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-pink-500/20 px-1.5 py-0.5 text-pink-400">MPU</span>
						</div>
						<div class="mt-1.5 flex items-baseline gap-2">
							<span class="font-mono text-3xl font-bold text-pink-400">{formatNumber(lastCompleteMonth.active_users)}</span>
							{#if mauChange() !== null}
								<span class="text-sm {mauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(mauChange()!)}</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Individual DAU/WAU/MAU Breakdown Charts -->
			<div class="grid gap-3 md:grid-cols-3">
				{#if dauChartLoading}
					<LoadingSkeleton type="chart" height={180} />
				{:else if dailyActiveUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
						<h3 class="mb-2 text-sm font-semibold text-slate-400">Daily Publishing Users (30d)<InfoTooltip text="Unique pubkeys that published at least one event during each 24-hour period. Excludes kinds published with single-use keys (gift wraps—kind 1059, Marmot messages—kind 445)." /></h3>
						<Chart labels={dauChartLabels} datasets={dauChartData} height={180} />
					</div>
				{/if}
				{#if wauChartLoading}
					<LoadingSkeleton type="chart" height={180} />
				{:else if weeklyActiveUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
						<h3 class="mb-2 text-sm font-semibold text-slate-400">Weekly Publishing Users (24w)<InfoTooltip text="Unique pubkeys that published at least one event during each 7-day period. Excludes kinds published with single-use keys (gift wraps—kind 1059, Marmot messages—kind 445)." /></h3>
						<Chart labels={wauChartLabels} datasets={wauChartData} height={180} />
					</div>
				{/if}
				{#if mauChartLoading}
					<LoadingSkeleton type="chart" height={180} />
				{:else if monthlyActiveUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
						<h3 class="mb-2 text-sm font-semibold text-slate-400">Monthly Publishing Users (24m)<InfoTooltip text="Unique pubkeys that published at least one event during each 30-day period. Excludes kinds published with single-use keys (gift wraps—kind 1059, Marmot messages—kind 445)." /></h3>
						<Chart labels={mauChartLabels} datasets={mauChartData} height={180} />
					</div>
				{/if}
			</div>
		</section>

		<!-- New Users Section -->
		<section class="mb-12">
			<h2 class="mb-4">
				<div class="text-2xl sm:text-3xl font-bold tracking-tight text-teal-400">New Users</div>
				<div class="mt-1 text-xs font-normal text-slate-500">First-time pubkeys publishing events</div>
			</h2>

			<!-- New Users Summary (last complete periods) -->
			{#if newUsersLoading}
				<div class="mb-3">
					<LoadingSkeleton type="stat-row" />
				</div>
			{:else if newUsers.length >= 91}
				<div class="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="rounded-lg border border-teal-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>New Yesterday<InfoTooltip text="First-time pubkeys seen publishing any event yesterday (last complete day). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-teal-500/20 px-1.5 py-0.5 text-teal-400">1d</span>
						</div>
						<div class="mt-1.5 flex items-baseline gap-2">
							<span class="font-mono text-3xl font-bold text-teal-400">{formatNumber(newUsers[1]?.new_users ?? 0)}</span>
							{#if newUsersDailyChange() !== null}
								<span class="text-sm {newUsersDailyChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(newUsersDailyChange()!)}</span>
							{/if}
						</div>
						<div class="mt-2 text-sm text-slate-500 space-y-1">
							<div class="flex justify-between"><span>2 days ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers[2]?.new_users ?? 0)}</span></div>
							<div class="flex justify-between"><span>3 days ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers[3]?.new_users ?? 0)}</span></div>
							<div class="flex justify-between"><span>7d avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0) / 7))}</span></div>
						</div>
					</div>
					<div class="rounded-lg border border-emerald-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>New Last Week<InfoTooltip text="Total first-time pubkeys in the last complete 7-day period. Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400">7d</span>
						</div>
						<div class="mt-1.5 flex items-baseline gap-2">
							<span class="font-mono text-3xl font-bold text-emerald-400">{formatNumber(newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0))}</span>
							{#if newUsersWeeklyChange() !== null}
								<span class="text-sm {newUsersWeeklyChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(newUsersWeeklyChange()!)}</span>
							{/if}
						</div>
						<div class="mt-2 text-sm text-slate-500 space-y-1">
							<div class="flex justify-between"><span>prev week</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(8, 15).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>2 weeks ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(15, 22).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>daily avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0) / 7))}</span></div>
						</div>
					</div>
					<div class="rounded-lg border border-lime-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>New Last Month<InfoTooltip text="Total first-time pubkeys in the last complete 30-day period. Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-lime-500/20 px-1.5 py-0.5 text-lime-400">30d</span>
						</div>
						<div class="mt-1.5 flex items-baseline gap-2">
							<span class="font-mono text-3xl font-bold text-lime-400">{formatNumber(newUsers.slice(1, 31).reduce((a, b) => a + b.new_users, 0))}</span>
							{#if newUsersMonthlyChange() !== null}
								<span class="text-sm {newUsersMonthlyChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(newUsersMonthlyChange()!)}</span>
							{/if}
						</div>
						<div class="mt-2 text-sm text-slate-500 space-y-1">
							<div class="flex justify-between"><span>prev month</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(31, 61).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>2 months ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(61, 91).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>daily avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(1, 31).reduce((a, b) => a + b.new_users, 0) / 30))}</span></div>
						</div>
					</div>
				</div>
			{/if}

			<!-- New Users Charts (Daily/Weekly/Monthly) -->
			<div class="grid gap-3 md:grid-cols-3">
				{#if newUsersChartLoading}
					<LoadingSkeleton type="chart" height={180} />
					<LoadingSkeleton type="chart" height={180} />
					<LoadingSkeleton type="chart" height={180} />
				{:else}
					{#if newUsers.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
							<h3 class="mb-2 text-sm font-semibold text-slate-400">Daily New Users (30d)<InfoTooltip text="First-time pubkeys seen publishing any event each day. A pubkey is counted as 'new' on the day of their first indexed event." /></h3>
							<Chart labels={newUsersLabels} datasets={newUsersData} height={180} />
						</div>
					{/if}
					{#if newUsersWeekly.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
							<h3 class="mb-2 text-sm font-semibold text-slate-400">Weekly New Users (24w)<InfoTooltip text="First-time pubkeys seen publishing any event each week. A pubkey is counted as 'new' in the week of their first indexed event." /></h3>
							<Chart labels={newUsersWeeklyLabels} datasets={newUsersWeeklyData} height={180} />
						</div>
					{/if}
					{#if newUsersMonthly.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
							<h3 class="mb-2 text-sm font-semibold text-slate-400">Monthly New Users (24m)<InfoTooltip text="First-time pubkeys seen publishing any event each month. A pubkey is counted as 'new' in the month of their first indexed event." /></h3>
							<Chart labels={newUsersMonthlyLabels} datasets={newUsersMonthlyData} height={180} />
						</div>
					{/if}
				{/if}
			</div>
		</section>

		<!-- Zaps Section -->
		<section class="mb-12">
			<h2 class="mb-4">
				<div class="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">Zaps</div>
				<div class="mt-1 text-xs font-normal text-slate-500">Lightning payments on Nostr</div>
			</h2>

			<!-- Zap Summary Tiles -->
			{#if zapsSummaryLoading}
				<div class="mb-3">
					<LoadingSkeleton type="stat-row" />
				</div>
			{:else if zapStats30d || zapStats90d || zapStatsAllTime}
				<div class="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
					{#if zapStats30d}
						<div class="rounded-lg border border-amber-500/20 bg-slate-900/50 p-3">
							<div class="flex items-center justify-between text-sm text-slate-400">
								<span>30 Days<InfoTooltip text="Zap statistics for the last 30 days. Based on kind 9735 zap receipt events. Shows total sats, zap count, average zap size, and unique senders." /></span>
							</div>
							<div class="mt-1.5 font-mono text-2xl font-bold text-amber-400">{formatSats(zapStats30d.total_sats)}</div>
							<div class="mt-2 text-sm text-slate-500 space-y-1">
								<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStats30d.total_zaps)}</span></div>
								<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatSats(Math.round(zapStats30d.avg_zap_sats))}</span></div>
								<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStats30d.unique_senders)}</span></div>
							</div>
						</div>
					{/if}
					{#if zapStats90d}
						<div class="rounded-lg border border-orange-500/20 bg-slate-900/50 p-3">
							<div class="flex items-center justify-between text-sm text-slate-400">
								<span>90 Days<InfoTooltip text="Zap statistics for the last 90 days. Based on kind 9735 zap receipt events. Shows total sats, zap count, average zap size, and unique senders." /></span>
							</div>
							<div class="mt-1.5 font-mono text-2xl font-bold text-orange-400">{formatSats(zapStats90d.total_sats)}</div>
							<div class="mt-2 text-sm text-slate-500 space-y-1">
								<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStats90d.total_zaps)}</span></div>
								<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatSats(Math.round(zapStats90d.avg_zap_sats))}</span></div>
								<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStats90d.unique_senders)}</span></div>
							</div>
						</div>
					{/if}
					{#if zapStatsAllTime}
						<div class="rounded-lg border border-yellow-500/20 bg-slate-900/50 p-3">
							<div class="flex items-center justify-between text-sm text-slate-400">
								<span>All Time<InfoTooltip text="Cumulative zap statistics for all indexed zap receipt events. Shows total sats, zap count, average zap size, and unique senders." /></span>
							</div>
							<div class="mt-1.5 font-mono text-2xl font-bold text-yellow-400">{formatSats(zapStatsAllTime.total_sats)}</div>
							<div class="mt-2 text-sm text-slate-500 space-y-1">
								<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStatsAllTime.total_zaps)}</span></div>
								<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatSats(Math.round(zapStatsAllTime.avg_zap_sats))}</span></div>
								<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStatsAllTime.unique_senders)}</span></div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if zapsChartLoading}
				<div class="mb-3">
					<LoadingSkeleton type="chart" height={180} />
				</div>
			{:else if zapsByDay.length > 0}
				<div class="mb-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
					<h3 class="mb-2 text-sm font-semibold text-slate-400">Zaps Over Time (30d)<InfoTooltip text="Total sats zapped (left axis, area) and number of zap events (right axis, line) per day. Based on kind 9735 zap receipt events." /></h3>
					<Chart labels={zapsLabels} datasets={zapsCombinedData} dualAxis={true} height={180} />
				</div>
			{/if}

			{#if zapsHistogramLoading}
				<LoadingSkeleton type="chart" height={180} />
			{:else if zapHistogram.length > 0}
				<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
					<h3 class="mb-2 text-sm font-semibold text-slate-400">Zap Amount Distribution (30d)<InfoTooltip text="Distribution of zap amounts by bucket. Shows how many zaps fall into each sats range (e.g., 1–10 sats, 11–100 sats, etc.)." /></h3>
					<Chart labels={histogramLabels} datasets={histogramData} type="bar" height={180} />
				</div>
			{/if}
		</section>

		<!-- Relay Distribution Section -->
		<section class="mb-12">
			<h2 class="mb-4">
				<div class="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">Relay Distribution</div>
				<div class="mt-1 text-xs font-normal text-slate-500">User relay preferences from NIP-65</div>
			</h2>

			{#if relayDistributionLoading}
				<LoadingSkeleton type="table" rows={10} />
			{:else if relayDistribution.length > 0}
				<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
					<h3 class="mb-2 text-sm font-semibold text-slate-400">Top Relays by User Count<InfoTooltip text="Relay popularity based on NIP-65 relay lists (kind 10002). Shows how many users have each relay in their outbox model configuration. Read = users who read from this relay, Write = users who write to this relay." /></h3>
					<div class="overflow-x-auto -mx-3 px-3">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-slate-700/50 text-left text-xs uppercase tracking-wider text-slate-500">
									<th class="py-2 pr-3">#</th>
									<th class="py-2 pr-2 text-center">Status</th>
									<th class="py-2 pr-3">Relay</th>
									<th class="py-2 px-2 text-right">Users</th>
									<th class="py-2 px-2 text-right">Read</th>
									<th class="py-2 px-2 text-right">Write</th>
								</tr>
							</thead>
							<tbody>
								{#each relayDistribution as relay, i}
									{@const status = relayStatus.get(relay.relay_url) ?? 'checking'}
									<tr class="border-b border-slate-800/50 hover:bg-slate-800/30">
										<td class="py-2 pr-3 text-slate-500 font-mono">{i + 1}</td>
										<td class="py-2 pr-2 text-center">
											{#if status === 'checking'}
												<span class="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" title="Checking..."></span>
											{:else if status === 'reachable'}
												<span class="inline-block w-2.5 h-2.5 rounded-full bg-green-400" title="Reachable"></span>
											{:else}
												<span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400" title="Unreachable"></span>
											{/if}
										</td>
										<td class="py-2 pr-3 font-mono text-sky-400 text-sm truncate max-w-[200px] sm:max-w-[300px]" title={relay.relay_url}>
											{relay.relay_url.replace('wss://', '')}
										</td>
										<td class="py-2 px-2 text-right font-mono text-slate-300">{formatNumber(relay.user_count)}</td>
										<td class="py-2 px-2 text-right font-mono text-slate-400">{formatNumber(relay.read_count)}</td>
										<td class="py-2 px-2 text-right font-mono text-slate-400">{formatNumber(relay.write_count)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="mt-2 text-xs text-slate-500">
						Based on latest NIP-65 relay list (kind 10002) per user. Data refreshed every 6 hours.
					</div>
				</div>
			{/if}
		</section>

		<!-- Events Section -->
		<section class="mb-12">
			<h2 class="mb-4">
				<div class="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">Events</div>
				<div class="mt-1 text-xs font-normal text-slate-500">Event publishing activity</div>
			</h2>

			<!-- Throughput Summary -->
			<div class="mb-3">
				{#if throughputLoading}
					<div class="rounded-lg border border-slate-700/30 bg-slate-900/50 p-3 animate-pulse">
						<div class="h-3 w-28 rounded bg-slate-700/50 mb-2"></div>
						<div class="h-7 w-20 rounded bg-slate-700/40 mb-2"></div>
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<div class="h-2.5 w-12 rounded bg-slate-800/50"></div>
								<div class="h-2.5 w-16 rounded bg-slate-800/50"></div>
							</div>
							<div class="flex justify-between">
								<div class="h-2.5 w-14 rounded bg-slate-800/50"></div>
								<div class="h-2.5 w-14 rounded bg-slate-800/50"></div>
							</div>
						</div>
					</div>
				{:else if throughput}
					<div class="rounded-lg border border-indigo-500/20 bg-slate-900/50 p-3">
						<div class="flex items-center justify-between text-sm text-slate-400">
							<span>Throughput (7d avg)<InfoTooltip text="Average events indexed per hour over the last 7 days. Shows total event volume and daily average." /></span>
						</div>
						<div class="mt-1.5 font-mono text-2xl font-bold text-indigo-400">{formatNumber(Math.round(throughput.events_per_hour))}<span class="text-base text-slate-500">/hr</span></div>
						<div class="mt-2 text-sm text-slate-500 space-y-1">
							<div class="flex justify-between"><span>7d total</span><span class="font-mono text-slate-400">{formatNumber(throughput.total_events_7d)}</span></div>
							<div class="flex justify-between"><span>per day</span><span class="font-mono text-slate-400">{formatNumber(Math.round(throughput.total_events_7d / 7))}</span></div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Hourly Activity -->
			{#if hourlyActivityLoading}
				<div class="mb-3">
					<LoadingSkeleton type="chart" height={160} />
				</div>
			{:else if hourlyActivity.length > 0}
				<div class="mb-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
					<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
						<h3 class="text-sm font-semibold text-slate-400">Event publishing by hour, UTC (7d avg)<InfoTooltip text="Average number of events published per hour of the day (UTC), averaged over the last 7 days. Shows when users are most active." /></h3>
					</div>
					<Chart labels={hourlyLabels} datasets={hourlyData} type="bar" height={160} />
				</div>
			{/if}
		</section>
	</div>

	<!-- Footer -->
	<footer class="mt-8 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
		Nostr Stats is an <a href="https://andotherstuff.org" class="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer">And Other Stuff</a> project. Built and maintained by <a href="https://primal.net/jeffg" class="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer">JeffG</a>.
	</footer>
</div>

<style>
:global(body) {
	font-family: 'Outfit', system-ui, sans-serif;
}
:global(.font-mono) {
	font-family: 'JetBrains Mono', ui-monospace, monospace;
}
</style>
