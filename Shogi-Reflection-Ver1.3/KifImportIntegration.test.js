import test from "node:test";
import assert from "node:assert/strict";
import { BrowserFileAdapter } from "./BrowserFileAdapter.js";
import { ExportGameReviewAsMarkdown } from "./ExportGameReviewAsMarkdown.js";
import { ExportObservationCardAsMarkdown } from "./ExportObservationCardAsMarkdown.js";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewLibraryPresenter } from "./GameReviewLibraryPresenter.js";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { GetGameReview } from "./GetGameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { KifImportFormMapper } from "./KifImportFormMapper.js";
import { KifParser } from "./KifParser.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { SubmitGameReviewForm } from "./SubmitGameReviewForm.js";
import {
  createKeyPosition,
  FixedClock,
  MemoryStorage
} from "./TestFixtures.js";
import { fixtureText } from "./KifTestHelpers.js";
import { SHOGI_SIDE } from "./GameReview.js";

function importedCompleteInput() {
  const dto = new KifParser().parse({
    text: fixtureText("normal-resign-utf8.kifu"),
    sourceFileName: "normal-resign-utf8.kifu",
    encoding: "utf-8"
  });
  const currentForm = {
    reviewId: "REV-KIF-001",
    gameDate: "2026-08-01T09:00",
    side: SHOGI_SIDE.SENTE,
    result: "UNKNOWN",
    opponentName: "",
    timeControl: "",
    kifuText: "入力前",
    gameStory: "序盤から相手の反撃を確認せず攻めを急いだ。",
    keyPositions: [
      createKeyPosition(1, 3),
      createKeyPosition(2, 5),
      createKeyPosition(3, 7)
    ],
    decisionPattern: "攻めが見えると確認を省略する。",
    observationTheme: "攻める前に相手の狙いを言葉にする。",
    actionRules: ["候補手を二つ出す。"],
    note: "人間のMemo"
  };
  return new KifImportFormMapper().apply({
    currentForm,
    dto,
    mySide: SHOGI_SIDE.SENTE
  }).form;
}

function createSaveEnvironment() {
  const repository = new InMemoryGameReviewRepository();
  const storage = new MemoryStorage();
  const snapshotService = new GameReviewSnapshotService({
    repository,
    clock: new FixedClock("2026-08-02T12:00:00+09:00")
  });
  const persistenceCoordinator = new ReflectionPersistenceCoordinator({
    snapshotService,
    snapshotStore: new LocalStorageSnapshotStore({ storage }),
    clock: new FixedClock("2026-08-02T12:00:00+09:00")
  });
  const submit = new SubmitGameReviewForm({
    mapper: new GameReviewFormMapper(),
    saveGameReview: new SaveGameReview({ repository }),
    persistenceCoordinator
  });
  return { repository, storage, submit };
}

test("Form確認後にGameReviewとして保存できる", () => {
  const { repository, submit } = createSaveEnvironment();
  const result = submit.execute({ input: importedCompleteInput() });
  assert.equal(result.status, "SAVED");
  assert.equal(repository.findAll().length, 1);
});

test("保存後にLocalStorageへ反映される", () => {
  const { storage, submit } = createSaveEnvironment();
  submit.execute({ input: importedCompleteInput() });
  assert.equal(storage.map.size, 1);
});

test("Importした棋譜が一覧・詳細に表示される", () => {
  const { repository, submit } = createSaveEnvironment();
  submit.execute({ input: importedCompleteInput() });
  const snapshot = repository.findAll()[0].toSnapshot();
  const presenter = new GameReviewLibraryPresenter();
  const list = presenter.presentList([snapshot]);
  const detail = presenter.presentDetail(snapshot);
  assert.equal(list.count, 1);
  assert.match(detail.kifuText, /練習対局/);
});

test("Markdown ExportにImportした棋譜が欠落しない", () => {
  const { repository, submit } = createSaveEnvironment();
  submit.execute({ input: importedCompleteInput() });
  const exporter = new ExportGameReviewAsMarkdown({
    getGameReview: new GetGameReview({ repository }),
    formatter: new GameReviewMarkdownFormatter(),
    clock: new FixedClock("2026-08-02T12:00:00+09:00")
  });
  const artifact = exporter.execute({ reviewId: "REV-KIF-001" });
  assert.match(artifact.markdownText, /# ---- Kifu for Windows V7/);
  assert.match(artifact.markdownText, /まで7手で先手の勝ち/);
});

test("Observation Cardの既存動作を壊さない", () => {
  const { repository, submit } = createSaveEnvironment();
  submit.execute({ input: importedCompleteInput() });
  const exporter = new ExportObservationCardAsMarkdown({
    getGameReview: new GetGameReview({ repository }),
    formatter: new ObservationCardMarkdownFormatter(),
    clock: new FixedClock("2026-08-02T12:00:00+09:00")
  });
  const artifact = exporter.execute({ reviewId: "REV-KIF-001" });
  assert.match(artifact.markdownText, /次局用Observation Card/);
  assert.match(artifact.markdownText, /攻める前に相手の狙い/);
});

test("Domain Constructorを通すため不正な振り返りは保存拒否される", () => {
  const { repository, submit } = createSaveEnvironment();
  const input = importedCompleteInput();
  const invalid = { ...input, reviewId: "" };
  const result = submit.execute({ input: invalid });
  assert.equal(result.status, "REJECTED");
  assert.equal(repository.findAll().length, 0);
});

test("BrowserFileAdapterの既存Text読込Contractを維持する", async () => {
  const adapter = new BrowserFileAdapter();
  const text = await adapter.readText({ text: async () => "backup" });
  assert.equal(text, "backup");
});
