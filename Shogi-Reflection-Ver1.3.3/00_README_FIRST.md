# 最初にお読みください — Shogi Reflection Ver.1.3.3

このFolderは、完成済み`Shogi-Reflection-Ver1.3.2.zip`をSource of Truthとして、KIF入力やり直しと利用者向け日本語UIを改善したVer.1.3.3完全版です。

## 最短の確認手順

```bash
npm test
python3 browser_verify.py
npm run check
python3 -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## 最初に試す操作

1. KIF本文を貼り付ける。
2. `貼り付けたKIFを確認`を押す。
3. 間違っていたら`棋譜入力へ戻る`で本文を残したまま戻る。
4. 全部やり直すなら`入力をクリア`を押す。
5. 正しいKIFを再Previewし、入力フォームへ反映する。
6. 棋譜再現で`次へ`を連続操作し、Page全体が棋譜一覧へ飛ばないことを確認する。

`入力をクリア`は保存済み対局、Repository、LocalStorage、Clipboardを変更しません。

## 主要資料

1. `Ver.1.3.3操作手順書.md`
2. `KIF_INPUT_RESET_POLICY.md`
3. `JAPANESE_UI_GUIDELINE.md`
4. `REPLAY_SCROLL_POLICY.md`
5. `SOURCE_OF_TRUTH_AUDIT.md`
6. `COMPLETION_REPORT.md`
7. `TEST_RESULT.txt`
8. `BROWSER_VERIFICATION_RESULT.txt`
9. `STATIC_VERIFICATION_RESULT.txt`

## Ver.1.4以降へ残したもの

Step型UI、保存済み対局Viewer全面刷新、将棋盤Graphics全面刷新、Application化、AI Advice Layer等は今回実装していません。
