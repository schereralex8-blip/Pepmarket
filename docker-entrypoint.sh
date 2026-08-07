#!/bin/sh
set -e

# Volumes on managed platforms (Railway volumes, Fly volumes) are mounted
# owned by root, while the app runs as an unprivileged user. Without this the
# process starts fine and then cannot write a single order — which the
# /api/health check would report as a 503.
#
# So: start as root, take ownership of the data directory, then drop to the
# app user before exec'ing. gosu execs in place rather than forking, so the
# app stays PID 1 and still receives SIGTERM on shutdown.

DATA_DIR=$(dirname "${DATABASE_PATH:-/data/pepmarket.db}")

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R nextjs:nodejs "$DATA_DIR" 2>/dev/null || true
  exec gosu nextjs "$@"
fi

# Already unprivileged (some platforms pin the UID) — nothing to drop.
exec "$@"
