-- Candidate data is private by default. A company can inspect it only for a
-- candidate who applied to one of that company's projects.

DROP POLICY IF EXISTS "Candidate profiles viewable by authenticated users" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Candidates and applicant companies can view profiles" ON public.candidate_profiles;
CREATE POLICY "Candidates and applicant companies can view profiles"
  ON public.candidate_profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.candidate_id = candidate_profiles.id
        AND public.is_company_member(p.company_id)
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "Candidate skills viewable by authenticated users" ON public.candidate_skills;
DROP POLICY IF EXISTS "Candidates and applicant companies can view skills" ON public.candidate_skills;
CREATE POLICY "Candidates and applicant companies can view skills"
  ON public.candidate_skills FOR SELECT TO authenticated
  USING (
    candidate_id = public.get_current_candidate_id() OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.candidate_id = candidate_skills.candidate_id
        AND public.is_company_member(p.company_id)
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "Candidate projects viewable by authenticated users" ON public.candidate_projects;
DROP POLICY IF EXISTS "Candidates and applicant companies can view portfolios" ON public.candidate_projects;
CREATE POLICY "Candidates and applicant companies can view portfolios"
  ON public.candidate_projects FOR SELECT TO authenticated
  USING (
    candidate_id = public.get_current_candidate_id() OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.candidate_id = candidate_projects.candidate_id
        AND public.is_company_member(p.company_id)
    ) OR public.is_admin()
  );
