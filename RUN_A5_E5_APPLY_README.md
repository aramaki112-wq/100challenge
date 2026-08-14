# Run A5-E5 — APPLY README

## 今回すること
A5-E4で「最初のpthreadはloadedまで成功、その後追加3 Worker作成後にfactoryが止まる」と実機観測できたため、次は**Poolだけ**を1から4へ変更して比較します。

## 変更
- PTHREAD_POOL_SIZE: 1 -> 4

## 変更しない
- STACK_SIZE=8MiB
- INITIAL_MEMORY=92,274,688 bytes
- YaneuraOu V9.00 / MATERIAL_LEVEL=1 / Emscripten 3.1.43
- SMARTPHONE_SAFE Threads=1
- Run #36 Formal runtime

## 適用方法
このZIPを展開し、**中身を100challenge Rootへ上書き**してください。

その後Commit / Pushします。

Push後、GitHub Actionsに次が追加されます。

`YaneuraOu iPhone Pool4 Stack8 Candidate`

これを手動実行してください。

## 重要
このCandidateはNOT_FORMAL / TECHNICAL_TEST_ONLYです。成功しても自動的に正式版へ昇格しません。
