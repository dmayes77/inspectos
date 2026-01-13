# InspectOS Unified Architecture

## Overview

InspectOS uses a **unified Capacitor-wrapped architecture** where the entire Next.js application is wrapped in Capacitor for native iOS/Android deployment. The same codebase powers both the web app and native mobile apps, with UI adaptation handled through **role-based routing** rather than platform detection.

## Key Architectural Principles

### 1. Single Codebase, Multiple Experiences

- **One app**: The entire Next.js application is wrapped in Capacitor
- **One deployment**: Same code deployed to App Store, Play Store, and web
- **Role-based UI**: User role determines the interface, not the device/platform

### 2. Role-Based Routing

Users are routed to different shells based on their role:

| Role | Route | Shell | Experience |
|------|-------|-------|------------|
| INSPECTOR | `/inspector/*` | AppShell | Mobile-first, touch-optimized, offline-capable |
| OWNER | `/admin/*` | AdminShell | Desktop-dense, keyboard-friendly, responsive |
| ADMIN | `/admin/*` | AdminShell | Desktop-dense, keyboard-friendly, responsive |
| OFFICE_STAFF | `/admin/*` | AdminShell | Desktop-dense, keyboard-friendly, responsive |

### 3. Universal Device Support

- **Native app**: Works on iPhone, iPad, Android phones, Android tablets
- **Web app**: Works on desktop, laptop, tablet, mobile browsers
- **No device blocking**: All device sizes are supported
- **Responsive design**: UI adapts to screen size within each shell

## Route Structure

The app uses Next.js route groups for better organization:

```
(public)/                   → Public routes (no auth required)
  ├─ /                      → Landing page with AuthRedirect
  ├─ /pricing               → Pricing comparison page
  ├─ /features              → Features showcase (future)
  ├─ /about                 → About the company (future)
  ├─ /contact               → Contact sales (future)
  ├─ /book/[slug]/*         → Public booking portal
  │   ├─ /                  → Service selection
  │   ├─ /schedule          → Date/time picker
  │   ├─ /checkout          → Payment and details
  │   └─ /confirmed         → Booking confirmation
  ├─ /report/[id]/*         → Public report viewer
  │   ├─ /                  → View report
  │   └─ /pay               → Payment for report
  └─ /offline               → Offline mode indicator

(auth)/                     → Authentication pages (route group)
  ├─ /login                 → Login page
  ├─ /register              → Registration page
  └─ /invite/[token]        → Team member invite acceptance

inspector/*                 → Inspector routes (role: INSPECTOR only)
  ├─ /schedule              → Calendar and upcoming jobs
  ├─ /jobs                  → Active and completed inspections
  ├─ /jobs/[id]             → Inspection detail and editor
  ├─ /jobs/[id]/review      → Review before submitting
  └─ /profile               → Inspector settings

admin/*                     → Admin routes (roles: OWNER, ADMIN, OFFICE_STAFF)
  ├─ /overview              → Dashboard with metrics
  ├─ /inspections           → All inspections management
  ├─ /clients               → Client database
  ├─ /team                  → Team member management
  ├─ /services              → Service catalog
  ├─ /templates             → Inspection templates
  └─ /settings              → Company settings and billing

platform/*                  → Platform admin (future - super admin only)
  ├─ /                      → Platform overview
  ├─ /companies             → All companies list
  ├─ /features              → Feature flags
  └─ /pricing               → Pricing tiers management
```

### Route Group Benefits

Route groups (folders with parentheses like `(public)` and `(auth)`) allow us to:
- Organize related routes without affecting the URL structure
- Share layouts across specific route segments
- Group all public-facing routes together (marketing + services)
- Keep authentication flows separate
- Maintain clean URLs (e.g., `/` not `/public/`, `/login` not `/auth/login`)

## Authentication Flow

### Unauthenticated Users

1. Visit any route → Middleware checks authentication
2. Not authenticated → Redirect to `/login` with return URL
3. Login successful → Redirect based on role:
   - INSPECTOR → `/inspector/schedule`
   - OWNER/ADMIN/OFFICE_STAFF → `/admin/overview`

### Authenticated Users

1. Visit `/` → AuthRedirect checks session
2. Already authenticated → Redirect to dashboard based on role
3. Visit auth pages (`/login`, `/register`) → Redirect to dashboard
4. Visit protected route → Middleware validates role access

## Shell Components

### AppShell
**Location**: `src/components/layout/app-shell.tsx`

**Characteristics**:
- Sidebar navigation (Schedule, Jobs)
- Mobile-first, touch-optimized
- Large tap targets
- Haptic feedback
- Online/offline indicator
- Optimized for field work

**Usage**:
```tsx
<AppShell
  title="Job Details"
  showBackButton
  onBack={() => router.back()}
>
  {children}
</AppShell>
```

### AdminShell
**Location**: `src/components/layout/admin-shell.tsx`

**Characteristics**:
- Collapsible sidebar navigation
- Desktop-dense layout
- Keyboard shortcuts
- Search functionality
- Notification bell
- Responsive (works on tablets)

**Usage**:
```tsx
<AdminShell user={user}>
  {children}
</AdminShell>
```

### PublicShell
**Location**: `src/components/layout/public-shell.tsx`

**Characteristics**:
- Marketing header with Sign In/Get Started
- Footer with links
- Clean, minimal design
- Used for landing pages

### BookingShell
**Location**: `src/components/layout/booking-shell.tsx`

**Characteristics**:
- Company branding
- Client-facing design
- Progress indicator for booking flow
- Used for public booking portal

## Middleware Logic

