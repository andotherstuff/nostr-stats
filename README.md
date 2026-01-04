# Nostr Stats

A SvelteKit dashboard that displays statistics from a Nostr relay/indexer backend. This is a static site designed for deployment to GitHub Pages.

## Overview

Nostr Stats provides a comprehensive view of Nostr network activity, including event counts, user statistics, kind distribution, and time-series data visualization. The dashboard connects to a backend API to fetch and display real-time statistics about the Nostr protocol network.

> **Note**: This frontend is designed to be paired with the [Pensieve](https://github.com/andotherstuff/pensieve) API backend, an archive-first Nostr indexer that provides the statistics endpoints consumed by this dashboard.

## Features

- **Overview Statistics**: Total events, pubkeys, kinds, and event time range
- **Kind Distribution**: Breakdown of events by kind with sortable tables
- **Time Series Charts**: Visual representation of activity over time
- **User Statistics**: Active users, new users, and user growth metrics
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js
- **Linting/Formatting**: Biome
- **Package Manager**: Bun
- **Deployment**: GitHub Pages (static adapter)
- **Language**: TypeScript

## Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- A running [Pensieve](https://github.com/andotherstuff/pensieve) API backend (see Environment Variables)

## Installation

```bash
# Install dependencies
bun install
```

## Development

Start the development server:

```bash
bun run dev

# Or open in browser automatically
bun run dev -- --open
```

The app will be available at `http://localhost:5173` (or the next available port).

## Building

Build for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Available Scripts

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build

# Code Quality
bun run check            # Type checking and Svelte validation
bun run check:watch      # Watch mode for type checking
bun run lint             # Run linter
bun run lint:fix         # Fix linting issues
bun run format           # Format code
bun run biome:check      # Check linting and formatting
bun run biome:fix        # Fix linting and formatting issues
```

## Environment Variables

The app uses the following environment variables (set via `.env` or build arguments):

- `VITE_API_URL` - Backend API URL (defaults to `http://localhost:8080`)
- `VITE_API_TOKEN` - Optional API authentication token
- `BASE_PATH` - Set during GitHub Pages build for correct asset paths

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080
VITE_API_TOKEN=your-token-here
```

## Project Structure

```
src/
├── lib/
│   ├── api.ts           # API client and types for backend
│   ├── format.ts        # Formatting utilities (numbers, dates, etc.)
│   ├── components/      # Reusable Svelte components
│   │   ├── Chart.svelte
│   │   ├── InfoTooltip.svelte
│   │   ├── KindRow.svelte
│   │   ├── LoadingSkeleton.svelte
│   │   ├── SortableTable.svelte
│   │   └── StatCard.svelte
│   └── assets/          # Static assets (favicon, etc.)
├── routes/
│   ├── +page.svelte     # Main dashboard page
│   ├── +layout.svelte   # App layout
│   ├── +layout.ts       # Prerender config
│   └── layout.css       # Global styles
└── app.html             # HTML template
```

## Code Conventions

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use Biome for formatting (not Prettier)
- Components use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- API types are defined in `src/lib/api.ts`

## Deployment

This project is configured for static deployment to GitHub Pages using the `@sveltejs/adapter-static` adapter. The build process generates static HTML, CSS, and JavaScript files in the `build/` directory.

For GitHub Pages deployment:
1. Build the project: `bun run build`
2. Deploy the `build/` directory to GitHub Pages
3. Set the `BASE_PATH` environment variable to match your repository path if deploying to a subdirectory

## License

See [LICENSE](LICENSE) file for details.

## Related Documentation

- [AGENTS.md](AGENTS.md) - Instructions for AI agents working on this codebase
- [docs/feature-reqs.md](docs/feature-reqs.md) - Feature requests for the backend API
