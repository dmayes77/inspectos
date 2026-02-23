
# InspectOS Admin Office (ERP-Lite) — Definitive MVP Blueprint

## Status
Authoritative Admin Panel specification. This document defines responsibilities, ownership, relationships, and completion criteria for the Admin Office. Complete this before building other surfaces.

---

## North Star
Run the complete inspection business loop:

Create Order → Schedule → Assign → Communicate → Execute → Deliver Report → Invoice → Get Paid → Pay Inspector

Everything below exists to support this loop.

---

## Core Mental Model
### Central Object: Order (Inspection Job)
The Order is the nucleus and single source of truth.

**Order links to:**
- Client
- Property
- Agent and/or Agency (optional)
- Assigned Inspector
- Selected Services (bundled)
- Schedule window
- Status timeline
- Internal notes
- Inspection execution data
- Report output and delivery links
- Invoice and payment state
- Inspector payout calculation and payout status
- Communication log
- Tags (which can influence workflows and automations)

**MVP Rule:** One Order = one appointment = one primary report = one invoice.

---

# Admin Panel Modules

## 1) Dashboard (Command Center)
**Responsibility:** Actionable operational and financial awareness.

**Owns:** Priority queues and bottleneck detection.

**Reads From:** Orders, Invoices, Payments, Payouts, Workflows.

**MVP Displays:**
- Today and upcoming inspections
- Unassigned orders
- Orders awaiting report delivery
- Unpaid/overdue invoices
- Pending payouts
- Quick actions (create order, assign, resend report, send invoice)

---

## 2) Inspections (Orders / Jobs)
**Responsibility:** Create and manage work and lifecycle.

**Owns:** Order creation, updates, status progression.

**Relationships:**
- Pulls Services and Templates
- Triggers Communications, Automations, Workflows
- Generates Invoices and ties Payments
- Computes Payouts

**MVP:** Order list and detail workspace with full linkage.

---

## 3) Clients
**Responsibility:** Client identity and history.

**Owns:** Contact info, notes, job history.

**Relationships:** Attach to Orders; portal access generated from Orders.

---

## 4) Properties
**Responsibility:** Property identity and inspection history.

**Owns:** Address records, notes.

**Relationships:** Attach to Orders; used in scheduling and reporting.

---

## 5) Agencies & Agents
**Responsibility:** Referral sources and report recipients.

**Owns:** Agent identity, agency grouping, preferred contact methods, history.

**Relationships:** Attach to Orders; receive report delivery; portal access generated from Orders.

---

## 6) Scheduling & Dispatch
**Responsibility:** Plan and assign execution.

**Owns:** Date/time windows, inspector assignment.

**Relationships:** Driven by Orders; feeds inspector workload.

---

## 7) Team & Roles
**Responsibility:** Access control.

**Owns:** User invites, role assignment, enable/disable.

**MVP Roles:** Tenant Owner, Admin, Scheduler, Inspector.

---

## 8) Services (Catalog)
**Responsibility:** Define what is sold.

**Owns:** Service definitions, pricing, durations, add-ons.

**Relationships:** Selected by Orders; invoice line items; map to Templates; influence payouts.

---

## 9) Inspection Templates
**Responsibility:** Define how inspections are performed and structured.

**Owns:** Sections, checklist items, required fields, photo rules.

**Relationships:** Selected by Services; executed by Inspector App; drive report structure.

---

## 10) Workflows (Lifecycle Rules)
**Responsibility:** Enforce consistency.

**Owns:** Status stages, allowed transitions, default behaviors.

**Relationships:** Governs Orders; can be influenced by Tags; triggers Automations.

**Guardrail:** No complex branching builders in MVP.

---

## 11) Automations
**Responsibility:** Reduce manual work with predictable triggers.

**Owns:** Time-based and status-based actions.

**Relationships:** Triggered by Workflows; can be triggered or suppressed by Tags; uses templates; logs actions.

**MVP Automations:** Reminders, report delivery, invoice email.

---

## 12) Communications (Phone, SMS, Email)
**Responsibility:** Coordinate and log interactions.

**Owns:** Sending, delivery logging, call attempt logging.

**Relationships:** Uses templates; used by Automations; tied to Orders.

---

## 13) Email Templates
**Responsibility:** Professional consistency.

**Owns:** Branded templates with variables.

**Relationships:** Used by Communications and Automations.

---

## 14) Documents & Reports
**Responsibility:** Store and deliver outputs.

**Owns:** Reports, attachments, secure links, access logs.

**Relationships:** Attached to Orders; delivered to Agents and Clients; branded.

---

## 15) Financials (Invoices, Payments, Billing)
**Responsibility:** Money visibility and collection.

**Owns:** Invoices per Order, payment records, billing rules.

**Relationships:** Invoices from Services on Orders; payments applied to invoices; shown on Dashboard.

**Not MVP:** Accounting ledger, bank reconciliation.

---

## 16) Payouts (Payroll-aware)
**Responsibility:** Track inspector compensation.

**Owns:** Pay rules, earnings summaries, payout status, exports.

**Relationships:** Calculated from Orders and Services; visible on Orders and Dashboard.

**Not MVP:** Payroll processing, taxes.

---

## 17) Tags (Classification + Operational Signals)
**Responsibility:** Lightweight classification that can influence behavior.

**Owns:** Tag definitions and scope.

**Relationships:**
- Attach to Orders, Clients, Agents, Properties
- Used for filtering and search
- Can modify Workflows and trigger/suppress Automations (MVP-safe)

**Examples:** urgent, do-not-text, client-only, follow-up-required.

**Guardrail:** One tag = one predictable effect.

---

## 18) Branding (Tenant Brand Profile)
**Responsibility:** Establish identity.

**Owns:** Logo, colors, company identity, support contacts.

**Relationships:** Applied subtly in Admin; applied to emails, reports, portals.

**Not MVP:** Custom domains, fonts, deep theming.

---

## 19) Settings & Integrations
**Responsibility:** Define operations and connect tools.

**Owns:** Company profile, roles, communication defaults, financial rules, branding, integrations.

**MVP Integrations:** Phone/SMS, Email, Payments, Accounting export, Payroll export.

---

# Relationship Summary
Services and Templates define the work. Orders run the work. Workflows and Tags control flow. Automations and Communications coordinate people. Reports deliver outcomes. Invoices and Payments collect revenue. Payouts compensate inspectors. The Dashboard exposes what matters now.

---

# Admin MVP Completion Criteria
An inspection company can:
- Configure branding, roles, services, templates
- Create Orders with bundled services
- Schedule and assign inspectors
- Communicate via SMS, email, and call logging
- Use workflows, automations, and tags
- Deliver branded reports
- Invoice, collect payment, and track balances
- Track inspector payouts and export earnings
- Run daily operations without spreadsheets

---

## Notes
Keep Workflows + Automations + Tags simple in MVP. Avoid turning them into a no-code platform.
