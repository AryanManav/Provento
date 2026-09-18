# Manual test: the evaluation loop

Walks the full product loop end to end:

`post → apply → select → submit work → review → feedback → outcome`

Nothing in this loop is covered by automated tests — Vitest only exercises zod schemas, and no
test touches Supabase. This walkthrough is the only thing that proves the endpoints work, so run
it after any change to `src/lib/actions/evaluation.ts`, `src/lib/data/trial.ts`,
`src/lib/data/evaluation.ts`, or the project status flow.

Budget about 45 minutes.

---

## Prerequisites

### 1. Apply every migration, in order

```
20260914000000_initial_schema.sql
20260914000001_fix_auth_trigger.sql
20260914000002_candidate_visibility.sql
20260914000003_candidate_activity.sql
20260917000000_company_bootstrap.sql
20260918000000_evaluation_uniqueness.sql
20260919000000_protect_user_accounts.sql
20260919000001_profile_media.sql
20260919000002_oauth_signup_roles.sql
20260920000000_application_loop.sql
```

Two of these block the run if skipped:

- **`20260917000000_company_bootstrap.sql`** creates `create_company_with_owner`. Without it,
  step 1 fails and nothing downstream is reachable — RLS cannot insert the first company-owner
  row on its own.
- **`20260918000000_evaluation_uniqueness.sql`** is what step 10 tests.

Confirm both landed:

```sql
select proname from pg_proc where proname = 'create_company_with_owner';

select conname from pg_constraint
where conname in ('project_feedback_project_id_key', 'project_outcomes_project_id_key');
```

Expect one row from the first query and two from the second.

### 2. Check the environment points at a real project

`.env.example` ships a mock Supabase URL. Confirm `.env.local` was actually filled in and is not
still pointing at the placeholder:

```bash
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

### 3. Two accounts, two browser profiles

The loop alternates between company and candidate about six times. Use two browser profiles (or
one normal plus one private window) rather than signing in and out — signing out repeatedly is
where most of the 45 minutes goes otherwise.

| Role      | Signup URL               |
| --------- | ------------------------ |
| Company   | `/signup?role=company`   |
| Candidate | `/signup?role=candidate` |

Then start the app:

```bash
npm run dev
```

---

## Walkthrough

Each step lists what to do and what must be true in the database afterwards. Several steps look
fine in the UI whether or not the write succeeded, so check the SQL where it is given.

### 1 — Company profile (exercises the SECURITY DEFINER bootstrap)

As **company**: sign up, then complete `/company/profile`.

```sql
select c.id, c.name, m.role
from companies c
join company_members m on m.company_id = c.id
order by c.created_at desc limit 1;
```

Expect one row with `role = 'owner'`. If the company saved but no member row exists, the RPC did
not run and the migration is missing.

### 2 — Create a project

As **company**: `/company/projects/create`. Fill every field, including requirements,
deliverables, acceptance criteria and evaluation criteria (one per line).

> **Note the time this takes and where the form is unclear.** This step is the live test of
> whether a hiring manager can actually author a scoped, evaluable project. If it is slow or
> confusing here, it will be worse on a real call. Write down what you stumbled on — it is a
> product finding, not a testing detail.

Expect a redirect to `/company/projects?created=1` and status `applications_open`.

### 3 — Project is publicly visible

Signed out, or as **candidate**: the project appears on `/projects` and its `/projects/[slug]`
page renders the brief.

### 4 — Candidate applies

As **candidate**: sign up, complete `/candidate/profile`, then apply from `/projects/[slug]`.
It appears on `/candidate/applications`.

### 5 — Company selects the candidate

As **company**: `/company/projects/[id]` → set the applicant's status to **selected**.

```sql
select p.status as project_status, s.status as selection_status
from projects p
join project_selections s on s.project_id = p.id
where p.id = '<project-id>';
```

Expect `project_status = 'candidate_selected'` and `selection_status = 'active'`. **This row is
the handoff** — without it the candidate never sees a trial, and everything after this fails.

### 6 — Candidate sees the trial

As **candidate**:

- `/candidate/trials` lists the project.
- `/candidate/trials/[id]` renders the full brief, including the evaluation criteria.
- On `/candidate/applications`, the **Go to Project Workspace** button reaches that same page.
  (This button pointed at a dead route before the loop was built — confirm it resolves.)

### 7 — Candidate submits work

As **candidate**: submit a repository URL and notes from `/candidate/trials/[id]`.

```sql
select status from projects where id = '<project-id>';

