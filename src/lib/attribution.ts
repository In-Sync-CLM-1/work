/**
 * Marketing attribution capture.
 *
 * Google Ads appends ?gclid=... (and we add utm_* params) to the landing URL.
 * We stash them on first arrival so they survive navigation, then attach them
 * to a demo request. The gclid is what lets the CRM later report a qualified
 * lead back to Google Ads as an offline conversion so the campaign can optimise.
 */

const KEY = 'ws_attribution';

export interface Attribution {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_url?: string;
}

/** Read attribution params from the current URL and persist them (once). */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: Attribution = {};
    const gclid = params.get('gclid');
    if (gclid) incoming.gclid = gclid;
    (['utm_source', 'utm_medium', 'utm_campaign'] as const).forEach((k) => {
      const v = params.get(k);
      if (v) incoming[k] = v;
    });
    // Nothing new on this URL — keep whatever we captured earlier in the session.
    if (Object.keys(incoming).length === 0) return;
    incoming.landing_url = window.location.href;
    localStorage.setItem(KEY, JSON.stringify(incoming));
  } catch {
    /* localStorage blocked / private mode — attribution is best-effort */
  }
}

/** Get the stored attribution (empty object if none). */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Attribution;
  } catch {
    return {};
  }
}
