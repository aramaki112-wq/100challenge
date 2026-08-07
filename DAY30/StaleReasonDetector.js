import {
  FIELD_IMPACT_CLASSIFICATION,
  RESULT_VALIDITY_STATUS,
  REVISION_CHANGE_TYPE,
  REVISION_SOURCE_TYPE,
  STALE_REASON_CODE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertCodeValue,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

import { assertTargetMonth } from "./DateTimeUtils.js";
import { assertDiagnosisResult } from "./DiagnosisResult.js";

const REVISION_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const IDENTIFIER_PATTERN = /^\S+$/;

const CAPACITY_REASON_BY_KEY = Object.freeze({
  capacity: STALE_REASON_CODE.CAPACITY_REVISION_CHANGED,
  capacityScenario: STALE_REASON_CODE.CAPACITY_REVISION_CHANGED,
  calendar: STALE_REASON_CODE.CALENDAR_REVISION_CHANGED,
  assignment: STALE_REASON_CODE.ASSIGNMENT_REVISION_CHANGED,
  capacityRule: STALE_REASON_CODE.CAPACITY_RULE_REVISION_CHANGED,
  equipment: STALE_REASON_CODE.EQUIPMENT_REVISION_CHANGED,
  worker: STALE_REASON_CODE.WORKER_REVISION_CHANGED,
  skill: STALE_REASON_CODE.SKILL_REVISION_CHANGED
});

const INPUT_REASON_BY_KEY = Object.freeze({
  plan: STALE_REASON_CODE.PLAN_VERSION_CHANGED,
  planVersion: STALE_REASON_CODE.PLAN_VERSION_CHANGED,
  plannedOperation: STALE_REASON_CODE.PLANNED_OPERATION_CHANGED,
  plannedOperations: STALE_REASON_CODE.PLANNED_OPERATION_CHANGED,
  assumption: STALE_REASON_CODE.ASSUMPTION_CHANGED,
  assumptions: STALE_REASON_CODE.ASSUMPTION_CHANGED,
  scenarioAssumptionRelation: STALE_REASON_CODE.ASSUMPTION_CHANGED,
  routing: STALE_REASON_CODE.ROUTING_CHANGED,
  modelCoverage: STALE_REASON_CODE.MODEL_COVERAGE_CHANGED,
  diagnosisScenario: STALE_REASON_CODE.DIAGNOSIS_SCENARIO_CHANGED
});

function freezeValue(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(freezeValue));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = freezeValue(child);
    }
    return Object.freeze(result);
  }
  return value;
}

function assertIdentifier(value, label) {
  const identifier = assertNonEmptyString(
    value,
    ERROR_CODES.INVALID_CURRENT_DIAGNOSIS_SOURCE,
    label
  );
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CURRENT_DIAGNOSIS_SOURCE,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }
  return identifier;
}

function normalizeRevision(value, label) {
  const source = assertPlainObject(
    value,
    ERROR_CODES.INVALID_SOURCE_REVISION,
    label
  );
  const entries = Object.entries(source);
  if (entries.length === 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_SOURCE_REVISION,
      `${label} must contain at least one revision.`,
      { value }
    );
  }

  const result = {};
  for (const [key, revision] of entries) {
    if (!REVISION_KEY_PATTERN.test(key)) {
      throw createDomainError(
        ERROR_CODES.INVALID_SOURCE_REVISION,
        `${label} keys must be identifier-like strings.`,
        { key }
      );
    }
    result[key] = assertNonNegativeInteger(
      revision,
      ERROR_CODES.INVALID_SOURCE_REVISION,
      `${label}.${key}`
    );
  }
  return Object.freeze(result);
}

