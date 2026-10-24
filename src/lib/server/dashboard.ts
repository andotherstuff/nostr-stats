import type {
	ActiveUsersRow,
	CountResponse,
	DashboardData,
	HourlyActivityRow,
	NewUsersRow,
	RelayDistributionRow,
	ThroughputStats,
	TimestampResponse,
	ZapHistogramBucket,
	ZapStatsAggregate,
	ZapStatsByPeriod,
} from '#lib/api.ts'
import { API_TOKEN, PUBLIC_API_URL as API_URL } from '$app/env/private'

export const DASHBOARD_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'

type AppFetch = typeof fetch

async function fetchApi<T>(fetchFn: AppFetch, endpoint: string): Promise<T> {
	const headers = new Headers()
	if (API_TOKEN) {
		headers.set('Authorization', `Bearer ${API_TOKEN}`)
	}

	const res = await fetchFn(`${API_URL}${endpoint}`, {
		headers,
		signal: AbortSignal.timeout(8000),
	})

	if (!res.ok) {
		throw new Error(`API error for ${endpoint}: ${res.status} ${res.statusText}`)
	}

	return res.json() as Promise<T>
}

async function safeFetch<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
	try {
		return await promise
	} catch (error) {
		console.warn(`[dashboard] ${label} failed`, error)
		return fallback
	}
}

// The CDN cache is keyed on the full URL, so a unique query string bypasses it. Keep a short
// in-process cache and share in-flight loads so each instance hits the upstream API at most
// once per TTL, however many requests arrive.
const DASHBOARD_TTL_MS = 60_000
let cachedDashboard: { data: DashboardData; expiresAt: number } | null = null
let inflightDashboard: Promise<DashboardData> | null = null

export function loadDashboardData(fetchFn: AppFetch): Promise<DashboardData> {
	if (cachedDashboard && cachedDashboard.expiresAt > Date.now()) {
		return Promise.resolve(cachedDashboard.data)
	}

	inflightDashboard ??= fetchDashboardData(fetchFn)
		.then((data) => {
			cachedDashboard = { data, expiresAt: Date.now() + DASHBOARD_TTL_MS }
			return data
		})
		.finally(() => {
			inflightDashboard = null
		})

	return inflightDashboard
}

async function fetchDashboardData(fetchFn: AppFetch): Promise<DashboardData> {
	// Retention is paused pending validation; per-kind history and engagement are paused
	// to reduce database load. Keep these requests out of both page loads and refreshes.
	const [
		totalEvents,
		totalPubkeys,
		totalKinds,
		earliestEvent,
		latestEvent,
		dailyActiveUsers,
		weeklyActiveUsers,
		monthlyActiveUsers,
		throughput,
		newUsers,
		newUsersWeekly,
		newUsersMonthly,
		allHourlyActivity,
		zapStats30d,
		zapStats90d,
		zapStatsAllTime,
		zapsByDay,
		zapHistogram,
		relayDistribution,
	] = await Promise.all([
		safeFetch(fetchApi<CountResponse>(fetchFn, '/api/v1/stats/events/total'), null, 'total events'),
		safeFetch(
			fetchApi<CountResponse>(fetchFn, '/api/v1/stats/pubkeys/total'),
			null,
			'total pubkeys'
		),
		safeFetch(fetchApi<CountResponse>(fetchFn, '/api/v1/stats/kinds/total'), null, 'total kinds'),
		safeFetch(
			fetchApi<TimestampResponse>(fetchFn, '/api/v1/stats/events/earliest'),
			null,
			'earliest event'
		),
		safeFetch(
			fetchApi<TimestampResponse>(fetchFn, '/api/v1/stats/events/latest'),
			null,
			'latest event'
		),
		safeFetch(
			fetchApi<ActiveUsersRow[]>(fetchFn, '/api/v1/stats/users/active/daily?limit=60'),
			[],
			'daily active users'
		),
		safeFetch(
			fetchApi<ActiveUsersRow[]>(fetchFn, '/api/v1/stats/users/active/weekly?limit=24'),
			[],
			'weekly active users'
		),
		safeFetch(
			fetchApi<ActiveUsersRow[]>(fetchFn, '/api/v1/stats/users/active/monthly?limit=24'),
			[],
			'monthly active users'
		),
		safeFetch(fetchApi<ThroughputStats>(fetchFn, '/api/v1/stats/throughput'), null, 'throughput'),
		safeFetch(
			fetchApi<NewUsersRow[]>(fetchFn, '/api/v1/stats/users/new?group_by=day&limit=92'),
			[],
			'daily new users'
		),
		safeFetch(
			fetchApi<NewUsersRow[]>(fetchFn, '/api/v1/stats/users/new?group_by=week&limit=26'),
			[],
			'weekly new users'
		),
		safeFetch(
			fetchApi<NewUsersRow[]>(fetchFn, '/api/v1/stats/users/new?group_by=month&limit=24'),
			[],
			'monthly new users'
		),
		safeFetch(
			fetchApi<HourlyActivityRow[]>(fetchFn, '/api/v1/stats/activity/hourly?days=7'),
			[],
			'hourly activity'
		),
		safeFetch(fetchApi<ZapStatsAggregate>(fetchFn, '/api/v1/stats/zaps?days=30'), null, 'zaps 30d'),
		safeFetch(fetchApi<ZapStatsAggregate>(fetchFn, '/api/v1/stats/zaps?days=90'), null, 'zaps 90d'),
		safeFetch(
			fetchApi<ZapStatsAggregate>(fetchFn, '/api/v1/stats/zaps?days=10000'),
			null,
			'zaps all time'
		),
		safeFetch(
			fetchApi<ZapStatsByPeriod[]>(fetchFn, '/api/v1/stats/zaps?days=31&group_by=day&limit=31'),
			[],
			'zaps by day'
		),
		safeFetch(
			fetchApi<ZapHistogramBucket[]>(fetchFn, '/api/v1/stats/zaps/histogram?days=30'),
			[],
			'zap histogram'
		),
		safeFetch(
			fetchApi<RelayDistributionRow[]>(fetchFn, '/api/v1/stats/relays/distribution?limit=50'),
			[],
			'relay distribution'
		),
	])

	return {
		generatedAt: new Date().toISOString(),
		totalEvents: totalEvents?.count ?? null,
		totalPubkeys: totalPubkeys?.count ?? null,
		totalKinds: totalKinds?.count ?? null,
		earliestEvent: earliestEvent?.timestamp ?? null,
		latestEvent: latestEvent?.timestamp ?? null,
		dailyActiveUsers,
		weeklyActiveUsers,
		monthlyActiveUsers,
		throughput,
		newUsers,
		newUsersWeekly,
		newUsersMonthly,
		hourlyActivity: allHourlyActivity,
		zapStats30d,
		zapStats90d,
		zapStatsAllTime,
		zapsByDay,
		zapHistogram,
		relayDistribution,
	}
}
