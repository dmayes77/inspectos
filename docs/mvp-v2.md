# InspectOS MVP v2

## Product Direction
- Category: Inspection Business Operating System
- Primary user: Owner / operator
- Core principle: Profit over productivity
- Core object: Order (operating + analytics spine)
- Trust pillar: Data sovereignty by design

## MVP v2 Goals
1. Give owners decision-grade visibility into margin and cost.
2. Ship secure, business-scoped API access.
3. Make trust promises enforceable in-product.
4. Meet baseline market parity without diluting differentiation.

## Current State Snapshot

### Already Implemented
- Public messaging pivot (homepage + pricing).
- Data Charter page and public link.
- Business identity foundations (`business_id`).
- API key generation + rotation flow (in progress toward hardened model).
- API key auth path in server wrapper.
- Order cost/margin schema foundation (`labor_cost`, `travel_cost`, `overhead_cost`, `other_cost`, derived margin fields).
- Initial gross-margin stat in overview.

### Remaining Critical Gaps
- Owner dashboard still lacks service/referral margin decision views.
- Cost capture UX and defaults are not complete.
- API key governance surfaces are incomplete (list/revoke/history/scopes UX).
- Audit logs and export center are not yet exposed.
- Parity claims (email opens, etc.) need implementation validation.

## Scope

### In Scope (MVP v2)
- Margin by service
- Cost per inspection
- Referral source value by margin
- Secure API key lifecycle
- Auditability and export controls (minimum viable)
- Baseline parity: email open tracking, automations triggers, CSV exports, tagging, SMS reminders

### Out of Scope (Post-MVP)
- Full predictive AI optimization engines
- Deep multi-office enterprise policy framework
- Broad CRM expansion outside owner decision workflows

## 90-Day Delivery Plan

## Sprint 1 (Days 1-14): P0 Stabilization

### EPIC P0-A: Security and Identity Hardening
- `P0-A1` Run and validate business/API migrations end-to-end.
  - Acceptance:
    - `052`, `053`, `054`, `055` migrations run successfully.
    - Existing tenants still resolve and can authenticate.
- `P0-A2` Verify API key auth across at least 3 admin endpoints.
  - Acceptance:
    - `X-API-Key` requests succeed for valid active key.
    - Revoked/invalid key returns unauthorized.
- `P0-A3` Remove raw key exposure from non-rotation API responses.
  - Acceptance:
    - Settings GET/PUT never return full secret.
    - Rotation endpoint returns full key once with preview metadata.

### EPIC P0-B: Positioning Consistency
- `P0-B1` Finish public copy consistency sweep.
  - Acceptance:
    - No “all-in-one app” messaging remains on public pages.
    - Category language matches `docs/positioning.md`.

## Sprint 2-3 (Days 15-45): Decision Engine MVP

### EPIC P1-A: Owner Dashboard v1
- `P1-A1` Add “Margin by Service” module.
  - Acceptance:
    - Top/bottom service lines by gross margin are visible.
- `P1-A2` Add “Cost per Inspection” trend module.
  - Acceptance:
    - Owner can see period-over-period change.
- `P1-A3` Add “Referral Value by Margin” module.
  - Acceptance:
    - Referral source ranking uses margin, not just volume.

### EPIC P1-D: Full Decision Hub Command Center (explicit milestone)
- `P1-D1` Add decision controls (time ranges + period compare).
  - Acceptance:
    - Owner can switch 7/30/90/custom and compare to prior period in one click.
- `P1-D2` Add drilldowns/segments (service, source, inspector).
  - Acceptance:
    - Every top-level KPI links to a filtered breakdown table.
- `P1-D3` Add insight-to-action loops.
  - Acceptance:
    - From low-margin/referral/service cards, owner can trigger a concrete action flow (e.g., price review, workflow task, export).
- `P1-D4` Add owner thresholds and alerts.
  - Acceptance:
    - Owner can set minimum margin targets and see threshold breaches.

### EPIC P1-B: Cost Capture Workflow
- `P1-B1` Add order-level cost input UI.
  - Acceptance:
    - Users can edit labor/travel/overhead/other cost in admin flows.
- `P1-B2` Add default overhead configuration.
  - Acceptance:
    - New orders can initialize overhead consistently from settings.

### EPIC P1-C: Profit Export
- `P1-C1` Add profitability CSV export.
  - Acceptance:
    - Export includes revenue, costs, gross margin, margin %, service, referral source.

## Sprint 4-5 (Days 46-75): Trust + Parity

### EPIC P2-A: Trust Surface
- `P2-A1` Add audit log UI for sensitive actions.
  - Acceptance:
    - Key rotations, role changes, and exports are visible to owner/admin.
- `P2-A2` Add self-serve export center.
  - Acceptance:
    - Owner/admin can export core datasets without support.

### EPIC P2-B: Parity Delivery
- `P2-B1` Implement email open tracking.
- `P2-B2` Validate automation trigger coverage.
- `P2-B3` Validate tagging and SMS reminder workflows.
  - Acceptance:
    - Each parity feature has API + UI + test coverage.

## Sprint 6 (Days 76-90): Launch Readiness

### EPIC P3-A: KPI Instrumentation
- `P3-A1` Instrument owner decision events.
  - Acceptance:
    - Track pricing decisions, margin view interactions, export actions.

### EPIC P3-B: Pilot Readiness
- `P3-B1` Define design-partner checklist and success metrics.
  - Acceptance:
    - 3-5 pilot customers onboarded with clear baseline metrics.

## KPI Targets
1. Margin visibility coverage: >= 90% of completed orders.
2. Service profitability visibility: 100% of active services.
3. Pricing decision cycle time: < 1 business day.
4. Tool consolidation: replace at least 3 incumbent tools per pilot account.
5. API key security: 0 raw key leaks in persistent API responses.

## Definition of Done (MVP v2)
- Owner can run weekly operating decisions from InspectOS without external spreadsheets.
- Security and trust controls are enforceable, visible, and auditable.
- Public and in-product messaging consistently reflect the operating-system category.

## Post-v2 Gate: "Full Decision Hub Command Center" Complete
- Decision hub is considered complete when:
  1. Owner can detect a margin problem.
  2. Owner can drill to root cause.
  3. Owner can take action from the same screen.
  4. Owner can measure outcome against a target in the next review cycle.
