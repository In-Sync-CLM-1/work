-- Replace the partial unique index on user_roles(user_id, org_id) with a full
-- unique constraint, so PostgREST upserts using onConflict='user_id,org_id'
-- (in the manage-user edge function) can infer the conflict target.
--
-- The partial form ".. WHERE org_id IS NOT NULL" was unusable by PostgREST's
-- ON CONFLICT, which caused every "edit user" save in User Management to 400.
-- A regular unique constraint preserves the original intent: NULL != NULL in
-- unique constraints, so multiple platform_admin rows with org_id = NULL are
-- still allowed. The platform-admin-specific partial index that enforces
-- "one platform_admin role per user" remains untouched.

DROP INDEX IF EXISTS user_roles_user_org_unique;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_user_id_org_id_key UNIQUE (user_id, org_id);
