import test from "node:test";
import assert from "node:assert/strict";
import { MarkdownExportController } from "./MarkdownExportController.js";

const artifact = Object.freeze({ kind: "OBSERVATION_CARD_MARKDOWN", fileName: "card.md", markdownText: "# Card" });

function createController() {
  const calls = { copied: "", downloaded: null };
  return {
    calls,
    controller: new MarkdownExportController({
      reviewExporter: { execute: ({ reviewId }) => ({ ...artifact, kind: "GAME_REVIEW_MARKDOWN", sourceReviewId: reviewId }) },
      observationCardExporter: { execute: ({ reviewId }) => ({ ...artifact, sourceReviewId: reviewId }) },
      clipboardAdapter: { writeText: async (text) => { calls.copied = text; return { status: "COPIED", characterCount: text.length }; } },
      fileAdapter: { downloadText: (input) => { calls.downloaded = input; return { status: "DOWNLOADED", fileName: input.fileName }; } }
    })
  };
}

test("Controllerから二種類のMarkdownを作成する", () => {
  const { controller } = createController();
  assert.equal(controller.createGameReviewMarkdown({ reviewId: "R1" }).kind, "GAME_REVIEW_MARKDOWN");
  assert.equal(controller.createObservationCardMarkdown({ reviewId: "R1" }).kind, "OBSERVATION_CARD_MARKDOWN");
});

test("Preview済みArtifactをClipboardへCopyする", async () => {
  const { controller, calls } = createController();
  const result = await controller.copy({ artifact });
  assert.equal(calls.copied, "# Card");
  assert.equal(result.fileName, "card.md");
});

test("Preview済みArtifactをMarkdown MIMEでDownloadする", () => {
  const { controller, calls } = createController();
  const result = controller.download({ artifact });
  assert.equal(calls.downloaded.mimeType, "text/markdown");
  assert.equal(result.status, "DOWNLOADED");
});
