<script lang="ts">
import { onMount } from 'svelte'
import {
	type ActiveUsersRow,
	type ActiveUsersSummary,
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
	getActiveUsersSummary,
	getActiveUsersMonthly,
	getActiveUsersWeekly,
	getEngagement,
	getEventsByDay,
	getHourlyActivity,
	getKinds,
	getKindActivity,
	getNewUsers,
	getOverview,
	getKindName,
	getThroughput,
	getUserRetention,
	getZapStats,
	getZapStatsByDay,
	getZapHistogram,
	type KindSummary,
	type KindActivityRow,
	type OverviewStats,
} from '$lib/api'
import Chart from '$lib/components/Chart.svelte'
import SortableTable from '$lib/components/SortableTable.svelte'
import { formatDate, formatNumber, percentChange, formatPercent } from '$lib/format'

// State
let loading = $state(true)
let error = $state<string | null>(null)
let lastUpdated = $state<Date | null>(null)

// Data
let overview = $state<OverviewStats | null>(null)
let activeUsers = $state<ActiveUsersSummary | null>(null)
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

// Chart colors for kinds
const KIND_COLORS = [
	'#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#fbbf24',
	'#fb7185', '#818cf8', '#2dd4bf', '#f97316', '#a3e635',
]

// DAU breakdown chart
const dauChartLabels = $derived(
	dailyActiveUsers.slice(0, 30).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const dauChartData = $derived([
	{ label: 'Active Users', data: dailyActiveUsers.slice(0, 30).reverse().map((d) => d.active_users), color: '#a78bfa', fill: true },
	{ label: 'With Profile', data: dailyActiveUsers.slice(0, 30).reverse().map((d) => d.has_profile), color: '#22d3ee', fill: false },
	{ label: 'With Follows', data: dailyActiveUsers.slice(0, 30).reverse().map((d) => d.has_follows_list), color: '#34d399', fill: false },
	{ label: 'Profile + Follows', data: dailyActiveUsers.slice(0, 30).reverse().map((d) => d.has_profile_and_follows_list), color: '#fbbf24', fill: false },
])

// WAU breakdown chart
const wauChartLabels = $derived(
	weeklyActiveUsers.slice(0, 24).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const wauChartData = $derived([
	{ label: 'Active Users', data: weeklyActiveUsers.slice(0, 24).reverse().map((d) => d.active_users), color: '#22d3ee', fill: true },
	{ label: 'With Profile', data: weeklyActiveUsers.slice(0, 24).reverse().map((d) => d.has_profile), color: '#a78bfa', fill: false },
	{ label: 'With Follows', data: weeklyActiveUsers.slice(0, 24).reverse().map((d) => d.has_follows_list), color: '#34d399', fill: false },
	{ label: 'Profile + Follows', data: weeklyActiveUsers.slice(0, 24).reverse().map((d) => d.has_profile_and_follows_list), color: '#fbbf24', fill: false },
])

// MAU breakdown chart
const mauChartLabels = $derived(
	monthlyActiveUsers.slice(0, 24).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
	})
)

