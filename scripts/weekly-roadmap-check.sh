#!/usr/bin/env bash
set -euo pipefail

# Weekly roadmap command-center report
# Usage:
#   bash scripts/weekly-roadmap-check.sh

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_cmd gh
require_cmd jq

print_block() {
  local title="$1"
  local query="$2"
  echo
  echo "=== $title ==="
  gh issue list --search "$query" --limit 50 --json number,title,labels,assignees,state | jq -r '
    if length == 0 then "(none)"
    else .[] | "#\(.number) [\(.state)] \(.title)"
    end
  '
}

echo "InspectOS Weekly Roadmap Check"

echo
printf "%-34s %s\n" "Open P0:" "$(gh issue list --search 'is:open label:mvp-v2 label:priority:p0' --limit 200 --json number | jq 'length')"
printf "%-34s %s\n" "Open P1:" "$(gh issue list --search 'is:open label:mvp-v2 label:priority:p1' --limit 200 --json number | jq 'length')"
printf "%-34s %s\n" "Open P2:" "$(gh issue list --search 'is:open label:mvp-v2 label:priority:p2' --limit 200 --json number | jq 'length')"

print_block "Decision Hub Track (open)" "is:open label:track:decision-hub"
print_block "In Progress" "is:open label:status:in-progress"
print_block "Blocked" "is:open label:status:blocked"
print_block "Ready (top planning queue)" "is:open label:status:ready sort:created-asc"
