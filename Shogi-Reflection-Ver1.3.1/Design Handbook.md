# Design Handbook.md — Ver.1.3 棋譜再現盤・重要局面登録接続

> 中心の問い：再現された現在局面を、どのように既存の振り返りDomainへ安全に接続するか。

# 第1部　境界を見つける

## STEP01　Ver.1.2をSource of Truthとして監査する

### 1. 🎯 このSTEPの目的

KeyPosition、GameReview、Position History、保存形式、Browser Form、Testの実装事実を確認し、変更してよい場所と守る場所を決めます。

### 2. 🤔 なぜこの作業をするのか

要求文だけを根拠に再設計すると、既存Property、Validation、Error Code、File配置を壊す危険があります。実装済みCodeと正式Testを先に読むことで、拡張点を事実から決められます。

### 3. 💻 コードを書く

```bash
unzip Shogi-Reflection-Ver1.2.zip
npm test
npm run check
python3 browser_verify.py
```

全File Hash、Test数、Design Rules最終番号、package scriptを記録します。

### 4. 💡 設計者のひとこと

Source of Truth監査は「昔の設計へ従う」ためだけではありません。既存の意図を知らずに、同じ責務を別名で作る重複を防ぐためです。

### 5. ✅ チェックポイント

- Ver.1.2 Test 333件が成功した
- KeyPositionの全Propertyを確認した
- Position Historyから現在・直前Positionを取得できる
- Top-level Schema Versionが1である
- Design Rules最終番号がCNである

### 6. ▶ 次へ進む条件

既存Domainを再構成せず、任意のReplay Referenceとして接続できる見通しが立っていること。

## STEP02　ReplayとGameReviewの責務を分ける

### 1. 🎯 このSTEPの目的

局面再現の責務と、本人の振り返り本文を保持する責務を明確に分けます。

### 2. 🤔 なぜこの作業をするのか

Replayは客観的な盤面状態を扱い、GameReviewは本人の観察・解釈・仮説を扱います。両者を一つの巨大Objectへ混ぜると、盤面処理の変更が振り返りDomainへ波及します。

### 3. 💻 コードを書く

```text
Replay Model
  Position History
  Current Position
  Previous Position

Connection Model
  ReplayPositionSnapshot
  KeyPositionReplayReference

Reflection Domain
  GameReview
  KeyPosition
  FACT / INTERPRETATION / HYPOTHESIS
```

KeyPositionへは`replayReference`を任意Propertyとして追加します。

### 4. 💡 設計者のひとこと

境界を作る目的は、関係を断つことではありません。意味の異なるDataを、意味を失わず接続することです。

### 5. ✅ チェックポイント

- Replay Application ServiceはRepositoryをImportしない
- GameReviewはReplay Navigationを知らない
- UIは盤面更新Ruleを持たない
- SnapshotなしKeyPositionが有効である

### 6. ▶ 次へ進む条件

Replayから取得する客観Dataと、本人が書く本文の一覧が分離されていること。

## STEP03　自動入力と本人入力の境界を決める

### 1. 🎯 このSTEPの目的

Applicationが入力してよいDataと、本人へ残すDataを固定します。

### 2. 🤔 なぜこの作業をするのか

FACTは客観欄ですが、「盤面の何をFACTとして選ぶか」は観察行為です。盤面SnapshotとFACT文を混同すると、本人の振り返りが自動生成文へ置き換わります。

### 3. 💻 コードを書く

```js
const candidate = {
  moveNumber: snapshot.moveNumber,
  moveText: snapshot.currentMove,
  replayReference,
  fact: "",
  interpretation: "",
  hypothesis: "",
  emotion: "",
  decisionPattern: "",
  learning: ""
};
```

### 4. 💡 設計者のひとこと

空欄を残すことも設計です。Applicationが知らない意味を、便利さのために埋めないでください。

### 5. ✅ チェックポイント

- FACTが空欄
- INTERPRETATIONが空欄
- HYPOTHESISが空欄
- 感情・判断Patternも空欄
- 手数・指し手・Snapshotだけが自動入力される

### 6. ▶ 次へ進む条件

自動入力項目と本人入力項目がCode・UI・Testで同じ境界になっていること。

# 第2部　再検証できるSnapshotを作る

## STEP04　BoardとHandを構造化する

### 1. 🎯 このSTEPの目的

UI文字列ではなく、再表示・ValidationできるBoard／Hand Snapshotを作ります。

### 2. 🤔 なぜこの作業をするのか

「盤面：先手優勢」のような文字列では駒配置を復元できません。Square、Owner、Piece Type、Promotion、Countを保存すれば、将来のDifference計算にも使えます。

### 3. 💻 コードを書く

```js
new BoardSnapshot({
  pieces: [{
    square: { file: 2, rank: 2 },
    type: "BISHOP",
    owner: "SENTE",
    promoted: true
  }]
});

new HandSnapshot({ counts: { BISHOP: 1 } });
```

### 4. 💡 設計者のひとこと

