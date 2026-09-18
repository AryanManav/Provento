# Architecture

Notes on how the codebase is put together and the rules that keep it safe. Read this
before adding a feature.

## Principles

- **Evidence over opinion.** The schema records what can be observed — submissions,
  revisions, response times, deadlines met, outcomes — not numeric scores. Evaluations
  use coarse quality bands; see `QUALITY_LEVELS` in `src/lib/constants`.
- **The database enforces access.** Row-level security decides who can read and write
  what; the app never relies on hiding a button.
- **Deliberately not built yet:** payments (the `payments` table exists, pilots are
  settled manually), email/push notifications, candidate–project matching,
  subscriptions.

## Layer rules

Dependencies point one direction: `app/` → `components/` → `lib/`. Nothing in `lib/` or
`components/` may import from `app/`.

| Directory                         | Holds                                           | Rule                                               |
| --------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `src/app/**`                      | Routes, layouts, thin pages                     | Pages compose; they do not query Supabase directly |
| `src/lib/data/**`                 | Read queries, one module per domain             | Returns view models, never raw rows                |
| `src/lib/actions/**`              | `"use server"` mutations, one module per domain | Validates with zod, then writes                    |
| `src/lib/validations/**`          | zod schemas, one file per domain                | `index.ts` is re-exports only                      |
| `src/lib/types/domain.ts`         | View models the UI consumes                     | camelCase                                          |
| `src/lib/types/database.types.ts` | Mirror of the SQL schema                        | snake_case, regenerate on migration                |
| `src/lib/constants/**`            | Shared enums, role→route maps                   | No magic strings in routes or actions              |
| `src/components/ui/**`            | Primitives                                      | No data fetching                                   |

### Naming boundary

The database is snake_case; everything above `src/lib/data` is camelCase. `src/lib/data`
is the only place the two meet — it maps raw rows into `src/lib/types/domain.ts` types.

Supabase cannot infer nested-select types here (`Relationships` are mostly empty), so
each data module declares a local `Raw*` interface and casts the query result **once**.
Never let an untyped join result reach a component; `@typescript-eslint/no-explicit-any`
is an error outside tests.

### Adding a feature

1. Migration in `supabase/migrations/`, then update `database.types.ts`.
2. View model in `types/domain.ts`.
3. Read functions in `lib/data/<domain>.ts`; mutations in `lib/actions/<domain>.ts`.
4. Page in `app/` that only composes those.

## Notifications

Every notification row is written by a database trigger
(`supabase/migrations/20260921000000_notifications.sql`). Users can only read their own
rows and mark them read. To alert on a new kind of event, add a trigger there rather
than inserting from application code.

## Security model

- **Use the request-scoped client** (`lib/supabase/server.ts`) for everything reachable
  from a request. It carries the user's session, so RLS applies.
- **`createAdminClient()` bypasses RLS entirely.** It is currently used only in the
  signup backfill in `lib/actions/auth.ts`. Do not add new call sites — if RLS cannot
  express an operation, add a `SECURITY DEFINER` function instead, as
  `create_company_with_owner` does for the first company-owner row (RLS cannot allow it
  because membership does not exist yet).
- **Admins are only ever granted by hand** (SQL editor or service role). The
  `protect_user_account_fields` trigger stops end-user sessions changing `users.role`,
  `email`, `email_verified` or `id`, and `handle_new_user` never reads `admin` from
  sign-up metadata — that metadata is whatever the client sent. The one sanctioned
  self-service role change is `claim_signup_role`, for a brand-new OAuth account.
- `user_metadata` is writable by the user. Resolve roles with `resolveUserRole` in
  `lib/constants`: the database wins, and metadata alone can only mean candidate or
  company.
- Migrations are applied by hand in the Supabase SQL editor, so every migration must be
  safe to re-run (`IF NOT EXISTS`, `OR REPLACE`, `DROP … IF EXISTS` before `CREATE`).
- Every action re-checks authorization server-side via `lib/auth/guards.ts`. Middleware
  redirects are UX, not a security boundary.
- Scope company reads by `company_id`. RLS makes published projects readable by everyone,
  so an unscoped query leaks other companies' rows into company-facing screens.
- Any redirect target taken from a query string must be validated as a same-origin path
  (must start with `/`, must not start with `//`). See `safeRedirectTarget` in
  `lib/actions/auth.ts` and `safeNext` in `app/auth/callback/route.ts`.

## Conventions

- Server actions taking `(prevState, formData)` return `ActionResponse` from
  `lib/types/actions.ts` and are driven by `useActionState`.
- Plain `<form action={...}>` posts (the company screens) have no client state, so they
  surface failures by redirecting with an `?error=` param.
- Prettier owns formatting — never hand-format, and never collapse JSX onto one line.
