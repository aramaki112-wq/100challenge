# Run A5-E2 — APPLY README

## 目的
A5-E1でPTHREAD Poolを32→1へ減らしてもiPhone Home Screen AppのSTEP1再起動が残ったため、次の切り分けとしてStackだけを64MiB→8MiBへ減らします。

## 変更するもの
- PTHREAD_POOL_SIZE=1 は維持
- INITIAL_MEMORY=92,274,688 bytes は維持
- STACK_SIZEだけ 67,108,864 → 8,388,608 bytes
- Real YaneuraOu / MATERIAL_LEVEL=1 / Emscripten 3.1.43 は維持

## 適用方法
このZIPの中身を **100challenge Root** へ上書きしてください。
その後Commit / Pushします。

## GitHub Actions
Push後、Actionsに次のWorkflowが追加されます。

`YaneuraOu iPhone Pool1 Stack8 Candidate`

手動実行してください。

## 安全境界
- Run #36 Formal runtimeは上書きしません。
- このCandidateはNOT_FORMALです。
- Public/Commercial distribution用ではありません。
- iPhone技術試験専用です。
