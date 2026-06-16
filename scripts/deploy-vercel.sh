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

if [[ "$SYNC_ENV" == "1" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file not found: $ENV_FILE" >&2
    exit 1
  fi

  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    printf '%s' "$value" | npx vercel env add "$key" "$DEPLOY_TARGET" --force
  done < "$ENV_FILE"
fi

if [[ "$ENV_ONLY" == "1" ]]; then
  exit 0
fi

if [[ "$RUN_MIGRATIONS" == "1" ]]; then
  npx supabase db push
  npm run seed:fixtures
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