function normalizeImpactMap(value, label) {
  const source = assertPlainObject(
    value,
    ERROR_CODES.INVALID_REVISION_IMPACT_MAP,
    label
  );
  const result = {};
  for (const [key, impact] of Object.entries(source)) {
    if (!REVISION_KEY_PATTERN.test(key)) {
      throw createDomainError(
        ERROR_CODES.INVALID_REVISION_IMPACT_MAP,
        `${label} keys must be identifier-like strings.`,
        { key }
      );
    }
    result[key] = assertCodeValue(
      impact,
      FIELD_IMPACT_CLASSIFICATION,
      ERROR_CODES.INVALID_REVISION_IMPACT_MAP,
      `${label}.${key}`
    );
  }
  return Object.freeze(result);
}

function createChange({
  sourceType,
  key,
  previousValue,
  currentValue,
  changeType,
  impactClassification,
  reasonCode
}) {
  return Object.freeze({
    sourceType,
    key,
    previousValue,
    currentValue,
    changeType,
    impactClassification,
    reasonCode
  });
}

function identityChange(key, previousValue, currentValue, reasonCode) {
  if (previousValue === currentValue) {
    return null;
  }
  return createChange({
    sourceType: REVISION_SOURCE_TYPE.SOURCE_IDENTITY,
    key,
    previousValue,
    currentValue,
    changeType: REVISION_CHANGE_TYPE.IDENTITY_CHANGED,
    impactClassification:
      FIELD_IMPACT_CLASSIFICATION.DIAGNOSIS_AFFECTING,
    reasonCode
  });
}

function compareRevisionSet({
  sourceType,
  previousRevision,
  currentRevision,
  impactByKey,
  reasonByKey,
  fallbackReason
}) {
  const changes = [];
  const keys = [...new Set([
    ...Object.keys(previousRevision),
    ...Object.keys(currentRevision)
  ])].sort();

  for (const key of keys) {
    const previousHas = Object.hasOwn(previousRevision, key);
    const currentHas = Object.hasOwn(currentRevision, key);
    const impactClassification =
      impactByKey[key] ??
      FIELD_IMPACT_CLASSIFICATION.DIAGNOSIS_AFFECTING;

    if (!previousHas || !currentHas) {
      changes.push(createChange({
        sourceType,
        key,
        previousValue: previousHas ? previousRevision[key] : null,
        currentValue: currentHas ? currentRevision[key] : null,
        changeType: currentHas
          ? REVISION_CHANGE_TYPE.KEY_ADDED
          : REVISION_CHANGE_TYPE.KEY_REMOVED,
        impactClassification,
        reasonCode: STALE_REASON_CODE.SOURCE_REVISION_SCHEMA_CHANGED
      }));
      continue;
    }

    const previousValue = previousRevision[key];
    const currentValue = currentRevision[key];
    if (previousValue === currentValue) {
      continue;
    }

    changes.push(createChange({
      sourceType,
      key,
      previousValue,
      currentValue,
      changeType: currentValue < previousValue
        ? REVISION_CHANGE_TYPE.REVISION_REGRESSION
        : REVISION_CHANGE_TYPE.VALUE_CHANGED,
      impactClassification,
      reasonCode: currentValue < previousValue
        ? STALE_REASON_CODE.SOURCE_REVISION_REGRESSION
        : (reasonByKey[key] ?? fallbackReason)
    }));
  }

  return changes;
}

function decideValidity(changes) {
  const affecting = changes.filter(
    (change) =>
      change.impactClassification ===
      FIELD_IMPACT_CLASSIFICATION.DIAGNOSIS_AFFECTING
  );

  const invalid = affecting.some((change) => [
    REVISION_CHANGE_TYPE.IDENTITY_CHANGED,
    REVISION_CHANGE_TYPE.KEY_ADDED,
    REVISION_CHANGE_TYPE.KEY_REMOVED,
    REVISION_CHANGE_TYPE.REVISION_REGRESSION
  ].includes(change.changeType));

  if (invalid) {
    return RESULT_VALIDITY_STATUS.INVALID;
  }
  if (affecting.length > 0) {
    return RESULT_VALIDITY_STATUS.STALE;
  }
  return RESULT_VALIDITY_STATUS.CURRENT;
}

