import test from "node:test";
import assert from "node:assert/strict";
import { KifImportDraftResetController } from "./KifImportDraftResetController.js";

function createFixture({ pending = true } = {}) {
  const calls = [];
  const importController = {
    cancel() {
      calls.push("cancel-preview");
      const status = pending ? "IMPORT_CANCELLED" : "NO_PREVIEW";
      pending = false;
      return Object.freeze({ status });
    }
  };
  const view = {
    pastedText: "KIF-TEMPORARY-TEXT",
    previewVisible: pending,
    clearInput(message) {
      calls.push("clear-input");
      this.pastedText = "";
      this.previewVisible = false;
      this.message = message;
    },
    resetPreview(message, options) {
      calls.push("reset-preview");
      this.previewVisible = false;
      this.message = message;
      this.options = options;
    }
  };
  return { calls, importController, view };
}

test("KIF入力Clearは一時入力とPreviewだけを破棄する", () => {
  const fixture = createFixture();
  const controller = new KifImportDraftResetController(fixture);
  const result = controller.clearInput();

  assert.equal(result.status, "KIF_INPUT_CLEARED");
  assert.equal(result.previewStatus, "IMPORT_CANCELLED");
  assert.equal(fixture.view.pastedText, "");
  assert.equal(fixture.view.previewVisible, false);
  assert.deepEqual(fixture.calls, ["cancel-preview", "clear-input"]);
  assert.match(fixture.view.message, /保存済み対局/);
  assert.match(fixture.view.message, /クリップボード/);
});

test("読み込みやり直しはPreviewだけを破棄してKIF入力を保持する", () => {
  const fixture = createFixture();
  const controller = new KifImportDraftResetController(fixture);
  const before = fixture.view.pastedText;
  const result = controller.retryInput();

  assert.equal(result.status, "KIF_IMPORT_RETRY_READY");
  assert.equal(fixture.view.previewVisible, false);
  assert.equal(fixture.view.pastedText, before);
  assert.equal(fixture.view.options.focusInput, true);
  assert.deepEqual(fixture.calls, ["cancel-preview", "reset-preview"]);
});

test("KIF ClearはRepository・LocalStorage・Clipboardへ副作用を持たない", () => {
  const fixture = createFixture();
  const repositoryState = [{ reviewId: "SAVED-001" }];
  const localStorageState = { "shogi-reflection-interlude.game-reviews.v1": "SAVED-SNAPSHOT" };
  const clipboardState = { text: "CLIPBOARD-KIF" };

  const repositoryBefore = structuredClone(repositoryState);
  const storageBefore = structuredClone(localStorageState);
  const clipboardBefore = structuredClone(clipboardState);

  new KifImportDraftResetController(fixture).clearInput();

  assert.deepEqual(repositoryState, repositoryBefore);
  assert.deepEqual(localStorageState, storageBefore);
  assert.deepEqual(clipboardState, clipboardBefore);
});

test("Preview後に入力へ戻り別KIFを再Previewできる責務境界を保つ", () => {
  const fixture = createFixture();
  const controller = new KifImportDraftResetController(fixture);
  controller.retryInput();

  fixture.view.pastedText = "DIFFERENT-KIF";
  fixture.view.previewVisible = true;

  assert.equal(fixture.view.pastedText, "DIFFERENT-KIF");
  assert.equal(fixture.view.previewVisible, true);
  assert.deepEqual(fixture.calls, ["cancel-preview", "reset-preview"]);
});
