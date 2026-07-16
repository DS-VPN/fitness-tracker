# Fitness Tracker

A self-hosted, single-user web app for tracking meals & macros, a shopping list tied
directly into your meal library, and strength training progress. Mobile-first,
installable as a PWA, and packaged to run on a home server with one command.

- **Meal & food library** — custom foods with full macros, your own categories, search/filter.
- **Shopping list** — one tap from any meal, quantities combine automatically, checkable, grouped.
- **Strength tracker** — log sets fast during a workout, per-exercise history/chart/PRs, estimated 1RM.

## Requirements

- Docker and Docker Compose (`docker compose` v2, bundled with modern Docker Desktop / Docker Engine).
- That's it — SQLite runs inside the container, no separate database to install.

## Setup

```sh
git clone <this-repo-url> fitness-tracker
cd fitness-tracker
cp .env.example .env
```

Edit `.env` and set at least:

- `AUTH_PASSWORD` — the password you'll use to sign in. Pick something real.
- `SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`).
- `ORIGIN` — the exact URL you'll reach the app at, **including the port**, e.g.
  `http://100.64.1.2:3000` (a Tailscale IP) or `http://homeserver.tailnet-name.ts.net:3000`.
  This is required — SvelteKit rejects form submissions whose origin doesn't match.
- `PORT` — the host port to publish (defaults to `3000`; the container always listens on `3000` internally).

Then:

```sh
docker compose up -d --build
```

Open the `ORIGIN` URL you configured above, sign in with `AUTH_PASSWORD`, and add it to
your phone's home screen (Safari/Chrome → Share/Menu → "Add to Home Screen") to install
it as a PWA.

Your data lives in a Docker named volume (`fitness-data`, mounted at `/data` in the
container) — it survives `docker compose down`, rebuilds, and image upgrades. To back it
up, copy `/data/fitness.db` out of the volume, e.g.:

```sh
docker compose cp fitness-tracker:/data/fitness.db ./backup-$(date +%F).db
```

To upgrade after pulling new code:

```sh
git pull
docker compose up -d --build
```

Schema migrations run automatically on container start.

## Security notes

This app assumes you're reaching it over your own network (Tailscale, LAN, or a VPN) —
**do not expose it directly to the public internet.** Auth is a single shared password
(no per-user accounts, no rate limiting, no lockout) — sufficient to keep it off-limits
to anyone who stumbles onto your network, not a substitute for network-level access
control.

## Local development (without Docker)

Requires Node.js 22+.

```sh
npm install
cp .env.example .env   # DATABASE_URL=local.db is already dev-appropriate
npm run db:push        # create/update the local SQLite schema from the current schema.ts
npm run dev
```

`npm run db:push` is for local development only (it's interactive/best-effort schema
sync). Production uses versioned SQL migrations in `drizzle/`, generated with
`npm run db:generate` after changing `src/lib/server/db/schema.ts` and applied
automatically by the container on startup (`scripts/migrate.js`).

## Tech stack

SvelteKit (Svelte 5, TypeScript) with `adapter-node`, one process serving both the UI
and the API. SQLite via Drizzle ORM + better-sqlite3 — a single file, no database
container. Tailwind CSS v4 for styling, design tokens defined as CSS variables in
`src/routes/layout.css`. Zero UI/charting dependencies beyond that — the progress chart
is hand-rolled inline SVG.
