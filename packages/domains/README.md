# Domains

Domain packages contain business logic, schemas, validation, and workflows.

Rules:
- No UI or app routing.
- May depend on packages/platform and shared only.
- Expose a stable entrypoint at packages/domains/<domain>/index.ts.
