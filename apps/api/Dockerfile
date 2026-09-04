# syntax=docker/dockerfile:1
# Build context is the repo root (needed for the pnpm workspace).
FROM node:22-alpine AS build

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# prisma.config.ts resolves DATABASE_URL eagerly, so even `prisma generate`
# fails without it. This placeholder only needs to be a well-formed URL to
# satisfy that at build time; docker-compose's real DATABASE_URL is what
# the runtime stage actually connects with.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN corepack enable

# Manifests only, copied before the rest of the source: `pnpm install` gets
# its own layer that Docker skips on rebuild unless a manifest actually
# changed, on top of the pnpm store cache mount below (which keeps the
# install itself fast even on a genuine cache miss). This used to be
# combined with the build step into one RUN because Docker Desktop's
# containerd snapshotter failed to export pnpm's store when store
# population and consumption were split across separate RUN layers -
# verified that no longer happens now that the store lives in a cache
# mount (never a real layer) rather than inside /app.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/storage/package.json packages/storage/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile

COPY . .

# `pnpm deploy` resolves @wardrobe/api's workspace dependencies (db, shared,
# storage) into real copied files rather than symlinks back to a workspace
# that won't exist in the runtime stage, and --prod drops devDependencies
# (typescript, eslint, vitest...) that image doesn't need. prisma and tsx
# are real `dependencies` of @wardrobe/api and @wardrobe/db, not
# devDependencies, specifically so they survive that prune - the runtime
# CMD below needs both to migrate and seed the database on boot.
RUN pnpm --filter @wardrobe/db run db:generate \
  && pnpm --filter @wardrobe/db run build \
  && pnpm --filter @wardrobe/shared run build \
  && pnpm --filter @wardrobe/storage run build \
  && pnpm --filter @wardrobe/api run build \
  && pnpm --filter @wardrobe/api deploy --prod --frozen-lockfile /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/deploy .
EXPOSE 3001

# cd into @wardrobe/db so prisma.config.ts (which resolves the schema and
# migrations paths relative to itself) is discovered the same way
# `pnpm --filter @wardrobe/db run db:migrate:deploy` used to run it.
#
# prisma is invoked via a `find`-discovered path rather than
# node_modules/.bin/prisma: `pnpm deploy` generates that shim assuming a
# nesting depth that doesn't match where prisma's peer-resolved store entry
# actually lands for this dependency graph, leaving it a dead shim that
# resolves to a nonexistent path. tsx doesn't hit this (verified directly),
# so it's invoked normally.
CMD ["sh", "-c", "set -e; cd node_modules/@wardrobe/db && node \"$(find /app/node_modules/.pnpm -path '*/node_modules/prisma/build/index.js' | head -1)\" migrate deploy && node_modules/.bin/tsx prisma/seed.ts && cd /app && node dist/index.js"]
