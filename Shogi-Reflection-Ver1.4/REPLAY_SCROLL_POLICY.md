# REPLAY_SCROLL_POLICY.md

## 1. 目的

Ver.1.3.2では、Replay State更新とBrowser Page Scrollを分離する。

通常のReplay Navigationでは次を守る。

```text
Replay Stateを変更
↓
盤面・状態表示を更新
↓
現在手Highlightを更新
↓
必要な場合だけ棋譜一覧Container内部を追従
↓
Browser PageのscrollYは変更しない
```

## 2. 原因

Ver.1.3.1の`BrowserShogiReplayView.render()`は、現在手Highlight後に次を実行していた。

```js
this.moveList.querySelector(".is-current")?.scrollIntoView({ block: "nearest" });
```

`scrollIntoView()`は対象Elementを見せるためにScroll可能な祖先を動かすため、棋譜一覧内部だけでなくBrowser Page全体が移動し得る。Smartphoneで棋譜一覧が盤面の下にある場合、NavigationのたびにPageが棋譜一覧側へ引かれ、盤面を見続けられなかった。

## 3. Ver.1.3.2 Policy

`ReplayScrollPolicy`を追加し、現在手追従は`#replay-move-list`の`scrollTop`だけを変更する。

- Page Scroll要求: `NONE`
- Scroll Scope: `MOVE_LIST_CONTAINER`
- Current Moveが見えている: Scrollしない
- 上へ見切れた: Containerの`scrollTop`を減らす
- 下へ見切れた: Containerの`scrollTop`を増やす
- Container / Itemがない: 例外でDomain Dataを変更せず無視できる状態を返す

## 4. Page Scrollを許可する場面

Page Scrollは利用者の明示操作に対応する場合だけ行う。

- KIFをFormへ反映してReplayを開始する
- 「現在Formの棋譜を再現」を押す
- 保存済み対局からReplayを開く
- 棋譜一覧を利用者自身がタップし、選択局面を盤面で確認する

この場合も、盤面を中央寄せしてSmartphoneで盤面とNavigation Buttonを同時に見やすくする。

## 5. Focus Policy

Replay NavigationではFocusを移動しない。

重要局面追加成功時のForm Feedbackは表示するがFocusを奪わない。重複重要局面へ移動する場合はカードへ意図的にScrollした後、入力欄Focusに`preventScroll: true`を使用し、二重Scrollを防ぐ。

## 6. Domain境界

Scroll位置はUI Stateであり、次へ保存しない。

- GameReview
- KeyPosition
- Replay Position Snapshot
- Backup Snapshot
- Markdown Export
- Observation Card

盤面反転状態と同じく、Scroll状態をDomainへ持ち込まない。
