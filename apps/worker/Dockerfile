# syntax=docker/dockerfile:1
# Build context is the repo root (needed for the pnpm workspace).
#
# onnxruntime-node (a transitive dependency of @imgly/background-removal-node)
# ships prebuilt native binaries linked against glibc, not musl, confirmed by
# testing on node:22-alpine, which fails with "Error loading shared library
# ld-linux-x86-64.so.2". node:22-bookworm-slim (Debian, glibc) is required -
# for both stages, since the runtime stage needs to load that binary too.
FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# prisma.config.ts resolves DATABASE_URL eagerly, so even `prisma generate`
# fails without it. This placeholder only needs to be a well-formed URL to
# satisfy that at build time; worker doesn't touch the database itself.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN corepack enable

# Manifests only, copied before the rest of the source: see apps/api/Dockerfile
# for why this is safe to split from the build step now (it wasn't always).
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

# `pnpm deploy` resolves @wardrobe/worker's workspace dependencies (db,
# shared, storage) into real copied files rather than symlinks back to a
# workspace that won't exist in the runtime stage, and --prod drops
# devDependencies the image doesn't need. worker doesn't run prisma or tsx
# at runtime, so it doesn't need the dependency-placement care api's
# Dockerfile needs.
RUN pnpm --filter @wardrobe/db run db:generate \
  && pnpm --filter @wardrobe/db run build \
  && pnpm --filter @wardrobe/shared run build \
  && pnpm --filter @wardrobe/storage run build \
  && pnpm --filter @wardrobe/worker run build \
  && pnpm --filter @wardrobe/worker deploy --prod --frozen-lockfile /app/deploy

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/deploy .

CMD ["node", "dist/index.js"]
