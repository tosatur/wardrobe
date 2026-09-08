# Wardrobe

A self-hostable web app for cataloguing clothing, building outfits, and
tracking outfit-wear history.

## Layout

pnpm workspace monorepo:

- `apps/web`: Next.js frontend
- `apps/api`: REST API (Fastify), auth via better-auth
- `apps/worker`: background job processor (background removal, thumbnails)
- `packages/db`: Prisma schema + generated client (Postgres)
- `packages/shared`: shared Zod schemas / TS types
- `packages/storage`: file storage helpers

## Requirements

- Node `>=22` (see `.nvmrc`)
- pnpm `12.2.0` (via corepack)
- Docker

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `.env`: `DATABASE_URL`, `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`,
`WEB_URL`, `STORAGE_DIR`, `MAX_UPLOAD_BYTES`.

## Development

Run Postgres in Docker, everything else locally for fast iteration:

```bash
docker compose up -d postgres
pnpm --filter @wardrobe/db run db:migrate
pnpm --filter @wardrobe/db run db:seed
pnpm dev
```

Alternatively, run the whole stack in Docker (closer to a real self-hosted
deployment):

```bash
docker compose up -d
```

## Commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Database scripts (`pnpm --filter @wardrobe/db run <script>`):
`db:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:studio`.
