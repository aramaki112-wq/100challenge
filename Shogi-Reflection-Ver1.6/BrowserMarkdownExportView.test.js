import test from "node:test";
import assert from "node:assert/strict";
import { BrowserMarkdownExportView } from "./BrowserMarkdownExportView.js";

function setup() {
  const elements = {
    "markdown-export-panel": { hidden: true, dataset: {}, scrollIntoView() {} },
    "markdown-export-heading": { textContent: "" },
    "markdown-export-description": { textContent: "" },
    "markdown-preview": { value: "" },
    "copy-markdown": { disabled: true },
    "download-markdown": { disabled: true }
  };
  return { elements, view: new BrowserMarkdownExportView({ documentObject: { getElementById: (id) => elements[id] ?? null } }) };
}

test("Markdown ArtifactをPreviewしCopy・Downloadを有効化する", () => {
  const { elements, view } = setup();
  view.renderArtifact({ kind: "OBSERVATION_CARD_MARKDOWN", title: "Card", fileName: "card.md", markdownText: "# Card" });
  assert.equal(elements["markdown-export-panel"].hidden, false);
  assert.equal(elements["markdown-preview"].value, "# Card");
  assert.equal(elements["copy-markdown"].disabled, false);
  assert.equal(elements["download-markdown"].disabled, false);
});

test("PreviewをClearすると誤操作できない状態へ戻す", () => {
  const { elements, view } = setup();
  view.renderArtifact({ kind: "GAME_REVIEW_MARKDOWN", title: "Review", fileName: "review.md", markdownText: "# Review" });
  view.clear();
  assert.equal(elements["markdown-export-panel"].hidden, true);
  assert.equal(elements["markdown-preview"].value, "");
  assert.equal(elements["copy-markdown"].disabled, true);
});
