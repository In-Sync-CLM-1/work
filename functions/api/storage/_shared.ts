// Shared helpers for the R2 storage gateway.
//
// Work-Sync stores files in Cloudflare R2, not Supabase Storage. These Pages
// Functions are the only thing that touches the bucket: the browser posts bytes
// here, and reads them back through a signed URL. Callers persist the returned
// key in their own tables (e.g. task_attachments.file_path).

export interface Env {
  TASK_FILES: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export function extractJwt(request: Request): string {
  const auth = request.headers.get('Authorization') || '';
  return auth.replace(/^Bearer\s+/i, '');
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Bucket, X-Path, X-Visibility',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };
}

export async function getUserFromJwt(
  env: Env,
  jwt: string,
): Promise<{ id: string; email?: string } | null> {
  if (!jwt) return null;
  try {
    const resp = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: env.SUPABASE_ANON_KEY },
    });
    if (!resp.ok) return null;
    const user: { id?: string; email?: string } = await resp.json();
    return user?.id ? { id: user.id, email: user.email } : null;
  } catch {
    return null;
  }
}

// The migration script and any server-side job pass the service-role key as
// Bearer instead of a user session; recognise it and skip the /auth/v1/user
// roundtrip.
export function isServiceRoleJwt(env: Env, jwt: string): boolean {
  return !!jwt && !!env.SUPABASE_SERVICE_ROLE_KEY && jwt === env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function isAuthorized(env: Env, request: Request): Promise<boolean> {
  const jwt = extractJwt(request);
  return isServiceRoleJwt(env, jwt) || !!(await getUserFromJwt(env, jwt));
}

// HMAC-signed URLs let a private object be opened in a new tab or dropped into
// an <img src> without attaching a session. Signed server-side only; the
// service-role key is the signing secret.
export async function hmacHex(env: Env, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SUPABASE_SERVICE_ROLE_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySignedKey(
  env: Env,
  objKey: string,
  exp: string | null,
  sig: string | null,
): Promise<boolean> {
  if (!exp || !sig) return false;
  if (Date.now() > Number(exp)) return false;
  const expected = await hmacHex(env, `${objKey}:${exp}`);
  return expected.length === sig.length && expected === sig;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 200);
}

export function sanitizeBucket(b: string): string {
  return b.replace(/[^a-z0-9-]+/gi, '-').toLowerCase().slice(0, 64);
}

// Keep the folder structure, sanitize each segment.
export function sanitizePath(p: string): string {
  return p
    .split('/')
    .map((s) => sanitizeFileName(s))
    .filter(Boolean)
    .join('/')
    .slice(0, 400);
}
