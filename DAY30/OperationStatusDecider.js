import {
  ASSUMPTION_RESOLUTION_STATUS,
  CAPACITY_STATUS,
  DIAGNOSIS_STATUS,
  FINDING_CONFIRMATION_STATUS,
  MODEL_COVERAGE_STATUS,
  OPERATION_STATUS_REASON,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertBoolean,
  assertCodeValue,
  assertFiniteNumber,
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

function assertQuantity(value, label, { positive = false } = {}) {
  const number = assertFiniteNumber(
    value,
    ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
    label
  );

  if (positive ? number <= 0 : number < 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      positive
        ? `${label} must be greater than zero.`
        : `${label} must be zero or greater.`,
      { value, label }
    );
  }

  return number;
}

function normalizeAssumptionResolution(value) {
  const resolution = assertPlainObject(
    value,
    ERROR_CODES.INVALID_ASSUMPTION_RESOLUTION,
    "assumptionResolution"
  );

  const status = assertCodeValue(
    resolution.status,
    ASSUMPTION_RESOLUTION_STATUS,
    ERROR_CODES.INVALID_ASSUMPTION_RESOLUTION,
    "assumptionResolution.status"
  );

  return Object.freeze({
    ...resolution,
    status,
    hasBlockingRejected:
      resolution.hasBlockingRejected === true ||
      status === ASSUMPTION_RESOLUTION_STATUS.REJECTED,
    hasBlockingUnresolved:
      resolution.hasBlockingUnresolved === true ||
      status === ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED
  });
}

function normalizeConfirmedConstraints(values) {
  const constraints = assertArray(
    values,
    ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
    "confirmedConstraints"
  );

  const normalized = constraints.map((constraint, index) => {
    const value = assertPlainObject(
      constraint,
      ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
      `confirmedConstraints[${index}]`
    );

    const code = assertNonEmptyString(
      value.code,
      ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
      `confirmedConstraints[${index}].code`
    );

    const confirmedStatus = assertCodeValue(
      value.confirmedStatus ?? FINDING_CONFIRMATION_STATUS.CONFIRMED,
      FINDING_CONFIRMATION_STATUS,
      ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
      `confirmedConstraints[${index}].confirmedStatus`
    );

    const blocking = assertBoolean(
      value.blocking ?? true,
      ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
      `confirmedConstraints[${index}].blocking`
    );

    const preventsExecution = assertBoolean(
      value.preventsExecution ?? true,
      ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
      `confirmedConstraints[${index}].preventsExecution`
    );

    return Object.freeze({
      code,
      confirmedStatus,
      blocking,
      preventsExecution
    });
  });

  const codes = new Set();
  for (const constraint of normalized) {
    if (codes.has(constraint.code)) {
      throw createDomainError(
        ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT,
        "confirmedConstraints must not contain duplicate codes.",
        { code: constraint.code }
      );
    }
    codes.add(constraint.code);
  }

  return Object.freeze(normalized);
}

function assertCapacityQuantityConsistency({
  capacityStatus,
  plannedQuantity,
  executableQuantity
}) {
  if (
    capacityStatus === CAPACITY_STATUS.FEASIBLE &&
    executableQuantity !== plannedQuantity
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "FEASIBLE Capacity requires executableQuantity to equal plannedQuantity.",
      { capacityStatus, plannedQuantity, executableQuantity }
    );
  }

  if (
    capacityStatus === CAPACITY_STATUS.PARTIALLY_FEASIBLE &&
    !(
      executableQuantity > 0 &&
      executableQuantity < plannedQuantity
    )
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "PARTIALLY_FEASIBLE Capacity requires a positive quantity below the planned quantity.",
      { capacityStatus, plannedQuantity, executableQuantity }
    );
  }

  if (
    capacityStatus === CAPACITY_STATUS.INFEASIBLE &&
    executableQuantity !== 0
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "INFEASIBLE Capacity requires executableQuantity to be zero.",
      { capacityStatus, executableQuantity }
    );
  }
}

/**
 * Decides the final status without weakening confirmed impossibility or
 * promoting unknown blocking conditions to FEASIBLE.
 */
