-- ============================================================
-- Task Milestones
-- ============================================================
-- Named checkpoints inside a task. Each milestone has a title,
-- target date, and a completed flag. Completing a milestone
-- bumps the parent task's completion_percentage (proportional
-- to milestones completed). Overdue milestones (target date
-- passed, not yet completed) generate a notification that fans
-- out to email + WhatsApp via the existing dispatcher.
-- ============================================================

CREATE TABLE IF NOT EXISTS task_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_date date NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  last_overdue_reminder_on date,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_milestones_task_id_idx ON task_milestones(task_id);
CREATE INDEX IF NOT EXISTS task_milestones_overdue_idx
  ON task_milestones(target_date)
  WHERE completed = false;

ALTER TABLE task_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones in their org"
  ON task_milestones FOR SELECT
  USING (org_id = auth_user_org_id() OR is_platform_admin());

CREATE POLICY "Users can add milestones in their org"
  ON task_milestones FOR INSERT
  WITH CHECK (org_id = auth_user_org_id() AND created_by = auth.uid());

CREATE POLICY "Users can update milestones in their org"
  ON task_milestones FOR UPDATE
  USING (org_id = auth_user_org_id() OR is_platform_admin())
  WITH CHECK (org_id = auth_user_org_id() OR is_platform_admin());

CREATE POLICY "Users can delete milestones in their org"
  ON task_milestones FOR DELETE
  USING (org_id = auth_user_org_id() OR is_platform_admin());

CREATE TRIGGER trg_task_milestones_updated_at
  BEFORE UPDATE ON task_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Recompute parent task completion_percentage from milestones
-- ============================================================
CREATE OR REPLACE FUNCTION recompute_task_completion_from_milestones()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id uuid;
  v_total int;
  v_done int;
  v_pct int;
  v_status task_status;
BEGIN
  v_task_id := COALESCE(NEW.task_id, OLD.task_id);

  SELECT status INTO v_status FROM tasks WHERE id = v_task_id;
  -- Don't override a terminal task state
  IF v_status IN ('completed', 'closed', 'cancelled') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed)
    INTO v_total, v_done
    FROM task_milestones WHERE task_id = v_task_id;

  IF v_total = 0 THEN
    -- No milestones left: leave completion_percentage alone
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_pct := ROUND((v_done::numeric / v_total) * 100)::int;

  UPDATE tasks SET completion_percentage = v_pct WHERE id = v_task_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_milestones_recompute_task
  AFTER INSERT OR UPDATE OF completed OR DELETE ON task_milestones
  FOR EACH ROW
  EXECUTE FUNCTION recompute_task_completion_from_milestones();

-- ============================================================
-- Stamp completed_at + completed_by when completed flips
-- ============================================================
CREATE OR REPLACE FUNCTION stamp_milestone_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.completed IS DISTINCT FROM NEW.completed THEN
    IF NEW.completed THEN
      NEW.completed_at := COALESCE(NEW.completed_at, now());
      NEW.completed_by := COALESCE(NEW.completed_by, auth.uid());
    ELSE
      NEW.completed_at := NULL;
      NEW.completed_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_milestones_stamp_completion
  BEFORE UPDATE ON task_milestones
  FOR EACH ROW
  EXECUTE FUNCTION stamp_milestone_completion();

-- ============================================================
-- Daily check for overdue milestones — inserts notifications
-- ============================================================
CREATE OR REPLACE FUNCTION check_overdue_milestones()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT m.id AS milestone_id,
           m.title,
           m.target_date,
           t.id AS task_id,
           t.task_name,
           t.task_number,
           t.assigned_to,
           t.assigned_by,
           t.org_id
      FROM task_milestones m
      JOIN tasks t ON t.id = m.task_id
     WHERE m.completed = false
       AND m.target_date < CURRENT_DATE
       AND (m.last_overdue_reminder_on IS NULL OR m.last_overdue_reminder_on < CURRENT_DATE)
       AND t.status IN ('pending', 'in_progress')
  LOOP
    INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
    VALUES (
      r.assigned_to,
      'milestone_overdue',
      r.task_name || ' — milestone overdue',
      'Milestone "' || r.title || '" was due on ' || TO_CHAR(r.target_date, 'DD Mon YYYY'),
      r.task_id,
      r.org_id
    );

    -- Also notify the assigner if different from assignee
    IF r.assigned_by IS DISTINCT FROM r.assigned_to THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        r.assigned_by,
        'milestone_overdue',
        r.task_name || ' — milestone overdue',
        'Milestone "' || r.title || '" on ' || r.task_number || ' was due on ' || TO_CHAR(r.target_date, 'DD Mon YYYY'),
        r.task_id,
        r.org_id
      );
    END IF;

    UPDATE task_milestones
       SET last_overdue_reminder_on = CURRENT_DATE
     WHERE id = r.milestone_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
