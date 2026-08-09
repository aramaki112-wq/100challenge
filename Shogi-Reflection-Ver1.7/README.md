# Shogi Reflection Ver.1.7

将棋の棋譜を保存し、Replayし、自分で重要局面を選び、FACT / INTERPRETATION / HYPOTHESISから振り返るBrowser Applicationです。

Ver.1.7では、Ver.1.6のEngine Architectureを維持したまま、**Engine解析を重要局面選定の前段であるSTEP3「棋譜再現」へ統合**しました。また固定9×9 Gridを変更せず、共通オリジナルSVG駒を本格化しました。

## Ver.1.7の中心Flow

```text
KIF登録
→ 棋譜保存
→ 保存済み対局を開く
→ STEP3 棋譜再現
→ 棋譜を解析する
→ Engine解析
→ 振り返り候補（原則3〜5件、解析可能局面不足時は3件未満を明示）
→ 局面を見る
→ 必要な候補だけ重要局面へ追加
→ STEP4 重要局面
→ FACT / INTERPRETATION / HYPOTHESIS
→ STEP5 振り返り
→ STEP6 Observation Theme / 実行Rule
→ STEP7 最終レポート
```

Engineは重要局面を自動確定しません。Replayからの手動追加も残っています。

## 7 Steps

1. STEP1 棋譜登録
2. STEP2 対局情報
3. STEP3 棋譜再現（Replay + Optional Engine Analysis）
4. STEP4 重要局面
5. STEP5 振り返り
6. STEP6 次局の観察テーマ／実行Rule
7. STEP7 最終レポート

## Engine Architecture

```text
Browser UI
  -> AnalyzeGame
  -> ShogiEnginePort
  -> Engine Adapter
  -> Engine
```

Application DomainはUSI commandや特定Engine Versionを知りません。本ZIPは実Engine Binary / Evaluation Modelを同梱しません。Engineが未設定でもKIF保存、Replay、手動KeyPosition、振り返り、Markdown Export、Observation Cardは利用できます。

開発時のVerification Mock EngineはBrowser自動試験専用です。実局解析用の棋力を表すものではありません。

## Piece Graphics

- 9×9 Fixed Grid / 81 equal cellsを維持
- Piece Container SizeはGrid側が決定
- `ShogiPieceSvg.js`のオリジナルSVG五角形
- Replay / Snapshotで共通Component
- 成桂・成香・成銀はSVG内の縦2段文字
- 馬・龍を含む成駒は赤文字
- 先手 / 後手方向、Board Flip対応
- 外部画像Assetなし
- Font File同梱なし（System Japanese Serif Font Stackのみ）

## Replay Scroll Policy

次へ、前へ、最初へ、最後へ、Keyboard、Move List Jump、Engine Candidate JumpでBrowser Page全体を自動Scrollしません。現在手追従はMove List Container内部だけで行います。

## Quick Start

```bash
python3 -m http.server 8000
```

Browserで `http://localhost:8000/` を開きます。

## Verification

```bash
npm test
python3 browser_verify.py
python3 visual_verify.py
python3 performance_verify.py
npm run check
```

- Automated Test: Node built-in test runner
- Browser Verification: Chromium / Playwright / 390×844
- Visual Verification: 実Screenshot生成後に目視監査
- Static Verification: Hash / Syntax / Missing Import / Architecture invariant
- Performance Verification: 300手fixtureでReplay/Snapshotの局所計測

実スマートフォン実機のThermal / Battery / Memory、実Engine BinaryでのE2E解析はVer.1.7では未実施です。

## Main Documents

- `Ver.1.7操作手順書.md`
- `ENGINE_INTEGRATION_DESIGN.md`
- `ENGINE_CANDIDATE_SELECTION_DESIGN.md`
- `ENGINE_LICENSE_AUDIT.md`
- `SOURCE_OF_TRUTH_AUDIT.md`
- `COMPLETION_REPORT.md`
- `TEST_RESULT.txt`
- `BROWSER_VERIFICATION_RESULT.txt`
- `VISUAL_VERIFICATION_RESULT.txt`
- `STATIC_VERIFICATION_RESULT.txt`
- `PERFORMANCE_RESULT.txt`

## License

既存 `LICENSE` を維持します。Ver.1.7の駒GraphicsはApplication内のオリジナルSVGで、外部Font Fileや外部画像Assetを追加していません。EngineやEvaluation ModelのLicenseはApplication Licenseとは分離して扱います。
