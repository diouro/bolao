#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/db-local-common.sh"
db_local_root

if ! npx supabase status >/dev/null 2>&1; then
  echo "Local Supabase is not running. Run: npm run db:local:start"
  exit 1
fi

eval "$(npx supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|DB_URL)=')"

OUTPUT_FILE="${1:-}"
ENV_CONTENT="$(cat <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
MIGRATION_DATABASE_URL=${DB_URL}

PLATFORM_BASE_URL=http://localhost:3000
PLATFORM_NAME=Bolão
APP_TIME_ZONE=Australia/Sydney
BOOTSTRAP_ADMIN_EMAIL=
RESULTS_PROVIDER=football-data
FOOTBALL_DATA_API_TOKEN=
FOOTBALL_DATA_SEASON=2026
EOF
)"

if [[ -n "$OUTPUT_FILE" ]]; then
  printf "%s\n" "$ENV_CONTENT" >"$OUTPUT_FILE"
  echo "Wrote $OUTPUT_FILE"
else
  echo "# Local Supabase env (copy to .env.local for multi-pool work)"
  echo "$ENV_CONTENT"
fi
