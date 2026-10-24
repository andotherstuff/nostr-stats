# AGENTS.md

Instructions for AI agents working on this codebase.

> **⚠️ IMPORTANT: After ANY code changes, you MUST run the validation commands in the "Required Checks" section below and ensure they all pass before considering your work complete.**

## Project Overview

Nostr Stats is a SvelteKit dashboard that displays statistics from a Nostr relay/indexer backend. It now relies on server-side routes so secrets stay on the server.

## Tech Stack

- **Framework**: SvelteKit 3 with Svelte 5
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js
- **Linting/Formatting**: Biome
- **Package Manager**: Bun
- **Deployment**: Vercel (adapter-vercel)

## Development Commands

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Required Checks

**Before considering any change complete, you MUST run all of these checks and ensure they pass.** This is non-negotiable—never skip these steps:

```bash
# Run all checks in sequence (copy/paste this entire block)
bun run check && bun run lint && bun run biome:check && bun run build
```

Or run them individually:

```bash
# 1. Type checking and Svelte validation
bun run check

# 2. Linting
bun run lint

# 3. Format check (use biome:check to verify without writing)
bun run biome:check

# 4. Build verification
bun run build
```

**If any check fails, fix the issues before finishing.** You can auto-fix many lint and format issues:

```bash
# Fix lint issues
bun run lint:fix

# Fix formatting
bun run format

# Fix both lint and format
bun run biome:fix
```

**Do not rely on exit codes alone**—read the output to ensure there are no errors or warnings.

## Project Structure

```
src/
├── lib/
│   ├── api.ts           # API response types and kind names
│   ├── format.ts        # Formatting utilities (numbers, dates, etc.)
│   ├── components/      # Reusable Svelte components
│   ├── server/          # Server-only code (upstream API calls, caching)
│   └── assets/          # Static assets (favicon, etc.)
├── routes/
│   ├── +page.svelte     # Main dashboard page
│   ├── +page.server.ts  # Server load for the dashboard
│   ├── api/dashboard/   # JSON endpoint used for client refreshes
│   ├── +layout.svelte   # App layout
│   └── +layout.ts       # Prerender config
├── env.ts               # Environment variable declarations
├── hooks.server.ts      # Security headers
└── app.html             # HTML template
```

## Code Conventions

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use Biome for formatting (not Prettier)
- Components use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- API types are defined in `src/lib/api.ts`
- Import from `src/lib` with `#lib/...` and the file extension (e.g. `#lib/api.ts`); `$lib` was removed in SvelteKit 3
- SvelteKit config lives in the `sveltekit()` plugin in `vite.config.ts` (`svelte.config.js` is no longer supported)
- Environment variables are declared in `src/env.ts` and read from `$app/env/private`; keep secrets out of browser code

## API Documentation

The canonical API documentation is available at: **https://ipf.works/docs**

Always reference this documentation when working with backend endpoints. It contains the full API specification including request/response schemas.

## Environment Variables

The app uses these environment variables (set via `.env` or build args):

- `PUBLIC_API_URL` - Backend API URL (defaults to `http://localhost:8080`)
- `API_TOKEN` - Server-only API authentication token
- `BASE_PATH` - Optional subpath base if needed

