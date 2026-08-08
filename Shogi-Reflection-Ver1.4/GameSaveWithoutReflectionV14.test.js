import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { GAME_REVIEW_SAVE_INTENT, SubmitGameReviewForm } from "./SubmitGameReviewForm.js";
import { FixedClock, MemoryStorage } from "./TestFixtures.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function harness() {
  const repository = new InMemoryGameReviewRepository();
  const storage = new MemoryStorage();
  const clock = new FixedClock("2026-08-08T19:00:00+09:00");
  const persistenceCoordinator = new ReflectionPersistenceCoordinator({
    snapshotService: new GameReviewSnapshotService({ repository, clock }),
    snapshotStore: new LocalStorageSnapshotStore({ storage }),
    clock
  });
  return {
    repository,
    storage,
    service: new SubmitGameReviewForm({
      mapper: new GameReviewFormMapper(),
      saveGameReview: new SaveGameReview({ repository, clock }),
      persistenceCoordinator
    })
  };
}

function gameOnlyInput(overrides = {}) {
  return {
    reviewId: "REV-V14-GAME-ONLY",
    gameDate: "2026-08-08T18:30",
    side: "SENTE",
    result: "LOSS",
    opponentName: "対局相手",
    timeControl: "10分切れ負け",
    kifuText: replayFixture("replay-basic.kif"),
    gameStory: "",
    keyPositions: [],
    decisionPattern: "",
    observationTheme: "",
    actionRules: [],
    note: "大会メモだけは残す",
    ...overrides
  };
}

test("KIFだけで対局を保存できる", () => {
  const { service } = harness();
  const result = service.execute({ input: gameOnlyInput(), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  assert.equal(result.status, "SAVED");
  assert.equal(result.gameReview.workflowStatus, "GAME_ONLY");
});

test("重要局面0件でも棋譜保存できる", () => {
  const { service } = harness();
  const result = service.execute({ input: gameOnlyInput({ keyPositions: [] }), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  assert.equal(result.status, "SAVED");
  assert.equal(result.gameReview.keyPositions.length, 0);
});

test("Observation Themeなしでも棋譜保存できる", () => {
  const { service } = harness();
  const result = service.execute({ input: gameOnlyInput({ observationTheme: "" }), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  assert.equal(result.status, "SAVED");
});

test("実行Ruleなしでも棋譜保存できる", () => {
  const { service } = harness();
  const result = service.execute({ input: gameOnlyInput({ actionRules: [] }), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  assert.equal(result.status, "SAVED");
});

test("対局情報の自由メモだけでは振り返り中へ進めない", () => {
  const { service } = harness();
  const result = service.execute({ input: gameOnlyInput({ note: "大会会場メモ" }), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  assert.equal(result.gameReview.workflowStatus, "GAME_ONLY");
});

test("棋譜保存後にRepositoryから再読込できる", () => {
  const { service, repository } = harness();
  service.execute({ input: gameOnlyInput(), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  const restored = repository.findById("REV-V14-GAME-ONLY");
  assert.equal(restored.kifuText.includes("手数----指手"), true);
  assert.equal(restored.workflowStatus, "GAME_ONLY");
});

test("棋譜保存時に作成日時と更新日時を記録する", () => {
  const { service } = harness();
  const result = service.execute({ input: gameOnlyInput(), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  assert.equal(result.gameReview.createdAt, "2026-08-08T10:00:00.000Z");
  assert.equal(result.gameReview.updatedAt, "2026-08-08T10:00:00.000Z");
});

test("保存した棋譜は既存Replay Serviceで再現できる", () => {
  const { service, repository } = harness();
  service.execute({ input: gameOnlyInput(), intent: GAME_REVIEW_SAVE_INTENT.SAVE_GAME });
  const saved = repository.findById("REV-V14-GAME-ONLY");
  const parsed = new KifParser().parse({ text: saved.kifuText });
  const history = new PositionHistoryBuilder().build(parsed);
  const replay = new ShogiReplayApplicationService();
  replay.load(history);
  assert.equal(replay.next().currentMoveNumber, 1);
  assert.equal(replay.last().currentMoveNumber, history.maxMoveNumber);
});
