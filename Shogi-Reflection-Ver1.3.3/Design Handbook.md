# Design Handbook.md — Ver.1.3.3 KIF入力やり直し・日本語UI改善

> 中心の問い：一時入力Dataと保存済みDomain Dataを、なぜ分離しなければならないのか。

# 第1部　守る境界を観測する

## STEP01　Ver.1.3.2をSource of Truthとして監査する

### 1. 🎯 このSTEPの目的

Ver.1.3.2のFile、Test、KIF Paste、Clipboard、Import Preview、Replay Scroll Policy、Domain Ruleを変更前に確認します。

### 2. 🤔 なぜこの作業をするのか

今回の要求は小規模UX改善です。既存機能を読み直さずに作ると、ClearのためだけにRepositoryを触ったり、解決済みReplay Scrollを再変更したりする危険があります。

### 3. 💻 コードを書く

```bash
unzip Shogi-Reflection-Ver1.3.2.zip
npm test
npm run check
python3 browser_verify.py
```

監査値：219 File、Automated 495/495、Browser 162/162、Static 47/47、Design Rules最終番号DJ。

### 4. 💡 設計者のひとこと

小さな修正ほど、変更する場所より「変更しない場所」を先に決めると安全です。

### 5. ✅ チェックポイント

- Ver.1.3.2 ZIPを直接Source of Truthとしている
- ReplayScrollPolicyの責務を確認した
- KIF PasteからForm反映までの経路を確認した
- 保存は別操作であることを確認した

### 6. ▶ 次へ進む条件

Temporary InputとSaved Dataの境界を既存Codeから説明できること。

## STEP02　Temporary / Preview / Form / Savedを分離する

### 1. 🎯 このSTEPの目的

「KIF入力」と一括りにせず、寿命と所有者が異なるStateへ分解します。

### 2. 🤔 なぜこの作業をするのか

Textareaの一時文字列とLocalStorageの保存済みGameReviewが同じClear操作に入ると、軽い操作が破壊的操作になります。

### 3. 💻 コードを書く

```text
Temporary Input State  = KIF Textarea
Import Preview State   = Pending Preview
Form State             = 編集中GameReview入力
Saved Domain Data      = Repository内GameReview
Persistence            = LocalStorage Snapshot
```

### 4. 💡 設計者のひとこと

Data Safetyは「確認ダイアログを増やすこと」ではなく、危険なDataへ到達できない責務分離から始まります。

### 5. ✅ チェックポイント

- Temporary Inputは永続化されない
- Previewは保存ではない
- Form反映は保存ではない
- Saved Dataの変更には明示的Application Serviceが必要

### 6. ▶ 次へ進む条件

Clear対象をTemporary/Previewだけに限定できること。

# 第2部　安全なResetを実装する

## STEP03　ClearとDeleteを別Operationにする

### 1. 🎯 このSTEPの目的

`入力をクリア`が保存済み対局へ到達できない構造を作ります。

### 2. 🤔 なぜこの作業をするのか

Clearは一時状態を初期化する低危険度操作、Deleteは永続Dataを削除する高危険度操作です。言葉が似ていても責務は別です。

### 3. 💻 コードを書く

```js
class KifImportDraftResetController {
  clearInput() {
    this.importController.cancel();
    this.view.clearInput();
  }
}
```

このControllerへRepository、LocalStorage、Clipboard Adapterを渡しません。

### 4. 💡 設計者のひとこと

依存していないものは、事故で呼ぶこともできません。これはTestだけでなくArchitectureによる安全性です。

### 5. ✅ チェックポイント

- Textareaが空になる
- Previewが閉じる
- Repository APIを呼ばない
- LocalStorage APIを呼ばない
- Clipboard writeを呼ばない
- Parserを呼ばない

### 6. ▶ 次へ進む条件

Clear前後でSaved DataとClipboardが不変であるTestが通ること。

## STEP04　RetryとUndoを混同しない

### 1. 🎯 このSTEPの目的

Preview後のやり直しを、履歴UndoではなくImport Draft Resetとして実装します。

### 2. 🤔 なぜこの作業をするのか

Undo Stackを導入するとFormやSaved Domainまで巻き戻す責務が生まれ、今回のScopeを大きく超えます。必要なのは「今回のPreviewを捨ててKIF入力へ戻る」だけです。

### 3. 💻 コードを書く

```js
retryInput() {
  this.importController.cancel();
  this.view.resetPreview("棋譜入力へ戻りました。", { focusInput: true });
}
```

Textareaは保持し、Previewだけ破棄します。

### 4. 💡 設計者のひとこと

Resetは「現在の一時作業を初期状態へ戻す」。Undoは「過去状態を復元する」。似ていますが、保存責務への影響が違います。

### 5. ✅ チェックポイント

