#!/usr/bin/env bash
#
# First-time Fly.io setup, then deploy. Safe to re-run — every step checks
# whether it has already been done and skips it if so.
#
#   ./scripts/deploy-fly.sh
#
# Creates real, billable resources (one small VM and a 1GB volume). It tells
# you what it is about to do and waits for confirmation before the first one.

set -euo pipefail

cd "$(dirname "$0")/.."

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; OFF=$'\033[0m'
step() { printf '\n%s==>%s %s\n' "$BOLD" "$OFF" "$1"; }
ok()   { printf '  %s✓%s %s\n' "$GREEN" "$OFF" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$OFF" "$1"; }
die()  { printf '\n%serror:%s %s\n' "$RED" "$OFF" "$1" >&2; exit 1; }

VOLUME_NAME="pepmarket_data"

# ---------------------------------------------------------------- preflight

step "Checking prerequisites"

if ! command -v fly >/dev/null 2>&1; then
  die "flyctl is not installed.

  macOS/Linux   curl -L https://fly.io/install.sh | sh
  Windows       pwsh -c \"iwr https://fly.io/install.ps1 -useb | iex\"

Then run this again."
fi
ok "flyctl $(fly version 2>/dev/null | head -1)"

if ! fly auth whoami >/dev/null 2>&1; then
  die "Not signed in to Fly. Run:  fly auth login"
fi
ok "signed in as $(fly auth whoami 2>/dev/null)"

[ -f fly.toml ] || die "fly.toml is missing — run this from the repository root."

APP_NAME=$(grep -E '^app *= *' fly.toml | head -1 | sed -E 's/.*= *"?([^"]*)"?.*/\1/')
REGION=$(grep -E '^primary_region *= *' fly.toml | head -1 | sed -E 's/.*= *"?([^"]*)"?.*/\1/')
[ -n "$APP_NAME" ] || die "Could not read the app name out of fly.toml."
ok "app '$APP_NAME' in region '$REGION'"

# ---------------------------------------------------------------- the app

step "Creating the app if it does not exist"

if fly apps list 2>/dev/null | awk '{print $1}' | grep -qx "$APP_NAME"; then
  ok "app '$APP_NAME' already exists"
else
  cat <<EOF

  About to create Fly resources on your account:

    app     $APP_NAME        (one shared-cpu-1x VM, 512MB)
    volume  $VOLUME_NAME     (1GB, region $REGION)

  This costs money — a few dollars a month at this size.
  App names are globally unique; if '$APP_NAME' is taken, edit fly.toml first.

EOF
  read -r -p "  Continue? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || die "Cancelled. Nothing was created."

  fly apps create "$APP_NAME" || die "Could not create the app. If the name is taken, change 'app' in fly.toml."
  ok "created app '$APP_NAME'"
fi

# ---------------------------------------------------------------- the volume

step "Creating the data volume if it does not exist"

if fly volumes list --app "$APP_NAME" 2>/dev/null | grep -q "$VOLUME_NAME"; then
  ok "volume '$VOLUME_NAME' already exists"
else
  fly volumes create "$VOLUME_NAME" --app "$APP_NAME" --region "$REGION" --size 1 --yes
  ok "created volume '$VOLUME_NAME'"
  warn "the SQLite database lives here — back it up (see DEPLOYING.md)"
fi

# ---------------------------------------------------------------- secrets

step "Setting secrets"

existing_secrets=$(fly secrets list --app "$APP_NAME" 2>/dev/null || true)

if grep -q "SESSION_SECRET" <<<"$existing_secrets"; then
  ok "SESSION_SECRET already set"
else
  # The app refuses to issue affiliate sessions in production without this,
  # so it has to exist before the first deploy is useful.
  secret=$(openssl rand -hex 32 2>/dev/null || head -c32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  fly secrets set SESSION_SECRET="$secret" --app "$APP_NAME" --stage >/dev/null
  ok "generated and staged SESSION_SECRET"
fi

if grep -q "ADMIN_TOKEN" <<<"$existing_secrets"; then
  ok "ADMIN_TOKEN already set"
else
  admin=$(openssl rand -hex 16 2>/dev/null || head -c16 /dev/urandom | od -An -tx1 | tr -d ' \n')
  fly secrets set ADMIN_TOKEN="$admin" --app "$APP_NAME" --stage >/dev/null
  ok "generated and staged ADMIN_TOKEN"
  printf '\n    %sYour admin token:%s %s\n' "$BOLD" "$OFF" "$admin"
  printf '    Save it now — reach admin at /admin?token=THAT\n'
  printf '    (Lost it? fly secrets set ADMIN_TOKEN=... --app %s)\n' "$APP_NAME"
fi

# ---------------------------------------------------------------- deploy

step "Deploying"
warn "first build takes a few minutes — it compiles better-sqlite3"

# --remote-only builds on Fly's builders, so no local Docker daemon is needed.
fly deploy --remote-only --app "$APP_NAME"

step "Done"
fly status --app "$APP_NAME" || true

cat <<EOF

  Your store:  https://$APP_NAME.fly.dev

  Next steps
    Custom domain    fly certs add yourdomain.com
                     then point DNS at:  fly ips list
    Logs             fly logs --app $APP_NAME
    Shell            fly ssh console --app $APP_NAME
    Deploy on push   see .github/workflows/fly-deploy.yml

EOF
