# SOURCE OF TRUTH AUDIT — Ver.1.3.1

## Source of Truth

- Source ZIP: `Shogi-Reflection-Ver1.3.zip`
- Source version: Ver.1.3
- Source File count: 199
- SHA-256 baseline: `SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json`
- Hotfix purpose: Smartphone KIF Clipboard / Paste input

## Audit result

- Ver.1.3 source files: 199
- Ver.1.3.1 current files: 208
- Hash unchanged Ver.1.3 files: 178
- Intentionally modified Ver.1.3 files: 21
- Added Ver.1.3.1 files: 9
- Deleted Ver.1.3 files: 0
- Missing Import: 0
- Ver.1.3 Automated Test inheritance: 458 / 458 passed
- Ver.1.3.1 total Automated Test: 471 / 471 passed
- Chromium verification: 133 / 133 passed

## Intentionally modified Ver.1.3 files

- `00_README_FIRST.md`
- `BROWSER_VERIFICATION_RESULT.txt`
- `BROWSER_VERIFICATION_SCREENSHOT.png`
- `BrowserKifImportMarkup.test.js`
- `BrowserKifImportView.js`
- `CHANGELOG.md`
- `FILE_INVENTORY.txt`
- `KifImportController.js`
- `KifImportController.test.js`
- `KifImportErrorPresenter.js`
- `KifImportErrors.js`
- `README.md`
- `STATIC_VERIFICATION_RESULT.txt`
- `SYNTAX_CHECK_RESULT.txt`
- `TEST_RESULT.txt`
- `browser_verify.py`
- `index.html`
- `main.js`
- `package.json`
- `style.css`
- `verify.mjs`

## Added files

- `BrowserKifClipboardAdapter.js`
- `BrowserKifClipboardAdapter.test.js`
- `COMPLETION_REPORT_V1_3_1.md`
- `KifPastedTextAdapter.js`
- `KifPastedTextAdapter.test.js`
- `SOURCE_OF_TRUTH_AUDIT_V1_3_1.md`
- `SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json`
- `VER1_3_1_CHANGE_MANIFEST.json`
- `Ver.1.3.1操作手順書.md`

## Deleted files

None

## Compatibility decision

Ver.1.3のGameReview、KeyPosition、ReplayPositionSnapshot、Repository、LocalStorage、Backup／Restore、Markdown Export、Observation CardのDomain構造は、スマホ貼り付け対応のために再構成していません。貼り付けKIFはUTF-8のFile-like入力へ変換し、既存`KifFileReaderAdapter` → `KifParser` → Import Preview → Form反映を通します。

Clipboard APIを利用できないBrowserでもTextareaへのOS標準Pasteを利用できるため、Clipboard権限をアプリ利用の必須条件にはしていません。
