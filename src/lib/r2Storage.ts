// Client helper for the R2 storage gateway (functions/api/storage).
// Replaces direct supabase.storage.from(bucket) calls — see the R2-only rule.
//
// Private objects (the default, and what task files use) are read back through
// a short-lived signed URL so a plain <a href> or <img src> works without
// attaching the session.
import { supabase } from '@/lib/supabase';

export type R2Visibility = 'public' | 'private';

export interface R2UploadResult {
  key: string;
  url: string;
  visibility: R2Visibility;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Upload a file to R2 under `<visibility>/<bucket>/<path>`. */
export async function uploadToR2(
  bucket: string,
  path: string,
  file: Blob,
  opts: { visibility?: R2Visibility; contentType?: string } = {},
): Promise<R2UploadResult> {
  const res = await fetch('/api/storage', {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'X-Bucket': bucket,
      'X-Path': encodeURIComponent(path),
      'X-Visibility': opts.visibility || 'private',
      'Content-Type': opts.contentType || file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** Time-limited URL for a private key, usable as a plain href. */
export async function signR2Url(key: string, expiresIn = 3600): Promise<string> {
  const res = await fetch('/api/storage/sign', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, expiresIn }),
  });
  if (!res.ok) {
    throw new Error(`Could not sign file URL (${res.status}): ${await res.text()}`);
  }
  const { signedUrl } = (await res.json()) as { signedUrl: string };
  return signedUrl;
}

/** Delete an object. Missing objects are treated as already gone. */
export async function deleteFromR2(key: string): Promise<void> {
  const res = await fetch(`/api/storage/o/${key}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed (${res.status}): ${await res.text()}`);
  }
}
