// GET    /api/storage/o/<key> -> stream an R2 object.
//                                Keys under public/ are served without auth;
//                                others need a session, the service key, or a
//                                valid ?exp&sig signed link.
// DELETE /api/storage/o/<key> -> remove the object (authed).
import {
  Env,
  corsHeaders,
  isAuthorized,
  jsonResponse,
  verifySignedKey,
} from '../_shared';

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { headers: corsHeaders() });

// Derive the key from the raw path rather than the catch-all param — more
// reliable for names containing spaces, commas or other special characters.
function keyFromRequest(request: Request): string {
  const path = new URL(request.url).pathname;
  const marker = '/api/storage/o/';
  const idx = path.indexOf(marker);
  const raw = idx >= 0 ? path.slice(idx + marker.length) : '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export const onRequestGet: PagesFunction<Env, 'key'> = async ({ request, env }) => {
  const key = keyFromRequest(request);
  if (!key) return jsonResponse({ error: 'Not found' }, 404);

  const isPublic = key.startsWith('public/');
  if (!isPublic) {
    const url = new URL(request.url);
    const signed = await verifySignedKey(
      env,
      key,
      url.searchParams.get('exp'),
      url.searchParams.get('sig'),
    );
    if (!signed && !(await isAuthorized(env, request))) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  const obj = await env.TASK_FILES.get(key);
  if (!obj) return jsonResponse({ error: 'Not found' }, 404);

  const headers = new Headers(corsHeaders());
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  if (obj.size) headers.set('Content-Length', String(obj.size));
  // Keys are timestamped, so an object never changes under the same key.
  headers.set('Cache-Control', isPublic ? 'public, max-age=31536000, immutable' : 'private, max-age=300');
  if (obj.httpEtag) headers.set('ETag', obj.httpEtag);
  return new Response(obj.body, { headers });
};

export const onRequestDelete: PagesFunction<Env, 'key'> = async ({ request, env }) => {
  if (!(await isAuthorized(env, request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const key = keyFromRequest(request);
  if (!key) return jsonResponse({ error: 'Not found' }, 404);

  await env.TASK_FILES.delete(key).catch(() => {});
  return new Response(null, { status: 204, headers: corsHeaders() });
};