export class OperationStatusDecider {
  decide({
    capacityStatus,
    plannedQuantity,
    executableQuantity,
    assumptionResolution,
    routingStatus = ROUTING_STATUS.NOT_APPLICABLE,
    modelCoverageStatus = MODEL_COVERAGE_STATUS.MODELED,
    hasBlockingUnmodeledCondition = false,
    confirmedConstraints = []
  } = {}) {
    const normalizedCapacityStatus = assertCodeValue(
      capacityStatus,
      CAPACITY_STATUS,
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "capacityStatus"
    );
    const normalizedPlannedQuantity = assertQuantity(
      plannedQuantity,
      "plannedQuantity",
      { positive: true }
    );
    const normalizedExecutableQuantity = assertQuantity(
      executableQuantity,
      "executableQuantity"
    );

    if (normalizedExecutableQuantity > normalizedPlannedQuantity) {
      throw createDomainError(
        ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
        "executableQuantity must not exceed plannedQuantity.",
        {
          plannedQuantity: normalizedPlannedQuantity,
          executableQuantity: normalizedExecutableQuantity
        }
      );
    }

    assertCapacityQuantityConsistency({
      capacityStatus: normalizedCapacityStatus,
      plannedQuantity: normalizedPlannedQuantity,
      executableQuantity: normalizedExecutableQuantity
    });

    const normalizedAssumptionResolution =
      normalizeAssumptionResolution(assumptionResolution);
    const normalizedRoutingStatus = assertCodeValue(
      routingStatus,
      ROUTING_STATUS,
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "routingStatus"
    );
    const normalizedModelCoverageStatus = assertCodeValue(
      modelCoverageStatus,
      MODEL_COVERAGE_STATUS,
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "modelCoverageStatus"
    );
    const blockingUnmodeled = assertBoolean(
      hasBlockingUnmodeledCondition,
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION,
      "hasBlockingUnmodeledCondition"
    );
    const normalizedConstraints = normalizeConfirmedConstraints(
      confirmedConstraints
    );

    const blockingConfirmedConstraints = normalizedConstraints.filter(
      (constraint) =>
        constraint.blocking &&
        constraint.preventsExecution &&
        constraint.confirmedStatus ===
          FINDING_CONFIRMATION_STATUS.CONFIRMED
    );

    let status;
    let primaryReasonCode;

    if (normalizedAssumptionResolution.hasBlockingRejected) {
      status = DIAGNOSIS_STATUS.INFEASIBLE;
      primaryReasonCode =
        OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_REJECTED;
    } else if (blockingConfirmedConstraints.length > 0) {
      status = DIAGNOSIS_STATUS.INFEASIBLE;
      primaryReasonCode = OPERATION_STATUS_REASON.CONFIRMED_CONSTRAINT;
    } else if (normalizedRoutingStatus === ROUTING_STATUS.INVALID) {
      status = DIAGNOSIS_STATUS.INFEASIBLE;
      primaryReasonCode = OPERATION_STATUS_REASON.ROUTING_INVALID;
    } else if (normalizedCapacityStatus === CAPACITY_STATUS.INFEASIBLE) {
      status = DIAGNOSIS_STATUS.INFEASIBLE;
      primaryReasonCode = OPERATION_STATUS_REASON.CAPACITY_INFEASIBLE;
    } else if (
      normalizedAssumptionResolution.status ===
      ASSUMPTION_RESOLUTION_STATUS.CONFLICT
    ) {
      status = DIAGNOSIS_STATUS.UNKNOWN;
      primaryReasonCode = OPERATION_STATUS_REASON.ASSUMPTION_CONFLICT;
    } else if (normalizedAssumptionResolution.hasBlockingUnresolved) {
      status = DIAGNOSIS_STATUS.UNKNOWN;
      primaryReasonCode =
        OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_UNRESOLVED;
    } else if (normalizedCapacityStatus === CAPACITY_STATUS.UNKNOWN) {
      status = DIAGNOSIS_STATUS.UNKNOWN;
      primaryReasonCode = OPERATION_STATUS_REASON.CAPACITY_UNKNOWN;
    } else if (normalizedRoutingStatus === ROUTING_STATUS.UNKNOWN) {
      status = DIAGNOSIS_STATUS.UNKNOWN;
      primaryReasonCode = OPERATION_STATUS_REASON.ROUTING_UNKNOWN;
    } else if (
      blockingUnmodeled &&
      normalizedModelCoverageStatus !== MODEL_COVERAGE_STATUS.MODELED
    ) {
      status = DIAGNOSIS_STATUS.UNKNOWN;
      primaryReasonCode = OPERATION_STATUS_REASON.MODEL_COVERAGE_UNKNOWN;
    } else if (
      normalizedCapacityStatus === CAPACITY_STATUS.PARTIALLY_FEASIBLE
    ) {
      status = DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE;
      primaryReasonCode = OPERATION_STATUS_REASON.CAPACITY_PARTIAL;
    } else {
      status = DIAGNOSIS_STATUS.FEASIBLE;
      primaryReasonCode =
        OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED;
    }

    return freezeObject({
      status,
      primaryReasonCode,
      plannedQuantity: normalizedPlannedQuantity,
      executableQuantity: normalizedExecutableQuantity,
      shortageQuantity:
        normalizedPlannedQuantity - normalizedExecutableQuantity,
      capacityStatus: normalizedCapacityStatus,
      assumptionStatus: normalizedAssumptionResolution.status,
      routingStatus: normalizedRoutingStatus,
      modelCoverageStatus: normalizedModelCoverageStatus,
      hasBlockingUnmodeledCondition: blockingUnmodeled,
      confirmedBlockingConstraintCodes:
        blockingConfirmedConstraints.map((constraint) => constraint.code)
    });
  }
}
