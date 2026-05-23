-- ============================================================
-- Restore external notification dispatch after Mumbai cutover
-- ============================================================
-- The original `dispatch_external_notification` (migration 006)
-- hardcoded the Tokyo project URL `seijjmcncrbekngurxxj`. After
-- the 2026-05-17 cutover that URL is dead, so every notification
-- INSERT silently failed at the pg_net layer — in-app worked,
-- email + WhatsApp never went out.
--
-- This migration repoints the dispatcher at the live Mumbai
-- project. The send-notification edge function is server-to-server
-- only (called from this trigger), so it now runs with
-- verify_jwt=false (set via Management API on 2026-05-23) and no
-- Authorization header is needed.
-- ============================================================

CREATE OR REPLACE FUNCTION public.dispatch_external_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  PERFORM net.http_post(
    url := 'https://rdhvkluvkieajtmpljyz.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id::text,
        'user_id', NEW.user_id::text,
        'notification_type', NEW.notification_type,
        'title', NEW.title,
        'message', NEW.message,
        'task_id', NEW.task_id::text
      )
    )
  );
  RETURN NEW;
END;
$fn$;
