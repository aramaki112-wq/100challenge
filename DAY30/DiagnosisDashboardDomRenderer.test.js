import test from "node:test";
import assert from "node:assert/strict";

import {
  DiagnosisDashboardDomRenderer,
  buildDiagnosisDashboardHtml,
  assertDiagnosisDashboardDomRenderer
} from "./DiagnosisDashboardDomRenderer.js";
import {
  DiagnosisDashboardViewModel
} from "./DiagnosisDashboardViewModel.js";
import {
  DiagnosisBrowserController
} from "./DiagnosisBrowserController.js";
import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

class FakeRoot {
  constructor() {
    this.innerHTML = "";
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }
  dispatch(type, target) {
    this.listeners.get(type)?.({ target });
  }
}

class FakeDocument {
  constructor(root = new FakeRoot()) {
    this.root = root;
  }
  querySelector(selector) {
    return selector === "#app" ? this.root : null;
  }
}

function createControllerHarness() {
  const calls = [];
  const data = {
    plans: [{
      planId: "PLAN-1",
      name: "<script>危険Plan</script>",
      targetMonth: "2026-08",
      latestPlanVersionId: "PV-1"
    }],
    scenarios: [{
      diagnosisScenarioId: "DGS-1",
      planVersionId: "PV-1",
      name: "基準"
    }],
    overview: {
      diagnosisScenarioId: "DGS-1",
      hasDiagnosisResult: false,
      latestDiagnosis: null
    }
  };
  const controller = new DiagnosisBrowserController({
    dashboardViewModel: new DiagnosisDashboardViewModel(),
    listProductionPlanSummaries: {
      execute(query) { calls.push(["plans", query]); return data.plans; }
    },
    listDiagnosisScenarioSummaries: {
      execute(query) { calls.push(["scenarios", query]); return data.scenarios; }
    },
    getLatestDiagnosisOverview: {
      execute(query) { calls.push(["overview", query]); return data.overview; }
    },
    getDiagnosisResultDetail: {
      execute(query) { calls.push(["detail", query]); return null; }
    },
    listDiagnosisActionItems: {
      execute(query) { calls.push(["actions", query]); return []; }
    },
    runPlanDiagnosis: {
      async execute(query) {
        calls.push(["run", query]);
        data.overview = {
          diagnosisScenarioId: "DGS-1",
          hasDiagnosisResult: true,
          latestDiagnosis: {
            diagnosisResultId: "DR-1",
            status: "UNKNOWN",
            validityStatus: "CURRENT",
            requiresActionOperationCount: 1
          }
        };
        return { diagnosisResultId: "DR-1" };
      }
    }
  });
  return { controller, calls, data };
}

test("HTML生成時にUser DataをEscapeする", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 1,
    filters: {},
    plans: [{ planId: "P1", name: '<img src=x onerror="alert(1)">', targetMonth: "2026-08" }],
    selectedPlanId: "P1",
    scenarios: [],
    actionItems: [],
    canRunDiagnosis: false
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("UNKNOWN GuidanceとValidityを画面へ表示する", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 2,
    filters: {},
    plans: [],
    scenarios: [],
    actionItems: [],
    canRunDiagnosis: false,
    diagnosisBadge: {
      label: "判断不能",
      tone: "unknown",
      guidance: "UNKNOWNを0や実行不可能へ置き換えないでください。"
    },
    validityBadge: {
      label: "再診断が必要",
      tone: "warning",
      guidance: "変更理由を確認してください。"
    }
  });
  assert.match(html, /判断不能/);
  assert.match(html, /0や実行不可能へ置き換えない/);
  assert.match(html, /再診断が必要/);
});

