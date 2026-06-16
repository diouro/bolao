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
- `BOOTSTRAP_ADMIN_EMAIL=you@example.com`

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

You can also run the SQL manually from `supabase/migrations/001_initial.sql` in
the Supabase SQL Editor, then run `npm run seed:fixtures`.

## Fixture JSON

World Cup data lives in `data/world-cup-2026.json`.

- Group-stage matches use FIFA country codes such as `BRA`, `USA`, and `MEX`.
- Knockout matches use placeholders such as `{ "slot": "1A" }` or `{ "slot": "W R32-1" }`.
- When teams qualify, replace placeholders with real team codes and run:

```bash
npm run seed:fixtures
```

The app will then show flags and names instead of placeholders.

## Scoring

- Exact score: 5 points
- Correct result only: 2 points
- Wrong result: 0 points

Leaderboard tiebreakers are total points, exact hits, then earliest signup.

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
