// Who a notification appears to come from, resolved per organisation.
//
// Work-Sync is multi-tenant: Redefine Marcom's people should get mail from
// Redefine, not from In-Sync. An org with no `org_notification_settings` row
// gets the platform defaults, so adding this changed nothing for existing orgs.

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export interface SenderIdentity {
  /** Resend key for the account that owns the sending domain. */
  resendApiKey: string | undefined;
  fromEmail: string;
  fromName: string;
  /** WhatsApp sender number in Exotel's format (no leading +). */
  whatsappFrom: string | undefined;
  /** Base URL for links back into the app. */
  appBaseUrl: string;
}

// A sender profile names a Resend account; this allowlist is the ONLY way a
// profile turns into an environment variable. A value that isn't listed falls
// back to the default key, so a bad row can never reach an unrelated secret.
const RESEND_KEY_ENV: Record<string, string> = {
  default: 'RESEND_API_KEY',
  redefine: 'RESEND_API_KEY_REDEFINE',
};

const DEFAULT_FROM_EMAIL = 'notifications@in-sync.co.in';
const DEFAULT_FROM_NAME = 'Work-Sync';
const DEFAULT_APP_BASE_URL = 'https://work.in-sync.co.in';

function platformDefaults(): SenderIdentity {
  return {
    resendApiKey: Deno.env.get('RESEND_API_KEY'),
    fromEmail: Deno.env.get('RESEND_FROM_EMAIL') || DEFAULT_FROM_EMAIL,
    fromName: DEFAULT_FROM_NAME,
    whatsappFrom: Deno.env.get('EXOTEL_WHATSAPP_NUMBER'),
    appBaseUrl: DEFAULT_APP_BASE_URL,
  };
}

/** Base URL for links back into the app, kept in the database so a
 *  re-provision doesn't need a redeploy. Falls back to the live domain. */
export async function resolveAppBaseUrl(admin: AdminClient): Promise<string> {
  const { data } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'app_base_url')
    .maybeSingle();
  return data?.value || DEFAULT_APP_BASE_URL;
}

/**
 * Sender identity for one organisation. `orgId` may be null (e.g. a
 * notification we couldn't attribute), in which case the platform defaults
 * apply — the same behaviour as before this was org-scoped.
 */
export async function resolveSender(
  admin: AdminClient,
  orgId: string | null | undefined,
): Promise<SenderIdentity> {
  const defaults = platformDefaults();
  defaults.appBaseUrl = await resolveAppBaseUrl(admin);

  if (!orgId) return defaults;

  const { data: settings, error } = await admin
    .from('org_notification_settings')
    .select('email_from_address, email_from_name, email_credential, whatsapp_from_number')
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('org_notification_settings lookup failed, using platform defaults:', error);
    return defaults;
  }
  if (!settings) return defaults;

  const keyEnv = RESEND_KEY_ENV[settings.email_credential] ?? RESEND_KEY_ENV.default;
  const resendApiKey = Deno.env.get(keyEnv);

  if (!resendApiKey) {
    // The org is configured for an account whose key was never set. Sending on
    // the default key would come from the wrong domain and fail DKIM, so keep
    // the configured address and let the send error out loudly instead.
    console.error(
      `Sender profile "${settings.email_credential}" for org ${orgId} has no ${keyEnv} configured.`,
    );
  }

  return {
    resendApiKey: resendApiKey ?? undefined,
    fromEmail: settings.email_from_address || defaults.fromEmail,
    fromName: settings.email_from_name || defaults.fromName,
    whatsappFrom: settings.whatsapp_from_number || defaults.whatsappFrom,
    appBaseUrl: defaults.appBaseUrl,
  };
}
