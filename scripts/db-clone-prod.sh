#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/db-local-common.sh"
db_local_root
db_local_require_docker

ENV_FILE="${ENV_FILE:-.env.production}"
DUMP_FILE="${DUMP_FILE:-dumps/prod-data.sql}"

if ! npx supabase status >/dev/null 2>&1; then
  echo "Starting local Supabase first..."
  bash scripts/db-local-start.sh
fi

db_local_load_env_file "$ENV_FILE"
mkdir -p "$(dirname "$DUMP_FILE")"

echo "Resetting local database (migrations only)..."
npx supabase db reset

echo "Dumping production data (auth + public schemas)..."
npx supabase db dump \
  --db-url "$PROD_DATABASE_URL" \
  -f "$DUMP_FILE" \
  --data-only \
  --use-copy \
  --schema auth,public

echo "Importing data into local database..."
db_local_psql scripts/db-local-pre-import.sql
db_local_psql "$DUMP_FILE"

echo ""
echo "Done. Local database now has production data."
echo "Use the same logins as production, or sign up new users in Mailpit:"
echo "  http://127.0.0.1:54324"
