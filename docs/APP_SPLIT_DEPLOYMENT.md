# Public + App Split Deployment

This repo now supports operational separation:

- `apps/public` = marketing/public website
- `apps/dashboard` = authenticated dashboard app
- `apps/server` = API
- `apps/mobile` = mobile client

## Recommended domains

- Public site: `inspectos.co`
- Dashboard app: `app.inspectos.co`
- API: `api.inspectos.co`

## Vercel project roots

- Public project root: `apps/public`
- Dashboard project root: `apps/dashboard`
- API project root: `apps/server`

## Environment variables

### apps/dashboard (dashboard)

- `PUBLIC_SITE_URL=https://inspectos.co`
- Existing app variables (`NEXT_PUBLIC_API_URL`, Supabase keys, etc.)

Notes:
- `apps/dashboard` redirects `/`, `/pricing`, and `/data-charter` to `PUBLIC_SITE_URL`.

### apps/public (marketing)

- `NEXT_PUBLIC_DASHBOARD_URL=https://app.inspectos.co`

Notes:
- Public CTAs (Sign in/Get started/Register) use `NEXT_PUBLIC_DASHBOARD_URL`.

## Local development

- Dashboard: `pnpm dev:web` (port 3000)
- Public: `pnpm dev:public` (port 3001)
- API: `pnpm dev:server` (port 4000)