**File**: `src/middleware.ts`

The middleware handles:

1. **Authentication Check**: Verifies session on all routes
2. **Public Route Access**: Allows unauthenticated access to marketing pages
3. **Auth Page Redirects**: Redirects authenticated users away from login/register
4. **Role-Based Access Control**:
   - `/inspector/*` → INSPECTOR role only
   - `/admin/*` → OWNER, ADMIN, OFFICE_STAFF only
5. **Dashboard Redirects**: Routes users to correct dashboard on login

## Component: AuthRedirect

**File**: `src/components/auth-redirect.tsx`

Used on public pages (marketing) to redirect authenticated users:

```tsx
<AuthRedirect>
  <MarketingContent />
</AuthRedirect>
```

**Behavior**:
- Checks if user is authenticated
- If authenticated → Redirects to dashboard based on role
- If not authenticated → Shows marketing content
- Works seamlessly in both web and native app

## Native App Considerations

### Capacitor Integration

The entire app is wrapped in Capacitor:

```bash
# Build Next.js app
npm run build

# Sync to native projects
npx cap sync

# Open in Xcode/Android Studio
npx cap open ios
npx cap open android
```

### Native Features

**Camera Service** (`src/services/camera.ts`):
- Photo capture
- Gallery access
- Annotation tools

**Offline Support**:
- Service worker for PWA
- IndexedDB for local storage
- Sync queue for offline edits

**Haptic Feedback** (`src/services/haptics.ts`):
- Touch feedback on navigation
- Success/error haptics
- Native feel on mobile

### Platform Detection

Use `Capacitor.isNativePlatform()` when you need platform-specific logic:

```tsx
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

if (isNative) {
  // Use native camera
  await capturePhoto();
} else {
  // Use web file input
  handleFileUpload();
}
```

**Important**: Don't use platform detection for UI decisions. Use role-based shells instead.

## Distribution Strategy

### App Store / Play Store

**App Name**: InspectOS
**Bundle ID**: `com.inspectos.app`

**Features**:
- Full offline support
- Native camera integration
- Push notifications
- Background sync
- Biometric authentication

**Target Users**: All roles (Inspector, Admin, Owner, Office Staff)

### Web App

**URL**: `https://app.inspectos.com`

**Features**:
- Full feature parity with native
- PWA installable
- Responsive design
- Works on all modern browsers

**Target Users**: Admin, Owner, Office Staff (desktop-primary work)

### Marketing Site

**URL**: `https://inspectos.com`

**Features**:
- Landing page
- Pricing information
- Sign up flow
- Public booking portal
- Report viewer

## Future Enhancements

### Planned Features

1. **Adaptive Shell Selection**:
   - Detect screen size and allow Inspector UI on large screens
   - Allow Admin users to switch to mobile view

2. **Offline-First Admin**:
   - Add offline support to AdminShell
   - Sync queue for scheduling changes

3. **Multi-Role Users**:
   - Allow users to have multiple roles
   - Role switcher in navigation

4. **Platform Admin Panel**:
   - Super admin dashboard at `/platform`
   - Cross-company analytics
   - Feature flags and rollouts

## Testing Checklist

### Authentication Flow
- [ ] Unauthenticated user visits `/` → sees marketing page
- [ ] Unauthenticated user visits `/admin` → redirects to `/login`
- [ ] User logs in as INSPECTOR → redirects to `/inspector/schedule`
- [ ] User logs in as OWNER → redirects to `/admin/overview`
- [ ] Authenticated user visits `/login` → redirects to dashboard

### Role-Based Access
- [ ] INSPECTOR can access `/inspector/*` routes
- [ ] INSPECTOR cannot access `/admin/*` routes (redirects)
- [ ] ADMIN can access `/admin/*` routes
- [ ] ADMIN cannot access `/inspector/*` routes (redirects)

### Platform Compatibility
- [ ] App works on iPhone (native)
- [ ] App works on iPad (native)
- [ ] App works on Android phone (native)
- [ ] App works on Android tablet (native)
- [ ] App works on desktop browser (web)
- [ ] App works on mobile browser (web)

### UI Shells
- [ ] AppShell renders correctly on mobile
- [ ] AppShell sidebar navigation works
- [ ] AdminShell renders correctly on desktop
- [ ] AdminShell sidebar collapses on mobile
- [ ] PublicShell shows marketing header/footer

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build and sync to native
npm run build && npx cap sync

# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android

# Run linter
npm run lint

# Update Prisma client
npx prisma generate

# Push database schema
npx prisma db push
```

## Troubleshooting

### Issue: User keeps getting redirected
**Solution**: Check middleware logic and role assignment in session

### Issue: Native app shows white screen
**Solution**: Run `npx cap sync` after building Next.js

### Issue: Camera not working on web
**Solution**: Ensure HTTPS is enabled (required for getUserMedia API)

### Issue: Offline mode not working
**Solution**: Check service worker registration and IndexedDB setup

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   InspectOS App                     │
│                 (Next.js + Capacitor)               │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
    ┌───▼────┐                    ┌─────▼─────┐
    │  Web   │                    │  Native   │
    │Browser │                    │iOS/Android│
    └───┬────┘                    └─────┬─────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                ┌───────▼────────┐
                │  Middleware    │
                │  (Route Guard) │
                └───────┬────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │Inspector│    │  Admin  │    │ Public  │
   │  Shell  │    │  Shell  │    │  Shell  │
   └─────────┘    └─────────┘    └─────────┘
   Mobile-first   Desktop-dense  Marketing
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS v4](https://tailwindcss.com)

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintainer**: InspectOS Development Team
