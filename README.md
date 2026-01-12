# InspectOS

Enterprise-grade SaaS platform for home inspection businesses. Multi-tenant architecture supporting solo inspectors to multi-inspector firms.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Auth**: NextAuth.js v5 (JWT strategy)
- **Database**: PostgreSQL (Neon) + Prisma 7
- **State**: React Query + Zustand
- **Native**: Capacitor (iOS, Android, PWA)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (or Neon account)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and secrets

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run lint           # Run ESLint
npx prisma studio   # Open Prisma Studio (database GUI)
```

## Native Apps (Capacitor)

```bash
# Build and sync to native projects
npm run build
npx cap sync

# Open in native IDEs
npx cap open ios     # Requires Xcode
npx cap open android # Requires Android Studio
```

## Project Structure

```
src/
├── app/                # Next.js App Router
│   ├── (public)/      # Marketing pages
│   ├── (auth)/        # Auth flows
│   ├── (app)/         # Authenticated routes
│   │   ├── admin/     # Desktop-dense admin UI
│   │   └── inspector/ # Mobile-first inspector UI
│   └── api/           # API routes
├── components/
│   ├── ui/            # shadcn/ui components
│   └── layout/        # Shell layouts
├── hooks/             # React Query hooks
├── lib/               # Utilities, auth, db
├── services/          # Capacitor native services
└── types/             # TypeScript types
```

## Environment Variables

```bash
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://...

# Optional (OAuth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe (when ready)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

## License

Proprietary - All rights reserved.
