# Shogi Reflection Ver.1.8.4 PWA — Run A5-E1 Retry B

## Purpose
Fix the GitHub Actions Node USI candidate probe staging path only.

## Retry A measured result
The following steps passed in GitHub Actions:
- Checkout exact Shogi Reflection source
- Verify unchanged app regressions and candidate isolation rules
- Pull pinned Emscripten image
- Clone exact pinned YaneuraOu
- Build non-diagnostic Pool1 candidate without touching Run36 Formal runtime

The next step failed before the Node probe started:

`cp: cannot create regular file 'Shogi-Reflection-Ver1.8.3/minimal-real-usi/runtime/yaneuraou.material.cjs': No such file or directory`

Therefore the Pool1 build itself completed; the failure was a missing staging directory in the verification harness.

## Retry B change
Before copying candidate runtime files into `minimal-real-usi/runtime`, the workflow now performs:

```bash
rm -rf "$TARGET"
mkdir -p "$TARGET"
```

This is verification-harness-only. It does not change:
- YaneuraOu source
- PTHREAD_POOL_SIZE=1 candidate source patch
- INITIAL_MEMORY
- STACK_SIZE
- SMARTPHONE_SAFE Threads=1
- Run36 Formal runtime
- production application behavior

## Local pre-delivery verification
- Automated Test: 722 / 722 PASS
- Static Verification: PASS
- Missing imports: 0
- Unexpected deleted Baseline files: 0
- Root/app workflow mirror: byte-identical
- Workflow YAML parse: PASS
- Candidate build script shell syntax: PASS

## Formal status
NOT FORMAL. Technical iPhone crash-isolation candidate only.
