# MOBILE_REPLAY_UX.md

## Ver.1.3.2 Smartphone Replay方針

主対象はPortraitの390px前後である。

### 最優先Loop

```text
盤面を見る
↓
次へ
↓
同じViewportで盤面を見る
↓
次へ
↓
同じViewportで盤面を見る
```

### 実装内容

- Navigation Buttonは390px前後では4列を維持する。
- 各Navigation Buttonは最低48pxのTouch Targetを持つ。
- 350px未満のみ2列へFallbackする。
- 持ち駒欄をSmartphoneでコンパクト化する。
- 棋譜一覧は高さを制限し`overflow:auto`で内部Scrollする。
- `overscroll-behavior: contain`を維持する。
- Current Moveは左Border、背景、太字、`aria-current`、`aria-selected`で示す。
- 盤面のFrom/To Highlightを維持する。
- Replay PanelではBrowserのScroll Anchoringによる微小なViewport移動を抑制する。

### 390px Browser確認

Ver.1.3.2 Browser Automationでは300手Fixtureを使用し、次を確認した。

- 盤面とNavigationを同一Viewportで確認可能
- Touch Target 48px以上
- 次へ50回連続
- 前へ10回連続
- 最初へ／最後へ
- Keyboard ArrowLeft
- 100手／200手／300手Jump
- 盤面反転
- 重要局面追加後の継続Navigation
- Move List内部Scroll
- Move List Tap後にReplay盤面へ戻る

詳細値は`BROWSER_VERIFICATION_RESULT.txt`をSource of Truthとする。
