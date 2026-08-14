# Run A5-E5 — iPhone Pool4 + Stack8 Candidate

## 目的
A5-E4のiPhone Safari実測では、Real YaneuraOuのouter bootstrap / glue import / factory開始まで進み、最初のpthread Workerは`loaded`を返しました。その直後に追加3 Workerが生成されましたが、factoryはresolveせず、30秒後にReal初期化がTIMEOUTしました。

A5-E5ではこの観測から、`PTHREAD_POOL_SIZE`不足による同期的pthread起動待ちを第一仮説として検証します。

## 一条件変更
A5-E2 runtimeを比較Baselineとして、次だけを変更します。

- `PTHREAD_POOL_SIZE`: **1 -> 4**

## 固定する条件
- `STACK_SIZE=8388608` (8 MiB)
- `INITIAL_MEMORY=92274688`
- `MAXIMUM_MEMORY=4294967296`
- `ALLOW_MEMORY_GROWTH=1`
- YaneuraOu V9.00 / commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- MATERIAL / `MATERIAL_LEVEL=1`
- Emscripten 3.1.43
- App preset `SMARTPHONE_SAFE` の USI `Threads=1`

`PTHREAD_POOL_SIZE=4`とUSI `Threads=1`は別の設定です。前者はBrowser/Emscripten側で同期的に利用可能なWorker poolを確保するための技術試験、後者は将棋Engineの探索Thread数です。

## 成功判定
端末試験ではまず次を優先して確認します。

1. `factoryResolved=true`
2. `bridgeReady=true`
3. `usiokReceived=true`
4. `readyokReceived=true`
5. `firstRealSearchStarted=true`
6. `firstRealSearchCompleted=true`

153局面すべての完走は、その後の性能・安定性Gateです。

## 安全境界
- NOT_FORMAL / TECHNICAL_TEST_ONLY
- Run #36 Formal runtimeを置換しない
- checked-in `engine/yaneuraou`を上書きしない
- Public/Commercial distribution readyではない
- Device successだけでFormalへ昇格しない
