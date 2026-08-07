# 最初にお読みください — Shogi Reflection Ver.1.3

このFolderは、`Shogi-Reflection-Ver1.2(2).zip`をSource of Truthとして拡張したVer.1.3完全版です。

## 最短の確認手順

```bash
npm test
npm run check
python3 browser_verify.py
python3 -m http.server 8000
```

Browserで`http://localhost:8000`を開きます。

## Ver.1.3で行うこと

棋譜再現盤を重要だと思う手数へ移動し、`この局面を重要局面へ追加`を押します。手数・指し手・局面SnapshotだけがForm候補へ入ります。FACT・INTERPRETATION・HYPOTHESISは空欄のままです。

追加しただけでは保存されません。本人入力を追記し、最後に`振り返りを保存する`を押してください。

## 正式確認値

- Ver.1.2継承Test：333件
- Ver.1.3追加Test：125件
- 全Test：458件成功／0件失敗
- Chromium：116件成功／0件失敗
- Missing Import：0件

詳細は`README.md`、`Ver.1.3操作手順書.md`、`COMPLETION_REPORT.md`を参照してください。
