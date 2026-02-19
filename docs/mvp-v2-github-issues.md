# MVP v2 GitHub Issue Pack

Use this file to create issues directly in GitHub.  
Recommended labels:
- `mvp-v2`
- `priority:p0` / `priority:p1` / `priority:p2`
- `type:backend` / `type:frontend` / `type:data` / `type:product`

## 1. P0-A1 Run and Validate Core Migrations
**Title:** `P0-A1: Run and validate business + API + cost model migrations`
**Labels:** `mvp-v2`, `priority:p0`, `type:data`
**Body:**
- Run migrations `052`, `053`, `054`, `055` in staging/local.
- Verify:
  - `tenants.business_id` is populated and unique.
  - `business_api_keys` table exists and active keys resolve.
  - `orders` has cost and generated margin fields.
- Add rollback/mitigation notes to migration docs.
**Acceptance Criteria:**
- Migrations complete with no schema errors.
- Existing auth + business resolution still works.
- Margin fields query successfully from orders.

## 2. P0-A2 API Key Auth Verification
**Title:** `P0-A2: Validate API key auth path across admin endpoints`
**Labels:** `mvp-v2`, `priority:p0`, `type:backend`
**Body:**
- Test `X-API-Key` and `Authorization: ApiKey <key>` flows.
- Validate at least 3 admin endpoints with API-key auth.
- Confirm revoked key access is denied.
**Acceptance Criteria:**
- Valid key returns 200 on scoped endpoints.
- Invalid/revoked key returns unauthorized.
- `last_used_at` updates on successful requests.

## 3. P0-A3 Remove Persistent Raw Key Exposure
**Title:** `P0-A3: Ensure raw API keys are only returned once on rotation`
**Labels:** `mvp-v2`, `priority:p0`, `type:backend`
**Body:**
- Confirm settings GET/PUT returns preview only.
- Confirm rotation endpoint returns raw key once.
- Add test coverage for response payload shape.
**Acceptance Criteria:**
- No raw key appears in settings GET/PUT payloads.
- Rotation response includes raw key + preview + timestamp.

## 4. P0-B1 Public Messaging Consistency Sweep
**Title:** `P0-B1: Align all public copy to MVP v2 positioning`
**Labels:** `mvp-v2`, `priority:p0`, `type:product`, `type:frontend`
**Body:**
- Replace legacy “all-in-one app” language.
- Align homepage/pricing/footer/legal touchpoints with:
  - “Inspection Business Operating System”
  - “Profit over productivity”
- Verify CTA copy consistency.
**Acceptance Criteria:**
- No conflicting positioning language remains on public pages.

## 5. P1-A1 Margin by Service Module
**Title:** `P1-A1: Add margin-by-service module to owner dashboard`
**Labels:** `mvp-v2`, `priority:p1`, `type:backend`, `type:frontend`
**Body:**
- Aggregate gross margin by service line.
- Render top and bottom services by margin.
- Add period filter (last 7/30/90 days).
**Acceptance Criteria:**
- Owner can identify highest and lowest margin services in one view.

## 6. P1-A2 Cost per Inspection Trend
**Title:** `P1-A2: Add cost-per-inspection trend visualization`
**Labels:** `mvp-v2`, `priority:p1`, `type:backend`, `type:frontend`
**Body:**
- Compute average total_cost per completed order by period.
- Add trend chart and delta vs prior period.
**Acceptance Criteria:**
- Cost-per-inspection trend and deltas display correctly.

## 7. P1-A3 Referral Value by Margin
**Title:** `P1-A3: Add referral source ranking by gross margin`
**Labels:** `mvp-v2`, `priority:p1`, `type:backend`, `type:frontend`
**Body:**
- Group orders by `source`.
- Rank by gross margin contribution (not only order count).
**Acceptance Criteria:**
- Referral ranking table shows margin, orders, avg margin/order.

