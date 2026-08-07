import {
  DIAGNOSIS_STATUS,
  RESULT_VALIDITY_STATUS,
  SCENARIO_COMPARISON_OUTCOME
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  ERROR_CATEGORY,
  ApplicationError,
  assertArray,
  assertBoolean,
  assertNonEmptyString,
  createApplicationError,
  isApplicationError
} from "./DiagnosisErrors.js";

function createCodeMap(definition) {
  return Object.freeze({ ...definition });
}

export const DASHBOARD_SCREEN_STATUS = createCodeMap({
  IDLE: "IDLE",
  LOADING: "LOADING",
  READY: "READY",
  EMPTY: "EMPTY",
  ERROR: "ERROR"
});

export const DASHBOARD_BUSY_ACTION = createCodeMap({
  INITIALIZE: "INITIALIZE",
  REFRESH: "REFRESH",
  SELECT_PLAN: "SELECT_PLAN",
  SELECT_SCENARIO: "SELECT_SCENARIO",
  RUN_DIAGNOSIS: "RUN_DIAGNOSIS",
  LOAD_DETAIL: "LOAD_DETAIL",
  LOAD_ACTION_ITEMS: "LOAD_ACTION_ITEMS"
});

export const DASHBOARD_EMPTY_REASON = createCodeMap({
  NO_PLANS: "NO_PLANS",
  NO_PLAN_VERSION: "NO_PLAN_VERSION",
  NO_SCENARIOS: "NO_SCENARIOS",
  NO_DIAGNOSIS_RESULT: "NO_DIAGNOSIS_RESULT"
});

const DIAGNOSIS_PRESENTATION = Object.freeze({
  [DIAGNOSIS_STATUS.FEASIBLE]: Object.freeze({
    label: "実行可能",
    tone: "success",
    guidance: "現在の診断条件では、計画数量を実行可能です。"
  }),
  [DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE]: Object.freeze({
    label: "一部実行可能",
    tone: "warning",
    guidance: "一部のみ実行可能です。不足量と制約を確認してください。"
  }),
  [DIAGNOSIS_STATUS.INFEASIBLE]: Object.freeze({
    label: "実行不可能",
    tone: "danger",
    guidance: "確認済みの不成立条件があります。主要理由を確認してください。"
  }),
  [DIAGNOSIS_STATUS.UNKNOWN]: Object.freeze({
    label: "判断不能",
    tone: "unknown",
    guidance: "未確認条件があります。UNKNOWNを0や実行不可能へ置き換えないでください。"
  })
});

const VALIDITY_PRESENTATION = Object.freeze({
  [RESULT_VALIDITY_STATUS.CURRENT]: Object.freeze({
    label: "最新条件で有効",
    tone: "success",
    guidance: "診断時点から、診断へ影響する変更は検出されていません。"
  }),
  [RESULT_VALIDITY_STATUS.STALE]: Object.freeze({
    label: "再診断が必要",
    tone: "warning",
    guidance: "診断後に条件が変わっています。変更理由を確認して再診断してください。"
  }),
  [RESULT_VALIDITY_STATUS.INVALID]: Object.freeze({
    label: "使用不可",
    tone: "danger",
    guidance: "対象またはRevisionに重大な不整合があります。この結果を判断に使用しないでください。"
  })
});


const COMPARISON_PRESENTATION = Object.freeze({
  [SCENARIO_COMPARISON_OUTCOME.IMPROVED]: Object.freeze({
    label: "改善", tone: "success", guidance: "基準Scenarioより成立性または不足量が改善しています。"
  }),
  [SCENARIO_COMPARISON_OUTCOME.WORSENED]: Object.freeze({
    label: "悪化", tone: "danger", guidance: "基準Scenarioより成立性または不足量が悪化しています。"
  }),
  [SCENARIO_COMPARISON_OUTCOME.UNCHANGED]: Object.freeze({
    label: "変化なし", tone: "neutral", guidance: "基準Scenarioとの差は検出されませんでした。"
  }),
  [SCENARIO_COMPARISON_OUTCOME.MIXED]: Object.freeze({
    label: "改善・悪化が混在", tone: "warning", guidance: "Operationごとに改善と悪化が混在しています。"
  }),
  [SCENARIO_COMPARISON_OUTCOME.UNCERTAIN]: Object.freeze({
    label: "比較判断不能", tone: "unknown", guidance: "UNKNOWNを含むため改善・悪化を断定できません。"
  }),
  [SCENARIO_COMPARISON_OUTCOME.NOT_COMPARABLE]: Object.freeze({
    label: "比較不可", tone: "danger", guidance: "INVALIDな診断結果が含まれるため比較に使用できません。"
  })
});

function deepFreeze(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(deepFreeze));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = deepFreeze(child);
    }
    return Object.freeze(result);
  }
  return value;
}

