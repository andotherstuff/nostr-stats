import { json } from '@sveltejs/kit'
import { DASHBOARD_CACHE_CONTROL, loadDashboardData } from '$lib/server/dashboard'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch }) => {
	const dashboard = await loadDashboardData(fetch)

	return json(dashboard, {
		headers: {
			'cache-control': DASHBOARD_CACHE_CONTROL,
		},
	})
}
