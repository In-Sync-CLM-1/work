-- Org-scoped notification sender identity (2026-08-16)
--
-- Work-Sync is multi-tenant, but every notification went out as
-- "Work-Sync <notifications@in-sync.co.in>" from the In-Sync WhatsApp number,
-- whichever organisation the recipient belonged to. Redefine Marcom's 105
-- employees moved onto Work-Sync from RMPL, and their notifications should
-- look like they come from their own company.
--
-- Sender identity therefore becomes per-org configuration. Any org WITHOUT a
-- row here keeps exactly the current behaviour (the platform defaults held in
-- the edge functions' environment), so nothing changes for anyone else.
--
-- Credentials are NOT stored here. `email_credential` names a sender profile
-- that each edge function maps to an environment variable through a fixed
-- allowlist, so a bad value can only ever fall back to the default -- it can
-- never point the function at an unrelated secret.

-- ─── Environment-specific URLs, so a re-provision is a data change ──────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_settings IS
  'Environment-specific values read by database triggers. Service-role only.';

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM anon, authenticated;

INSERT INTO public.app_settings (key, value) VALUES
  ('functions_base_url', 'https://dhbeivfeuewzkdeqkjpa.supabase.co/functions/v1'),
  ('app_base_url',       'https://work.in-sync.co.in')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ─── Per-org sender identity ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_notification_settings (
  org_id               uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_from_address   text,
  email_from_name      text,
  email_credential     text NOT NULL DEFAULT 'default',
  whatsapp_from_number text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_notification_settings_email_credential_known
    CHECK (email_credential IN ('default', 'redefine'))
);

COMMENT ON TABLE public.org_notification_settings IS
  'Per-org "from" identity for notification email and WhatsApp. No row = platform defaults. Service-role only: sender identity is a fleet decision, not something an org admin may change.';
COMMENT ON COLUMN public.org_notification_settings.email_credential IS
  'Sender profile name, mapped to a Resend API key env var by an allowlist in the edge functions. Never holds a credential itself.';

ALTER TABLE public.org_notification_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.org_notification_settings FROM anon, authenticated;

-- Redefine Marcom sends as itself: redefine.in is verified on Redefine's own
-- Resend account, and 918447351886 is the WhatsApp number RMPL already uses.
-- That number sits on the same WABA as In-Sync's, so every approved Work-Sync
-- template works from it unchanged.
INSERT INTO public.org_notification_settings
  (org_id, email_from_address, email_from_name, email_credential, whatsapp_from_number)
SELECT id, 'notifications@redefine.in', 'Redefine Marcom', 'redefine', '918447351886'
FROM public.organizations
WHERE name = 'Redefine Marcom'
ON CONFLICT (org_id) DO UPDATE SET
  email_from_address   = EXCLUDED.email_from_address,
  email_from_name      = EXCLUDED.email_from_name,
  email_credential     = EXCLUDED.email_credential,
  whatsapp_from_number = EXCLUDED.whatsapp_from_number,
  updated_at           = now();

-- ─── Repoint the notification dispatch trigger ──────────────────────────────
-- It still called the Supabase project that was deleted in the 2026-08-14
-- re-provision (rdhvkluvkieajtmpljyz), so every email and WhatsApp alert has
-- been posted into a void since. It now reads the base URL from app_settings,
-- so the next re-provision is a one-row update rather than a silent outage.
--
-- SECURITY DEFINER is required: app_settings is service-role only, so an
-- invoker-rights trigger would read NULL for a real user and skip the
-- dispatch — working for seeded/service-role writes and failing for everyone
-- else, which is the hardest kind of bug to see.
CREATE OR REPLACE FUNCTION public.dispatch_external_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  base_url text;
BEGIN
  SELECT value INTO base_url FROM public.app_settings WHERE key = 'functions_base_url';

  IF base_url IS NULL OR base_url = '' THEN
    RAISE WARNING 'dispatch_external_notification: app_settings.functions_base_url is unset; notification % not dispatched', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := base_url || '/send-notification',
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
$function$;
