# Thought Process.md — Ver.1.4 設計判断記録

> この文書は内部推論の逐語記録ではなく、再利用可能な設計判断と採否理由をまとめる。

## 判断1：新しいGame Entityへ分割しない

候補として「KIFだけのGame」と「完成Reflection」を別Aggregateに分離する案もあった。しかしVer.1.3.3のRepository、Backup、Markdown、KeyPosition参照を大きく変えるため不採用。既存GameReviewへ最小Statusを追加し、Save IntentでCompletion条件を分離した。

## 判断2：Storage Migrationをしない

LocalStorage容量問題は将来存在するが、Ver.1.4の中心はUXでありIndexedDB導入まで広げない。Repository Portを守り、後続VersionでAdapter交換可能な状態を維持した。

## 判断3：Auto Saveを導入しない

Step化と同時にAuto Saveを導入すると、Navigation、Draft、Persistenceの問題を同時に増やす。Ver.1.4は明示Saveを優先した。

## 判断4：SVGを外部File群にせずComponent生成する

駒ごとに画像Fileを増やすより、同じ五角形と文字をInline SVGで生成すると外形統一、2文字調整、成駒Mark、回転、Snapshot共通化が容易になる。

## 判断5：Replay Scroll Policyへ触れない

Page Scroll問題はVer.1.3.2で解決済み。Step化で再設計する理由がないため、`ReplayScrollPolicy.js`はHash一致で保持しBrowser Regressionだけを追加した。
