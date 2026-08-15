-- ============================================================
-- Close a cross-tenant hole in profiles
-- ============================================================
-- Every table's row-level security keys off auth_user_org_id(), which reads
-- profiles.org_id for the signed-in user. The "Users can update their own
-- profile" policy allowed a user to update ANY column of their own row —
-- including org_id — so an ordinary employee could point their profile at
-- another organisation and immediately read and write its data.
--
-- Proven against production inside a rolled-back transaction, acting as a
-- real Redefine Marcom analyst:
--
--   In-Sync Demo tasks visible BEFORE : 0
--   changing my own org_id            : ALLOWED
--   In-Sync Demo tasks visible AFTER  : 27
--
-- An RLS policy cannot restrict which columns an update touches — WITH CHECK
-- sees only the new row, so it cannot tell that org_id changed. Column
-- privileges can, and they are enforced ahead of any policy.
--
-- Note that revoking individual columns is not enough on its own: these roles
-- hold a TABLE-level UPDATE grant (the Supabase default), which permits every
-- column regardless of column-level revokes. The table grant has to go first,
-- then the safe columns are granted back explicitly.
--
-- No legitimate client path writes the withheld columns. Organisation
-- assignment, roles, designation and reporting line all go through the
-- manage-user edge function under the service role, which these grants do not
-- affect.
-- ============================================================

-- anon has no business writing a profile at all.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;

REVOKE UPDATE ON public.profiles FROM authenticated;

-- Granted back: the fields a person edits about themselves, plus is_active,
-- which org admins toggle from the Users page.
-- Deliberately withheld: org_id, is_platform_admin, designation_id,
-- department, reports_to, id, email, created_at.
GRANT UPDATE (
  full_name,
  first_name,
  last_name,
  phone,
  avatar_url,
  is_active,
  onboarding_completed,
  updated_at
) ON public.profiles TO authenticated;

-- ============================================================
-- Drop a redundant, fully permissive read policy on user_roles
-- ============================================================
-- "Authenticated users can read user roles" was USING (true) — every signed-in
-- user could read every role row in every organisation, i.e. the whole
-- customer list and who works where. The narrower "Users can view roles"
-- policy (own row, own org, or platform admin) already covers every real use,
-- and RLS ORs policies together, so the permissive one silently defeated it.
DROP POLICY IF EXISTS "Authenticated users can read user roles" ON public.user_roles;
