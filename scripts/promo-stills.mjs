// Capture crisp module stills for the Work-Sync promo.
//   node scripts/promo-stills.mjs
// Read-only: logs in as the demo admin (Priya) and screenshots each module.
// Never clicks a lifecycle control — those fire real notifications.
import { chromium } from 'playwright';
import { loadEnv } from './lib/env.mjs';
import { BASE, login } from './lib/app.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const env = loadEnv(new URL('../.env', import.meta.url));
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'remotion-promo', 'public', 'ui');
mkdirSync(out, { recursive: true });

const VP = { width: 1600, height: 1000 };
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await login(page, 'priya@in-sync.co.in', env.WS_ADMIN_PASSWORD);
console.log('logged in as admin');

const shot = async (name, url, settle = 2400) => {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(settle);
  await page.mouse.move(2, 2);          // keep hover states out of the frame
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log('  shot', name, '<-', url);
};

await shot('dashboard', '/dashboard', 3000);
await shot('tasks', '/tasks', 3000);
await shot('team', '/users', 2600);


// Board and Timeline are view toggles on the same route, not separate URLs.
const view = async (name, label) => {
  await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: label }).click();
  await page.waitForTimeout(2600);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log('  shot', name, '<- /tasks', label);
};
await view('board', /^Board$/);
await view('timeline', /^Timeline$/);

// Task detail: click through from the list rather than hard-coding an id, so
// this keeps working as the demo data changes. View only — never touch a
// lifecycle button, those fire real notifications.
await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText(/API rate limiting implementation/i).first().click().catch(() => {});
await page.waitForTimeout(3000);
if (/\/tasks\/[0-9a-f-]{8,}/.test(page.url())) {
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, 'detail.png') });
  console.log('  shot detail <-', page.url());
} else {
  console.log('  WARN task detail did not open, at', page.url());
}

await browser.close();
console.log('done ->', out);
