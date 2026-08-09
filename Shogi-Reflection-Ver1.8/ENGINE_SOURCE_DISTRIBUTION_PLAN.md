# ENGINE_SOURCE_DISTRIBUTION_PLAN — Future GPL Engine Gate

確認日: 2026-08-09

## 現在
Ver.1.8正式ZIPはYaneuraOu Binary/WASMを含まないため、YaneuraOuのCorresponding Source提供をこのZIPで実行する必要はない。

## 将来YaneuraOu WASMを配布する場合の計画

1. 配布するYaneuraOu tag/commitを固定する。
2. 同一SourceからWASMを再現Buildする。
3. 改変Patchを保存する。
4. Compiler/Emscripten version、Build command、options、output hashを保存する。
5. Evaluation Fileを別ComponentとしてLicense/redistribution監査する。
6. GPLv3本文と必要Noticeを同梱する。
7. Binaryに対応するCorresponding Sourceを、配布形態に適合する方法で受領者へ提供できるよう準備する。
8. Application側JavaScriptとGPL WASMの結合・通信・配布形態を記録する。
9. Application全体へのcopyleft影響に不確実性が残る場合、**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION**とする。
10. Legal review完了前はPublic/Commercial ZIPへ当該WASM/Weightを入れない。

この文書は「この手順なら絶対安全」と断定するものではない。実際のDistribution形態とLicense本文に照らしてReleaseごとに再監査する。
