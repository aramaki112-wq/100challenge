import {
  ROUTING_CHECK_DIRECTION,
  ROUTING_CHECK_REASON,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertNonEmptyString,
  assertPlainObject,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  compareDates,
  compareTimes
} from "./DateTimeUtils.js";

import {
  assertPlannedOperation
} from "./PlannedOperation.js";

const IDENTIFIER_PATTERN = /^\S+$/;

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

function assertIdentifier(value, label, code) {
  const identifier = assertNonEmptyString(value, code, label);

  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createDomainError(
      code,
      `${label} must not contain whitespace.`,
      { value, label }
    );
  }

  return identifier;
}

function normalizeOptionalIdentifier(value, label, code) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return assertIdentifier(value, label, code);
}

function normalizeRoutingDefinitions(values) {
  const definitions = assertArray(
    values,
    ERROR_CODES.INVALID_ROUTING_DEFINITION,
    "routingOperations"
  ).map((definition, index) => {
    const value = assertPlainObject(
      definition,
      ERROR_CODES.INVALID_ROUTING_DEFINITION,
      `routingOperations[${index}]`
    );

    return Object.freeze({
      routingOperationId: assertIdentifier(
        value.routingOperationId,
        `routingOperations[${index}].routingOperationId`,
        ERROR_CODES.INVALID_ROUTING_DEFINITION
      ),
      routingId: normalizeOptionalIdentifier(
        value.routingId,
        `routingOperations[${index}].routingId`,
        ERROR_CODES.INVALID_ROUTING_DEFINITION
      ),
      sequence: assertPositiveInteger(
        value.sequence,
        ERROR_CODES.INVALID_ROUTING_DEFINITION,
        `routingOperations[${index}].sequence`
      )
    });
  });

  const ids = new Set();
  for (const definition of definitions) {
    if (ids.has(definition.routingOperationId)) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "routingOperations contains duplicate routingOperationId values.",
        { routingOperationId: definition.routingOperationId }
      );
    }
    ids.add(definition.routingOperationId);
  }

  return Object.freeze(definitions);
}

function normalizeShiftDefinitions(values) {
  const definitions = assertArray(
    values,
    ERROR_CODES.INVALID_SHIFT_SEQUENCE,
    "shifts"
  ).map((definition, index) => {
    const value = assertPlainObject(
      definition,
      ERROR_CODES.INVALID_SHIFT_SEQUENCE,
      `shifts[${index}]`
    );

    return Object.freeze({
      shiftId: assertIdentifier(
        value.shiftId,
        `shifts[${index}].shiftId`,
        ERROR_CODES.INVALID_SHIFT_SEQUENCE
      ),
      sequence: assertPositiveInteger(
        value.sequence,
        ERROR_CODES.INVALID_SHIFT_SEQUENCE,
        `shifts[${index}].sequence`
      )
    });
  });

  const ids = new Set();
  for (const definition of definitions) {
    if (ids.has(definition.shiftId)) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "shifts contains duplicate shiftId values.",
        { shiftId: definition.shiftId }
      );
    }
    ids.add(definition.shiftId);
  }

  return Object.freeze(definitions);
}

function normalizePlannedOperations(values) {
  const operations = assertArray(
    values,
    ERROR_CODES.INVALID_ROUTING_DIAGNOSIS,
    "plannedOperations"
  ).map(assertPlannedOperation);

  const ids = new Set();
  for (const operation of operations) {
    if (ids.has(operation.plannedOperationId)) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "plannedOperations contains duplicate Planned Operation IDs.",
        { plannedOperationId: operation.plannedOperationId }
      );
    }
    ids.add(operation.plannedOperationId);
  }

  return Object.freeze(operations);
}

function scheduleSnapshot(operation) {
  return Object.freeze({
    plannedOperationId: operation.plannedOperationId,
    routingOperationId: operation.routingOperationId,
    plannedDate: operation.plannedDate,
    shiftId: operation.shiftId,
    plannedStartTime: operation.plannedStartTime,
    plannedEndTime: operation.plannedEndTime
  });
}

function resolveShiftComparison(current, adjacent, shiftById) {
  if (current.shiftId === null || adjacent.shiftId === null) {
    return null;
  }

  const currentShift = shiftById.get(current.shiftId);
  const adjacentShift = shiftById.get(adjacent.shiftId);

  if (!currentShift || !adjacentShift) {
    return null;
  }

  if (adjacentShift.sequence < currentShift.sequence) {
    return -1;
  }

  if (adjacentShift.sequence > currentShift.sequence) {
    return 1;
  }

  return 0;
}

