#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="${1:-$ROOT/engine/yaneuraou}"
OUT="$ROOT/ENGINE_ASSET_SHA256SUMS.txt"
BOOTSTRAP="$ROOT/YaneuraOuWasmWorkerBootstrap.js"
[[ -s "$ENGINE_DIR/yaneuraou.js" ]] || { echo "missing yaneuraou.js" >&2; exit 2; }
[[ -s "$ENGINE_DIR/yaneuraou.wasm" ]] || { echo "missing yaneuraou.wasm" >&2; exit 2; }
[[ -s "$BOOTSTRAP" ]] || { echo "missing YaneuraOuWasmWorkerBootstrap.js" >&2; exit 2; }
mapfile -t workers < <(find "$ENGINE_DIR" -maxdepth 1 -type f -name 'yaneuraou*.worker.js' -print | sort)
[[ ${#workers[@]} -eq 0 ]] || { echo "Emscripten 4.0.15 should not emit a separate yaneuraou*.worker.js; found ${#workers[@]}" >&2; exit 3; }
{
  echo "# SHA-256 generated from actual runtime assets"
  echo "# Emscripten 4.0.15 pthread packaging: main generated JS is reused by pthread Workers; no separate .worker.js is emitted."
  sha256sum "$ENGINE_DIR/yaneuraou.js"
  sha256sum "$ENGINE_DIR/yaneuraou.wasm"
  sha256sum "$BOOTSTRAP"
} | sed "s#${ROOT}/##g" | tee "$OUT"
