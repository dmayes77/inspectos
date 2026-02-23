#!/usr/bin/env bash
set -euo pipefail

# Bootstraps roadmap governance in GitHub:
# - labels for status + track
# - milestones for MVP phases
# - maps existing MVP issues to milestones by title prefix
#
# Usage:
#   bash scripts/setup-roadmap-ops.sh

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_cmd gh
require_cmd jq

repo_full=$(gh repo view --json nameWithOwner -q .nameWithOwner)
owner=${repo_full%/*}
repo=${repo_full#*/}

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  gh label create "$name" --color "$color" --description "$description" >/dev/null 2>&1 || true
}

ensure_milestone() {
  local title="$1"
  local description="$2"

  local existing
  existing=$(gh api "repos/$owner/$repo/milestones?state=all&per_page=100" --jq ".[] | select(.title == \"$title\") | .number" | head -n1 || true)

  if [[ -z "$existing" ]]; then
    gh api "repos/$owner/$repo/milestones" \
      --method POST \
      -f title="$title" \
      -f description="$description" >/dev/null
  fi
}

find_milestone_number() {
  local title="$1"
  gh api "repos/$owner/$repo/milestones?state=all&per_page=100" --jq ".[] | select(.title == \"$title\") | .number" | head -n1
}

move_issue_to_milestone() {
  local issue_number="$1"
  local milestone_number="$2"

  gh api "repos/$owner/$repo/issues/$issue_number" \
    --method PATCH \
    -F milestone="$milestone_number" >/dev/null
}

echo "Configuring labels in $repo_full"
ensure_label "status:ready" "1D76DB" "Ready for planning"
ensure_label "status:in-progress" "FBCA04" "Actively being worked"
ensure_label "status:blocked" "B60205" "Blocked by dependency or decision"
ensure_label "status:done" "0E8A16" "Completed"

ensure_label "track:decision-hub" "5319E7" "Owner decision engine work"
ensure_label "track:trust" "0052CC" "Security, trust, data sovereignty"
ensure_label "track:parity" "D93F0B" "Market admission parity work"

echo "Configuring milestones"
ensure_milestone "MVP v2 P0" "Foundation and credibility: migrations, auth hardening, positioning consistency"
ensure_milestone "MVP v2 P1" "Decision engine MVP: owner dashboard, cost capture, profit export"
ensure_milestone "MVP v2 P2" "Trust surface + parity enforcement"
ensure_milestone "Decision Hub Command Center" "Full decision loop: detect -> drill -> act -> measure"

p0_number=$(find_milestone_number "MVP v2 P0")
p1_number=$(find_milestone_number "MVP v2 P1")
p2_number=$(find_milestone_number "MVP v2 P2")
dhub_number=$(find_milestone_number "Decision Hub Command Center")

if [[ -z "$p0_number" || -z "$p1_number" || -z "$p2_number" || -z "$dhub_number" ]]; then
  echo "Failed to resolve one or more milestone numbers" >&2
  exit 1
fi

echo "Mapping existing MVP issues to milestones"

# Pull all open/closed MVP issues (first 200)
issues_json=$(gh issue list --limit 200 --state all --label "mvp-v2" --json number,title)

while IFS= read -r item; do
  number=$(jq -r '.number' <<<"$item")
  title=$(jq -r '.title' <<<"$item")

  case "$title" in
    P0-*)
      move_issue_to_milestone "$number" "$p0_number"
      ;;
    P1-*)
      move_issue_to_milestone "$number" "$p1_number"
      ;;
    P2-*)
      move_issue_to_milestone "$number" "$p2_number"
      ;;
  esac

  # Pin command-center issue explicitly to Decision Hub milestone too
  if [[ "$title" == "P1-D1: Implement full decision hub command center on overview" ]]; then
    move_issue_to_milestone "$number" "$dhub_number"
    gh issue edit "$number" --add-label "track:decision-hub,status:ready" >/dev/null 2>&1 || true
  fi

done < <(jq -c '.[]' <<<"$issues_json")

echo "Roadmap setup complete."
