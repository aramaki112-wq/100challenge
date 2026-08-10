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

## Ver.1.4追加

- **INTERLUDE-Rule-DR** 棋譜保存条件と振り返り完成条件を同じValidationへ混在させない。
- **INTERLUDE-Rule-DS** 振り返り未完成でも成立済み棋譜と対局情報は保存可能とする。
- **INTERLUDE-Rule-DT** Step画面遷移をDomain ValidationまたはCompletion判定の代替にしない。
- **INTERLUDE-Rule-DU** 保存済み対局一覧では選択されていない対局のPosition Historyを生成しない。
- **INTERLUDE-Rule-DV** Board Graphicsの変更をReplay Domain変更の理由にしない。
- **INTERLUDE-Rule-DW** 駒Visual Assetは将来の一般公開・配布・販売を妨げない権利条件だけを採用する。
- **INTERLUDE-Rule-DX** Clear、Delete、Save、Completeを異なるOperationとして設計する。
- **INTERLUDE-Rule-DY** Application NavigationのButton名は可能な限り移動先または結果を明示する。
- **INTERLUDE-Rule-DZ** Ver.1.3.2で解決済みのReplay Scroll PolicyをStep UI再設計で破壊しない。
- **INTERLUDE-Rule-EA** Step間移動だけを理由に未保存Form Stateを破棄しない。
- **INTERLUDE-Rule-EB** 旧Backupに新Lifecycle項目が無い場合はPersistence境界で後方互換推定し旧Dataを拒否しない。
- **INTERLUDE-Rule-EC** 対局メモだけを振り返り開始の証拠として扱わない。
- **INTERLUDE-Rule-ED** Replay盤と重要局面Snapshot盤は同じ駒Presentation Componentを再利用する。

## Ver.1.4.1追加

- **INTERLUDE-Rule-EE** 駒Graphicsによって将棋盤の升Sizeを変更してはならない。
- **INTERLUDE-Rule-EF** 9×9盤面のGrid Geometryは局面内容から独立させる。
- **INTERLUDE-Rule-EG** 2文字駒の表示調整はSquareを拡張せずPiece内部で完結させる。
- **INTERLUDE-Rule-EH** 保存済み対局一覧へRaw KIF Headerをそのまま表示しない。
- **INTERLUDE-Rule-EI** 対局日・保存日時・更新日時は意味の異なるDateとして表示する。
- **INTERLUDE-Rule-EJ** Domainへ保持する情報と利用者へ表示する情報を混同しない。
- **INTERLUDE-Rule-EK** 一覧Summaryだけのために既存Dataと同義のDomain Propertyを追加せずRead Modelで要約する。
- **INTERLUDE-Rule-EL** Replay盤と重要局面Snapshot盤は同じFixed Grid Geometry方針を適用する。



## Ver.1.6追加

- **INTERLUDE-Rule-EM** Application Domainを特定Engine Versionへ依存させてはならない。
- **INTERLUDE-Rule-EN** Engine固有ProtocolはAdapter境界の外へ漏らしてはならない。
- **INTERLUDE-Rule-EO** Engine解析結果と本人の振り返りを同一の事実として扱ってはならない。
- **INTERLUDE-Rule-EP** 評価値は統一された本人視点へNormalizeしてから比較する。
- **INTERLUDE-Rule-EQ** 重要局面候補は評価値の絶対値だけでなく本人の手による変化を考慮する。
- **INTERLUDE-Rule-ER** Engine候補を本人の重要局面として自動確定してはならない。
- **INTERLUDE-Rule-ES** Engineが利用できなくても既存の手動振り返り機能を利用可能にする。
- **INTERLUDE-Rule-ET** Engine VersionとEvaluation Model Versionを解析結果から追跡可能にする。
- **INTERLUDE-Rule-EU** Engine進化後に過去結果を破壊せず再解析可能な設計を維持する。
- **INTERLUDE-Rule-EV** Engineの強さだけでなく交換可能性と再現可能性を優先する。
- **INTERLUDE-Rule-EW** AI AdviceとEngine Analysisの責務を混同しない。
- **INTERLUDE-Rule-EX** Engine LicenseとApplication Licenseを混同しない。
- **INTERLUDE-Rule-EY** 解決済みFixed GridをEngine UI追加によって破壊してはならない。
- **INTERLUDE-Rule-EZ** 解決済みReplay Scroll PolicyをEngine機能追加によって破壊してはならない。


