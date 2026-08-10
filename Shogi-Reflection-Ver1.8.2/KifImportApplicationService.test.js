import test from "node:test";
import assert from "node:assert/strict";
import { KifFileReaderAdapter } from "./KifFileReaderAdapter.js";
import { KifImportApplicationService } from "./KifImportApplicationService.js";
import { KifImportPreviewPresenter } from "./KifImportPreviewPresenter.js";
import { KifParser } from "./KifParser.js";
import { PiyoShogiCompatibility } from "./PiyoShogiCompatibility.js";
import {
  createFileLike,
  fixtureBytes
} from "./KifTestHelpers.js";

function createService() {
  return new KifImportApplicationService({
    fileReader: new KifFileReaderAdapter(),
    parser: new KifParser(),
    compatibility: new PiyoShogiCompatibility(),
    previewPresenter: new KifImportPreviewPresenter()
  });
}

test("File ReaderからParserへ接続できる", async () => {
  const result = await createService().execute({
    file: createFileLike("normal.kifu", fixtureBytes("normal-resign-utf8.kifu"))
  });
  assert.equal(result.dto.totalMoves, 7);
});

test("Import Previewを作成できる", async () => {
  const result = await createService().execute({
    file: createFileLike("normal.kifu", fixtureBytes("normal-resign-utf8.kifu"))
  });
  assert.equal(result.preview.fileName, "normal.kifu");
  assert.equal(result.preview.senteName, "勇太");
  assert.equal(result.preview.goteName, "ぴよ帝");
  assert.equal(result.preview.totalMoves, 7);
});

test("PreviewにParser Warningを保持する", async () => {
  const result = await createService().execute({
    file: createFileLike("minimal.kifu", fixtureBytes("minimal-warning.kifu"))
  });
  assert.ok(result.preview.warningCount >= 4);
});

test("Previewに読み込んだ棋譜の概要を作成する", async () => {
  const result = await createService().execute({
    file: createFileLike("normal.kifu", fixtureBytes("normal-resign-utf8.kifu"))
  });
  assert.match(result.preview.summary, /1手目/);
  assert.match(result.preview.summary, /7手目/);
});

test("ぴよ将棋CompatibilityをGeneric Parserの外側で識別する", async () => {
  const result = await createService().execute({
    file: createFileLike("piyo.kif", fixtureBytes("piyo-resign-utf8.kif"))
  });
  assert.equal(result.compatibility.source, "PIYO_SHOGI");
  assert.equal(result.dto.sourceFormat, "KIF");
});

test("Generic KIFをぴよ将棋専用扱いしない", async () => {
  const result = await createService().execute({
    file: createFileLike("normal.kifu", fixtureBytes("normal-resign-utf8.kifu"))
  });
  assert.equal(result.compatibility.source, "GENERIC_KIF");
});
