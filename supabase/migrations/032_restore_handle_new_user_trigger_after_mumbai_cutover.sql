-- Restore the on_auth_user_created trigger dropped during the 2026-05-17 Mumbai cutover.
-- The handle_new_user() function survived but its binding to auth.users did not,
-- so every new signup left an auth.users row with no companion profiles row —
-- register-organization's profile UPDATE then matched 0 rows and the new admin
-- could log in but had no profile, breaking the rest of the app.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
