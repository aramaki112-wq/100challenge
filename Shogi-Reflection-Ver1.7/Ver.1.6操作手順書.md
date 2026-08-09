# 将棋振り返りアプリ Ver.1.6 操作手順書

## 1. 起動

FolderをVS Codeで開き、Local HTTP Serverから `index.html` を表示する。
例:

```bash
python3 -m http.server 8000
```

Browserで `http://localhost:8000/` を開く。

> `file://` 直開きではModule制約があるためHTTP Serverを推奨する。

## 2. 通常の振り返り

既存Flowは変わらない。

1. STEP1 棋譜登録
2. STEP2 対局情報
3. STEP3 棋譜再現
4. STEP4 重要局面
5. STEP5 振り返り
6. STEP6 次局の観察テーマ／実行Rule
7. STEP7 最終レポート

KIF登録後は振り返り未完成でも棋譜先行保存できる。

## 3. Engineが設定されていない場合

「棋譜を解析」を押すと、Engine未設定の案内が出る。
これはApplication故障ではない。

そのまま:

- 棋譜保存
- Replay
- 手動重要局面登録
- FACT / INTERPRETATION / HYPOTHESIS
- 最終レポート

を利用できる。

## 4. Engineが設定されている場合

STEP4付近の「Engine解析候補」で「棋譜を解析」を押す。

表示:

- 解析中
- 進捗（解析済み局面 / 全局面）
- 解析を中止
- 解析済み
- Engine metadata
- 振り返り候補

## 5. Candidateを見る

候補には:

- 手数
- 大きく悪化した可能性 / 振り返り候補 / 良かった可能性
- 実戦手
- Engine候補
- 評価変化

が表示される。

「局面を見る」 → STEP3 Replayの該当局面へ移動。

「重要局面へ追加」 → 既存KeyPosition Flowで追加。

Engine候補は自動登録されない。

## 6. FACT等の記入例

Placeholderは説明例であり、保存Dataには入らない。

FACT例:
「相手の飛車が自陣へ侵入しており、自玉の逃げ道が1つしかなかった。」

INTERPRETATION例:
「攻めを優先し、自玉の安全を十分に確認していなかった。」

HYPOTHESIS例:
「一度受けてから攻めれば、形勢悪化を防げた可能性がある。」

## 7. 再解析

解析済み対局では「現在設定で再解析」を使用できる。
過去結果はEngine Analysis RepositoryのHistoryに保持され、新Resultが追加される。

## 8. Analysis Settings

内部Preset:

- FAST
- STANDARD
- DETAILED

Ver.1.6 UIでは複雑なEngine optionを露出しない。
将来「高速・標準・詳細」として正式UI化可能な構造にしている。

## 9. Browser Engineの接続点（開発者向け）

既定ではEngineなし。

外部Provider:

```js
window.ShogiReflectionEngineProvider = {
  async createEngine() {
    return myShogiEngineAdapter;
  }
};
```

またはUSI互換Worker URLをApp起動前に設定:

```js
window.SHOGI_REFLECTION_ENGINE_WORKER_URL = "/engine/usi-worker.js";
window.SHOGI_REFLECTION_ENGINE_METADATA = {
  engineVersion: "...",
  evaluationModel: "...",
  evaluationModelVersion: "..."
};
```

本ZIPはEngine/WASM/評価Fileを含まない。

## 10. Verification Mock

`?engine=mock` は開発・Browser Verification専用。
棋力はなく、実局の振り返りに使用してはいけない。
UIに `Verification Mock Engine` と表示される。

## 11. 解析中止

「解析を中止」を押す。
別対局を開く場合も現在解析をCancelする。

## 12. Backup / Restore

既存GameReview Backup/RestoreはVer.1.4.1互換を維持。
Ver.1.6 Engine Analysis cacheは既存Game Backupへ含めない。
再解析で復元できるReference Dataとして別LocalStorageに保存する。

## 13. Fixed Grid / Replay Scroll

- 盤面は9×9固定。
- 成桂・成香・成銀で升Sizeは変わらない。
- 駒外形は軽い丸みを追加したがContainer Sizeは不変。
- Replayの前/次/最初/最後/KeyboardでPage全体を自動Scrollしない。
- Move List追従はContainer内部のみ。
