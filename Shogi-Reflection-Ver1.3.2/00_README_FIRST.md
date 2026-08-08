# 最初にお読みください — Shogi Reflection Ver.1.3.1

このFolderは、完成済み`Shogi-Reflection-Ver1.3.zip`をSource of Truthとして、スマホKIF貼り付けを追加したVer.1.3.1 Hotfix完全版です。

## 最短の確認手順

```bash
npm test
npm run check
python3 browser_verify.py
python3 -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## Ver.1.3.1で追加したこと

スマホではKIF本文を貼り付け欄へ長押ししてペーストし、`貼り付けたKIFをPreview`を押せます。BrowserがClipboard直接読込に対応している場合は`クリップボードから読み込む`だけでもPreviewできます。Ver.1.3のReplay・重要局面Snapshot・本人入力境界は変更していません。

追加しただけでは保存されません。本人入力を追記し、最後に`振り返りを保存する`を押してください。

## 正式確認値

- Ver.1.3継承Test：458件
- Ver.1.3.1追加Test：13件
- 全Test：471件成功／0件失敗
- Chromium：133件成功／0件失敗
- Missing Import：0件

詳細は`README.md`、`Ver.1.3.1操作手順書.md`、`COMPLETION_REPORT_V1_3_1.md`を参照してください。

---

## Ver.1.3.2を開く方へ

今回の中心はReplay UXです。最初に次を確認してください。

1. `REPLAY_SCROLL_POLICY.md`
2. `MOBILE_REPLAY_UX.md`
3. `Ver.1.3.2操作手順書.md`
4. `BROWSER_VERIFICATION_RESULT.txt`
5. `SOURCE_OF_TRUTH_AUDIT.md`
6. `COMPLETION_REPORT.md`

Ver.1.3.1のDomain Modelと保存Schemaは維持しています。
