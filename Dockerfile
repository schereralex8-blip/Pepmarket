# better-sqlite3 is a native module, so the build stage and the run stage must
# share a libc. Both are Debian-based node:22-slim for that reason — swapping
# the runtime to Alpine will fail at require() time with a musl/glibc mismatch.

FROM node:22-slim AS deps
WORKDIR /app
# python3/make/g++ are here for better-sqlite3's node-gyp fallback if no
# prebuilt binary matches this platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# A build-time placeholder: no session is ever signed during a build, and the
# real secret arrives as a runtime environment variable.
ENV SESSION_SECRET=build-time-placeholder
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Container runtimes set HOSTNAME to the container ID, and the standalone
# server binds to whatever HOSTNAME says — which would leave it unreachable
# from outside. Pin it.
ENV HOSTNAME=0.0.0.0
# Where the SQLite file lives. Mount a persistent volume here.
ENV DATABASE_PATH=/data/pepmarket.db

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /data && chown nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server.js"]
