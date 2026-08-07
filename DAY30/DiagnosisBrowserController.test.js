import test from "node:test";
import assert from "node:assert/strict";

import {
  DASHBOARD_EMPTY_REASON,
  DASHBOARD_SCREEN_STATUS,
  DiagnosisDashboardViewModel
} from "./DiagnosisDashboardViewModel.js";
import {
  DiagnosisBrowserController,
  assertDiagnosisBrowserController
} from "./DiagnosisBrowserController.js";
import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";

function createData() {
  const plans = [
    {
      planId: "PLAN-0001",
      name: "Plan A",
      latestPlanVersionId: "PV-0001",
      latestVersionNumber: 1
    },
    {
      planId: "PLAN-0002",
      name: "Plan B",
      latestPlanVersionId: "PV-0002",
      latestVersionNumber: 1
    }
  ];
  const scenariosByVersion = {
    "PV-0001": [
      {
        diagnosisScenarioId: "DGS-0001",
        planVersionId: "PV-0001",
        name: "基準"
      },
      {
        diagnosisScenarioId: "DGS-0002",
        planVersionId: "PV-0001",
        name: "比較"
      }
    ],
    "PV-0002": []
  };
  const overviewByScenario = {
    "DGS-0001": {
      diagnosisScenarioId: "DGS-0001",
      hasDiagnosisResult: true,
      latestDiagnosis: {
        diagnosisResultId: "DR-0001",
        status: "FEASIBLE",
        validityStatus: "CURRENT",
        requiresActionOperationCount: 0
      }
    },
    "DGS-0002": {
      diagnosisScenarioId: "DGS-0002",
      hasDiagnosisResult: false,
      latestDiagnosis: null
    }
  };
  const details = {
    "DR-0001": {
      diagnosisResultId: "DR-0001",
      scenario: {
        diagnosisScenarioId: "DGS-0001"
      },
      metadata: {
        status: "FEASIBLE",
        validityStatus: "CURRENT"
      },
      summary: {
        requiresActionOperationCount: 0
      }
    },
    "DR-0002": {
      diagnosisResultId: "DR-0002",
      scenario: {
        diagnosisScenarioId: "DGS-0002"
      },
      metadata: {
        status: "PARTIALLY_FEASIBLE",
        validityStatus: "CURRENT"
      },
      summary: {
        requiresActionOperationCount: 1
      }
    }
  };
  return { plans, scenariosByVersion, overviewByScenario, details };
}

function createHarness({ plansOverride = undefined } = {}) {
  const data = createData();
  if (plansOverride !== undefined) data.plans = plansOverride;
  const calls = [];

  const services = {
    listProductionPlanSummaries: {
      execute(query) {
        calls.push(["plans", query]);
        return data.plans;
      }
    },
    listDiagnosisScenarioSummaries: {
      execute(query) {
        calls.push(["scenarios", query]);
        return data.scenariosByVersion[query.planVersionId] ?? [];
      }
    },
    getLatestDiagnosisOverview: {
      execute(query) {
        calls.push(["overview", query]);
        return data.overviewByScenario[query.diagnosisScenarioId];
      }
    },
    getDiagnosisResultDetail: {
      execute(query) {
        calls.push(["detail", query]);
        return data.details[query.diagnosisResultId];
      }
    },
    listDiagnosisActionItems: {
      execute(query) {
        calls.push(["actions", query]);
        return query.diagnosisResultId === "DR-0002"
          ? [{ actionItemId: "ACT-2", overdue: true }]
          : [];
      }
    },
    runPlanDiagnosis: {
      async execute(query) {
        calls.push(["run", query]);
        data.overviewByScenario[query.diagnosisScenarioId] = {
          diagnosisScenarioId: query.diagnosisScenarioId,
          hasDiagnosisResult: true,
          latestDiagnosis: {
            diagnosisResultId: "DR-0002",
            status: "PARTIALLY_FEASIBLE",
            validityStatus: "CURRENT",
            requiresActionOperationCount: 1
          }
        };
        return { diagnosisResultId: "DR-0002" };
      }
    }
  };

  const viewModel = new DiagnosisDashboardViewModel();
  const controller = new DiagnosisBrowserController({
    dashboardViewModel: viewModel,
    ...services
  });
  return { controller, viewModel, data, calls, services };
}

