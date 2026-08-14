-- ============================================================================
-- 20260814140000_sso_consumer.sql
--
-- Work-Sync becomes an SSO consumer of RMPL (the fleet identity provider).
-- ============================================================================

-- Single-use replay guard for handoff codes issued by RMPL's sso-issue-code.
-- Each code carries a jti; sso-exchange inserts it here before honoring the
-- code, so a captured/replayed code can never be redeemed twice.
CREATE TABLE IF NOT EXISTS public.sso_issued_codes (
  jti      TEXT PRIMARY KEY,
  used_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sso_issued_codes ENABLE ROW LEVEL SECURITY;
-- No policies — service role only (sso-exchange), never exposed to the client API.

-- Self-healing manager queue: profiles.reports_to is a real FK to another
-- profiles row, so it can only be set once the manager has a profile here
-- too. When a new SSO arrival's manager hasn't logged into Work-Sync yet,
-- park the link here; it's resolved the moment the manager's own first
-- SSO login creates their profile.
CREATE TABLE IF NOT EXISTS public.sso_pending_reports_to (
  user_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_email TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sso_pending_reports_to ENABLE ROW LEVEL SECURITY;
-- No policies — service role only.

-- Dedicated org for RMPL employees arriving via SSO, separate from the
-- seeded "In-Sync Demo" org. plan='business' so the trial-expiry gate never
-- applies to it (organizations_plan_check only allows trial/team/business).
INSERT INTO public.organizations (name, plan, trial_ends_at)
SELECT 'Redefine Marcom', 'business', now() + interval '100 years'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Redefine Marcom');
