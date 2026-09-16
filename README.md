# Olympiad Portal

> **About this repo:** the live site runs on private infrastructure that
> isn't shared here, no link, no domain, no hosting details. The people it's
> built for already know where to find it. This repository exists so the
> source code itself is visible, as proof of the work, not as an invitation
> to deploy or access the real instance.

A private platform for a math olympiad community to write, review and rate
competition problems before they go into a contest.

The idea: admins create a contest, write problems in LaTeX, and decide who
gets to see it and who gets to vote on it (with what weight). Members read
the problems and rate them on two axes, beauty and difficulty. Voting is
blind, so a member only ever sees their own ratings. Not anyone else's, not
the weights, not the averages. Admins see all of it, including every
individual vote.

## Contents

- [Stack](#stack)
- [How it's organized](#how-its-organized)
- [Permission model](#permission-model)
- [Getting it running](#getting-it-running)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Bootstrapping the first admin](#bootstrapping-the-first-admin)
- [Seed / demo data](#seed--demo-data)
- [Tests](#tests)
- [Deploying](#deploying)
- [Security](#security)
- [Folder layout](#folder-layout)

## Stack

Next.js 16 (App Router) + React 19 + TypeScript, talking to Postgres through
Prisma. Tailwind v4 for styling with shadcn/ui components, React Hook Form +
Zod for forms, KaTeX for rendering math, Argon2id for passwords. Plain npm,
no monorepo tooling. One Next.js app, no separate API server.

## How it's organized

Two rules hold the whole thing together:

**Reads happen in Server Components, writes happen through API routes.**
A page resolves who's asking and what they're allowed to see on the server
before it renders anything, so a member's browser never even receives data
they shouldn't have. Writes (casting a vote, flipping a permission) go
through normal REST endpoints, which keeps the interactive bits simple and
easy to test on their own.

**Authorization isn't scattered through the UI code.** There's no
`if (role === "ADMIN")` sprinkled around. Feature code calls
`requireCapability("weight:update")` or `requireContestAccess(user, contestId)`,
and the actual rule lives in one place, so it can change without hunting
down every call site that needs updating.

```text
                React / Next.js frontend
                          |
       Server Components  |  Route Handlers (/api/*)
                          |
                    Service layer            src/lib/services
                          |
             Authorization + validation      src/lib/permissions
                          |                   src/lib/validation
                    Prisma ORM
                          |
                     PostgreSQL
```

| Where | What's in it |
| --- | --- |
| `src/lib/auth` | password hashing, sessions, resolving the current user |
| `src/lib/permissions` | role capabilities + per-contest access |
| `src/lib/services` | the actual business logic, each writing its own audit entries |
| `src/lib/calculations` | weighted averages, done in decimals not floats |
| `src/lib/validation` | Zod schemas shared between API and forms |
| `src/lib/math` | the LaTeX renderer used by both the reader and the editor |

## Permission model

Three separate questions, kept deliberately apart instead of collapsed into
one role check:

```text
  Account approval      is this person allowed on the platform at all?
        |               User.status: PENDING -> APPROVED
        v
  Contest access        can they open this specific contest?
        |               ContestPermission.canView
        v
  Voting permission      can they rate its problems?
                         ContestPermission.canVote
```

So a member can be approved but have access to nothing yet, or have access
to a contest without being allowed to vote on it.

Weights belong to a (member, contest) pair, not to the member globally.
The same person can have weight 1.5 in one contest and 0.5 in another. Only
admins can see weights, and every change to one lands in the audit log.

Three roles: `USER`, `ADMIN`, `SUPER_ADMIN`. Admins can do basically
everything except grant or revoke admin rights. That's reserved for a super
admin, and the app won't let you remove the last active one.

### The weighted average

Done server-side, per problem, per axis:

```text
              Σ (rating × weight)
  average  =  ───────────────────
                  Σ (weight)
```

Uses `Prisma.Decimal` instead of floats so weights like `0.05` or `33.33`
don't drift across a large voter set. Only the final number reaches the
browser. A rating counts while its author is still in the contest, so
removing someone deletes their ratings for it, which is also what takes
them out of the average.

## Getting it running

Node 20+ (I developed on 24), Postgres 14+ (I used 17), npm. Argon2 comes as
a prebuilt binding so you don't need a compiler on most platforms.

```bash
npm install
cp .env.example .env   # fill it in, see below
npm run db:migrate
npm run db:seed
npm run dev
```

App's at <http://localhost:3000>.

| Script | Does what |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build (runs `prisma generate` first) |
| `npm start` | serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | create + apply a migration |
| `npm run db:deploy` | apply existing migrations (production) |
| `npm run db:seed` | bootstrap admin, plus demo data if enabled |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | drop, re-migrate, re-seed |
| `npm run test:acceptance` | end-to-end test against a running server |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | key for session-token digests, 32+ chars |
| `INITIAL_ADMIN_NAME` | display name of the bootstrap super admin |
| `INITIAL_ADMIN_EMAIL` | its email |
| `INITIAL_ADMIN_PASSWORD` | its password. Hashed before it's stored, never logged |
| `SEED_DEMO_DATA` | `"true"` to also create demo users/contest/problems/votes |

Generate `AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Everything is validated on boot, so a bad config fails loudly at startup
instead of failing weirdly mid-request. `.env` is git-ignored, don't commit
real credentials.

## Database

```sql
CREATE DATABASE olympiad;
```

```bash
npm run db:migrate      # dev: create + apply migrations
npm run db:deploy       # prod: apply existing migrations only
```

Some of the rules live at the database level, not just in application code:

- `UNIQUE(userId, problemId)` on votes, so a duplicate can't exist
- `CHECK` constraints keeping ratings in 1..10 and weights in 0.01..100
- a `CHECK` that voting permission implies view permission
- cascading foreign keys, indexes on the columns that actually get filtered

This machine doesn't have Docker or a system Postgres, so local dev runs
against a portable Postgres 17 living outside the repo at
`~/.olympiad-postgres`:

```powershell
./scripts/local-postgres.ps1 start
./scripts/local-postgres.ps1 status
./scripts/local-postgres.ps1 stop
./scripts/local-postgres.ps1 psql
```

Set `OLYMPIAD_PG_HOME` to move it. Any other Postgres works fine too, just
point `DATABASE_URL` at it and ignore the script.

## Bootstrapping the first admin

The first admin doesn't go through registration/approval. It's created
straight from env vars by the seed script:

```bash
INITIAL_ADMIN_EMAIL=... INITIAL_ADMIN_PASSWORD=... npm run db:seed
```

Comes out already `APPROVED` with role `SUPER_ADMIN`. The password is
hashed before it touches the database, so there's no plaintext password
anywhere in source. Running the seed again just updates that same account,
which doubles as how you rotate the bootstrap password. Change it after
your first real sign-in.

## Seed / demo data

With `SEED_DEMO_DATA="true"` the seed also builds out a working example:

- nine demo accounts (two pending approval, one suspended)
- **IMO Selection 2026**, open, 8 problems, 6 members with mixed weights
  from 0.5 to 2.0, partially rated so the progress views have something to
  show
- **National Olympiad 2025, Final Round**, closed, results final, same
  person with a different weight than above (proves weights are per-contest)
- **Winter Training Camp 2026**, a draft, visible only to admins

The demo accounts are obviously fake:

| Account | Role |
| --- | --- |
| `ahmed@example.test` | voter, weight 1.5 |
| `ali@example.test` | has access, can't vote |
| `karim@example.test` | admin |
| `nadia@example.test` | pending approval |

Password for all of them: `Olympiad2026!demo`.

## Tests

`scripts/acceptance.ts` hits a running server over real HTTP, same as a
browser would: real cookies, real sessions, real database. It walks through
the whole thing in 20 steps, register, approve, create a contest and
problems, set per-contest permissions and weights, vote, change a vote,
check blind-voting privacy, check the weighted result, check individual
ratings, change a weight, remove someone from a contest, close it. About 70
conditions get checked along the way, including the ones that actually
matter:

- changing a rating updates the existing row, doesn't insert a second one
- a member gets refused the results / access list / individual votes at the
  API level, not just hidden in the UI
- private notes and other voters' names never show up in a member's response
- the weighted average actually differs from the unweighted one, and moves
  when a weight changes
- removing someone from a contest deletes their ratings for it and nothing
  else

```bash
npm run dev              # terminal 1
npm run test:acceptance  # terminal 2
```

Cleans up everything it creates.

## Deploying

```bash
npm run build
npm start
```

1. Provision Postgres, set `DATABASE_URL`.
2. Set a fresh `AUTH_SECRET` (32+ chars). Rotating it logs everyone out.
3. Set `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`, leave
   `SEED_DEMO_DATA` unset.
4. `npm run db:deploy`, then `npm run db:seed` once to create the admin.
5. Serve over HTTPS. Cookies get `Secure` automatically when
   `NODE_ENV=production`.
6. Sign in as the super admin and change the bootstrap password.

Rate limiting is in-process right now, which is fine for a single instance.
If this ever runs on more than one, the counters in `src/lib/rate-limit.ts`
need to move to a shared store. Every call site already goes through
`enforceRateLimit`, so that's a contained change. Argon2 is a native module
so it's kept out of the bundle (`serverExternalPackages`) and needs a real
Node runtime, not an edge one.

This deployment is private and isn't linked publicly anywhere. `robots.txt`
and page metadata both tell crawlers to stay out, on top of login being
required for basically everything. The hosting itself (where it runs, the
domain) isn't something shared outside the team using it.

## Security

Passwords are Argon2id at roughly the OWASP-recommended parameters
(m = 19 MiB, t = 2, p = 1). A login attempt for an email that doesn't exist
still pays for a hash, so the response timing doesn't leak whether the
account is real, and both failure cases return the same message.

Sessions are random opaque tokens in `HttpOnly`, `SameSite=Lax` cookies
(`Secure` in production). Only an HMAC digest of the token sits in the
database, so a DB leak on its own can't be replayed as a login. Suspending
or deleting an account kills its sessions immediately; no waiting for the
cookie to expire.

Authorization always happens server-side. Hiding a link in the UI is never
treated as a control. The admin area returns `404` to a member instead of
`403`, so its existence isn't confirmed to someone who shouldn't be poking
around, and you can't enumerate contest ids by watching which ones 403 vs 404.

Blind voting is enforced in the query, not the view. Member-facing code
paths never select `privateNotes`, never join other voters' rows, never
read weights. `GET /api/admin/results` and the access list just refuse a
member outright, so the data doesn't reach the browser in the first place.

LaTeX never executes anything. KaTeX runs with `trust: false` so `\href`,
`\url`, `\includegraphics` are inert, and anything non-math is HTML-escaped
before it hits the DOM. CSP, `X-Frame-Options: DENY`, `nosniff`, a strict
referrer policy: all applied as defense in depth, since the real control is
upstream of any of that.

Input gets validated with the same Zod schemas on the client (for fast
feedback) and the server (the actual gate), then checked again by Postgres
`CHECK` constraints.

Errors don't leak internals. Only errors thrown on purpose get their message
shown to the user. Anything unexpected, including Prisma errors that might
carry table/column names, gets logged server-side and replaced with a
generic message before it goes out.

## Folder layout

```text
prisma/
  schema.prisma            models, enums, indexes, constraints
  migrations/               versioned SQL, including the CHECK constraints
  seed.ts                   bootstrap admin + optional demo content
  seed-problems.ts          demo problem bank

scripts/
  acceptance.ts             end-to-end test
  local-postgres.ps1        start/stop the local dev database

src/
  app/
    (auth)/                 login, register
    (app)/                  dashboard, contests, reading/rating problems
    admin/                  users, admins, contests, audit log, settings
    api/                    auth, votes, admin endpoints
    pending/                waiting-for-approval screen
  components/
    ui/                      shadcn/ui primitives
    shared/                  header, brand, empty/confirm states
    math/                    the statement renderer
    voting/                  rating scale + autosaving panel
    admin/                   tables, editors, permission controls
  lib/
    auth/  permissions/  services/  calculations/  validation/  math/  client/
```
