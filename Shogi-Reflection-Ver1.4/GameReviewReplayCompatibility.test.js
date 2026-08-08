import test from "node:test";
import assert from "node:assert/strict";
import { AddCurrentPositionToKeyPosition } from "./AddCurrentPositionToKeyPosition.js";
import { GameReview } from "./GameReview.js";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { KifParser } from "./KifParser.js";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { createGameReview, createKeyPosition } from "./TestFixtures.js";

const text = replayFixture("replay-basic.kif");
function candidate() {
  const history = new PositionHistoryBuilder().build(new KifParser().parse({ text }));
  const service = new ShogiReplayApplicationService(); service.load(history); service.jump(3);
  return new AddCurrentPositionToKeyPosition().execute({
    replayState: service.getState(), existingKeyPositions: [], sourceGameId: "REV-COMPAT", sourceKifText: text
  }).candidate;
}
function snapshotKeyPosition() {
  return { ...candidate(), title: "角交換", fact: "角を取った。", interpretation: "攻めが続くと思った。", hypothesis: "守りを優先できた可能性がある。" };
}
function reviewWithSnapshot() {
  return createGameReview({ reviewId: "REV-COMPAT", kifuText: text, keyPositions: [
    snapshotKeyPosition(), createKeyPosition(2, 4), createKeyPosition(3, 5)
  ] });
}

test("SnapshotなしKeyPositionを持つ旧GameReviewを読める", () => assert.equal(createGameReview().keyPositions[0].replayReference, null));
test("Snapshot付きKeyPositionをGameReviewへ保持できる", () => assert.ok(reviewWithSnapshot().keyPositions[0].replayReference));
test("Snapshot付きKeyPositionを保存できる", () => {
  const repo = new InMemoryGameReviewRepository(); repo.save(reviewWithSnapshot());
  assert.ok(repo.findById("REV-COMPAT").keyPositions[0].replayReference);
});
test("Snapshot付きKeyPositionをPersistent JSONへ出力できる", () => {
  const repo = new InMemoryGameReviewRepository(); repo.save(reviewWithSnapshot());
  assert.match(new GameReviewSnapshotService({ repository: repo }).createJson(), /sourceKifFingerprint/);
});
test("Snapshot付きKeyPositionを再読込できる", () => {
  const source = new InMemoryGameReviewRepository(); source.save(reviewWithSnapshot());
  const json = new GameReviewSnapshotService({ repository: source }).createJson();
  const target = new InMemoryGameReviewRepository(); new GameReviewSnapshotService({ repository: target }).restoreJson(json);
  assert.equal(target.findById("REV-COMPAT").keyPositions[0].replayReference.moveNumber, 3);
});
test("Backup Restore後もSnapshotを維持できる", () => {
  const source = new InMemoryGameReviewRepository(); source.save(reviewWithSnapshot());
  const snapshot = new GameReviewSnapshotService({ repository: source }).createSnapshot();
  const target = new InMemoryGameReviewRepository(); new GameReviewSnapshotService({ repository: target }).restoreSnapshot(snapshot);
  assert.deepEqual(target.findById("REV-COMPAT").keyPositions[0].replayReference.toSnapshot(), reviewWithSnapshot().keyPositions[0].replayReference.toSnapshot());
});
test("Atomic Restoreを維持できる", () => {
  const target = new InMemoryGameReviewRepository(); target.save(createGameReview({ reviewId: "CURRENT" }));
  const source = new InMemoryGameReviewRepository(); source.save(reviewWithSnapshot());
  const broken = structuredClone(new GameReviewSnapshotService({ repository: source }).createSnapshot());
  broken.gameReviews[0].keyPositions[0].replayReference.snapshot.currentPosition.sideToMove = "INVALID";
  assert.throws(() => new GameReviewSnapshotService({ repository: target }).restoreSnapshot(broken));
  assert.equal(target.existsById("CURRENT"), true);
});
test("不正Snapshotで現在の全GameReviewを失わない", () => {
  const target = new InMemoryGameReviewRepository(); target.save(createGameReview({ reviewId: "SAFE" }));
  const broken = { applicationId: "SHOGI_REFLECTION_INTERLUDE", schemaVersion: 1, exportedAt: new Date().toISOString(), repositoryRevision: 1,
    gameReviews: [{ ...createGameReview({ reviewId: "BROKEN" }).toSnapshot(), keyPositions: [{ ...createKeyPosition(1), replayReference: { broken: true } }], actionRules: [] }] };
  assert.throws(() => new GameReviewSnapshotService({ repository: target }).restoreSnapshot(broken));
  assert.equal(target.findAll().length, 1);
});
test("旧Schema Version 1を維持する", () => {
  const repo = new InMemoryGameReviewRepository(); repo.save(reviewWithSnapshot());
  assert.equal(new GameReviewSnapshotService({ repository: repo }).createSnapshot().schemaVersion, 1);
});
test("Markdown Exportに既存情報が欠落しない", () => {
  const md = new GameReviewMarkdownFormatter().format({ gameReview: reviewWithSnapshot().toSnapshot(), exportedAt: new Date().toISOString() }).markdownText;
  assert.match(md, /対局の物語/); assert.match(md, /FACT/); assert.match(md, /Replay Snapshot：あり/);
});
test("Observation Cardを維持できる", () => {
  const md = new ObservationCardMarkdownFormatter().format({ gameReview: reviewWithSnapshot().toSnapshot(), exportedAt: new Date().toISOString() }).markdownText;
  assert.match(md, /次局のObservation Theme/);
});
test("重要局面3〜5件Ruleを維持できる", () => assert.equal(reviewWithSnapshot().isReadyForNextGame(), true));
test("重要局面6件Ruleを維持できる", () => assert.throws(() => new GameReview({ ...reviewWithSnapshot().toSnapshot(), keyPositions: [1,2,3,4,5,6].map((n) => createKeyPosition(n, n)) })));
test("Snapshotなし旧DataをJSON Restoreできる", () => {
  const source = new InMemoryGameReviewRepository(); source.save(createGameReview());
  const target = new InMemoryGameReviewRepository(); new GameReviewSnapshotService({ repository: target }).restoreJson(new GameReviewSnapshotService({ repository: source }).createJson());
  assert.equal(target.findAll()[0].keyPositions[0].replayReference, null);
});
