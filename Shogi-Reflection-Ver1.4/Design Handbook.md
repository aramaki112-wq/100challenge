# Design Handbook.md — Ver.1.4 Step型UI・棋譜先行保存・Saved Game Viewer・Board Graphics

> 中心の問い：Application WorkflowとDomain Completionを、どう分離すれば「今は棋譜だけ保存、後で考える」を安全に実現できるか。

# 第1部　Source of TruthとLifecycleを守る

## STEP01　Ver.1.3.3を監査する
### 1. 🎯 このSTEPの目的
既存Domain、Repository、Storage、Replay Scroll、KIF Reset、Testを変更前に固定する。
### 2. 🤔 なぜこの作業をするのか
UX改善で解決済み挙動を再発させないため。
### 3. 💻 コードを書く
`SOURCE_OF_TRUTH_V1_3_3_BASELINE_HASHES.json`へ全File Hashを記録し、`npm test`を基準実行する。
### 4. 💡 設計者のひとこと
変更前の証拠がなければ「維持した」は感想になる。
### 5. ✅ チェックポイント
229 File、505 Test、ReplayScrollPolicy、Schema Version 1、Design Rule DQを確認する。
### 6. ▶ 次へ進む条件
変更してよい場所とHash一致で守る場所を説明できること。

## STEP02　SaveとCompleteを分ける
### 1. 🎯 このSTEPの目的
棋譜保存条件と振り返り完成条件を別Intentにする。
### 2. 🤔 なぜこの作業をするのか
疲れている日に重要局面3件を要求すると棋譜自体を保存できないため。
### 3. 💻 コードを書く
`SAVE_GAME`、`SAVE_REFLECTION_DRAFT`、`COMPLETE_REFLECTION`を`SubmitGameReviewForm`へ導入する。
### 4. 💡 設計者のひとこと
Validationは「いつ正しい必要があるか」まで設計する。
### 5. ✅ チェックポイント
GAME_ONLYでKeyPosition 0、Theme 0、Rule 0が保存できる。
### 6. ▶ 次へ進む条件
Completeだけが既存3〜5 / 1 / 1〜3 Ruleを要求すること。

# 第2部　Step WorkflowとSaved Game Viewerを作る

## STEP03　Step NavigationをPresentationへ閉じ込める
### 1. 🎯 このSTEPの目的
7 Stepへ分割してもDomain StateをNavigationへ依存させない。
### 2. 🤔 なぜこの作業をするのか
ページ番号がDomain RuleになるとUI変更のたびにModelが壊れるため。
### 3. 💻 コードを書く
`BrowserStepNavigation.js`でPanelのhidden状態、Progress、前後Label、aria-labelだけを管理する。
### 4. 💡 設計者のひとこと
画面遷移は「何を見せるか」であって「何が真か」ではない。
### 5. ✅ チェックポイント
Step移動にSave、Delete、Form Resetがない。
### 6. ▶ 次へ進む条件
前後移動しても入力Dataが残ること。

## STEP04　Saved Game ViewerをRead Modelとして作る
### 1. 🎯 このSTEPの目的
保存済み対局をStatus付きで後から選べるようにする。
### 2. 🤔 なぜこの作業をするのか
保存と再開が分離されたらLibraryがWorkflow入口になるため。
### 3. 💻 コードを書く
`GameReviewLibraryPresenter`でSummaryを作り、Position Historyは生成しない。
### 4. 💡 設計者のひとこと
一覧は一覧の情報量で作る。詳細計算を先回りしない。
### 5. ✅ チェックポイント
対局日、相手、手番、結果、手数、Status、保存/更新日時を表示する。
### 6. ▶ 次へ進む条件
棋譜のみ対局からSTEP3へ再開できること。

# 第3部　盤面とHelpをPresentationとして改善する

## STEP05　駒Graphicsを共通SVG Componentへする
### 1. 🎯 このSTEPの目的
成桂等の2文字問題とAsset License問題を同時に解く。
### 2. 🤔 なぜこの作業をするのか
外部駒画像をコピーせず、ReplayとSnapshotで同じ見た目を使うため。
### 3. 💻 コードを書く
`ShogiPieceSvg.js`で五角形、文字、Promotion Mark、回転Classを生成する。
### 4. 💡 設計者のひとこと
見た目の問題をDomainの駒表現変更へ持ち込まない。
### 5. ✅ チェックポイント
40枚、成桂・成香・成銀・馬・龍、反転、aria-labelをTestする。
### 6. ▶ 次へ進む条件
Replay Domain Fileを変更せず視認性が改善していること。

## STEP06　Application内Helpを作る
### 1. 🎯 このSTEPの目的
操作を外部説明なしでも追えるようにする。
### 2. 🤔 なぜこの作業をするのか
Step型UIは入口が増えるため、迷った場所から該当説明へ戻れる必要がある。
### 3. 💻 コードを書く
Headerの`使い方`と各Stepの`この画面の使い方`をHelp Sectionへ接続する。
### 4. 💡 設計者のひとこと
複雑なHelp Systemより、現在地から一回で説明へ届く方を優先する。
### 5. ✅ チェックポイント
KIF、Save、Viewer、Replay、KeyPosition、Reflection、Next、Report、Backupを網羅する。
### 6. ▶ 次へ進む条件
390pxでHelp本文を読めること。

# 第4部　RegressionとPackagingで完成させる

## STEP07　Replay Scrollを回帰Testする
### 1. 🎯 このSTEPの目的
Step化でVer.1.3.2の解決済みScroll問題を再発させない。
### 2. 🤔 なぜこの作業をするのか
DOM配置が変わるだけでもBrowser Scrollは回帰し得るため。
### 3. 💻 コードを書く
300手Fixtureを390×844 Chromiumで開き、Next 50、Previous 10、First、Last、KeyboardをAutomationする。
### 4. 💡 設計者のひとこと
Regression Testは「昔壊れた場所」を未来の変更から守る契約になる。
### 5. ✅ チェックポイント
Page scrollY不変、Move List scrollTop増加、Current Move Highlightを確認する。
### 6. ▶ 次へ進む条件
ReplayScrollPolicy Hash一致＋Browser Test成功。

## STEP08　ZIPを再展開して再検証する
### 1. 🎯 このSTEPの目的
作業Folderではなく配布物そのものを完成判定する。
### 2. 🤔 なぜこの作業をするのか
ZIP欠落・Import欠落・生成漏れは作業Folder Testだけでは見つからないため。
### 3. 💻 コードを書く
正式ZIPを作成し別Folderへ展開後、`npm test`、`python3 browser_verify.py`、`npm run check`を展開物だけで実行する。
### 4. 💡 設計者のひとこと
成果物は作ったFolderではなく、相手が受け取るZIPである。
### 5. ✅ チェックポイント
Missing Import 0、Automated/Browser/Static全成功、LICENSE維持、Audit更新。
### 6. ▶ 次へ進む条件
`COMPLETION_REPORT.md`に展開後結果を記録できること。
