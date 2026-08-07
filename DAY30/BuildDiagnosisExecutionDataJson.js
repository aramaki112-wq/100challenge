#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DiagnosisExecutionDataCsvBundleBuilder } from "./DiagnosisExecutionDataCsvBundleBuilder.js";

export const EXTERNAL_DATA_CSV_FILE_NAMES = Object.freeze({
  settingsCsv: "external-data-settings.csv",
  capacityBucketsCsv: "external-capacity-buckets.csv",
  equipmentsCsv: "external-equipments.csv",
  ordersCsv: "external-orders.csv",
  routingOperationsCsv: "external-routing-operations.csv",
  shiftsCsv: "external-shifts.csv",
  capacityRulesCsv: "external-capacity-rules.csv",
  operationFactoriesCsv: "external-operation-factories.csv",
  revisionsCsv: "external-revisions.csv"
});

function readOptions(argv) {
  const options = {
    inputDir: ".",
    output: "diagnosis-execution-data.json",
    exportedAt: new Date().toISOString()
  };
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    const value = argv[index + 1];
    if (name === "--input-dir" && value) {
      options.inputDir = value;
      index += 1;
    } else if (name === "--output" && value) {
      options.output = value;
      index += 1;
    } else if (name === "--exported-at" && value) {
      options.exportedAt = value;
      index += 1;
    } else if (name === "--help") {
      options.help = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${name}`);
    }
  }
  return options;
}

export function buildDiagnosisExecutionDataJsonFiles({
  inputDir = ".",
  output = "diagnosis-execution-data.json",
  exportedAt = new Date().toISOString()
} = {}) {
  const absoluteInputDir = path.resolve(inputDir);
  const csvBundle = {};
  for (const [property, fileName] of Object.entries(EXTERNAL_DATA_CSV_FILE_NAMES)) {
    const filePath = path.join(absoluteInputDir, fileName);
    csvBundle[property] = fs.readFileSync(filePath, "utf8");
  }
  const result = new DiagnosisExecutionDataCsvBundleBuilder().build({
    ...csvBundle,
    exportedAt
  });
  const outputPath = path.resolve(output);
  fs.writeFileSync(outputPath, `${result.jsonText}\n`, "utf8");
  return Object.freeze({
    outputPath,
    summary: result.summary,
    itemCount: result.snapshot.items.length
  });
}

function helpText() {
  return `DAY29→DAY30 外部Data JSON作成\n\n` +
    `使用方法:\n` +
    `  node BuildDiagnosisExecutionDataJson.js --input-dir <CSVフォルダ> --output <出力JSON>\n\n` +
    `任意:\n` +
    `  --exported-at 2026-08-02T09:30:00+09:00\n`;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const options = readOptions(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(helpText());
      process.exitCode = 0;
    } else {
      const result = buildDiagnosisExecutionDataJsonFiles(options);
      process.stdout.write(
        `JSONを作成しました: ${result.outputPath}\n` +
        `Scenario: ${result.summary.capacityScenarioId}\n` +
        `対象月: ${result.summary.targetMonth}\n` +
        `Capacity Bucket: ${result.summary.bucketCount}件\n`
      );
    }
  } catch (error) {
    process.stderr.write(
      `JSON作成に失敗しました。\n` +
      `Code: ${error?.code ?? "UNEXPECTED"}\n` +
      `内容: ${error?.message ?? String(error)}\n`
    );
    process.exitCode = 1;
  }
}
