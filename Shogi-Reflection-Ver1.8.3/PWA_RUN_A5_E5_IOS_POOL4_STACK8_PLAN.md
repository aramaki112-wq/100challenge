# PWA Run A5-E5 — iPhone Real Engine Pool4 + Stack8 Plan

## A5-E4で確定した観測

iPhone Safari / COI=true / SAB=true で以下を実測しました。

- outer bootstrap started
- glue imported
- factory started
- pthread Worker #1 created
- #1 first message = `loaded`
- `pthreadLoadedMsFromFactory = 31ms`
- その後 Worker #2, #3, #4 が作成
- `factoryResolved=false`
- `usiokReceived=false`
- 30秒でReal初期化TIMEOUT
- Local fallbackは正常完走

したがって「iPhone Safariではpthread Worker自体が起動できない」という仮説は弱まりました。

## A5-E5仮説

A5-E2の`PTHREAD_POOL_SIZE=1`では、必要な同期Worker数に対して事前Poolが不足し、追加Worker起動待ちでfactoryが進行不能になっている可能性がある。

## Controlled Experiment

### Changed
- PTHREAD_POOL_SIZE: 1 -> 4

### Held Constant
- Stack: 8 MiB
- Initial Memory: 92,274,688 bytes
- Maximum Memory: 4,294,967,296 bytes
- Memory growth: enabled
- YaneuraOu/version/commit/evaluation/toolchain
- SMARTPHONE_SAFE Threads=1

## CI Gate

- Full app regression test
- Static verification
- exact pinned source checkout
- exact patch SHA verification
- non-diagnostic candidate build
- linker evidence: Pool4 / Stack8 / InitialMemory固定
- Node USI runtime probe
- hash-consistent artifact packaging
- checked-in Formal engine baseline unchanged

## iPhone Gate

Build artifactをテストDeploymentへ入れ、通常SafariでA5-E4と同じ棋譜を使って測定する。

最初の判定点はfactory/bridge/USI handshakeであり、解析強度調整はその後に行う。
