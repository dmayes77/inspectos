# InspectOS Shell Architecture

## Overview

InspectOS uses different "shell" components to provide distinct user experiences based on the route type. Each shell is designed for a specific purpose and provides appropriate navigation, layout, and interaction patterns.

## Shell Types

### 1. PublicShell - Website Experience

**Location**: `src/components/layout/public-shell.tsx`

**Purpose**: Provides a traditional website experience for all public-facing routes (marketing, booking, reports).

**Key Features**:
- ✅ Sticky header with logo and navigation
- ✅ Mobile-responsive hamburger menu
- ✅ Sign In / Get Started buttons
- ✅ Footer with company/product/legal links
- ✅ Natural webpage scrolling
- ✅ Safe area handling for notches/home indicators
- ✅ Works seamlessly in web browsers and Capacitor native app
- ✅ Flexible layout options (full-width, padded, custom)

**Usage**:
```tsx
// Basic usage
<PublicShell>
  <YourContent />
</PublicShell>

// Full-width landing page
<PublicShell fullWidth>
  <HeroSection />
  <FeaturesSection />
</PublicShell>

// Content page with padding
<PublicShell padContent>
  <Article />
</PublicShell>

// No header/footer
<PublicShell showHeader={false} showFooter={false}>
  <StandaloneContent />
</PublicShell>
```

**Routes Using PublicShell**:
- `/` - Landing page
- `/pricing` - Pricing page
- `/features` - Features showcase
- `/about` - About page
- `/contact` - Contact page

**Characteristics**:
- **Navigation**: Horizontal nav bar (desktop), hamburger menu (mobile)
- **Scrolling**: Natural webpage scrolling
- **Layout**: Flexible container or full-width
- **Chrome**: No app-specific navigation elements
- **Experience**: Feels like browsing a website

---

### 2. BookingShell - Client-Facing Booking Flow

**Location**: `src/components/layout/booking-shell.tsx`

**Purpose**: Provides a branded, client-facing experience for the public booking portal.

**Key Features**:
- ✅ Company branding (logo and name)
- ✅ Progress indicator for multi-step flow
- ✅ Clean, minimal design
- ✅ "Powered by InspectOS" footer
- ✅ Safe area handling
- ✅ Natural scrolling

**Usage**:
```tsx
<BookingShell
  companyName="Acme Inspections"
  companyLogo="/logos/acme.png"
  currentStep={2}
  totalSteps={3}
>
  <BookingForm />
</BookingShell>
```

**Routes Using BookingShell**:
- `/book/[slug]` - Service selection
- `/book/[slug]/schedule` - Date/time picker
- `/book/[slug]/checkout` - Payment and details
- `/book/[slug]/confirmed` - Confirmation page

**Characteristics**:
- **Navigation**: None (wizard flow with back/next buttons in content)
- **Branding**: Company logo and name
- **Progress**: Visual progress bar
- **Layout**: Centered, contained
- **Experience**: Feels like completing a form wizard

---

### 3. AppShell - Mobile-First Field Work

**Location**: `src/components/layout/app-shell.tsx`

**Purpose**: Provides a mobile-first, touch-optimized interface for inspectors doing field work.

**Key Features**:
- ✅ Sidebar navigation (Schedule, Jobs)
- ✅ Mobile-first, touch-optimized
- ✅ Large tap targets
- ✅ Haptic feedback on interactions
- ✅ Online/offline indicator
- ✅ User profile dropdown
- ✅ Safe area handling

**Usage**:
```tsx
<AppShell
  title="Job Details"
  showBackButton
  onBack={() => router.back()}
  user={user}
>
  <InspectionEditor />
</AppShell>
```

**Routes Using AppShell**:
- `/inspector/schedule` - Calendar and upcoming jobs
- `/inspector/jobs` - Active and completed inspections
- `/inspector/jobs/[id]` - Inspection detail and editor
- `/inspector/jobs/[id]/review` - Review before submitting
- `/inspector/profile` - Inspector settings