function codeValue(value, codeMap, label) {
  if (!Object.values(codeMap).includes(value)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      `${label} is invalid.`,
      { value, allowed: Object.values(codeMap) }
    );
  }
  return value;
}

function optionalIdentifier(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const id = assertNonEmptyString(
    value,
    ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
    label
  );
  if (/\s/.test(id)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      `${label} must not contain whitespace.`,
      { value }
    );
  }
  return id;
}

function normalizeFilters(filters = {}) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "filters must be an object.",
      { filters }
    );
  }
  return {
    targetMonth: filters.targetMonth ?? null,
    activeOnly: filters.activeOnly ?? true,
    includeClosedActionItems: filters.includeClosedActionItems ?? false,
    evaluationDate: filters.evaluationDate ?? null
  };
}

function errorPresentation(error) {
  const normalized = isApplicationError(error)
    ? error
    : new ApplicationError(
        ERROR_CODES.UNEXPECTED_ERROR,
        "An unexpected error occurred.",
        {
          category: ERROR_CATEGORY.UNEXPECTED,
          details: {}
        }
      );
  return {
    code: normalized.code,
    category: normalized.category,
    message: normalized.message,
    details: normalized.details
  };
}

function statusPresentation(status) {
  if (status === null || status === undefined) return null;
  const presentation = DIAGNOSIS_PRESENTATION[status];
  if (!presentation) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "Unknown diagnosis status in dashboard data.",
      { status }
    );
  }
  return { status, ...presentation };
}

function validityPresentation(status) {
  if (status === null || status === undefined) return null;
  const presentation = VALIDITY_PRESENTATION[status];
  if (!presentation) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "Unknown result validity status in dashboard data.",
      { status }
    );
  }
  return { status, ...presentation };
}


function comparisonPresentation(comparison) {
  if (comparison?.comparisonAvailable !== true) return null;
  const outcome = comparison.comparison?.outcome ?? null;
  const presentation = COMPARISON_PRESENTATION[outcome];
  if (!presentation) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "Unknown Scenario comparison outcome in dashboard data.",
      { outcome }
    );
  }
  return { outcome, ...presentation };
}

function initialContent() {
  return {
    filters: normalizeFilters(),
    plans: [],
    selectedPlanId: null,
    selectedPlanVersionId: null,
    scenarios: [],
    selectedScenarioId: null,
    overview: null,
    selectedDiagnosisResultId: null,
    detail: null,
    actionItems: [],
    comparison: null,
    diagnosisBadge: null,
    comparisonBadge: null,
    validityBadge: null,
    canRunDiagnosis: false,
    canShowDetail: false,
    requiresAttention: false,
    contentNoticeCode: null,
    message: null
  };
}

export class DiagnosisDashboardViewModel {
  #state;
  #revision = 0;

