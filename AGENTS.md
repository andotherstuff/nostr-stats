# AGENTS.md

Instructions for AI agents working on this codebase.

## Project Overview

Nostr Stats is permanently offline. The site is a single flat HTML page in `public/index.html`, with its CSS and logo inline. There is no build step, framework, or package manager. The old SvelteKit dashboard lives in git history.

## Structure

```
public/
├── index.html        # The offline notice
├── favicon.*         # Favicons and app icons
├── og-image.webp     # Social preview image
├── robots.txt
└── site.webmanifest
vercel.json           # Static deploy config: no install/build, serves public/, sets security headers
```

## Deployment

Vercel deploys every push to `master` and serves `public/` as-is. To preview locally, open `public/index.html` in a browser or run any static file server in `public/`.
