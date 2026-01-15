}
```

---

## 8. Breakpoint Strategy

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      // No 'sm' breakpoint - minimum is iPad portrait
      'md': '810px',    // iPad 10.2" portrait (minimum supported)
      'lg': '1024px',   // iPad landscape / Small laptop
      'xl': '1280px',   // Desktop (admin UI optimal)
      '2xl': '1536px',  // Large desktop
    },
  },
}
```

### Responsive Layout Examples

```typescript
// Inspector UI adapts to orientation
<div className="flex flex-col md:flex-row">
  {/* Sidebar - stacked on portrait, side-by-side on landscape */}
  <aside className="w-full md:w-64 lg:w-80">
    {/* Room list */}
  </aside>
  
  {/* Main content */}
  <main className="flex-1">
    {/* Annotation canvas */}
  </main>
</div>

// Admin UI is desktop-only, no mobile breakpoints needed
<div className="grid grid-cols-3 gap-6">
  <StatsCard />
  <StatsCard />
  <StatsCard />
</div>
```

---

## 9. State Management

```
/stores (Zustand)
├── auth-store.ts              User session, role, company
├── inspection-store.ts        Current inspection state
├── photo-store.ts             Photo queue, annotations
├── sync-store.ts              Pending sync items, status
└── ui-store.ts                Modals, sheets, toasts
```

### Offline-First Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      INSPECTOR DEVICE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   USER ACTION                                                   │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Zustand   │───▶│  Capacitor  │───▶│  Capacitor  │        │
│   │   Store     │    │   SQLite    │    │  Filesystem │        │
│   │ (UI state)  │    │ (data)      │    │  (photos)   │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│        │                    │                   │               │
│        │                    └─────────┬─────────┘               │
│        │                              │                         │
│        │                              ▼                         │
│        │                    ┌─────────────────┐                 │
│        │                    │   Sync Queue    │                 │
│        │                    │ (pending items) │                 │
│        │                    └────────┬────────┘                 │
│        │                             │                          │
│        │              ┌──────────────┴──────────────┐           │
│        │              │                             │           │
│        │         OFFLINE                        ONLINE          │
│        │              │                             │           │
│        │              ▼                             ▼           │
│        │      Queue grows               Sync to server          │
│        │                                            │           │
└────────┼────────────────────────────────────────────┼───────────┘
         │                                            │
         │                                            ▼
         │                               ┌─────────────────────┐
         │                               │   VERCEL + NEON     │
         │                               │   /api/sync         │
         │                               │   PostgreSQL        │
         │                               │   Cloudflare R2     │
         │                               └─────────────────────┘
         │
         ▼
    UI UPDATES INSTANTLY
    (optimistic updates)
```

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUILD PIPELINE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /inspectos (source)                                           │
│        │                                                        │
│        ├──────────────────┬─────────────────────────────────┐   │
│        │                  │                                 │   │
│        ▼                  ▼                                 ▼   │
│   ┌─────────┐      ┌─────────────┐                 ┌───────────┐│
│   │ Vercel  │      │ Capacitor   │                 │ Not Built ││
│   │ Build   │      │ iOS Build   │                 │ (Android  ││
│   └────┬────┘      └──────┬──────┘                 │  skipped) ││
│        │                  │                         └───────────┘│
│        ▼                  ▼                                     │
│   ┌─────────┐      ┌─────────────┐                             │
│   │ Vercel  │      │ App Store   │                             │
│   │ Edge    │      │ Connect     │                             │
│   └─────────┘      └─────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     RUNTIME                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   USERS                                                         │
│     │                                                           │
│     ├─── Web Browser ──────────▶ Vercel (PWA)                   │
│     │                                                           │
│     └─── iPad App ─────────────▶ Capacitor WebView ─┐           │
│                                                     │           │
│                                                     ▼           │
│                                          ┌─────────────────┐    │
│                                          │ Vercel API      │    │
│                                          │ (Next.js)       │    │
│                                          └────────┬────────┘    │
│                                                   │             │
│                    ┌──────────────┬───────────────┼─────────┐   │
│                    │              │               │         │   │
│                    ▼              ▼               ▼         ▼   │
│              ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌───────┐ │
│              │   Neon   │  │    R2    │  │  Stripe  │ │Resend │ │
│              │ Postgres │  │  Photos  │  │ Payments │ │ Email │ │
│              └──────────┘  └──────────┘  └──────────┘ └───────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Design System

### Color Palette

```
BRAND
├── Primary:     Slate 900    #0f172a     (text, headers)
├── Secondary:   Slate 600    #475569     (secondary text)
├── Accent:      Orange 500   #f97316     (CTAs, highlights)
├── Success:     Emerald 500  #10b981     (passed items)
├── Warning:     Amber 500    #f59e0b     (attention needed)
├── Danger:      Red 500      #ef4444     (defects, errors)

