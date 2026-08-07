import test from "node:test";
import assert from "node:assert/strict";
import {
  GetDiagnosisResultDetail,
  GetLatestDiagnosisOverview,
  GetScenarioComparison,
  ListDiagnosisActionItems,
  ListDiagnosisScenarioSummaries,
  ListProductionPlanSummaries
} from "./DiagnosisReadApplicationServices.js";

function createSpyReadModel() {
  const calls = [];
  return {
    calls,
    listPlanSummaries(query) { calls.push(["plans", query]); return ["plans"]; },
    listScenarioSummaries(query) { calls.push(["scenarios", query]); return ["scenarios"]; },
    getLatestDiagnosisOverview(query) { calls.push(["overview", query]); return { overview: true }; },
    getDiagnosisResultDetail(query) { calls.push(["detail", query]); return { detail: true }; },
    listActionItems(query) { calls.push(["actions", query]); return ["actions"]; },
    getScenarioComparison(query) { calls.push(["comparison", query]); return { comparison: true }; }
  };
}

test("各Read Application ServiceはQueryをRead Modelへ委譲する", () => {
  const readModel = createSpyReadModel();
  assert.deepEqual(new ListProductionPlanSummaries({ diagnosisReadModel: readModel }).execute({ activeOnly: true }), ["plans"]);
  assert.deepEqual(new ListDiagnosisScenarioSummaries({ diagnosisReadModel: readModel }).execute({ planVersionId: "PV-1" }), ["scenarios"]);
  assert.deepEqual(new GetLatestDiagnosisOverview({ diagnosisReadModel: readModel }).execute({ diagnosisScenarioId: "DGS-1" }), { overview: true });
  assert.deepEqual(new GetDiagnosisResultDetail({ diagnosisReadModel: readModel }).execute({ diagnosisResultId: "DR-1" }), { detail: true });
  assert.deepEqual(new ListDiagnosisActionItems({ diagnosisReadModel: readModel }).execute({ diagnosisResultId: "DR-1" }), ["actions"]);
  assert.deepEqual(new GetScenarioComparison({ diagnosisReadModel: readModel }).execute({ comparisonScenarioId: "DGS-2" }), { comparison: true });
  assert.equal(readModel.calls.length, 6);
});

test("Read Application Serviceは生成後に依存先を変更できない", () => {
  const service = new ListProductionPlanSummaries({ diagnosisReadModel: createSpyReadModel() });
  assert.equal(Object.isFrozen(service), true);
  assert.throws(() => { service.diagnosisReadModel = null; }, TypeError);
});
