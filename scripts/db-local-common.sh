#!/usr/bin/env bash

db_local_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
}

db_local_require_docker() {
  if ! command -v docker >/dev/null; then
    echo "Docker is required. Install Docker Desktop and ensure it is running."
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon is not running. Start Docker Desktop and retry."
    exit 1
  fi
}

db_local_container_name() {
  local container
  container="$(docker ps --filter "name=supabase_db_" --format "{{.Names}}" | head -n 1)"
  if [[ -z "$container" ]]; then
    echo "Local Supabase database container not found. Run: npm run db:local:start"
    exit 1
  fi
  printf "%s" "$container"
}

db_local_psql() {
  local sql_file="${1:-}"
  local container
  container="$(db_local_container_name)"

  if [[ -n "$sql_file" ]]; then
    docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <"$sql_file"
  else
    docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1
  fi
}

db_local_load_env_file() {
  local env_file="${1:-.env.production}"

  if [[ ! -f "$env_file" ]]; then
    echo "Missing $env_file. Create it from production credentials first."
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a

  PROD_DATABASE_URL="${PROD_DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-${MIGRATION_DATABASE_URL:-}}}"
  if [[ -z "$PROD_DATABASE_URL" ]]; then
    echo "Set POSTGRES_URL_NON_POOLING or MIGRATION_DATABASE_URL in $env_file"
    exit 1
  fi
}
