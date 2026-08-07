# Phase5 操作手順書

## 1. 目的

Phase5では、保存済みの一局を「読み返す記録」から「次局で使う行動Card」へ変換します。

中心成果物は次の二つです。

- `将棋対局振り返り-YYYY-MM-DD-ReviewID.md`
- `次局用Observation Card-YYYY-MM-DD-ReviewID.md`

## 2. 振り返りMarkdownを作る

1. 保存済み対局一覧から対象局を選択します。
2. 詳細画面の`振り返り.md`を押します。
3. Markdown Previewを確認します。
4. `ClipboardへCopy`または`.mdをDownload`を押します。

振り返りMarkdownには、棋譜、物語、重要局面、FACT、INTERPRETATION、HYPOTHESIS、判断Pattern、Observation Theme、実行Ruleが収録されます。

## 3. 次局用Observation Cardを作る

次の条件を満たすとButtonが有効になります。

- 重要局面が3〜5件
- Observation Themeが1件
- 実行Ruleが1〜3件

条件不足の場合は、詳細画面に残っている項目が表示されます。

1. `次局用Observation Card.md`を押します。
2. Previewで兆候候補とRuleを確認します。
3. `.mdをDownload`します。
4. Obsidian Vaultへ移動します。

## 4. Observation Cardの読み方

### 今回の判断Pattern

同じミスの表面的な指し手ではなく、判断の癖を記録します。

### ミスが起きる前の兆候候補

重要局面に記録した感情、思考、解釈、判断への影響から最大5件を抽出します。これはFACTではなく、次局で観測する候補です。

### 兆候の根拠となったFACT

盤上で実際に起きたことを別Sectionへ保持します。兆候候補と混同しません。

### 次局のObservation Theme

次局中に一つだけ観測する中心Themeです。

### 次局で守る実行Rule

1〜3件の具体的行動です。

### 次局後の再発確認

Checklistを使って、気づけたか、Ruleを守れたか、同じPatternが再発したかを記録します。

## 5. Obsidianへの登録

### Download方式

1. `.mdをDownload`します。
2. Files AppまたはExplorerでFileを確認します。
3. Obsidian Vaultの任意Folderへ移動します。
4. Obsidianで開きます。

### Copy方式

1. `ClipboardへCopy`を押します。
2. Obsidianで新規Noteを作成します。
3. 内容を貼り付けます。
4. Previewに表示されたFile名へNote名を合わせます。

二つのNote名を変更しなければ、相互Wiki Linkがそのまま成立します。

## 6. Error対応

### Observation Card Buttonが押せない

詳細画面の不足案内を確認し、入力Formで不足項目を追加して保存してください。

### ClipboardへCopyできない

Browser権限やHTTPS条件によりClipboard APIが利用できない場合があります。`.mdをDownload`を使用してください。

### Download後に文字化けする

出力はUTF-8です。UTF-8対応EditorまたはObsidianで開いてください。

### Markdownは作れたがApplicationを復元できない

Markdownは人向け成果物です。Applicationの復元にはJSON Backupを使用してください。

## 7. 次局後の運用

1. 対局前にObservation Cardを開く
2. Observation Themeと実行Ruleだけを読む
3. 対局する
4. 対局後にChecklistを更新する
5. 再発条件とRule修正を書く
6. 新しいGameReviewを作成する

これにより、反省を保存するだけでなく、Ruleの有効性を継続的に検証できます。