function checkPrevious(current, previous, shiftById) {
  const dateComparison = compareDates(
    previous.plannedDate,
    current.plannedDate
  );

  if (dateComparison < 0) {
    return {
      status: ROUTING_STATUS.VALID,
      reasonCode:
        ROUTING_CHECK_REASON.PREVIOUS_OPERATION_ON_EARLIER_DATE
    };
  }

  if (dateComparison > 0) {
    return {
      status: ROUTING_STATUS.INVALID,
      reasonCode:
        ROUTING_CHECK_REASON.PREVIOUS_OPERATION_PLANNED_AFTER_CURRENT
    };
  }

  if (
    previous.plannedEndTime !== null &&
    current.plannedStartTime !== null
  ) {
    if (
      compareTimes(
        previous.plannedEndTime,
        current.plannedStartTime
      ) <= 0
    ) {
      return {
        status: ROUTING_STATUS.VALID,
        reasonCode:
          ROUTING_CHECK_REASON.PREVIOUS_OPERATION_ENDS_BEFORE_CURRENT
      };
    }

    return {
      status: ROUTING_STATUS.INVALID,
      reasonCode:
        ROUTING_CHECK_REASON.PREVIOUS_OPERATION_OVERLAPS_CURRENT
    };
  }

  const shiftComparison = resolveShiftComparison(
    current,
    previous,
    shiftById
  );

  if (shiftComparison < 0) {
    return {
      status: ROUTING_STATUS.VALID,
      reasonCode:
        ROUTING_CHECK_REASON.PREVIOUS_SHIFT_BEFORE_CURRENT
    };
  }

  if (shiftComparison > 0) {
    return {
      status: ROUTING_STATUS.INVALID,
      reasonCode:
        ROUTING_CHECK_REASON.PREVIOUS_SHIFT_AFTER_CURRENT
    };
  }

  return {
    status: ROUTING_STATUS.UNKNOWN,
    reasonCode:
      ROUTING_CHECK_REASON.SAME_DAY_SEQUENCE_UNCONFIRMED
  };
}

function checkNext(current, next, shiftById) {
  const dateComparison = compareDates(
    next.plannedDate,
    current.plannedDate
  );

  if (dateComparison > 0) {
    return {
      status: ROUTING_STATUS.VALID,
      reasonCode:
        ROUTING_CHECK_REASON.NEXT_OPERATION_ON_LATER_DATE
    };
  }

  if (dateComparison < 0) {
    return {
      status: ROUTING_STATUS.INVALID,
      reasonCode:
        ROUTING_CHECK_REASON.NEXT_OPERATION_PLANNED_BEFORE_CURRENT
    };
  }

  if (
    current.plannedEndTime !== null &&
    next.plannedStartTime !== null
  ) {
    if (
      compareTimes(
        current.plannedEndTime,
        next.plannedStartTime
      ) <= 0
    ) {
      return {
        status: ROUTING_STATUS.VALID,
        reasonCode:
          ROUTING_CHECK_REASON.NEXT_OPERATION_STARTS_AFTER_CURRENT
      };
    }

    return {
      status: ROUTING_STATUS.INVALID,
      reasonCode:
        ROUTING_CHECK_REASON.NEXT_OPERATION_OVERLAPS_CURRENT
    };
  }

  const shiftComparison = resolveShiftComparison(
    current,
    next,
    shiftById
  );

  if (shiftComparison > 0) {
    return {
      status: ROUTING_STATUS.VALID,
      reasonCode:
        ROUTING_CHECK_REASON.NEXT_SHIFT_AFTER_CURRENT
    };
  }

  if (shiftComparison < 0) {
    return {
      status: ROUTING_STATUS.INVALID,
      reasonCode:
        ROUTING_CHECK_REASON.NEXT_SHIFT_BEFORE_CURRENT
    };
  }

  return {
    status: ROUTING_STATUS.UNKNOWN,
    reasonCode:
      ROUTING_CHECK_REASON.SAME_DAY_SEQUENCE_UNCONFIRMED
  };
}

function aggregateStatus(checks) {
  if (checks.length === 0) {
    return ROUTING_STATUS.NOT_APPLICABLE;
  }

  if (checks.some((check) => check.status === ROUTING_STATUS.INVALID)) {
    return ROUTING_STATUS.INVALID;
  }

  if (checks.some((check) => check.status === ROUTING_STATUS.UNKNOWN)) {
    return ROUTING_STATUS.UNKNOWN;
  }

  return ROUTING_STATUS.VALID;
}

function missingAdjacentCheck(direction, definition, current) {
  return freezeObject({
    direction,
    adjacentRoutingOperationId: definition.routingOperationId,
    adjacentPlannedOperationId: null,
    status: ROUTING_STATUS.UNKNOWN,
    reasonCode: ROUTING_CHECK_REASON.ADJACENT_OPERATION_NOT_PLANNED,
    currentSchedule: scheduleSnapshot(current),
    adjacentSchedule: null
  });
}

/**
 * Diagnoses only plan-order consistency. It does not infer completion,
 * transport, or material availability from routing order alone.
 */
