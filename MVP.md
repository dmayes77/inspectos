# InspectOS MVP Scope

## Goal
Deliver a production-ready inspection operations platform that supports end-to-end order management **and** the operational tooling required to run the business (portals, billing, templates, notifications).

## MVP Must-Have Capabilities

### Core order management
- Create and edit orders with shared OrderForm (new/edit).
- Inline creation of clients, properties, and agents from order workflows.
- Service search, selection, and real-time pricing/duration totals.
- Order detail view with services, schedule, financials, notes, and activity timeline.

### Customer & agent portals
- Dedicated portals for customers and agents to view their orders/inspections, status, and relevant documents.
- Role-appropriate access controls and permissions.

### Billing & invoicing automation
- Automated invoice creation tied to orders.
- Payment status tracking and basic reconciliation (paid/unpaid/overdue).
- Integration-ready hooks for payment processing.

### Inspection template builder
- UI to create and manage inspection templates with sections, fields, and required responses.
- Versioning for templates used in live inspections.

### Notifications & automations
- Configurable triggers for order creation, scheduling, inspection completion, and invoice events.
- Email/SMS or in-app notifications to customers, agents, and admins.

## MVP Launch Criteria
- All must-have capabilities above are implemented and usable by admins, customers, and agents.
- Core order creation and inline entity creation are reliable without backend errors.
- Portals, billing automation, template builder, and notifications are functional for at least one complete customer journey.
