-- ============================================================================
-- 028_platform_admin_org_delete.sql
-- Allow platform_admin to DELETE/UPDATE organizations and DEACTIVATE user_roles
-- across the platform. Org cascade deletion relies on existing FK ON DELETE
-- CASCADE definitions.
-- ============================================================================

-- ---- organizations: platform admin can DELETE & UPDATE any org ----
DROP POLICY IF EXISTS "Platform admin can delete organizations" ON organizations;
CREATE POLICY "Platform admin can delete organizations"
  ON organizations FOR DELETE TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "Platform admin can update organizations" ON organizations;
CREATE POLICY "Platform admin can update organizations"
  ON organizations FOR UPDATE TO authenticated
  USING (id = auth_user_org_id() OR is_platform_admin())
  WITH CHECK (id = auth_user_org_id() OR is_platform_admin());

-- ---- user_roles: platform admin can UPDATE any role (toggle active) ----
DROP POLICY IF EXISTS "Platform admin can update user_roles" ON user_roles;
CREATE POLICY "Platform admin can update user_roles"
  ON user_roles FOR UPDATE TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
