# ENGINE_LICENSE_AUDIT — Ver.1.8

更新日: 2026-08-09

> この文書はソフトウェア設計上のLicense Gate記録であり、法律意見ではない。公開・販売前に不明点が残る場合は **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** とする。

## Component Audit

| Component Name | Type | Version / Commit | Source | Copyright / Provenance | License | Commercial Use | Modification | Redistribution / Bundling | Source / Notice | Evaluation / Weight | Current Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
| YaneuraOu Source | Engine source | V9.00 / `a5ee2786...` | official GitHub | multiple contributors; project README references Stockfish/Apery/SilentMajority heritage | GPLv3 per official README/project | license does not prohibit charging, but obligations apply | permitted subject to GPL | permitted subject to GPL; combined-work boundary must not be guessed | Corresponding Source / license notices are relevant when distributing binaries | source contains MATERIAL implementation | PINNED; source not copied into current app ZIP |
| YaneuraOu WASM Build | compiled engine | NOT BUILT | would be built from pinned source | derived from YaneuraOu + generated runtime | YaneuraOu GPL obligations plus generated runtime notices must be audited | UNRESOLVED for this product packaging | UNRESOLVED | **NOT APPROVED / NOT BUNDLED** | exact Corresponding Source/build scripts/hash required | MATERIAL only planned | BLOCKED |
| Evaluation — MATERIAL | evaluation code | MATERIAL_LEVEL=1 | part of pinned YaneuraOu source | YaneuraOu source tree | treated as part of YaneuraOu source license | same GPL gate as engine source | same | same | no separate NNUE weight file used | no external evaluation file | ADOPTED AS FIRST CANDIDATE |
| NNUE / 水匠 Weight | model/weight | none | not selected | unknown per asset until separately audited | UNKNOWN / asset-specific | UNKNOWN | UNKNOWN | NOT APPROVED | weight/source/notice must be checked separately | third-party weight rights are separate | NOT BUNDLED |
| Emscripten | build toolchain | exact build version NOT RECORDED | official emscripten / emsdk | Emscripten authors | MIT + University of Illinois/NCSA according to official docs | permitted by permissive licenses | permitted | toolchain itself not bundled here | generated runtime notices must be reviewed if output bundled | N/A | REQUIRED TOOL; not installed here |
| ReflectionLocalEngine | first-party fallback | Ver.1.8 | this repository | application project | existing Application LICENSE | follows app license | follows app license | bundled | existing app notice | first-party material/safety evaluation | KEEP, clearly named fallback |

## YaneuraOu Source License Facts Checked

Official README states that the YaneuraOu project follows GPLv3 due to Stockfish-derived portions and references to other GPLv3 projects. Do not simplify this to either “GPL means free-only” or “GPL means commercial sale prohibited.” The important engineering concern is compliance when conveying a compiled engine and the legal characterization of how the app and engine are distributed together.

## WASM / Worker Boundary

The following are **not legally concluded** here:

- WASM being a separate file automatically makes it an aggregate.
- Web Worker message passing automatically avoids GPL combination questions.
- JavaScript glue + WASM is automatically one combined work or automatically separate.

For a public/commercial package containing the compiled GPL engine, source-distribution and work-boundary questions require deliberate review. Hence:

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**

## Evaluation File Rights

MATERIAL_LEVEL=1 does not require a separate NNUE/水匠 weight file. That deliberately removes one external rights layer for the first Integration. Any future NNUE/水匠 adoption gets its own asset row and cannot inherit the YaneuraOu engine license conclusion automatically.

## Build Toolchain

Emscripten official documentation describes the toolchain under MIT and University of Illinois/NCSA licenses. The toolchain is not bundled in this ZIP. If generated JS includes licensed runtime text, required notices must be carried into the final binary distribution audit.

## Personal Use Readiness

**READY for the current app + ReflectionLocal fallback.**

YaneuraOu official WASM itself is not present, so Personal Use of Real YaneuraOu Browser Engine is **NOT YET AVAILABLE** in this artifact.

## Public Distribution Readiness

- Current distribution-safe source/app ZIP with **no YaneuraOu binary/weight**: CONDITIONALLY READY from this Engine-asset gate; existing Application license obligations still apply.
- Package that bundles YaneuraOu WASM: **NOT READY** until build/hash/source/notice and legal boundary review are completed.

## Commercial Distribution Readiness

- Current app without YaneuraOu binary: separate product/legal review required; Engine gate adds no bundled YaneuraOu asset.
- Bundled YaneuraOu WASM: **NOT READY**.

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** applies before shipping the GPL engine inside a public/commercial app package.

## Unknown / Patent / Trademark

- Patent: not independently cleared in this engineering audit.
- Trademark/naming: do not imply endorsement by YaneuraOu project; preserve proper third-party attribution where required.
- Third-party model/weight: not adopted; rights remain UNKNOWN until separate audit.

## Sources checked

- https://github.com/yaneurao/YaneuraOu
- https://github.com/yaneurao/YaneuraOu/blob/master/README.md
- https://github.com/yaneurao/YaneuraOu/releases
- https://github.com/yaneurao/YaneuraOu/commit/a5ee2786c0030edc7d4a1cdfe94b04dffec55493
- https://emscripten.org/docs/introducing_emscripten/emscripten_license.html
- https://emscripten.org/docs/getting_started/downloads.html

License text/primary-source recheck date: 2026-08-09.
## Ver.1.8.2 Finalization Record

### Extended Component Gate Fields

各Componentについて正式配布判断時は次を記録する: Component Name / Type / Version / Commit / Source / Copyright / License / Commercial Use / Modification / Redistribution / Bundling / Source Disclosure / Attribution / Notice / Evaluation Rights / Weight Rights / Patent / Trademark / Unknown / Adoption Decision / Reason。

今回の判断:
- YaneuraOu Source: GPLv3、V9.00 exact commit固定。採用候補。
- YaneuraOu WASM: **NOT BUILT / NOT BUNDLED**。正式採用未承認。
- MATERIAL Evaluation: Source内MATERIAL_LEVEL=1。外部weightなし。
- Emscripten: Build tool。公式にはMIT + University of Illinois/NCSA。toolchain自体は同梱しない。
- JS Glue / pthread worker: official-source Emscripten outputが生成された時点でlicense/noticeを再監査。現在未生成。
- ReflectionLocalEngine: first-party fallbackとして維持。
- Future NNUE / Suisho Weight: NOT BUNDLED、権利別監査必須。

### Readiness

- Personal Use Readiness: App + ReflectionLocal **READY**。Real YaneuraOu **NOT AVAILABLE**。
- Public Distribution Readiness: YaneuraOu binaryなしの現在candidateはEngine asset gate上は可。ただしformal Real Engine packageではない。
- Commercial Distribution Readiness: Real YaneuraOu bundleについて **NOT READY**。

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**

GPLを販売禁止/無料なら自由/WASMなら無関係/Workerなら必ずaggregate等へ単純化しない。
