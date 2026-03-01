# InspectOS Dashboard MVP Scope and Status

Last updated: March 1, 2026
Owner: Product + Engineering

## Why this exists
This document defines:
1. Where the app is right now (based on implemented routes/components).
2. What must be completed for MVP.
3. What is explicitly out of scope so we stop losing time to non-MVP UI work.

Use this as the source of truth for sprint planning and scope decisions.

## MVP outcome (business-first)
The MVP is complete when a small inspection company can run this loop in production:

Lead/Client intake -> Order created -> Scheduled/assigned -> Inspection executed -> Invoice sent -> Payment recorded -> Report exported/shared

Note: "Inspection executed" happens in the Inspector App, not in this Dashboard app.

## Current app status (as-built)

### Working now (usable, real data hooks + CRUD)
1. Auth and account flows
- Login, register, forgot/reset password, auth callbacks.
2. Core operations
- Orders list/create/detail/edit workflows with linked property/client/agent/inspector/services.
- Schedule calendar surface and order navigation.
- Leads workflow (list/detail/new) exists.
3. People and relationships
- Contacts, agents, agencies, team, vendors CRUD surfaces exist.
4. Catalog and execution setup
- Services, properties, templates, tags, and workflow setup surfaces exist.
5. Finance core
- Invoices list/new/detail, payment recording, payouts dashboard.
6. Settings and integrations
- Company profile/settings and integration connection flows exist (email/SMS/payments/etc. surface-level integration setup).

### Partially complete (exists but not fully MVP-grade)
1. Order detail action shortcuts
- Order detail still has "coming soon" actions (portal link sending, SMS, create invoice from order, record payment from order context).
2. Communications
- Email/SMS channel status is shown, but communication logs/rules are largely static UX and not a complete operations console.
3. Reports
- KPI/export exists, but analytics charts are still placeholder.
4. Team scheduling/HR extras
- HR and team scheduling have placeholder sections (time attendance/calendar depth not complete).

### Not MVP-critical (defer)
1. Advanced analytics visualizations.
2. Voice/call-center features.
3. Full payroll, accounting reconciliation, or deep HR operations.
4. UI polish-only redesigns that do not change completion of the core loop.

## MVP scope (what we must ship)

### P0 (must be complete for MVP launch)
1. Reliable Order lifecycle end-to-end
- Create/edit order, assign inspector, set schedule, progress status through completion.
2. Inspection execution path
- Inspector App can complete inspection with required data and sync status/data back to the dashboard order.
3. Invoice + payment loop
- Create/send invoice and record payment against the correct order/invoice.
4. Report handoff
- Export/download/shareable report output tied to order.
5. Role-safe access
- Admin/owner/scheduler/inspector roles can access only the needed surfaces.
6. Baseline operational visibility
- Overview/schedule/orders pages reflect real state and blockers (unassigned, unpaid, pending report).

### P1 (target immediately after MVP, unless blocking a pilot customer)
1. Rich analytics charts in Reports.
2. Unified communications inbox with real outbound/inbound log persistence.
3. Full calendar sync and deeper HR/payroll workflow depth.
4. Advanced automation branching and nonessential workflow complexity.

## MVP gap list (from current state)
1. Wire order-detail quick actions to real backend actions
- Replace "coming soon" order-level actions with real invoice/payment/report/notification actions.
2. Define and enforce required fields for "inspection complete"
- In Inspector App, ensure inspection completion cannot bypass required checklist/report inputs, and sync that completion to dashboard order status.
3. Ensure invoice generation path is one-click from order context
- Current invoice pages exist; order-context workflow needs to be first-class.
4. Make communications operational, not informational
- At minimum, provide reliable sent-message logging for email/SMS tied to order.
5. Replace placeholder-only screens in MVP user paths
- Keep HR/time-attendance and advanced system pages out of main MVP workflows unless functional.
6. Harden cross-app handoff contract (Dashboard <-> Inspector App)
- Guarantee the order assignment/schedule payload needed by Inspector App is present and reliable.
- Guarantee inspection completion/report metadata from Inspector App updates the corresponding dashboard order/invoice/report state.

## Scope guardrails (anti-scope-creep)
A task is IN for MVP only if it directly improves one of these:
1. More orders completed end-to-end.
2. Faster time from order creation to payment.
3. Fewer manual handoffs/errors in scheduling, reporting, and billing.

A task is OUT of MVP if it is:
1. Visual polish without measurable workflow impact.
2. New module not required for the core inspection-to-payment loop.
3. Refactor/re-theme work that does not reduce defects or unblock launch.

## UI freeze policy for MVP period
1. UI changes are allowed only for:
- Usability blockers.
- Data integrity/accuracy issues.
- Accessibility defects that block usage.
2. No cosmetic-only spacing/color/type tweaks during active MVP sprint unless bundled into a required functional fix.

## Monthly execution cadence
1. Once per month: classify backlog into `MVP-Now` and `Post-MVP`.
2. During month: demo only end-to-end flow progress, not isolated UI tweaks.
3. End of month: score against MVP outcomes:
- Number of orders completed end-to-end.
- Number of invoices sent/paid.
- Time from order creation to payment.

## Branch execution board (`feature/pricing-strategy`)
Use this board as the only active queue on this branch. Do not start parallel tracks until all `NOW` items are complete.

### NOW (build immediately)
1. Replace order-detail "coming soon" financial actions with real actions
- Scope: `orders/[id]` can create/send invoice and record payment with persisted status updates.
- Done when: no financial "coming soon" actions remain in order detail and status updates are visible in order + invoice/payment views.
2. Define Dashboard <-> Inspector App handoff contract
- Scope: required assignment/schedule payload out, completion/report payload in.
- Done when: contract is documented and dashboard status updates correctly from inspector completion events.
3. Enforce lifecycle state transitions
- Scope: prevent invalid jumps and require data gates per stage (`scheduled -> in_progress -> pending_report -> delivered/completed`).
- Done when: invalid transitions are blocked and errors are explicit.
4. Report handoff completion
- Scope: order-level report artifact export/share with delivery tracking.
- Done when: report can be exported/shared from completed inspection data and delivery state is persisted.

### NEXT (start only after NOW is complete)
1. Communications logging for core lifecycle events
- Scope: store outbound invoice/report email or SMS attempts tied to order.
- Done when: owner can see sent/failed lifecycle messages on order history.
2. Lock service structure + basic pricing model (minimum needed for invoicing)
- Scope: ensure each service has reliable billable structure for order and invoice totals.
- Done when: service totals are consistent from order -> invoice -> payment reconciliation.

### LATER (explicitly deferred)
1. Analytics chart polish and deeper dashboard visualizations.
2. Voice/call-center features.
3. Full HR/time attendance depth and advanced payroll integrations.
4. Pricing strategy expansion (flat/float/sq-ft variants beyond minimum billable model).
5. Cosmetic-only UI refinements not tied to lifecycle completion.

## Active branch rules
1. One branch, one queue: all MVP work stays on `feature/pricing-strategy` until this board's `NOW` items are complete.
2. No polish-first tasks: if a task does not improve lifecycle completion, speed, or reliability, move it to `LATER`.
3. Commit discipline: each commit must map to one lifecycle step or one cross-app reliability gap.

## Definition of done for MVP launch
1. A new tenant can run at least 10 complete jobs through the system without manual spreadsheet fallback.
2. At least 90% of launched jobs produce invoice + payment records in-app.
3. Core personas (owner/admin/scheduler/inspector) can execute their primary tasks without engineering intervention.
