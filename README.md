# Fitness Tracker

A self-hosted, multi-user web app for tracking meals & macros, a shopping list tied
directly into your meal library, and strength training progress. Mobile-first,
installable as a PWA, and packaged to run on a home server with one command.

- **Accounts** — each person creates their own username/password account. Meals,
  categories, exercises, and workouts are completely private to each account.
- **Meal & food library** — custom foods with full macros, your own categories, search/filter.
- **Shopping list** — one tap from any meal, quantities combine automatically, checkable,
  grouped. Private by default, with an option to share your list with another account by
  username so you can shop together.
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

Edit `.env` and set:

- `ORIGIN` — the exact URL you'll reach the app at, **including the port**, e.g.
  `http://100.64.1.2:3000` (a Tailscale IP) or `http://homeserver.tailnet-name.ts.net:3000`.
  This is required — SvelteKit rejects form submissions whose origin doesn't match.
- `PORT` — the host port to publish (defaults to `3000`; the container always listens on `3000` internally).

Then:

```sh
docker compose up -d --build
```

Open the `ORIGIN` URL you configured above and use **Create one** to make the first
account — there's no shared password to configure, everyone (up to however many people
you expect to use this — it's been built with a household of ~5 in mind) signs up their
own account directly in the app. Add it to your phone's home screen (Safari/Chrome →
Share/Menu → "Add to Home Screen") to install it as a PWA.

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

## Deploying to a Proxmox VE LXC

`proxmox/create-lxc.sh` provisions a whole container for you: creates an unprivileged
Debian LXC (with the `nesting`/`keyctl` features Docker needs), installs Docker inside
it, clones this repo, and runs `docker compose up -d --build`. Run it **on the Proxmox
host itself**, as root:

```sh
./proxmox/create-lxc.sh
```

It auto-picks a free container ID, storage, and the newest Debian 12 template, and
prints the app URL when it's done. Every setting (container ID, hostname, cores,
memory, disk, bridge, static vs. DHCP networking, repo URL) is overridable via
environment variables — see the comments at the top of the script. Since this repo is
private, cloning it from inside the container needs credentials; the script's header
comment covers your options (make the repo public, use an SSH deploy key already on the
Proxmox host, or a token embedded in the HTTPS URL for the one-time clone).

## Sharing a shopping list

By default your shopping list is private, same as everything else. To shop together
with someone else on the same instance: open your list → **Share** → enter their
username. They'll see your list as an extra tab next to their own ("Mine" / "their
username's list") and can add, check off, and remove items on it. You can revoke access
any time from the same Share panel; they can also leave a shared list themselves.

## Security notes

This app assumes you're reaching it over your own network (Tailscale, LAN, or a VPN) —
**do not expose it directly to the public internet.** Account signup is open to anyone
who can reach the app (no invite codes, no email verification, no rate limiting) — that's
appropriate for a small trusted group on a private network, not for anything internet-facing.

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
container. Passwords are hashed with Node's built-in `scrypt` (no auth dependency).
Tailwind CSS v4 for styling, design tokens defined as CSS variables in
`src/routes/layout.css`. Zero UI/charting dependencies beyond that — the progress chart
is hand-rolled inline SVG.
