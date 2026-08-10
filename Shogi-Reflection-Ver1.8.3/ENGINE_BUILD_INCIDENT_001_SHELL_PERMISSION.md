# ENGINE BUILD INCIDENT 001 — GitHub Actions shell permission

Date: 2026-08-11
Run: Build pinned YaneuraOu WASM #1
Status: RESOLVED IN BUILD BRIDGE

## What happened

The first real GitHub Actions run reached the pinned YaneuraOu checkout, then failed before compilation with:

```text
./scripts/build-yaneuraou-wasm.sh: Permission denied
Process completed with exit code 126
```

## Confirmed facts

- GitHub Actions workflow discovery succeeded.
- Fixed Emscripten setup completed before the failing build step.
- Official YaneuraOu source clone and exact commit verification succeeded.
- The failure occurred when Ubuntu attempted to execute the repository shell script.

## Cause

The script had been committed from a Windows-oriented working tree without an executable Unix mode that GitHub's Ubuntu runner could rely on.

## Decision

Do not alter YaneuraOu, Emscripten, or the application architecture. The workflow now:

1. applies `chmod +x` to first-party `scripts/*.sh` after checkout; and
2. invokes the top-level shell scripts explicitly through `bash`.

This keeps the source portable while preserving reproducibility.

## Unconfirmed / not claimed

Run #1 did not prove that YaneuraOu itself could compile. That was deferred to the next run.
