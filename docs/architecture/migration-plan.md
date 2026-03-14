# Architecture Migration Plan (Draft)

## Phase 0: Inventory (1-2 days)
- Identify top 3 domains in active development (likely orders, inspections, users).
- Locate existing domain logic scattered in apps/* and shared/*.
- Document current coupling pain points.

## Phase 1: Establish Structure (1 day)
- Create packages/domains and packages/platform (empty scaffolds).
- Add docs/architecture/overview.md as the source of truth.
- Define dependency rules and add lint scaffolding (even if initially warn-only).

## Phase 2: Pilot Domain (2-4 days)
- Pick one domain with clear boundaries (recommend orders).
- Move domain logic to packages/domains/orders.
- Create a thin adapter in apps/* that calls the domain package.
- Add tests around the domain package if missing.

## Phase 3: Platform Extraction (2-4 days)
- Extract shared infrastructure to packages/platform (db, auth, logging, api clients).
- Replace direct infra usage in domains with platform adapters.

## Phase 4: Expand Domains (ongoing)
- Move remaining domains into packages/domains/<domain>.
- Enforce lint rules as errors (not warnings).
- Track progress in a simple checklist.

## Phase 5: Cleanup (1-2 days)
- Shrink shared/ to primitives only.
- Remove unused files and update imports.

## Risks and Mitigations
- Risk: large refactors breaking production.
  - Mitigation: move domain-by-domain with incremental PRs and tests.
- Risk: platform becomes dumping ground.
  - Mitigation: keep platform strictly infra and cross-domain orchestration only.

## Success Criteria
- New features land in a predictable place.
- Cross-app reuse happens through packages/domains or packages/platform, not shared/.
- Lint rules prevent new architecture drift.
