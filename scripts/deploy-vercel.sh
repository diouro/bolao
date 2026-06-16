#!/usr/bin/env bash
set -euo pipefail

DEPLOY_TARGET="preview"
SKIP_CHECKS="${SKIP_CHECKS:-0}"
SYNC_ENV="${SYNC_ENV:-0}"
ENV_FILE="${ENV_FILE:-.env.production}"
ENV_ONLY="${ENV_ONLY:-0}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-0}"
MIGRATE_ONLY="${MIGRATE_ONLY:-0}"

usage() {
  echo "Usage: npm run deploy:vercel -- [--preview|--prod] [--sync-env] [--migrate] [--env-only] [--migrate-only] [--env-file <path>] [--skip-checks]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod|--production)
      DEPLOY_TARGET="production"
      shift
      ;;
    --preview)
      DEPLOY_TARGET="preview"
      shift
      ;;
    --sync-env)
      SYNC_ENV="1"
      shift
      ;;
    --env-only)
      SYNC_ENV="1"
      ENV_ONLY="1"
      SKIP_CHECKS="1"
      shift
      ;;
    --migrate)
      RUN_MIGRATIONS="1"
      shift
      ;;
    --migrate-only)
      RUN_MIGRATIONS="1"
      MIGRATE_ONLY="1"
      SKIP_CHECKS="1"
      shift
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --skip-checks)
      SKIP_CHECKS="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

parse_env_file() {
  node - "$ENV_FILE" <<'NODE'
const fs = require("node:fs");
const file = process.argv[2];
const input = fs.readFileSync(file, "utf8");

function parseValue(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

for (const line of input.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) continue;

  const [, key, rawValue] = match;
  process.stdout.write(`${key}\t${parseValue(rawValue)}\n`);
}
NODE
}

read_env_value() {
  local key="$1"

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Environment file not found: $ENV_FILE" >&2
    exit 1
  fi

  node - "$ENV_FILE" "$key" <<'NODE'
const fs = require("node:fs");
const [file, wantedKey] = process.argv.slice(2);
const input = fs.readFileSync(file, "utf8");

function parseValue(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

for (const line of input.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) continue;

  const [, key, rawValue] = match;
  if (key === wantedKey) {
    process.stdout.write(parseValue(rawValue));
    process.exit(0);
  }
}
NODE
}

export_env_file() {
  while IFS=$'\t' read -r key value; do
    [[ -z "$key" ]] && continue
    export "$key=$value"
  done < <(parse_env_file)
}

sync_vercel_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file not found: $ENV_FILE" >&2
    exit 1
  fi

  echo "Syncing Vercel $DEPLOY_TARGET environment variables from $ENV_FILE..."

  while IFS=$'\t' read -r key value; do
    [[ -z "$key" ]] && continue

    if [[ -z "$value" ]]; then
      echo "Skipping $key because it has an empty value."
      continue
    fi

    echo "Setting $key for $DEPLOY_TARGET..."
    npx vercel env rm "$key" "$DEPLOY_TARGET" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | npx vercel env add "$key" "$DEPLOY_TARGET" >/dev/null
  done < <(parse_env_file)
}

run_database_migrations() {
  local database_url

  database_url="$(read_env_value MIGRATION_DATABASE_URL)"

  if [[ -z "$database_url" ]]; then
    database_url="$(read_env_value POSTGRES_URL_NON_POOLING)"
  fi

  if [[ -z "$database_url" ]]; then
    database_url="$(read_env_value DATABASE_URL)"
  fi

  if [[ -z "$database_url" ]]; then
    database_url="$(read_env_value POSTGRES_URL)"
  fi

  if [[ -z "$database_url" ]]; then
    echo "Could not find MIGRATION_DATABASE_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL, or POSTGRES_URL in $ENV_FILE." >&2
    exit 1
  fi

  echo "Running Supabase migrations from supabase/migrations..."
  npx supabase db push --db-url "$database_url"

  echo "Seeding fixtures from data/world-cup-2026.json..."
  export_env_file
  npm run seed:fixtures
}

if [[ "$SYNC_ENV" == "1" ]]; then
  sync_vercel_env
fi

if [[ "$ENV_ONLY" == "1" ]]; then
  exit 0
fi

if [[ "$RUN_MIGRATIONS" == "1" ]]; then
  run_database_migrations
fi

if [[ "$MIGRATE_ONLY" == "1" ]]; then
  exit 0
fi

if [[ "$SKIP_CHECKS" != "1" ]]; then
  npm run lint
  npm run build
fi

if [[ "$DEPLOY_TARGET" == "production" ]]; then
  npx vercel --prod
else
  npx vercel
fi