export class RoutingDiagnosisService {
  diagnose({
    plannedOperation,
    plannedOperations = [],
    routingOperations = [],
    shifts = []
  } = {}) {
    const current = assertPlannedOperation(plannedOperation);
    const operations = normalizePlannedOperations(plannedOperations);
    const definitions = normalizeRoutingDefinitions(routingOperations);
    const shiftDefinitions = normalizeShiftDefinitions(shifts);
    const shiftById = new Map(
      shiftDefinitions.map((shift) => [shift.shiftId, shift])
    );

    const currentDefinition = definitions.find(
      (definition) =>
        definition.routingOperationId === current.routingOperationId
    );

    if (!currentDefinition) {
      return freezeObject({
        status: ROUTING_STATUS.UNKNOWN,
        plannedOperationId: current.plannedOperationId,
        routingOperationId: current.routingOperationId,
        checks: [],
        reasonCodes: [
          ROUTING_CHECK_REASON.ROUTING_DEFINITION_NOT_FOUND
        ],
        hasPreviousRequirement: false,
        hasNextRequirement: false
      });
    }

    const sameRoutingDefinitions = definitions
      .filter((definition) =>
        definition.routingId === currentDefinition.routingId
      )
      .sort((left, right) =>
        left.sequence - right.sequence ||
        left.routingOperationId.localeCompare(right.routingOperationId)
      );

    const sequences = new Set();
    for (const definition of sameRoutingDefinitions) {
      if (sequences.has(definition.sequence)) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "Routing sequence must be unique within one routing.",
          {
            routingId: currentDefinition.routingId,
            sequence: definition.sequence
          }
        );
      }
      sequences.add(definition.sequence);
    }

    const currentIndex = sameRoutingDefinitions.findIndex(
      (definition) =>
        definition.routingOperationId === current.routingOperationId
    );

    const previousDefinition =
      currentIndex > 0
        ? sameRoutingDefinitions[currentIndex - 1]
        : null;
    const nextDefinition =
      currentIndex < sameRoutingDefinitions.length - 1
        ? sameRoutingDefinitions[currentIndex + 1]
        : null;

    const relevantOperations = operations.filter(
      (operation) =>
        operation.planVersionId === current.planVersionId &&
        operation.orderId === current.orderId &&
        operation.plannedOperationId !== current.plannedOperationId
    );

    const findAdjacentOperation = (definition) => {
      const matches = relevantOperations.filter(
        (operation) =>
          operation.routingOperationId ===
          definition.routingOperationId
      );

      if (matches.length > 1) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "One Order contains multiple Planned Operations for one routing step.",
          {
            orderId: current.orderId,
            routingOperationId: definition.routingOperationId,
            plannedOperationIds: matches.map(
              (operation) => operation.plannedOperationId
            )
          }
        );
      }

      return matches[0] ?? null;
    };

    const checks = [];

    if (previousDefinition !== null) {
      const previous = findAdjacentOperation(previousDefinition);

      if (previous === null) {
        checks.push(
          missingAdjacentCheck(
            ROUTING_CHECK_DIRECTION.PREVIOUS,
            previousDefinition,
            current
          )
        );
      } else {
        const decision = checkPrevious(current, previous, shiftById);
        checks.push(freezeObject({
          direction: ROUTING_CHECK_DIRECTION.PREVIOUS,
          adjacentRoutingOperationId:
            previousDefinition.routingOperationId,
          adjacentPlannedOperationId:
            previous.plannedOperationId,
          status: decision.status,
          reasonCode: decision.reasonCode,
          currentSchedule: scheduleSnapshot(current),
          adjacentSchedule: scheduleSnapshot(previous)
        }));
      }
    }

    if (nextDefinition !== null) {
      const next = findAdjacentOperation(nextDefinition);

      if (next === null) {
        checks.push(
          missingAdjacentCheck(
            ROUTING_CHECK_DIRECTION.NEXT,
            nextDefinition,
            current
          )
        );
      } else {
        const decision = checkNext(current, next, shiftById);
        checks.push(freezeObject({
          direction: ROUTING_CHECK_DIRECTION.NEXT,
          adjacentRoutingOperationId:
            nextDefinition.routingOperationId,
          adjacentPlannedOperationId: next.plannedOperationId,
          status: decision.status,
          reasonCode: decision.reasonCode,
          currentSchedule: scheduleSnapshot(current),
          adjacentSchedule: scheduleSnapshot(next)
        }));
      }
    }

    const status = aggregateStatus(checks);

    return freezeObject({
      status,
      plannedOperationId: current.plannedOperationId,
      routingOperationId: current.routingOperationId,
      checks,
      reasonCodes: [...new Set(
        checks.map((check) => check.reasonCode)
      )],
      hasPreviousRequirement: previousDefinition !== null,
      hasNextRequirement: nextDefinition !== null
    });
  }
}
