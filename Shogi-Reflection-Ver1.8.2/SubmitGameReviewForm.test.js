import test from "node:test";
import assert from "node:assert/strict";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { SubmitGameReviewForm } from "./SubmitGameReviewForm.js";
import { FixedClock, MemoryStorage } from "./TestFixtures.js";

function input(overrides = {}) {
  const keyPositions = [1, 2, 3].map((index) => ({
    keyPositionId: `KP-${index}`,
    moveNumber: String(index * 20),
    title: `局面${index}`,
    fact: `事実${index}`,
    interpretation: `解釈${index}`,
    hypothesis: `仮説${index}`
  }));
  return {
    reviewId: "REV-UI-001",
    gameDate: "2026-08-02T12:45",
    side: "SENTE",
    result: "LOSS",
    kifuText: "棋譜Text",
    keyPositions,
    observationTheme: "相手の狙いを見る",
    actionRules: ["王手・取り・侵入を確認する"],
    ...overrides
  };
}

function harness({ storage = new MemoryStorage() } = {}) {
  const repository = new InMemoryGameReviewRepository();
  const clock = new FixedClock("2026-08-02T12:45:00+09:00");
  const snapshotService = new GameReviewSnapshotService({ repository, clock });
  const persistenceCoordinator = new ReflectionPersistenceCoordinator({
    snapshotService,
    snapshotStore: new LocalStorageSnapshotStore({ storage }),
    clock
  });
  const service = new SubmitGameReviewForm({
    mapper: new GameReviewFormMapper(),
    saveGameReview: new SaveGameReview({ repository }),
    persistenceCoordinator
  });
  return { repository, storage, service };
}

test("有効な入力をDomainへ変換しRepositoryとBrowserへ保存する", () => {
  const { repository, storage, service } = harness();
  const result = service.execute({ input: input() });
  assert.equal(result.status, "SAVED");
  assert.equal(result.saveStatus, "CREATED");
  assert.equal(result.gameReview.readyForNextGame, true);
  assert.equal(repository.existsById("REV-UI-001"), true);
  assert.equal(storage.map.size, 1);
  assert.equal(Object.isFrozen(result), true);
});

test("同じReview IDを送信すると更新として保存する", () => {
  const { repository, service } = harness();
  service.execute({ input: input() });
  const result = service.execute({ input: input({ note: "更新" }) });
  assert.equal(result.saveStatus, "UPDATED");
  assert.equal(result.repositoryRevision, 2);
  assert.equal(repository.findById("REV-UI-001").note, "更新");
});

test("Domain Rule違反の入力はRepositoryを変更せずREJECTEDを返す", () => {
  const { repository, service } = harness();
  const result = service.execute({ input: input({ kifuText: "" }) });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.errorCode, "INVALID_KIFU_TEXT");
  assert.equal(repository.findAll().length, 0);
  assert.equal(repository.getRevision(), 0);
});

test("Browser保存失敗時もRepositoryのDomain Dataを保持する", () => {
  const failingStorage = { setItem() { throw new Error("quota exceeded"); }, getItem() { return null; }, removeItem() {} };
  const { repository, service } = harness({ storage: failingStorage });
  const result = service.execute({ input: input() });
  assert.equal(result.status, "SAVED_IN_MEMORY_ONLY");
  assert.equal(result.persistenceErrorCode, "LOCAL_STORAGE_SAVE_FAILED");
  assert.equal(repository.existsById("REV-UI-001"), true);
});

test("次局接続条件を満たさない振り返りも保存し不足項目を返す", () => {
  const { service } = harness();
  const result = service.execute({ input: input({ keyPositions: [input().keyPositions[0]], observationTheme: "", actionRules: [] }) });
  assert.equal(result.status, "SAVED");
  assert.equal(result.gameReview.readyForNextGame, false);
  assert.deepEqual(result.gameReview.missingReflectionItems, ["KEY_POSITIONS", "OBSERVATION_THEME", "ACTION_RULES"]);
});
