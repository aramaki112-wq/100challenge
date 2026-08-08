# 00_README_FIRST.md — Shogi Reflection Ver.1.4.1

このFolderは`Shogi-Reflection-Ver1.4.zip`をSource of Truthとして作成したVer.1.4.1完全版です。

## 最初に読む順序

1. `README.md`
2. `Ver.1.4.1操作手順書.md`
3. `BOARD_FIXED_GRID_DESIGN.md`
4. `SAVED_GAME_SUMMARY_DISPLAY_DESIGN.md`
5. `SOURCE_OF_TRUTH_AUDIT.md`
6. `COMPLETION_REPORT.md`

## 起動

```bash
python -m http.server 8000
```

## Test

```bash
npm test
python3 browser_verify.py
npm run check
```

Ver.1.4.1の範囲は固定Gridと保存済み対局一覧表示改善であり、AI/Engine/Application化は含みません。
