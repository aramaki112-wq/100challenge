import {
  ASSUMPTION_TYPE,
  CONDITION_COVERAGE_TYPE,
  MODEL_COVERAGE_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertBoolean,
  assertCodeValue,
  assertNonEmptyString,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

function freezeObject(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(freezeObject));
  }

  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = freezeObject(child);
    }
    return Object.freeze(result);
  }

  return value;
}

function normalizeOptionalText(value, label) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value !== "string") {
    throw createDomainError(
      ERROR_CODES.INVALID_MODEL_CONDITION,
      `${label} must be a string.`,
      { value, label }
    );
  }

  return value.trim();
}

function normalizeCondition(value, index) {
  const condition = assertPlainObject(
    value,
    ERROR_CODES.INVALID_MODEL_CONDITION,
    `requiredConditions[${index}]`
  );

  const conditionCode = assertNonEmptyString(
    condition.conditionCode,
    ERROR_CODES.INVALID_MODEL_CONDITION,
    `requiredConditions[${index}].conditionCode`
  );
  const description = assertNonEmptyString(
    condition.description,
    ERROR_CODES.INVALID_MODEL_CONDITION,
    `requiredConditions[${index}].description`
  );
  const coverageType = assertCodeValue(
    condition.coverageType,
    CONDITION_COVERAGE_TYPE,
    ERROR_CODES.INVALID_MODEL_CONDITION,
    `requiredConditions[${index}].coverageType`
  );
  const blocking = assertBoolean(
    condition.blocking ?? true,
    ERROR_CODES.INVALID_MODEL_CONDITION,
    `requiredConditions[${index}].blocking`
  );

  let modelElement = normalizeOptionalText(
    condition.modelElement,
    `requiredConditions[${index}].modelElement`
  );
  let assumptionType = condition.assumptionType ?? null;
  let unmodeledReason = normalizeOptionalText(
    condition.unmodeledReason,
    `requiredConditions[${index}].unmodeledReason`
  );

  if (coverageType === CONDITION_COVERAGE_TYPE.DIRECT_MODEL) {
    modelElement = assertNonEmptyString(
      modelElement,
      ERROR_CODES.INVALID_MODEL_CONDITION,
      `requiredConditions[${index}].modelElement`
    );
    assumptionType = null;
    unmodeledReason = "";
  }

  if (coverageType === CONDITION_COVERAGE_TYPE.ASSUMPTION) {
    assumptionType = assertCodeValue(
      assumptionType,
      ASSUMPTION_TYPE,
      ERROR_CODES.INVALID_MODEL_CONDITION,
      `requiredConditions[${index}].assumptionType`
    );
    modelElement = "";
    unmodeledReason = "";
  }

  if (coverageType === CONDITION_COVERAGE_TYPE.UNMODELED) {
    unmodeledReason = assertNonEmptyString(
      unmodeledReason,
      ERROR_CODES.INVALID_MODEL_CONDITION,
      `requiredConditions[${index}].unmodeledReason`
    );
    modelElement = "";
    assumptionType = null;
  }

  return Object.freeze({
    conditionCode,
    description,
    coverageType,
    blocking,
    modelElement,
    assumptionType,
    unmodeledReason
  });
}

function decideCoverageStatus(conditions) {
  if (conditions.length === 0) {
    return MODEL_COVERAGE_STATUS.MODELED;
  }

  if (
    conditions.every(
      (condition) =>
        condition.coverageType ===
        CONDITION_COVERAGE_TYPE.DIRECT_MODEL
    )
  ) {
    return MODEL_COVERAGE_STATUS.MODELED;
  }

  if (
    conditions.every(
      (condition) =>
        condition.coverageType ===
        CONDITION_COVERAGE_TYPE.UNMODELED
    )
  ) {
    return MODEL_COVERAGE_STATUS.UNMODELED;
  }

  return MODEL_COVERAGE_STATUS.PARTIALLY_MODELED;
}

/**
 * Describes whether a required condition is checked directly by the model,
 * delegated to explicit Assumption management, or outside the current model.
 */
export class ModelCoverageEvaluator {
  evaluate({ requiredConditions = [] } = {}) {
    const conditions = assertArray(
      requiredConditions,
      ERROR_CODES.INVALID_MODEL_COVERAGE_EVALUATION,
      "requiredConditions"
    ).map(normalizeCondition);

    const codes = new Set();
    for (const condition of conditions) {
      if (codes.has(condition.conditionCode)) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "requiredConditions contains duplicate conditionCode values.",
          { conditionCode: condition.conditionCode }
        );
      }
      codes.add(condition.conditionCode);
    }

    const directlyModeledConditions = conditions.filter(
      (condition) =>
        condition.coverageType ===
        CONDITION_COVERAGE_TYPE.DIRECT_MODEL
    );
    const assumptionDependentConditions = conditions.filter(
      (condition) =>
        condition.coverageType ===
        CONDITION_COVERAGE_TYPE.ASSUMPTION
    );
    const unmodeledConditions = conditions.filter(
      (condition) =>
        condition.coverageType ===
        CONDITION_COVERAGE_TYPE.UNMODELED
    );
    const blockingUnmodeledConditions = unmodeledConditions.filter(
      (condition) => condition.blocking
    );

    return freezeObject({
      status: decideCoverageStatus(conditions),
      totalConditionCount: conditions.length,
      directlyModeledConditionCount: directlyModeledConditions.length,
      assumptionDependentConditionCount:
        assumptionDependentConditions.length,
      unmodeledConditionCount: unmodeledConditions.length,
      conditions,
      directlyModeledConditions,
      assumptionDependentConditions,
      unmodeledConditions,
      directlyModeledConditionCodes: directlyModeledConditions.map(
        (condition) => condition.conditionCode
      ),
      assumptionDependentConditionCodes:
        assumptionDependentConditions.map(
          (condition) => condition.conditionCode
        ),
      unmodeledConditionCodes: unmodeledConditions.map(
        (condition) => condition.conditionCode
      ),
      blockingUnmodeledConditionCodes:
        blockingUnmodeledConditions.map(
          (condition) => condition.conditionCode
        ),
      hasAssumptionDependentCondition:
        assumptionDependentConditions.length > 0,
      hasBlockingUnmodeledCondition:
        blockingUnmodeledConditions.length > 0
    });
  }
}
