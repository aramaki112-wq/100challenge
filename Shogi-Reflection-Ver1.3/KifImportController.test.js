import test from "node:test";
import assert from "node:assert/strict";
import { KifFileReaderAdapter } from "./KifFileReaderAdapter.js";
import { KifImportApplicationService } from "./KifImportApplicationService.js";
import { KifImportController } from "./KifImportController.js";
import { KifImportFormMapper } from "./KifImportFormMapper.js";
import { KifImportPreviewPresenter } from "./KifImportPreviewPresenter.js";
import { KifParser } from "./KifParser.js";
import { PiyoShogiCompatibility } from "./PiyoShogiCompatibility.js";
import { SHOGI_SIDE } from "./GameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import {
  createFileLike,
  fixtureBytes
} from "./KifTestHelpers.js";

function createController() {
  return new KifImportController({
    importService: new KifImportApplicationService({
      fileReader: new KifFileReaderAdapter(),
      parser: new KifParser(),
      compatibility: new PiyoShogiCompatibility(),
      previewPresenter: new KifImportPreviewPresenter()
    }),
    formMapper: new KifImportFormMapper()
  });
}

function validFile() {
  return createFileLike("normal.kifu", fixtureBytes("normal-resign-utf8.kifu"));
}

test("File選択でPreviewを準備できる", async () => {
  const controller = createController();
  const result = await controller.selectFile({ file: validFile() });
  assert.equal(result.status, "PREVIEW_READY");
  assert.equal(controller.hasPendingPreview, true);
});

test("Import中止時にFormを変更しない", async () => {
  const controller = createController();
  const form = { gameStory: "維持" };
  await controller.selectFile({ file: validFile() });
  const result = controller.cancel();
  assert.equal(result.status, "IMPORT_CANCELLED");
  assert.deepEqual(form, { gameStory: "維持" });
});

test("Import失敗時に現在Formを保持する", async () => {
  const controller = createController();
  const form = { gameStory: "維持" };
  await assert.rejects(() => controller.selectFile({
    file: createFileLike("broken.kifu", fixtureBytes("broken-move.kifu"))
  }));
  assert.deepEqual(form, { gameStory: "維持" });
  assert.equal(controller.hasPendingPreview, false);
});

test("Preview確認後にFormへ反映できる", async () => {
  const controller = createController();
  await controller.selectFile({ file: validFile() });
  const result = controller.applyToForm({
    currentForm: { side: SHOGI_SIDE.SENTE, gameStory: "維持" },
    mySide: SHOGI_SIDE.SENTE
  });
  assert.equal(result.status, "APPLIED_TO_FORM");
  assert.equal(result.form.gameStory, "維持");
  assert.match(result.form.kifuText, /練習対局/);
});

test("Form反映後は同じPreviewを再適用できない", async () => {
  const controller = createController();
  await controller.selectFile({ file: validFile() });
  controller.applyToForm({ currentForm: {}, mySide: SHOGI_SIDE.SENTE });
  assert.throws(() => controller.applyToForm({ currentForm: {}, mySide: SHOGI_SIDE.SENTE }));
});

test("Import成功だけではRepositoryへ保存されない", async () => {
  const repository = new InMemoryGameReviewRepository();
  const controller = createController();
  await controller.selectFile({ file: validFile() });
  controller.applyToForm({ currentForm: {}, mySide: SHOGI_SIDE.SENTE });
  assert.equal(repository.findAll().length, 0);
});

test("Previewがない状態の中止はNO_PREVIEWを返す", () => {
  assert.equal(createController().cancel().status, "NO_PREVIEW");
});
