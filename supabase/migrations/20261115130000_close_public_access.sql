-- Code audit 2026-11-15 (approved): database functions are not open to visitors without a sign-in.
-- Visitors keep only the access-check helpers that table rules use. The scheduled jobs' functions
-- (overdue milestones, RMPL project sync) and the owner-joins-organisation helper are closed to staff
-- too; the server and the organisation trigger keep using them with full rights.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
DO $$ DECLARE f record; BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = ANY (ARRAY['auth_user_org_id', 'is_member_of_active_org', 'is_org_admin', 'is_platform_admin', 'ledger_can_view', 'ledger_is_admin']) LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f.sig);
  END LOOP;
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = ANY (ARRAY['add_owner_to_org', 'check_overdue_milestones', 'sync_rmpl_projects', 'ledger_seal_block', 'ledger_verify_chain', 'ledger_blocks_for_copy', 'ledger_blocks_export', 'ledger_capture_logins', 'wake_claude_worker']) LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', f.sig);
  END LOOP;
END $$;
