# syntax=docker/dockerfile:1
# Build context is the repo root (needed for the pnpm workspace).
FROM node:22-alpine AS build

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
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

# `pnpm deploy` resolves @wardrobe/web's workspace dependency (shared) into
# real copied files rather than a symlink back to a workspace that won't
# exist in the runtime stage, and --prod drops devDependencies (typescript,
# eslint, tailwindcss...) the image doesn't need.
RUN pnpm --filter @wardrobe/shared run build \
  && pnpm --filter @wardrobe/web run build \
  && pnpm --filter @wardrobe/web deploy --prod --frozen-lockfile /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/deploy .
EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
