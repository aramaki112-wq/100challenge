# THIRD_PARTY_NOTICES — Shogi Reflection Ver.1.8

確認日: 2026-08-09

## Formal ZIP Bundled Components

Ver.1.8正式ZIPには、Runtimeに必要な第三者Engine Binary、WASM、NNUE Weight、Evaluation Model、外部Font、外部画像Assetを同梱していない。

| Component | Copyright | License | Source | Modification | Bundled Runtime Asset |
|---|---|---|---|---|---|
| Shogi Reflection Local Engine | Shogi Reflection Interlude contributors | MIT（project LICENSE） | project source | Ver.1.8新規 | Yes, first-party source |
| YaneuraOu | upstream contributors | GPL-3.0 | https://github.com/yaneurao/YaneuraOu | none | **No** |
| Emscripten | upstream contributors | upstream LICENSE | https://github.com/emscripten-core/emscripten | none | **No** |
| External NNUE/Evaluation Weight | N/A | N/A | N/A | N/A | **No** |

YaneuraOu/Emscriptenは調査対象・将来Integration候補として文書に記載するだけで、正式Application Runtimeへ再配布していない。

Playwright/Chromium/Python/Node.jsはVerification環境で使用したが、その実行Binary/PackageをこのApplication ZIPへvendorしていない。