const mauChartData = $derived([
	{ label: 'Active Users', data: monthlyActiveUsers.slice(0, 24).reverse().map((d) => d.active_users), color: '#f472b6', fill: true },
	{ label: 'With Profile', data: monthlyActiveUsers.slice(0, 24).reverse().map((d) => d.has_profile), color: '#a78bfa', fill: false },
	{ label: 'With Follows', data: monthlyActiveUsers.slice(0, 24).reverse().map((d) => d.has_follows_list), color: '#34d399', fill: false },
	{ label: 'Profile + Follows', data: monthlyActiveUsers.slice(0, 24).reverse().map((d) => d.has_profile_and_follows_list), color: '#fbbf24', fill: false },
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

// Calculate % changes for active users
const dauChange = $derived(() => {
	if (dailyActiveUsers.length < 2) return null
	return percentChange(dailyActiveUsers[0].active_users, dailyActiveUsers[1].active_users)
})

const wauChange = $derived(() => {
	if (weeklyActiveUsers.length < 2) return null
	return percentChange(weeklyActiveUsers[0].active_users, weeklyActiveUsers[1].active_users)
})

const mauChange = $derived(() => {
	if (monthlyActiveUsers.length < 2) return null
	return percentChange(monthlyActiveUsers[0].active_users, monthlyActiveUsers[1].active_users)
})


// New users chart data
const newUsersLabels = $derived(
	newUsers.slice(0, 30).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const newUsersData = $derived([
	{ label: 'New Users', data: newUsers.slice(0, 30).reverse().map((d) => d.new_users), color: '#34d399', fill: true },
])

// Hourly activity chart data (bar chart for hours 0-23)
const hourlyLabels = $derived(
	hourlyActivity.map((d) => `${d.hour.toString().padStart(2, '0')}:00`)
)

const hourlyData = $derived([
	{ label: 'Avg Events/Day', data: hourlyActivity.map((d) => d.avg_per_day), color: '#f472b6', fill: true },
])

// Zaps chart data
const zapsLabels = $derived(
	zapsByDay.slice(0, 30).reverse().map((d) => {
		const date = new Date(d.period)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	})
)

const zapsData = $derived([
	{ label: 'Sats', data: zapsByDay.slice(0, 30).reverse().map((d) => d.total_sats), color: '#fbbf24', fill: true },
])

// Combined zaps chart with dual axes (sats on left, count on right)
const zapsCombinedData = $derived([
	{ label: 'Total Sats', data: zapsByDay.slice(0, 30).reverse().map((d) => d.total_sats), color: '#fbbf24', fill: true },
	{ label: 'Zap Count', data: zapsByDay.slice(0, 30).reverse().map((d) => d.total_zaps), color: '#fb7185', fill: false },
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

async function loadData() {
	loading = true
	error = null

	try {
		// Core data - these are required
		const [overviewData, activeData, dauData, wauData, mauData, eventsData, kindsData] =
			await Promise.all([
				getOverview(),
				getActiveUsersSummary(),
				getActiveUsersDaily(60),
				getActiveUsersWeekly(24),
				getActiveUsersMonthly(24),
				getEventsByDay(30),
				getKinds(50),
			])

		overview = overviewData
		activeUsers = activeData
		dailyActiveUsers = dauData
		weeklyActiveUsers = wauData
		monthlyActiveUsers = mauData
		dailyEvents = eventsData
		topKinds = kindsData
		lastUpdated = new Date()

		// Optional data - these can fail gracefully
		const [
			throughputData,
			newUsersData,
			retentionData,
			hourlyData,
			zapStats30dData,
			zapStats90dData,
			zapStatsAllTimeData,
			zapsByDayData,
			zapHistogramData,
			engagementData,
		] = await Promise.all([
			safeFetch(getThroughput(), null),
			safeFetch(getNewUsers('day', 30), []),
			safeFetch(getUserRetention(12), []),
			safeFetch(getHourlyActivity(7), []),
			safeFetch(getZapStats(30), null),
			safeFetch(getZapStats(90), null),
			safeFetch(getZapStats(10000), null), // All time
			safeFetch(getZapStatsByDay(30, 30), []),
			safeFetch(getZapHistogram(30), []),
			safeFetch(getEngagement(30), null),
		])

		throughput = throughputData
		newUsers = newUsersData
		retention = retentionData
		hourlyActivity = hourlyData
		zapStats30d = zapStats30dData
		zapStats90d = zapStats90dData
		zapStatsAllTime = zapStatsAllTimeData
		zapsByDay = zapsByDayData
		zapHistogram = zapHistogramData
		engagement = engagementData

		// Kind activity data
		const top10 = kindsData.slice(0, 10)
		const activityResults = await Promise.all(
			top10.map((k) => safeFetch(getKindActivity(k.kind, 30), []))
		)
		const activityMap = new Map<number, KindActivityRow[]>()
		top10.forEach((k, i) => activityMap.set(k.kind, activityResults[i]))
		kindActivityData = activityMap
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load data'
		console.error('Failed to load dashboard data:', e)
	} finally {
		loading = false
	}
}

onMount(() => {
	loadData()
	const interval = setInterval(loadData, 5 * 60 * 1000)
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
		<header class="mb-3 flex items-center justify-between">
			<h1 class="text-xl font-bold tracking-tight">
				<span class="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Nostr</span> Stats
			</h1>
			<div class="flex items-center gap-4 text-xs">
				{#if overview}
					<span class="text-slate-500">
						<span class="text-slate-400">Indexed:</span>
						<span class="font-mono text-slate-300">{formatNumber(overview.total_events)}</span> events
						<span class="text-slate-600 mx-1">·</span>
						{formatDate(overview.earliest_event)} – {formatDate(overview.latest_event)}
					</span>
				{/if}
				{#if lastUpdated}
					<span class="text-slate-600">|</span>
					<span class="text-slate-500">{lastUpdated.toLocaleTimeString()}</span>
				{/if}
				<button onclick={loadData} disabled={loading} class="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-300 hover:border-violet-500/50 disabled:opacity-50">
					{loading ? '...' : '↻'}
				</button>
			</div>
		</header>

		{#if error}
			<div class="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
				<strong>Error:</strong> {error}
			</div>
		{/if}

		{#if loading && !overview}
			<div class="flex min-h-[300px] items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500"></div>
			</div>
		{:else if overview}
			<!-- Users Section -->
			<section class="mb-6">
				<h2 class="mb-3 flex items-center gap-2 border-b border-violet-500/30 pb-2 text-base font-bold uppercase tracking-wider text-violet-400">
					<span>👤</span> Users
				</h2>

				<!-- Active Users Summary -->
				{#if activeUsers}
					<div class="mb-2 grid grid-cols-3 gap-2">
						<div class="rounded-lg border border-violet-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>Daily Active (24h)</span>
								<span class="rounded bg-violet-500/20 px-1.5 py-0.5 text-violet-400">DAU</span>
							</div>
							<div class="mt-1 flex items-baseline gap-2">
								<span class="font-mono text-2xl font-bold text-violet-400">{formatNumber(activeUsers.daily.active_users)}</span>
								{#if dauChange() !== null}
									<span class="text-xs {dauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(dauChange()!)}</span>
								{/if}
							</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>w/ profile</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.daily.has_profile)}</span></div>
								<div class="flex justify-between"><span>w/ follows</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.daily.has_follows_list)}</span></div>
								<div class="flex justify-between"><span>w/ both</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.daily.has_profile_and_follows_list)}</span></div>
							</div>
						</div>

						<div class="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>Weekly Active (7d)</span>
								<span class="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-400">WAU</span>
							</div>
							<div class="mt-1 flex items-baseline gap-2">
								<span class="font-mono text-2xl font-bold text-cyan-400">{formatNumber(activeUsers.weekly.active_users)}</span>
								{#if wauChange() !== null}
									<span class="text-xs {wauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(wauChange()!)}</span>
								{/if}
							</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>w/ profile</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.weekly.has_profile)}</span></div>
								<div class="flex justify-between"><span>w/ follows</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.weekly.has_follows_list)}</span></div>
								<div class="flex justify-between"><span>w/ both</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.weekly.has_profile_and_follows_list)}</span></div>
							</div>
						</div>

						<div class="rounded-lg border border-pink-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>Monthly Active (30d)</span>
								<span class="rounded bg-pink-500/20 px-1.5 py-0.5 text-pink-400">MAU</span>
							</div>
							<div class="mt-1 flex items-baseline gap-2">
								<span class="font-mono text-2xl font-bold text-pink-400">{formatNumber(activeUsers.monthly.active_users)}</span>
								{#if mauChange() !== null}
									<span class="text-xs {mauChange()! >= 0 ? 'text-emerald-400' : 'text-rose-400'}">{formatPercent(mauChange()!)}</span>
								{/if}
							</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>w/ profile</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.monthly.has_profile)}</span></div>
								<div class="flex justify-between"><span>w/ follows</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.monthly.has_follows_list)}</span></div>
								<div class="flex justify-between"><span>w/ both</span><span class="font-mono text-slate-400">{formatNumber(activeUsers.monthly.has_profile_and_follows_list)}</span></div>
							</div>
						</div>
					</div>
				{/if}

					<!-- Individual DAU/WAU/MAU Breakdown Charts -->
				<div class="mb-2 grid gap-2 lg:grid-cols-3">
					{#if dailyActiveUsers.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
							<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Unique pubkeys that published at least one event per day. Excludes ephemeral events like gift wraps (kind 1059) and group key distribution (kind 445).">Daily Active Users (30d)</h3>
							<Chart labels={dauChartLabels} datasets={dauChartData} height={180} />
						</div>
					{/if}
					{#if weeklyActiveUsers.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
							<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Unique pubkeys that published at least one event during each 7-day period. Excludes ephemeral events like gift wraps (kind 1059) and group key distribution (kind 445).">Weekly Active Users (24w)</h3>
							<Chart labels={wauChartLabels} datasets={wauChartData} height={180} />
						</div>
					{/if}
					{#if monthlyActiveUsers.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
							<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Unique pubkeys that published at least one event during each 30-day period. Excludes ephemeral events like gift wraps (kind 1059) and group key distribution (kind 445).">Monthly Active Users (24m)</h3>
							<Chart labels={mauChartLabels} datasets={mauChartData} height={180} />
						</div>
					{/if}
				</div>

				<!-- New Users Summary -->
				{#if newUsers.length > 0}
					<div class="mb-2 grid grid-cols-3 gap-2">
						<div class="rounded-lg border border-teal-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>New Today</span>
								<span class="rounded bg-teal-500/20 px-1.5 py-0.5 text-teal-400">24h</span>
							</div>
							<div class="mt-1 font-mono text-2xl font-bold text-teal-400">{formatNumber(newUsers[0]?.new_users ?? 0)}</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>yesterday</span><span class="font-mono text-slate-400">{formatNumber(newUsers[1]?.new_users ?? 0)}</span></div>
								<div class="flex justify-between"><span>2 days ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers[2]?.new_users ?? 0)}</span></div>
								<div class="flex justify-between"><span>7d avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(0, 7).reduce((a, b) => a + b.new_users, 0) / 7))}</span></div>
							</div>
						</div>
						<div class="rounded-lg border border-emerald-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>New This Week</span>
								<span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400">7d</span>
							</div>
							<div class="mt-1 font-mono text-2xl font-bold text-emerald-400">{formatNumber(newUsers.slice(0, 7).reduce((a, b) => a + b.new_users, 0))}</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>last week</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(7, 14).reduce((a, b) => a + b.new_users, 0))}</span></div>
								<div class="flex justify-between"><span>2 weeks ago</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(14, 21).reduce((a, b) => a + b.new_users, 0))}</span></div>
								<div class="flex justify-between"><span>daily avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.slice(0, 7).reduce((a, b) => a + b.new_users, 0) / 7))}</span></div>
							</div>
						</div>
						<div class="rounded-lg border border-lime-500/20 bg-slate-900/50 p-2.5">
							<div class="flex items-center justify-between text-xs text-slate-400">
								<span>New This Month</span>
								<span class="rounded bg-lime-500/20 px-1.5 py-0.5 text-lime-400">30d</span>
							</div>
							<div class="mt-1 font-mono text-2xl font-bold text-lime-400">{formatNumber(newUsers.reduce((a, b) => a + b.new_users, 0))}</div>
							<div class="mt-1 text-xs text-slate-500 space-y-0.5">
								<div class="flex justify-between"><span>first 2 weeks</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(0, 14).reduce((a, b) => a + b.new_users, 0))}</span></div>
								<div class="flex justify-between"><span>last 2 weeks</span><span class="font-mono text-slate-400">{formatNumber(newUsers.slice(14, 30).reduce((a, b) => a + b.new_users, 0))}</span></div>
								<div class="flex justify-between"><span>daily avg</span><span class="font-mono text-slate-400">{formatNumber(Math.round(newUsers.reduce((a, b) => a + b.new_users, 0) / 30))}</span></div>
							</div>
						</div>
					</div>
				{/if}

				<!-- New Users Chart -->
				{#if newUsers.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="First-time pubkeys seen publishing any event. A pubkey is counted as 'new' on the day of their first indexed event.">New Users (30d)</h3>
						<Chart labels={newUsersLabels} datasets={newUsersData} height={160} />
					</div>
				{/if}

				<!-- User Retention Cohort Table -->
				{#if retention.length > 0}
					<div class="mt-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Cohort retention analysis. Each row represents users who first appeared in that week. Columns show what percentage of those users returned in subsequent weeks.">Weekly Retention (Cohort Analysis)</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-xs">
								<thead>
									<tr class="border-b border-slate-700/50 text-left text-[10px] uppercase tracking-wider text-slate-500">
										<th class="py-1.5 pr-3">Cohort</th>
										<th class="py-1.5 px-2 text-right">Size</th>
										{#each Array(Math.min(8, Math.max(...retention.map(r => r.retention_pct.length)))) as _, i}
											<th class="py-1.5 px-2 text-right">W{i}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each retention.slice(0, 12) as cohort}
										<tr class="border-b border-slate-800/50 hover:bg-slate-800/30">
											<td class="py-1 pr-3 font-mono text-slate-300">
												{new Date(cohort.cohort).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
											</td>
											<td class="py-1 px-2 text-right font-mono text-slate-400">{formatNumber(cohort.cohort_size)}</td>
											{#each cohort.retention_pct.slice(0, 8) as pct, i}
												<td
													class="py-1 px-2 text-right font-mono"
													style="background-color: rgba(139, 92, 246, {Math.min(pct / 100, 1) * 0.5}); color: {pct > 50 ? '#fff' : pct > 20 ? '#c4b5fd' : '#94a3b8'}"
												>
													{pct.toFixed(0)}%
												</td>
											{/each}
											{#each Array(Math.max(0, 8 - cohort.retention_pct.length)) as _}
												<td class="py-1 px-2 text-right text-slate-600">-</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div class="mt-2 text-[10px] text-slate-500">
							W0 = first week (always 100%), W1+ = subsequent weeks. Darker = higher retention.
						</div>
					</div>
				{/if}
			</section>


			<!-- Zaps Section -->
			{#if zapsByDay.length > 0 || zapHistogram.length > 0 || zapStats30d || zapStats90d || zapStatsAllTime}
				<section class="mb-6">
					<h2 class="mb-3 flex items-center gap-2 border-b border-amber-500/30 pb-2 text-base font-bold uppercase tracking-wider text-amber-400">
						<span>⚡</span> Zaps
					</h2>

					<!-- Zap Summary Tiles -->
					{#if zapStats30d || zapStats90d || zapStatsAllTime}
						<div class="mb-2 grid gap-2 lg:grid-cols-3">
							{#if zapStats30d}
								<div class="rounded-lg border border-amber-500/20 bg-slate-900/50 p-2.5">
									<div class="flex items-center justify-between text-xs text-slate-400">
										<span>30 Days</span>
									</div>
									<div class="mt-1 font-mono text-xl font-bold text-amber-400">{formatNumber(zapStats30d.total_sats)} sats</div>
									<div class="mt-1 text-xs text-slate-500 space-y-0.5">
										<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStats30d.total_zaps)}</span></div>
										<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatNumber(Math.round(zapStats30d.avg_zap_sats))} sats</span></div>
										<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStats30d.unique_senders)}</span></div>
									</div>
								</div>
							{/if}
							{#if zapStats90d}
								<div class="rounded-lg border border-orange-500/20 bg-slate-900/50 p-2.5">
									<div class="flex items-center justify-between text-xs text-slate-400">
										<span>90 Days</span>
									</div>
									<div class="mt-1 font-mono text-xl font-bold text-orange-400">{formatNumber(zapStats90d.total_sats)} sats</div>
									<div class="mt-1 text-xs text-slate-500 space-y-0.5">
										<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStats90d.total_zaps)}</span></div>
										<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatNumber(Math.round(zapStats90d.avg_zap_sats))} sats</span></div>
										<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStats90d.unique_senders)}</span></div>
									</div>
								</div>
							{/if}
							{#if zapStatsAllTime}
								<div class="rounded-lg border border-yellow-500/20 bg-slate-900/50 p-2.5">
									<div class="flex items-center justify-between text-xs text-slate-400">
										<span>All Time</span>
									</div>
									<div class="mt-1 font-mono text-xl font-bold text-yellow-400">{formatNumber(zapStatsAllTime.total_sats)} sats</div>
									<div class="mt-1 text-xs text-slate-500 space-y-0.5">
										<div class="flex justify-between"><span>zap count</span><span class="font-mono text-slate-400">{formatNumber(zapStatsAllTime.total_zaps)}</span></div>
										<div class="flex justify-between"><span>avg zap</span><span class="font-mono text-slate-400">{formatNumber(Math.round(zapStatsAllTime.avg_zap_sats))} sats</span></div>
										<div class="flex justify-between"><span>senders</span><span class="font-mono text-slate-400">{formatNumber(zapStatsAllTime.unique_senders)}</span></div>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if zapsByDay.length > 0}
						<div class="mb-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
							<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Total sats zapped (left axis, area) and number of zap events (right axis, line) per day. Based on kind 9735 zap receipt events.">Zaps Over Time (30d)</h3>
							<Chart labels={zapsLabels} datasets={zapsCombinedData} dualAxis={true} height={180} />
						</div>
					{/if}

					{#if zapHistogram.length > 0}
						<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
							<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Distribution of zap amounts by bucket. Shows how many zaps fall into each sats range (e.g., 1-10 sats, 11-100 sats, etc.).">Zap Amount Distribution (30d)</h3>
							<Chart labels={histogramLabels} datasets={histogramData} type="bar" height={180} />
						</div>
					{/if}
				</section>
			{/if}

			<!-- Events Section -->
			<section class="mb-6">
				<h2 class="mb-3 flex items-center gap-2 border-b border-emerald-500/30 pb-2 text-base font-bold uppercase tracking-wider text-emerald-400">
					<span>📊</span> Events
				</h2>

				<!-- Engagement & Throughput Summary -->
				{#if engagement || throughput}
					<div class="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
						{#if engagement}
							<div class="rounded-lg border border-emerald-500/20 bg-slate-900/50 p-2.5">
								<div class="flex items-center justify-between text-xs text-slate-400">
									<span>Engagement ({engagement.period_days}d)</span>
								</div>
								<div class="mt-1 font-mono text-xl font-bold text-emerald-400">{(engagement.replies_per_note + engagement.reactions_per_note).toFixed(2)}<span class="text-sm text-slate-500">/note</span></div>
								<div class="mt-1 text-xs text-slate-500 space-y-0.5">
									<div class="flex justify-between"><span>replies/note</span><span class="font-mono text-slate-400">{engagement.replies_per_note.toFixed(2)}</span></div>
									<div class="flex justify-between"><span>reactions/note</span><span class="font-mono text-slate-400">{engagement.reactions_per_note.toFixed(2)}</span></div>
									<div class="flex justify-between"><span>original notes</span><span class="font-mono text-slate-400">{formatNumber(engagement.original_notes)}</span></div>
								</div>
							</div>
						{/if}
						{#if throughput}
							<div class="rounded-lg border border-indigo-500/20 bg-slate-900/50 p-2.5">
								<div class="flex items-center justify-between text-xs text-slate-400">
									<span>Throughput (7d avg)</span>
								</div>
								<div class="mt-1 font-mono text-xl font-bold text-indigo-400">{formatNumber(Math.round(throughput.events_per_hour))}<span class="text-sm text-slate-500">/hr</span></div>
								<div class="mt-1 text-xs text-slate-500 space-y-0.5">
									<div class="flex justify-between"><span>7d total</span><span class="font-mono text-slate-400">{formatNumber(throughput.total_events_7d)}</span></div>
									<div class="flex justify-between"><span>per day</span><span class="font-mono text-slate-400">{formatNumber(Math.round(throughput.total_events_7d / 7))}</span></div>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Hourly Activity -->
				{#if hourlyActivity.length > 0}
					<div class="mb-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Average number of events published per hour of the day (UTC), averaged over the last 7 days. Shows when users are most active.">Hourly Activity Pattern (7d avg)</h3>
						<Chart labels={hourlyLabels} datasets={hourlyData} type="bar" height={160} />
					</div>
				{/if}

				<!-- Daily Events Stacked Bar Chart -->
				{#if dailyEvents.length > 0 && kindActivityData.size > 0}
					<div class="mb-2 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="Total events per day, broken down by event kind. Shows the top 10 event kinds by volume, with all others grouped as 'Other'.">Daily Events by Kind (30d)</h3>
						<Chart labels={eventsChartLabels} datasets={eventsStackedData()} type="bar" stacked={true} height={260} />
					</div>
				{/if}

				<!-- Event Types Table -->
				{#if topKinds.length > 0}
					<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5">
						<h3 class="mb-1.5 text-xs font-semibold text-slate-400" title="All indexed event types ranked by volume. Click column headers to sort. 'Users' shows unique pubkeys that have published this event type.">Event Types</h3>
						<SortableTable data={topKinds} />
					</div>
				{/if}
			</section>
		{/if}
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
