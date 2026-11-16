# Univybe Dashboard

Internal admin dashboard showing Univybe's Neon data: users, revenue (Leones), vybecoins and courses.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL`: connection string for the **read-only `dashboard_ro` role** on a **Neon read replica**. Leave it empty to run on clearly labelled demo data.
   - `DASHBOARD_PASSWORD`: the shared admin password.
   - `SESSION_SECRET`: 32+ random characters.
3. `npm run dev`, then open http://localhost:3000

## Where things live

| What | Where |
|---|---|
| All SQL (one file; schema assumptions documented at the top) | `src/lib/data/sql.ts` |
| Demo data used when `DATABASE_URL` is empty | `src/lib/data/demo.ts` |
| Vybecoin rate, cents vs whole Leones, completion-rate age cutoff | `src/lib/config.ts` |
| Brand colours (light and dark) | `src/app/globals.css` |
| Login, session, rate limit | `src/app/login/`, `src/lib/session.ts`, `src/lib/rate-limit.ts`, `src/proxy.ts` |

Data is fetched fresh on every page load. The "Update data" button re-fetches without reloading the page.

## Deploying to Vercel

Set the same three environment variables in the Vercel project settings.
