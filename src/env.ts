import { defineEnvVars } from '@sveltejs/kit/env'

// Both variables are server-only. The upstream URL keeps its historical PUBLIC_ name so
// existing deployments don't need reconfiguring, but the browser never talks to it directly.
export const variables = defineEnvVars({
	PUBLIC_API_URL: {
		description: 'Base URL of the upstream stats API',
		schema: (value) => value || 'http://localhost:8080',
	},
	API_TOKEN: {
		description: 'Bearer token for the upstream stats API',
		schema: (value) => value ?? '',
	},
})
