# Multi-stage build for Railway.
#
# Stages: base, deps, build, prod-deps, runtime. prod-deps exists so no build
# tooling reaches the final image.
#
# The build never touches the database. Public pages render per request (see
# src/app/(frontend)/layout.tsx), so unlike fionacorbett and luxury-gardens
# there is no DATABASE_BUILD_URL, no PAYLOAD_SECRET build argument and no
# migration inside the build. Migrations run once, in Railway's pre-deploy
# step, with the service's own variables and private network.

ARG NODE_VERSION=24.20.0
ARG PNPM_VERSION=11.5.2

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# Manifests before source, so the dependency layer caches across source changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inlined into the client bundle and the static sitemap at build time, so it
# has to be a build argument as well as a runtime variable. An unset build
# argument is an empty string, which site-env.ts treats as unset.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# The node image ships a non-root user.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
# src and the configs stay in the image so the pre-deploy step can run
# `payload migrate`: without them the binary has no config to load.
COPY --from=build --chown=node:node /app/src ./src
COPY --chown=node:node package.json next.config.ts tsconfig.json ./

USER node
EXPOSE 3000

# /health rather than /api/health: Payload owns /api/[...slug].
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form, so the server is PID 1 and receives SIGTERM directly.
CMD ["node_modules/.bin/next", "start"]
