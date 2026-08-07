import {
  ERROR_CODES,
  assertBoolean,
  assertNonEmptyString,
  createApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";
import {
  DASHBOARD_BUSY_ACTION,
  DASHBOARD_EMPTY_REASON,
  assertDiagnosisDashboardViewModel
} from "./DiagnosisDashboardViewModel.js";

function assertService(value, methodName, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value[methodName] !== "function"
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
      `${label} must implement ${methodName}().`,
      { label, methodName }
    );
  }
  return value;
}

function optionalIdentifier(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const id = assertNonEmptyString(
    value,
    ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
    label
  );
  if (/\s/.test(id)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
      `${label} must not contain whitespace.`,
      { value }
    );
  }
  return id;
}

function normalizeFilters({
  targetMonth = null,
  activeOnly = true,
  includeClosedActionItems = false,
  evaluationDate = null
} = {}) {
  assertBoolean(
    activeOnly,
    ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
    "activeOnly"
  );
  assertBoolean(
    includeClosedActionItems,
    ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
    "includeClosedActionItems"
  );
  return Object.freeze({
    targetMonth,
    activeOnly,
    includeClosedActionItems,
    evaluationDate
  });
}

export class DiagnosisBrowserController {
  #viewModel;
  #listPlans;
  #listScenarios;
  #getOverview;
  #getDetail;
  #listActionItems;
  #runDiagnosis;
  #getScenarioComparison;
  #filters;
  #plans = [];
  #scenarios = [];
  #selectedPlanId = null;
  #selectedPlanVersionId = null;
  #selectedScenarioId = null;
  #overview = null;
  #detail = null;
  #actionItems = [];
  #comparison = null;
  #requestSequence = 0;

