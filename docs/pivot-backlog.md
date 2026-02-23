# Pivot Backlog (P0/P1/P2)

## P0 — Foundation and Credibility (In Progress)

### P0-1: Cost Model Foundation
- Status: In progress
- Scope:
  - Add order-level cost inputs: labor, travel, overhead, other.
  - Add derived fields: total_cost, gross_margin, gross_margin_pct.
- Acceptance:
  - Completed orders expose revenue + costs + margin in API responses.
  - Dashboard can render margin values without custom queries.

### P0-2: API Key Auth Path
- Status: In progress
- Scope:
  - Accept `X-API-Key` or `Authorization: ApiKey <key>` in `withAuth`.
  - Resolve business from hashed key record.
  - Record key usage timestamp.
- Acceptance:
  - API-key authenticated requests can access business-scoped endpoints.
  - Invalid/revoked keys return unauthorized.

### P0-3: API Key Hardening
- Status: In progress
- Scope:
  - Introduce `business_api_keys` table with hash, prefix, scopes, rotation metadata.
  - Stop returning/storing raw keys in persistent responses.
  - Regenerate returns full key once, then preview only.
- Acceptance:
  - Raw key is only visible on regeneration response.
  - Settings endpoints return preview + rotation metadata, not secret.

### P0-4: Message Consistency Cleanup
- Status: In progress
- Scope:
  - Remove old “all-in-one app” public copy.
  - Align public shell/footer to operating-system positioning.
- Acceptance:
  - Public shell copy aligns with positioning docs.

## P1 — Decision Engine MVP

### P1-1: Owner Dashboard V1
- Status: Planned
- Scope:
  - Margin by service.
  - Cost per inspection.
  - Referral source value by margin.
- Acceptance:
  - Owner can identify top/bottom performing service lines in one screen.

### P1-2: Cost Capture UX
- Status: Planned
- Scope:
  - Add order editor fields for cost inputs.
  - Add default overhead settings model.
- Acceptance:
  - Cost inputs are editable in UI and persisted.

### P1-3: Profit Export
- Status: Planned
- Scope:
  - CSV export for profitability datasets.
- Acceptance:
  - Export includes revenue, costs, gross margin, margin %, source, and service details.

### P1-4: Full Decision Hub Command Center
- Status: Planned
- Scope:
  - Time controls (7/30/90/custom) and period comparison.
  - KPI drilldowns (service/source/inspector).
  - Insight-to-action flows from cards/tables.
  - Owner-configurable margin thresholds and alerts.
- Acceptance:
  - Owner can detect issue -> drill root cause -> take action from one page.
  - Decision loops are measurable in the next reporting period.

## P2 — Trust Surface + Parity Enforcement

### P2-1: Audit Log Surface
- Status: Planned
- Scope:
  - Display key security events (key rotations, role changes, exports).
- Acceptance:
  - Owner/admin can inspect recent sensitive actions in-app.

### P2-2: Data Portability Center
- Status: Planned
- Scope:
  - Self-serve business data exports.
- Acceptance:
  - No support intervention required for standard exports.

### P2-3: Parity Delivery (Real, not messaging)
- Status: Planned
- Scope:
  - Email open tracking.
  - Automation triggers.
  - SMS reminders.
  - Tagging workflows.
- Acceptance:
  - Each parity item has backend endpoint + UI + test coverage.
