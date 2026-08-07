import test from "node:test";
import assert from "node:assert/strict";
import { FixedClock } from "./FixedClock.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";
import { DiagnosisExecutionDataSnapshotService } from "./DiagnosisExecutionDataSnapshotService.js";
import { DiagnosisExecutionDataJsonExporter } from "./DiagnosisExecutionDataJsonExporter.js";

function createExporter() {
  const provider = new InMemoryDiagnosisExecutionDataProvider({
    data: [new DiagnosisExecutionData({
      capacitySnapshot: new CapacitySnapshot({
        capacityScenarioId: "CAP-01",
        targetMonth: "2026-08",
        generatedAt: "2026-08-02T06:00:00+09:00",
        sourceRevision: { capacity: 1 },
        buckets: [new CapacityBucket({
          factoryId: "F-01",
          equipmentId: "EQ-01",
          date: "2026-08-03",
          shiftId: null,
          availableMinutes: 420,
          availabilityStatus: "AVAILABLE",
          workerStatus: "SATISFIED",
          skillStatus: "SATISFIED",
          assignmentStatus: "SATISFIED",
          reasonCodes: [],
          dataConfidence: "A"
        })]
      }),
      equipments: [{ equipmentId: "EQ-01", factoryId: "F-01" }],
      externalInputRevision: { routing: 1 }
    })]
  });
  return new DiagnosisExecutionDataJsonExporter({
    snapshotService: new DiagnosisExecutionDataSnapshotService({
      executionDataProvider: provider
    }),
    clock: new FixedClock("2026-08-02T09:30:00+09:00")
  });
}

test("外部Read Dataを正式JSON PackageとしてExportする", () => {
  const result = createExporter().execute();
  assert.equal(result.fileName, "DAY29-to-DAY30-external-data-2026-08-02.json");
  assert.equal(result.count, 1);
  assert.equal(JSON.parse(result.jsonText).application, "DAY30_DIAGNOSIS_EXECUTION_DATA");
  assert.equal(result.summaries[0].bucketCount, 1);
});

test("compact JSONも生成できる", () => {
  const result = createExporter().execute({ pretty: false });
  assert.equal(result.jsonText.includes("\n"), false);
});

test("Export Resultは変更できない", () => {
  const result = createExporter().execute();
  assert.throws(() => {
    result.summaries[0].bucketCount = 99;
  }, TypeError);
});

test("prettyの不正値を拒否する", () => {
  assert.throws(
    () => createExporter().execute({ pretty: "yes" }),
    (error) => error.code === "INVALID_EXTERNAL_DATA_EXPORT_SERVICE"
  );
});