test("初期化でPlan・Scenario・最新診断・詳細・Actionを順に読込む", async () => {
  const { controller, calls } = createHarness();
  const state = await controller.initialize({
    targetMonth: "2026-08",
    activeOnly: true
  });

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.READY);
  assert.equal(state.selectedPlanId, "PLAN-0001");
  assert.equal(state.selectedPlanVersionId, "PV-0001");
  assert.equal(state.selectedScenarioId, "DGS-0001");
  assert.equal(state.selectedDiagnosisResultId, "DR-0001");
  assert.equal(state.diagnosisBadge.label, "実行可能");
  assert.deepEqual(calls.map(([name]) => name), [
    "plans", "scenarios", "overview", "detail", "actions"
  ]);
});

test("Planがなければ正式なEmpty Stateを表示する", async () => {
  const { controller } = createHarness({ plansOverride: [] });
  const state = await controller.initialize();

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.EMPTY);
  assert.equal(state.emptyReasonCode, DASHBOARD_EMPTY_REASON.NO_PLANS);
  assert.equal(state.canRunDiagnosis, false);
});

test("VersionのないPlanは画面を維持して案内を表示する", async () => {
  const { controller, data } = createHarness();
  data.plans[0] = {
    planId: "PLAN-0001",
    name: "Versionなし",
    latestPlanVersionId: null
  };
  const state = await controller.initialize();

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.READY);
  assert.equal(state.contentNoticeCode, DASHBOARD_EMPTY_REASON.NO_PLAN_VERSION);
  assert.equal(state.canRunDiagnosis, false);
});

test("Plan選択で下位のScenario・Resultを入れ替える", async () => {
  const { controller } = createHarness();
  await controller.initialize();
  const state = await controller.selectPlan("PLAN-0002");

  assert.equal(state.selectedPlanId, "PLAN-0002");
  assert.equal(state.selectedPlanVersionId, "PV-0002");
  assert.equal(state.selectedScenarioId, null);
  assert.equal(state.contentNoticeCode, DASHBOARD_EMPTY_REASON.NO_SCENARIOS);
});

test("未診断Scenarioを選択すると診断実行可能な案内状態になる", async () => {
  const { controller } = createHarness();
  await controller.initialize();
  const state = await controller.selectScenario("DGS-0002");

  assert.equal(state.selectedScenarioId, "DGS-0002");
  assert.equal(state.selectedDiagnosisResultId, null);
  assert.equal(state.canRunDiagnosis, true);
  assert.equal(state.contentNoticeCode, DASHBOARD_EMPTY_REASON.NO_DIAGNOSIS_RESULT);
});

test("診断実行後に最新Overview・Detail・Actionを再読込する", async () => {
  const { controller, calls } = createHarness();
  await controller.initialize();
  await controller.selectScenario("DGS-0002");
  const state = await controller.runDiagnosis();

  assert.equal(state.selectedDiagnosisResultId, "DR-0002");
  assert.equal(state.diagnosisBadge.label, "一部実行可能");
  assert.equal(state.actionItems.length, 1);
  assert.equal(state.requiresAttention, true);
  assert.equal(calls.some(([name]) => name === "run"), true);
});

test("Scenario未選択で診断実行するとError Stateにする", async () => {
  const { controller } = createHarness();
  await controller.initialize();
  await controller.selectPlan("PLAN-0002");
  const state = await controller.runDiagnosis();

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.ERROR);
  assert.equal(state.error.code, ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED);
  assert.equal(state.selectedPlanId, "PLAN-0002");
});

test("存在しないPlan選択をError Stateへ変換し既存Contentを保持する", async () => {
  const { controller } = createHarness();
  await controller.initialize();
  const state = await controller.selectPlan("PLAN-9999");

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.ERROR);
  assert.equal(state.error.code, ERROR_CODES.PRESENTATION_TARGET_NOT_FOUND);
  assert.equal(state.selectedPlanId, "PLAN-0001");
});

