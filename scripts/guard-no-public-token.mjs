import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const envFiles = [
	'.env',
	'.env.local',
	'.env.development',
	'.env.development.local',
	'.env.production',
	'.env.production.local',
	'.env.test',
	'.env.test.local',
]

const publicTokenVars = ['VITE_API_TOKEN', 'PUBLIC_API_TOKEN']
const foundInFiles = []
for (const file of envFiles) {
	const path = join(process.cwd(), file)
	if (!existsSync(path)) continue
	const content = readFileSync(path, 'utf8')
	if (publicTokenVars.some((name) => new RegExp(`^\\s*${name}\\s*=`, 'm').test(content))) {
		foundInFiles.push(file)
	}
}

const foundInProcess = publicTokenVars.filter((name) => process.env[name])

if (foundInProcess.length > 0 || foundInFiles.length > 0) {
	const details = [
		foundInProcess.length > 0 ? `process environment: ${foundInProcess.join(', ')}` : null,
		foundInFiles.length > 0 ? `env files: ${foundInFiles.join(', ')}` : null,
	]
		.filter(Boolean)
		.join('; ')

	console.error(
		[
			'❌ Refusing to continue: API bearer tokens must stay in server-only env vars.',
			'Do not use VITE_* or PUBLIC_* names for secrets in SvelteKit; those are exposed to browser JavaScript.',
			'Use API_TOKEN for the private bearer token and PUBLIC_API_URL for the upstream base URL.',
			details ? `Detected in: ${details}` : null,
		]
			.filter(Boolean)
			.join('\n')
	)
	process.exit(1)
}

console.log('✓ No public API token env vars detected')