  constructor({
    dashboardViewModel,
    listProductionPlanSummaries,
    listDiagnosisScenarioSummaries,
    getLatestDiagnosisOverview,
    getDiagnosisResultDetail,
    listDiagnosisActionItems,
    runPlanDiagnosis,
    getScenarioComparison = null
  } = {}) {
    this.#viewModel = assertDiagnosisDashboardViewModel(dashboardViewModel);
    this.#listPlans = assertService(
      listProductionPlanSummaries,
      "execute",
      "listProductionPlanSummaries"
    );
    this.#listScenarios = assertService(
      listDiagnosisScenarioSummaries,
      "execute",
      "listDiagnosisScenarioSummaries"
    );
    this.#getOverview = assertService(
      getLatestDiagnosisOverview,
      "execute",
      "getLatestDiagnosisOverview"
    );
    this.#getDetail = assertService(
      getDiagnosisResultDetail,
      "execute",
      "getDiagnosisResultDetail"
    );
    this.#listActionItems = assertService(
      listDiagnosisActionItems,
      "execute",
      "listDiagnosisActionItems"
    );
    this.#runDiagnosis = assertService(
      runPlanDiagnosis,
      "execute",
      "runPlanDiagnosis"
    );
    this.#getScenarioComparison = getScenarioComparison === null
      ? null
      : assertService(getScenarioComparison, "execute", "getScenarioComparison");
    this.#filters = normalizeFilters();
    Object.freeze(this);
  }

  getState() {
    return this.#viewModel.getState();
  }

  initialize(filters = {}) {
    this.#filters = normalizeFilters(filters);
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.INITIALIZE,
      false,
      async (requestId) => {
        await this.#loadPlans({ requestId, preserveSelection: false });
      }
    );
  }

  refresh() {
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.REFRESH,
      true,
      async (requestId) => {
        await this.#loadPlans({ requestId, preserveSelection: true });
      }
    );
  }

  selectPlan(planId) {
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.SELECT_PLAN,
      true,
      async (requestId) => {
        const id = optionalIdentifier(planId, "planId");
        const plan = this.#plans.find((row) => row.planId === id);
        if (!plan) {
          throw createApplicationError(
            ERROR_CODES.PRESENTATION_TARGET_NOT_FOUND,
            "Selected Production Plan is not available in the current list.",
            { planId: id }
          );
        }
        await this.#loadPlanContext({ plan, requestId, preferredScenarioId: null });
      }
    );
  }

  selectScenario(diagnosisScenarioId) {
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.SELECT_SCENARIO,
      true,
      async (requestId) => {
        const id = optionalIdentifier(
          diagnosisScenarioId,
          "diagnosisScenarioId"
        );
        const scenario = this.#scenarios.find(
          (row) => row.diagnosisScenarioId === id
        );
        if (!scenario) {
          throw createApplicationError(
            ERROR_CODES.PRESENTATION_TARGET_NOT_FOUND,
            "Selected Diagnosis Scenario is not available in the current list.",
            { diagnosisScenarioId: id }
          );
        }
        await this.#loadScenarioContext({ scenario, requestId });
      }
    );
  }

  runDiagnosis() {
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.RUN_DIAGNOSIS,
      true,
      async (requestId) => {
        if (this.#selectedScenarioId === null) {
          throw createApplicationError(
            ERROR_CODES.DIAGNOSIS_EXECUTION_NOT_ALLOWED,
            "Select a Diagnosis Scenario before running diagnosis.",
            {}
          );
        }
        await this.#runDiagnosis.execute({
          diagnosisScenarioId: this.#selectedScenarioId
        });
        this.#assertCurrent(requestId);
        const scenario = this.#scenarios.find(
          (row) => row.diagnosisScenarioId === this.#selectedScenarioId
        );
        await this.#loadScenarioContext({ scenario, requestId });
      }
    );
  }

  showDiagnosisResult(diagnosisResultId) {
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.LOAD_DETAIL,
      true,
      async (requestId) => {
        const id = optionalIdentifier(diagnosisResultId, "diagnosisResultId");
        const detail = await Promise.resolve(
          this.#getDetail.execute({ diagnosisResultId: id })
        );
        this.#assertCurrent(requestId);
        if (
          this.#selectedScenarioId !== null &&
          detail.scenario?.diagnosisScenarioId !== this.#selectedScenarioId
        ) {
          throw createApplicationError(
            ERROR_CODES.PRESENTATION_TARGET_NOT_FOUND,
            "Diagnosis Result does not belong to the selected Scenario.",
            {
              diagnosisResultId: id,
              selectedScenarioId: this.#selectedScenarioId,
              resultScenarioId: detail.scenario?.diagnosisScenarioId ?? null
            }
          );
        }
        const actionItems = await this.#loadActionItems(id, requestId);
        this.#detail = detail;
        this.#actionItems = actionItems;
      }
    );
  }

  refreshActionItems({
    includeClosed = this.#filters.includeClosedActionItems,
    evaluationDate = this.#filters.evaluationDate
  } = {}) {
    return this.#runAction(
      DASHBOARD_BUSY_ACTION.LOAD_ACTION_ITEMS,
      true,
      async (requestId) => {
        assertBoolean(
          includeClosed,
          ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
          "includeClosed"
        );
        this.#filters = normalizeFilters({
          ...this.#filters,
          includeClosedActionItems: includeClosed,
          evaluationDate
        });
        const resultId = this.#detail?.diagnosisResultId ??
          this.#overview?.latestDiagnosis?.diagnosisResultId ?? null;
        this.#actionItems = resultId === null
          ? []
          : await this.#loadActionItems(resultId, requestId);
      }
    );
  }

  async #loadPlans({ requestId, preserveSelection }) {
    const plans = await Promise.resolve(
      this.#listPlans.execute({
        targetMonth: this.#filters.targetMonth,
        activeOnly: this.#filters.activeOnly
      })
    );
    this.#assertCurrent(requestId);
    if (!Array.isArray(plans)) {
      throw createApplicationError(
        ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
        "Plan summary service must return an array.",
        { plans }
      );
    }
    this.#plans = plans;

    if (plans.length === 0) {
      this.#resetSelection();
      this.#viewModel.showEmpty({
        reason: DASHBOARD_EMPTY_REASON.NO_PLANS,
        message: "条件に一致するProduction Planがありません。",
        filters: this.#filters
      });
      return;
    }

    const selected = preserveSelection
      ? plans.find((plan) => plan.planId === this.#selectedPlanId) ?? plans[0]
      : plans[0];
    await this.#loadPlanContext({
      plan: selected,
      requestId,
      preferredScenarioId: preserveSelection ? this.#selectedScenarioId : null
    });
  }

  async #loadPlanContext({ plan, requestId, preferredScenarioId }) {
    this.#selectedPlanId = plan.planId;
    this.#selectedPlanVersionId = plan.latestPlanVersionId ?? null;
    this.#scenarios = [];
    this.#selectedScenarioId = null;
    this.#overview = null;
    this.#detail = null;
    this.#actionItems = [];
    this.#comparison = null;

    if (this.#selectedPlanVersionId === null) {
      return;
    }

    const scenarios = await Promise.resolve(
      this.#listScenarios.execute({
        planVersionId: this.#selectedPlanVersionId,
        activeOnly: true
      })
    );
    this.#assertCurrent(requestId);
    if (!Array.isArray(scenarios)) {
      throw createApplicationError(
        ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
        "Scenario summary service must return an array.",
        { scenarios }
      );
    }
    this.#scenarios = scenarios;
    if (scenarios.length === 0) return;

    const scenario = scenarios.find(
      (row) => row.diagnosisScenarioId === preferredScenarioId
    ) ?? scenarios[0];
    await this.#loadScenarioContext({ scenario, requestId });
  }

  async #loadScenarioContext({ scenario, requestId }) {
    this.#selectedScenarioId = scenario.diagnosisScenarioId;
    this.#detail = null;
    this.#actionItems = [];
    this.#comparison = null;
    const overview = await Promise.resolve(
      this.#getOverview.execute({
        diagnosisScenarioId: scenario.diagnosisScenarioId
      })
    );
    this.#assertCurrent(requestId);
    this.#overview = overview;
    if (this.#getScenarioComparison !== null) {
      this.#comparison = await Promise.resolve(
        this.#getScenarioComparison.execute({
          comparisonScenarioId: scenario.diagnosisScenarioId
        })
      );
      this.#assertCurrent(requestId);
    }

    const resultId = overview?.latestDiagnosis?.diagnosisResultId ?? null;
    if (resultId === null) return;

    const [detail, actionItems] = await Promise.all([
      Promise.resolve(this.#getDetail.execute({ diagnosisResultId: resultId })),
      this.#loadActionItems(resultId, requestId)
    ]);
    this.#assertCurrent(requestId);
    this.#detail = detail;
    this.#actionItems = actionItems;
  }

  async #loadActionItems(diagnosisResultId, requestId) {
    const items = await Promise.resolve(
      this.#listActionItems.execute({
        diagnosisResultId,
        includeClosed: this.#filters.includeClosedActionItems,
        evaluationDate: this.#filters.evaluationDate
      })
    );
    this.#assertCurrent(requestId);
    if (!Array.isArray(items)) {
      throw createApplicationError(
        ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
        "Action item service must return an array.",
        { items }
      );
    }
    return items;
  }

  async #runAction(action, preserveContent, work) {
    const requestId = ++this.#requestSequence;
    this.#viewModel.showLoading({ action, preserveContent });
    try {
      await work(requestId);
      if (!this.#isCurrent(requestId)) return this.#viewModel.getState();
      if (this.#viewModel.getState().screenStatus === "EMPTY") {
        return this.#viewModel.getState();
      }
      return this.#present();
    } catch (error) {
      if (!this.#isCurrent(requestId)) return this.#viewModel.getState();
      return this.#viewModel.showError(
        wrapUnexpectedError(error, {
          component: "DiagnosisBrowserController",
          action
        }),
        { preserveContent }
      );
    }
  }

  #present() {
    let contentNoticeCode = null;
    let message = null;
    if (this.#selectedPlanVersionId === null) {
      contentNoticeCode = DASHBOARD_EMPTY_REASON.NO_PLAN_VERSION;
      message = "選択したPlanにはPlan Versionがありません。";
    } else if (this.#scenarios.length === 0) {
      contentNoticeCode = DASHBOARD_EMPTY_REASON.NO_SCENARIOS;
      message = "選択したPlan VersionにはActiveなDiagnosis Scenarioがありません。";
    } else if (this.#overview?.hasDiagnosisResult === false) {
      contentNoticeCode = DASHBOARD_EMPTY_REASON.NO_DIAGNOSIS_RESULT;
      message = "このScenarioはまだ診断されていません。";
    }

    return this.#viewModel.showDashboard({
      plans: this.#plans,
      selectedPlanId: this.#selectedPlanId,
      selectedPlanVersionId: this.#selectedPlanVersionId,
      scenarios: this.#scenarios,
      selectedScenarioId: this.#selectedScenarioId,
      overview: this.#overview,
      detail: this.#detail,
      actionItems: this.#actionItems,
      comparison: this.#comparison,
      filters: this.#filters,
      contentNoticeCode,
      message
    });
  }

  #resetSelection() {
    this.#plans = [];
    this.#scenarios = [];
    this.#selectedPlanId = null;
    this.#selectedPlanVersionId = null;
    this.#selectedScenarioId = null;
    this.#overview = null;
    this.#detail = null;
    this.#actionItems = [];
    this.#comparison = null;
  }

  #assertCurrent(requestId) {
    if (!this.#isCurrent(requestId)) {
      throw createApplicationError(
        ERROR_CODES.STALE_PRESENTATION_REQUEST,
        "A newer presentation request has already started.",
        { requestId, currentRequestId: this.#requestSequence }
      );
    }
  }

  #isCurrent(requestId) {
    return requestId === this.#requestSequence;
  }
}

export function assertDiagnosisBrowserController(value) {
  const methods = [
    "getState",
    "initialize",
    "refresh",
    "selectPlan",
    "selectScenario",
    "runDiagnosis",
    "showDiagnosisResult",
    "refreshActionItems"
  ];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_BROWSER_CONTROLLER,
      "value does not satisfy the Diagnosis Browser Controller contract.",
      { methods }
    );
  }
  return value;
}
