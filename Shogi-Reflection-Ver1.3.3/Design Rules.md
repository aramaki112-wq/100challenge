# Design Rules.md

> DAY30暫定最終`AJ`を継承し、Phase2の`AK`〜`AV`、Phase3の`AW`〜`BF`、Phase4の`BG`〜`BP`、Phase5の`BQ`〜`BZ`を維持し、Ver.1.1は`CA`から追加する。

## Phase2継承

- **INTERLUDE-Rule-AK** Repository Contractは保存技術ではなくDomain集合に対する操作を表現する。
- **INTERLUDE-Rule-AL** Repositoryは正式なDomain Entityだけを受け入れる。
- **INTERLUDE-Rule-AM** Repository内部のEntity参照を外部へ共有しない。
- **INTERLUDE-Rule-AN** 外部JSONはDomain Constructorで再検証するまでEntityとして扱わない。
- **INTERLUDE-Rule-AO** 復元候補は現在Repositoryへ触れる前に全件検証する。
- **INTERLUDE-Rule-AP** BackupとBrowser保存は同じSnapshot Schemaを使用する。
- **INTERLUDE-Rule-AQ** SnapshotはApplication ID、Schema Version、日時、Revisionを持つ。
- **INTERLUDE-Rule-AR** Browser保存失敗をDomain Data消失へ変換しない。
- **INTERLUDE-Rule-AS** Derived DataはDomainから再計算する。
- **INTERLUDE-Rule-AT** LocalStorage Adapterは文字列だけを扱う。
- **INTERLUDE-Rule-AU** Restore失敗時は現在Repositoryを変更しない。
- **INTERLUDE-Rule-AV** Persistence ErrorはDomain Errorと別のError体系で表現する。

## Phase3継承

- **INTERLUDE-Rule-AW** Browser FormはDomain Entityを直接生成しない。
- **INTERLUDE-Rule-AX** Formの文字列入力はMapperでDomain型へ変換する。
- **INTERLUDE-Rule-AY** 空の重要局面Cardは未入力として除外する。
- **INTERLUDE-Rule-AZ** 一部だけ入力された重要局面CardはValidation Errorとして扱う。
- **INTERLUDE-Rule-BA** Browser ViewはHTML Element操作だけを担当する。
- **INTERLUDE-Rule-BB** Review IDはBrowser Event Handlerではなく専用Generatorで作る。
- **INTERLUDE-Rule-BC** Form保存はApplication Serviceを通してDomain ValidationとPersistenceを接続する。
- **INTERLUDE-Rule-BD** Domain Error Codeを利用者向けMessageへ変換する境界を持つ。
- **INTERLUDE-Rule-BE** 未完成Reviewも保存できるが次局接続条件の不足を明示する。
- **INTERLUDE-Rule-BF** Browser File操作はAdapterへ分離する。

## Phase4継承

- **INTERLUDE-Rule-BG** 保存済み一覧はRepositoryのEntityを直接HTMLへ渡さない。
- **INTERLUDE-Rule-BH** 一覧表示用Dataと詳細表示用DataをPresenterで分ける。
- **INTERLUDE-Rule-BI** HTMLへ埋め込む外部文字列は必ずEscapeする。
- **INTERLUDE-Rule-BJ** 編集時はReview IDを変更せず同じAggregateを更新する。
- **INTERLUDE-Rule-BK** 削除は永続保存成功まで確定しない。
- **INTERLUDE-Rule-BL** 削除後に選択中・編集中・Preview中の参照を残さない。
- **INTERLUDE-Rule-BM** Browser一覧の空状態を正式なView Stateとして扱う。
- **INTERLUDE-Rule-BN** 一覧のButtonはData Attributeで対象Review IDを保持する。
- **INTERLUDE-Rule-BO** Event Delegationは対象Actionを明示してから処理する。
- **INTERLUDE-Rule-BP** Repositoryの更新結果とBrowser表示更新を同じEvent内で同期する。

## Phase5継承

- **INTERLUDE-Rule-BQ** MarkdownはDomain Entityではなく保存済みSnapshotから生成するDerived Artifactとして扱う。
- **INTERLUDE-Rule-BR** JSON Backupと人が読むMarkdown成果物を同じ責任にしない。
- **INTERLUDE-Rule-BS** 振り返り全文Noteと次局用Observation Cardを別のFormatterで生成する。
- **INTERLUDE-Rule-BT** Observation Cardは次局接続条件を満たすReviewからだけ生成する。
- **INTERLUDE-Rule-BU** Observation Cardの兆候候補を原因と断定しない。
- **INTERLUDE-Rule-BV** 兆候候補と根拠FACTを別Sectionへ出力する。
- **INTERLUDE-Rule-BW** Markdown File名とWiki Linkは同じNaming Ruleから生成する。
- **INTERLUDE-Rule-BX** Preview、Copy、Downloadは同じ不変Markdown Artifactを使用する。
- **INTERLUDE-Rule-BY** Browser ClipboardとFile DownloadをAdapterへ分離する。
- **INTERLUDE-Rule-BZ** Markdown Exportは保存済みGameReviewを変更しない。

