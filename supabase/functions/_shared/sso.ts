// Shared HMAC-SHA256 sign/verify for the fleet SSO handoff token.
// Identical copy lives in every spoke app's _shared/sso.ts — RMPL (issuer)
// and each spoke (verifier) must sign/verify with the exact same logic and
// the same SSO_SIGNING_SECRET value.
//
// Token shape: `${base64url(JSON payload)}.${base64url(HMAC-SHA256 sig)}`.
// Not a full JWT — just enough structure for a short-lived, tamper-proof,
// single-use authorization code. Payload always carries `exp` (unix seconds)
// and `jti` (single-use id); callers add whatever identity claims they need.

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface SsoPayload {
  [key: string]: unknown;
  exp: number;
  jti: string;
}

export async function signSsoToken(
  claims: Record<string, unknown>,
  secret: string,
  ttlSeconds = 60
): Promise<string> {
  const payload: SsoPayload = {
    ...claims,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    jti: crypto.randomUUID(),
  };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySsoToken(
  token: string,
  secret: string
): Promise<{ valid: true; payload: SsoPayload } | { valid: false; error: string }> {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, error: "malformed_token" };
  const [payloadB64, sigB64] = parts;

  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(sigB64);
  } catch {
    return { valid: false, error: "malformed_signature" };
  }

  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(payloadB64)
  );
  if (!ok) return { valid: false, error: "bad_signature" };

  let payload: SsoPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  } catch {
    return { valid: false, error: "malformed_payload" };
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, error: "expired" };
  }
  if (typeof payload.jti !== "string" || !payload.jti) {
    return { valid: false, error: "missing_jti" };
  }

  return { valid: true, payload };
}
