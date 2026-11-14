-- The owner (a@in-sync.co.in) is an admin in every organisation
-- (20260815210000_multi_org_membership.sql), but that seed only covered the
-- organisations that existed then. Organisations created later had no owner
-- membership, so tasks could not be opened inside them.
-- 1) Add the missing memberships now. 2) Add the owner to every new organisation.

CREATE OR REPLACE FUNCTION add_owner_to_org(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM profiles WHERE lower(email) = 'a@in-sync.co.in';
  IF v_uid IS NULL THEN
    RETURN;
  END IF;
  -- An organisation that already has its 5 admins (check_admin_limit) is
  -- skipped with a notice rather than failing the organisation insert.
  BEGIN
    INSERT INTO user_roles (user_id, org_id, role, is_active)
    SELECT v_uid, p_org_id, 'admin', true
     WHERE NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = v_uid AND org_id = p_org_id
     );
  EXCEPTION WHEN raise_exception THEN
    RAISE NOTICE 'owner not added to org %: %', p_org_id, SQLERRM;
  END;
END;
$$;

REVOKE ALL ON FUNCTION add_owner_to_org(uuid) FROM public;

CREATE OR REPLACE FUNCTION trg_add_owner_to_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_owner_to_org(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS add_owner_to_new_org ON organizations;
CREATE TRIGGER add_owner_to_new_org
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION trg_add_owner_to_new_org();

DO $$
DECLARE
  v_org record;
BEGIN
  FOR v_org IN SELECT id FROM organizations LOOP
    PERFORM add_owner_to_org(v_org.id);
  END LOOP;
END;
$$;
