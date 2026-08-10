#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT="${1:-}"
[[ -d "$ARTIFACT" ]] || { echo "Usage: $0 /path/to/downloaded-build-artifact" >&2; exit 2; }
for f in ENGINE_BUILD_METADATA.json ENGINE_BUILD_RESULT.txt ENGINE_ASSET_SHA256SUMS.txt; do [[ -f "$ARTIFACT/$f" ]] || { echo "missing artifact file: $f" >&2; exit 3; }; done
[[ -d "$ARTIFACT/engine/yaneuraou" ]] || { echo "missing artifact engine/yaneuraou" >&2; exit 3; }
cp -a "$ARTIFACT/engine/yaneuraou/." "$ROOT/engine/yaneuraou/"
cp "$ARTIFACT/ENGINE_BUILD_METADATA.json" "$ROOT/ENGINE_BUILD_METADATA.json"
cp "$ARTIFACT/ENGINE_BUILD_RESULT.txt" "$ROOT/ENGINE_BUILD_RESULT.txt"
cp "$ARTIFACT/ENGINE_ASSET_SHA256SUMS.txt" "$ROOT/ENGINE_ASSET_SHA256SUMS.txt"
node "$ROOT/scripts/real-yaneuraou-artifact-gate.mjs"
echo "Build artifact integrated and hash-verified. Real Browser/USI/E2E still must be run before Formal Completion."
