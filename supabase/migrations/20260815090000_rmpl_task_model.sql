-- ============================================================
-- RMPL task model
-- ============================================================
-- Redefine Marcom's team is moving off RMPL's task module onto
-- Work-Sync, and their day-to-day has to feel identical. RMPL
-- classifies every task by department (General / Digicom /
-- Livecom), optionally by a sub-category within that department,
-- optionally links it to a project, and can mark it as repeating.
--
-- Work-Sync is multi-tenant, so RMPL's fixed department names
-- can't be hardcoded the way they are over there. Departments and
-- their sub-category lists become per-organisation configuration,
-- seeded at the bottom of this file with RMPL's exact values so
-- Redefine Marcom sees precisely what they see today.
--
-- Orgs with no departments configured (e.g. In-Sync Demo) keep
-- today's single combined task list — every column added here is
-- optional, so nothing changes for them.
-- ============================================================

-- ------------------------------------------------------------
-- Departments (per-org task buckets)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Stable slug used in the page URL (/tasks/digicom). Never shown to users.
  key text NOT NULL,
  label text NOT NULL,
  -- 'mine' = the list shows only tasks you assigned or were assigned
  -- (RMPL's personal General list). 'team' = the whole department's
  -- tasks, regardless of who owns them (RMPL's Digicom/Livecom lists).
  visibility text NOT NULL DEFAULT 'team' CHECK (visibility IN ('mine', 'team')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

CREATE INDEX IF NOT EXISTS task_departments_org_idx
  ON task_departments(org_id, sort_order) WHERE is_active;

-- ------------------------------------------------------------
-- Sub-categories (per department)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES task_departments(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, label)
);

CREATE INDEX IF NOT EXISTS task_subcategories_dept_idx
  ON task_subcategories(department_id, sort_order) WHERE is_active;

-- ------------------------------------------------------------
-- Projects (reference list only)
-- ------------------------------------------------------------
-- Deliberately thin. RMPL's project module (quotations, expenses,
-- team allocations) stays in RMPL — all Work-Sync needs is enough
-- to name the project a task belongs to and search for it.
-- source_ref holds the originating system's id so an import can be
-- re-run without creating duplicates.
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_number text,
  project_name text NOT NULL,
  status text,
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS projects_org_source_ref_idx
  ON projects(org_id, source_ref) WHERE source_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_org_name_idx ON projects(org_id, project_name);

-- ------------------------------------------------------------
-- Task columns
-- ------------------------------------------------------------
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES task_departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  -- A repeating task has no calendar schedule and no end date: the next
  -- copy is created when the current one is signed off (see the
  -- repeat-on-signoff trigger in a later migration).
  ADD COLUMN IF NOT EXISTS recurrence text
    CHECK (recurrence IS NULL OR recurrence IN ('daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  -- The brief handed over at assignment time: [{path,name,size,type}, ...]
  ADD COLUMN IF NOT EXISTS brief_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_ref text;

CREATE INDEX IF NOT EXISTS tasks_department_idx ON tasks(department_id, status);
CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_org_source_ref_idx
  ON tasks(org_id, source_ref) WHERE source_ref IS NOT NULL;

-- ------------------------------------------------------------
-- Row-level security
-- ------------------------------------------------------------
ALTER TABLE task_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Who may edit the configuration itself: org admins and platform admins.
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
     WHERE user_id = auth.uid()
       AND is_active
       AND role IN ('admin', 'super_admin', 'platform_admin')
  );
$$;

DROP POLICY IF EXISTS "Org members can view departments" ON task_departments;
CREATE POLICY "Org members can view departments"
  ON task_departments FOR SELECT
  USING (org_id = auth_user_org_id() OR is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage departments" ON task_departments;
CREATE POLICY "Admins can manage departments"
  ON task_departments FOR ALL
  USING (org_id = auth_user_org_id() AND is_org_admin())
  WITH CHECK (org_id = auth_user_org_id() AND is_org_admin());

DROP POLICY IF EXISTS "Org members can view subcategories" ON task_subcategories;
CREATE POLICY "Org members can view subcategories"
  ON task_subcategories FOR SELECT
  USING (org_id = auth_user_org_id() OR is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage subcategories" ON task_subcategories;
CREATE POLICY "Admins can manage subcategories"
  ON task_subcategories FOR ALL
  USING (org_id = auth_user_org_id() AND is_org_admin())
  WITH CHECK (org_id = auth_user_org_id() AND is_org_admin());

DROP POLICY IF EXISTS "Org members can view projects" ON projects;
CREATE POLICY "Org members can view projects"
  ON projects FOR SELECT
  USING (org_id = auth_user_org_id() OR is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  USING (org_id = auth_user_org_id() AND is_org_admin())
  WITH CHECK (org_id = auth_user_org_id() AND is_org_admin());

DROP TRIGGER IF EXISTS trg_task_departments_updated_at ON task_departments;
CREATE TRIGGER trg_task_departments_updated_at
  BEFORE UPDATE ON task_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- Seed: Redefine Marcom's departments and sub-categories
-- ------------------------------------------------------------
-- Values copied verbatim from RMPL so the team sees the same lists
-- on day one. Guarded on the org existing, and idempotent, so this
-- is safe on a fresh project where the org hasn't been created yet.
DO $$
DECLARE
  v_org uuid;
  v_general uuid;
  v_digicom uuid;
  v_livecom uuid;
BEGIN
  SELECT id INTO v_org FROM organizations WHERE name = 'Redefine Marcom';
  IF v_org IS NULL THEN
    RAISE NOTICE 'Redefine Marcom org not present — skipping department seed';
    RETURN;
  END IF;

  INSERT INTO task_departments (org_id, key, label, visibility, sort_order)
  VALUES (v_org, 'general', 'General',  'mine', 1),
         (v_org, 'digicom', 'Digicom',  'team', 2),
         (v_org, 'livecom', 'Livecom',  'team', 3)
  ON CONFLICT (org_id, key) DO NOTHING;

  SELECT id INTO v_general FROM task_departments WHERE org_id = v_org AND key = 'general';
  SELECT id INTO v_digicom FROM task_departments WHERE org_id = v_org AND key = 'digicom';
  SELECT id INTO v_livecom FROM task_departments WHERE org_id = v_org AND key = 'livecom';

  -- General has no sub-categories in RMPL, and so shows no field.
  INSERT INTO task_subcategories (org_id, department_id, label, sort_order)
  VALUES (v_org, v_digicom, 'Invites & Mailers',       1),
         (v_org, v_digicom, 'Event Stage Graphics',    2),
         (v_org, v_digicom, 'Creatives & Print',       3),
         (v_org, v_digicom, 'Videos & Motion',         4),
         (v_org, v_digicom, 'Website & Microsites',    5),
         (v_org, v_digicom, 'Social & Internal Comms', 6),
         (v_org, v_livecom, 'Hotel',                   1),
         (v_org, v_livecom, 'SetUp',                   2),
         (v_org, v_livecom, 'Design finalisation',     3),
         (v_org, v_livecom, 'Onsite',                  4),
         (v_org, v_livecom, 'Collateral',              5),
         (v_org, v_livecom, 'Post event',              6)
  ON CONFLICT (department_id, label) DO NOTHING;
END $$;