/** Immutable explanation of why a saved DiagnosisResult is current, stale, or invalid. */
export class StaleReasonDetection {
  constructor({ validityStatus, reasonCodes = [], changes = [] } = {}) {
    this.validityStatus = assertCodeValue(
      validityStatus,
      RESULT_VALIDITY_STATUS,
      ERROR_CODES.INVALID_STALE_REASON_DETECTION,
      "validityStatus"
    );

    const normalizedReasons = assertArray(
      reasonCodes,
      ERROR_CODES.INVALID_STALE_REASON_DETECTION,
      "reasonCodes"
    ).map((reasonCode, index) => assertCodeValue(
      reasonCode,
      STALE_REASON_CODE,
      ERROR_CODES.INVALID_STALE_REASON_DETECTION,
      `reasonCodes[${index}]`
    ));
    this.reasonCodes = Object.freeze([...new Set(normalizedReasons)]);

    this.changes = Object.freeze(assertArray(
      changes,
      ERROR_CODES.INVALID_STALE_REASON_DETECTION,
      "changes"
    ).map((value, index) => {
      const change = assertPlainObject(
        value,
        ERROR_CODES.INVALID_STALE_REASON_DETECTION,
        `changes[${index}]`
      );
      return freezeValue({
        sourceType: assertCodeValue(
          change.sourceType,
          REVISION_SOURCE_TYPE,
          ERROR_CODES.INVALID_STALE_REASON_DETECTION,
          `changes[${index}].sourceType`
        ),
        key: assertNonEmptyString(
          change.key,
          ERROR_CODES.INVALID_STALE_REASON_DETECTION,
          `changes[${index}].key`
        ),
        previousValue: change.previousValue ?? null,
        currentValue: change.currentValue ?? null,
        changeType: assertCodeValue(
          change.changeType,
          REVISION_CHANGE_TYPE,
          ERROR_CODES.INVALID_STALE_REASON_DETECTION,
          `changes[${index}].changeType`
        ),
        impactClassification: assertCodeValue(
          change.impactClassification,
          FIELD_IMPACT_CLASSIFICATION,
          ERROR_CODES.INVALID_STALE_REASON_DETECTION,
          `changes[${index}].impactClassification`
        ),
        reasonCode: assertCodeValue(
          change.reasonCode,
          STALE_REASON_CODE,
          ERROR_CODES.INVALID_STALE_REASON_DETECTION,
          `changes[${index}].reasonCode`
        )
      });
    }));

    if (
      this.validityStatus === RESULT_VALIDITY_STATUS.CURRENT &&
      this.reasonCodes.length > 0
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_STALE_REASON_DETECTION,
        "CURRENT detection must not contain reason codes.",
        { reasonCodes: this.reasonCodes }
      );
    }
    if (
      this.validityStatus !== RESULT_VALIDITY_STATUS.CURRENT &&
      this.reasonCodes.length === 0
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_STALE_REASON_DETECTION,
        "STALE or INVALID detection requires at least one reason code.",
        { validityStatus: this.validityStatus }
      );
    }

    this.requiresRediagnosis =
      this.validityStatus !== RESULT_VALIDITY_STATUS.CURRENT;
    Object.freeze(this);
  }

  isCurrent() {
    return this.validityStatus === RESULT_VALIDITY_STATUS.CURRENT;
  }

  isStale() {
    return this.validityStatus === RESULT_VALIDITY_STATUS.STALE;
  }

  isInvalid() {
    return this.validityStatus === RESULT_VALIDITY_STATUS.INVALID;
  }

  toSnapshot() {
    return freezeValue({
      validityStatus: this.validityStatus,
      reasonCodes: this.reasonCodes,
      changes: this.changes,
      requiresRediagnosis: this.requiresRediagnosis
    });
  }
}

