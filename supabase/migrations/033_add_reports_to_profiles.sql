-- ============================================================================
-- 033_add_reports_to_profiles.sql
-- Per-user direct manager (display only; not yet wired into alert/escalation chain)
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- A user cannot report to themselves
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_reports_to_not_self;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_reports_to_not_self CHECK (reports_to IS NULL OR reports_to <> id);

CREATE INDEX IF NOT EXISTS profiles_reports_to_idx ON public.profiles(reports_to);
