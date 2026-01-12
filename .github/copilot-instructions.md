# Copilot / AI Agent Instructions — InspectOS

Be concise and make minimal, local changes. Follow existing conventions exactly; avoid broad refactors.

## Quick overview

- Next.js 16 App Router (server + client components). Frontend + API routes live under `src/app`.
- Multi-tenant SaaS: tenant is derived from the authenticated user's session and enforced at DB layer (`src/lib/db.ts`).
- Auth: NextAuth (JWT) helpers live in `src/lib/auth.ts` (`auth()`, `getCurrentUser()`, `requireAuth()`).
- Native features via Capacitor: services exported from `src/services` (camera, storage, geolocation, network).

## What to change and where

- API route pattern: use `auth()` to get session, then `prisma` (or `withTenant(session.user.companyId)` for tenant-scoped queries). Example: see `app/api/*/route.ts` and `src/lib/auth.ts`.
- Use React Query for server interaction; hooks live in `src/hooks` and follow the pattern in `CLAUDE.md` (queryKey, fetch from `/api/...`).
- For DB writes/reads that must be tenant-aware, prefer `withTenant(companyId)` from `src/lib/db.ts` rather than manually adding `companyId` everywhere.

## Project conventions (non-negotiable)

- TypeScript strictness: no `any`, explicit types where helpful.
- Filenames: kebab-case for components and pages (e.g. `inspection-list.tsx`).
- Component style: functional components with hooks only. PascalCase for component names.
- Imports: absolute `@/` alias for internal imports. Order imports external → internal → relative.
- Styling: Tailwind v4 utilities and shadcn/ui primitives. No inline styles.
- Forms: React Hook Form + Zod for validation.

## Examples & important files

- Tenant-aware DB helper: `src/lib/db.ts` — use `withTenant(companyId)` to get a Prisma client that auto-filters models like `Inspection`, `Client`, `Property`.
- Auth helpers: `src/lib/auth.ts` — use `auth()` in server components or route handlers; `getCurrentUser()` for user props.
- Services: `src/services/index.ts` re-exports native helpers. Use `capturePhoto()` / `pickFromGallery()` (`src/services/camera.ts`) and storage helpers (`src/services/storage.ts`).
- Prisma schema: located at `prisma/schema.prisma`. Use `npx prisma generate` and `npx prisma db push` when altering schema.

## Scripts & workflows

- Dev: `npm install` then `npm run dev` (from project root).
- Build (web): `npm run build` then `next build` is invoked by the script. For native (Capacitor): `npm run build` → `npx cap sync` → `npx cap open ios|android`.
- Prisma: `npx prisma generate`, `npx prisma db push`, `npx prisma studio`.

## Testing and linting

- Linting: run `npm run lint` (ESLint). Respect existing ESLint rules (`eslint.config.mjs`).
- There are no unit-test frameworks present in the repo root; do not add heavy test infra without approval.

## What NOT to do

- Don't change global app layout or unrelated modules while implementing a focused fix.
- Don't introduce new runtime dependencies without justification (discuss first).
- Don't use `console.log` for production code; prefer proper error handling and `sonner` for user-facing toasts.

## When in doubt / examples to follow

- Follow the code patterns in `src/lib/auth.ts`, `src/lib/db.ts`, `src/services/*`, and `CLAUDE.md` for naming, API, and architecture rationale.

---

If anything here is unclear or you want this expanded (examples, more file links, or policy changes), tell me what to add or adjust.

## Extra repo-specific notes (from system overview & pricing)

- Capacitor is iOS-first: native project and build targets are iOS-only (see `/ios` and `capacitor.config.ts`). Android is not built by default.
- Tailwind breakpoint: minimum `md` is 810px (iPad-first). See `tailwind.config.ts` for responsive rules; admin UI is desktop-dense.
- Offline-first sync: inspector flows use Zustand stores + Capacitor SQLite + filesystem. Key files: `src/stores/*`, `src/services/sync.ts`, `src/services/storage.ts`.
- Photos & PDFs stored in Cloudflare R2; reports reference `pdfUrl` in `prisma` `Report` model. Report access uses a signed `accessToken` (env: `REPORT_SECRET`).
- Billing & payments: Stripe Connect (per-company connected accounts). See `src/lib/stripe.ts` and the pricing doc for product IDs (`inspectos_pro`, `inspectos_team`, `inspectos_business`, `inspectos_seat`).
- Trial & billing behavior: 30-day trial (no card required). Subscription schema and logic live in Prisma and Stripe helpers (`src/lib/subscription.ts`).
