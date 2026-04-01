import { env as privateEnv } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'
import type {
	ActiveUsersRow,
	CountResponse,
	DashboardData,
	EngagementStats,
	EventCountByPeriod,
	HourlyActivityRow,
	KindActivityRow,
	KindSummary,
	NewUsersRow,
	RelayDistributionRow,
	RetentionCohort,
	ThroughputStats,
	TimestampResponse,
	ZapHistogramBucket,
	ZapStatsAggregate,
	ZapStatsByPeriod,
} from '$lib/api'

const API_URL = publicEnv.PUBLIC_API_URL || 'http://localhost:8080'
const API_TOKEN = privateEnv.API_TOKEN || ''
const HOURLY_KINDS = [1, 0, 3, 6, 7, 9735] as const
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

export async function loadDashboardData(fetchFn: AppFetch): Promise<DashboardData> {
	const topKinds = await safeFetch(
		fetchApi<KindSummary[]>(fetchFn, '/api/v1/kinds?limit=50'),
		[],
		'top kinds'
	)
	const top10Kinds = topKinds.slice(0, 10)

	const [
		totalEvents,
		totalPubkeys,
		totalKinds,
		earliestEvent,
		latestEvent,
		dailyActiveUsers,
		weeklyActiveUsers,
		monthlyActiveUsers,
		dailyEvents,
		throughput,
		newUsers,
		newUsersWeekly,
		newUsersMonthly,
		retention,
		monthlyRetention,
		allHourlyActivity,
		zapStats30d,
		zapStats90d,
		zapStatsAllTime,
		zapsByDay,
		zapHistogram,
		engagement,
		relayDistribution,
		kindActivityEntries,
		kindHourlyEntries,
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
		safeFetch(
			fetchApi<EventCountByPeriod[]>(fetchFn, '/api/v1/stats/events?days=30&group_by=day'),
			[],
			'daily events'
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
			fetchApi<RetentionCohort[]>(
				fetchFn,
				'/api/v1/stats/users/retention?cohort_size=week&limit=12'
			),
			[],
			'weekly retention'
		),
		safeFetch(
			fetchApi<RetentionCohort[]>(
				fetchFn,
				'/api/v1/stats/users/retention?cohort_size=month&limit=12'
			),
			[],
			'monthly retention'
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
			fetchApi<EngagementStats>(fetchFn, '/api/v1/stats/engagement?days=30'),
			null,
			'engagement'
		),
		safeFetch(
			fetchApi<RelayDistributionRow[]>(fetchFn, '/api/v1/stats/relays/distribution?limit=50'),
			[],
			'relay distribution'
		),
		Promise.all(
			top10Kinds.map(
				async (kind) =>
					[
						String(kind.kind),
						await safeFetch(
							fetchApi<KindActivityRow[]>(fetchFn, `/api/v1/kinds/${kind.kind}/activity?limit=30`),
							[],
							`kind ${kind.kind} activity`
						),
					] as const
			)
		),
		Promise.all(
			HOURLY_KINDS.map(
				async (kind) =>
					[
						String(kind),
						await safeFetch(
							fetchApi<HourlyActivityRow[]>(
								fetchFn,
								`/api/v1/stats/activity/hourly?days=7&kind=${kind}`
							),
							[],
							`hourly activity kind ${kind}`
						),
					] as const
			)
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
		dailyEvents,
		topKinds,
		kindActivityData: Object.fromEntries(kindActivityEntries),
		throughput,
		newUsers,
		newUsersWeekly,
		newUsersMonthly,
		retention,
		monthlyRetention,
		hourlyActivity: allHourlyActivity,
		hourlyActivityByKind: {
			all: allHourlyActivity,
			...Object.fromEntries(kindHourlyEntries),
		},
		zapStats30d,
		zapStats90d,
		zapStatsAllTime,
		zapsByDay,
		zapHistogram,
		engagement,
		relayDistribution,
	}
}
