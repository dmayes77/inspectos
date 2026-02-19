#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/create-mvp-v2-issues.sh
#
# Requirements:
#   - gh CLI installed and authenticated (gh auth status)
#   - run from repo root

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"
  gh issue create --title "$title" --label "$labels" --body "$body"
}

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  # If label exists this command can fail; ignore and continue.
  gh label create "$name" --color "$color" --description "$description" >/dev/null 2>&1 || true
}

# Bootstrap required labels so issue creation works in fresh repos.
ensure_label "mvp-v2" "1D76DB" "InspectOS MVP v2 initiative"
ensure_label "priority:p0" "B60205" "Critical now"
ensure_label "priority:p1" "D93F0B" "Important next"
ensure_label "priority:p2" "FBCA04" "Planned after P1"
ensure_label "type:backend" "0052CC" "Backend/API work"
ensure_label "type:frontend" "0E8A16" "Frontend/UI work"
ensure_label "type:data" "5319E7" "Data model/migrations"
ensure_label "type:product" "C2E0C6" "Product/copy/positioning"

create_issue \
  "P0-A1: Run and validate business + API + cost model migrations" \
  "mvp-v2,priority:p0,type:data" \
  $'- Run migrations 052, 053, 054, 055 in staging/local.\n- Validate business_id, business_api_keys, and order margin fields.\n\nAcceptance Criteria:\n- Migrations complete with no schema errors.\n- Existing auth + business resolution still works.\n- Margin fields query successfully from orders.'

create_issue \
  "P0-A2: Validate API key auth path across admin endpoints" \
  "mvp-v2,priority:p0,type:backend" \
  $'- Test X-API-Key and Authorization: ApiKey <key> flows.\n- Validate at least 3 admin endpoints with API-key auth.\n- Confirm revoked key access is denied.\n\nAcceptance Criteria:\n- Valid key returns 200 on scoped endpoints.\n- Invalid/revoked key returns unauthorized.\n- last_used_at updates on successful requests.'

create_issue \
  "P0-A3: Ensure raw API keys are only returned once on rotation" \
  "mvp-v2,priority:p0,type:backend" \
  $'- Confirm settings GET/PUT returns preview only.\n- Confirm rotation endpoint returns full key once.\n- Add test coverage for response payload shape.\n\nAcceptance Criteria:\n- No raw key appears in settings GET/PUT payloads.\n- Rotation response includes raw key + preview + timestamp.'

create_issue \
  "P0-B1: Align all public copy to MVP v2 positioning" \
  "mvp-v2,priority:p0,type:product,type:frontend" \
  $'- Replace legacy “all-in-one app” language.\n- Align homepage/pricing/footer/legal touchpoints with new category copy.\n\nAcceptance Criteria:\n- No conflicting positioning language remains on public pages.'

create_issue \
  "P1-A1: Add margin-by-service module to owner dashboard" \
  "mvp-v2,priority:p1,type:backend,type:frontend" \
  $'- Aggregate gross margin by service line.\n- Render top and bottom services by margin.\n- Add period filter (last 7/30/90 days).\n\nAcceptance Criteria:\n- Owner can identify highest and lowest margin services in one view.'

create_issue \
  "P1-A2: Add cost-per-inspection trend visualization" \
  "mvp-v2,priority:p1,type:backend,type:frontend" \
  $'- Compute average total_cost per completed order by period.\n- Add trend chart and delta vs prior period.\n\nAcceptance Criteria:\n- Cost-per-inspection trend and deltas display correctly.'

create_issue \
  "P1-A3: Add referral source ranking by gross margin" \
  "mvp-v2,priority:p1,type:backend,type:frontend" \
  $'- Group orders by source.\n- Rank by gross margin contribution (not only order count).\n\nAcceptance Criteria:\n- Referral ranking table shows margin, orders, avg margin/order.'

create_issue \
  "P1-B1: Add labor/travel/overhead/other cost inputs to order UI" \
  "mvp-v2,priority:p1,type:frontend,type:backend" \
  $'- Add editable cost fields in order create/edit flows.\n- Validate numeric inputs and persistence.\n\nAcceptance Criteria:\n- Cost fields save and update derived margin fields.'

create_issue \
  "P1-B2: Add default overhead configuration for new orders" \
  "mvp-v2,priority:p1,type:backend,type:frontend" \
  $'- Add company-level default overhead settings.\n- Apply default overhead during order creation.\n\nAcceptance Criteria:\n- New orders prefill overhead cost based on settings.'

create_issue \
  "P1-C1: Add profitability export dataset" \
  "mvp-v2,priority:p1,type:backend,type:frontend" \
  $'- Add CSV export containing revenue, costs, margin, margin%, service, source.\n\nAcceptance Criteria:\n- Export downloads and fields reconcile with dashboard values.'

create_issue \
  "P2-A1: Add audit log for sensitive business actions" \
  "mvp-v2,priority:p2,type:backend,type:frontend" \
  $'- Track and display key rotations, role changes, and export actions.\n\nAcceptance Criteria:\n- Owner/admin can view recent audit events with actor + timestamp.'

create_issue \
  "P2-A2: Build self-serve data export center" \
  "mvp-v2,priority:p2,type:backend,type:frontend" \
  $'- Provide export options for key datasets.\n- Surface export status/history.\n\nAcceptance Criteria:\n- Owner/admin can complete standard exports without support.'

create_issue \
  "P2-B1: Implement email open tracking with events" \
  "mvp-v2,priority:p2,type:backend,type:frontend" \
  $'- Add tracking token/pixel events for outbound emails.\n- Surface open rate metrics in admin.\n\nAcceptance Criteria:\n- Open events persist and are visible in reporting views.'

create_issue \
  "P2-B2: Validate and close automation trigger gaps" \
  "mvp-v2,priority:p2,type:backend" \
  $'- Review implemented triggers vs parity target.\n- Add missing trigger coverage and tests.\n\nAcceptance Criteria:\n- Trigger matrix documented and fully green for MVP scope.'

create_issue \
  "P2-B3: Complete tagging and SMS reminder parity paths" \
  "mvp-v2,priority:p2,type:backend,type:frontend" \
  $'- Validate tagging lifecycle flows and reminder dispatch.\n- Add missing UI/endpoint pieces.\n\nAcceptance Criteria:\n- End-to-end tagging + reminder flows function reliably.'

echo "Created MVP v2 issues."
