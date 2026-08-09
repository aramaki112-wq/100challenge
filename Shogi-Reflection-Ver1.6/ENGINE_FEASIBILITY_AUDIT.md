# ENGINE FEASIBILITY AUDIT — Ver.1.6

監査日: 2026-08-09

## 1. 結論

Ver.1.6では、特定の将棋Engineや評価関数をApplicationへ固定同梱しない。
Application側は `ShogiEnginePort` をSource of Truthとし、最初の互換AdapterとしてUSI対応の `YaneuraOuEngineAdapter` を実装する。
BrowserでEngineが未設定でも、KIF登録・保存・Replay・手動重要局面・振り返りは従来どおり利用できる。

採用判断は「最強であること」より、次の順で重視した。

1. USI互換性と交換可能性
2. 解析結果をApplication固有Modelへ正規化できること
3. Version／評価Modelを追跡できること
4. License境界をApplicationと分離できること
5. Desktop／Installed Appへ移行しやすいこと
6. Smartphoneで無理に常時Engineを動かさないこと

## 2. 公式一次情報の確認結果

### やねうら王

- 公式RepositoryはUSI準拠を明記している。
- MultiPV対応を明記している。
- Windows、Ubuntu、macOS、ARM等をサポートしている。
- KPPT、KPP_KKPT、NNUE、SFNN等、複数評価方式へ対応している。
- Source LicenseはGPLv3。
- GitHub Releasesで一般公開されている通常版としてV9.00が確認できる。
- 2026-07-02の更新履歴にV9.60がある。
- 2026年8月時点の公式CIには「やねうら王 : V9.70」というmaster commitが確認できる。
- よって「一般配布Release」と「開発中master」を同一Versionとして扱わない。

### 水匠

- 公式やねうら王Wikiでは、水匠11を `SFNN_halfka2_1024_7_64_k3k3` とし、WCSC36版の開発中Version、2026-05-31の支援者向けNews Letterで頒布と記載している。
- 水匠11β、水匠11α、水匠10等も別Version・別Architectureとして掲載されている。
- 「支援者向け頒布されている」ことと、「第三者Applicationへ再配布・販売同梱してよい」ことは同義ではない。
- 今回確認できた公式一次資料だけでは、水匠11評価Fileの包括的な再配布／商用Bundling許諾を確定できなかった。

## 3. 候補比較

| 候補 | 棋力 | USI | MultiPV | Browser | Smartphone | Desktop | License/再配布 | 採否 |
|---|---|---|---|---|---|---|---|---|
| YaneuraOu + 外部評価File | 高 | ○ | ○ | WASM build pathあり。ただし本Appで実Engine未検証 | 高負荷Risk | ◎ | Engine GPLv3。評価Fileは別License | **Adapter標準対象** |
| YaneuraOu MATERIAL等の評価File不要構成 | 解析精度は評価File型より低い可能性 | ○ | ○ | build次第 | 比較的扱いやすい可能性 | ◎ | Engine GPLv3 | 技術Smoke候補 |
| 水匠11 + YaneuraOu | 非常に高い候補 | ○ | ○ | Engine build次第 | 高負荷Risk | ◎ | 水匠11再配布条件を今回確定できず | **同梱しない** |
| ふかうら王 | 高 | やねうら王系Option | 構成依存 | Browser実装負荷大 | GPU/Runtime負荷大 | ○ | Runtime等も個別監査必要 | Ver.1.6不採用 |
| Remote Analysis | Server依存 | 内部自由 | ○ | ◎ | ◎ | ◎ | Server/Model License必要 | 将来候補 |
| Verification Mock Engine | 棋力なし | 不要 | 模擬 | ◎ | ◎ | ◎ | App内 | Test限定 |

## 4. Browser実行性

