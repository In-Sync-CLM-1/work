-- ============================================================
-- Belonging to more than one organisation
-- ============================================================
-- Membership already lives in user_roles (user_id, org_id, role), which can
-- hold a row per organisation. What was missing is a safe way to say "this is
-- the one I am working in right now": profiles.org_id is what every RLS policy
-- reads, and users can no longer write it directly (see the previous
-- migration, which closed exactly that hole).
--
-- set_active_org() is the sanctioned route. It switches the active
-- organisation only to one the caller actually belongs to, so multi-org
-- membership is possible without reopening the tenant boundary.
-- ============================================================

CREATE OR REPLACE FUNCTION set_active_org(p_org_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  -- Membership is the whole check. Platform admins are not exempt: if they
  -- want to work inside an organisation they join it like anyone else, which
  -- keeps "what can this session touch" answerable from one table.
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
     WHERE user_id = v_uid
       AND org_id = p_org_id
       AND is_active
  ) THEN
    RAISE EXCEPTION 'You are not a member of that organisation';
  END IF;

  UPDATE profiles SET org_id = p_org_id WHERE id = v_uid;
  RETURN p_org_id;
END;
$$;

REVOKE ALL ON FUNCTION set_active_org(uuid) FROM public;
GRANT EXECUTE ON FUNCTION set_active_org(uuid) TO authenticated;

-- ------------------------------------------------------------
-- Amit belongs to every organisation
-- ------------------------------------------------------------
-- He is platform admin AND a working member of each org — the platform role
-- alone left him with no organisation at all, so arriving from another app
-- dropped him on the platform console instead of the workspace he came for.
-- Guarded and idempotent.
DO $$
DECLARE
  v_uid uuid;
  v_org record;
  v_landing uuid;
BEGIN
  SELECT id INTO v_uid FROM profiles WHERE lower(email) = 'a@in-sync.co.in';
  IF v_uid IS NULL THEN
    RAISE NOTICE 'a@in-sync.co.in not present — skipping membership seed';
    RETURN;
  END IF;

  FOR v_org IN SELECT id, name FROM organizations LOOP
    INSERT INTO user_roles (user_id, org_id, role, is_active)
    SELECT v_uid, v_org.id, 'admin', true
     WHERE NOT EXISTS (
       SELECT 1 FROM user_roles
        WHERE user_id = v_uid AND org_id = v_org.id
     );
  END LOOP;

  -- Land him in Redefine Marcom, which is where the RMPL button comes from.
  SELECT id INTO v_landing FROM organizations WHERE name = 'Redefine Marcom';
  IF v_landing IS NOT NULL THEN
    UPDATE profiles SET org_id = COALESCE(org_id, v_landing) WHERE id = v_uid;
  END IF;
END $$;
