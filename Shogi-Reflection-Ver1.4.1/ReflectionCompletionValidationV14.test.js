import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { GAME_REVIEW_SAVE_INTENT, SubmitGameReviewForm } from "./SubmitGameReviewForm.js";
import { FixedClock, MemoryStorage, createKeyPosition } from "./TestFixtures.js";

function setup() {
  const repository = new InMemoryGameReviewRepository();
  const clock = new FixedClock("2026-08-08T19:00:00+09:00");
  const coordinator = new ReflectionPersistenceCoordinator({
    snapshotService: new GameReviewSnapshotService({ repository, clock }),
    snapshotStore: new LocalStorageSnapshotStore({ storage: new MemoryStorage() }),
    clock
  });
  return new SubmitGameReviewForm({
    mapper: new GameReviewFormMapper(),
    saveGameReview: new SaveGameReview({ repository, clock }),
    persistenceCoordinator: coordinator
  });
}

function input(overrides = {}) {
  return {
    reviewId: "REV-V14-COMPLETE",
    gameDate: "2026-08-08T18:00",
    side: "GOTE",
    result: "WIN",
    kifuText: "開始日時：2026/08/08\n手数----指手---------\n1 ７六歩(77)",
    gameStory: "中盤で受けを選んだ。",
    keyPositions: [createKeyPosition(1, 10), createKeyPosition(2, 20), createKeyPosition(3, 30)],
    decisionPattern: "攻め急がない。",
    observationTheme: "相手の次の一手を言葉にする",
    actionRules: ["王手・取り・侵入を確認する"],
    note: "",
    ...overrides
  };
}

test("棋譜保存と振り返り完了は別Intentである", () => {
  assert.notEqual(GAME_REVIEW_SAVE_INTENT.SAVE_GAME, GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION);
});

test("振り返り途中保存では既存完成条件を要求しない", () => {
  const result = setup().execute({
    input: input({ keyPositions: [createKeyPosition(1, 10)], observationTheme: "", actionRules: [] }),
    intent: GAME_REVIEW_SAVE_INTENT.SAVE_REFLECTION_DRAFT
  });
  assert.equal(result.status, "SAVED");
  assert.equal(result.gameReview.workflowStatus, "REFLECTION_IN_PROGRESS");
});

test("重要局面3件未満では振り返り完了できない", () => {
  const result = setup().execute({ input: input({ keyPositions: [createKeyPosition(1, 10)] }), intent: GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.errorCode, "REFLECTION_NOT_READY_FOR_COMPLETION");
  assert.ok(result.context.missingReflectionItems.includes("KEY_POSITIONS"));
});

test("Observation Themeなしでは振り返り完了できない", () => {
  const result = setup().execute({ input: input({ observationTheme: "" }), intent: GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION });
  assert.equal(result.status, "REJECTED");
  assert.ok(result.context.missingReflectionItems.includes("OBSERVATION_THEME"));
});

test("実行Ruleなしでは振り返り完了できない", () => {
  const result = setup().execute({ input: input({ actionRules: [] }), intent: GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION });
  assert.equal(result.status, "REJECTED");
  assert.ok(result.context.missingReflectionItems.includes("ACTION_RULES"));
});

test("重要局面3〜5件・Theme1件・Rule1〜3件で完了できる", () => {
  const result = setup().execute({ input: input(), intent: GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION });
  assert.equal(result.status, "SAVED");
  assert.equal(result.gameReview.workflowStatus, "REFLECTION_COMPLETE");
  assert.equal(result.gameReview.reflectionComplete, true);
  assert.equal(result.gameReview.readyForNextGame, true);
});
