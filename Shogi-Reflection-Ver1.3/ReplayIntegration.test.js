import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { GetGameReview } from "./GetGameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { KifParser } from "./KifParser.js";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { createGameReview } from "./TestFixtures.js";

const kifText = replayFixture("replay-basic.kif");
const exportedAt = "2026-08-02T12:00:00+09:00";

function createHistory(text = kifText) {
  const parsed = new KifParser().parse({ text });
  return new PositionHistoryBuilder().build(parsed);
}

function createReplayReview(overrides = {}) {
  return createGameReview({
    reviewId: "REV-REPLAY-001",
    kifuText: kifText,
    ...overrides
  });
}

test("KIF Import DTOからPosition Historyを作成できる", () => {
  assert.equal(createHistory().maxMoveNumber, 5);
});

test("Import後に初期局面を表示できる", () => {
  const service = new ShogiReplayApplicationService();
  assert.equal(service.load(createHistory()).position.moveNumber, 0);
});

test("全指し手を最後まで再現できる", () => {
  const service = new ShogiReplayApplicationService();
  service.load(createHistory());
  assert.equal(service.last().position.moveNumber, 5);
});

test("前へ戻った後に再び次へ進める", () => {
  const service = new ShogiReplayApplicationService();
  service.load(createHistory());
  service.last();
  service.previous();
  assert.equal(service.next().position.moveNumber, 5);
});

test("任意手数Jump後のPositionがHistoryと一致する", () => {
  const history = createHistory();
  const service = new ShogiReplayApplicationService();
  service.load(history);
  assert.equal(service.jump(3).position, history.at(3));
});

test("Replay操作だけではRepositoryへ保存されない", () => {
  const repository = new InMemoryGameReviewRepository();
  const revision = repository.getRevision();
  const service = new ShogiReplayApplicationService();
  service.load(createHistory());
  service.last();
  service.first();
  assert.equal(repository.findAll().length, 0);
  assert.equal(repository.getRevision(), revision);
});

test("保存済みGameReviewの棋譜Textから再現できる", () => {
  const repository = new InMemoryGameReviewRepository();
  new SaveGameReview({ repository }).execute({
    gameReview: createReplayReview()
  });
  const saved = new GetGameReview({ repository }).execute({
    reviewId: "REV-REPLAY-001"
  });
  assert.equal(createHistory(saved.gameReview.kifuText).maxMoveNumber, 5);
});

test("保存後にSnapshotから再読込してReplayできる", () => {
  const repository = new InMemoryGameReviewRepository();
  new SaveGameReview({ repository }).execute({
    gameReview: createReplayReview()
  });
  const json = new GameReviewSnapshotService({ repository }).createJson({
    exportedAt
  });

  const restoredRepository = new InMemoryGameReviewRepository();
  new GameReviewSnapshotService({
    repository: restoredRepository
  }).restoreJson(json);
  const saved = restoredRepository.findById("REV-REPLAY-001");
  assert.equal(createHistory(saved.kifuText).status, "FULL");
});

test("Replay後も保存前のGameReview Stateを維持する", () => {
  const review = createReplayReview();
  const before = review.toSnapshot();
  const service = new ShogiReplayApplicationService();
  service.load(createHistory(review.kifuText));
  service.last();
  assert.deepEqual(review.toSnapshot(), before);
});

test("途中Replay失敗でも保存済みGameReviewを変更しない", () => {
  const review = createReplayReview({
    kifuText: replayFixture("replay-partial-invalid.kif")
  });
  const before = review.toSnapshot();
  const history = createHistory(review.kifuText);
  assert.equal(history.status, "PARTIAL");
  assert.deepEqual(review.toSnapshot(), before);
});

test("Markdown Exportに棋譜が欠落しない", () => {
  const artifact = new GameReviewMarkdownFormatter().format({
    gameReview: createReplayReview().toSnapshot(),
    exportedAt
  });
  assert.match(artifact.markdownText, /７六歩\(77\)/);
  assert.match(artifact.markdownText, /５五角打/);
});

test("Observation Cardの既存動作を壊さない", () => {
  const artifact = new ObservationCardMarkdownFormatter().format({
    gameReview: createReplayReview().toSnapshot(),
    exportedAt
  });
  assert.match(artifact.markdownText, /候補手を最低二つ並べる/);
});

test("ReplayでFACT・INTERPRETATION・HYPOTHESISを自動変更しない", () => {
  const review = createReplayReview();
  const before = review.toSnapshot().keyPositions;
  const service = new ShogiReplayApplicationService();
  service.load(createHistory());
  service.jump(3);
  assert.deepEqual(review.toSnapshot().keyPositions, before);
});

test("ReplayでObservation Themeと実行Ruleを自動変更しない", () => {
  const review = createReplayReview();
  const before = review.toSnapshot();
  const service = new ShogiReplayApplicationService();
  service.load(createHistory());
  service.toggleFlip();
  assert.equal(review.observationTheme, before.observationTheme);
  assert.deepEqual(review.actionRules, before.actionRules);
});

test("KIF Parser Warning付きでも再現可能な局面を保持する", () => {
  const warningKif = [
    "手合割：平手",
    "先手：A",
    "後手：B",
    "1 ７六歩(77)"
  ].join("\n");
  const history = createHistory(warningKif);
  assert.equal(history.status, "FULL");
  assert.ok(history.warnings.length >= 1);
});
