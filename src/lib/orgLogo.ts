/**
 * Resolve a stored organisation logo to something an <img src> can use.
 *
 * New uploads store the R2 object key, so the URL stays relative and keeps
 * working whichever domain the app is served from. Anything already stored as
 * an absolute URL is passed through untouched.
 */
export function orgLogoSrc(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  if (/^(https?:)?\/\//.test(logoUrl) || logoUrl.startsWith('data:')) return logoUrl;
  return `/api/storage/o/${logoUrl.replace(/^\/+/, '')}`;
}
