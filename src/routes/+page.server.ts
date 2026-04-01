import { DASHBOARD_CACHE_CONTROL, loadDashboardData } from '$lib/server/dashboard'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		'cache-control': DASHBOARD_CACHE_CONTROL,
	})

	return {
		dashboard: await loadDashboardData(fetch),
	}
}
