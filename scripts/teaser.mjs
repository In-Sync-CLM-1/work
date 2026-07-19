// Work-Sync teaser — v2 "1 main + 3 subsets" (approved storytelling standard).
// Built ENTIRELY from surviving walkthrough slices + guest title cards (backend
// parked — no live app, no login).
//   MAIN    — task management where the chasing does itself
//   SUBSET 1 — assign it, everyone knows (WhatsApp + email in seconds)
//   SUBSET 2 — status without asking (one live screen, AI flags risk)
//   SUBSET 3 — done means confirmed (assigner reviews and signs off)
// Hook names pain + product first; three numbered chapters; close restates
// main + subsets + price + real self-serve trial CTA. Nothing else.
import { ACCT } from './lib/scene.mjs';

const HOOK_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1366px;height:768px;font-family:'Segoe UI',Arial,sans-serif;background:radial-gradient(120% 120% at 20% 0%,#1c1033 0%,#120b20 55%,#0a0613 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff}
  .kicker{font-size:19px;font-weight:700;color:#a78bfa;letter-spacing:3px;text-transform:uppercase}
  h1{font-size:58px;font-weight:800;letter-spacing:-1.5px;line-height:1.16;max-width:86%;margin-top:22px}
  .sub{font-size:26px;font-weight:400;color:rgba(255,255,255,.78);margin-top:26px;max-width:72%;line-height:1.45}
</style></head><body>
  <div class="kicker">Work-Sync &middot; Task Management</div>
  <h1>You gave the task.<br>Do you know if it&rsquo;s done?</h1>
  <div class="sub">Work-Sync runs the chasing — assign, track, confirm.</div>
</body></html>`;

const CLOSE_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1366px;height:768px;font-family:'Segoe UI',Arial,sans-serif;background:radial-gradient(120% 120% at 20% 0%,#1c1033 0%,#120b20 55%,#0a0613 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff}
  .kicker{font-size:19px;font-weight:700;color:#a78bfa;letter-spacing:3px;text-transform:uppercase}
  h1{font-size:54px;font-weight:800;letter-spacing:-1.5px;line-height:1.16;margin-top:16px}
  .grid{display:grid;grid-template-columns:1fr 1fr;margin-top:32px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden}
  .grid .l{font-size:21px;font-weight:400;color:rgba(255,255,255,.5);padding:13px 26px;text-align:right;display:flex;align-items:center;justify-content:flex-end}
  .grid .r{font-size:21px;font-weight:600;color:#b9a5f8;padding:13px 26px;text-align:left;border-left:1px solid rgba(255,255,255,.15);display:flex;align-items:center}
  .price{font-size:23px;font-weight:600;color:rgba(255,255,255,.92);margin-top:30px}
  .cta{font-size:25px;font-weight:500;color:rgba(255,255,255,.85);margin-top:12px}
</style></head><body>
  <div class="kicker">Work-Sync</div>
  <h1>You assign. It chases.<br>Done means done.</h1>
  <div class="grid">
    <div class="l">"I didn&rsquo;t know about it"</div><div class="r">Owner knows in seconds &middot; WhatsApp + email</div>
    <div class="l">Status: calls and group scrolls</div><div class="r">One live screen, AI-flagged</div>
    <div class="l">"Done"&hellip; but is it?</div><div class="r">Assigner reviews and signs off</div>
  </div>
  <div class="price">From &#8377;199 per user / month &middot; workspace live in under a minute</div>
  <div class="cta">work.in-sync.co.in &middot; 14-day free trial, no card &middot; or book a demo</div>
</body></html>`;

export const SCENES = [

// 0 — hook: pain + product named up front
{
  name: 'w0-hook', account: ACCT.guest,
  narration: "You gave the task. Do you know if it's done? Work-Sync makes sure — it runs the chasing for you.",
  beats: async ({ page, D, ready }) => {
    await page.setContent(HOOK_HTML, { waitUntil: 'load' });
    const waitUntil = await ready(300);
    await waitUntil(D);
  },
},

// 1 — SUBSET 1: assign it, everyone knows (slice: create + notify)
{
  name: 'w1-assign', slice: { src: 's3-create-v.mp4', from: 4 },
  narration: "One — assign it, and everyone knows. The owner hears on WhatsApp and email within seconds. No task starts life unseen.",
},

// 2a — SUBSET 2: status without asking (slice: dashboard)
{
  name: 'w2a-dashboard', slice: { src: 's1-dashboard-v.mp4', from: 2 },
  narration: "Two — status without asking. One live screen: what's moving, what's stuck, who owns it.",
},

// 2b — …and the AI flags the risk (slice: insights)
{
  name: 'w2b-insights', slice: { src: 's2-insights-v.mp4', from: 2 },
  narration: "The AI flags overdue risk and overload — your manager just decides.",
},

// 3 — SUBSET 3: done means confirmed (slice: complete + review)
{
  name: 'w3-done', slice: { src: 's6-complete-v.mp4', from: 2 },
  narration: "Three — done means confirmed. Finished work goes back to the assigner to review, rate, and sign off. No status meetings.",
},

// 4 — close: restate main + subsets, price, real trial CTA
{
  name: 'w4-close', account: ACCT.guest,
  narration: "That's Work-Sync: you assign, it chases, and done means done. From one ninety-nine per user a month, live in under a minute. Start your free trial at work dot in-sync dot co dot in — or book a demo.",
  beats: async ({ page, D, ready }) => {
    await page.setContent(CLOSE_HTML, { waitUntil: 'load' });
    const waitUntil = await ready(300);
    await waitUntil(D);
  },
},

];
