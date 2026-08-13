# Shogi Reflection Ver.1.8.3 — Run #34 Post-ZIP Metadata Compatibility Fix

## Run #33 result

Run #33 is much better than the red GitHub status suggests.

The uploaded artifact contains:

- `RUN30_FORMAL_BUILD_CANDIDATE_RESULT.json`
- status: `PASS_RUN30_FORMAL_BUILD_PROFILE_CANDIDATE`
- failures: none
- diagnosticBuild: false
- Minimal Node Search: PASS
- Minimal Browser Search: PASS
- Minimal Node Runtime: PASS
- Minimal Browser Runtime: PASS
- Production Adapter: PASS
- Sample Full-Ply 153 positions: PASS
- Real Reflection Flow: PASS
- Real Cancel / Re-analysis: PASS
- internal candidate ZIP SHA-256: generated

Therefore the exact fresh **non-diagnostic** YaneuraOu runtime and all major
Real application gates have passed.

## Why the GitHub job was still red

The failure occurred only after the internal ZIP was created and extracted.

`npm test` inside the extracted package reported 715 / 717.

### Failure 1 — runtime manifest versus stale root Build Metadata

Run #30/33 correctly wrote an `available=true` Formal engine manifest, but the
root `ENGINE_BUILD_METADATA.json` in the package was still the original
pre-build `measured=false` placeholder.

The legacy regression correctly rejects that inconsistency.

Run #34 makes packaging authoritative:

- `ENGINE_BUILD_METADATA.json` describes the exact bundled Formal runtime
- `measured=true`
- `diagnosticBuild=false`
- JS/WASM/pthread Worker/bootstrap SHA-256 values are exact
- toolchain/runner provenance is carried into the package
- `engine-manifest.json` is hash-bound to the same four files
- legacy separate-pthread packaging fields are retained

### Failure 2 — repository-root workflow test in a standalone ZIP

One historical regression checks both:

- app-contained `.github/workflows/build-yaneuraou-wasm.yml`
- repository-root `../.github/workflows/build-yaneuraou-wasm.yml`

The standalone app ZIP intentionally contains the first, not a parent
repository outside the application directory.

For the post-ZIP test only, Run #34 copies the **extracted app-contained
workflow** to the temporary parent test context and verifies the two copies are
byte-identical. No outside repository content is injected into the ZIP.

## Additional Run #34 provenance

The workflow now records:

- UTC build date
- RUNNER_OS
- RUNNER_ARCH
- ImageOS
- ImageVersion
- GitHub Actions marker
- package metadata SHA-256
- post-ZIP metadata SHA-256
- post-ZIP compatibility workflow mirror SHA-256

## Production changes

Domain / Repository / Storage / Replay / Engine application behavior: **0**

This patch changes Formal packaging/evidence only.

## Formal status

Still NOT FINAL FORMAL until the post-ZIP test/static gate turns green.

Public/commercial distribution remains:

`LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION`
