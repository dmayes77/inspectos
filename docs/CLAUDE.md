# InspectOS

Enterprise-grade SaaS platform for home inspection businesses. Multi-tenant architecture supporting solo inspectors to multi-inspector firms.

---

## Tech Stack

| Layer      | Technology              | Notes                                 |
| ---------- | ----------------------- | ------------------------------------- |
| Framework  | Next.js 16 (App Router) | Static export for Capacitor, React 19 |
| Styling    | Tailwind CSS v4         | CSS-based config, shadcn/ui theming   |
| Components | shadcn/ui + Radix       | Accessible, customizable primitives   |
| Auth       | NextAuth.js v5          | JWT strategy, Credentials + OAuth     |
| Database   | PostgreSQL (Neon)       | Serverless, Prisma 7 ORM              |
| State      | React Query + Zustand   | Server + client state                 |
| Forms      | React Hook Form + Zod   | Validation                            |
| Icons      | Lucide React            | Consistent iconography                |
| Payments   | Stripe                  | Subscriptions + Connect               |
| Native     | Capacitor               | iOS, Android, PWA                     |

---

## Claude Directives

### Code Style

- **TypeScript**: Strict mode, explicit types, no `any`
- **Components**: Functional components with hooks, no class components
- **Naming**: PascalCase components, camelCase functions/variables, SCREAMING_SNAKE_CASE constants
- **Files**: kebab-case filenames (e.g., `inspection-list.tsx`)
- **Imports**: Absolute imports via `@/` alias, group by external → internal → relative
- **Comments**: Only when logic isn't self-evident. No obvious comments.

### What NOT to Do

- Don't add features beyond what's requested
- Don't refactor unrelated code while fixing bugs
- Don't add excessive error handling for impossible scenarios
- Don't create abstractions for one-time operations
- Don't add comments, docstrings, or type annotations to unchanged code
- Don't use `console.log` in production code
- Don't use inline styles — use Tailwind classes

### Architecture Principles

- **Colocation**: Keep related files together (component + tests)
- **Single Responsibility**: One component = one purpose
- **Composition over Inheritance**: Build complex UI from simple primitives
- **Server State**: React Query for all server data
- **Client State**: Zustand for UI state, React context sparingly
- **Forms**: React Hook Form + Zod validation

---

## File Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (public)/            # Public routes (marketing, booking, reports)
│   ├── (auth)/              # Login, register, invite
│   ├── admin/               # Admin/office dashboard
│   ├── inspector/           # Inspector mobile-first routes
│   ├── platform/            # Platform admin (future)
│   └── api/                 # API route handlers
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   └── layout/              # Shell layouts (admin, inspector, public)
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and services
├── services/                # Native device services (Capacitor)
├── stores/                  # Zustand stores
└── types/                   # TypeScript type definitions
```

---

## Role-Based Layouts

### Inspector Shell (`/inspector/*`)

- Mobile-first, touch-optimized
- Bottom navigation bar
- Swipe gestures, large tap targets
- Offline-capable
- Quick photo capture

### Admin Shell (`/admin/*`)

- Desktop-dense, keyboard-friendly
- Collapsible sidebar navigation
- Data tables, filters, bulk actions
- Full feature access

### Public Shell (`/`)

- Marketing pages, auth flows
- Simple header/footer
- Responsive

---

## Multi-Tenant Architecture

### Tenant Isolation

- **URL Pattern**: Path-based `/dashboard` (no subdomains)
- **Tenant Context**: Derived from authenticated user's session via NextAuth
- **Isolation**: Prisma middleware filters all queries by `companyId`

### User-Organization Relationship

One user = one organization (MVP). If an inspector works for two companies, they create two accounts.

---

## User Roles & Permissions

| Role         | Description                                              |
| ------------ | -------------------------------------------------------- |
| OWNER        | Full access, billing, can delete org                     |
| ADMIN        | Full access except billing and org deletion              |
| INSPECTOR    | Own inspections, assigned work, field operations         |
| OFFICE_STAFF | Scheduling, clients, estimates, invoices — no field work |

---

## Database Schema (Key Models)

```
Company → Users, Clients, Properties, Inspections, Templates, Agreements
User → Inspections (assigned), role-based access
Client → Properties, Inspections
Property → Inspections
Inspection → Rooms, SystemChecks, Defects, Photos, Report, Agreement
Template → Sections (for inspection checklists)
Agreement → Signatures
```

---

## API Patterns

### Route Handler Structure

```typescript
// app/api/example/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.example.findMany({
    where: { companyId: session.user.companyId },
  });

  return Response.json({ data });
}
```

### React Query Hook Pattern

```typescript
// hooks/use-example.ts
import { useQuery } from "@tanstack/react-query";

export function useExample() {
  return useQuery({
    queryKey: ["example"],
    queryFn: async () => {
      const res = await fetch("/api/example");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}
```

---

## Capacitor (Native)

### Camera Service

Located at `src/services/camera.ts`:

- `capturePhoto()` - Take photo with camera
- `pickFromGallery()` - Select from photo library
- `checkCameraPermissions()` / `requestCameraPermissions()`

### Building for Native

```bash
pnpm build          # Build Next.js static export
npx cap sync        # Sync to native projects
npx cap open ios    # Open in Xcode
npx cap open android # Open in Android Studio
```

---

## Environment Variables

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://...

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

---

## Development Commands

```bash
 npm run dev            # Start development server
 npm run build          # Production build
 npm run lint           # Run ESLint
 npx prisma generate # Generate Prisma client
 npx prisma db push  # Push schema to database
 npx prisma studio   # Open Prisma Studio
```

---

## Styling with Tailwind v4

This project uses Tailwind CSS v4 with CSS-based configuration in `globals.css`.

### Theme Variables

Colors, radii, and other tokens are defined in `:root` and `.dark` selectors using CSS custom properties with OKLCH color space.

### Component Styling

Use Tailwind utility classes. For complex component variants, use `class-variance-authority` (CVA) as seen in shadcn/ui components.

```typescript
import { cn } from "@/lib/utils";

// Merge classes conditionally
<div className={cn("base-class", isActive && "active-class")} />;
```
