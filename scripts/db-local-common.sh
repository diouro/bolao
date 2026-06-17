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

db_local_load_prod_read_url() {
  local env_file="${1:-.env.production.readonly}"

  if [[ ! -f "$env_file" && -f ".env.production" ]]; then
    env_file=".env.production"
  fi

  if [[ ! -f "$env_file" ]]; then
    echo "Missing production read credentials."
    echo "Create .env.production.readonly with POSTGRES_URL_NON_POOLING (read-only dump source)."
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a

  PROD_DATABASE_URL="${PROD_READ_ONLY_DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-}}"
  if [[ -z "$PROD_DATABASE_URL" ]]; then
    echo "Set POSTGRES_URL_NON_POOLING in $env_file for read-only production dumps."
    exit 1
  fi

  db_local_assert_remote_read_url "$PROD_DATABASE_URL"
}

db_local_assert_remote_read_url() {
  local url="$1"

  if [[ "$url" == *"127.0.0.1"* || "$url" == *"localhost"* ]]; then
    echo "ERROR: Refusing to use a local database URL as the production dump source."
    echo "Clone only reads from remote production. Writes go to local Docker only."
    exit 1
  fi
}

db_local_assert_local_write_target() {
  local container
  container="$(db_local_container_name)"

  if [[ "$container" != supabase_db_* ]]; then
    echo "ERROR: Local write target is not a Supabase Docker container."
    exit 1
  fi

  echo "Local write target: $container (127.0.0.1:54322)"
}
