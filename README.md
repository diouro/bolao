# Bolão

A friendly FIFA World Cup prediction web app. Friends sign in with email,
predict match scores, and compete on a score-only leaderboard. There is no
money, no betting, and no extra markets such as cards or scorers.

## Getting Started

Install dependencies and start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Supabase Auth, Postgres, and RLS
- Email/password auth
- Tailwind CSS 4
- Vercel deploy script with Supabase migrations and fixture seeding

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIGRATION_DATABASE_URL` (or `POSTGRES_URL_NON_POOLING`, `DATABASE_URL`, `POSTGRES_URL`)
- `PLATFORM_BASE_URL=http://localhost:3000`
- `APP_TIME_ZONE=Australia/Sydney`
- `BOOTSTRAP_ADMIN_EMAIL=you@example.com`
- `RESULTS_PROVIDER=football-data`
- `FOOTBALL_DATA_API_TOKEN`
- `FOOTBALL_DATA_SEASON=2026`

For Vercel production, set these server environment variables in the project
settings, or sync them from `.env.production` with:

```bash
npm run vercel:env:prod
```

The first matching `BOOTSTRAP_ADMIN_EMAIL` user is promoted to admin when they
sign in. Admins can enter final match results at `/admin/results`.

## Supabase Setup

1. Create a Supabase project.
2. Add your Supabase connection string to `.env.production` as `MIGRATION_DATABASE_URL`.
3. Run migrations and seed the World Cup fixtures:

```bash
npm run vercel:migrate:prod
```

This uses `npx supabase db push --db-url "$MIGRATION_DATABASE_URL"`, so it does
not require a globally installed Supabase CLI or a linked local project.

You can also run the SQL manually from `supabase/migrations` in the Supabase SQL
Editor, then run `npm run seed:fixtures`.

## Local Supabase (multi-pool development)

Run a full Supabase stack locally with Docker — no paid cloud project needed.
Production stays untouched.

**Prerequisites:** Docker Desktop running.

```bash
npm run db:local:start          # start containers + apply migrations
npm run db:local:env:write      # write .env.local.multipool with local keys
cp .env.local.multipool .env.local
npm run dev
```

Optional — copy production data into the local database (read-only from prod):

```bash
cp env.production.readonly.example .env.production.readonly
# paste POSTGRES_URL_NON_POOLING from production (port 5432)
npm run db:local:clone
```

`db:local:clone` only **reads** from production (`pg_dump`). All writes go to local Docker.
You usually only need this once, or when you want a fresh copy. For day-to-day multi-pool work:

```bash
npm run db:local:reset   # re-apply migrations locally, no prod contact
```

**Never run** `npm run vercel:migrate:prod` while working on multi-pool locally — that pushes migrations to production.

Other commands:

```bash
npm run db:local:status         # URLs, keys, container health
npm run db:local:reset          # re-apply migrations (empty data)
npm run db:local:stop           # stop Docker containers
```

Local services:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Mailpit (auth emails): `http://127.0.0.1:54324`

Config lives in `supabase/config.toml`. Migrations are in `supabase/migrations/`.

## Fixtures

World Cup fixtures are synced from football-data.org into the `matches` table.

Set:

```bash
FOOTBALL_DATA_API_TOKEN=your_token_here
FOOTBALL_DATA_SEASON=2026
```

Then run:

```bash
npm run seed:fixtures
```

The old JSON seed remains available as `npm run seed:fixtures:json`, but the API
sync is the preferred source because it keeps fixture IDs, team names, kickoff
times, and results aligned with the external provider.

## Scoring

- Exact score: 3 points
- Correct outcome only: 1 point
- Wrong result: 0 points

Leaderboard tiebreakers are total points, exact hits, then earliest signup.

Predictions lock 5 minutes before kickoff by default. To change the lock
window, update the `prediction_lock_minutes` row in `app_settings`.

## Payments

Friends can tip in `$5`. Payment is tracked manually in the database by setting
`profiles.has_paid = true`. Paid players show a green tick beside their profile,
and the leaderboard displays the current prize pool as paid players times `$5`.

## Result Sync

The admin results page can sync finished scores from
[football-data.org](https://www.football-data.org/client/register).

Set these env vars in `.env.local` and `.env.production`:

```bash
RESULTS_PROVIDER=football-data
FOOTBALL_DATA_API_TOKEN=your_token_here
FOOTBALL_DATA_SEASON=2026
```

Then open `/admin/results` and click `Sync finished scores`. The sync updates
`matches.home_score`, `matches.away_score`, and marks finished matches as
`finished`.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run seed:fixtures
npm run vercel:migrate:prod
npm run deploy:vercel:prod
```

## Deployment

The Vercel deploy script mirrors the strategy used in the Givenly project:

```bash
npm run deploy:vercel:prod:full
```

That can sync env vars from `.env.production`, run Supabase migrations through
`npx supabase db push --db-url`, seed fixtures, lint, build, and deploy to
Vercel.