select activity_type, activity_date
from candidate_activity
where candidate_id = '<candidate-id>' and activity_type = 'project_submission';
```

Expect project status `submitted`, and **one `project_submission` activity row**.

> The activity row is the regression test for a bug where an activity type that violated the
> table's CHECK constraint was written with its error unchecked — the submission succeeded while
> the streak row was silently dropped. If this query returns nothing, that class of bug is back.

### 8 — Revision round trip

As **company**: `/company/projects/[id]/review`.

1. Choose **Request revision** → project status becomes `revision_requested`.
2. As **candidate**: the workspace allows a resubmission; submit again. Both submissions are
   listed, newest first.
3. As **company**: choose **Accept** → project status becomes `completed`.

### 9 — Record feedback

As **company**, still on the review page.

Confirm **the evaluation criteria you typed in step 2 are displayed back to you** above the form.
Grading against your own criteria rather than a generic rubric is the point of the screen.

Fill it in and save.

### 10 — Double-submit guard

Submit the feedback form **twice** (browser back, then save again).

```sql
select count(*) from project_feedback where project_id = '<project-id>';
```

Expect exactly **1**. More than one means `20260918000000_evaluation_uniqueness.sql` was not
applied — and the review page will then silently show a blank form instead of the saved
evaluation.

### 11 — Record the outcome

As **company**: record the outcome, including the internal notes field. Run this at least once
with **no_hire** and confirm the UI treats it as a legitimate result rather than a failure state.

```sql
select outcome, reason, notes from project_outcomes where project_id = '<project-id>';
```

### 12 — The payoff

As **candidate**: open `/candidate/profile`.

**The feedback from step 9 must appear in "Verified Work History".**

This is the real pass/fail for the whole run. That card reads `project_feedback`, which until now
had no write path anywhere in the app, so it has never rendered real data. If it stays empty here,
the evaluation data is not reaching the candidate's record — and the entire "proof through real
work" thesis is not actually wired, whatever else passed.

---

## Application loop additions

Run these alongside the walkthrough above, at the step noted.

### A — New-applicant alerts (after step 4)

As **company**: the dashboard's "Awaiting review" card and the project's row on
`/company/projects` both show the new application. They clear once you set any status.

### B — Review the full profile before selecting (step 5)

As **company**: on `/company/projects/[id]`, click **View full profile** on the applicant. The page
shows the cover message, then the candidate's profile, skills, projects and verified history — with
no edit or upload controls. Select the candidate from this page; you should land back on it with a
confirmation.

Try the URL with another project's id in place of `[id]`: it must 404.

### C — Clarification thread (between steps 6 and 7)

As **candidate**, ask a question in the workspace's Clarifications panel. As **company**, answer it on
the review page, then ask one back. As **candidate**, reply.

The review page's candidate card should now read "Replied to 1 of your messages · median response …".

```sql
select author_role, created_at from project_messages where project_id = '<project-id>' order by created_at;
```

Timestamps are set by the database; there is no way to edit or delete a message.

### D — Files with a submission (step 7)

As **candidate**: attach a PDF and a `.zip` before submitting. Try an `.html` file — it must be
refused before upload. Both files appear under the submission for the candidate and on the company
review page, with **Download** links.

```sql
select s.status as project_status, a.file_name, a.storage_path
from submission_attachments a
join project_submissions ps on ps.id = a.submission_id
join projects s on s.id = ps.project_id
where ps.project_id = '<project-id>';
```

`project_status` must be `submitted`. Before this migration it silently stayed at
`candidate_selected`, because candidates cannot update projects — a trigger now does it.

### E — Withdrawing

As a **second candidate**, apply to the same project, then **Withdraw application** on
`/candidate/applications`. The badge reads Withdrawn, and the company sees "The candidate withdrew
this application" instead of a status control.

The selected candidate has no withdraw button, and calling the function directly must fail:

```sql
-- run as that candidate via the app, or expect: "This application can no longer be withdrawn"
```

### F — Account privacy

In the SQL editor, impersonate the candidate inside a transaction that is rolled back, so nothing
changes:

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub": "<candidate-user-id>", "role": "authenticated"}';
select email from public.users;
rollback;
```