## Ver.1.7追加

- **INTERLUDE-Rule-FA** Engine解析候補は重要局面選定の前段であるSTEP3から利用可能にする。
- **INTERLUDE-Rule-FB** Engine候補からのReplay Jumpは既存Replayを利用しCandidate専用盤面を作らない。
- **INTERLUDE-Rule-FC** Engine UI追加によってSTEP4の登録済み重要局面を編集する責務を候補一覧へ置換しない。
- **INTERLUDE-Rule-FD** Ver.1.7以降はMove List Jumpを含むReplay NavigationでBrowser Page Scrollを要求せずINTERLUDE-Rule-DHのPage Scroll例外を適用しない。
- **INTERLUDE-Rule-FE** Presentation品質向上だけを理由にGameReview Domain Modelを変更しない。
- **INTERLUDE-Rule-FF** 外部FontまたはGraphics AssetをLicense確認なしにApplicationへ同梱しない。
- **INTERLUDE-Rule-FG** 駒の本格感よりFixed Gridの視認性と安定描画を優先する。


## Ver.1.8追加

- **INTERLUDE-Rule-FH** 実Engine RuntimeはShogiEnginePortの外側へ配置しApplication Domainから特定Engine実装を参照しない。
- **INTERLUDE-Rule-FI** Browser上の長時間Engine探索をMain UI Threadで実行しない。
- **INTERLUDE-Rule-FJ** Smartphone Engine設定は最大棋力よりStability・Memory・Responsiveness・Cancelを優先する。
- **INTERLUDE-Rule-FK** Engine PanelはReplay盤面より前に配置し解析候補から既存Replayへ接続する。
- **INTERLUDE-Rule-FL** 盤面操作Buttonは盤面を見ながら操作できるReplay Navigation Areaへ集約する。
- **INTERLUDE-Rule-FM** 外部Engine本体とEvaluation FileまたはModel WeightのLicenseを別Componentとして監査する。
- **INTERLUDE-Rule-FN** License・出所・対応Sourceを追跡できない外部BinaryまたはModelを正式配布物へ同梱しない。
- **INTERLUDE-Rule-FO** Personal Use・Public Distribution・Commercial DistributionのReadinessを同一判定へ統合しない。
- **INTERLUDE-Rule-FP** Legal uncertaintyを推測で解消済みとして扱わず配布に影響する場合はLEGAL REVIEW REQUIREDを記録する。
- **INTERLUDE-Rule-FQ** Real EngineのVersion・Evaluation Version・解析Settings・解析日・Schema Versionを再解析可能なMetadataとして保持する。
- **INTERLUDE-Rule-FR** Engine Failure・Timeout・Crash・Missing AssetによってGameReview Application全体を利用不能にしない。
- **INTERLUDE-Rule-FS** Background移行時に不要なEngine解析を継続せずResource Safety Policyに従って停止する。
- **INTERLUDE-Rule-FT** Mock EngineによるRegression結果をReal Engine E2Eの証拠として扱わない。

## Ver.1.8 Real YaneuraOu Integration追加

- **INTERLUDE-Rule-FU** Engine Candidateの「局面を見る」は利用者の明示的な盤面確認要求としてのみBrowser Page Scroll例外を許可する。
- **INTERLUDE-Rule-FV** Good CandidateとBad Candidateは独立して最大5件まで選出し基準未達候補を件数合わせのために生成しない。
- **INTERLUDE-Rule-FW** Bad Candidateは実戦前のEngine Best Evaluationと実戦手後Evaluationの差を本人視点へNormalizeして比較する。
- **INTERLUDE-Rule-FX** Mate評価をCandidate Rankingの都合だけで巨大なCentipawn値へ変換しない。
- **INTERLUDE-Rule-FY** Engine推奨手をUIで唯一の正解と断定しない。
- **INTERLUDE-Rule-FZ** Real YaneuraOu未実行の検証結果をReal YaneuraOu E2E成功として記録しない。
- **INTERLUDE-Rule-GA** YaneuraOu WASMを配布候補へ昇格する前にSource Commit・Compiler Version・Build Command・Output Hashを記録する。
- **INTERLUDE-Rule-GB** ReflectionLocalEngineへFallbackした場合はYaneuraOuと異なるEngine NameとFallback理由を利用者へ明示する。
- **INTERLUDE-Rule-GC** Smartphone向けMultiPVのDefaultはCandidate比較に必要な最小量から開始し測定前に最適値と表現しない。
- **INTERLUDE-Rule-GD** 添付Sample KIFは専用Domainを作らず既存KIF Import/Preview/Parser経路を通す。
## Ver.1.8.2追加