/** Compares the revisions captured at diagnosis time with the current sources. */
export class StaleReasonDetector {
  detect({
    diagnosisResult,
    currentDiagnosisScenarioId,
    currentPlanVersionId,
    currentCapacityScenarioId,
    currentTargetMonth,
    currentCapacitySourceRevision,
    currentDiagnosisInputRevision,
    capacityRevisionImpactByKey = {},
    diagnosisInputRevisionImpactByKey = {}
  } = {}) {
    const result = assertDiagnosisResult(diagnosisResult);

    const identities = {
      diagnosisScenarioId: assertIdentifier(
        currentDiagnosisScenarioId ?? result.diagnosisScenarioId,
        "currentDiagnosisScenarioId"
      ),
      planVersionId: assertIdentifier(
        currentPlanVersionId ?? result.planVersionId,
        "currentPlanVersionId"
      ),
      capacityScenarioId: assertIdentifier(
        currentCapacityScenarioId ?? result.capacityScenarioId,
        "currentCapacityScenarioId"
      ),
      targetMonth: assertTargetMonth(
        currentTargetMonth ?? result.targetMonth,
        ERROR_CODES.INVALID_CURRENT_DIAGNOSIS_SOURCE,
        "currentTargetMonth"
      )
    };

    const currentCapacityRevision = normalizeRevision(
      currentCapacitySourceRevision,
      "currentCapacitySourceRevision"
    );
    const currentInputRevision = normalizeRevision(
      currentDiagnosisInputRevision,
      "currentDiagnosisInputRevision"
    );
    const capacityImpact = normalizeImpactMap(
      capacityRevisionImpactByKey,
      "capacityRevisionImpactByKey"
    );
    const inputImpact = normalizeImpactMap(
      diagnosisInputRevisionImpactByKey,
      "diagnosisInputRevisionImpactByKey"
    );

    const changes = [
      identityChange(
        "diagnosisScenarioId",
        result.diagnosisScenarioId,
        identities.diagnosisScenarioId,
        STALE_REASON_CODE.DIAGNOSIS_SCENARIO_CHANGED
      ),
      identityChange(
        "planVersionId",
        result.planVersionId,
        identities.planVersionId,
        STALE_REASON_CODE.PLAN_VERSION_CHANGED
      ),
      identityChange(
        "capacityScenarioId",
        result.capacityScenarioId,
        identities.capacityScenarioId,
        STALE_REASON_CODE.CAPACITY_SCENARIO_CHANGED
      ),
      identityChange(
        "targetMonth",
        result.targetMonth,
        identities.targetMonth,
        STALE_REASON_CODE.TARGET_MONTH_CHANGED
      )
    ].filter(Boolean);

    changes.push(...compareRevisionSet({
      sourceType: REVISION_SOURCE_TYPE.CAPACITY_SOURCE,
      previousRevision: result.capacitySourceRevision,
      currentRevision: currentCapacityRevision,
      impactByKey: capacityImpact,
      reasonByKey: CAPACITY_REASON_BY_KEY,
      fallbackReason: STALE_REASON_CODE.CAPACITY_SOURCE_REVISION_CHANGED
    }));

    changes.push(...compareRevisionSet({
      sourceType: REVISION_SOURCE_TYPE.DIAGNOSIS_INPUT,
      previousRevision: result.diagnosisInputRevision,
      currentRevision: currentInputRevision,
      impactByKey: inputImpact,
      reasonByKey: INPUT_REASON_BY_KEY,
      fallbackReason: STALE_REASON_CODE.DIAGNOSIS_INPUT_REVISION_CHANGED
    }));

    const validityStatus = decideValidity(changes);
    const reasonCodes = validityStatus === RESULT_VALIDITY_STATUS.CURRENT
      ? []
      : [...new Set(
        changes
          .filter(
            (change) =>
              change.impactClassification ===
              FIELD_IMPACT_CLASSIFICATION.DIAGNOSIS_AFFECTING
          )
          .map((change) => change.reasonCode)
      )];

    return new StaleReasonDetection({
      validityStatus,
      reasonCodes,
      changes
    });
  }
}

export function assertStaleReasonDetection(value) {
  if (!(value instanceof StaleReasonDetection)) {
    throw createDomainError(
      ERROR_CODES.INVALID_STALE_REASON_DETECTION,
      "value must be a StaleReasonDetection.",
      { value }
    );
  }
  return value;
}
