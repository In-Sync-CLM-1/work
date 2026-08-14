-- ============================================================================
-- 20260814150000_drop_sso_protocol_tables.sql
--
-- The custom signed-code SSO protocol (sso-exchange, sso_issued_codes,
-- sso_pending_reports_to) is replaced by RMPL's existing one-click launcher,
-- which needs neither a replay-guard table nor a pending-manager queue here
-- (accounts are pre-provisioned in a batch script, not created just-in-time
-- during login). The "Redefine Marcom" org from 20260814140000 stays — it's
-- still the real destination for RMPL employees, just populated differently.
-- ============================================================================

DROP TABLE IF EXISTS public.sso_issued_codes;
DROP TABLE IF EXISTS public.sso_pending_reports_to;