  constructor() {
    this.#state = deepFreeze({
      screenStatus: DASHBOARD_SCREEN_STATUS.IDLE,
      busyAction: null,
      revision: this.#revision,
      error: null,
      emptyReasonCode: null,
      ...initialContent()
    });
    Object.freeze(this);
  }

  getState() {
    return this.#state;
  }

  showLoading({ action, preserveContent = true } = {}) {
    const busyAction = codeValue(action, DASHBOARD_BUSY_ACTION, "action");
    assertBoolean(
      preserveContent,
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "preserveContent"
    );
    const content = preserveContent ? this.#contentFromState() : initialContent();
    return this.#replace({
      screenStatus: DASHBOARD_SCREEN_STATUS.LOADING,
      busyAction,
      error: null,
      emptyReasonCode: null,
      ...content
    });
  }

  showDashboard({
    plans = [],
    selectedPlanId = null,
    selectedPlanVersionId = null,
    scenarios = [],
    selectedScenarioId = null,
    overview = null,
    detail = null,
    actionItems = [],
    comparison = null,
    filters = {},
    contentNoticeCode = null,
    message = null
  } = {}) {
    assertArray(plans, ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL, "plans");
    assertArray(scenarios, ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL, "scenarios");
    assertArray(actionItems, ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL, "actionItems");

    const planId = optionalIdentifier(selectedPlanId, "selectedPlanId");
    const planVersionId = optionalIdentifier(
      selectedPlanVersionId,
      "selectedPlanVersionId"
    );
    const scenarioId = optionalIdentifier(selectedScenarioId, "selectedScenarioId");

    if (planId !== null && !plans.some((plan) => plan.planId === planId)) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DASHBOARD_SELECTION,
        "selectedPlanId is not included in plans.",
        { selectedPlanId: planId }
      );
    }
    if (
      scenarioId !== null &&
      !scenarios.some((scenario) => scenario.diagnosisScenarioId === scenarioId)
    ) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DASHBOARD_SELECTION,
        "selectedScenarioId is not included in scenarios.",
        { selectedScenarioId: scenarioId }
      );
    }

    const latestDiagnosis = overview?.latestDiagnosis ?? null;
    const detailResultId = detail?.diagnosisResultId ?? null;
    const latestResultId = latestDiagnosis?.diagnosisResultId ?? null;
    const selectedDiagnosisResultId = detailResultId ?? latestResultId;

    if (
      detail !== null &&
      scenarioId !== null &&
      detail.scenario?.diagnosisScenarioId !== scenarioId
    ) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DASHBOARD_SELECTION,
        "Diagnosis detail does not belong to selected Scenario.",
        {
          selectedScenarioId: scenarioId,
          detailScenarioId: detail.scenario?.diagnosisScenarioId ?? null
        }
      );
    }

    if (
      comparison?.comparisonAvailable === true &&
      scenarioId !== null &&
      comparison.comparisonScenarioId !== scenarioId
    ) {
      throw createApplicationError(
        ERROR_CODES.INVALID_DASHBOARD_SELECTION,
        "Scenario comparison does not belong to selected Scenario.",
        { selectedScenarioId: scenarioId, comparisonScenarioId: comparison.comparisonScenarioId }
      );
    }

    const diagnosisBadge = statusPresentation(
      detail?.metadata?.status ?? latestDiagnosis?.status ?? null
    );
    const validityBadge = validityPresentation(
      detail?.metadata?.validityStatus ?? latestDiagnosis?.validityStatus ?? null
    );
    const comparisonBadge = comparisonPresentation(comparison);
    const requiresActionOperationCount =
      detail?.summary?.requiresActionOperationCount ??
      latestDiagnosis?.requiresActionOperationCount ??
      0;

    return this.#replace({
      screenStatus: DASHBOARD_SCREEN_STATUS.READY,
      busyAction: null,
      error: null,
      emptyReasonCode: null,
      filters: normalizeFilters(filters),
      plans,
      selectedPlanId: planId,
      selectedPlanVersionId: planVersionId,
      scenarios,
      selectedScenarioId: scenarioId,
      overview,
      selectedDiagnosisResultId,
      detail,
      actionItems,
      comparison,
      diagnosisBadge,
      comparisonBadge,
      validityBadge,
      canRunDiagnosis: scenarioId !== null,
      canShowDetail: selectedDiagnosisResultId !== null,
      requiresAttention:
        requiresActionOperationCount > 0 ||
        actionItems.some((item) => item.overdue === true),
      contentNoticeCode,
      message
    });
  }

  showEmpty({ reason, message = null, filters = {} } = {}) {
    const emptyReasonCode = codeValue(
      reason,
      DASHBOARD_EMPTY_REASON,
      "reason"
    );
    return this.#replace({
      screenStatus: DASHBOARD_SCREEN_STATUS.EMPTY,
      busyAction: null,
      error: null,
      emptyReasonCode,
      ...initialContent(),
      filters: normalizeFilters(filters),
      message
    });
  }

  showError(error, { preserveContent = true } = {}) {
    assertBoolean(
      preserveContent,
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "preserveContent"
    );
    const content = preserveContent ? this.#contentFromState() : initialContent();
    return this.#replace({
      screenStatus: DASHBOARD_SCREEN_STATUS.ERROR,
      busyAction: null,
      error: errorPresentation(error),
      emptyReasonCode: null,
      ...content
    });
  }

  #contentFromState() {
    const {
      filters,
      plans,
      selectedPlanId,
      selectedPlanVersionId,
      scenarios,
      selectedScenarioId,
      overview,
      selectedDiagnosisResultId,
      detail,
      actionItems,
      comparison,
      diagnosisBadge,
      comparisonBadge,
      validityBadge,
      canRunDiagnosis,
      canShowDetail,
      requiresAttention,
      contentNoticeCode,
      message
    } = this.#state;
    return {
      filters,
      plans,
      selectedPlanId,
      selectedPlanVersionId,
      scenarios,
      selectedScenarioId,
      overview,
      selectedDiagnosisResultId,
      detail,
      actionItems,
      comparison,
      diagnosisBadge,
      comparisonBadge,
      validityBadge,
      canRunDiagnosis,
      canShowDetail,
      requiresAttention,
      contentNoticeCode,
      message
    };
  }

  #replace(next) {
    this.#revision += 1;
    this.#state = deepFreeze({
      ...next,
      revision: this.#revision
    });
    return this.#state;
  }
}

export function assertDiagnosisDashboardViewModel(value) {
  const requiredMethods = [
    "getState",
    "showLoading",
    "showDashboard",
    "showEmpty",
    "showError"
  ];
  if (
    value === null ||
    typeof value !== "object" ||
    requiredMethods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DASHBOARD_VIEW_MODEL,
      "dashboardViewModel does not satisfy the required contract.",
      { requiredMethods }
    );
  }
  return value;
}