## 7b. P1-D1 Full Decision Hub Command Center
**Title:** `P1-D1: Implement full decision hub command center on overview`
**Labels:** `mvp-v2`, `priority:p1`, `type:frontend`, `type:backend`, `type:product`
**Body:**
- Expand overview from v1 analytics to full decision workflow:
  - Time range controls (7/30/90/custom) + prior-period compare.
  - KPI drilldowns by service/source/inspector.
  - In-context actions (price review task, owner follow-up task, filtered export).
  - Configurable margin thresholds with alerts.
- Ensure all decisions can be taken without leaving the dashboard context.
**Acceptance Criteria:**
- Owner can detect a margin issue, drill to root cause, and trigger next action from one screen.
- All top-level KPI cards have at least one drilldown path.
- Margin threshold breaches are visually flagged and filterable.

## 8. P1-B1 Cost Inputs in Order Workflow
**Title:** `P1-B1: Add labor/travel/overhead/other cost inputs to order UI`
**Labels:** `mvp-v2`, `priority:p1`, `type:frontend`, `type:backend`
**Body:**
- Add editable cost fields in order create/edit flows.
- Validate numeric inputs and persistence.
**Acceptance Criteria:**
- Cost fields save and update derived margin fields.

## 9. P1-B2 Default Overhead Model
**Title:** `P1-B2: Add default overhead configuration for new orders`
**Labels:** `mvp-v2`, `priority:p1`, `type:backend`, `type:frontend`
**Body:**
- Add company-level default overhead settings.
- Apply default overhead during order creation.
**Acceptance Criteria:**
- New orders prefill overhead cost based on settings.

## 10. P1-C1 Profitability CSV Export
**Title:** `P1-C1: Add profitability export dataset`
**Labels:** `mvp-v2`, `priority:p1`, `type:backend`, `type:frontend`
**Body:**
- Add CSV export containing revenue, costs, margin, margin%, service, source.
**Acceptance Criteria:**
- Export downloads and fields reconcile with dashboard values.

## 11. P2-A1 Audit Log UI
**Title:** `P2-A1: Add audit log for sensitive business actions`
**Labels:** `mvp-v2`, `priority:p2`, `type:backend`, `type:frontend`
**Body:**
- Track and display:
  - API key rotation/revocation
  - Role changes
  - Data export actions
**Acceptance Criteria:**
- Owner/admin can view recent audit events with actor + timestamp.

## 12. P2-A2 Self-Serve Export Center
**Title:** `P2-A2: Build self-serve data export center`
**Labels:** `mvp-v2`, `priority:p2`, `type:backend`, `type:frontend`
**Body:**
- Provide export options for key datasets.
- Surface export status/history.
**Acceptance Criteria:**
- Owner/admin can complete standard exports without support.

## 13. P2-B1 Email Open Tracking
**Title:** `P2-B1: Implement email open tracking with events`
**Labels:** `mvp-v2`, `priority:p2`, `type:backend`, `type:frontend`
**Body:**
- Add tracking token/pixel events for outbound emails.
- Surface open rate metrics in admin.
**Acceptance Criteria:**
- Open events persist and are visible in reporting views.

## 14. P2-B2 Automations Trigger Coverage
**Title:** `P2-B2: Validate and close automation trigger gaps`
**Labels:** `mvp-v2`, `priority:p2`, `type:backend`
**Body:**
- Review implemented triggers vs parity target.
- Add missing trigger coverage and tests.
**Acceptance Criteria:**
- Trigger matrix documented and fully green for MVP scope.

## 15. P2-B3 Tagging + SMS Reminder Workflow Validation
**Title:** `P2-B3: Complete tagging and SMS reminder parity paths`
**Labels:** `mvp-v2`, `priority:p2`, `type:backend`, `type:frontend`
**Body:**
- Validate tagging lifecycle flows and reminder dispatch.
- Add missing UI/endpoint pieces.
**Acceptance Criteria:**
- End-to-end tagging + reminder flows function reliably.
