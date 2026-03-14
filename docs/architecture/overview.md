# Architecture Overview (Draft)

## Goals
- Make code placement obvious and consistent.
- Keep domain logic reusable without leaking into UI or app wiring.
- Enforce boundaries so the structure stays clean over time.

## Repo Map (Target)
- apps/
  - UI + app-specific wiring only (routing, screens, app entrypoints, adapters).
  - No shared business logic beyond local composition.
- packages/
  - domains/
    - <domain>/
      - Business logic, schemas, validation, workflows, domain services.
      - No UI and no app-specific routing.
  - platform/
    - Shared infrastructure: auth, db access, logging, feature flags, API clients.
- shared/
  - Primitives only: types, small utils, UI tokens, constants.
  - No domain workflows or app wiring.
- database/
  - DB schema, migrations, SQL utilities.
- auth/
  - Auth-related configuration and utilities.
- docs/
  - Architecture and operational docs.
- scripts/
  - One-off scripts and maintenance tooling.

## Dependency Rules (Target)
- apps/* may import from packages/* and shared/*.
- packages/domains/* may import from packages/platform/* and shared/* only.
- packages/platform/* may import from shared/* only.
- shared/* has no dependency on apps/* or packages/*.
- apps/* must not import from other apps/*.
- domains must not import from other domains directly. Use a domain service in platform if cross-domain coordination is required.

## Naming Conventions
- Domain names are singular and consistent across apps (e.g., orders, inspections, users).
- Domain entrypoints live at packages/domains/<domain>/index.ts.
- Shared primitives are grouped by intent (e.g., shared/types, shared/utils, shared/ui-tokens).

## What Belongs Where (Quick Guide)
- Domain validation, business rules, workflows -> packages/domains/<domain>/
- API clients, auth integration, database access -> packages/platform/
- React components, routes, app bootstrapping -> apps/<app>/
- Small utilities and types used everywhere -> shared/

## Enforcement
- Add ESLint import-boundary rules for the dependency constraints.
- Add a simple lint check in CI to prevent new violations.
