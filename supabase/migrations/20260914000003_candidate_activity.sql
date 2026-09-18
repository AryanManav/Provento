CREATE TABLE IF NOT EXISTS public.candidate_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('profile_updated', 'skill_added', 'portfolio_updated', 'application_submitted', 'github_connected', 'project_milestone', 'project_submission')),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(candidate_id, activity_type, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_candidate_activity_calendar ON public.candidate_activity(candidate_id, activity_date DESC);
ALTER TABLE public.candidate_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can view own activity" ON public.candidate_activity;
CREATE POLICY "Candidates can view own activity" ON public.candidate_activity
  FOR SELECT TO authenticated USING (candidate_id = public.get_current_candidate_id());
DROP POLICY IF EXISTS "Candidates can create own activity" ON public.candidate_activity;
CREATE POLICY "Candidates can create own activity" ON public.candidate_activity
  FOR INSERT TO authenticated WITH CHECK (candidate_id = public.get_current_candidate_id());
