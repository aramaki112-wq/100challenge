# ENGINE_LICENSE_AUDIT — Shogi Reflection Ver.1.8

監査日: 2026-08-09

> License条件を証拠ベースで整理するためのEngineering Audit。法律意見ではない。不明事項を推測で安全扱いしない。

## Final Decision

Ver.1.8正式ZIPには **third-party Engine Binary/WASM/Evaluation Weightを同梱しない**。標準Engineはfirst-party `Shogi Reflection Local Engine 1.0.0` とし、既存Application MIT Licenseの下でSourceを同梱する。

- Personal Use Readiness: **READY**
- Public Distribution License Gate: **READY for this exact ZIP**
- Commercial Distribution License Gate: **READY for this exact ZIP**
- YaneuraOu bundled distribution: **NOT APPROVED / NOT BUNDLED**
- Future YaneuraOu public/commercial bundling: **LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION** until exact WASM/evaluation/source-distribution combination is audited.

## Component Gate

| Field | Shogi Reflection Local Engine | YaneuraOu investigation | Evaluation/Weight for YaneuraOu | Emscripten investigation |
|---|---|---|---|---|
| Component Type | Engine source / Worker | Engine source | Model/Weight | Build Toolchain |
| Version | 1.0.0 | public release V9.00 investigated; current master also reviewed | none selected | current official project reviewed; no pinned build used |
| Commit/Release | project Ver.1.8 source | V9.00 `a5ee278` | N/A | N/A |
| Source URL | local project source | https://github.com/yaneurao/YaneuraOu | none adopted | https://github.com/emscripten-core/emscripten |
| Copyright Holder | Shogi Reflection Interlude contributors | upstream contributors | unknown until a concrete file is selected | upstream contributors |
| License | MIT project LICENSE | GPL-3.0 | **must be audited separately** | upstream LICENSE (MIT/NCSA terms in project LICENSE) |
| License Text確認日 | 2026-08-09 | 2026-08-09 | N/A | 2026-08-09 |
| Commercial Use | project MIT permits | GPLv3 license permits use/distribution subject to its conditions; exact combined distribution requires review | unknown until selected | permissive tool license; not bundled |
| Modification | permitted under MIT | GPL conditions apply on distribution | unknown | permitted under upstream license |
| Redistribution | permitted under MIT notice condition | GPL conditions apply | unknown | tool not bundled |
| Bundling | Yes | **No in Ver.1.8** | No | No |
| Source Disclosure | existing project source included | would require GPL source obligations when distributing covered binary/source | unknown | N/A to current ZIP |
| Attribution/Notice | existing MIT LICENSE | GPL notices/license if distributed | unknown | N/A to current ZIP |
| Evaluation File権利 | first-party heuristic, no file | Engine code only | **separate gate** | N/A |
| Model/Weight権利 | none | not inferred from engine | **separate gate** | N/A |
| Patent関連記載 | existing MIT text only | GPLv3 contains patent provisions; exact application not legally concluded here | unknown | see upstream license |
| Trademark関連記載 | none asserted by this audit | name/trademark use not needed because not bundled | unknown | not material to current ZIP |
| Unknown事項 | none material for bundled engine | aggregate/combined-work effect if bundled with app; exact source offer mechanics | concrete weight license/source | exact pinned compiler only needed when build is adopted |
| 採用可否 | **ADOPT** | connector architecture only; **do not bundle** | **REJECT until concrete file passes gate** | research/build candidate only |

## Engine

YaneuraOu公式RepositoryはUSI compliant、MultiPV対応を明示し、source codeをGPLv3に従うとしている。公式MakefileにはWASM/Emscripten build pathが存在する。したがって技術候補として有力だが、「Engine sourceがGPLv3」という事実だけからApplication全体のLicense結論やEvaluation WeightのLicenseを推定しない。

## WASM Build

公式Makefileは`TARGET_CPU=WASM`/`em++`を想定し、web/worker/node環境、pthread、memory growth等を設定する。今回の実行環境ではEmscriptenを使った再現Buildを実施していない。出所追跡不能なprebuilt WASMで穴埋めしない。

## Evaluation Function

Ver.1.8正式Baselineは外部Evaluation Fileを使わない。Local EngineのEvaluationはSource内のfirst-party heuristicである。

YaneuraOu採用時は`nn.bin`その他Weightを**Engineとは別Component**として、Source、Copyright、License、redistribution、commercial use、hashまで確認する。権利不明Weightは同梱しない。

## Build Toolchain

Ver.1.8 formal runtimeはbuild toolchain不要。将来YaneuraOu WASM build時はEmscriptenをpinし、upstream LICENSE、version、build commandを記録する。

## Runtime Dependency

- Browser Web Worker API: platform API
- third-party runtime JS library: none
- network service: none

## External Asset

- External piece image: none
- External webfont: none
- Third-party Engine binary: none
- Third-party WASM: none
- NNUE/model/weight: none

## GPL Obligations / Source Distribution Plan

Current ZIPにGPL componentをbundledしていないため、YaneuraOu由来GPL配布義務をCurrent ZIPへ適用したとは判断しない。将来bundleする場合は`ENGINE_SOURCE_DISTRIBUTION_PLAN.md`をGateとして用いる。

## Application LICENSE

Existing `LICENSE` is unchanged. SHA-256: `f80358715ec38c12618abead454a81ecd7dc1a8cf4e64e1f498d749a5697988c`。

Engine Integrationを理由にApplication LICENSEを書き換える必要はCurrent formal ZIPでは確認されなかった。

## Official Primary Sources

- YaneuraOu official repository: https://github.com/yaneurao/YaneuraOu
- YaneuraOu official LICENSE: https://github.com/yaneurao/YaneuraOu/blob/master/LICENSE
- YaneuraOu V9.00 release: https://github.com/yaneurao/YaneuraOu/releases/tag/V9.00
- YaneuraOu official Makefile: https://github.com/yaneurao/YaneuraOu/blob/master/source/Makefile
- YaneuraOu official update history/WASM notes: https://github.com/yaneurao/YaneuraOu/wiki
- Emscripten official documentation: https://emscripten.org/docs/
- Emscripten official LICENSE: https://github.com/emscripten-core/emscripten/blob/main/LICENSE

## Unresolved Legal Questions

Current formal ZIPについて、外部Engine/Weight由来の未解決License項目はない。将来YaneuraOu WASMを同梱する場合は、JavaScript/ApplicationとのDistribution形態、Corresponding Source提供、評価関数権利等を再監査する。
