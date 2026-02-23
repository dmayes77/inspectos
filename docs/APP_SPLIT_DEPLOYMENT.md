# Public + App Split Deployment

This repo now supports operational separation:

- `apps/public` = marketing/public website
- `apps/dashboard` = authenticated dashboard app
- `apps/platform` = internal platform administration app
- `apps/api` = API
- `apps/mobile` = mobile client

## Recommended domains

- Public site: `inspectos.co`
- Dashboard app: `app.inspectos.co`
- Platform admin: `platform.inspectos.co`
- API: `api.inspectos.co`

## Vercel project roots

- Public project root: `apps/public`
- Dashboard project root: `apps/dashboard`
- Platform project root: `apps/platform`
- API project root: `apps/api`

## Environment variables

### apps/dashboard (dashboard)

- `PUBLIC_SITE_URL=https://inspectos.co`
- `PLATFORM_SITE_URL=https://platform.inspectos.co`
- Existing app variables (`NEXT_PUBLIC_API_URL`, Supabase keys, etc.)

Notes:
- `apps/dashboard` redirects `/`, `/pricing`, and `/data-charter` to `PUBLIC_SITE_URL`.
- `apps/dashboard` redirects `/platform*` to `PLATFORM_SITE_URL`.

### apps/public (marketing)

- `NEXT_PUBLIC_DASHBOARD_URL=https://app.inspectos.co`

Notes:
- Public CTAs (Sign in/Get started/Register) use `NEXT_PUBLIC_DASHBOARD_URL`.

### apps/platform (internal platform admin)

- `NEXT_PUBLIC_API_URL=https://api.inspectos.co/api` (if/when platform UI calls API routes)
- Platform auth/admin secrets as needed when implemented

## Local development

- Dashboard: `pnpm dev:web` (port 3000)
- Public: `pnpm dev:public` (port 3001)
- Platform: `pnpm dev:platform` (port 3002)
- API: `pnpm dev:api` (port 4000)
