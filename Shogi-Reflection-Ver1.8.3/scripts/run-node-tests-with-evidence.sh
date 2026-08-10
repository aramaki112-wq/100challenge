#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/build-record"
LOG="$ROOT/build-record/node-test.tap"
set +e
node --test 2>&1 | tee "$LOG"
status=${PIPESTATUS[0]}
set -e
pass="$(awk '/^# pass /{v=$3} END{print v+0}' "$LOG")"
fail="$(awk '/^# fail /{v=$3} END{print v+0}' "$LOG")"
cancelled="$(awk '/^# cancelled /{v=$3} END{print v+0}' "$LOG")"
skipped="$(awk '/^# skipped /{v=$3} END{print v+0}' "$LOG")"
total="$(awk '/^# tests /{v=$3} END{print v+0}' "$LOG")"
cat > "$ROOT/TEST_RESULT.txt" <<EOF
Shogi Reflection Ver.1.8.3 Automated Test Result
================================================
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Command: node --test
Tests: $total
Passed: $pass
Failed: $fail
Cancelled: $cancelled
Skipped: $skipped
Full TAP log: build-record/node-test.tap
EOF
[[ $status -eq 0 && $fail -eq 0 ]] || exit "${status:-1}"
