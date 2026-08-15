-- ============================================================
-- Repeating tasks: spawn the next copy on sign-off
-- ============================================================
-- Mirrors RMPL's spawn_recurring_task_instance, with one deliberate
-- difference. RMPL creates the next copy when the doer marks the task
-- completed. Work-Sync keeps the assigner's sign-off step, so the copy
-- is created when the task is CLOSED — the point at which the work is
-- actually accepted. Spawning at 'completed' would let a repeating task
-- escape the sign-off that Work-Sync exists to enforce.
--
-- Everything else matches RMPL: the next due date is a day/week/month
-- from now (not from the old due date, so a late sign-off doesn't
-- immediately produce an overdue copy), the same people keep it, and
-- department/sub-category/project/parent carry over.
--
-- The brief is deliberately NOT copied: it belonged to that round of
-- work. RMPL leaves brief_files unset on the copy too.
-- ============================================================

-- Which task this copy came from. recurrence_parent_id points at the root of
-- the chain (as in RMPL); this points at the immediate predecessor, which is
-- what lets us tell whether a given task has already spawned its successor.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS spawned_from_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- One successor per task, enforced rather than merely intended.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_spawned_from_idx
  ON tasks(spawned_from_id) WHERE spawned_from_id IS NOT NULL;

CREATE OR REPLACE FUNCTION spawn_recurring_task_instance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_due timestamptz;
BEGIN
  -- A task can be restarted and signed off again. Without this guard that
  -- would produce a second copy of the same round of work.
  IF EXISTS (SELECT 1 FROM tasks WHERE spawned_from_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_next_due := CASE NEW.recurrence
    WHEN 'daily'   THEN now() + interval '1 day'
    WHEN 'weekly'  THEN now() + interval '7 days'
    WHEN 'monthly' THEN now() + interval '1 month'
  END;

  INSERT INTO tasks (
    task_name, description, assigned_to, assigned_by, due_date,
    status, priority, department_id, subcategory, project_id, parent_task_id,
    recurrence, recurrence_parent_id, spawned_from_id, org_id, tags, estimated_hours
  ) VALUES (
    NEW.task_name, NEW.description, NEW.assigned_to, NEW.assigned_by, v_next_due,
    'pending', NEW.priority, NEW.department_id, NEW.subcategory, NEW.project_id, NEW.parent_task_id,
    NEW.recurrence, COALESCE(NEW.recurrence_parent_id, NEW.id), NEW.id, NEW.org_id, NEW.tags, NEW.estimated_hours
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spawn_recurring_task_instance ON tasks;
CREATE TRIGGER trg_spawn_recurring_task_instance
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (
    NEW.status = 'closed'
    AND OLD.status IS DISTINCT FROM 'closed'
    AND NEW.recurrence IS NOT NULL
  )
  EXECUTE FUNCTION spawn_recurring_task_instance();
