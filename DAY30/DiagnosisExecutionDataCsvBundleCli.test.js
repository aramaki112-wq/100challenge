import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXTERNAL_DATA_CSV_FILE_NAMES,
  buildDiagnosisExecutionDataJsonFiles
} from "./BuildDiagnosisExecutionDataJson.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("CSV File一式を読んでJSON Fileへ出力する", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "day30-external-"));
  for (const fileName of Object.values(EXTERNAL_DATA_CSV_FILE_NAMES)) {
    fs.copyFileSync(path.join(here, fileName), path.join(tempDir, fileName));
  }
  const output = path.join(tempDir, "output.json");
  const result = buildDiagnosisExecutionDataJsonFiles({
    inputDir: tempDir,
    output,
    exportedAt: "2026-08-02T09:30:00+09:00"
  });
  assert.equal(fs.existsSync(output), true);
  assert.equal(JSON.parse(fs.readFileSync(output, "utf8")).items.length, 1);
  assert.equal(result.summary.bucketCount, 1);
});

test("必須CSVがない場合はFile Errorで終了する", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "day30-external-missing-"));
  assert.throws(() => buildDiagnosisExecutionDataJsonFiles({
    inputDir: tempDir,
    output: path.join(tempDir, "output.json")
  }));
});