- KIF本文が残る
- Previewが消える
- 別KIFへ貼替えできる
- 再Previewで旧内容が残らない
- Saved Dataは不変

### 6. ▶ 次へ進む条件

Preview→Retry→別KIF→再PreviewのScenarioが成功すること。

# 第3部　利用者の言葉と内部の言葉を分離する

## STEP05　UIだけを日本語化する

### 1. 🎯 このSTEPの目的

利用者へ見えるLabelを日本語中心にしながら、内部Domain/APIを安定させます。

### 2. 🤔 なぜこの作業をするのか

`KeyPosition`というClass名を`重要局面`へRenameしても利用者には見えません。一方、Import Path、Test、Serializerへ変更が広がります。UI改善の効果とCode変更コストが釣り合いません。

### 3. 💻 コードを書く

```text
内部: Replay       → 画面: 棋譜再現
内部: KeyPosition  → 画面: 重要局面
内部: Snapshot     → 画面: 局面記録
内部: GameReview   → 画面: 振り返り / 保存済み対局
```

### 4. 💡 設計者のひとこと

Presentation Layerは翻訳境界でもあります。Domain語と利用者語が一対一である必要はありません。

### 5. ✅ チェックポイント

- Class/File/Error Codeを不要にRenameしていない
- Buttonは日本語中心
- aria-labelも日本語中心
- 技術Format名は必要に応じ維持

### 6. ▶ 次へ進む条件

主要UI監査表を作り、英語残存理由を説明できること。

## STEP06　曖昧な操作名を避ける

### 1. 🎯 このSTEPの目的

Smartphoneで迷わず押せる、結果を予測できるButton名にします。

### 2. 🤔 なぜこの作業をするのか

`戻る`ではBrowser Backなのか、Previewを閉じるのか、Formへ戻るのか分かりません。操作結果が分からないButtonは、Data Safetyへの不安も増やします。

### 3. 💻 コードを書く

```html
<button id="clear-kif-paste">入力をクリア</button>
<button id="cancel-kif-import">棋譜入力へ戻る</button>
```

### 4. 💡 設計者のひとこと

良いLabelは小さな仕様書です。確認ダイアログを増やす前に、Buttonだけで結果を説明できないか考えます。

### 5. ✅ チェックポイント

- `戻る`単独を使わない
- Clear対象がKIF入力だと分かる
- Delete操作と見分けられる
- 48px以上のTouch Targetを確保する

### 6. ▶ 次へ進む条件

390px前後で主要KIF操作が押しやすく表示されること。

# 第4部　回帰を防ぎ、証拠を残す

## STEP07　Replay Scroll Policyを変更せず回帰確認する

### 1. 🎯 このSTEPの目的

Ver.1.3.2で解決済みの盤面連続Navigation UXを、KIF UX変更から守ります。

### 2. 🤔 なぜこの作業をするのか

今回Replay機能を改善する必要はありません。関連のない変更でScroll処理に触れる方が再発Riskを高めます。

### 3. 💻 コードを書く

```text
KIF Paste → Preview → Form反映 → Replay
→ 次へ × 複数回
→ Page scrollYは維持
→ Move List scrollTopだけ必要時に更新
```

`ReplayScrollPolicy.js`のHash一致も監査します。

### 4. 💡 設計者のひとこと

Regression防止では「Testを追加する」だけでなく、「変更しなくてよいModuleを変更しない」ことが強力です。

### 5. ✅ チェックポイント

- 次へ／前へでPageが飛ばない
- 最初へ／最後へでPageが飛ばない
- KeyboardでPageが飛ばない
- Current Move Highlight維持
- Move List内部追従維持

### 6. ▶ 次へ進む条件

長棋譜Browser Scenarioを含む既存Scroll Testが全成功すること。

## STEP08　ZIP展開物だけで完成を判定する

### 1. 🎯 このSTEPの目的

開発Folderではなく、利用者へ渡すZIPそのものが再現可能であることを確認します。

### 2. 🤔 なぜこの作業をするのか

作業FolderでTestが通っても、ZIP漏れ、古いFile、Missing Importがあれば成果物は完成していません。

### 3. 💻 コードを書く

```bash
unzip -t Shogi-Reflection-Ver1.3.3.zip
unzip Shogi-Reflection-Ver1.3.3.zip -d verify
cd verify/Shogi-Reflection-Ver1.3.3
npm test
python3 browser_verify.py
npm run check
```

### 4. 💡 設計者のひとこと

成果物のSource of Truthは最後には「渡したZIP」です。最終Gateはそこから始めます。

### 5. ✅ チェックポイント

- ZIP Integrity PASS
- Automated Test全成功
- Browser Verification全成功
- Static Verification全成功
- Missing Import 0
- File削除0

### 6. ▶ 次へ進む条件

展開物だけで同じ成功結果を再現し、`COMPLETION_REPORT.md`へ正直に記録できること。
