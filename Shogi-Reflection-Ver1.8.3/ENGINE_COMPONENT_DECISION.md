# ENGINE_COMPONENT_DECISION — Ver.1.8.3

Date: 2026-08-10

## Decision Summary

| Component | Decision | Reason |
|---|---|---|
| YaneuraOu V9.00 exact commit | ADOPTED FOR BUILD BRIDGE | fixed official source; existing Adapter boundary preserved |
| MATERIAL_LEVEL=1 | ADOPTED | no external NNUE/水匠 weight; sufficient to prove Real Engine integration path |
| Emscripten 4.0.15 | ADOPTED / FIXED | official emsdk release target verified in registry; no “latest” drift |
| Upstream pthread=enabled | ADOPTED FOR REPRO BUILD ONLY | exact V9.00 WASM path; not declared smartphone optimal |
| Upstream PTHREAD_POOL_SIZE=32 | REPRODUCE FIRST / NOT SMARTPHONE-APPROVED | measurement required before optimization |
| Upstream memory/stack defaults | REPRODUCE FIRST / NOT SMARTPHONE-APPROVED | avoid unmeasured tuning |
| GitHub Actions ubuntu-24.04 | ADOPTED AS PRIMARY BUILD HOST | accessible reproducible workflow; exact runner image metadata recorded |
| Docker | NOT ADOPTED IN 1.8.3 | not required to establish first fixed Bridge; avoids adding another image/digest/license layer without need |
| third-party NNUE/水匠 weights | NOT ADOPTED | separate rights and provenance layer; outside this Real Integration gate |
| Service Worker COOP/COEP shim | NOT ADOPTED | GitHub Pages pthread deployment not formally proven; workaround requires separate security/browser design |
| ReflectionLocalEngine | KEEP AS EXPLICIT FALLBACK | app remains usable if Real Engine fails; never counted as Real Formal Gate evidence |
| Existing Application LICENSE | UNCHANGED | no silent relicensing; distribution implications are documented separately |

## Architecture Decision

No Domain/Application layer imports YaneuraOu or WASM. Existing chain remains:

```text
Browser UI
 -> Engine Application Service
 -> ShogiEnginePort
 -> YaneuraOuWasmAdapter
 -> BrowserWorkerUsiTransport
 -> YaneuraOuWasmWorkerBootstrap
 -> official Emscripten JS/WASM/pthread worker
```

## Formal policy

Build success, runtime success and distribution permission are three separate decisions. A PASS in one cannot substitute for another.
