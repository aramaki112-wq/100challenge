import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { createGameReview } from "./TestFixtures.js";

const formatter = new GameReviewMarkdownFormatter();

test("GameReview全項目をObsidian向けMarkdownへ変換する", () => {
  const artifact = formatter.format({
    gameReview: createGameReview().toSnapshot(),
    exportedAt: "2026-08-02T12:00:00+09:00"
  });
  assert.equal(artifact.kind, "GAME_REVIEW_MARKDOWN");
  assert.equal(artifact.fileName, "将棋対局振り返り-2026-08-02-REV-001.md");
  for (const text of [
    "# 将棋対局振り返り-2026-08-02-REV-001",
    "[[次局用Observation Card-2026-08-02-REV-001]]",
    "## 対局の物語", "### FACT", "### INTERPRETATION", "### HYPOTHESIS",
    "# 判断Pattern", "# 次局のObservation Theme", "# 次局の実行Rule",
    "開始日時：2026/08/02"
  ]) assert.match(artifact.markdownText, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(Object.isFrozen(artifact), true);
});

test("棋譜内に三連Backtickがあっても壊れないFenceを使う", () => {
  const artifact = formatter.format({
    gameReview: createGameReview({ kifuText: "```\n棋譜" }).toSnapshot(),
    exportedAt: "2026-08-02T12:00:00+09:00"
  });
  assert.match(artifact.markdownText, /````text\n```\n棋譜\n````/);
});

test("File名に使用できない文字を安全な文字へ変換する", () => {
  const artifact = formatter.format({
    gameReview: createGameReview({ reviewId: "REV/001:*?" }).toSnapshot(),
    exportedAt: "2026-08-02T12:00:00+09:00"
  });
  assert.equal(artifact.fileName.includes("/"), false);
  assert.equal(artifact.fileName.includes(":"), false);
});
