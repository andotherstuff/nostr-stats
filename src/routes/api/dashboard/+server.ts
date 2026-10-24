import { DASHBOARD_CACHE_CONTROL, loadDashboardData } from '#lib/server/dashboard.ts'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch }) => {
	const dashboard = await loadDashboardData(fetch)

	return Response.json(dashboard, {
		headers: {
			'cache-control': DASHBOARD_CACHE_CONTROL,
		},
	})
}
