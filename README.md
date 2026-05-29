# In-Sync Work-Sync

Hierarchical task accountability with WhatsApp + email alerts at every step — built for how Indian teams actually work. You assign a task; the platform tracks it through every level of your designation hierarchy until it's done, accepted, and signed off.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS (PWA via vite-plugin-pwa)
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **Hosting:** Cloudflare Pages
- **Notifications:** Resend (email), Exotel (WhatsApp)

## Local Development

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs to dist/
npm run lint
```

`.env` (gitignored) must contain at minimum:

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

For deploys, also include:

```env
CLOUDFLARE_API_TOKEN=cfut_...
CLOUDFLARE_ACCOUNT_ID=...
GITHUB_TOKEN=ghp_...
GITHUB_REPO_URL=https://github.com/In-Sync-CLM-1/work.git
```

Only values prefixed `VITE_` are inlined into the browser bundle. Anything that grants write access (service role key, sbp_ token, Cloudflare API token, GitHub token) must NOT be prefixed `VITE_`.

## Deploy — Frontend (Cloudflare Pages)

The frontend ships directly from a local working tree using Wrangler. There is no GitHub Actions step for the frontend; pushing code does not deploy it.

```powershell
npm run build
Set-Content -Path dist\_redirects -Value "/*  /index.html  200"
wrangler pages deploy dist --project-name=work-sync --branch=main
```

The Cloudflare Pages project is `work-sync`, served at `https://work-sync.pages.dev`. The custom domain `work.in-sync.co.in` points at it via a proxied CNAME on the `in-sync.co.in` zone.

## Deploy — Supabase (CI)

Migrations and edge functions deploy automatically on push to `main` when files under `supabase/**` change. See `.github/workflows/supabase-deploy.yml`.

Required GitHub Actions secrets:

- `SUPABASE_ACCESS_TOKEN` (`sbp_…`)
- `SUPABASE_DB_PASSWORD`
- `VITE_SUPABASE_PROJECT_ID`

## Custom Domain

Production: `https://work.in-sync.co.in`

DNS is managed in Cloudflare; the record is a proxied CNAME pointing at `work-sync.pages.dev`.

## Rollback

Forward-rollback (bad new deploy, Pages itself fine): use the Cloudflare Pages dashboard to roll back to a previous deployment of `work-sync`.

Full rollback to Azure (only viable while the legacy SWA still exists): PATCH the production CNAME back to the Azure target via the Cloudflare API.
