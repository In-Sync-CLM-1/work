-- ============================================================================
-- 20260814000001_fix_seed_user_email_change_tokens.sql
--
-- Users inserted directly via raw SQL (005_seed_demo_data.sql) leave
-- email_change_token_new / email_change as NULL, since that INSERT doesn't
-- set them and the column defaults are NULL on this Supabase version.
-- GoTrue's admin/password-update and sign-in paths error with "Database
-- error loading user" (500) on any user with a NULL there — hit live on
-- the re-seeded demo accounts. Backfill to '' for any row already affected,
-- and for any future ones (fully idempotent).
-- ============================================================================

UPDATE auth.users
SET email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '')
WHERE email_change_token_new IS NULL OR email_change IS NULL;
