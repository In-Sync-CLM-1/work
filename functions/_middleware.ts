// task.in-sync.co.in exists for one reason: the approved WhatsApp template
// `worksync_task_notification` hardcodes it in its "Open Task" button, and Meta
// will not edit an approved URL in place. The hostname is attached to this
// Pages project so those links resolve at all.
//
// It forwards rather than serving the app, because a browser session belongs to
// one hostname: serving Work-Sync on a second host would ask someone who is
// already signed in on work.in-sync.co.in to sign in again, and would register
// a second service worker for the same PWA.
//
// 302, not 301 -- a permanent redirect sticks in every employee's browser cache
// and is painful to undo if this hostname is ever repurposed.

const ALIAS_HOST = 'task.in-sync.co.in';
const CANONICAL_ORIGIN = 'https://work.in-sync.co.in';

export const onRequest: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    if (url.hostname === ALIAS_HOST) {
      return Response.redirect(`${CANONICAL_ORIGIN}${url.pathname}${url.search}`, 302);
    }
  } catch (err) {
    // This runs in front of every request, so it must never be the reason the
    // site is down. Anything unexpected falls through to normal serving.
    console.error('alias redirect middleware:', err);
  }

  return context.next();
};
