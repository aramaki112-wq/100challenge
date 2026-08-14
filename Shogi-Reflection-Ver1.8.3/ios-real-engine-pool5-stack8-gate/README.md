# Run A5-E6 — iPhone Pool5 + Stack8 Candidate

## 目的
A5-E5のiPhone Safari実測では、Pool4によりfactory初期化を突破し、`bridgeReady`と`usiok`まで到達しました。`isready`送信直後に5個目のpthread Workerが作成されたものの、その後`readyok`を受信できずTIMEOUTしました。

A5-E6では、**5個目のWorkerを最初からPoolへ用意するだけで停止点を突破できるか**を検証します。

## 一条件変更
A5-E5 runtimeを比較Baselineとして、次だけを変更します。

- `PTHREAD_POOL_SIZE`: **4 -> 5**

## 固定する条件
- `STACK_SIZE=8388608` (8 MiB)
- `INITIAL_MEMORY=92274688`
- `MAXIMUM_MEMORY=4294967296`
- `ALLOW_MEMORY_GROWTH=1`
- YaneuraOu V9.00 / commit `a5ee2786c0030edc7d4a1cdfe94b04dffec55493`
- MATERIAL / `MATERIAL_LEVEL=1`
- Emscripten 3.1.43
- App preset `SMARTPHONE_SAFE` の USI `Threads=1`

`PTHREAD_POOL_SIZE=5`とUSI `Threads=1`は別の設定です。前者はBrowser/Emscripten側の事前Worker pool、後者は将棋Engineへ要求する探索Thread数です。

## 成功判定
端末試験では次を順番に確認します。

1. `factoryResolved=true`
2. `bridgeReady=true`
3. `usiokReceived=true`
4. `readyokReceived=true`
5. `firstRealSearchStarted=true`
6. `firstRealSearchCompleted=true`

## 安全境界
- NOT_FORMAL / TECHNICAL_TEST_ONLY
- Run #36 Formal runtimeを置換しない
- checked-in `engine/yaneuraou`を上書きしない
- Public/Commercial distribution readyではない
- Device successだけでFormalへ昇格しない
