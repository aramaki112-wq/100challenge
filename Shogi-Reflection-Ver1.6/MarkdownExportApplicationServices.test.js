import test from "node:test";
import assert from "node:assert/strict";
import { ExportGameReviewAsMarkdown } from "./ExportGameReviewAsMarkdown.js";
import { ExportObservationCardAsMarkdown } from "./ExportObservationCardAsMarkdown.js";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { GetGameReview } from "./GetGameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { FixedClock, createGameReview } from "./TestFixtures.js";

function setup() {
  const repository = new InMemoryGameReviewRepository();
  repository.save(createGameReview());
  const getGameReview = new GetGameReview({ repository });
  return {
    review: new ExportGameReviewAsMarkdown({ getGameReview, formatter: new GameReviewMarkdownFormatter(), clock: new FixedClock() }),
    card: new ExportObservationCardAsMarkdown({ getGameReview, formatter: new ObservationCardMarkdownFormatter(), clock: new FixedClock() })
  };
}

test("保存済みReview IDから振り返りMarkdownを作成する", () => {
  const { review } = setup();
  const artifact = review.execute({ reviewId: "REV-001" });
  assert.equal(artifact.sourceReviewId, "REV-001");
  assert.match(artifact.markdownText, /exported_at: "2026-08-02T03:00:00.000Z"/);
});

test("保存済みReview IDからObservation Cardを作成する", () => {
  const { card } = setup();
  const artifact = card.execute({ reviewId: "REV-001" });
  assert.equal(artifact.sourceReviewId, "REV-001");
  assert.equal(artifact.kind, "OBSERVATION_CARD_MARKDOWN");
});

test("存在しないReview IDは既存GetGameReview Errorを維持する", () => {
  const { review } = setup();
  assert.throws(() => review.execute({ reviewId: "NOT-FOUND" }), /見つかりません/);
});
