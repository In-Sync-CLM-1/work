-- ============================================================================
-- 20260814000000_revoke_otp_verifications_public_grants.sql
--
-- otp_verifications has RLS disabled by design (013_otp_verifications.sql,
-- "accessed only via service role in edge functions") but Supabase's default
-- public-schema grants still gave anon/authenticated full SELECT/INSERT/
-- UPDATE/DELETE on it. With RLS off, those grants are the ONLY access
-- control left, so any unauthenticated caller could read or tamper with
-- pending OTP codes via PostgREST. Revoke public API access; service_role
-- (used by edge functions) bypasses grants entirely and is unaffected.
-- ============================================================================

REVOKE ALL ON public.otp_verifications FROM anon, authenticated;