test("数量集計・Operation・Action Itemを描画する", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 3,
    filters: {},
    plans: [],
    scenarios: [],
    canRunDiagnosis: false,
    actionItems: [{
      actionItemId: "A1",
      type: "CONSTRAINT",
      priority: "HIGH",
      plannedOperationId: "POP-1",
      title: "能力不足",
      description: "60分不足",
      owner: null,
      dueDate: null,
      overdue: true,
      recommendedAction: "別Shiftへ移動"
    }],
    detail: {
      metadata: { status: "PARTIALLY_FEASIBLE", validityStatus: "CURRENT" },
      summary: {
        statusCounts: { FEASIBLE: 0, PARTIALLY_FEASIBLE: 1, INFEASIBLE: 0, UNKNOWN: 0 },
        quantityTotalsByUnit: {
          PIECE: {
            plannedQuantity: 60,
            capacityExecutableQuantity: 40,
            diagnosedExecutableQuantity: 40,
            diagnosedShortageQuantity: 20,
            unknownPlannedQuantity: 0
          }
        },
        minutesSummary: { knownRequiredMinutes: 360, knownAllocatedMinutes: 240, knownShortageMinutes: 120 },
        requiresActionOperationCount: 1
      },
      operationResults: [{
        plannedDate: "2026-08-03",
        plannedOperationId: "POP-1",
        orderId: "ORD-1",
        equipmentId: "EQ-1",
        plannedQuantity: 60,
        quantityUnit: "PIECE",
        diagnosedExecutableQuantity: 40,
        diagnosedShortageQuantity: 20,
        requiredMinutes: 360,
        allocatedMinutes: 240,
        status: "PARTIALLY_FEASIBLE"
      }]
    }
  });
  assert.match(html, />60</);
  assert.match(html, />40</);
  assert.match(html, />20</);
  assert.match(html, /能力不足/);
  assert.match(html, /期限超過/);
});

test("mountとstartで初期表示をControllerから取得する", async () => {
  const { controller } = createControllerHarness();
  const document = new FakeDocument();
  const renderer = new DiagnosisDashboardDomRenderer({ document, controller });
  const state = await renderer.start({ targetMonth: "2026-08" });
  assert.equal(state.selectedPlanId, "PLAN-1");
  assert.match(document.root.innerHTML, /危険Plan/);
  assert.doesNotMatch(document.root.innerHTML, /<script>危険Plan/);
  assert.equal(document.root.listeners.has("click"), true);
  assert.equal(document.root.listeners.has("change"), true);
});

test("DOM EventからPlan・Scenario・Filter操作をControllerへ委譲する", async () => {
  const { controller, calls } = createControllerHarness();
  const document = new FakeDocument();
  const renderer = new DiagnosisDashboardDomRenderer({ document, controller });
  await renderer.start();

  document.root.dispatch("change", {
    dataset: { action: "select-scenario" },
    value: "DGS-1"
  });
  await renderer.whenIdle();

  document.root.dispatch("change", {
    dataset: { action: "toggle-closed" },
    checked: true
  });
  await renderer.whenIdle();

  assert.equal(calls.filter(([name]) => name === "overview").length >= 2, true);
  assert.equal(controller.getState().filters.includeClosedActionItems, true);
});

test("診断ButtonをControllerへ委譲する", async () => {
  const { controller, calls } = createControllerHarness();
  const document = new FakeDocument();
  const renderer = new DiagnosisDashboardDomRenderer({ document, controller });
  await renderer.start();

  document.root.dispatch("click", { dataset: { action: "run-diagnosis" } });
  await renderer.whenIdle();
  assert.equal(calls.some(([name]) => name === "run"), true);
});

test("Rootがなければ明示的Errorにする", () => {
  const { controller } = createControllerHarness();
  const renderer = new DiagnosisDashboardDomRenderer({
    document: { querySelector() { return null; } },
    controller
  });
  assert.throws(
    () => renderer.mount(),
    (error) => hasErrorCode(error, ERROR_CODES.DIAGNOSIS_DOM_ROOT_NOT_FOUND)
  );
});

test("Renderer契約を検証する", () => {
  const { controller } = createControllerHarness();
  const renderer = new DiagnosisDashboardDomRenderer({
    document: new FakeDocument(),
    controller
  });
  assert.equal(assertDiagnosisDashboardDomRenderer(renderer), renderer);
  assert.throws(
    () => assertDiagnosisDashboardDomRenderer({ mount() {} }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DIAGNOSIS_DOM_RENDERER)
  );
});

test("CSV Import PreviewをHTMLへ描画する", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 1,
    filters: {},
    plans: [],
    scenarios: [],
    actionItems: [],
    canRunDiagnosis: false,
    selectedPlanVersionId: "PV-1"
  }, {
    screenStatus: "PREVIEW_READY",
    revision: 2,
    fileName: "<危険>.csv",
    expectedPlanVersionId: "PV-1",
    canCommit: false,
    message: "Errorがあります",
    error: null,
    commitResult: null,
    preview: {
      fileName: "<危険>.csv",
      counts: { add: 0, update: 0, unchanged: 0, errors: 1 },
      issues: [],
      rows: [{
        rowNumber: 2,
        plannedOperationId: "POP-1",
        previewStatus: "ERROR",
        normalizedData: { plannedDate: "2026-08-03" },
        issues: [{ severity: "ERROR", rowNumber: 2, columnName: "plannedQuantity", issueCode: "BAD", message: "<script>bad</script>" }]
      }]
    }
  });
  assert.match(html, /Planned Operation CSVを取り込む/);
  assert.match(html, /POP-1/);
  assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /&lt;script&gt;bad&lt;\/script&gt;/);
});