## Ver.1.1追加

- **INTERLUDE-Rule-CA** 外部形式はDomainへ入る前に境界で解析する。
- **INTERLUDE-Rule-CB** Import成功と保存成功を分離する。
- **INTERLUDE-Rule-CC** Parserは入力形式の解釈だけを担当する。
- **INTERLUDE-Rule-CD** WarningとErrorを分離する。
- **INTERLUDE-Rule-CE** 自動入力と人間の観察を分離する。
- **INTERLUDE-Rule-CF** 元Dataを保持して再検証可能にする。


## Ver.1.2追加

- **INTERLUDE-Rule-CG** 棋譜表記と盤面状態を同じObjectへ混在させない。
- **INTERLUDE-Rule-CH** 一手の適用は現在Positionを変更せず新しいPositionを生成する。
- **INTERLUDE-Rule-CI** Replay操作とGameReview保存操作を分離する。
- **INTERLUDE-Rule-CJ** 表示上の盤面反転で内部Square座標を変更しない。
- **INTERLUDE-Rule-CK** 不明な指し手を推測で盤面へ適用しない。
- **INTERLUDE-Rule-CL** Position Historyを保持し任意手数を再検証可能にする。
- **INTERLUDE-Rule-CM** Browser UIは盤面更新Ruleを持たない。
- **INTERLUDE-Rule-CN** 途中まで再現できた場合は失敗手数と再現可能最終手数を明示する。

## Ver.1.3追加

- **INTERLUDE-Rule-CO** Replay局面と振り返り本文を同じ責務へ混在させない。
- **INTERLUDE-Rule-CP** Replay Snapshotは再検証可能な客観的局面情報だけを保持する。
- **INTERLUDE-Rule-CQ** FACT・INTERPRETATION・HYPOTHESISをReplay結果から自動生成しない。
- **INTERLUDE-Rule-CR** 現在局面の候補追加とGameReviewの正式保存を分離する。
- **INTERLUDE-Rule-CS** 盤面反転状態をSnapshot内部座標へ保存しない。
- **INTERLUDE-Rule-CT** Snapshotなしの旧KeyPositionを有効なDataとして扱う。
- **INTERLUDE-Rule-CU** 同一手数の重要局面を暗黙に重複追加しない。
- **INTERLUDE-Rule-CV** Snapshot生成失敗時に既存Form入力を変更しない。
- **INTERLUDE-Rule-CW** Replayからの追加でも重要局面5件上限を越えさせない。
- **INTERLUDE-Rule-CX** Warning付き局面では公開可能なWarningをSnapshotへ引き継ぐ。
- **INTERLUDE-Rule-CY** Browser UIはReplay Snapshot生成Ruleを持たない。
- **INTERLUDE-Rule-CZ** Replay Snapshot Versionを明示し将来Format変更を暗黙変換しない。

## Ver.1.3.2追加

- **INTERLUDE-Rule-DA** Replay状態更新とBrowser Page Scrollを同じ責務へ混在させない。
- **INTERLUDE-Rule-DB** 現在手の強調表示のためにBrowser Page全体を自動Scrollしない。
- **INTERLUDE-Rule-DC** Move List追従が必要な場合はMove List Container内部のScrollで完結させる。
- **INTERLUDE-Rule-DD** 意図的なScroll後にFocusする場合はFocusによる追加Scrollを防ぐ。
- **INTERLUDE-Rule-DE** UI Scroll状態をReplay Domain、GameReview、Snapshotへ保存しない。
- **INTERLUDE-Rule-DF** Smartphone Replayでは盤面とNavigationを連続して見られることを優先する。
- **INTERLUDE-Rule-DG** Current MoveのDOM識別子は盤面反転状態から独立させる。
- **INTERLUDE-Rule-DH** 利用者がMove Listを選択した場合だけ盤面へ戻るPage Scrollを明示的に許可する。
- **INTERLUDE-Rule-DI** 同一棋譜のNavigationではMove List構造を不要に再構築せず現在手状態だけを更新する。
- **INTERLUDE-Rule-DJ** Scroll追従失敗をDomain DataまたはRepository Dataの変更へ変換しない。

## Ver.1.3.3追加

- **INTERLUDE-Rule-DK** 一時的なKIF入力のClearと保存済みGameReviewのDeleteを同じ操作へ混在させない。
- **INTERLUDE-Rule-DL** Import PreviewのResetによってRepository DataまたはLocalStorage Dataを変更しない。
- **INTERLUDE-Rule-DM** UI表示文言の日本語化をDomain ModelのRename理由にしない。
- **INTERLUDE-Rule-DN** 利用者に見える操作名は結果を予測できる日本語を優先する。
- **INTERLUDE-Rule-DO** 「戻る」のように結果が複数解釈できるButton名を単独で使用しない。
- **INTERLUDE-Rule-DP** Application内KIF入力のClearとClipboardのClearを混同しない。
- **INTERLUDE-Rule-DQ** KIF入力UXの変更によってVer.1.3.2 Replay Scroll Policyを破壊しない。
