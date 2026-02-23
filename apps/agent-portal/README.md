# Agent Portal Direction

This folder is reserved for the future `apps/agent-portal` app.

## Purpose

The agent portal is a dedicated experience for external real estate agents to:

- view their referrals and order statuses
- access reports and key order details
- manage their own profile/contact preferences
- switch between businesses when the same email belongs to multiple tenant agent records

## Growth Loop

Agent portal is not only a feature; it is a distribution channel.

- Tenants promote their agent portal to win and retain agent relationships.
- Agents experience faster order/report visibility and transparent earnings.
- Agents mention InspectOS to other inspection companies.
- New companies adopt InspectOS to offer the same agent experience.

This creates two-way word-of-mouth: tenant-to-agent and agent-to-tenant.

## Core Product Rules

- `tenant_members` remain globally isolated for internal users.
- `agents` are tenant-scoped records.
- Agent emails can repeat across tenants, but should be unique within a tenant.
- Agents must sign in with the email attached to their agent records.
- All agent portal data access must be tenant-scoped after workspace selection.
- Agents should only see information tied to their own agent record in the selected tenant.

## Tenant Control (Primary Principle)

The most important rule: tenants control their own data and agent access.

- Agent access is tenant-invited and tenant-managed (no open self-signup).
- Each tenant can enable/disable portal access per agent record.
- Multi-tenant agents only see workspaces where access is currently enabled.
- Disabling access in tenant C must immediately remove tenant C from that agent's workspace list.
- Session context is always `(tenant_id, agent_id)` and cannot be widened.

## Auth and Session Model

### Phase 1 (recommended baseline)

- Agent requests a magic link by email.
- API resolves all active `agents` rows matching that email.
- Filter to rows with portal access enabled for that tenant-agent record.
- If exactly one tenant match:
  - create a tenant-scoped session and redirect directly.
- If multiple tenant matches:
  - show a tenant picker (company cards).
  - on selection, create a session bound to `(session_type='agent', agent_id, tenant_id)`.
- If zero matches:
  - show "Ask your inspection company to invite you."

### Session requirements

- Session token must map to exactly one `agent_id` and one `tenant_id`.
- Every portal API endpoint must validate both the agent and tenant from session.
- No cross-tenant data should be queryable from one session.

## Data Access Boundaries

The portal should only expose:

- agent profile info for the selected tenant
- orders where `orders.agent_id = current_agent_id`
- report files and metadata tied to those orders
- notifications/preferences for that agent record

The portal should not expose:

- tenant admin settings
- billing
- team/staff management
- unrelated client or order data

## UX Guidelines

- Keep the portal minimal and fast.
- Prioritize:
  1. `My Orders`
  2. `Reports`
  3. `My Profile`
- If multi-tenant email:
  - show clear company name, logo, and city/state in selector.
  - include a quick "Switch business" action in user menu.

## API Surface (planned)

- `POST /api/agent-portal/auth/request-link`
- `GET /api/agent-portal/auth/confirm`
- `GET /api/agent-portal/workspaces` (for multi-tenant email)
- `POST /api/agent-portal/workspaces/select`
- `GET /api/agent-portal/me`
- `GET /api/agent-portal/orders`
- `GET /api/agent-portal/orders/:id`
- `GET /api/agent-portal/reports/:id`
- `PATCH /api/agent-portal/me`

## Security Requirements

- Enforce rate limits on link request and confirm endpoints.
- Log auth events (request, success, failure, workspace selection).
- Expire and rotate portal sessions.
- Deny access when tenant subscription/business status blocks portal usage.
- Re-check tenant access flag on session creation and on protected requests.

## Rollout Plan

1. Scaffold `apps/agent-portal` Next.js app.
2. Add auth entry + tenant picker flow.
3. Ship read-only orders/report views.
4. Add profile editing + preference controls.
5. Add observability, audits, and hardening.

## Non-Goals

- Replacing dashboard functionality.
- Shared session with dashboard/admin users.
- Cross-tenant aggregated views for agents.
