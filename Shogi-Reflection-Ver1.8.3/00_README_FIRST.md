# 00_README_FIRST.md — Shogi Reflection Ver.1.6

このFolderは、正式Source of Truth `Shogi-Reflection-Ver1.4.1.zip` を基準に、Ver.1.4.2相当UI Polish → Ver.1.5相当Engine Architecture → Ver.1.6 Engine Candidate Selectionまで自然に拡張した完全版です。

## 最初に読む順序

1. `README.md`
2. `Ver.1.6操作手順書.md`
3. `ENGINE_FEASIBILITY_AUDIT.md`
4. `ENGINE_INTEGRATION_DESIGN.md`
5. `ENGINE_CANDIDATE_SELECTION_DESIGN.md`
6. `ENGINE_LICENSE_AUDIT.md`
7. `ENGINE_UPDATE_GUIDE.md`
8. `SOURCE_OF_TRUTH_AUDIT.md`
9. `COMPLETION_REPORT.md`

## 起動

```bash
python3 -m http.server 8000
```

## Test

```bash
npm test
python3 browser_verify.py
npm run check
```

## Engineについて

本ZIPにはYaneuraOu Binary、水匠、NNUE/SFNN評価Fileを同梱していません。
Engine未設定でも従来のKIF保存・Replay・手動重要局面・振り返りを利用できます。

`?engine=mock` はVerification専用で、実局解析用ではありません。
