# Provento

Hire junior engineers on the strength of real work, not résumés.

A startup posts a short, paid evaluation project. Candidates apply, the startup picks one,
and that candidate builds it in their own repository — asking questions along the way.
The startup reviews what was actually delivered, gives structured feedback and records
an outcome. Every completed project becomes verified proof on the candidate's profile.

```
post → apply → select → build → submit → review → feedback → outcome
```

## What's in it

**For startups**

- Publish evaluation projects with requirements, deliverables and acceptance criteria
- Review applicants with their full profile, skills, projects and verified history
- A clarification thread with the selected candidate, including their response times
- Review submissions (repository, deployment, attached files), request revisions,
  record feedback and a hiring outcome

**For candidates**

- A profile with skills, featured projects, banner and avatar, and a verified GitHub link
- Apply with a cover message, track every application, withdraw before selection
- A workspace per project: the brief, the thread, and a submission form with file uploads

**For both**

- Google and GitHub sign-in
- In-app notifications: a bell, badges in the navigation and highlighted cards when
  something changes

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres,
Auth, Storage, row-level security) · zod · Vitest

## Getting started

Requires Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Apply the SQL files in `supabase/migrations/` to your database in order (Supabase
dashboard → SQL Editor). Each one is safe to run more than once.

Open http://localhost:3000.

## Scripts

| Command          | What it does                                 |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Start the dev server                         |
| `npm run verify` | Format check, lint, typecheck and unit tests |
| `npm run build`  | Production build                             |
| `npm run format` | Format everything with Prettier              |

## Project layout

```
src/
  app/              routes — (public), (auth), (candidate), (company), (admin), api
  components/       ui primitives, layout, and feature components
  lib/
    data/           read queries, one module per domain
    actions/        server actions (mutations)
    validations/    zod schemas
    types/          database mirror and view models
    constants/      shared enums and route maps
  tests/            Vitest unit tests
supabase/migrations SQL schema, policies, functions and triggers
docs/               architecture notes and the manual test checklist
```

See [docs/architecture.md](docs/architecture.md) for how the layers fit together and
the security model, and [docs/manual-testing.md](docs/manual-testing.md) for the
end-to-end test run.

## Deployment

Deployed on Vercel from the `master` branch; every push triggers a new build. Set the
environment variables from `.env.example` in the Vercel project, and add the deployed
URL to Supabase → Authentication → URL Configuration (Site URL and
`<url>/auth/callback` as a redirect URL).

Database changes are not deployed automatically — run new migrations in Supabase
before pushing code that depends on them.