表示Labelは将来変えられます。内部Dataは意味を表す値で持ち、見え方から独立させます。

### 5. ✅ チェックポイント

- Squareは1〜9
- 同一Square重複を拒否する
- Hand Countは0以上の整数
- OwnerとPromotionを保持する
- 入力Objectを安全にCopyする

### 6. ▶ 次へ進む条件

BoardとHandをJSONへ変換し、同じ内容で復元できること。

## STEP05　現在局面と直前局面を一組で保持する

### 1. 🎯 このSTEPの目的

重要局面の現在Positionだけでなく、直前PositionもSnapshotへ含めます。

### 2. 🤔 なぜこの作業をするのか

Ver.1.4で「何が変わったか」を扱うには、現在局面だけでは不足します。直前局面があれば、Board DifferenceとHand Differenceを後から計算できます。

### 3. 💻 コードを書く

```js
new ReplayPositionSnapshot({
  moveNumber,
  currentMove,
  previousMove,
  sourceKifMove,
  currentPosition,
  previousPosition,
  replayWarning,
  termination
});
```

### 4. 💡 設計者のひとこと

将来機能を先に実装する必要はありません。しかし、将来必要な事実を今失わない構造にはできます。

### 5. ✅ チェックポイント

- Current／Previous Positionが別Object
- Side to Moveを保持する
- Last Move From／Toを保持する
- 1手目でも初期局面をPreviousとして取得できる
- 元KIF指し手を保持する

### 6. ▶ 次へ進む条件

同一Source・同一手数から決定的に同じSnapshotを生成できること。

## STEP06　盤面反転を内部Dataから排除する

### 1. 🎯 このSTEPの目的

盤面反転を表示設定として扱い、Snapshot内部座標へ混入させません。

### 2. 🤔 なぜこの作業をするのか

反転中に追加した局面だけ座標が逆になると、同じKIF・同じ手数なのに別Snapshotになります。表示方向は利用者の視点であり、局面の事実ではありません。

### 3. 💻 コードを書く

```js
const snapshot = factory.create({
  replayState: {
    position: history.positionAt(moveNumber),
    previousPosition: history.positionAt(moveNumber - 1)
    // flippedは渡さない
  }
});
```

### 4. 💡 設計者のひとこと

「見え方」と「存在するData」を分離するRuleは、地図、画像、Dashboardでも同じです。

### 5. ✅ チェックポイント

- 反転前後でSnapshot Fingerprintが同じ
- Last Move座標が内部Squareのまま
- 駒Ownerが反転しない
- Preview側で表示順だけを変えられる

### 6. ▶ 次へ進む条件

Browser Automationで反転中の追加を行い、内部座標が標準座標であることを確認できること。

# 第3部　候補追加と保存を分ける

## STEP07　追加Application Serviceを作る

### 1. 🎯 このSTEPの目的

現在局面をKeyPosition候補へ変換するUse Caseを、UIとRepositoryから分離します。

### 2. 🤔 なぜこの作業をするのか

Button HandlerへValidationを直接書くと、Browser以外から使えず、失敗時のForm保護をTestしにくくなります。Repositoryを渡さなければ、追加だけで保存されないことも構造で保証できます。

### 3. 💻 コードを書く

```js
const result = addCurrentPosition.execute({
  replayState,
  existingKeyPositions,
  sourceGameId,
  sourceKifText
});
```

0手目、Source不一致、重複、5件上限を検証してから候補を返します。

### 4. 💡 設計者のひとこと

「何をしないServiceか」を決めると責務が明確になります。このServiceは保存しません。

### 5. ✅ チェックポイント

- Repository Dependencyがない
- 既存配列を変更しない
- 失敗時に候補を返さない
- 本人入力欄を生成しない
- Error Codeと利用者Messageを分離する

### 6. ▶ 次へ進む条件

Application Service単体Testで追加・拒否・不変性を確認できること。

## STEP08　重複と5件上限を扱う

### 1. 🎯 このSTEPの目的

意図しない二重登録と既存Domain上限超過を、保存前に防ぎます。

### 2. 🤔 なぜこの作業をするのか

Formに空Cardが3枚あるため、DOM要素数と意味のある重要局面数は同じではありません。保存済み・未保存を含む実入力だけを数える必要があります。

### 3. 💻 コードを書く

```js
const meaningful = existingKeyPositions.filter(hasContent);
if (meaningful.length >= 5) throw limitError();
const duplicateIndex = meaningful.findIndex(
  item => Number(item.moveNumber) === moveNumber
);
if (duplicateIndex >= 0) throw duplicateError({ duplicateIndex });
```

### 4. 💡 設計者のひとこと

Validationは最後の保存時だけでなく、利用者が間違いを起こす直前にも見せるとUXになります。

### 5. ✅ チェックポイント

- 空CardをCountしない
- 同一手数を拒否する
- 既存本文を上書きしない
- 5件でButtonを無効化する
- 無効理由を文字で表示する

### 6. ▶ 次へ進む条件

