# 将棋振り返りアプリ Ver.1.3.3 — KIF入力やり直し・日本語UI改善

将棋の最善手を自動判定するのではなく、棋譜を再現し、自分が重要だと思った局面を選び、事実（FACT）・解釈（INTERPRETATION）・仮説（HYPOTHESIS）を自分の言葉で振り返るブラウザアプリです。

Ver.1.3.3は、実使用で確認済みのVer.1.3.2 Replay Scroll Policyを維持した小規模UX改善です。中心は次の2点だけです。

1. 貼り付けたKIFを安全にクリアし、読み込み確認後でも入力をやり直せること。
2. 利用者に直接見える画面文言を、内部Domain名を変えず日本語中心へ整理すること。

## Ver.1.3.3で追加した操作

- **入力をクリア**：KIF貼り付け欄と今回の読み込み確認だけを空にします。
- **棋譜入力へ戻る**：読み込み確認だけを閉じ、貼り付けたKIF本文は保持します。
- 別KIFへ貼り替えて再確認できます。
- Clipboardそのもの、保存済みGameReview、Repository、LocalStorageは変更しません。

## Data Safety

```text
KIF貼り付け欄         Temporary Input State
        ↓ Preview
棋譜読み込み確認      Import Preview State
        ↓ 反映
入力フォーム          Form State
        ↓ 明示保存
GameReview             Saved Domain Data
        ↓
Repository / LocalStorage
```

`入力をクリア`と`棋譜入力へ戻る`が操作するのは上段の一時状態だけです。保存済み対局の削除は、保存済み対局一覧の明示的な削除操作だけが担当します。

## Replay Scroll Policy

Ver.1.3.2で解決した次の動作を維持します。

- 前へ／次へ／最初へ／最後へ／Keyboard NavigationでPage全体を自動Scrollしない。
- 現在手の強調表示を維持する。
- 必要な追従は棋譜一覧Container内部だけで行う。
- 利用者が棋譜一覧の手を明示選択した場合だけ盤面へ戻すScrollを許可する。
- `ReplayScrollPolicy.js`はVer.1.3.2から変更しない。

## UI日本語化

表示例：

- Replay → 棋譜再現
- Import Preview → 棋譜読み込み確認
- Key Position → 重要局面
- Current Move → 現在の手
- Previous Move → 直前の手
- Board Flip → 盤面を反転
- Backup / Restore → バックアップ / 復元
- Warning → 注意

`GameReview`、`KeyPosition`、`ReplayViewModel`、Error Codeなど内部Code・Domain名は原則維持しています。KIF、Markdown、Obsidian、JSON、UTF-8など形式名・製品名・技術識別子は必要に応じて維持しています。

## 起動方法

ES Moduleを使用するため、`index.html`を直接開かずLocal HTTP Serverを使用してください。

```bash
cd Shogi-Reflection-Ver1.3.3
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## Test

```bash
npm test
python3 browser_verify.py
npm run check
```

正式結果は `TEST_RESULT.txt`、`BROWSER_VERIFICATION_RESULT.txt`、`STATIC_VERIFICATION_RESULT.txt` を参照してください。

## Ver.1.3.2から維持する中心機能

- KIF File選択／Drag & Drop／KIF Text Paste／Clipboard読込
- Import Previewと入力フォーム反映
- 棋譜再現、前後移動、最初／最後、手数Jump、Keyboard操作
- Replay Scroll Policy
- 盤面反転
- 現在局面から重要局面候補追加
- Replay Position Snapshot／KeyPosition Replay Reference
- 重要局面3〜5件
- 次局の観察テーマ1件
- 次局で守るルール1〜3件
- 保存／再読込
- JSON Backup／Restore
- Markdown Export／次局用Observation Card

## 今回実装していないもの

Step型UI、保存済み対局専用Viewer全面刷新、盤面Graphics全面刷新、PWA／Native App、AI Advice Layer、Engine解析、評価値、最善手、Game Story等はVer.1.4以降の候補として残しています。

## Source of Truth

- Source ZIP: `Shogi-Reflection-Ver1.3.2.zip`
- 実受領添付: `Shogi-Reflection-Ver1.3.2(1).zip`
- Ver.1.3.2元File: 219件
- Ver.1.3.2 Automated Test: 495/495 PASS
- Ver.1.3.2 Browser Verification: 162/162 PASS
- Ver.1.3.2 Static Verification: 47/47 PASS
- Ver.1.3.2 Design Rules最終番号: `INTERLUDE-Rule-DJ`

詳細は `SOURCE_OF_TRUTH_AUDIT.md` と `COMPLETION_REPORT.md` を参照してください。
