-- People who work in an organisation are everyone with a role there, not only
-- those whose *active* organisation (profiles.org_id) happens to be it. A user
-- who belongs to several organisations (e.g. the platform admin) switches
-- profiles.org_id as they move between them, and used to vanish from every
-- other organisation's assignee lists while switched away.

CREATE OR REPLACE FUNCTION public.is_member_of_active_org(p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p_user
      AND ur.org_id = auth_user_org_id()
      AND ur.is_active = true
  );
$$;

-- Lets a user read the profile of anyone who is a member of their active org
-- (names on tasks, assignee pickers), regardless of that person's own active org.
DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;
CREATE POLICY "Users can view profiles in their org" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR (org_id IS NOT NULL AND org_id = auth_user_org_id())
    OR is_member_of_active_org(id)
    OR is_platform_admin()
  );

-- Active members of the caller's active organisation, optionally filtered by
-- name/email, paged.
CREATE OR REPLACE FUNCTION public.org_members(
  p_term text DEFAULT NULL,
  p_limit int DEFAULT 1000,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.profiles
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM profiles p
  WHERE p.is_active = true
    AND (p.org_id = auth_user_org_id() OR is_member_of_active_org(p.id))
    AND (
      p_term IS NULL OR p_term = ''
      OR p.full_name ILIKE '%' || replace(replace(replace(p_term, '\', '\'), '%', '\%'), '_', '\_') || '%'
      OR p.email ILIKE '%' || replace(replace(replace(p_term, '\', '\'), '%', '\%'), '_', '\_') || '%'
    )
  ORDER BY p.full_name, p.id
  LIMIT LEAST(COALESCE(p_limit, 1000), 1000) OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.org_members(text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_members(text, int, int) TO authenticated;
REVOKE ALL ON FUNCTION public.is_member_of_active_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_active_org(uuid) TO authenticated;
