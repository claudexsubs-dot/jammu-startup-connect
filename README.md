# UdyamSetu

UdyamSetu helps Jammu-domiciled founders discover and apply to incubation centres, get mentor support, and request
paid consulting sessions with college experts.

> **UdyamSetu is an independent platform.** It is not a government portal, has no official partnership with any
> government programme, and does not promise funding, grants or admission. Each incubation centre makes its own
> decisions. Do not add official logos, partnership claims, grant eligibility or funding integrations without
> written authorisation.

**Stack:** Next.js 15 (App Router, Server Actions) · TypeScript · Supabase (Postgres, Auth, Row Level Security) ·
Playwright · Vercel. Plain CSS in `app/globals.css`.

## Who does what

| Role | How someone gets it | What they can do |
| --- | --- | --- |
| **Founder** | Registers at `/register` and self-declares Jammu domicile (no documents) | Build a venture profile (saved as a draft), browse, filter and compare centres, see explained recommendations, apply to any number of centres, reply to information requests, message centres they applied to, request mentor and expert sessions |
| **Centre staff** | Invited by the master admin (invitation link) | Edit their centre's profile, review applications and change their status with a note, search every startup, start conversations, manage mentors and experts and their availability, handle bookings, see counts |
| **Mentor / paid college expert** | Added by centre staff; optionally invited to link their own account | Set availability, format, duration, fee and engagement policy; send payment instructions; confirm, decline or suggest another time |
| **Master admin** | Granted once from the SQL editor (see below) | Create, edit, activate, suspend or remove centres; invite and revoke staff; suspend users; review reports and hide messages; manage stages, sectors and support needs; platform counts; audit history |

Key rules, all enforced in the database (not just the pages):

- Founders' email and phone are never shown to centres unless the founder ticks "Share my email and phone". Private
  financial figures are shared with a centre only when the founder ticks that box on an application.
- Each application stores a snapshot of the venture profile at the time it was submitted, and has its own status:
  draft → submitted → under review → more information needed → accepted / not selected / waitlisted.
- One application per startup per centre: starting again resumes the existing one.
- Recommendations only rank and explain. Nothing is assigned automatically.
- **UdyamSetu never processes payments.** A booking is *pending* until the expert confirms it. For paid sessions the
  expert sends payment instructions, the founder pays them directly, and the expert confirms. No card, UPI, bank or
  payment-proof data is collected.
- A slot can't be double-booked (unique index plus row locks). Engagement policies (pre-admission / admitted only /
  any founder) are checked before a request is accepted.
- A suspended centre keeps its history but takes no new applications, conversations or bookings. A suspended
  account can't change anything.
- Opening a page your role doesn't allow shows "no access" and is recorded in the audit history.

## Pages