**Characteristics**:
- **Navigation**: Sidebar with Schedule/Jobs
- **Layout**: Full-screen, mobile-optimized
- **Interactions**: Touch gestures, haptic feedback
- **Offline**: Prominent online/offline indicator
- **Experience**: Feels like a native mobile app

---

### 4. AdminShell - Desktop-Dense Office Work

**Location**: `src/components/layout/admin-shell.tsx`

**Purpose**: Provides a desktop-dense, keyboard-friendly interface for office staff and business owners.

**Key Features**:
- ✅ Collapsible sidebar navigation
- ✅ Desktop-dense layout
- ✅ Search functionality (⌘K)
- ✅ Notification bell
- ✅ User dropdown menu
- ✅ Keyboard shortcuts
- ✅ Responsive (works on tablets)
- ✅ Safe area handling

**Usage**:
```tsx
<AdminShell user={user}>
  <ClientsPage />
</AdminShell>
```

**Routes Using AdminShell**:
- `/admin/overview` - Dashboard with metrics
- `/admin/inspections` - All inspections management
- `/admin/clients` - Client database
- `/admin/team` - Team member management
- `/admin/services` - Service catalog
- `/admin/templates` - Inspection templates
- `/admin/settings` - Company settings and billing

**Characteristics**:
- **Navigation**: Collapsible sidebar with full menu
- **Layout**: Dense, information-rich
- **Interactions**: Keyboard-friendly, mouse-optimized
- **Search**: Global search with keyboard shortcut
- **Experience**: Feels like a desktop productivity app

---

## Shell Comparison

| Feature | PublicShell | BookingShell | AppShell | AdminShell |
|---------|------------|--------------|----------------|------------|
| **Primary Device** | Desktop/Mobile | Desktop/Mobile | Mobile/Tablet | Desktop/Laptop |
| **Navigation Type** | Header nav | Progress bar | Sidebar | Collapsible sidebar |
| **Mobile Menu** | ✅ Hamburger | ❌ N/A | ✅ Built-in | ✅ Responsive |
| **Scrolling** | Natural webpage | Natural webpage | App-like | App-like |
| **Safe Areas** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Haptics** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Offline Indicator** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Search** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **User Profile** | Login buttons | ❌ No | ✅ Dropdown | ✅ Dropdown |
| **Branding** | InspectOS | Company | InspectOS | InspectOS |

---

## Safe Area Handling

All shells include safe area handling for modern mobile devices:

```tsx
// Header
className="safe-area-inset-top safe-area-inset-left safe-area-inset-right"

// Footer
className="safe-area-inset-bottom safe-area-inset-left safe-area-inset-right"

// Sidebar (left)
className="safe-area-inset-left"

// Sidebar (right)
className="safe-area-inset-right"
```

**Safe areas account for**:
- iPhone notch and Dynamic Island
- Android cutouts
- Home indicators
- Rounded corners

---

## Shell Selection Strategy

### Automatic (Middleware-Based)

The middleware automatically routes users to the correct shell based on their role:

```typescript
// middleware.ts
if (userRole === "INSPECTOR") {
  // Routes to /inspector/* → AppShell
} else if (["OWNER", "ADMIN", "OFFICE_STAFF"].includes(userRole)) {
  // Routes to /admin/* → AdminShell
}
```

### Manual (Route-Based)

Some routes explicitly choose their shell:

```tsx
// Public marketing page
export default function LandingPage() {
  return (
    <AuthRedirect>
      <PublicShell fullWidth>
        <HeroSection />
      </PublicShell>
    </AuthRedirect>
  );
}

// Public booking page
export default function BookingPage({ params }: { params: { slug: string } }) {
  return (
    <BookingShell companyName={company.name} companyLogo={company.logo}>
      <ServiceSelection />
    </BookingShell>
  );
}
```

