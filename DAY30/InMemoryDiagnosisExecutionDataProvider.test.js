import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  InMemoryDiagnosisExecutionDataProvider
} from "./InMemoryDiagnosisExecutionDataProvider.js";

import { createExecutionData } from "./DiagnosisApplicationTestFixture.js";

test("Capacity Scenarioと対象月でDataを保存・取得する", async () => {
  const data = createExecutionData();
  const provider = new InMemoryDiagnosisExecutionDataProvider();

  provider.set(data);
  const loaded = await provider.load({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08"
  });

  assert.equal(loaded, data);
  assert.equal(provider.count, 1);
  assert.equal(provider.revision, 1);
});

test("同じInstanceの再設定ではRevisionを増やさない", () => {
  const data = createExecutionData();
  const provider = new InMemoryDiagnosisExecutionDataProvider({ data: [data] });

  provider.set(data);
  assert.equal(provider.revision, 1);
});

test("未登録Dataを推測で補わずENTITY_NOT_FOUNDにする", async () => {
  const provider = new InMemoryDiagnosisExecutionDataProvider();

  await assert.rejects(
    () => provider.load({
      capacityScenarioId: "CAP-BASE",
      targetMonth: "2026-08"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.ENTITY_NOT_FOUND)
  );
});

test("削除成功時だけRevisionを増やす", () => {
  const data = createExecutionData();
  const provider = new InMemoryDiagnosisExecutionDataProvider({ data: [data] });

  assert.equal(provider.delete({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08"
  }), true);
  assert.equal(provider.revision, 2);
  assert.equal(provider.delete({
    capacityScenarioId: "CAP-BASE",
    targetMonth: "2026-08"
  }), false);
  assert.equal(provider.revision, 2);
});
