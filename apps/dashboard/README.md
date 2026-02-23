This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Logo.dev integration

Company logos and the partner lookup tool are powered by [Logo.dev](https://logo.dev).

Add the following environment variables to `apps/web/.env.local`:

```
NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY=pk_...
LOGO_DEV_SECRET_KEY=sk_...
```

- `NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` is appended to `https://img.logo.dev` requests on the client for optimized, lazy‑loaded images in multiple formats.
- `LOGO_DEV_SECRET_KEY` authenticates the Brand Search API (`https://api.logo.dev/search`) used by the “Profile URL Importer” agency lookup card.

After updating the environment, restart `pnpm dev` so Next.js can pick up the new values.
