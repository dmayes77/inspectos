# Platform

Platform packages contain shared infrastructure and cross-cutting services.

Examples:
- Auth integration
- Database access
- Logging and tracing
- Feature flags
- API clients

Rules:
- No UI.
- May depend on shared only.
- Expose stable entrypoints at packages/platform/<module>/index.ts.
