# Admin Reusable Flow Pattern

This document captures the pieces we just built out while auditing `apps/web/app/(app)/admin/properties` so future admin sections (invoices, orders, etc.) can share the same scaffolding.

## Core layout wrapper
- `AdminResourcePage` (`@/components/admin/admin-resource-page.tsx`) wraps `AdminShell`, `AdminPageHeader`, and `ResourceListLayout` so any list page can be built with a single component instantiation.
- Pass the header meta (title, description, breadcrumb, actions), stats block, filter bar, and table content as props and `AdminResourcePage` wires up the common spacing/scrolling behavior for you.

## Stats, filters, and empty states
- Use `AdminStatsGrid` to render stat cards (`items` / `columns` props) instead of manually wiring cards whenever you need a quick summary row.
- `AdminFilterBar` (`@/components/admin/admin-filter-bar.tsx`) keeps the search + selects + action buttons aligned with consistent padding.
- When the table is empty, drop in `AdminEmptyState` to preserve the dashed border styling plus optional icon, description, and CTA.
- Example: `apps/web/app/(app)/admin/properties/page.tsx` now composes the header, stats grid, filter bar, empty state, and responsive table using the new helpers.

## Sidebar & form cards
- `AdminActionSidebar` (`@/components/admin/admin-action-sidebar.tsx`) wraps quick action buttons into a consistent card, so detail pages render their actions + metadata panels in the same way.
- `PropertyFormCard` in `apps/web/components/properties/property-form-sections.tsx` proves a pattern for breaking long forms into titled cards with optional descriptions.
  - Each conditional section (address, details, features, residential/commercial/multi-family, owner/contact) now reuses the same card wrapper so you only define the inputs once.

## Read-only/detail helpers
- The property detail page continues to lean on `ResourceDetailLayout`, `ClientInfoCard`, and `RecordInformationCard`, but any new detail view can reuse `AdminActionSidebar` for actions + meta while building data cards similar to the property ones.

## Next sections
1. Build invoices/orders/other admin lists by plugging their stats, filters, and tables into `AdminResourcePage`.
2. Break future edit/create forms into the `PropertyFormCard` pattern (or any equivalent card wrapper) so layout/spacing stays consistent across screens.
3. Reuse the sidebar/action/card structure (`AdminActionSidebar` + `RecordInformationCard`) for detail pages that need quick actions + metadata.
