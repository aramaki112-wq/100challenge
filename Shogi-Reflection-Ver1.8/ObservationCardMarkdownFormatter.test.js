import test from "node:test";
import assert from "node:assert/strict";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { MARKDOWN_EXPORT_ERROR_CODES, MarkdownExportError } from "./MarkdownExportErrors.js";
import { createGameReview } from "./TestFixtures.js";

const formatter = new ObservationCardMarkdownFormatter();

test("次局用Observation Cardに兆候・Theme・Rule・再発確認を出力する", () => {
  const artifact = formatter.format({
    gameReview: createGameReview().toSnapshot(),
    exportedAt: "2026-08-02T12:00:00+09:00"
  });
  assert.equal(artifact.kind, "OBSERVATION_CARD_MARKDOWN");
  assert.equal(artifact.fileName, "次局用Observation Card-2026-08-02-REV-001.md");
  for (const text of [
    'status: "未検証"',
    "[[将棋対局振り返り-2026-08-02-REV-001]]",
    "## ミスが起きる前の兆候候補",
    "感情の兆候：焦り",
    "判断の兆候：候補手の比較を省略した。",
    "## 兆候の根拠となったFACT",
    "## 次局のObservation Theme",
    "## 次局で守る実行Rule",
    "## 次局後の再発確認",
    "同じ判断Patternが再発した"
  ]) assert.equal(artifact.markdownText.includes(text), true, text);
  assert.equal(artifact.warningSignalCount > 0, true);
});

test("Observation CardはFACTを根拠として別Sectionへ保持する", () => {
  const artifact = formatter.format({
    gameReview: createGameReview().toSnapshot(),
    exportedAt: "2026-08-02T12:00:00+09:00"
  });
  const signalStart = artifact.markdownText.indexOf("## ミスが起きる前の兆候候補");
  const factStart = artifact.markdownText.indexOf("## 兆候の根拠となったFACT");
  assert.equal(signalStart >= 0 && factStart > signalStart, true);
});

test("次局接続条件を満たさないReviewからObservation Cardを作成しない", () => {
  const snapshot = createGameReview({ keyPositions: [], observationTheme: "", actionRules: [] }).toSnapshot();
  assert.throws(
    () => formatter.format({ gameReview: snapshot, exportedAt: "2026-08-02T12:00:00+09:00" }),
    (error) => error instanceof MarkdownExportError &&
      error.code === MARKDOWN_EXPORT_ERROR_CODES.OBSERVATION_CARD_NOT_READY &&
      error.context.missingReflectionItems.length === 3
  );
});