It must return exactly one row — the candidate's own. Before this migration it returned every
account. Repeat with the company's user id: it should see its own row plus only the candidates who
applied to its projects.

## Authorization checks

Quick, but these are the ones that matter before anything is shared.

| Check                                                                               | Expected                                  |
| ----------------------------------------------------------------------------------- | ----------------------------------------- |
| A second company account opens the first company's `/company/projects/[id]/review`  | 404 — not an empty page, not a blank form |
| A second company account opens `/company/projects/[id]`                             | 404                                       |
| A candidate opens `/candidate/trials/[id]` for a project they were not selected for | 404                                       |
| A candidate opens `/company/projects`                                               | Redirected away                           |

A blank or partially rendered page instead of a 404 means the ownership check ran too late to
protect the data.

---

## Results

| #   | Step                                   | Pass | Notes                          |
| --- | -------------------------------------- | ---- | ------------------------------ |
| 1   | Company profile + owner row            |      |                                |
| 2   | Create project                         |      | Time taken / confusing fields: |
| 3   | Public listing                         |      |                                |
| 4   | Candidate applies                      |      |                                |
| 5   | Selection creates `project_selections` |      |                                |
| 6   | Trial workspace reachable              |      |                                |
| 7   | Submission + activity row              |      |                                |
| 8   | Revision round trip                    |      |                                |
| 9   | Feedback shows own criteria            |      |                                |
| 10  | Double-submit guarded                  |      |                                |
| 11  | Outcome recorded                       |      |                                |
| 12  | **Feedback on candidate profile**      |      |                                |
| A   | Cross-company 404s                     |      |                                |
| B   | Non-selected candidate 404             |      |                                |

Anything that fails goes on a punch list with its step number — do not fix mid-run, or you lose
track of what the rest of the loop does.

## Notifications

Migration `20260921000000_notifications.sql` must be applied. Keep the company and
candidate profiles side by side.

- [ ] **G1 — New applicant.** Candidate applies. Within ~30 s (or on focus) the company's
      bell shows a red count, "Evaluation Projects" in the sidebar shows a badge, the project
      card on `/company/projects` has a blue edge, an "N updates" pill and the latest event,
      and "What's new" on the dashboard lists it.
- [ ] **G2 — Seen clears it.** Company opens the applicant's profile → the bell and sidebar
      badge drop straight away; the project card is plain on the next visit.
- [ ] **G3 — Status change.** Company shortlists → candidate's bell and "My Applications"
      badge light up; the application card is outlined with "Updated". Opening
      My Applications clears the badge.
- [ ] **G4 — Selected.** Company selects → candidate gets "You were selected", linking to the
      workspace; "Trial Projects" is badged until the workspace is opened.
- [ ] **G5 — Messages both ways.** Candidate asks a question → the company's project page
      shows a "new on the evaluation page" banner and a count on "Evaluate delivered work".
      Company replies → candidate is alerted with the message text.
- [ ] **G6 — Submission and decisions.** Candidate submits → company alerted. Company requests
      a revision, then records feedback and an outcome → one alert each for the candidate.
- [ ] **G7 — Mark all read** in the bell clears every badge.
- [ ] **G8 — No forging.** In the browser console as any user:
      `await supabase.from('notifications').insert({...})` fails, and
      `update({ title: 'x' })` on your own row fails; `update({ read: true })` succeeds.
