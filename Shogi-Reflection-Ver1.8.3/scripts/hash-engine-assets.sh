#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="${1:-$ROOT/engine/yaneuraou}"
OUT="$ROOT/ENGINE_ASSET_SHA256SUMS.txt"
BOOTSTRAP="$ENGINE_DIR/YaneuraOuWasmWorkerBootstrap.js"
JS="$ENGINE_DIR/yaneuraou.material.js"
WORKER="$ENGINE_DIR/yaneuraou.material.worker.js"
WASM="$ENGINE_DIR/yaneuraou.material.wasm"
for f in "$JS" "$WORKER" "$WASM" "$BOOTSTRAP"; do
  [[ -s "$f" ]] || { echo "missing runtime asset: $f" >&2; exit 2; }
done
mapfile -t workers < <(find "$ENGINE_DIR" -maxdepth 1 -type f -name 'yaneuraou.material*.worker.js' -print | sort)
[[ ${#workers[@]} -eq 1 ]] || { echo "Emscripten 3.1.43 official material build must have exactly one worker.js; found ${#workers[@]}" >&2; exit 3; }
{
  echo "# SHA-256 generated from actual runtime assets"
  echo "# Pinned upstream-compatible toolchain: Emscripten 3.1.43; separate pthread worker expected."
  sha256sum "$JS"
  sha256sum "$WORKER"
  sha256sum "$WASM"
  sha256sum "$BOOTSTRAP"
} | sed "s#${ROOT}/##g" | tee "$OUT"
