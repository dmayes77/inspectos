# Shell Strategy: Website vs App

## Overview

InspectOS uses two distinct types of shells based on the user experience needed:

### 🌐 Website Shells - For Public Routes
Traditional website behavior with natural scrolling

### 📱 App Shells - For Authenticated Routes
Fixed layouts with constrained scroll areas

---

## Website Shells

### Characteristics
- ✅ Natural full-page scrolling
- ✅ Sticky/fixed header (optional)
- ✅ Footer scrolls into view
- ✅ No layout constraints
- ✅ Traditional web navigation
- ✅ Works like browsing a website

### When to Use
- Marketing pages
- Public information pages
- Client-facing booking flows
- Authentication pages

### Available Shells

#### 1. PublicShell
**Purpose**: Marketing website pages

**Routes**:
- `/` - Landing page
- `/pricing` - Pricing page
- `/features` - Features page
- `/about` - About page
- `/contact` - Contact page

**Layout**:
```tsx
<div className="flex min-h-dvh flex-col">
  <header className="sticky top-0">...</header>
  <main className="flex-1 overflow-y-auto">
    {children} {/* Natural scrolling */}
  </main>
  <footer>...</footer>
</div>
```

#### 2. BookingShell
**Purpose**: Client-facing booking portal

**Routes**:
- `/book/[slug]/*` - All booking flow pages

**Layout**:
- Company branding
- Progress indicator
- Minimal "Powered by" footer

#### 3. AuthShell (NEW)
**Purpose**: Authentication flows

**Routes**:
- `/login` - Login page
- `/register` - Registration page
- `/invite/[token]` - Team invite

**Layout**:
- Centered content
- Logo at top
- Back to home button
- Minimal footer

---

## App Shells

### Characteristics
- ✅ Fixed header (never scrolls away)
- ✅ Fixed sidebar/navigation
- ✅ Only content area scrolls independently
- ✅ Constrained, predictable layout
- ✅ App-specific navigation patterns
- ✅ Works like using software

### When to Use
- Authenticated dashboard routes
- Data management interfaces
- Admin/office workflows
- Inspector field work

### Available Shells

#### 1. AppShell
**Purpose**: Mobile-first field work for inspectors

**Routes**:
- `/inspector/schedule`
- `/inspector/jobs`
- `/inspector/jobs/[id]`
- `/inspector/profile`

**Layout**:
```tsx
<div className="fixed inset-0 flex">
  <aside className="fixed left-0">
    {/* Sidebar - never scrolls */}
  </aside>
  <div className="flex-1 flex flex-col">
    <header className="fixed top-0">
      {/* Header - never scrolls */}
    </header>
    <main className="flex-1 overflow-y-auto">
      {/* Only this scrolls */}
    </main>
  </div>
</div>
```

**App Constraints**:
- Mobile-first touch interactions
- Large tap targets
- Haptic feedback
- Offline indicator
- Fixed navigation

#### 2. AdminShell
**Purpose**: Desktop-dense office work

**Routes**:
- `/admin/overview`
- `/admin/inspections`
- `/admin/clients`
- `/admin/team`
- `/admin/services`
- `/admin/templates`
- `/admin/settings`

**Layout**:
```tsx
<div className="flex h-dvh">
  <aside className="w-56">
    {/* Sidebar - never scrolls */}
  </aside>
  <div className="flex-1 flex flex-col">
    <header className="h-14">
      {/* Header - never scrolls */}
    </header>
    <main className="flex-1 overflow-auto">
      <div className="container">
        {/* Only this scrolls */}
      </div>
    </main>
  </div>
</div>
```

**App Constraints**:
- Desktop-optimized layout
- Keyboard shortcuts (⌘K search)
- Dense information display
- Collapsible sidebar
- Fixed header with search/notifications

---

## Visual Comparison

### Website Shell (PublicShell)
```
┌──────────────────────────┐
│ [Sticky Header]          │ ← Scrolls with page
├──────────────────────────┤
│                          │
│                          │ ← All content
│      Content Area        │   scrolls together
│   (Natural Scrolling)    │
│                          │
│                          │
├──────────────────────────┤
│ [Footer]                 │ ← Scrolls into view
└──────────────────────────┘
```

