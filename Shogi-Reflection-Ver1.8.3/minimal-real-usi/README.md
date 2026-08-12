# YaneuraOu Minimal Real USI Harness — Run #15

This harness intentionally excludes the Shogi Reflection application UI,
Replay, Candidate, Graph, LocalStorage and reflection flow.

Its only question is:

```text
pinned YaneuraOu V9.00
+ Emscripten 3.1.43
+ existing reviewed USI bridge
+ candidate Emscripten Thread worker-init bridge
        ↓
Real JS / WASM / pthread worker
        ↓
usi
        ↓
usiok ?
```

## Why this exists

A direct Node probe against the measured Run #14 diagnostic artifact reproduced
a lower-level failure before USI handshake. The stack reached:

- `YaneuraOu::Thread::clear_worker()::$_0::operator()()`
- `YaneuraOu::Thread::idle_loop()`
- libc++ `__thread_proxy`

The pinned V9.00 `Thread` constructor omits the non-WASM `worker_factory`
initialization inside the `__EMSCRIPTEN__` branch, while `ThreadPool::set()`
subsequently calls `clear()`, and `clear_worker()` dereferences `worker`.

Run #15 does not modify the application. It tests one narrowly scoped candidate:
construct `Search::Worker` synchronously in the Emscripten constructor branch
before `ThreadPool::clear()` can run.

## Pass condition

The primary Run #15 gate is deliberately small:

- Node minimal harness observes `usiok`.
- Browser minimal harness under COOP/COEP observes `usiok`.

`readyok` is recorded but is not required for the first breakthrough.

Even if Run #15 passes, this is **NOT FORMAL COMPLETION**. The candidate source
patch must still be reviewed, integrated into the formal source-modification
plan, and followed by the full Real USI/E2E/License/ZIP gates.
