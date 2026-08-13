# 00_README_FIRST.md — Shogi Reflection Ver.1.8.3

このFolderは、Shogi Reflection Ver.1.8.3 のSource of Truthです。

## 最初に読む順序

1. `README.md`
2. `Ver.1.8操作手順書.md`
3. `FORMAL_COMPLETION_STATUS.md`
4. `RUN36_FINAL_FORMAL_RELEASE_README.md`
5. `ENGINE_INTEGRATION_DESIGN.md`
6. `ENGINE_LICENSE_AUDIT.md`
7. `ENGINE_SOURCE_DISTRIBUTION_PLAN.md`
8. `DISTRIBUTION_LICENSE_CHECKLIST.md`
9. `THIRD_PARTY_NOTICES.md`
10. `SOURCE_OF_TRUTH_AUDIT.md`
11. `COMPLETION_REPORT.md`

## 起動

```bash
python3 -m http.server 8000
```

## Test

```bash
npm test
python3 browser_verify.py
npm run check
```

## Real Engine と Run #36

通常のSource checkoutではReal YaneuraOu runtimeを同梱せず、fail-closedです。
Run #36 `YaneuraOu Final Formal Release` workflowだけが、固定された非診断Formal Buildを再生成し、`RUN36_FORMAL_RELEASE_LOCK.json` の4つのSHA-256と完全一致した場合に限り、正式名 `Shogi-Reflection-Ver1.8.3.zip` を発行します。

Legacy Diagnostic workflowは診断専用で、Formal Release判定には使用しません。

**LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION.**
