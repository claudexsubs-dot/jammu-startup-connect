# Jammu Startup Connect

A startup incubation ecosystem platform for Jammu. Founders register, create startup profiles, list their team,
and optionally record private financial figures. Incubation centres, mentorship and bookings come later.

**Stack:** Next.js 15 (App Router) · TypeScript · Supabase (Postgres, Auth, Row Level Security) · Playwright · Vercel

## What works today

| Area | Pages |
| --- | --- |
| Sign-in | `/register`, `/login`, log out, `/forgot-password`, `/reset-password`, `/auth/callback` |
| Startup profiles | `/dashboard`, `/startups/new`, `/startups/[id]`, `/startups/[id]/edit`, publish / unpublish, delete |
| Team | `/startups/[id]/team` (the owner adds and removes founders and team members) |
| Financials | `/startups/[id]/financials` (private: owner and editors only; runway is calculated by the database) |
| Directory | `/startups` with stage and sector filters (published profiles only) |
| Account | `/account` (name and phone) |

## Security model

- Every table has Row Level Security. The app only uses the **publishable** key; the database decides what each
  person can read or change. See `supabase/migrations/`.
- The Supabase secret / service-role key is not used anywhere in this app and must never be added to it.
- Financial figures live in their own table and are never readable by visitors or other users, even for published
  startups.

## Run it on your computer

1. Install [Node.js 22](https://nodejs.org).
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in the publishable key from Supabase (Project Settings → API Keys).
4. `npm run dev`, then open http://localhost:3000

## Database changes

All schema changes are SQL files in `supabase/migrations/`, applied in order. Don't change tables by hand in the
dashboard. The first migration is `20261030120000_foundation.sql`.

## Tests

Run `npm run typecheck`, then `npm run build`, then `npm run test:e2e`:

- `tests/smoke.spec.ts`: sign-in pages, redirects, validation and phone layout. No accounts needed.
- `tests/startup-flow.spec.ts`: the full founder journey and privacy checks against the real database. It runs only
  when two confirmed test accounts are set in `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD`, `E2E_OTHER_EMAIL` and
  `E2E_OTHER_PASSWORD`, and it deletes the startup it creates.

## Supabase dashboard settings (one-time)

- Authentication → URL Configuration: set the Site URL to the site address, and add `http://localhost:3000/**` and
  the Vercel preview address to Redirect URLs.
- Authentication → SMTP: connect a real email sender (e.g. Resend) before real users sign up. The built-in sender
  is limited to a few emails per hour.
