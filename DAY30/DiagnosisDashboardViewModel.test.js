import test from "node:test";
import assert from "node:assert/strict";

import {
  DASHBOARD_BUSY_ACTION,
  DASHBOARD_EMPTY_REASON,
  DASHBOARD_SCREEN_STATUS,
  DiagnosisDashboardViewModel,
  assertDiagnosisDashboardViewModel
} from "./DiagnosisDashboardViewModel.js";
import {
  ERROR_CODES,
  createApplicationError,
  hasErrorCode
} from "./DiagnosisErrors.js";

function plan(overrides = {}) {
  return {
    planId: "PLAN-0001",
    name: "2026年8月生産計画",
    latestPlanVersionId: "PV-0001",
    ...overrides
  };
}

function scenario(overrides = {}) {
  return {
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    name: "基準Scenario",
    ...overrides
  };
}

function overview(overrides = {}) {
  return {
    diagnosisScenarioId: "DGS-0001",
    hasDiagnosisResult: true,
    latestDiagnosis: {
      diagnosisResultId: "DR-0001",
      status: "INFEASIBLE",
      validityStatus: "STALE",
      requiresActionOperationCount: 2,
      ...overrides
    }
  };
}

function detail(overrides = {}) {
  return {
    diagnosisResultId: "DR-0001",
    scenario: scenario(),
    metadata: {
      status: "INFEASIBLE",
      validityStatus: "STALE"
    },
    summary: {
      requiresActionOperationCount: 2
    },
    ...overrides
  };
}

test("初期StateはIDLEかつ変更不能", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  const state = viewModel.getState();

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.IDLE);
  assert.equal(state.revision, 0);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.filters), true);
  assert.throws(() => { state.screenStatus = "READY"; }, TypeError);
});

test("Loading表示は既存Contentを保持できる", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  viewModel.showDashboard({
    plans: [plan()],
    selectedPlanId: "PLAN-0001",
    selectedPlanVersionId: "PV-0001",
    scenarios: [scenario()],
    selectedScenarioId: "DGS-0001",
    overview: overview()
  });

  const state = viewModel.showLoading({
    action: DASHBOARD_BUSY_ACTION.RUN_DIAGNOSIS,
    preserveContent: true
  });

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.LOADING);
  assert.equal(state.busyAction, DASHBOARD_BUSY_ACTION.RUN_DIAGNOSIS);
  assert.equal(state.selectedPlanId, "PLAN-0001");
  assert.equal(state.selectedScenarioId, "DGS-0001");
});

test("初期化LoadingではContentを消去できる", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  viewModel.showDashboard({
    plans: [plan()],
    selectedPlanId: "PLAN-0001"
  });
  const state = viewModel.showLoading({
    action: DASHBOARD_BUSY_ACTION.INITIALIZE,
    preserveContent: false
  });

  assert.deepEqual(state.plans, []);
  assert.equal(state.selectedPlanId, null);
});

test("Dashboard用Badge・実行可否・要対応状態を生成する", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  const state = viewModel.showDashboard({
    plans: [plan()],
    selectedPlanId: "PLAN-0001",
    selectedPlanVersionId: "PV-0001",
    scenarios: [scenario()],
    selectedScenarioId: "DGS-0001",
    overview: overview(),
    detail: detail(),
    actionItems: [{ actionItemId: "ACT-1", overdue: true }]
  });

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.READY);
  assert.equal(state.diagnosisBadge.label, "実行不可能");
  assert.equal(state.diagnosisBadge.tone, "danger");
  assert.equal(state.validityBadge.label, "再診断が必要");
  assert.equal(state.canRunDiagnosis, true);
  assert.equal(state.canShowDetail, true);
  assert.equal(state.requiresAttention, true);
  assert.equal(Object.isFrozen(state.actionItems[0]), true);
});

test("UNKNOWNの説明で0や不可能へ置換しないことを示す", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  const state = viewModel.showDashboard({
    plans: [plan()],
    selectedPlanId: "PLAN-0001",
    scenarios: [scenario()],
    selectedScenarioId: "DGS-0001",
    overview: overview({
      status: "UNKNOWN",
      validityStatus: "CURRENT",
      requiresActionOperationCount: 0
    })
  });

  assert.equal(state.diagnosisBadge.label, "判断不能");
  assert.match(state.diagnosisBadge.guidance, /0や実行不可能へ置き換えない/);
});

test("選択Planが一覧に存在しなければ拒否する", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  assert.throws(
    () => viewModel.showDashboard({
      plans: [plan()],
      selectedPlanId: "PLAN-9999"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DASHBOARD_SELECTION)
  );
});

test("Detailと選択Scenarioが異なる場合は拒否する", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  assert.throws(
    () => viewModel.showDashboard({
      plans: [plan()],
      selectedPlanId: "PLAN-0001",
      scenarios: [scenario()],
      selectedScenarioId: "DGS-0001",
      detail: detail({
        scenario: scenario({ diagnosisScenarioId: "DGS-9999" })
      })
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DASHBOARD_SELECTION)
  );
});

test("Empty Stateは理由とFilterを保持する", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  const state = viewModel.showEmpty({
    reason: DASHBOARD_EMPTY_REASON.NO_PLANS,
    message: "Planがありません",
    filters: { targetMonth: "2026-08", activeOnly: true }
  });

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.EMPTY);
  assert.equal(state.emptyReasonCode, DASHBOARD_EMPTY_REASON.NO_PLANS);
  assert.equal(state.filters.targetMonth, "2026-08");
  assert.equal(state.message, "Planがありません");
});

test("Application Errorを画面用Errorへ変換する", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  const state = viewModel.showError(createApplicationError(
    ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED,
    "診断できません",
    { reason: "inactive" }
  ));

  assert.equal(state.screenStatus, DASHBOARD_SCREEN_STATUS.ERROR);
  assert.equal(state.error.code, ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED);
  assert.equal(state.error.message, "診断できません");
  assert.deepEqual(state.error.details, { reason: "inactive" });
});

test("View Model契約を検証する", () => {
  assert.equal(
    assertDiagnosisDashboardViewModel(new DiagnosisDashboardViewModel())
      instanceof DiagnosisDashboardViewModel,
    true
  );
  assert.throws(
    () => assertDiagnosisDashboardViewModel({ getState() {} }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL)
  );
});

test("Scenario比較Outcomeを日本語Badgeへ変換する", () => {
  const viewModel = new DiagnosisDashboardViewModel();
  const state = viewModel.showDashboard({
    plans: [plan()],
    selectedPlanId: "PLAN-0001",
    selectedPlanVersionId: "PV-0001",
    scenarios: [scenario({
      diagnosisScenarioId: "DGS-0002",
      baseDiagnosisScenarioId: "DGS-0001"
    })],
    selectedScenarioId: "DGS-0002",
    comparison: {
      comparisonAvailable: true,
      comparisonScenarioId: "DGS-0002",
      baseScenarioId: "DGS-0001",
      comparison: { outcome: "IMPROVED" }
    }
  });

  assert.equal(state.comparisonBadge.label, "改善");
  assert.equal(state.comparisonBadge.tone, "success");
  assert.equal(Object.isFrozen(state.comparison), true);
});
