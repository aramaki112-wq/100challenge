#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Shogi Reflection app directory required}"
MINIMAL_RUNTIME="$APP_DIR/minimal-real-usi/runtime"
GATE_DIR="$APP_DIR/adapter-real-gate"
RUNTIME_DIR="$GATE_DIR/runtime"
EVIDENCE_DIR="$GATE_DIR/evidence"

mkdir -p "$RUNTIME_DIR" "$EVIDENCE_DIR"
rm -f "$RUNTIME_DIR"/*

for file in yaneuraou.material.js yaneuraou.material.wasm yaneuraou.material.worker.js; do
  test -s "$MINIMAL_RUNTIME/$file"
  cp "$MINIMAL_RUNTIME/$file" "$RUNTIME_DIR/$file"
done

test -s "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js"
cp "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" "$RUNTIME_DIR/YaneuraOuWasmWorkerBootstrap.js"
cmp -s "$APP_DIR/YaneuraOuWasmWorkerBootstrap.js" "$RUNTIME_DIR/YaneuraOuWasmWorkerBootstrap.js"

sha256sum "$RUNTIME_DIR"/* | tee "$EVIDENCE_DIR/adapter-runtime-sha256.txt"
printf '%s\n' \
  'Browser UI -> YaneuraOuWasmAdapter -> BrowserWorkerUsiTransport -> production YaneuraOuWasmWorkerBootstrap.js -> Real YaneuraOu WASM' \
  > "$EVIDENCE_DIR/adapter-chain.txt"
