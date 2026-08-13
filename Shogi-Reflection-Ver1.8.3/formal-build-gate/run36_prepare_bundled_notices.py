#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

APP = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
LOCK = json.loads((APP / "RUN36_FORMAL_RELEASE_LOCK.json").read_text(encoding="utf-8"))
META = json.loads((APP / "ENGINE_BUILD_METADATA.json").read_text(encoding="utf-8"))
MAN = json.loads((APP / "engine" / "yaneuraou" / "engine-manifest.json").read_text(encoding="utf-8"))


def require(cond: bool, message: str) -> None:
    if not cond:
        raise SystemExit("RUN36 NOTICE PREP FAIL: " + message)


require(META.get("measured") is True, "Build Metadata is not measured")
require(META.get("diagnosticBuild") is False, "diagnostic build must not be described as bundled Formal runtime")
require(MAN.get("available") is True, "production engine manifest is not available")
require(MAN.get("diagnosticBuild") is False, "production engine manifest is diagnostic")
require(MAN.get("commitHash") == LOCK["engine"]["commit"], "manifest commit differs from Run36 release lock")

actual = {
    "js": MAN.get("jsSha256"),
    "wasm": MAN.get("wasmSha256"),
    "pthreadWorker": MAN.get("workerSha256"),
    "productionWorkerBootstrap": MAN.get("workerBootstrapSha256"),
}
require(actual == LOCK["runtimeHashes"], "manifest runtime hashes differ from frozen Run36 release lock")

notice = f"""# THIRD_PARTY_NOTICES — Shogi Reflection Ver.1.8.3 Run #36 Candidate

Status: exact-hash non-diagnostic Real YaneuraOu runtime is bundled for the Run #36 technical verification package. Final Formal Completion is not declared by this pre-final notice.

## YaneuraOu

- Project: YaneuraOu
- Release: V9.00
- Exact commit: `{LOCK['engine']['commit']}`
- Evaluation: MATERIAL / MATERIAL_LEVEL=1
- Source modified: yes — only the documented Run #36 source patches are accepted
- Third-party NNUE / 水匠 weights: not included

## Exact generated runtime hashes

- `engine/yaneuraou/yaneuraou.material.js`: `{actual['js']}`
- `engine/yaneuraou/yaneuraou.material.wasm`: `{actual['wasm']}`
- `engine/yaneuraou/yaneuraou.material.worker.js`: `{actual['pthreadWorker']}`
- `engine/yaneuraou/YaneuraOuWasmWorkerBootstrap.js`: `{actual['productionWorkerBootstrap']}`

The first three files are generated from the pinned YaneuraOu/Emscripten build path. `YaneuraOuWasmWorkerBootstrap.js` is first-party Shogi Reflection integration code.

## Emscripten

- Version: {LOCK['engine']['emscripten']}
- Build-time toolchain is not bundled wholesale with the application.
- Applicable source/license evidence is retained under `formal-build-gate/corresponding-source/`.

## Distribution boundary

This pre-final notice exists so the internal extracted candidate truthfully describes the runtime bytes that are already bundled at that stage. It does not approve public or commercial distribution.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**

Public distribution readiness: **NOT READY**  
Commercial distribution readiness: **NOT READY**

Run #36 Finalization replaces this pre-final notice with the final technical/personal-use release notice only after Run #30 Real gates and the Run #35-equivalent Post-ZIP gate have passed.
"""
(APP / "THIRD_PARTY_NOTICES.md").write_text(notice, encoding="utf-8")
print("PASS_RUN36_BUNDLED_NOTICE_PREP")
print("PASS: THIRD_PARTY_NOTICES now matches the exact bundled Run36 candidate hashes.")
