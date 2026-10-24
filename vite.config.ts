import adapter from '@sveltejs/adapter-vercel'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Consult https://svelte.dev/docs/kit/integrations
			// for more information about preprocessors
			preprocess: vitePreprocess(),
			adapter: adapter(),
			paths: {
				// Leave empty for local development and typical Vercel deployments.
				// BASE_PATH remains available if you ever mount the app under a subpath.
				base: (process.env.BASE_PATH || '') as '' | `/${string}`,
			},
		}),
	],
})
