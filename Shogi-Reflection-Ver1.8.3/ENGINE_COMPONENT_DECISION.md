# ENGINE_COMPONENT_DECISION — Ver.1.8.3 Run #6 Candidate

Date: 2026-08-11

## Decision summary

| Component | Decision | Reason |
|---|---|---|
| YaneuraOu V9.00 exact commit | ADOPTED FOR BUILD BRIDGE | fixed official source; existing Adapter boundary preserved |
| upstream `material` profile / MATERIAL_LEVEL=1 | ADOPTED | built-in evaluation, no external NNUE/水匠 weight; sufficient for Real Integration gate |
| Emscripten 3.1.43 | ADOPTED / FIXED FOR RUN #6 | exact pinned YaneuraOu source's own WASM workflow selects this version |
| `script/wasm_build.js material` | ADOPTED | pinned source's own packaging/build entry point; avoids custom translation drift |
| Ubuntu 22.04 runner | ADOPTED FOR RUN #6 | matches pinned upstream WASM workflow runner family; actual hosted image metadata still recorded |
| generated `yaneuraou.material.worker.js` | REQUIRED RUNTIME ASSET | expected by pinned 3.1.43 material packaging; SHA-256-bound separately |
| first-party `YaneuraOuWasmWorkerBootstrap.js` | KEEP | preserves BrowserWorkerUsiTransport integration boundary; not the generated pthread Worker |
| pthread / `PTHREAD_POOL_SIZE=32` | REPRODUCE FIRST / NOT SMARTPHONE-APPROVED | upstream build behavior; measurement required before optimization |
| upstream memory/stack settings | REPRODUCE FIRST / NOT SMARTPHONE-APPROVED | no unmeasured tuning in Formal bridge |
| Docker | NOT ADOPTED IN RUN #6 BRIDGE | upstream uses a 3.1.43 Docker image, but the bridge installs the same fixed SDK directly to keep compiler metadata explicit and avoid a second image-distribution layer; Real evidence must prove equivalence for this use |
| third-party NNUE/水匠 weights | NOT ADOPTED | separate rights/provenance layer; outside current gate |
| Service Worker isolation shim | NOT ADOPTED | hosting workaround requires separate security/browser design |
| ReflectionLocalEngine | KEEP AS EXPLICIT FALLBACK | app remains usable on Real Engine failure; never counts as Real Formal evidence |
| Existing Application LICENSE | UNCHANGED | no silent relicensing; distribution implications handled separately |

## Architecture decision

No Domain/Application layer imports YaneuraOu or WASM. Existing chain remains:

```text
Browser UI
 -> Engine Application Service
 -> ShogiEnginePort
 -> YaneuraOuWasmAdapter
 -> BrowserWorkerUsiTransport
 -> first-party YaneuraOuWasmWorkerBootstrap
 -> upstream generated material JS / pthread Worker / WASM
```

## Run #5 evidence retained

Run #5's 4.0.15 build is retained as historical negative evidence: build/hash/browser prerequisites passed, but Real USI failed before `usiok` with `RuntimeError: function signature mismatch` and the application correctly fell back to ReflectionLocal. Run #6 does not rewrite that evidence; it changes the next build decision.

## Formal policy

Build success, runtime success and distribution permission are three separate decisions. A PASS in one cannot substitute for another.