---

## Layout Patterns

### Scrolling Behavior

**PublicShell & BookingShell** (Website-like):
```tsx
<main className="flex-1 overflow-y-auto">
  {children} {/* Natural scrolling */}
</main>
```

**AppShell & AdminShell** (App-like):
```tsx
<main className="flex-1 overflow-auto">
  {children} {/* Contained scrolling */}
</main>
```

### Responsive Breakpoints

All shells use consistent Tailwind breakpoints:
- `sm`: 640px - Small devices
- `md`: 768px - Tablets (hamburger menu → desktop nav)
- `lg`: 1024px - Laptops
- `xl`: 1280px - Large desktops
- `2xl`: 1536px - Extra large screens

### Container Usage

**PublicShell**:
- Configurable: `fullWidth` prop
- Default: `container` class (max-w with responsive padding)

**BookingShell**:
- Always contained: `container` class

**AppShell**:
- No container: Full-screen mobile-first design

**AdminShell**:
- Contained: `container max-w-7xl` for main content
- Sidebar: Fixed width

---

## Capacitor Considerations

### Platform Detection

Shells should work in both web and native without platform detection:

```tsx
// ❌ Don't do this
if (Capacitor.isNativePlatform()) {
  return <NativeLayout />;
} else {
  return <WebLayout />;
}

// ✅ Do this
return <PublicShell>{children}</PublicShell>;
// Shell adapts to context automatically
```

### Navigation

Use Next.js Link for all navigation:

```tsx
// ✅ Correct - works in both web and native
<Link href="/inspector/jobs">Jobs</Link>

// ❌ Wrong - breaks in SPA navigation
<a href="/inspector/jobs">Jobs</a>
```

### Safe Area CSS

Tailwind utility classes handle safe areas:

```css
/* Generated by Tailwind */
.safe-area-inset-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-inset-left {
  padding-left: env(safe-area-inset-left);
}

.safe-area-inset-right {
  padding-right: env(safe-area-inset-right);
}
```

---

## Best Practices

### 1. Choose the Right Shell

- **Public-facing content?** → PublicShell
- **Client booking flow?** → BookingShell
- **Inspector field work?** → AppShell
- **Office/admin work?** → AdminShell

### 2. Use Props for Customization

```tsx
// Leverage shell props for different layouts
<PublicShell
  fullWidth={isLandingPage}
  padContent={isArticle}
  showFooter={!isMinimal}
>
  {children}
</PublicShell>
```

### 3. Maintain Consistency

- Keep navigation patterns consistent within each shell
- Use same spacing/padding conventions
- Follow established interaction patterns (haptics in AppShell, keyboard shortcuts in AdminShell)

### 4. Test in All Contexts

- ✅ Desktop browser (Chrome, Safari, Firefox)
- ✅ Mobile browser (iOS Safari, Chrome)
- ✅ Native app (iOS simulator, Android emulator)
- ✅ Different screen sizes (phone, tablet, desktop)
- ✅ Dark mode (if implemented)

---

## Future Enhancements

### Planned Improvements

1. **Theme Switching**: Allow users to toggle light/dark mode
2. **Accessibility**: Enhanced keyboard navigation, screen reader support
3. **Animations**: Page transitions, loading states
4. **Offline UI**: Better offline indicators and sync status
5. **Progressive Enhancement**: Service worker integration for PWA

### Shell Variants

Consider adding specialized variants:
- **ReportShell**: For viewing/printing inspection reports
- **AuthShell**: Dedicated shell for login/register flows
- **OnboardingShell**: Welcome flow for new users
- **ErrorShell**: Branded error pages (404, 500, etc.)

---

## Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Tailwind CSS Safe Area Utilities](https://tailwindcss.com/docs)
- [Web.dev Mobile UX Best Practices](https://web.dev/mobile-ux/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintainer**: InspectOS Development Team
