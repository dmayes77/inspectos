# MVP Validation Run (10 Jobs)

Last updated: March 1, 2026
Branch: `feature/mvp-lifecycle-core`
Owner: Product + Engineering

## Goal
Validate that the MVP lifecycle works end-to-end in real usage with no manual workaround:

Lead/Client intake -> Order created -> Scheduled/assigned -> Inspection executed -> Invoice sent -> Payment recorded -> Report exported/shared

## Rules
1. Run 10 real or realistic jobs through the exact lifecycle.
2. No spreadsheet/manual fallback allowed.
3. Any failed stage must include a root-cause note and blocker ticket.
4. Only fix blockers that break lifecycle completion, speed, or reliability.

## Job Tracker
Legend: `Y` = passed, `N` = failed

| Job # | Intake | Order | Schedule | Inspect (App) | Invoice Sent | Payment Recorded | Report Shared | End-to-End Pass | Time Order->Payment | Failure Notes / Root Cause |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |  |

## KPI Scorecard
Fill after all 10 jobs:

1. Total jobs attempted: `10`
2. End-to-end passes: `__ / 10`
3. End-to-end completion rate: `__%`
4. Jobs with valid invoice + payment records: `__ / 10`
5. Invoice + payment integrity rate: `__%`
6. Average time from order creation to payment: `__`
7. Total failed stage events: `__`
8. Most frequent failed stage: `__`

## Blocker Log (P0 Only)
| Blocker ID | Job # | Stage | Symptom | Root Cause | Fix Owner | Status |
|---|---|---|---|---|---|---|
| B-001 |  |  |  |  |  |  |
| B-002 |  |  |  |  |  |  |
| B-003 |  |  |  |  |  |  |

## Exit Criteria (Pass/Fail)
MVP lifecycle is considered validated when:
1. At least 9/10 jobs pass end-to-end.
2. At least 9/10 jobs have valid invoice + payment records.
3. No unresolved P0 blocker remains in the lifecycle.

If any criterion fails, continue blocker-only fixes and run another 10-job cycle.
