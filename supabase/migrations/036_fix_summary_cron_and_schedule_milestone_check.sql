-- ============================================================
-- Repoint summary crons + schedule milestone-overdue cron
-- ============================================================
-- Migration 017's weekly + monthly summary crons still call the
-- retired Tokyo project URL (seijjmcncrbekngurxxj). This
-- migration:
--   1. Unschedules the broken crons and reschedules them at the
--      live Mumbai URL. send-summary is flipped to
--      verify_jwt=false (set on 2026-05-23) so no JWT is needed.
--   2. Schedules a daily cron at 08:00 IST (02:30 UTC) that
--      calls check_overdue_milestones() to fan out overdue
--      milestone notifications via the existing dispatcher.
-- ============================================================

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-summary');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('monthly-summary');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('overdue-milestones-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'weekly-summary',
  '30 2 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://rdhvkluvkieajtmpljyz.supabase.co/functions/v1/send-summary',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{"period":"weekly"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'monthly-summary',
  '30 2 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://rdhvkluvkieajtmpljyz.supabase.co/functions/v1/send-summary',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{"period":"monthly"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'overdue-milestones-daily',
  '30 2 * * *',
  $$SELECT public.check_overdue_milestones();$$
);
