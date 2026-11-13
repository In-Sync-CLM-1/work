-- The status-change notification never carried completion/resolution notes,
-- so marking a task done told the assignee/assigner only "status changed
-- from X to Y" with no room for what the resolution actually was -- and
-- since send-notification's WhatsApp path picks the notification's own
-- message over the task's static description (see the companion fix in
-- send-notification/index.ts), that omission reached WhatsApp/email too.
-- Idempotent CREATE OR REPLACE since this may be pre-applied ahead of merge.
CREATE OR REPLACE FUNCTION public.notify_on_task_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_resolution_suffix TEXT := '';
BEGIN
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('completed', 'closed')
       AND NEW.completion_notes IS NOT NULL
       AND NEW.completion_notes <> ''
    THEN
      v_resolution_suffix := E'\n\nResolution notes: ' || NEW.completion_notes;
    ELSE
      v_resolution_suffix := '';
    END IF;

    -- Notify the assignee (skip if they triggered the change)
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_to,
        'status_change',
        NEW.task_name || ' — status updated',
        'Status changed from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' ')
          || v_resolution_suffix,
        NEW.id,
        NEW.org_id
      );
    END IF;

    -- Notify the assigner if different from assignee and didn't trigger the change
    IF NEW.assigned_by IS DISTINCT FROM NEW.assigned_to
       AND NEW.assigned_by IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_by,
        'status_change',
        NEW.task_name || ' — status updated',
        COALESCE((SELECT full_name FROM profiles WHERE id = NEW.assigned_to), 'A team member')
          || ' changed status from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' ')
          || v_resolution_suffix,
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  -- Priority escalated to urgent or high
  IF OLD.priority IS DISTINCT FROM NEW.priority
     AND NEW.priority IN ('urgent', 'high')
     AND (OLD.priority IS NULL OR OLD.priority NOT IN ('urgent', 'high'))
  THEN
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_to,
        'priority_change',
        NEW.task_name || ' — priority escalated',
        'Priority changed from ' || COALESCE(OLD.priority::TEXT, 'none') || ' to ' || NEW.priority::TEXT || '. Immediate attention required.',
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  -- NOTE: Reassignment notifications are handled exclusively by
  -- trg_tasks_notify_assignment → notify_on_task_assignment().
  -- Do NOT add a reassignment block here to avoid duplicate notifications.

  RETURN NEW;
END;
$function$;