### App Shell (AdminShell)
```
┌───────┬──────────────────┐
│       │ [Fixed Header]   │ ← Never scrolls
│  Nav  ├──────────────────┤
│ (Fix) │                  │
│       │   Content Area   │ ← Only this scrolls
│       │  (Constrained)   │
│       │                  │
│       │                  │
└───────┴──────────────────┘
```

---

## Decision Tree

### Choosing the Right Shell

```
Is the route authenticated?
├─ No → Website Shell
│   ├─ Marketing content? → PublicShell
│   ├─ Booking flow? → BookingShell
│   └─ Auth page? → AuthShell
│
└─ Yes → App Shell
    ├─ Inspector role? → AppShell
    └─ Admin/Owner/Office? → AdminShell
```

---

## Implementation Guidelines

### Website Shells

**DO**:
- ✅ Use natural `overflow-y-auto` on main
- ✅ Let header be `sticky` if desired
- ✅ Include footer that scrolls into view
- ✅ Use `min-h-dvh` for full viewport height
- ✅ Allow flexible content layouts

**DON'T**:
- ❌ Use fixed positioning for main layout elements
- ❌ Constrain content scrolling
- ❌ Add app-like navigation (bottom tabs, sidebars)

### App Shells

**DO**:
- ✅ Use `fixed` or `h-dvh` for outer container
- ✅ Make header/sidebar non-scrolling
- ✅ Isolate scrolling to main content area only
- ✅ Use consistent navigation patterns
- ✅ Add app-specific features (search, notifications)

**DON'T**:
- ❌ Let entire page scroll
- ❌ Use traditional website patterns
- ❌ Include website-style footer

---

## Code Examples

### Website Shell Pattern

```tsx
export function PublicShell({ children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header - can be sticky */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          {/* Navigation */}
        </div>
      </header>

      {/* Main - natural scrolling */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Footer - scrolls into view */}
      <footer className="border-t bg-card">
        <div className="container py-8">
          {/* Footer content */}
        </div>
      </footer>
    </div>
  );
}
```

### App Shell Pattern

```tsx
export function AdminShell({ children }: Props) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar - fixed, never scrolls */}
      <aside className="flex flex-col w-56 border-r bg-card">
        <div className="h-14 flex items-center px-4 border-b">
          {/* Logo */}
        </div>
        <nav className="flex-1 px-3 py-4">
          {/* Navigation links */}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - fixed, never scrolls */}
        <header className="flex h-14 items-center px-6 border-b bg-card">
          {/* Search, notifications, user menu */}
        </header>

        {/* Content - ONLY this scrolls */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Website Shells
- [ ] Full page scrolls naturally
- [ ] Header behaves correctly (sticky if intended)
- [ ] Footer scrolls into view at bottom
- [ ] Works on mobile browsers
- [ ] Works in Capacitor native app
- [ ] Safe areas respected

### App Shells
- [ ] Header stays fixed when scrolling content
- [ ] Sidebar stays fixed when scrolling content
- [ ] Only content area scrolls
- [ ] No full-page scrolling
- [ ] Keyboard shortcuts work (if applicable)
- [ ] Touch gestures work (if applicable)
- [ ] Safe areas respected

---

## Summary Table

| Shell | Type | Routes | Scrolling | Layout | Purpose |
|-------|------|--------|-----------|--------|---------|
| **PublicShell** | Website | `/(public)/*` marketing | Natural full-page | Flexible | Marketing pages |
| **BookingShell** | Website | `/book/[slug]/*` | Natural full-page | Centered | Client booking |
| **AuthShell** | Website | `/(auth)/*` | Natural full-page | Centered | Authentication |
| **AppShell** | App | `/inspector/*` | Content only | Fixed | Field work (mobile) |
| **AdminShell** | App | `/admin/*` + `/platform/*` | Content only | Fixed | Office work (desktop) + Platform admin |

---

## Key Takeaway

> **Website shells** let the whole page scroll like a website.
> **App shells** have fixed headers/sidebars with only the content scrolling.

Choose the shell type based on whether the route should feel like **browsing a website** or **using an application**.

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintainer**: InspectOS Development Team
