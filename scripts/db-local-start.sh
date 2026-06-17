#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/db-local-common.sh"
db_local_root
db_local_require_docker

echo "Starting local Supabase (Docker)..."
npx supabase start

echo ""
echo "Local Supabase is running."
echo "  API:     http://127.0.0.1:54321"
echo "  Studio:  http://127.0.0.1:54323"
echo "  Mailpit: http://127.0.0.1:54324 (auth emails)"
echo ""
echo "Next steps:"
echo "  npm run db:local:env:write   # write .env.local.multipool"
echo "  cp .env.local.multipool .env.local && npm run dev"
echo "  npm run db:local:clone         # optional: import production data"
echo ""
bash scripts/db-local-env.sh