test("File選択とImport CommitをImport Controllerへ委譲する", async () => {
  const { controller } = createControllerHarness();
  const calls = [];
  let importState = {
    screenStatus: "IDLE", revision: 0, fileName: "", expectedPlanVersionId: null,
    preview: null, commitResult: null, error: null, message: "待機", canCommit: false
  };
  const importController = {
    getState() { return importState; },
    async previewCsv(args) {
      calls.push(["preview", args]);
      importState = { ...importState, screenStatus: "PREVIEW_READY", expectedPlanVersionId: args.expectedPlanVersionId, canCommit: true, revision: 1 };
      return importState;
    },
    async commit() {
      calls.push(["commit"]);
      importState = { ...importState, screenStatus: "COMMITTED", canCommit: false, revision: 2 };
      return importState;
    },
    showError(error) { calls.push(["error", error]); return importState; },
    reset() { calls.push(["reset"]); return importState; }
  };
  const document = new FakeDocument();
  const renderer = new DiagnosisDashboardDomRenderer({ document, controller, importController });
  await renderer.start();

  document.root.dispatch("change", {
    dataset: { action: "import-file" },
    files: [{ name: "plan.csv", async text() { return "a,b\n1,2"; } }]
  });
  await renderer.whenIdle();
  assert.equal(calls[0][0], "preview");
  assert.equal(calls[0][1].expectedPlanVersionId, "PV-1");

  document.root.dispatch("click", { dataset: { action: "commit-import" } });
  await renderer.whenIdle();
  assert.equal(calls.some(([name]) => name === "commit"), true);
});

test("AssumptionとDiagnosis ScenarioのImport Panelを描画する", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 1,
    filters: {},
    plans: [],
    scenarios: [],
    selectedPlanVersionId: "PV-1",
    actionItems: [],
    canRunDiagnosis: false
  }, null, {
    assumption: {
      screenStatus: "IDLE",
      revision: 0,
      message: "Assumption CSV",
      preview: null,
      error: null,
      canCommit: false
    },
    diagnosisScenario: {
      screenStatus: "IDLE",
      revision: 0,
      message: "Scenario CSV",
      preview: null,
      error: null,
      canCommit: false
    }
  });
  assert.match(html, /Assumption CSVを取り込む/);
  assert.match(html, /Diagnosis Scenario CSVを取り込む/);
  assert.match(html, /assumptions-template\.csv/);
  assert.match(html, /diagnosis-scenarios-template\.csv/);
});

test("Scenario比較の差分と因果断定しない注意を描画する", () => {
  const html = buildDiagnosisDashboardHtml({
    screenStatus: "READY",
    revision: 1,
    filters: {},
    plans: [],
    scenarios: [],
    actionItems: [],
    canRunDiagnosis: false,
    comparisonBadge: { label: "改善", tone: "success" },
    comparison: {
      comparisonAvailable: true,
      comparisonScenarioId: "DGS-COMP",
      baseScenarioId: "DGS-BASE",
      comparison: {
        baseScenario: { name: "基準" },
        comparisonScenario: { name: "残業追加" },
        changeSummary: "残業を2時間追加",
        changedOperationCount: 1,
        summaryDeltas: {
          quantityTotalsByUnit: {
            PIECE: {
              diagnosedExecutableQuantity: 20,
              diagnosedShortageQuantity: -20
            }
          },
          minutesSummary: { knownShortageMinutes: -120 },
          requiresActionOperationCount: -1,
          nextCheckSummary: { openNextCheckCount: 0 }
        },
        operationComparisons: [{
          plannedOperationId: "POP-2",
          beforeStatus: "PARTIALLY_FEASIBLE",
          afterStatus: "FEASIBLE",
          outcome: "IMPROVED",
          beforePrimaryReasonCode: "CAPACITY_PARTIAL",
          afterPrimaryReasonCode: "ALL_CONDITIONS_SATISFIED",
          primaryReasonChanged: true,
          deltas: {
            diagnosedExecutableQuantity: 20,
            diagnosedShortageQuantity: -20,
            shortageMinutes: -120
          }
        }]
      }
    }
  });
  assert.match(html, /残業を2時間追加/);
  assert.match(html, /-120分/);
  assert.match(html, /単独で証明するものではありません/);
  assert.match(html, /POP-2/);
});
