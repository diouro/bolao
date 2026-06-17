#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/db-local-common.sh"
db_local_root
db_local_require_docker

ENV_FILE="${ENV_FILE:-.env.production.readonly}"
DUMP_FILE="${DUMP_FILE:-dumps/prod-data.sql}"
SKIP_DUMP="${SKIP_DUMP:-0}"

if ! npx supabase status >/dev/null 2>&1; then
  echo "Starting local Supabase first..."
  bash scripts/db-local-start.sh
fi

db_local_assert_local_write_target

echo ""
echo "=== Local database clone ==="
echo "READ:  remote production (pg_dump only — no production writes)"
echo "WRITE: local Docker Supabase only"
echo ""

if [[ "$SKIP_DUMP" != "1" ]]; then
  db_local_load_prod_read_url "$ENV_FILE"
  mkdir -p "$(dirname "$DUMP_FILE")"

  echo "Dumping production data (read-only)..."
  npx supabase db dump \
    --db-url "$PROD_DATABASE_URL" \
    -f "$DUMP_FILE" \
    --data-only \
    --use-copy \
    --schema auth,public
else
  if [[ ! -f "$DUMP_FILE" ]]; then
    echo "Missing $DUMP_FILE. Run without SKIP_DUMP=1 first."
    exit 1
  fi
  echo "Skipping production dump; reusing $DUMP_FILE"
fi

echo "Resetting local database (migrations only)..."
npx supabase db reset

echo "Importing data into local database..."
db_local_psql scripts/db-local-pre-import.sql
db_local_psql "$DUMP_FILE"
db_local_psql scripts/db-local-post-import.sql

echo ""
echo "Done. Production was not modified."
echo "Local database now mirrors production data."
echo "Mailpit (local auth emails): http://127.0.0.1:54324"
