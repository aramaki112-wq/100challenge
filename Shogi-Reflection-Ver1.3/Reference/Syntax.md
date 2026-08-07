# Reference — Syntax.md

> Interlude Phase2で使用したJavaScript構文。

## Private Field

```js
class Repository {
  #items = new Map();
}
```

Class外部から直接参照できないField。

## `instanceof`

```js
if (!(gameReview instanceof GameReview)) {
  throw new TypeError();
}
```

指定ClassのInstanceか確認する。

## Object Spread

```js
const result = {
  ...restored,
  status: "RESTORED_FROM_BROWSER"
};
```

同名Propertyは後に書いた値が優先される。

## Array Spread

```js
const copy = [...items];
```

配列の浅いCopyを作る。

## `Object.freeze`

```js
Object.freeze(value);
```

Objectの直接変更を禁止する。

## `JSON.stringify`

```js
const jsonText = JSON.stringify(snapshot, null, 2);
```

ObjectをJSON文字列へ変換する。

## `JSON.parse`

```js
const document = JSON.parse(jsonText);
```

JSON文字列を通常Objectへ変換する。

## `Map`

```js
const items = new Map();
items.set(id, value);
items.get(id);
items.has(id);
items.delete(id);
```

KeyとValueを管理するCollection。

## Private Method相当のHelper Function

```js
function requireReviewId(reviewId) {
  // validation
}
```

File内だけで使うValidationをClass外の小さなFunctionへ分ける。

## Error Cause

```js
throw new ApplicationError(code, message, context, { cause: error });
```

上位Errorへ元Errorを関連付ける。

## Phase3追加

```javascript
const data = new FormData(formElement);
const value = data.get("fieldName");
event.preventDefault();
```

```html
<script type="module" src="./main.js"></script>
```

## Phase4追加

```javascript
const button = event.target.closest("[data-edit-review]");
```

```javascript
const sorted = [...items].sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));
```

```javascript
try {
  persist();
} catch (error) {
  restore(beforeSnapshot);
}
```

## Phase5追記

### YAML Frontmatter

```markdown
---
title: "次局用Observation Card"
status: "未検証"
tags:
  - "将棋"
---
```

### Obsidian Wiki Link

```markdown
[[将棋対局振り返り-2026-08-02-REV-001]]
```

### Markdown Checklist

```markdown
- [ ] 実行Ruleを守れた
- [ ] 同じ判断Patternが再発した
```
