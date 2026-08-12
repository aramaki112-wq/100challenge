# Minimal Real USI root-cause hypothesis

Status: diagnostic hypothesis, not yet a Formal source decision.

## Measured runtime evidence

A direct Node execution of the real diagnostic artifact reproduced a native
pthread crash before `usiok` with the stack rooted in:

```text
YaneuraOu::Thread::clear_worker()::$_0::operator()()
YaneuraOu::Thread::idle_loop()
std::__2::__thread_proxy(...)
```

The Node diagnostic reported `RuntimeError: memory access out of bounds`.
Earlier Chromium evidence reported `RuntimeError: function signature mismatch`
from the generated pthread worker. Both occur before a stable USI handshake.

## Source observation

At the pinned V9.00 source, `Thread::Thread(...)` creates `Search::Worker` only
inside the `!__EMSCRIPTEN__` branch. The Emscripten branch skips that creation.
Later, `ThreadPool::set()` calls `clear()`, and `Thread::clear_worker()` schedules
`worker->clear()`.

Therefore the leading hypothesis is that the refactored V9.00 Emscripten thread
path reaches `clear_worker()` without a valid `Search::Worker` instance.

## Run #15 experiment

Do not alter search/evaluation logic. Add exactly one candidate compatibility
change: create the Worker synchronously in the Emscripten constructor branch,
then test only `usi -> usiok` in Node and a cross-origin-isolated browser.
