# PWA Run A5-E6 — iPhone Real Engine Pool5 + Stack8 Plan

## A5-E5で確定した観測

iPhone Safari / COI=true / SAB=true で以下を実測しました。

- hardwareConcurrency = 4
- PTHREAD_POOL_SIZE = 4
- Stack = 8 MiB
- Initial Memory = 92,274,688 bytes
- pthread Worker #1〜#4 created
- #1〜#4 first message = `loaded`
- `factoryResolved=true` / 519 ms
- `bridgeReady=true`
- `usiokReceived=true` / usi→usiok 559 ms
- `isready`送信
- 直後にpthread Worker #5 created
- #5の`loaded`は観測できず
- `readyokReceived=false`
- Real検索は未開始
- 約30秒でReal初期化TIMEOUT
- Local fallbackは153/153正常完走

A5-E4のfactory stallはPool4で突破できたため、停止点は`isready -> readyok`へ移動しました。

## A5-E6仮説

A5-E5では事前Pool 4個を使い切った後、`isready`処理中に5個目のpthread Workerが必要になり、その追加Worker準備待ちで`readyok`まで進めなかった可能性があります。

## Controlled Experiment

### Changed
- PTHREAD_POOL_SIZE: 4 -> 5

### Held Constant
- Stack: 8 MiB
- Initial Memory: 92,274,688 bytes
- Maximum Memory: 4,294,967,296 bytes
- Memory growth: enabled
- YaneuraOu V9.00 / pinned commit
- MATERIAL_LEVEL=1
- Emscripten 3.1.43
- SMARTPHONE_SAFE USI Threads=1

## CI Gate

- Full app regression test
- Static verification
- exact pinned source checkout
- exact patch SHA verification
- non-diagnostic candidate build
- linker evidence: Pool5 / Stack8 / InitialMemory固定
- Node USI runtime probe
- hash-consistent artifact packaging
- checked-in Formal engine baseline unchanged

## iPhone Gate

A5-E5と同じiPhone Safari・同じ棋譜・同じSMARTPHONE_SAFE条件で測定します。

判定順:
1. `factoryResolved`
2. `bridgeReady`
3. `usiok`
4. `readyok`
5. Real検索開始
6. Real検索完了

A5-E6で`readyok=true`になれば、次に初回Real検索の開始・完了を観測します。
Pool5でも`isready`後にさらにWorkerが必要になって止まる場合は、Poolを闇雲に増やさず、YaneuraOuのThread初期化要求数とEmscripten Worker割当を直接計測する次Probeへ進みます。
