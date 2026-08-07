import {
  ASSUMPTION_RESOLUTION_STATUS,
  CAPACITY_STATUS,
  DIAGNOSIS_STATUS,
  MODEL_COVERAGE_STATUS,
  OPERATION_STATUS_REASON,
  QUANTITY_UNIT,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertBoolean,
  assertCodeValue,
  assertFiniteNumber,
  assertNonEmptyString,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate,
  assertDateTime
} from "./DateTimeUtils.js";

import {
  assertConstraintFinding
} from "./ConstraintFinding.js";

import {
  assertAssumptionFinding
} from "./AssumptionFinding.js";

import {
  assertNextCheck
} from "./NextCheck.js";

const IDENTIFIER_PATTERN = /^\S+$/;

const REASONS_BY_STATUS = Object.freeze({
  [DIAGNOSIS_STATUS.FEASIBLE]: Object.freeze([
    OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED
  ]),
  [DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE]: Object.freeze([
    OPERATION_STATUS_REASON.CAPACITY_PARTIAL
  ]),
  [DIAGNOSIS_STATUS.INFEASIBLE]: Object.freeze([
    OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_REJECTED,
    OPERATION_STATUS_REASON.CONFIRMED_CONSTRAINT,
    OPERATION_STATUS_REASON.ROUTING_INVALID,
    OPERATION_STATUS_REASON.CAPACITY_INFEASIBLE
  ]),
  [DIAGNOSIS_STATUS.UNKNOWN]: Object.freeze([
    OPERATION_STATUS_REASON.ASSUMPTION_CONFLICT,
    OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_UNRESOLVED,
    OPERATION_STATUS_REASON.CAPACITY_UNKNOWN,
    OPERATION_STATUS_REASON.ROUTING_UNKNOWN,
    OPERATION_STATUS_REASON.MODEL_COVERAGE_UNKNOWN
  ])
});

function assertIdentifier(value, code, label) {
  const identifier = assertNonEmptyString(value, code, label);
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(code, `${label} must not contain whitespace.`, {
      value,
      label
    });
  }
  return identifier;
}

function optionalIdentifier(value, code, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return assertIdentifier(value, code, label);
}

function assertQuantity(value, label, { positive = false } = {}) {
  const number = assertFiniteNumber(
    value,
    ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
    label
  );

  if (positive ? number <= 0 : number < 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      positive
        ? `${label} must be greater than zero.`
        : `${label} must be zero or greater.`,
      { value, label }
    );
  }

  return number;
}

function optionalMinutes(value, label) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = assertQuantity(value, label);
  if (!Number.isInteger(number)) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      `${label} must be an integer number of minutes.`,
      { value, label }
    );
  }
  return number;
}

function normalizeTypedArray(values, assertion, label, plannedOperationId) {
  const array = assertArray(
    values,
    ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
    label
  );

  const result = array.map((value, index) => {
    const normalized = assertion(value);
    if (normalized.plannedOperationId !== plannedOperationId) {
      throw createDomainError(
        ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
        `${label}[${index}] belongs to a different Planned Operation.`,
        {
          expectedPlannedOperationId: plannedOperationId,
          actualPlannedOperationId: normalized.plannedOperationId
        }
      );
    }
    return normalized;
  });

  const ids = new Set();
  for (const item of result) {
    const id = item.findingId ?? item.nextCheckId;
    if (ids.has(id)) {
      throw createDomainError(
        ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
        `${label} must not contain duplicate IDs.`,
        { id, label }
      );
    }
    ids.add(id);
  }

  return Object.freeze([...result]);
}

function assertCapacityQuantityConsistency({
  capacityStatus,
  plannedQuantity,
  capacityExecutableQuantity
}) {
  if (
    capacityStatus === CAPACITY_STATUS.FEASIBLE &&
    capacityExecutableQuantity !== plannedQuantity
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "FEASIBLE Capacity requires the full planned quantity.",
      { capacityStatus, plannedQuantity, capacityExecutableQuantity }
    );
  }

  if (
    capacityStatus === CAPACITY_STATUS.PARTIALLY_FEASIBLE &&
    !(
      capacityExecutableQuantity > 0 &&
      capacityExecutableQuantity < plannedQuantity
    )
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "PARTIALLY_FEASIBLE Capacity requires a positive quantity below plan.",
      { capacityStatus, plannedQuantity, capacityExecutableQuantity }
    );
  }

  if (
    capacityStatus === CAPACITY_STATUS.INFEASIBLE &&
    capacityExecutableQuantity !== 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "INFEASIBLE Capacity requires zero executable quantity.",
      { capacityStatus, capacityExecutableQuantity }
    );
  }
}

