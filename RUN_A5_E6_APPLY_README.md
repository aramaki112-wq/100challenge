# Run A5-E6 — APPLY README

## 今回すること
A5-E5のiPhone Safari実機計測では、Pool4により4つのpthread Workerが`loaded`まで到達し、`factoryResolved`、`bridgeReady`、`usiok`まで初めて成功しました。

その直後、`isready`送信後に**5個目のpthread Worker**が新規作成されましたが、そのWorkerの`loaded`と`readyok`を受信できず30秒TIMEOUTしました。

A5-E6では原因を切り分けるため、**PTHREAD_POOL_SIZEだけを4から5へ変更**します。

## 変更
- PTHREAD_POOL_SIZE: 4 -> 5

## 変更しない
- STACK_SIZE=8MiB
- INITIAL_MEMORY=92,274,688 bytes
- MAXIMUM_MEMORY=4,294,967,296 bytes
- YaneuraOu V9.00 / MATERIAL_LEVEL=1 / Emscripten 3.1.43
- SMARTPHONE_SAFE USI Threads=1
- Run #36 Formal runtime
- Ver.1.8.3 / 1.8.4本体の既存Domain・UI・保存仕様

## 適用方法
このZIPを展開し、**中身を100challenge Rootへ上書き**してください。

その後Commit / Pushします。

Push後、GitHub Actionsに次が追加されます。

`YaneuraOu iPhone Pool5 Stack8 Candidate`

これを手動実行してください。

## 重要
このCandidateはNOT_FORMAL / TECHNICAL_TEST_ONLYです。成功しても自動的に正式版へ昇格しません。
