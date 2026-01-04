<script lang="ts">
import { onMount } from 'svelte'
import {
	type ActiveUsersRow,
	type EventCountByPeriod,
	type EngagementStats,
	type HourlyActivityRow,
	type NewUsersRow,
	type RetentionCohort,
	type ThroughputStats,
	type ZapStatsAggregate,
	type ZapStatsByPeriod,
	type ZapHistogramBucket,
	getActiveUsersDaily,
	getActiveUsersMonthly,
	getActiveUsersWeekly,
	getEngagement,
	getEventsByDay,
	getHourlyActivity,
	getKinds,
	getKindActivity,
	getNewUsers,
	getKindName,
	getThroughput,
	getUserRetention,
	getZapStats,
	getZapStatsByDay,
	getZapHistogram,
	getTotalEvents,
	getTotalPubkeys,
	getTotalKinds,
	getEarliestEvent,
	getLatestEvent,
	type KindSummary,
	type KindActivityRow,
} from '$lib/api'
import Chart from '$lib/components/Chart.svelte'
import SortableTable from '$lib/components/SortableTable.svelte'
import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte'
import InfoTooltip from '$lib/components/InfoTooltip.svelte'
import { formatDate, formatNumber, formatSats, percentChange, formatPercent } from '$lib/format'

// Header stats - individual loading
let headerLoading = $state(true)
let totalEvents = $state<number | null>(null)
let totalPubkeys = $state<number | null>(null)
let totalKinds = $state<number | null>(null)
let earliestEvent = $state<number | null>(null)
let latestEvent = $state<number | null>(null)
let lastUpdated = $state<Date | null>(null)

// Section loading states
let dauChartLoading = $state(true)
let wauChartLoading = $state(true)
let mauChartLoading = $state(true)
let newUsersLoading = $state(true)
let newUsersChartLoading = $state(true)
let retentionLoading = $state(true)
let zapsSummaryLoading = $state(true)
let zapsChartLoading = $state(true)
let zapsHistogramLoading = $state(true)
let engagementLoading = $state(true)
let throughputLoading = $state(true)
let hourlyActivityLoading = $state(true)
let dailyEventsLoading = $state(true)
let topKindsLoading = $state(true)

// Data
let dailyActiveUsers = $state<ActiveUsersRow[]>([])
let weeklyActiveUsers = $state<ActiveUsersRow[]>([])
let monthlyActiveUsers = $state<ActiveUsersRow[]>([])
let dailyEvents = $state<EventCountByPeriod[]>([])
let topKinds = $state<KindSummary[]>([])
let kindActivityData = $state<Map<number, KindActivityRow[]>>(new Map())
let throughput = $state<ThroughputStats | null>(null)
let newUsers = $state<NewUsersRow[]>([])
let retention = $state<RetentionCohort[]>([])
let hourlyActivity = $state<HourlyActivityRow[]>([])
let zapStats30d = $state<ZapStatsAggregate | null>(null)
let zapStats90d = $state<ZapStatsAggregate | null>(null)
let zapStatsAllTime = $state<ZapStatsAggregate | null>(null)
let zapsByDay = $state<ZapStatsByPeriod[]>([])
let zapHistogram = $state<ZapHistogramBucket[]>([])
let engagement = $state<EngagementStats | null>(null)

// Global error state
let globalError = $state<string | null>(null)

// Chart colors for kinds
const KIND_COLORS = [
	'#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#fbbf24',
	'#fb7185', '#818cf8', '#2dd4bf', '#f97316', '#a3e635',
]

// DAU breakdown chart - skip index 0 (current incomplete day), show last 30 complete days
const dauChartLabels = $derived(
	dailyActiveUsers.slice(1, 31).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const dauChartData = $derived([
	{ label: 'Publishing Users', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.active_users), color: '#a78bfa', fill: true },
	{ label: 'With Profile', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.has_profile), color: '#22d3ee', fill: false },
	{ label: 'With Follows', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.has_follows_list), color: '#34d399', fill: false },
	{ label: 'Profile + Follows', data: dailyActiveUsers.slice(1, 31).reverse().map((d) => d.has_profile_and_follows_list), color: '#fbbf24', fill: false },
])