function deriveDiagnosedQuantity(status, plannedQuantity, capacityExecutableQuantity) {
  if (status === DIAGNOSIS_STATUS.UNKNOWN) {
    return Object.freeze({
      diagnosedExecutableQuantity: null,
      diagnosedShortageQuantity: null
    });
  }

  if (status === DIAGNOSIS_STATUS.INFEASIBLE) {
    return Object.freeze({
      diagnosedExecutableQuantity: 0,
      diagnosedShortageQuantity: plannedQuantity
    });
  }

  return Object.freeze({
    diagnosedExecutableQuantity: capacityExecutableQuantity,
    diagnosedShortageQuantity:
      plannedQuantity - capacityExecutableQuantity
  });
}

/**
 * Immutable result for one Planned Operation.
 *
 * capacityExecutableQuantity represents what Capacity alone can process.
 * diagnosedExecutableQuantity represents the final executable quantity after
 * routing, assumptions, confirmed constraints, and model coverage are applied.
 * UNKNOWN is never converted to zero.
 */
export class OperationDiagnosisResult {
  constructor({
    operationDiagnosisResultId,
    diagnosisScenarioId,
    planVersionId,
    plannedOperationId,
    orderId,
    routingOperationId,
    factoryId = null,
    equipmentId,
    plannedDate,
    quantityUnit,
    plannedQuantity,
    capacityExecutableQuantity,
    requiredMinutes = null,
    allocatedMinutes = null,
    status,
    primaryReasonCode,
    capacityStatus,
    assumptionStatus,
    routingStatus,
    modelCoverageStatus,
    hasBlockingUnmodeledCondition = false,
    constraintFindings = [],
    assumptionFindings = [],
    nextChecks = [],
    diagnosedAt
  } = {}) {
    this.operationDiagnosisResultId = assertIdentifier(
      operationDiagnosisResultId,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "operationDiagnosisResultId"
    );
    this.diagnosisScenarioId = assertIdentifier(
      diagnosisScenarioId,
      ERROR_CODES.INVALID_DIAGNOSIS_SCENARIO_ID,
      "diagnosisScenarioId"
    );
    this.planVersionId = assertIdentifier(
      planVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "planVersionId"
    );
    this.plannedOperationId = assertIdentifier(
      plannedOperationId,
      ERROR_CODES.INVALID_PLANNED_OPERATION_ID,
      "plannedOperationId"
    );
    this.orderId = assertIdentifier(
      orderId,
      ERROR_CODES.INVALID_ORDER_ID,
      "orderId"
    );
    this.routingOperationId = assertIdentifier(
      routingOperationId,
      ERROR_CODES.INVALID_ROUTING_OPERATION_ID,
      "routingOperationId"
    );
    this.factoryId = optionalIdentifier(
      factoryId,
      ERROR_CODES.INVALID_FACTORY_ID,
      "factoryId"
    );
    this.equipmentId = assertIdentifier(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );
    this.plannedDate = assertDate(
      plannedDate,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "plannedDate"
    );
    this.quantityUnit = assertCodeValue(
      quantityUnit,
      QUANTITY_UNIT,
      ERROR_CODES.INVALID_QUANTITY_UNIT,
      "quantityUnit"
    );
    this.plannedQuantity = assertQuantity(
      plannedQuantity,
      "plannedQuantity",
      { positive: true }
    );
    this.capacityExecutableQuantity = assertQuantity(
      capacityExecutableQuantity,
      "capacityExecutableQuantity"
    );

    if (this.capacityExecutableQuantity > this.plannedQuantity) {
      throw createDomainError(
        ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
        "capacityExecutableQuantity must not exceed plannedQuantity.",
        {
          plannedQuantity: this.plannedQuantity,
          capacityExecutableQuantity: this.capacityExecutableQuantity
        }
      );
    }

    this.requiredMinutes = optionalMinutes(requiredMinutes, "requiredMinutes");
    this.allocatedMinutes = optionalMinutes(allocatedMinutes, "allocatedMinutes");

    if (
      this.requiredMinutes !== null &&
      this.allocatedMinutes !== null &&
      this.allocatedMinutes > this.requiredMinutes
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
        "allocatedMinutes must not exceed requiredMinutes.",
        {
          requiredMinutes: this.requiredMinutes,
          allocatedMinutes: this.allocatedMinutes
        }
      );
    }

