// POST /api/storage/sign -> time-limited signed URL for a private key.
//
// Lets a private object be opened in a new tab or used as a download href
// without attaching the session. Caller must already be authenticated.
import { Env, corsHeaders, hmacHex, isAuthorized, jsonResponse } from './_shared';

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(env, request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: { key?: string; expiresIn?: number };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const key = (body.key || '').replace(/^\/+/, '');
  if (!key) return jsonResponse({ error: 'key required' }, 400);

  // Default 1 hour, floor 1 minute, cap 1 year.
  const expiresIn = Math.min(Math.max(Number(body.expiresIn) || 3600, 60), 60 * 60 * 24 * 365);
  const exp = Date.now() + expiresIn * 1000;
  const sig = await hmacHex(env, `${key}:${exp}`);
  const origin = new URL(request.url).origin;

  return new Response(
    JSON.stringify({ signedUrl: `${origin}/api/storage/o/${key}?exp=${exp}&sig=${sig}` }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders() } },
  );
};