| Area | Pages |
| --- | --- |
| Public | `/`, `/about`, `/centres` (filters, recommendations, compare), `/centres/[slug]`, `/centres/compare`, `/experts` (search experts by topic, centre, price and format, with each one's next open time), `/experts/[id]` (pick a day and time and request in one panel; visitors can see times before signing up) |
| Sign-in | `/register`, `/login`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/invite/[token]` |
| Founder | `/dashboard`, `/venture` (+ `/venture/edit/[step]`, `/venture/team`, `/venture/financials`), `/applications`, `/applications/[id]`, `/messages`, `/bookings`, `/notifications`, `/account` |
| Centre staff | `/manage/[slug]` with applications, startups, messages, mentors and experts, bookings and profile |
| Mentor / expert | `/expert`, `/expert/[expertId]`, `/expert/bookings/[id]` |
| Master admin | `/admin` with centres, users, reports, stages/sectors/needs and audit history |

## Security model

- Every table has Row Level Security. The app only uses the **publishable** key; the database decides what each
  person can read or change. Workflow steps (applying, changing status, messaging, booking, invitations, moderation)
  are database functions that check the caller's role themselves.
- Role-check helpers live in a `private` schema that the API does not expose.
- The Supabase secret / service-role key is not used anywhere in this app and must never be added to it.

## Run it on your computer

You need [Node.js 22](https://nodejs.org) and [Docker](https://www.docker.com/) (for a local copy of Supabase).

```bash
npm install
npm run db:start          # starts a local Supabase, applies all migrations and loads supabase/seed/
npx supabase@2.122.1 status   # shows the local API URL and publishable key
```

Create `.env.local` (see `.env.example`) with the local values:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the publishable key from `supabase status`>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then `npm run dev` and open http://localhost:3000. Local emails (sign-up, password reset) appear in Mailpit at
http://127.0.0.1:54324.

Local demo accounts (password `Udyam-local-123`), created by `supabase/seed/02_local_accounts.sql`:

| Email | Role |
| --- | --- |
| `admin@udyamsetu.local` | Master admin |
| `staff@udyamsetu.local` | Staff at IIM Jammu Incubation Centre |
| `expert@udyamsetu.local` | Linked to the local demo expert "Dr. Asha Verma (Local demo)" |
| `founder@udyamsetu.local` | Founder with a complete venture profile |
| `newfounder@udyamsetu.local` | Founder who has only registered |

`npm run db:reset` wipes the local database and rebuilds it from the migrations and seed files.

## Database changes (migrations)

All schema changes are SQL files in `supabase/migrations/`, applied in order. Don't change tables by hand in the
dashboard.

- `20261030120000_foundation.sql`: accounts, startup profiles, team, private financials.
- `20261104120000_udyamsetu_platform.sql`: centres, staff, mentors and experts, availability, applications with
  snapshots, messages and reports, bookings, notifications, audit history, and all permissions. It converts
  existing data (for example the old six stages become the three UdyamSetu stages) instead of deleting it.

After changing the schema, regenerate the TypeScript types with `npm run db:types`.

To apply migrations to the hosted project, use the Supabase CLI (`supabase link`, then `supabase db push`) or the
Supabase MCP / SQL editor, one file at a time and in order. **Never** use `--include-seed` against the hosted
project: the local demo accounts must not exist there.

## Seed data

- `supabase/seed/01_mission_yuva_centres.sql`: the 12 incubation centres named in public reports as part of the
  Mission YUVA incubation network in J&K (IIM Jammu, IIT Jammu, SKUAST Jammu, SMVDU, BGSBU, Central University of
  Jammu, University of Jammu, SKUAST Kashmir, University of Kashmir, IUST, NIFT Srinagar, NIT Srinagar). Each stores
  its source (`source_label`, `source_url`) and shows it on its page. Only public facts are filled in; programmes,
  sectors, stages and mentors are left for each centre's staff, and applications stay closed until they open them.
  Listing a centre doesn't claim any partnership. Safe to run more than once.
- `supabase/seed/02_local_accounts.sql`: **local development only.** Demo accounts with a shared password, plus
  fictional "(Local demo)" experts with open times and focus areas on three centres, so booking can be tried.

## The first master admin

1. Register a normal account on the site with the email that should become the master admin, and confirm it.
2. In the Supabase dashboard, open **SQL Editor** and run:

   ```sql
   select private.grant_platform_admin('you@example.com');
   ```

3. Log out and in again. An **Admin** link appears in the menu. From there, add centres and invite their staff.

Further admins can be granted the same way. This function can't be called from the website or the API.

## Tests

```bash
npm run typecheck
npm run build      # with .env.local pointing at the LOCAL Supabase
npm test           # all tests; needs the local Supabase running (npm run db:start)
```

| Project | What it checks |
| --- | --- |
| `unit` | Recommendation scoring and explanations, directory filters, closing dates |
| `api` | Permissions and workflows against the local database with real accounts: privacy of contact details and financials, applications and snapshots, status changes, messages, bookings (pending until confirmed, no double booking, engagement policies), suspended centres and accounts, blocked access logging, admin-only actions |
| `desktop` | Full journeys in a browser: founder registers, builds a profile, applies, answers an information request and messages the centre; a paid session request from pending to confirmed; blocked pages; admin adds a centre and invites staff |
| `mobile` | Public pages and sign-in on a phone-sized screen, including no sideways scrolling |

The `api` and `desktop` tests create throwaway accounts, so they only run when `NEXT_PUBLIC_SUPABASE_URL` points at
a local Supabase (`http://127.0.0.1:54321`). They skip themselves otherwise. CI (`.github/workflows/ci.yml`) starts a
local Supabase inside the CI machine and runs everything.

## Environment variables

| Name | Where | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | The Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local`, Vercel | The Supabase **publishable** key (never the secret key) |
| `NEXT_PUBLIC_SITE_URL` | `.env.local`, Vercel | The site's address; used in email and invitation links |

## Supabase dashboard settings (one-time)

- Authentication → URL Configuration: set the Site URL to the site address, and add `http://localhost:3000/**` and
  the Vercel preview address to Redirect URLs.
- Authentication → SMTP: connect a real email sender (for example Resend) before real users sign up. The built-in
  sender is limited to a few emails per hour.

## Not included yet

Payments of any kind, government funding decisions, automatic assignment of founders to centres, separate sites per
centre, sending invitation emails (invitations are copy-and-share links for now), and document checks for domicile.
