#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="${1:-$ROOT/engine/yaneuraou}"
OUT="$ROOT/ENGINE_ASSET_SHA256SUMS.txt"
[[ -s "$ENGINE_DIR/yaneuraou.js" ]] || { echo "missing yaneuraou.js" >&2; exit 2; }
[[ -s "$ENGINE_DIR/yaneuraou.wasm" ]] || { echo "missing yaneuraou.wasm" >&2; exit 2; }
mapfile -t workers < <(find "$ENGINE_DIR" -maxdepth 1 -type f -name 'yaneuraou*.worker.js' -print | sort)
[[ ${#workers[@]} -eq 1 ]] || { echo "expected one yaneuraou*.worker.js; found ${#workers[@]}" >&2; exit 3; }
{
  echo "# SHA-256 generated from actual build outputs"
  sha256sum "$ENGINE_DIR/yaneuraou.js"
  sha256sum "$ENGINE_DIR/yaneuraou.wasm"
  sha256sum "${workers[0]}"
} | sed "s#${ROOT}/##g" | tee "$OUT"