SURFACES
├── Background:  White        #ffffff     (primary bg)
├── Surface:     Slate 50     #f8fafc     (cards, inputs)
├── Border:      Slate 200    #e2e8f0     (dividers)

INSPECTOR MODE (high contrast for outdoor)
├── Background:  Slate 950    #020617     (dark mode)
├── Text:        Slate 50     #f8fafc
├── Accent:      Orange 400   #fb923c     (brighter for visibility)
```

### Typography

```
FONT: Inter (or Geist)

SCALE
├── xs:    12px / 16px    Labels, captions
├── sm:    14px / 20px    Secondary text
├── base:  16px / 24px    Body text
├── lg:    18px / 28px    Large body
├── xl:    20px / 28px    Card titles
├── 2xl:   24px / 32px    Section headers
├── 3xl:   30px / 36px    Page titles
├── 4xl:   36px / 40px    Hero text

WEIGHTS
├── Regular:  400         Body text
├── Medium:   500         Emphasis
├── Semibold: 600         Buttons, headers
├── Bold:     700         Strong emphasis
```

### Spacing & Sizing

```
INSPECTOR UI (iPad-optimized)
├── Button height:       44px minimum
├── Input height:        44px minimum
├── Tap target:          44px × 44px minimum
├── Card padding:        16px
├── Section gap:         24px

ADMIN UI (dense)
├── Button height:       36px
├── Input height:        36px
├── Table row:           48px
├── Card padding:        16px
├── Section gap:         16px

RADIUS
├── sm:   4px            Inputs, small buttons
├── md:   8px            Cards, large buttons
├── lg:   12px           Modals, slide panels
├── full: 9999px         Pills, avatars
```

---

## 12. Key User Flows

### Inspector: Complete an Inspection

```
1. Open app → See today's jobs (/jobs)
2. Tap job → See property details (/jobs/123)
3. Tap "Start Inspection" → Room list (/jobs/123/rooms)
4. Tap room → Room inspection view (/jobs/123/rooms/456)
5. For each item:
   a. Check status (good/defect/not present)
   b. If defect: tap to add details
   c. Capture photo → annotate with Apple Pencil → tag
6. Swipe to next room (or tap back)
7. When done → Review screen (/jobs/123/review)
8. Generate draft PDF (on-device)
9. Walk through with client on iPad
10. Mark complete → Sync when online
```

### Admin: Manage Daily Operations

```
1. Login → Dashboard (/overview)
   - Today's inspections
   - Revenue this week
   - Pending reports
2. Click inspection → Full details (/inspections/123)
   - Photos, defects, status
   - Generate/regenerate report
   - Send to client
3. ⌘K → Quick search
   - Find any inspection, client, inspector
4. Bulk actions
   - Select multiple → Send reminders
   - Export to CSV
```

### Client: Book and View Report

```
1. Visit /book/acme-inspections
2. Select service → Pick date/time → Enter address
3. Pay deposit → Confirmation email
4. Day of: Inspector completes work
5. Receive email with report link
6. View at /report/abc123
   - Summary of findings
   - Photo evidence
   - Download PDF
