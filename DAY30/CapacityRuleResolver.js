import {
  CAPACITY_RULE_RESOLUTION_STATUS,
  CAPACITY_RULE_SOURCE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertBoolean,
  assertNonEmptyString,
  assertPlainObject,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  compareDates
} from "./DateTimeUtils.js";

import {
  normalizeCapacityRuleForCalculation
} from "./CapacityCalculationUtils.js";

import {
  assertPlannedOperation
} from "./PlannedOperation.js";

export const CAPACITY_RULE_MATCH_FIELDS = Object.freeze([
  "productGroup",
  "materialGroup",
  "dimensionGroup",
  "outsideDiameter",
  "wallThickness",
  "processingType",
  "difficultyClass",
  "operationType"
]);

const INPUT_RULE_SOURCES = Object.freeze([
  CAPACITY_RULE_SOURCE.OPERATION_OVERRIDE,
  CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
  CAPACITY_RULE_SOURCE.DEFAULT_RULE
]);

const SOURCE_RANK = Object.freeze({
  [CAPACITY_RULE_SOURCE.OPERATION_OVERRIDE]: 0,
  [CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE]: 1,
  [CAPACITY_RULE_SOURCE.DEFAULT_RULE]: 2
});

function normalizeOptionalDate(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertDate(
    value,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    label
  );
}

function normalizeOptionalIdentifier(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertNonEmptyString(
    value,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    label
  );
}

function deepFreeze(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

function normalizeConditions(rule) {
  const conditions = {};

  for (const field of CAPACITY_RULE_MATCH_FIELDS) {
    const value = rule[field];

    if (value !== null && value !== undefined && value !== "") {
      conditions[field] = value;
    }
  }

  return Object.freeze(conditions);
}

function normalizeRule(rule, index) {
  const record = assertPlainObject(
    rule,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    `capacityRules[${index}]`
  );

  const capacityRuleId = assertNonEmptyString(
    record.capacityRuleId,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    `capacityRules[${index}].capacityRuleId`
  );

  const equipmentId = assertNonEmptyString(
    record.equipmentId,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    `capacityRules[${index}].equipmentId`
  );

  const source = assertNonEmptyString(
    record.source,
    ERROR_CODES.INVALID_CAPACITY_RULE,
    `capacityRules[${index}].source`
  );

  if (!INPUT_RULE_SOURCES.includes(source)) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "Capacity Rule source must be an input rule source.",
      { capacityRuleId, source }
    );
  }

  const active = record.active === undefined
    ? true
    : assertBoolean(
        record.active,
        ERROR_CODES.INVALID_CAPACITY_RULE,
        `capacityRules[${index}].active`
      );

  const validFrom = normalizeOptionalDate(
    record.validFrom,
    `capacityRules[${index}].validFrom`
  );
  const validTo = normalizeOptionalDate(
    record.validTo,
    `capacityRules[${index}].validTo`
  );

  if (
    validFrom !== null &&
    validTo !== null &&
    compareDates(validFrom, validTo) > 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "Capacity Rule validFrom must not be after validTo.",
      { capacityRuleId, validFrom, validTo }
    );
  }

  const priority = record.priority === undefined ||
    record.priority === null ||
    record.priority === ""
      ? 100
      : assertPositiveInteger(
          record.priority,
          ERROR_CODES.INVALID_CAPACITY_RULE,
          `capacityRules[${index}].priority`
        );

  const plannedOperationId = normalizeOptionalIdentifier(
    record.plannedOperationId,
    `capacityRules[${index}].plannedOperationId`
  );

  const conditions = normalizeConditions(record);
  const specificity = Object.keys(conditions).length;

  if (
    source === CAPACITY_RULE_SOURCE.OPERATION_OVERRIDE &&
    plannedOperationId === null
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "OPERATION_OVERRIDE rule requires plannedOperationId.",
      { capacityRuleId }
    );
  }

  if (
    source === CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE &&
    specificity === 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "ORDER_ATTRIBUTE rule requires at least one matching condition.",
      { capacityRuleId }
    );
  }

  if (
    source === CAPACITY_RULE_SOURCE.DEFAULT_RULE &&
    (specificity > 0 || plannedOperationId !== null)
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "DEFAULT_RULE must not contain operation-specific conditions.",
      {
        capacityRuleId,
        specificity,
        plannedOperationId
      }
    );
  }

  const calculation = normalizeCapacityRuleForCalculation(record);

  return deepFreeze({
    capacityRuleId,
    equipmentId,
    source,
    active,
    validFrom,
    validTo,
    priority,
    plannedOperationId,
    conditions,
    specificity,
    capacityValue: calculation.capacityValue,
    quantityUnit: calculation.quantityUnit,
    capacityBasis: calculation.capacityBasis,
    capacityMultiplier: calculation.capacityMultiplier,
    effectiveCapacity: calculation.effectiveCapacity
  });
}

