// POST /api/storage -> upload bytes to R2 under <visibility>/<bucket>/<path>
//
// Stateless: stores by key and returns { key, url }. The caller persists the
// key in its own table. Public keys are readable without auth; private keys
// need a session, the service key, or a signed link.
import {
  Env,
  corsHeaders,
  isAuthorized,
  jsonResponse,
  sanitizeBucket,
  sanitizePath,
} from './_shared';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(env, request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const bucket = sanitizeBucket(request.headers.get('X-Bucket') || '');
  const rawPath = request.headers.get('X-Path') || '';
  const path = sanitizePath(rawPath ? decodeURIComponent(rawPath) : '');
  const visibility =
    (request.headers.get('X-Visibility') || 'private').toLowerCase() === 'public'
      ? 'public'
      : 'private';

  if (!bucket || !path) {
    return jsonResponse({ error: 'X-Bucket and X-Path required' }, 400);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BYTES) {
    return jsonResponse({ error: 'File exceeds 50MB limit' }, 413);
  }
  if (!request.body) return jsonResponse({ error: 'Missing body' }, 400);

  const key = `${visibility}/${bucket}/${path}`;
  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

  try {
    await env.TASK_FILES.put(key, request.body, { httpMetadata: { contentType } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: `R2 upload failed: ${message}` }, 500);
  }

  const origin = new URL(request.url).origin;
  return new Response(
    JSON.stringify({ key, url: `${origin}/api/storage/o/${key}`, visibility }),
    { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders() } },
  );
};