7. Pay remaining balance
```

---

## 13. Public Routes: Client Experience

### Booking Flow (`/book/[companySlug]`)

**Who uses it:** Homebuyers, sellers, real estate agents booking an inspection

**Flow:**
```
/book/acme-inspections           → Service selection
/book/acme-inspections/schedule  → Date/time picker
/book/acme-inspections/checkout  → Property details + payment
/book/acme-inspections/confirmed → Confirmation + calendar invite
```

**No account required.** Client provides:
- Name, email, phone
- Property address
- Service type
- Payment (deposit or full)

**Data created:**
- `Client` record (or matched to existing by email)
- `Booking` record
- `Property` record
- `Payment` record (deposit)

#### Step 1: Service Selection (`/book/acme`)

```
┌─────────────────────────────────────────────────────────┐
│  [Acme Home Inspections Logo]                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Book Your Inspection                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏠 Full Home Inspection                         │   │
│  │  Comprehensive inspection of all systems         │   │
│  │  2-3 hours · Starting at $400                   │   │
│  │                                    [Select]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ☢️ Radon Testing                  Add-on $150   │   │
│  │  48-hour continuous monitoring                   │   │
│  │                                    [Add]         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔬 Mold Inspection                Add-on $200   │   │
│  │  Air quality sampling + visual                   │   │
│  │                                    [Add]         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Continue to Scheduling →] │
└─────────────────────────────────────────────────────────┘
```

#### Step 2: Schedule (`/book/acme/schedule`)

```
┌─────────────────────────────────────────────────────────┐
│  [Acme Home Inspections Logo]              Step 2 of 3  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select Date & Time                                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │        January 2026                              │   │
│  │  Su  Mo  Tu  We  Th  Fr  Sa                      │   │
│  │              1   2   3   4                       │   │
│  │   5   6   7   8   9  [10] 11                     │   │
│  │  12  13  14  15  16  17  18                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Available times for Friday, Jan 10:                    │
│                                                         │
│  [8:00 AM]  [9:00 AM]  [10:00 AM]                       │
│  [1:00 PM]  [2:00 PM]                                   │
│                                                         │
│  [← Back]                    [Continue to Checkout →]   │
└─────────────────────────────────────────────────────────┘
```

#### Step 3: Checkout (`/book/acme/checkout`)

```
┌─────────────────────────────────────────────────────────┐
│  [Acme Home Inspections Logo]              Step 3 of 3  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your Information                                       │
│                                                         │
│  Name          [________________________]               │
│  Email         [________________________]               │
│  Phone         [________________________]               │
│                                                         │
│  Property Address                                       │
│  Street        [________________________]               │
│  City          [____________] State [__] Zip [_____]    │
│                                                         │
│  Property Details                                       │
│  Square Feet   [______]  Year Built [______]            │
│  Foundation    [Basement ▼]                             │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Order Summary                                          │
│  Full Home Inspection              $400.00              │
│  Radon Testing                     $150.00              │
│  ────────────────────────────────────────               │
│  Total                             $550.00              │
│  Deposit due today                 $100.00              │
│  Balance due at inspection         $450.00              │
│                                                         │
│  [Card Element - Stripe]                                │
│                                                         │
│  [← Back]                        [Pay $100 Deposit →]   │
└─────────────────────────────────────────────────────────┘
```

#### Step 4: Confirmed (`/book/acme/confirmed`)

```
┌─────────────────────────────────────────────────────────┐
│  [Acme Home Inspections Logo]                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               ✓ Booking Confirmed!                      │
│                                                         │
│  Your inspection is scheduled for:                      │
│                                                         │
│  📅 Friday, January 10, 2026 at 9:00 AM                 │
│  📍 123 Main Street, Dalton, GA 30720                   │
│                                                         │
│  Inspector: John Smith                                  │
│  Phone: (555) 123-4567                                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  What's Next?                                           │
│                                                         │
│  1. Confirmation email sent to david@example.com        │
│  2. Inspector will arrive at scheduled time             │
│  3. Inspection takes 2-3 hours                          │
│  4. Report delivered within 24 hours                    │
│  5. Pay remaining balance ($450) upon delivery          │
│                                                         │
│  [Add to Calendar]    [Download Receipt]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Report View (`/report/[id]`)

**Who uses it:** Client who received the inspection report

#### Access Security

Reports use **magic link** access — a signed token sent to the client's email that expires after 30 days. No account required.

```
https://inspectos.com/report/abc123?token=eyJhbGciOiJIUzI1NiIs...
```

| Accessor | Method | Can View | Can Download | Can Pay |
|----------|--------|----------|--------------|---------|
| Client (with token) | Magic link | ✅ | ✅ | ✅ |
| Client (expired token) | Re-request link | ❌ | ❌ | ❌ |
| Inspector | Logged in | ✅ | ✅ | ❌ |
| Admin | Logged in | ✅ | ✅ | ❌ |
| Public | No token | ❌ | ❌ | ❌ |

#### Token Generation

```typescript
// Generate report access token
function generateReportToken(reportId: string, clientEmail: string): string {
  return jwt.sign(
    { reportId, email: clientEmail, type: 'report_access' },
    process.env.REPORT_SECRET,
    { expiresIn: '30d' }
  )
}

// Middleware validates token
async function validateReportAccess(reportId: string, token: string) {
  try {
    const decoded = jwt.verify(token, process.env.REPORT_SECRET)
    return decoded.reportId === reportId
  } catch {
    return false
  }
}
```

#### Report UI (`/report/abc123`)

