import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		paths: {
			// Leave empty for local development and typical Vercel deployments.
			// BASE_PATH remains available if you ever mount the app under a subpath.
			base: process.env.BASE_PATH || '',
		},
	},
}

export default config
