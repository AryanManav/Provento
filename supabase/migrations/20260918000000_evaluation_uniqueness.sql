-- One evaluation and one outcome per project.
--
-- Both tables are read with .maybeSingle(), which errors once a project has more
-- than one row. Without these constraints a double-submitted form silently
-- creates duplicates, and the review screen then falls back to rendering a blank
-- form again — inviting yet another row.
--
-- Written as DO blocks so the migration stays idempotent, matching the rest of
-- supabase/migrations.

DO $$ BEGIN
    ALTER TABLE public.project_feedback
        ADD CONSTRAINT project_feedback_project_id_key UNIQUE (project_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.project_outcomes
        ADD CONSTRAINT project_outcomes_project_id_key UNIQUE (project_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;