```
┌─────────────────────────────────────────────────────────┐
│  [Acme Home Inspections Logo]           [Download PDF]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Inspection Report                                      │
│  123 Main Street, Dalton, GA 30720                      │
│  January 10, 2026 · Inspector: John Smith               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  SUMMARY                                                │
│                                                         │
│  🔴 3 Safety Issues     🟠 8 Defects     🟢 42 Good     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚠️ Safety Issues                                 │   │
│  │                                                  │   │
│  │ • HVAC: Gas leak detected at furnace connection │   │
│  │ • Electrical: Double-tapped breaker in panel    │   │
│  │ • Roof: Missing kick-out flashing at chimney    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  DETAILED FINDINGS                                      │
│                                                         │
│  [Roof] [Exterior] [Electrical] [HVAC] [Plumbing] ...   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Roof                                   3 items  │   │
│  │                                                  │   │
│  │  🔴 Missing kick-out flashing                    │   │
│  │  [Photo with annotation]                         │   │
│  │  Water intrusion risk at chimney-roof junction.  │   │
│  │  Recommend: Install kick-out flashing. Est $200  │   │
│  │                                                  │   │
│  │  🟠 Worn shingles on north slope                 │   │
│  │  [Photo]                                         │   │
│  │  Approximately 5 years remaining life.           │   │
│  │                                                  │   │
│  │  🟢 Gutters and downspouts                       │   │
│  │  Functioning properly, good condition.           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  BALANCE DUE                                            │
│                                                         │
│  Total: $550.00                                         │
│  Deposit paid: -$100.00                                 │
│  ────────────────────                                   │
│  Balance: $450.00                                       │
│                                                         │
│  [Pay $450 Now]                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Sub-routes

| Route | Purpose |
|-------|---------|
| `/report/abc123` | Full detailed report |
| `/report/abc123/summary` | Summary view only (quick reference) |
| `/report/abc123/pay` | Payment page for remaining balance |

---

### Database Models for Public Routes

```prisma
model Client {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  
  email       String
  name        String
  phone       String?
  
  bookings    Booking[]
  properties  Property[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([companyId, email])  // One client record per email per company
}

model Booking {
  id            String        @id @default(cuid())
  companyId     String
  company       Company       @relation(fields: [companyId], references: [id])
  
  clientId      String
  client        Client        @relation(fields: [clientId], references: [id])
  
  propertyId    String
  property      Property      @relation(fields: [propertyId], references: [id])
  
  inspectorId   String?
  inspector     User?         @relation(fields: [inspectorId], references: [id])
  
  scheduledAt   DateTime
  duration      Int           // minutes
  status        BookingStatus // PENDING, CONFIRMED, COMPLETED, CANCELED
  
  services      BookingService[]
  payments      Payment[]
  inspection    Inspection?
  
  notes         String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Report {
  id             String       @id @default(cuid())
  inspectionId   String       @unique
  inspection     Inspection   @relation(fields: [inspectionId], references: [id])
  
  status         ReportStatus // DRAFT, PUBLISHED, DELIVERED
  publishedAt    DateTime?
  deliveredAt    DateTime?
  
  pdfUrl         String?      // R2 URL
  accessToken    String       @unique  // For client access
  tokenExpiresAt DateTime
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELED
}

enum ReportStatus {
  DRAFT
  PUBLISHED
  DELIVERED
}
```

---

## 14. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Primitives | shadcn/ui (Radix) |
| State | Zustand |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| Native | Capacitor (iOS only) |
| Offline DB | Capacitor SQLite |
| Storage | Cloudflare R2 |
| Images | Cloudflare Images |
| Payments | Stripe Connect |
| Email | Resend |
| PDF | React-PDF |
| Hosting | Vercel |

---

## 15. Database Schema (High-Level)

### Core Entities

```
Company (tenant)
├── Users (inspectors, admins)
├── Clients (receive reports)
├── Services (pricing)
├── Templates (report customization)
├── CompanySettings (branding)
└── Subscription (SaaS billing)

Property
└── Inspections
    ├── Booking
    ├── Invoice/Payments
    ├── Rooms
    │   └── Photos
    │       └── Annotations
    ├── Systems
    │   └── InspectionItems
    │       └── Defects
    │           └── Photos
    └── Report (generated PDF)
```

### Multi-Tenant Isolation

- All tenant-scoped tables include `companyId`
- Prisma middleware automatically filters by tenant
- Application-level enforcement (not RLS)

---

## 16. Competitive Differentiators

| Feature | InspectOS | Competitors |
|---------|-----------|-------------|
| **Device Support** | iPad-first with Apple Pencil | Phone-first, generic tablets |
| **Offline-first** | Full inspection + draft PDF with zero connectivity | Partial or none |
| **Photo workflow** | 4 taps: capture → annotate → tag → done | 8-16 taps typical |
| **Apple Pencil** | Pressure-sensitive annotation, natural drawing | Basic touch drawing |
| **Report loading** | < 2 seconds | 1-2+ minutes common |
| **Inspector UI** | Split-view, always-visible progress | Single-view, cramped |
| **Admin UI** | Dense, keyboard-first | Same as mobile |
| **Pricing** | Transparent, fair multi-inspector | Hidden fees, per-seat gouging |

---

## 17. Project Structure

```
/inspectos
├── /src
│   ├── /app                    Next.js App Router
│   │   ├── page.tsx            Landing page
│   │   ├── layout.tsx          Root layout (with DeviceGate)
│   │   ├── /(public)           Public routes
│   │   ├── /(auth)             Auth routes
│   │   ├── /(dashboard)        Authenticated routes
│   │   └── /api                API routes
│   │
│   ├── /components
│   │   ├── /ui                 shadcn/ui primitives
│   │   ├── /shared             Role-agnostic (device-gate!)
│   │   ├── /tablet             iPad-optimized (pencil-canvas!)
│   │   ├── /desktop            Dense UI
│   │   ├── /inspection         Domain-specific
│   │   ├── /booking            Client booking
│   │   ├── /report             PDF templates
│   │   └── /layout             Shell components
│   │
│   ├── /lib
│   │   ├── db.ts               Prisma + tenant middleware
│   │   ├── auth.ts             NextAuth config
│   │   ├── stripe.ts           Stripe helpers
│   │   ├── storage.ts          R2 helpers
│   │   ├── pdf.ts              PDF generation
│   │   └── email.ts            Resend helpers
│   │
│   ├── /services               Capacitor integrations
│   │   ├── camera.ts
│   │   ├── filesystem.ts
│   │   ├── sqlite.ts
│   │   ├── sync.ts
│   │   ├── audio.ts
│   │   ├── network.ts
│   │   └── pencil.ts           Apple Pencil integration
│   │
│   ├── /hooks
│   │   ├── use-auth.ts
│   │   ├── use-offline.ts
│   │   ├── use-sync.ts
│   │   ├── use-camera.ts
│   │   └── use-role.ts
│   │
│   ├── /stores                 Zustand
│   │   ├── auth-store.ts
│   │   ├── inspection-store.ts
│   │   ├── photo-store.ts
│   │   ├── sync-store.ts
│   │   └── ui-store.ts
│   │
│   ├── /types
│   │   └── index.ts
│   │
│   └── /constants
│       ├── rooms.ts
│       ├── systems.ts
│       └── defects.ts
│
├── /prisma
│   └── schema.prisma
│
├── /capacitor
│   └── /ios                    iOS only (no Android)
│
├── /public
│   └── /icons
│
├── capacitor.config.ts         iOS-only configuration
├── next.config.js
├── tailwind.config.ts          810px minimum breakpoint
├── package.json
└── tsconfig.json
```

---

## 18. Monthly Cost Estimate (at scale)

| Service | Cost |
|---------|------|
| Neon (PostgreSQL) | Free → $25/month |
| Vercel | $20/month |
| Cloudflare R2 | ~$5-15/month |
| Cloudflare Images | ~$5/month |
| Resend | Free → $20/month |
| Stripe | 2.9% + $0.30/txn (passed to customer) |
| **Total** | ~$30-65/month |

---

## 19. Next Steps

1. **Database Schema** — Full Prisma schema with all entities
2. **Project Setup** — Next.js + Capacitor (iOS only) + shadcn/ui
3. **Device Gate** — Block unsupported devices with friendly message
4. **Auth Flow** — NextAuth with company invitations
5. **Design System** — Tailwind config (810px minimum) + iPad components
6. **Apple Pencil Canvas** — Pressure-sensitive annotation component
7. **Offline Sync** — SQLite ↔ PostgreSQL strategy
8. **Split-View Components** — iPad sidebar + main content layout
9. **Inspector Flow** — Core inspection workflow with room progress
10. **Admin Dashboard** — Overview + data tables
11. **PDF Generation** — Report templates (client-side draft + server polished)
12. **Stripe Integration** — Connect + checkout
13. **App Store Submission** — iOS deployment only