- **INTERLUDE-Rule-GE** 評価値グラフは既存Replay Stateを再利用し独自の局面Stateを持たない。
- **INTERLUDE-Rule-GF** Mate評価を表示都合で巨大CPへ変換しない。
- **INTERLUDE-Rule-GG** Graph上のKeyPositionは既存KeyPosition DomainだけをSource of Truthとする。
- **INTERLUDE-Rule-GH** GraphのKeyPosition MarkerはSTEP4先頭ではなく該当Cardへ移動する。
- **INTERLUDE-Rule-GI** CandidateからKeyPositionを追加するData操作でPage Scrollを発生させない。
- **INTERLUDE-Rule-GJ** official WASM pre-jsが提供する起動Queueや終了処理をAdapter外から迂回しない。
- **INTERLUDE-Rule-GK** Threaded WASMはBuild metadataとBrowser capabilityを満たす場合だけPrimaryとして選択する。
- **INTERLUDE-Rule-GL** 通常Automated Test成功をReal Engine E2E成功と読み替えない。
- **INTERLUDE-Rule-GM** Formal CompletionはReal Artifact、Real E2E、License Evidenceの独立Gateをすべて通過して初めて成立する。
- **INTERLUDE-Rule-GN** Build ToolchainのLicenseと生成Engine ComponentのLicenseを同一Componentとして監査しない。


## Ver.1.8.3追加

- **INTERLUDE-Rule-GO** Real Engine Binaryはofficial Source・Exact Commit・Compiler Version・Build Command・Output Hashを一つのBuild Evidenceへ結合できる場合だけ採用候補とする。
- **INTERLUDE-Rule-GP** Emscripten Versionは`latest`で解決せず固定Releaseとofficial release mappingを検証する。
- **INTERLUDE-Rule-GQ** Buildが成功してもReal Browser・Real USI・Real Application E2Eの成功を推論してはならない。
- **INTERLUDE-Rule-GR** Real USI EvidenceとReal Application E2E Evidenceは別Fileで記録し同一WASM SHA-256との一致をFormal Gateで要求する。
- **INTERLUDE-Rule-GS** Build outputのWorker File名は実生成物から決定し存在しない想定File名を成功Evidenceへ記録しない。
- **INTERLUDE-Rule-GT** Upstream pthread・Memory・Stack値を再現Buildに採用しても実測前にSmartphone最適値と表現しない。
- **INTERLUDE-Rule-GU** Threaded WASMのHosting成立性はLocal・Desktop・GitHub Pages・iPhone Safari・Installed Appを分離して判定する。
- **INTERLUDE-Rule-GV** GitHub Actions Hosted RunnerのLabelをbit-for-bit固定環境と扱わず実Runner Image・OS・Tool VersionをBuild Metadataへ残す。
- **INTERLUDE-Rule-GW** Corresponding Source候補はBinaryと同じExact Commitから生成しBuild Script・Toolchain・Modification有無と結び付ける。
- **INTERLUDE-Rule-GX** Public DistributionとCommercial Distributionの法的判断をEngineering Build Gateだけで自動承認しない。
- **INTERLUDE-Rule-GY** Formal Completion未達時の配布ZIP名にはNOT-FORMALを明示する。
- **INTERLUDE-Rule-GZ** Formal CompletionはZIP作成後に別Folderへ展開した内容だけで再検証して初めて確定する。
