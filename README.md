# Nostr Stats

Nostr Stats was a SvelteKit 3 dashboard for Nostr network statistics, powered by the [Pensieve](https://github.com/andotherstuff/pensieve) indexer API.

**The Pensieve API has been shut down and Nostr Stats is permanently offline.** The site now serves a single static page saying so. The dashboard code is still in this repository's git history.

## Development

```bash
bun install
bun run dev      # Start dev server
bun run build    # Build for production (prerendered, deployed with adapter-vercel)
```

Before committing, run:

```bash
bun run check && bun run lint && bun run biome:check && bun run build
```

## License

See [LICENSE](LICENSE) file for details.