// WAU breakdown chart - skip index 0 (current incomplete week), show last 24 complete weeks
const wauChartLabels = $derived(
	weeklyActiveUsers.slice(1, 25).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const wauChartData = $derived([
	{ label: 'Publishing Users', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.active_users), color: '#22d3ee', fill: true },
	{ label: 'With Profile', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile), color: '#a78bfa', fill: false },
	{ label: 'With Follows', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.has_follows_list), color: '#34d399', fill: false },
	{ label: 'Profile + Follows', data: weeklyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile_and_follows_list), color: '#fbbf24', fill: false },
])

// MAU breakdown chart - skip index 0 (current incomplete month), show last 24 complete months
const mauChartLabels = $derived(
	monthlyActiveUsers.slice(1, 25).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
	})
)

const mauChartData = $derived([
	{ label: 'Publishing Users', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.active_users), color: '#f472b6', fill: true },
	{ label: 'With Profile', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile), color: '#a78bfa', fill: false },
	{ label: 'With Follows', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.has_follows_list), color: '#34d399', fill: false },
	{ label: 'Profile + Follows', data: monthlyActiveUsers.slice(1, 25).reverse().map((d) => d.has_profile_and_follows_list), color: '#fbbf24', fill: false },
])

// Daily events stacked bar chart
const eventsChartLabels = $derived(
	dailyEvents.slice(0, 30).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const eventsStackedData = $derived(() => {
	const top10Kinds = topKinds.slice(0, 10)
	const periods = dailyEvents.slice(0, 30).reverse().map((d) => d.period)

	const datasets = top10Kinds.map((kind, idx) => {
		const activity = kindActivityData.get(kind.kind) || []
		const data = periods.map((period) => {
			const match = activity.find((a) => a.period === period)
			return match?.event_count ?? 0
		})
		return {
			label: getKindName(kind.kind),
			data,
			color: KIND_COLORS[idx % KIND_COLORS.length],
			fill: true,
		}
	})

	const otherData = periods.map((period, i) => {
		const total = dailyEvents.slice(0, 30).reverse()[i]?.count ?? 0
		const known = datasets.reduce((sum, ds) => sum + ds.data[i], 0)
		return Math.max(0, total - known)
	})

	datasets.push({
		label: 'Other',
		data: otherData,
		color: '#64748b',
		fill: true,
	})

	return datasets
})

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


// New users chart data
// Skip index 0 (current incomplete day), show last 30 complete days
const newUsersLabels = $derived(
	newUsers.slice(1, 31).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const newUsersData = $derived([
	{ label: 'New Users', data: newUsers.slice(1, 31).reverse().map((d) => d.new_users), color: '#34d399', fill: true },
])

// Hourly activity chart data (bar chart for hours 0-23)
const hourlyLabels = $derived(
	hourlyActivity.map((d) => `${d.hour.toString().padStart(2, '0')}:00`)
)

const hourlyData = $derived([
	{ label: 'Avg Events/Day', data: hourlyActivity.map((d) => d.avg_per_day), color: '#f472b6', fill: true },
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
	{ label: 'Total Sats', data: zapsByDay.slice(1, 31).reverse().map((d) => d.total_sats), color: '#fbbf24', fill: true },
	{ label: 'Zap Count', data: zapsByDay.slice(1, 31).reverse().map((d) => d.total_zaps), color: '#fb7185', fill: false },
])

// Zap histogram chart data
const histogramLabels = $derived(
	zapHistogram.map((b) => b.bucket)
)

const histogramData = $derived([
	{ label: 'Zap Count', data: zapHistogram.map((b) => b.count), color: '#fbbf24', fill: true },
])

// Helper to safely fetch with fallback
async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
	try {
		return await promise
	} catch (e) {
		console.warn('API call failed:', e)
		return fallback
	}
}

// Independent data loaders - each runs in parallel
async function loadHeaderStats() {
	headerLoading = true
	try {
		const [events, pubkeys, kinds, earliest, latest] = await Promise.all([
			getTotalEvents(),
			getTotalPubkeys(),
			getTotalKinds(),
			getEarliestEvent(),
			getLatestEvent(),
		])
		totalEvents = events.count
		totalPubkeys = pubkeys.count
		totalKinds = kinds.count
		earliestEvent = earliest.timestamp
		latestEvent = latest.timestamp
		lastUpdated = new Date()
	} catch (e) {
		console.warn('Header stats failed:', e)
	} finally {
		headerLoading = false
	}
}


async function loadDauChart() {
	dauChartLoading = true
	try {
		dailyActiveUsers = await getActiveUsersDaily(60)
	} catch (e) {
		console.warn('DAU chart failed:', e)
	} finally {
		dauChartLoading = false
	}
}

async function loadWauChart() {
	wauChartLoading = true
	try {
		weeklyActiveUsers = await getActiveUsersWeekly(24)
	} catch (e) {
		console.warn('WAU chart failed:', e)
	} finally {
		wauChartLoading = false
	}
}

async function loadMauChart() {
	mauChartLoading = true
	try {
		monthlyActiveUsers = await getActiveUsersMonthly(24)
	} catch (e) {
		console.warn('MAU chart failed:', e)
	} finally {
		mauChartLoading = false
	}
}

async function loadNewUsers() {
	newUsersLoading = true
	newUsersChartLoading = true
	try {
		newUsers = await getNewUsers('day', 92)
	} catch (e) {
		console.warn('New users failed:', e)
	} finally {
		newUsersLoading = false
		newUsersChartLoading = false
	}
}

async function loadRetention() {
	retentionLoading = true
	try {
		retention = await getUserRetention('week', 12)
	} catch (e) {
		console.warn('Retention failed:', e)
	} finally {
		retentionLoading = false
	}
}

async function loadZapsSummary() {
	zapsSummaryLoading = true
	try {
		const [stats30d, stats90d, statsAllTime] = await Promise.all([
			safeFetch(getZapStats(30), null),
			safeFetch(getZapStats(90), null),
			safeFetch(getZapStats(10000), null),
		])
		zapStats30d = stats30d
		zapStats90d = stats90d
		zapStatsAllTime = statsAllTime
	} catch (e) {
		console.warn('Zaps summary failed:', e)
	} finally {
		zapsSummaryLoading = false
	}
}

async function loadZapsChart() {
	zapsChartLoading = true
	try {
		zapsByDay = await getZapStatsByDay(31, 31)
	} catch (e) {
		console.warn('Zaps chart failed:', e)
	} finally {
		zapsChartLoading = false
	}
}

async function loadZapsHistogram() {
	zapsHistogramLoading = true
	try {
		zapHistogram = await getZapHistogram(30)
	} catch (e) {
		console.warn('Zaps histogram failed:', e)
	} finally {
		zapsHistogramLoading = false
	}
}

async function loadEngagement() {
	engagementLoading = true
	try {
		engagement = await getEngagement(30)
	} catch (e) {
		console.warn('Engagement failed:', e)
	} finally {
		engagementLoading = false
	}
}

async function loadThroughput() {
	throughputLoading = true
	try {
		throughput = await getThroughput()
	} catch (e) {
		console.warn('Throughput failed:', e)
	} finally {
		throughputLoading = false
	}
}

async function loadHourlyActivity() {
	hourlyActivityLoading = true
	try {
		hourlyActivity = await getHourlyActivity(7)
	} catch (e) {
		console.warn('Hourly activity failed:', e)
	} finally {
		hourlyActivityLoading = false
	}
}

async function loadDailyEvents() {
	dailyEventsLoading = true
	try {
		dailyEvents = await getEventsByDay(30)
	} catch (e) {
		console.warn('Daily events failed:', e)
	} finally {
		dailyEventsLoading = false
	}
}

async function loadTopKinds() {
	topKindsLoading = true
	try {
		const kindsData = await getKinds(50)
		topKinds = kindsData

		// Load kind activity data for stacked chart
		const top10 = kindsData.slice(0, 10)
		const activityResults = await Promise.all(
			top10.map((k) => safeFetch(getKindActivity(k.kind, 30), []))
		)
		const activityMap = new Map<number, KindActivityRow[]>()
		top10.forEach((k, i) => activityMap.set(k.kind, activityResults[i]))
		kindActivityData = activityMap
	} catch (e) {
		console.warn('Top kinds failed:', e)
	} finally {
		topKindsLoading = false
	}
}

// Load all data in parallel - each section loads independently
async function loadAllData() {
	globalError = null

	// Fire off all loaders in parallel - they each manage their own loading state
	await Promise.all([
		loadHeaderStats(),
		loadDauChart(),
		loadWauChart(),
		loadMauChart(),
		loadNewUsers(),
		loadRetention(),
		loadZapsSummary(),
		loadZapsChart(),
		loadZapsHistogram(),
		loadEngagement(),
		loadThroughput(),
		loadHourlyActivity(),
		loadDailyEvents(),
		loadTopKinds(),
	])
}

// Check if any section is still loading
const isAnyLoading = $derived(
	headerLoading || dauChartLoading || wauChartLoading ||
	mauChartLoading || newUsersLoading || retentionLoading || zapsSummaryLoading ||
	zapsChartLoading || zapsHistogramLoading || engagementLoading || throughputLoading ||
	hourlyActivityLoading || dailyEventsLoading || topKindsLoading
)

onMount(() => {
	loadAllData()
	const interval = setInterval(loadAllData, 5 * 60 * 1000)
	return () => clearInterval(interval)
})
</script>

<svelte:head>
	<title>Nostr Stats</title>
	<meta name="description" content="Real-time analytics for the Nostr network" />
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
		<header class="mb-3">
			<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
				<h1 class="text-xl font-bold tracking-tight">
					<span class="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Nostr</span> Stats
				</h1>
				<div class="flex items-center gap-2 sm:gap-3 text-xs order-last sm:order-none w-full sm:w-auto">
					{#if headerLoading}
						<LoadingSkeleton type="header-stat" />
					{:else if totalEvents !== null}
						<span class="text-slate-500">
							<span class="text-slate-400">Indexed:</span>
							<span class="font-mono text-slate-300">{formatNumber(totalEvents)}</span> events
							{#if earliestEvent !== null && latestEvent !== null}
								<span class="text-slate-600 mx-1">·</span>
								<span>{formatDate(earliestEvent)} – {formatDate(latestEvent)}</span>
							{/if}
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-2 text-xs">
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

		<!-- Users Section -->
		<section class="mb-6">
			<h2 class="mb-3 border-b border-violet-500/30 pb-2">
				<div class="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-violet-400">
					<span>👤</span> Publishing Users
				</div>
				<div class="mt-1 text-[10px] font-normal normal-case tracking-normal text-slate-500">Excludes single-use keys (gift wraps, Marmot)</div>
			</h2>

			<!-- Active Users Summary (last complete period) -->
			{#if dauChartLoading || wauChartLoading || mauChartLoading}
				<div class="mb-2">
					<LoadingSkeleton type="stat-row" />
				</div>
			{:else if lastCompleteDay && lastCompleteWeek && lastCompleteMonth}
				<div class="mb-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
					<div class="rounded-lg border border-violet-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>Yesterday<InfoTooltip text="Unique pubkeys that published at least one event yesterday (last complete day). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys. Breakdown shows users with profile metadata (kind 0), follow lists (kind 3), or both." /></span>
							<span class="rounded bg-violet-500/20 px-1.5 py-0.5 text-violet-400">DPU</span>
						</div>
						<div class="mt-1 flex items-baseline gap-2">
							<span class="font-mono text-2xl font-bold text-violet-400">{formatNumber(lastCompleteDay.active_users)}</span>
							{#if dauChange() !== null}
								<span class="text-xs {dauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(dauChange()!)}</span>
							{/if}
						</div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>w/ profile</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteDay.has_profile)}</span></div>
							<div class="flex justify-between"><span>w/ follows</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteDay.has_follows_list)}</span></div>
							<div class="flex justify-between"><span>w/ both</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteDay.has_profile_and_follows_list)}</span></div>
						</div>
					</div>

					<div class="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>Last Week<InfoTooltip text="Unique pubkeys that published at least one event last week (last complete 7-day period). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys. Breakdown shows users with profile metadata (kind 0), follow lists (kind 3), or both." /></span>
							<span class="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-400">WPU</span>
						</div>
						<div class="mt-1 flex items-baseline gap-2">
							<span class="font-mono text-2xl font-bold text-cyan-400">{formatNumber(lastCompleteWeek.active_users)}</span>
							{#if wauChange() !== null}
								<span class="text-xs {wauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(wauChange()!)}</span>
							{/if}
						</div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>w/ profile</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteWeek.has_profile)}</span></div>
							<div class="flex justify-between"><span>w/ follows</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteWeek.has_follows_list)}</span></div>
							<div class="flex justify-between"><span>w/ both</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteWeek.has_profile_and_follows_list)}</span></div>
						</div>
					</div>

					<div class="rounded-lg border border-pink-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>Last Month<InfoTooltip text="Unique pubkeys that published at least one event last month (last complete calendar month). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys. Breakdown shows users with profile metadata (kind 0), follow lists (kind 3), or both." /></span>
							<span class="rounded bg-pink-500/20 px-1.5 py-0.5 text-pink-400">MPU</span>
						</div>
						<div class="mt-1 flex items-baseline gap-2">
							<span class="font-mono text-2xl font-bold text-pink-400">{formatNumber(lastCompleteMonth.active_users)}</span>
							{#if mauChange() !== null}
								<span class="text-xs {mauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(mauChange()!)}</span>
							{/if}
						</div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>w/ profile</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteMonth.has_profile)}</span></div>
							<div class="flex justify-between"><span>w/ follows</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteMonth.has_follows_list)}</span></div>
							<div class="flex justify-between"><span>w/ both</span><span class="font-mono text-slate-400">{formatNumber(lastCompleteMonth.has_profile_and_follows_list)}</span></div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Individual DAU/WAU/MAU Breakdown Charts -->
			<div class="mb-2 grid gap-2 md:grid-cols-3">
				{#if dauChartLoading}
					<LoadingSkeleton type="chart" height={180} />
				{:else if dailyActiveUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Daily Publishing Users (30d)<InfoTooltip text="Unique pubkeys that published at least one event during each 24-hour period. Excludes kinds published with single-use keys (gift wraps—kind 1059, Marmot messages—kind 445)." /></h3>
						<Chart labels={dauChartLabels} datasets={dauChartData} height={180} />
					</div>
				{/if}
				{#if wauChartLoading}
					<LoadingSkeleton type="chart" height={180} />
				{:else if weeklyActiveUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Weekly Publishing Users (24w)<InfoTooltip text="Unique pubkeys that published at least one event during each 7-day period. Excludes kinds published with single-use keys (gift wraps—kind 1059, Marmot messages—kind 445)." /></h3>
						<Chart labels={wauChartLabels} datasets={wauChartData} height={180} />
					</div>
				{/if}
				{#if mauChartLoading}
					<LoadingSkeleton type="chart" height={180} />
				{:else if monthlyActiveUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Monthly Publishing Users (24m)<InfoTooltip text="Unique pubkeys that published at least one event during each 30-day period. Excludes kinds published with single-use keys (gift wraps—kind 1059, Marmot messages—kind 445)." /></h3>
						<Chart labels={mauChartLabels} datasets={mauChartData} height={180} />
					</div>
				{/if}
			</div>

			<!-- New Users Summary (last complete periods) -->
			{#if newUsersLoading}
				<div class="mb-2">
					<LoadingSkeleton type="stat-row" />
				</div>
			{:else if newUsers.length >= 91}
				<div class="mb-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
					<div class="rounded-lg border border-teal-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>New Yesterday<InfoTooltip text="First-time pubkeys seen publishing any event yesterday (last complete day). Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-teal-500/20 px-1.5 py-0.5 text-teal-400">1d</span>
						</div>
						<div class="mt-1 font-mono text-2xl font-bold text-teal-400">{formatNumber(newUsers[1]?.new_users ?? 0)}</div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>2 days ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers[2]?.new_users ?? 0)}</span></div>
							<div class="flex justify-between"><span>3 days ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers[3]?.new_users ?? 0)}</span></div>
							<div class="flex justify-between"><span>7d avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0) / 7))}</span></div>
						</div>
					</div>
					<div class="rounded-lg border border-emerald-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>New Last Week<InfoTooltip text="Total first-time pubkeys in the last complete 7-day period. Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400">7d</span>
						</div>
						<div class="mt-1 font-mono text-2xl font-bold text-emerald-400">{formatNumber(newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0))}</div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>prev week</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(8, 15).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>2 weeks ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(15, 22).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>daily avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(1, 8).reduce((a, b) => a + b.new_users, 0) / 7))}</span></div>
						</div>
					</div>
					<div class="rounded-lg border border-lime-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>New Last Month<InfoTooltip text="Total first-time pubkeys in the last complete 30-day period. Excludes kinds 1059 (gift wraps) and 445 (Marmot) which use single-use keys." /></span>
							<span class="rounded bg-lime-500/20 px-1.5 py-0.5 text-lime-400">30d</span>
						</div>
						<div class="mt-1 font-mono text-2xl font-bold text-lime-400">{formatNumber(newUsers.slice(1, 31).reduce((a, b) => a + b.new_users, 0))}</div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>prev month</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(31, 61).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>2 months ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(61, 91).reduce((a, b) => a + b.new_users, 0))}</span></div>
							<div class="flex justify-between"><span>daily avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(1, 31).reduce((a, b) => a + b.new_users, 0) / 30))}</span></div>
						</div>
					</div>
				</div>
			{/if}

			<!-- New Users Chart -->
			{#if newUsersChartLoading}
				<LoadingSkeleton type="chart" height={160} />
			{:else if newUsers.length > 0}
				<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">New Users (30d)<InfoTooltip text="First-time pubkeys seen publishing any event. A pubkey is counted as 'new' on the day of their first indexed event." /></h3>
					<Chart labels={newUsersLabels} datasets={newUsersData} height={160} />
				</div>
			{/if}

			<!-- User Retention Cohort Table -->
			{#if retentionLoading}
				<div class="mt-2">
					<LoadingSkeleton type="table" rows={8} />
				</div>
			{:else if retention.length > 0}
				<div class="mt-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Weekly Retention (Cohort Analysis)<InfoTooltip text="Cohort retention analysis. Each row represents users who first appeared in that week. Columns show what percentage of those users returned in subsequent weeks." /></h3>
					<div class="overflow-x-auto -mx-2.5 px-2.5">
						<table class="w-full text-[10px] sm:text-xs min-w-[400px]">
							<thead>
								<tr class="border-b border-slate-700/50 text-left text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">
									<th class="py-1.5 pr-2 sm:pr-3 whitespace-nowrap">Cohort</th>
									<th class="py-1.5 px-1 sm:px-2 text-right whitespace-nowrap">Size</th>
									{#each Array(Math.min(8, Math.max(...retention.map(r => r.retention_pct.length)))) as _, i}
										<th class="py-1.5 px-1 sm:px-2 text-right">W{i}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each retention.slice(0, 12) as cohort}
									<tr class="border-b border-slate-800/50 hover:bg-slate-800/30">
										<td class="py-1 pr-2 sm:pr-3 font-mono text-slate-300 whitespace-nowrap">
											{new Date(cohort.cohort).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										</td>
										<td class="py-1 px-1 sm:px-2 text-right font-mono text-slate-400">{formatNumber(cohort.cohort_size)}</td>
										{#each cohort.retention_pct.slice(0, 8) as pct, i}
											<td
												class="py-1 px-1 sm:px-2 text-right font-mono"
												style="background-color: rgba(139, 92, 246, {Math.min(pct / 100, 1) * 0.5}); color: {pct > 50 ? '#fff' : pct > 20 ? '#c4b5fd' : '#94a3b8'}"
											>
												{pct.toFixed(0)}%
											</td>
										{/each}
										{#each Array(Math.max(0, 8 - cohort.retention_pct.length)) as _}
											<td class="py-1 px-1 sm:px-2 text-right text-slate-600">-</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="mt-2 text-[9px] sm:text-[10px] text-slate-500">
						W0 = first week (always 100%), W1+ = subsequent weeks. Darker = higher retention.
					</div>
				</div>
			{/if}
		</section>


		<!-- Zaps Section -->
		<section class="mb-6">
			<h2 class="mb-3 flex items-center gap-2 border-b border-amber-500/30 pb-2 text-sm sm:text-base font-bold uppercase tracking-wider text-amber-400">
				<span>⚡</span> Zaps
			</h2>

			<!-- Zap Summary Tiles -->
			{#if zapsSummaryLoading}
				<div class="mb-2">
					<LoadingSkeleton type="stat-row" />
				</div>
			{:else if zapStats30d || zapStats90d || zapStatsAllTime}
				<div class="mb-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
					{#if zapStats30d}
						<div class="rounded-lg border border-amber-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>30 Days<InfoTooltip text="Zap statistics for the last 30 days. Based on kind 9735 zap receipt events. Shows total sats, zap count, average zap size, and unique senders." /></span>
							</div>
							<div class="mt-1 font-mono text-xl font-bold text-amber-400">{formatSats(zapStats30d.total_sats)}</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStats30d.total_zaps)}</span></div>
								<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatSats(Math.round(zapStats30d.avg_zap_sats))}</span></div>
								<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStats30d.unique_senders)}</span></div>
							</div>
						</div>
					{/if}
					{#if zapStats90d}
						<div class="rounded-lg border border-orange-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>90 Days<InfoTooltip text="Zap statistics for the last 90 days. Based on kind 9735 zap receipt events. Shows total sats, zap count, average zap size, and unique senders." /></span>
							</div>
							<div class="mt-1 font-mono text-xl font-bold text-orange-400">{formatSats(zapStats90d.total_sats)}</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStats90d.total_zaps)}</span></div>
								<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatSats(Math.round(zapStats90d.avg_zap_sats))}</span></div>
								<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStats90d.unique_senders)}</span></div>
							</div>
						</div>
					{/if}
					{#if zapStatsAllTime}
						<div class="rounded-lg border border-yellow-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>All Time<InfoTooltip text="Cumulative zap statistics for all indexed zap receipt events. Shows total sats, zap count, average zap size, and unique senders." /></span>
							</div>
							<div class="mt-1 font-mono text-xl font-bold text-yellow-400">{formatSats(zapStatsAllTime.total_sats)}</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStatsAllTime.total_zaps)}</span></div>
								<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatSats(Math.round(zapStatsAllTime.avg_zap_sats))}</span></div>
								<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStatsAllTime.unique_senders)}</span></div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if zapsChartLoading}
				<div class="mb-2">
					<LoadingSkeleton type="chart" height={180} />
				</div>
			{:else if zapsByDay.length > 0}
				<div class="mb-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Zaps Over Time (30d)<InfoTooltip text="Total sats zapped (left axis, area) and number of zap events (right axis, line) per day. Based on kind 9735 zap receipt events." /></h3>
					<Chart labels={zapsLabels} datasets={zapsCombinedData} dualAxis={true} height={180} />
				</div>
			{/if}

			{#if zapsHistogramLoading}
				<LoadingSkeleton type="chart" height={180} />
			{:else if zapHistogram.length > 0}
				<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Zap Amount Distribution (30d)<InfoTooltip text="Distribution of zap amounts by bucket. Shows how many zaps fall into each sats range (e.g., 1–10 sats, 11–100 sats, etc.)." /></h3>
					<Chart labels={histogramLabels} datasets={histogramData} type="bar" height={180} />
				</div>
			{/if}
		</section>

		<!-- Events Section -->
		<section class="mb-6">
			<h2 class="mb-3 flex items-center gap-2 border-b border-emerald-500/30 pb-2 text-sm sm:text-base font-bold uppercase tracking-wider text-emerald-400">
				<span>📊</span> Events
			</h2>

			<!-- Engagement & Throughput Summary -->
			<div class="mb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
				{#if engagementLoading}
					<div class="rounded-lg border border-slate-700/30 bg-slate-900/50 p-2.5 animate-pulse">
						<div class="h-2.5 w-24 rounded bg-slate-700/50 mb-2"></div>
						<div class="h-6 w-16 rounded bg-slate-700/40 mb-2"></div>
						<div class="space-y-1">
							<div class="flex justify-between">
								<div class="h-2 w-16 rounded bg-slate-800/50"></div>
								<div class="h-2 w-8 rounded bg-slate-800/50"></div>
							</div>
							<div class="flex justify-between">
								<div class="h-2 w-20 rounded bg-slate-800/50"></div>
								<div class="h-2 w-8 rounded bg-slate-800/50"></div>
							</div>
						</div>
					</div>
				{:else if engagement}
					<div class="rounded-lg border border-emerald-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>Engagement ({engagement.period_days}d)<InfoTooltip text="Average replies and reactions per original note (kind 1 without reply tags). Measures how much interaction notes receive on average." /></span>
						</div>
						<div class="mt-1 font-mono text-xl font-bold text-emerald-400">{(engagement.replies_per_note + engagement.reactions_per_note).toFixed(2)}<span class="text-sm text-slate-500">/note</span></div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>replies/note</span><span class="font-mono text-slate-400">{engagement.replies_per_note.toFixed(2)}</span></div>
							<div class="flex justify-between"><span>reactions/note</span><span class="font-mono text-slate-400">{engagement.reactions_per_note.toFixed(2)}</span></div>
							<div class="flex justify-between"><span>original notes</span><span class="font-mono text-slate-400">{formatNumber(engagement.original_notes)}</span></div>
						</div>
					</div>
				{/if}
				{#if throughputLoading}
					<div class="rounded-lg border border-slate-700/30 bg-slate-900/50 p-2.5 animate-pulse">
						<div class="h-2.5 w-28 rounded bg-slate-700/50 mb-2"></div>
						<div class="h-6 w-20 rounded bg-slate-700/40 mb-2"></div>
						<div class="space-y-1">
							<div class="flex justify-between">
								<div class="h-2 w-12 rounded bg-slate-800/50"></div>
								<div class="h-2 w-16 rounded bg-slate-800/50"></div>
							</div>
							<div class="flex justify-between">
								<div class="h-2 w-14 rounded bg-slate-800/50"></div>
								<div class="h-2 w-14 rounded bg-slate-800/50"></div>
							</div>
						</div>
					</div>
				{:else if throughput}
					<div class="rounded-lg border border-indigo-500/20 bg-slate-900/50 p-2.5">
						<div class="flex items-center justify-between text-xs text-slate-400">
							<span>Throughput (7d avg)<InfoTooltip text="Average events indexed per hour over the last 7 days. Shows total event volume and daily average." /></span>
						</div>
						<div class="mt-1 font-mono text-xl font-bold text-indigo-400">{formatNumber(Math.round(throughput.events_per_hour))}<span class="text-sm text-slate-500">/hr</span></div>
						<div class="mt-1 text-xs text-slate-500 space-y-0.5">
							<div class="flex justify-between"><span>7d total</span><span class="font-mono text-slate-400">{formatNumber(throughput.total_events_7d)}</span></div>
							<div class="flex justify-between"><span>per day</span><span class="font-mono text-slate-400">{formatNumber(Math.round(throughput.total_events_7d / 7))}</span></div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Hourly Activity -->
			{#if hourlyActivityLoading}
				<div class="mb-2">
					<LoadingSkeleton type="chart" height={160} />
				</div>
			{:else if hourlyActivity.length > 0}
				<div class="mb-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Event publishing by hour, UTC (7d avg)<InfoTooltip text="Average number of events published per hour of the day (UTC), averaged over the last 7 days. Shows when users are most active." /></h3>
					<Chart labels={hourlyLabels} datasets={hourlyData} type="bar" height={160} />
				</div>
			{/if}

			<!-- Daily Events Stacked Bar Chart -->
			{#if dailyEventsLoading || topKindsLoading}
				<div class="mb-2">
					<LoadingSkeleton type="chart" height={260} />
				</div>
			{:else if dailyEvents.length > 0 && kindActivityData.size > 0}
				<div class="mb-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Daily Events by Kind (30d)<InfoTooltip text="Total events per day, broken down by event kind. Shows the top 10 event kinds by volume, with all others grouped as 'Other'." /></h3>
					<Chart labels={eventsChartLabels} datasets={eventsStackedData()} type="bar" stacked={true} height={260} />
				</div>
			{/if}

			<!-- Event Types Table -->
			{#if topKindsLoading}
				<LoadingSkeleton type="table" rows={10} />
			{:else if topKinds.length > 0}
				<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
					<h3 class="mb-1.5 text-xs font-semibold text-slate-400">Event Types<InfoTooltip text="All indexed event types ranked by volume. Click column headers to sort. 'Users' shows unique pubkeys that have published this event type." /></h3>
					<SortableTable data={topKinds} />
				</div>
			{/if}
		</section>
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
