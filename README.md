# Nostr Stats

Nostr Stats was a dashboard for Nostr network statistics, powered by the [Pensieve](https://github.com/andotherstuff/pensieve) indexer API.

**The Pensieve API has been shut down and Nostr Stats is permanently offline.** The site is now a single static page, [`public/index.html`](public/index.html), saying so. The old SvelteKit dashboard is in this repository's git history.

## Deployment

Vercel deploys every push to `master`. [`vercel.json`](vercel.json) tells Vercel to skip install and build and serve `public/` as-is.

## License

See [LICENSE](LICENSE) file for details.
