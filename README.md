# Bolão

A friendly FIFA World Cup prediction web app. Friends sign in with Google or
email, predict match scores, and compete on a score-only leaderboard. There is
no money, no betting, and no extra markets such as cards or scorers.

## Getting Started

Install dependencies and start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Supabase Auth, Postgres, and RLS
- Google OAuth plus email/password auth
- Tailwind CSS 4
- Vercel deploy script with optional Supabase migration and fixture seeding

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLATFORM_BASE_URL=http://localhost:3000`
- `BOOTSTRAP_ADMIN_EMAIL=you@example.com`

The first matching `BOOTSTRAP_ADMIN_EMAIL` user is promoted to admin when they
sign in. Admins can enter final match results at `/admin/results`.

## Supabase Setup

1. Create a Supabase project.
2. Run the migration:

```bash
npx supabase db push
```

3. Seed the World Cup fixtures:

```bash
npm run seed:fixtures
```

4. In Supabase Auth, enable the Google provider.
5. Add the callback URL:

```text
http://localhost:3000/auth/callback
```

For Vercel, also add:

```text
https://your-domain.com/auth/callback
```

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
npm run deploy:vercel:prod
```

## Deployment

The Vercel deploy script mirrors the strategy used in the Givenly project:

```bash
npm run deploy:vercel:prod:full
```

That can sync env vars from `.env.production`, run Supabase migrations, seed
fixtures, lint, build, and deploy to Vercel.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