    this.shortageMinutes =
      this.requiredMinutes === null || this.allocatedMinutes === null
        ? null
        : this.requiredMinutes - this.allocatedMinutes;

    this.status = assertCodeValue(
      status,
      DIAGNOSIS_STATUS,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "status"
    );
    this.primaryReasonCode = assertCodeValue(
      primaryReasonCode,
      OPERATION_STATUS_REASON,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "primaryReasonCode"
    );

    if (!REASONS_BY_STATUS[this.status].includes(this.primaryReasonCode)) {
      throw createDomainError(
        ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
        "primaryReasonCode is inconsistent with status.",
        { status: this.status, primaryReasonCode: this.primaryReasonCode }
      );
    }

    this.capacityStatus = assertCodeValue(
      capacityStatus,
      CAPACITY_STATUS,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "capacityStatus"
    );
    this.assumptionStatus = assertCodeValue(
      assumptionStatus,
      ASSUMPTION_RESOLUTION_STATUS,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "assumptionStatus"
    );
    this.routingStatus = assertCodeValue(
      routingStatus,
      ROUTING_STATUS,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "routingStatus"
    );
    this.modelCoverageStatus = assertCodeValue(
      modelCoverageStatus,
      MODEL_COVERAGE_STATUS,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "modelCoverageStatus"
    );
    this.hasBlockingUnmodeledCondition = assertBoolean(
      hasBlockingUnmodeledCondition,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "hasBlockingUnmodeledCondition"
    );

    assertCapacityQuantityConsistency({
      capacityStatus: this.capacityStatus,
      plannedQuantity: this.plannedQuantity,
      capacityExecutableQuantity: this.capacityExecutableQuantity
    });

    const diagnosedQuantity = deriveDiagnosedQuantity(
      this.status,
      this.plannedQuantity,
      this.capacityExecutableQuantity
    );
    this.diagnosedExecutableQuantity =
      diagnosedQuantity.diagnosedExecutableQuantity;
    this.diagnosedShortageQuantity =
      diagnosedQuantity.diagnosedShortageQuantity;

    this.constraintFindings = normalizeTypedArray(
      constraintFindings,
      assertConstraintFinding,
      "constraintFindings",
      this.plannedOperationId
    );
    this.assumptionFindings = normalizeTypedArray(
      assumptionFindings,
      assertAssumptionFinding,
      "assumptionFindings",
      this.plannedOperationId
    );
    this.nextChecks = normalizeTypedArray(
      nextChecks,
      assertNextCheck,
      "nextChecks",
      this.plannedOperationId
    );
    this.diagnosedAt = assertDateTime(
      diagnosedAt,
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "diagnosedAt"
    );

    Object.freeze(this);
  }

  hasOpenNextChecks() {
    return this.nextChecks.some((nextCheck) => nextCheck.isOpen());
  }

  requiresAction() {
    return this.status !== DIAGNOSIS_STATUS.FEASIBLE ||
      this.hasOpenNextChecks();
  }

  toSnapshot() {
    return Object.freeze({
      ...this,
      constraintFindings: Object.freeze(
        this.constraintFindings.map((finding) => finding.toSnapshot())
      ),
      assumptionFindings: Object.freeze(
        this.assumptionFindings.map((finding) => finding.toSnapshot())
      ),
      nextChecks: Object.freeze(
        this.nextChecks.map((nextCheck) => nextCheck.toSnapshot())
      )
    });
  }
}

export function assertOperationDiagnosisResult(value) {
  if (!(value instanceof OperationDiagnosisResult)) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_DIAGNOSIS_RESULT,
      "value must be an OperationDiagnosisResult.",
      { value }
    );
  }
  return value;
}
