// Shared helper: discover every Supabase management token across the fleet and
// map project name -> { ref, token, sql() }.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const tokens = new Set();
for (const d of readdirSync('C:/Users/Admin', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const p = `C:/Users/Admin/${d.name}/.env`;
  if (!existsSync(p)) continue;
  try {
    for (const l of readFileSync(p, 'utf8').split('\n')) {
      const m = l.match(/^\s*SUPABASE_ACCESS_TOKEN\s*=\s*(.*)$/);
      if (m) { const v = m[1].trim().replace(/^["']|["']$/g, ''); if (v.startsWith('sbp_')) tokens.add(v); }
    }
  } catch { /* unreadable */ }
}

const call = async (token, path, init = {}) => {
  const r = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'curl/8', 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};

const byRef = new Map();
for (const t of tokens) {
  try { for (const p of await call(t, '/projects')) if (!byRef.has(p.ref)) byRef.set(p.ref, { ...p, token: t }); }
  catch { /* token cannot list */ }
}

export const projects = new Map(
  [...byRef.values()].map((p) => [
    p.name.toLowerCase(),
    { ...p, sql: (q) => call(p.token, `/projects/${p.ref}/database/query`, { method: 'POST', body: JSON.stringify({ query: q }) }) },
  ]),
);

export const project = (name) => {
  const p = projects.get(name.toLowerCase());
  if (!p) throw new Error(`project ${name} not reachable with any known token`);
  return p;
};
