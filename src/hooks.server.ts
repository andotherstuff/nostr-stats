import type { Handle } from '@sveltejs/kit/hooks'

const SECURITY_HEADERS = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'x-frame-options': 'DENY',
	'permissions-policy': 'camera=(), microphone=(), geolocation=()',
}

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) {
			response.headers.set(name, value)
		}
	}

	return response
}