やねうら王RepositoryにはWebAssembly向けCIが存在するため、WASM build自体は技術的な候補である。
しかし、通常のWeb Browserは任意のLocal native executableを直接起動できない。
また「WASM build可能」と「このApplicationでSmartphoneを含め実用的に安定動作する」は別問題である。

Ver.1.6では次を採用した。

- Browserの標準状態: Engine未設定。
- Browser Worker URLが外部から設定された場合のみ `BrowserWorkerUsiTransport` で接続可能。
- `window.ShogiReflectionEngineProvider.createEngine()` を差し替え点として用意。
- Testでは `MockShogiEngineAdapter` を明示的に利用。
- 本ZIPにWASM Engine Binary／Worker／評価Fileは同梱しない。

## 5. Smartphone実行性

Smartphone Browserで1局全手数を深く解析すると、CPU時間、Battery、発熱、Memory、Tab停止のRiskがある。
今回、実機Engineでの解析時間・発熱・Battery消費は測定していないため「高速」「安全」とは断定しない。

推奨順:

1. 現Ver.1.6: Engine未設定でも振り返り可能。
2. 将来: Lightweight WASMをWorkerで低負荷Preset運用し、実機Performance Test。
3. 将来: Tauri/Electron/Native Wrapper等でnative USI Engineを別Process実行。
4. 必要ならRemote Analysisを独立Adapterとして追加。

## 6. Desktop Application適合性

Desktop/Installed Appではnative USI Processとの相性が良い。
Ver.1.6には `NodeChildProcessUsiTransport` を追加し、次のSecurity方針を採用した。

- Engine pathは絶対Pathを要求する。
- `spawn(..., { shell: false })` を利用する。
- Application ServiceからShell commandを組み立てない。
- Engine固有USI commandはAdapter/Transport境界へ閉じ込める。

ただしVer.1.6はElectron/Tauri本実装を行っていないため、Desktop E2Eは未実施。

## 7. Performance Risk

- 1局を毎局面解析するため、設定depth/nodes/timeに比例して処理量が増える。
- MultiPVは候補数に応じて探索負荷が増える可能性がある。
- Ver.1.6 Browser TestはMock Engineで行い、実Engineの1局解析時間は測定していない。
- UI Freezeを避けるためBrowser native main threadへEngineを直結しない設計とした。

## 8. Integration Risk

主なRiskと対策:

- 評価符号の逆転 → `EvaluationNormalizer` とAutomated Testで統一。
- mateを巨大CPへ変換してRanking破壊 → `EvaluationDelta`で別Transition。
- Engine更新でProtocol差分 → `ShogiEnginePort` / `UsiEngineAdapter` 境界。
- 評価File差替えで結果再現不能 → Engine Metadata + Evaluation Model Metadata保存。
- Engineが無いとApp全体停止 → `ENGINE_NOT_FOUND` をGraceful Degradationとして扱う。
- Browser Worker/WASMが重すぎる → Ver.1.6では非同梱、Performanceを未検証として記録。

## 9. Recommendation

**Ver.1.6の正式推奨は「YaneuraOu互換USIを最初のAdapter targetとするが、Engine Binary・水匠評価FileをApplicationへ固定同梱しない」方式。**

将来の配布版では、EngineをUser Download方式またはInstalled App側の外部Engine Directory方式にすることを第一候補とし、Bundlingする場合はその時点のEngine License・評価Model License・Runtime Licenseを再監査する。

## 10. 参照した公式Source

- https://github.com/yaneurao/YaneuraOu
- https://github.com/yaneurao/YaneuraOu/releases
- https://github.com/yaneurao/YaneuraOu/wiki/やねうら王の更新履歴2026
- https://github.com/yaneurao/YaneuraOu/wiki/やねうら王のインストール手順
- https://github.com/yaneurao/YaneuraOu/actions
- https://yaneuraou.yaneu.com/2024/07/01/about-the-redistribution-of-yaneuraou/
- https://yaneuraou.yaneu.com/2026/05/07/wcsc36-petashock-suisho11/
