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
- `CRON_SECRET` (random string for Vercel cron auth)

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

Match scores sync from [football-data.org](https://www.football-data.org/client/register).
On Vercel, a cron job runs every 5 minutes automatically. Admins can also sync
manually from `/admin/results`.

Set these env vars in `.env.local` and `.env.production`:

```bash
RESULTS_PROVIDER=football-data
FOOTBALL_DATA_API_TOKEN=your_token_here
FOOTBALL_DATA_SEASON=2026
CRON_SECRET=generate_a_long_random_string
```

The free football-data.org plan allows **10 requests/minute** and returns
**delayed** scores (typically a few minutes after full time). Each sync uses
one API call for the whole World Cup.

### Automatic sync (Vercel)

`vercel.json` schedules `GET /api/cron/sync-results` every 5 minutes. Vercel
sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set in project
settings.

Test locally (reads `CRON_SECRET` from `.env.local`):

```bash
npm run cron:sync-results
```

Or with curl — note `$CRON_SECRET` is **not** loaded from `.env.local` into your shell; paste the value or export it first:

```bash
export CRON_SECRET='your_secret_here'
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-results
```

Manual admin sync still works from `/admin/results`. Both paths update
`matches.home_score`, `matches.away_score`, and `matches.status` (`live` or
`finished`).

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
