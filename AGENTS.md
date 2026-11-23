# AGENTS.md

Instructions for AI agents working on this codebase.

> **⚠️ IMPORTANT: After ANY code changes, you MUST run the validation commands in the "Required Checks" section below and ensure they all pass before considering your work complete.**

## Project Overview

Nostr Stats was a SvelteKit dashboard for Nostr network statistics. The Pensieve API that powered it has been shut down, so the site is now a single prerendered page announcing that it is permanently offline. The old dashboard code lives in git history.

## Tech Stack

- **Framework**: SvelteKit 3 with Svelte 5
- **Styling**: Tailwind CSS 4
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
│   └── assets/          # Static assets (favicon, etc.)
├── routes/
│   ├── +page.svelte     # Offline notice page
│   ├── +layout.svelte   # App layout
│   ├── +layout.ts       # Prerender config
│   └── layout.css       # Global styles
├── hooks.server.ts      # Security headers
└── app.html             # HTML template
```

## Code Conventions

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use Biome for formatting (not Prettier)
- Components use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- Import from `src/lib` with `#lib/...` and the file extension (e.g. `#lib/assets/favicon.svg`); `$lib` was removed in SvelteKit 3
- SvelteKit config lives in the `sveltekit()` plugin in `vite.config.ts` (`svelte.config.js` is no longer supported)

## Environment Variables

- `BASE_PATH` - Optional subpath base if needed
