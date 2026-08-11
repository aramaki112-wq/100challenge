#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ROOT="${1:-}"
OUT_DIR="${2:-$ROOT/corresponding-source}"
RECORD_DIR="${3:-$ROOT/build-record}"
PINNED_COMMIT="${YANEURAOU_COMMIT:-a5ee2786c0030edc7d4a1cdfe94b04dffec55493}"
PATCH_RELATIVE="patches/yaneuraou-v9.00-wasm-usi-bridge.patch"
PATCH_FILE="$ROOT/$PATCH_RELATIVE"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[[ -n "$SOURCE_ROOT" && -d "$SOURCE_ROOT/.git" ]] || fail "pass patched YaneuraOu checkout as argument 1"
[[ -f "$PATCH_FILE" ]] || fail "documented source patch missing: $PATCH_RELATIVE"
[[ "$(git -C "$SOURCE_ROOT" rev-parse HEAD)" == "$PINNED_COMMIT" ]] || fail "corresponding-source commit mismatch"
mkdir -p "$OUT_DIR" "$RECORD_DIR"

git -C "$SOURCE_ROOT" diff --check
git -C "$SOURCE_ROOT" diff --binary --abbrev=7 > "$OUT_DIR/YaneuraOu-ShogiReflection-WASM-USI-Bridge.patch"
cmp -s "$PATCH_FILE" "$OUT_DIR/YaneuraOu-ShogiReflection-WASM-USI-Bridge.patch" || fail "working-tree source modifications differ from reviewed patch"
cp "$PATCH_FILE" "$OUT_DIR/yaneuraou-v9.00-wasm-usi-bridge.patch"
sha256sum "$OUT_DIR/yaneuraou-v9.00-wasm-usi-bridge.patch" | tee "$RECORD_DIR/corresponding-source-patch-sha256.txt"

# Preserve the pristine fixed upstream source separately.
git -C "$SOURCE_ROOT" archive --format=tar.gz \
  --output="$OUT_DIR/YaneuraOu-${PINNED_COMMIT}.tar.gz" "$PINNED_COMMIT"
sha256sum "$OUT_DIR/YaneuraOu-${PINNED_COMMIT}.tar.gz" | tee "$RECORD_DIR/corresponding-source-upstream-sha256.txt"

# Create a deterministic source snapshot corresponding to the modified WASM binary:
# exact upstream commit + the reviewed two-file bridge patch, with no compiler outputs.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git -C "$SOURCE_ROOT" archive "$PINNED_COMMIT" | tar -x -C "$TMP"
(
  cd "$TMP"
  patch -p1 < "$PATCH_FILE"
)
SOURCE_DATE_EPOCH="$(git -C "$SOURCE_ROOT" show -s --format=%ct "$PINNED_COMMIT")"
MODIFIED_ARCHIVE="$OUT_DIR/YaneuraOu-${PINNED_COMMIT}-ShogiReflection-WASM-USI-Bridge.tar.gz"
tar --sort=name --mtime="@$SOURCE_DATE_EPOCH" --owner=0 --group=0 --numeric-owner \
  -czf "$MODIFIED_ARCHIVE" -C "$TMP" .
sha256sum "$MODIFIED_ARCHIVE" | tee "$RECORD_DIR/corresponding-source-modified-sha256.txt"

cp "$SOURCE_ROOT/README.md" "$OUT_DIR/YaneuraOu-README.md"
if [[ -f "$SOURCE_ROOT/Copying.txt" ]]; then cp "$SOURCE_ROOT/Copying.txt" "$OUT_DIR/YaneuraOu-Copying.txt"; fi
cp "$SOURCE_ROOT/source/Makefile" "$OUT_DIR/YaneuraOu-source-Makefile"
cp "$SOURCE_ROOT/source/wasm_pre.js" "$OUT_DIR/YaneuraOu-source-wasm_pre.js"
cp "$SOURCE_ROOT/script/wasm_build.js" "$OUT_DIR/YaneuraOu-script-wasm_build.js"
cp "$SOURCE_ROOT/.github/workflows/make-wasm.yml" "$OUT_DIR/YaneuraOu-upstream-make-wasm.yml"

cat > "$OUT_DIR/SOURCE_MODIFICATION_MANIFEST.txt" <<MANIFEST
YaneuraOu corresponding-source modification manifest
Base repository: https://github.com/yaneurao/YaneuraOu
Base commit: $PINNED_COMMIT
Base release: V9.00
Source modified: YES
Patch: $PATCH_RELATIVE
Patch SHA-256: $(sha256sum "$PATCH_FILE" | awk '{print $1}')
Modified files:
$(cat "$RECORD_DIR/source-modified-files.txt")
Reason: restore a current-API Emscripten USI command export/lifetime bridge required by the pinned wasm_pre.js command queue; the legacy source wrapper at this commit is disabled by #if 0.
Build profile: MATERIAL_LEVEL=1 / TARGET_CPU=WASM / Emscripten 3.1.43 upstream-compatible Docker toolchain
MANIFEST

echo "Corresponding Source evidence packaged for pinned upstream + documented WASM USI bridge patch."