test("Action Item Filterを変更して再読込する", async () => {
  const { controller, calls } = createHarness();
  await controller.initialize();
  const state = await controller.refreshActionItems({
    includeClosed: true,
    evaluationDate: "2026-08-03"
  });

  assert.equal(state.filters.includeClosedActionItems, true);
  assert.equal(state.filters.evaluationDate, "2026-08-03");
  const latestActionCall = calls.filter(([name]) => name === "actions").at(-1);
  assert.deepEqual(latestActionCall[1], {
    diagnosisResultId: "DR-0001",
    includeClosed: true,
    evaluationDate: "2026-08-03"
  });
});

test("指定ResultのDetailを表示できる", async () => {
  const { controller } = createHarness();
  await controller.initialize();
  const state = await controller.showDiagnosisResult("DR-0001");

  assert.equal(state.detail.diagnosisResultId, "DR-0001");
  assert.equal(state.canShowDetail, true);
});

test("Read Service失敗をError Stateへ変換する", async () => {
  const harness = createHarness();
  harness.services.listProductionPlanSummaries.execute = () => {
    throw createApplicationError(
      ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
      "read failed"
    );
  };
  const controller = new DiagnosisBrowserController({
    dashboardViewModel: new DiagnosisDashboardViewModel(),
    ...harness.services
  });

  const state = await controller.initialize();
  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.ERROR);
  assert.equal(state.error.code, ERROR_CODES.READ_MODEL_INTEGRITY_ERROR);
});

test("古い非同期応答は新しい画面状態を上書きしない", async () => {
  let releaseFirst;
  let callCount = 0;
  const firstPromise = new Promise((resolve) => { releaseFirst = resolve; });
  const data = createData();
  const listPlans = {
    async execute() {
      callCount += 1;
      if (callCount === 1) {
        await firstPromise;
        return [data.plans[0]];
      }
      return [data.plans[1]];
    }
  };
  const controller = new DiagnosisBrowserController({
    dashboardViewModel: new DiagnosisDashboardViewModel(),
    listProductionPlanSummaries: listPlans,
    listDiagnosisScenarioSummaries: {
      execute({ planVersionId }) {
        return data.scenariosByVersion[planVersionId] ?? [];
      }
    },
    getLatestDiagnosisOverview: { execute() { return null; } },
    getDiagnosisResultDetail: { execute() { return null; } },
    listDiagnosisActionItems: { execute() { return []; } },
    runPlanDiagnosis: { async execute() { return {}; } }
  });

  const oldRequest = controller.initialize();
  const newRequest = controller.initialize();
  const newState = await newRequest;
  releaseFirst();
  await oldRequest;

  assert.equal(newState.selectedPlanId, "PLAN-0002");
  assert.equal(controller.getState().selectedPlanId, "PLAN-0002");
});

test("Controller契約を検証する", () => {
  const { controller } = createHarness();
  assert.equal(assertDiagnosisBrowserController(controller), controller);
  assert.throws(() => assertDiagnosisBrowserController({ getState() {} }));
});

test("Comparison Scenario選択時にScenario比較を読込む", async () => {
  const harness = createHarness();
  const controller = new DiagnosisBrowserController({
    dashboardViewModel: new DiagnosisDashboardViewModel(),
    ...harness.services,
    getScenarioComparison: {
      execute({ comparisonScenarioId }) {
        return {
          comparisonAvailable: comparisonScenarioId === "DGS-0002",
          comparisonScenarioId,
          baseScenarioId: comparisonScenarioId === "DGS-0002" ? "DGS-0001" : null,
          comparison: comparisonScenarioId === "DGS-0002"
            ? { outcome: "IMPROVED" }
            : undefined,
          reasonCode: comparisonScenarioId === "DGS-0002" ? undefined : "BASE_SCENARIO_NOT_CONFIGURED"
        };
      }
    }
  });
  await controller.initialize();
  const state = await controller.selectScenario("DGS-0002");
  assert.equal(state.comparison.comparisonAvailable, true);
  assert.equal(state.comparisonBadge.label, "改善");
});