function createContext(plannedOperation, order) {
  const operationContext = plannedOperation.toCapacityContext();
  const orderRecord = order === null || order === undefined
    ? {}
    : assertPlainObject(
        order,
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "order"
      );

  const context = {};

  for (const field of CAPACITY_RULE_MATCH_FIELDS) {
    context[field] =
      operationContext[field] ?? orderRecord[field] ?? null;
  }

  return Object.freeze(context);
}

function isEffectiveOn(rule, date) {
  if (!rule.active) {
    return false;
  }

  if (rule.validFrom !== null && compareDates(date, rule.validFrom) < 0) {
    return false;
  }

  if (rule.validTo !== null && compareDates(date, rule.validTo) > 0) {
    return false;
  }

  return true;
}

function conditionsMatch(rule, context) {
  return Object.entries(rule.conditions).every(
    ([field, expected]) => context[field] === expected
  );
}

function ruleMatches(rule, plannedOperation, context, date) {
  if (rule.equipmentId !== plannedOperation.equipmentId) {
    return false;
  }

  if (!isEffectiveOn(rule, date)) {
    return false;
  }

  if (
    rule.source === CAPACITY_RULE_SOURCE.OPERATION_OVERRIDE &&
    rule.plannedOperationId !== plannedOperation.plannedOperationId
  ) {
    return false;
  }

  return conditionsMatch(rule, context);
}

function compareCandidates(left, right) {
  return (
    SOURCE_RANK[left.source] - SOURCE_RANK[right.source] ||
    right.specificity - left.specificity ||
    left.priority - right.priority ||
    left.capacityRuleId.localeCompare(right.capacityRuleId)
  );
}

function isSameSelectionRank(left, right) {
  return (
    left.source === right.source &&
    left.specificity === right.specificity &&
    left.priority === right.priority
  );
}

function createResult({ status, capacityRule, source, candidates }) {
  return deepFreeze({
    status,
    capacityRule,
    source,
    candidates: [...candidates]
  });
}

/**
 * Planned Operationへ適用するCapacity Ruleを一件に解決する。
 * Ruleなし・同順位競合は例外で隠さず、正式な解決Statusとして返す。
 */
export class CapacityRuleResolver {
  resolve({
    plannedOperation,
    equipment,
    capacityRules,
    order = null,
    evaluatedDate = null
  } = {}) {
    const operation = assertPlannedOperation(plannedOperation);
    const equipmentRecord = assertPlainObject(
      equipment,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "equipment"
    );
    const equipmentId = assertNonEmptyString(
      equipmentRecord.equipmentId,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      "equipment.equipmentId"
    );

    if (equipmentId !== operation.equipmentId) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Planned Operation equipment and resolver equipment must match.",
        {
          plannedOperationId: operation.plannedOperationId,
          plannedEquipmentId: operation.equipmentId,
          equipmentId
        }
      );
    }

    const date = evaluatedDate === null || evaluatedDate === undefined
      ? operation.plannedDate
      : assertDate(
          evaluatedDate,
          ERROR_CODES.INVALID_CAPACITY_RULE,
          "evaluatedDate"
        );

    const ruleRecords = assertArray(
      capacityRules,
      ERROR_CODES.INVALID_CAPACITY_RULE,
      "capacityRules"
    );

    const seenIds = new Set();
    const normalizedRules = ruleRecords.map((rule, index) => {
      const normalized = normalizeRule(rule, index);

      if (seenIds.has(normalized.capacityRuleId)) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "capacityRules must not contain duplicate IDs.",
          { capacityRuleId: normalized.capacityRuleId }
        );
      }

      seenIds.add(normalized.capacityRuleId);
      return normalized;
    });

    const context = createContext(operation, order);
    const candidates = normalizedRules
      .filter((rule) =>
        ruleMatches(rule, operation, context, date)
      )
      .sort(compareCandidates);

    if (candidates.length === 0) {
      return createResult({
        status: CAPACITY_RULE_RESOLUTION_STATUS.NOT_FOUND,
        capacityRule: null,
        source: CAPACITY_RULE_SOURCE.NOT_FOUND,
        candidates: []
      });
    }

    const winner = candidates[0];
    const tied = candidates.filter((candidate) =>
      isSameSelectionRank(candidate, winner)
    );

    if (tied.length > 1) {
      return createResult({
        status: CAPACITY_RULE_RESOLUTION_STATUS.CONFLICT,
        capacityRule: null,
        source: CAPACITY_RULE_SOURCE.CONFLICT,
        candidates: tied
      });
    }

    return createResult({
      status: CAPACITY_RULE_RESOLUTION_STATUS.RESOLVED,
      capacityRule: winner,
      source: winner.source,
      candidates
    });
  }
}
