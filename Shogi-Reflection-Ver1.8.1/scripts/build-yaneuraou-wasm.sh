#!/usr/bin/env bash
set -euo pipefail

# Build the pinned official YaneuraOu V9.00 source as MATERIAL_LEVEL=1 WASM.
# This script deliberately does not download source or silently modify upstream Makefile settings.
# Usage:
#   ./scripts/build-yaneuraou-wasm.sh /path/to/YaneuraOu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ROOT="${1:-}"
PINNED_COMMIT="a5ee2786c0030edc7d4a1cdfe94b04dffec55493"

if [[ -z "$SOURCE_ROOT" || ! -d "$SOURCE_ROOT/.git" ]]; then
  echo "ERROR: pass a local checkout of https://github.com/yaneurao/YaneuraOu" >&2
  exit 2
fi
if ! command -v em++ >/dev/null 2>&1; then
  echo "ERROR: em++ is required. Install/activate an official emsdk version and record it." >&2
  exit 3
fi
ACTUAL_COMMIT="$(git -C "$SOURCE_ROOT" rev-parse HEAD)"
if [[ "$ACTUAL_COMMIT" != "$PINNED_COMMIT" ]]; then
  echo "ERROR: checkout commit mismatch: $ACTUAL_COMMIT" >&2
  echo "Expected: $PINNED_COMMIT" >&2
  exit 4
fi

EM_VERSION="$(em++ --version | head -n 1)"
echo "Pinned YaneuraOu commit: $ACTUAL_COMMIT"
echo "Compiler: $EM_VERSION"
echo "Build: MATERIAL_LEVEL=1 / TARGET_CPU=WASM / COMPILER=em++"

pushd "$SOURCE_ROOT/source" >/dev/null
make -j1 normal \
  TARGET_CPU=WASM \
  COMPILER=em++ \
  YANEURAOU_EDITION=YANEURAOU_ENGINE_MATERIAL \
  MATERIAL_LEVEL=1
popd >/dev/null

OUT_DIR="$ROOT/engine/yaneuraou"
mkdir -p "$OUT_DIR"
for f in yaneuraou.js yaneuraou.wasm yaneuraou.worker.js; do
  if [[ -f "$SOURCE_ROOT/source/$f" ]]; then
    cp "$SOURCE_ROOT/source/$f" "$OUT_DIR/$f"
  fi
done

if [[ ! -f "$OUT_DIR/yaneuraou.js" || ! -f "$OUT_DIR/yaneuraou.wasm" ]]; then
  echo "ERROR: expected yaneuraou.js/yaneuraou.wasm were not produced." >&2
  exit 5
fi

node "$ROOT/scripts/finalize-yaneuraou-manifest.mjs" "$EM_VERSION"

echo
cat <<'NOTICE'
IMPORTANT:
This is only the official-source integration smoke build. The pinned V9.00 Makefile's
Emscripten path includes upstream thread/memory settings (including PTHREAD_POOL_SIZE=32).
Do not call this smartphone-safe or distribution-ready until browser/resource tests and
license/source-distribution gates are completed.
NOTICE