同一手数では既存CardへFocusし、5件時は追加操作を開始できないこと。

## STEP09　Browser ControllerとFormを接続する

### 1. 🎯 このSTEPの目的

Replay状態をApplication Serviceへ渡し、成功候補をFormへ表示します。

### 2. 🤔 なぜこの作業をするのか

UIは局面Snapshotの生成方法を知るべきではありません。Controllerが境界をつなぎ、Viewは表示とFocusだけを担当します。

### 3. 💻 コードを書く

```js
const result = keyPositionReplayController.add({
  sourceGameId: input.reviewId,
  sourceKifText: input.kifuText
});
```

成功時は空Cardへ追加し、失敗時はError View Modelを表示します。

### 4. 💡 設計者のひとこと

成功通知とFocusの順序も設計です。重複時は通知後に既存CardへFocusを戻し、利用者が次の行動を取れる状態にします。

### 5. ✅ チェックポイント

- 追加後にFormへFocusする
- 追加成功をaria-liveで通知する
- Errorをrole=alertで通知する
- FACT等が空欄
- Snapshot詳細が必要時だけ描画される

### 6. ▶ 次へ進む条件

KIF Import直後と保存済み詳細の両方から同じControllerを使って追加できること。

# 第4部　互換性と完成を証明する

## STEP10　旧DataとSnapshot Versionを扱う

### 1. 🎯 このSTEPの目的

Ver.1.2 Dataを壊さず、新しいSnapshotの不正を検出します。

### 2. 🤔 なぜこの作業をするのか

任意Propertyを必須にすると旧Backupが読めません。一方、存在するSnapshotを無検証で受け入れると改ざんDataがDomainへ入ります。

### 3. 💻 コードを書く

```js
const replayReference = snapshot.replayReference
  ? KeyPositionReplayReference.fromSnapshot(snapshot.replayReference)
  : null;
```

Top-level Schemaは1を維持し、Replay Snapshot Version 1を別に検証します。

### 4. 💡 設計者のひとこと

「ないData」と「壊れたData」は別です。旧Dataの欠落は正常、存在する不正SnapshotはErrorです。

### 5. ✅ チェックポイント

- SnapshotなしKeyPositionを読める
- Version 1を保存・再読込できる
- Version 999を拒否する
- 不正Board／Handを拒否する
- Atomic Restoreで現在Dataを守る

### 6. ▶ 次へ進む条件

旧Data、正常Snapshot、改ざんBackupの三種類をTestで区別できること。

## STEP11　全層Testと実Browser確認を行う

### 1. 🎯 このSTEPの目的

Model単体だけでなく、KIF Importから保存・再読込・Backupまでの学習Loopを検証します。

### 2. 🤔 なぜこの作業をするのか

単体Testが通っても、DOM Focus、Button無効理由、LocalStorage、File Upload、Smartphone Layoutは実Browserでしか見つからない不整合があります。

### 3. 💻 コードを書く

```bash
npm test
npm run check
python3 browser_verify.py
```

Browser AutomationではFile選択、Drag & Drop、反転中追加、重複、5件上限、保存、再読込、Backup Restore、旧Data、Warning、Smartphoneを確認します。

### 4. 💡 設計者のひとこと

Test件数は目的ではありません。どの失敗がどの境界で止まるかを証明するために、層ごとのTestを組み合わせます。

### 5. ✅ チェックポイント

- Ver.1.2継承333件が成功
- Ver.1.3追加125件が成功
- 全458件が成功
- Chromium 116件が成功
- Missing Import 0件

### 6. ▶ 次へ進む条件

作業Folderで全検証が成功し、結果Fileへ実測値を記録できること。

## STEP12　ZIPを展開して完成を再検証する

### 1. 🎯 このSTEPの目的

配布ZIPそのものが、Source of Truthと同じ完全版として動くことを確認します。

### 2. 🤔 なぜこの作業をするのか

作業Folderだけで成功しても、ZIP漏れ、Fixture不足、Import Path不一致、古いReport混入があり得ます。利用者が受け取るArtifactを最後のTest対象にします。

### 3. 💻 コードを書く

```bash
zip -r Shogi-Reflection-Ver1.3.zip Shogi-Reflection-Ver1.3
unzip -t Shogi-Reflection-Ver1.3.zip
unzip Shogi-Reflection-Ver1.3.zip -d verify
cd verify/Shogi-Reflection-Ver1.3
npm test
npm run check
python3 browser_verify.py
```

### 4. 💡 設計者のひとこと

完成とは、開発者のFolderが動くことではありません。配布物から同じ結果を再現できることです。

### 5. ✅ チェックポイント

- ZIP Integrity成功
- 必須FileとFixtureが存在
- 展開後458 Test成功
- 展開後Static Verification成功
- 展開後Chromium 116件成功
- 削除File 0件

### 6. ▶ 次へ進む条件

`COMPLETION_REPORT.md`に作業FolderとZIP展開物の両方の実測結果が記録されていること。
