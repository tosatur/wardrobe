# Wardrobe app (Name TBD)

A self-hostable web app for managing your wardrobe.

## Layout

pnpm workspace monorepo:

- `apps/web`: Next.js frontend
- `apps/api`: REST API (Fastify)
- `apps/worker`: background job processor (background removal, thumbnails)
- `packages/db`: Prisma schema + generated client
- `packages/shared`: shared Zod schemas / TS types

## Development

```
pnpm install
```
