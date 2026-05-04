-- ============================================================================
-- 029_org_delete_cascade.sql
-- Fix foreign keys so deleting an organization cleanly cascades.
-- - org-scoped data → CASCADE
-- - profiles.org_id / profiles.designation_id → SET NULL (profile survives)
-- - notifications.task_id, tasks.parent_task_id → CASCADE
-- ============================================================================

-- ---- profiles.org_id: SET NULL (profile lives even if org is deleted) ----
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_org_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ---- profiles.designation_id: SET NULL (designations cascade with org) ----
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_designation;
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_designation
  FOREIGN KEY (designation_id) REFERENCES public.designations(id) ON DELETE SET NULL;

-- ---- tasks.org_id: CASCADE ----
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_org_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- tasks.parent_task_id: CASCADE (subtasks die with parent) ----
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_parent_task_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_parent_task_id_fkey
  FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

-- ---- task_comments.org_id: CASCADE ----
ALTER TABLE public.task_comments DROP CONSTRAINT IF EXISTS task_comments_org_id_fkey;
ALTER TABLE public.task_comments
  ADD CONSTRAINT task_comments_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- task_attachments.org_id: CASCADE ----
ALTER TABLE public.task_attachments DROP CONSTRAINT IF EXISTS task_attachments_org_id_fkey;
ALTER TABLE public.task_attachments
  ADD CONSTRAINT task_attachments_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- task_watchers.org_id: CASCADE ----
ALTER TABLE public.task_watchers DROP CONSTRAINT IF EXISTS task_watchers_org_id_fkey;
ALTER TABLE public.task_watchers
  ADD CONSTRAINT task_watchers_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- teams.org_id: CASCADE ----
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_org_id_fkey;
ALTER TABLE public.teams
  ADD CONSTRAINT teams_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- team_members.org_id: CASCADE ----
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_org_id_fkey;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- notifications.org_id: CASCADE ----
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_org_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ---- notifications.task_id: CASCADE (so org → tasks → notifications cascades) ----
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_task_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
