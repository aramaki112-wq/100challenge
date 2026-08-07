import {
  ASSUMPTION_EFFECTIVE_STATUS,
  ASSUMPTION_RESOLUTION_STATUS,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDate
} from "./DateTimeUtils.js";

import {
  assertAssumption
} from "./Assumption.js";

import {
  assertDiagnosisScenario
} from "./DiagnosisScenario.js";

import {
  assertPlannedOperation
} from "./PlannedOperation.js";

import {
  assertScenarioAssumptionRelation
} from "./ScenarioAssumptionRelation.js";

const TARGET_MATCH_STATUS = Object.freeze({
  MATCH: "MATCH",
  NO_MATCH: "NO_MATCH",
  CONTEXT_MISSING: "CONTEXT_MISSING"
});

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeObject(value) {
  if (Array.isArray(value)) {
    return freezeArray(value.map(freezeObject));
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = freezeObject(child);
    }
    return Object.freeze(result);
  }

  return value;
}

function assertUniqueBy(values, getKey, label) {
  const seen = new Set();

  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        `${label} contains a duplicate key.`,
        { label, key }
      );
    }
    seen.add(key);
  }
}

function getContextValue(targetType, operation, targetContext) {
  switch (targetType) {
    case ASSUMPTION_TARGET_TYPE.PRODUCTION_PLAN:
      return targetContext.productionPlanId ?? null;

    case ASSUMPTION_TARGET_TYPE.PLAN_VERSION:
      return operation.planVersionId;

    case ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION:
      return operation.plannedOperationId;

    case ASSUMPTION_TARGET_TYPE.ORDER:
      return operation.orderId;

    case ASSUMPTION_TARGET_TYPE.ROUTING_OPERATION:
      return operation.routingOperationId;

    case ASSUMPTION_TARGET_TYPE.FACTORY:
      return targetContext.factoryId ?? null;

    case ASSUMPTION_TARGET_TYPE.PROCESS:
      return targetContext.processId ?? null;

    case ASSUMPTION_TARGET_TYPE.EQUIPMENT:
      return operation.equipmentId;

    case ASSUMPTION_TARGET_TYPE.SHIFT:
      return operation.shiftId;

    case ASSUMPTION_TARGET_TYPE.WORKER:
      return targetContext.workerIds ?? targetContext.workerId ?? null;

    case ASSUMPTION_TARGET_TYPE.MATERIAL:
      return targetContext.materialId ?? null;

    default:
      return null;
  }
}

function matchTarget(assumption, operation, targetContext) {
  const contextValue = getContextValue(
    assumption.targetType,
    operation,
    targetContext
  );

  if (contextValue === null || contextValue === undefined) {
    return TARGET_MATCH_STATUS.CONTEXT_MISSING;
  }

  if (Array.isArray(contextValue)) {
    return contextValue.includes(assumption.targetId)
      ? TARGET_MATCH_STATUS.MATCH
      : TARGET_MATCH_STATUS.NO_MATCH;
  }

  return contextValue === assumption.targetId
    ? TARGET_MATCH_STATUS.MATCH
    : TARGET_MATCH_STATUS.NO_MATCH;
}

function evaluateEffectiveStatus(assumption, evaluationDate) {
  switch (assumption.status) {
    case ASSUMPTION_STATUS.CONFIRMED:
      return assumption.isEffectiveOn(evaluationDate)
        ? ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED
        : ASSUMPTION_EFFECTIVE_STATUS.OUTSIDE_VALIDITY;

    case ASSUMPTION_STATUS.UNKNOWN:
      return ASSUMPTION_EFFECTIVE_STATUS.UNKNOWN;

    case ASSUMPTION_STATUS.EXPECTED:
      return ASSUMPTION_EFFECTIVE_STATUS.EXPECTED;

    case ASSUMPTION_STATUS.REJECTED:
      return ASSUMPTION_EFFECTIVE_STATUS.REJECTED;

    case ASSUMPTION_STATUS.EXPIRED:
      return ASSUMPTION_EFFECTIVE_STATUS.EXPIRED;

    default:
      throw createDomainError(
        ERROR_CODES.INVALID_ASSUMPTION_RESOLUTION,
        "Assumption has an unsupported status.",
        {
          assumptionId: assumption.assumptionId,
          status: assumption.status
        }
      );
  }
}

function buildConflictGroups(evaluations) {
  const groups = new Map();

  for (const evaluation of evaluations) {
    const key = [
      evaluation.assumptionType,
      evaluation.targetType,
      evaluation.targetId
    ].join("::");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(evaluation);
  }

  const conflicts = [];

  for (const [key, values] of groups.entries()) {
    const hasConfirmed = values.some(
      (value) =>
        value.effectiveStatus ===
        ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED
    );
    const hasRejected = values.some(
      (value) =>
        value.effectiveStatus ===
        ASSUMPTION_EFFECTIVE_STATUS.REJECTED
    );

    if (hasConfirmed && hasRejected) {
      conflicts.push({
        conflictKey: key,
        assumptionIds: values.map((value) => value.assumptionId)
      });
    }
  }

  return conflicts;
}

function isUnresolvedEffectiveStatus(status) {
  return [
    ASSUMPTION_EFFECTIVE_STATUS.UNKNOWN,
    ASSUMPTION_EFFECTIVE_STATUS.EXPECTED,
    ASSUMPTION_EFFECTIVE_STATUS.EXPIRED,
    ASSUMPTION_EFFECTIVE_STATUS.OUTSIDE_VALIDITY
  ].includes(status);
}

/**
 * Resolves only Assumptions explicitly attached to a Diagnosis Scenario.
 * An attached Assumption is never treated as confirmed unless its status is
 * CONFIRMED and its validity covers the operation date.
 */
export class AssumptionResolver {
  resolve({
    plannedOperation,
    diagnosisScenario,
    assumptions = [],
    scenarioAssumptionRelations = [],
    evaluationDate = plannedOperation?.plannedDate,
    targetContext = {}
  } = {}) {
    const operation = assertPlannedOperation(plannedOperation);
    const scenario = assertDiagnosisScenario(diagnosisScenario);
    const date = assertDate(
      evaluationDate,
      ERROR_CODES.INVALID_DATE,
      "evaluationDate"
    );
    const context = assertPlainObject(
      targetContext,
      ERROR_CODES.INVALID_ASSUMPTION_RESOLUTION,
      "targetContext"
    );

    if (!scenario.active || scenario.isArchived()) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Inactive or archived Diagnosis Scenario cannot resolve Assumptions.",
        { diagnosisScenarioId: scenario.diagnosisScenarioId }
      );
    }

    if (scenario.planVersionId !== operation.planVersionId) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Diagnosis Scenario and Planned Operation must reference the same Plan Version.",
        {
          diagnosisScenarioId: scenario.diagnosisScenarioId,
          scenarioPlanVersionId: scenario.planVersionId,
          operationPlanVersionId: operation.planVersionId
        }
      );
    }

    const assumptionList = assertArray(
      assumptions,
      ERROR_CODES.INVALID_ASSUMPTION_RESOLUTION,
      "assumptions"
    ).map(assertAssumption);

    const relationList = assertArray(
      scenarioAssumptionRelations,
      ERROR_CODES.INVALID_ASSUMPTION_RESOLUTION,
      "scenarioAssumptionRelations"
    ).map(assertScenarioAssumptionRelation);

    assertUniqueBy(
      assumptionList,
      (assumption) => assumption.assumptionId,
      "assumptions"
    );
    assertUniqueBy(
      relationList,
      (relation) => relation.relationId,
      "scenarioAssumptionRelations"
    );

    const assumptionById = new Map(
      assumptionList.map((assumption) => [
        assumption.assumptionId,
        assumption
      ])
    );

    const activeRelations = relationList.filter(
      (relation) =>
        relation.active &&
        relation.diagnosisScenarioId === scenario.diagnosisScenarioId
    );

    const evaluations = [];
    const contextMissingEvaluations = [];

    for (const relation of activeRelations) {
      const assumption = assumptionById.get(relation.assumptionId);

      if (!assumption) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "Scenario Assumption relation references a missing Assumption.",
          {
            relationId: relation.relationId,
            assumptionId: relation.assumptionId
          }
        );
      }

      const targetMatchStatus = matchTarget(
        assumption,
        operation,
        context
      );

      if (targetMatchStatus === TARGET_MATCH_STATUS.NO_MATCH) {
        continue;
      }

      const effectiveStatus =
        targetMatchStatus === TARGET_MATCH_STATUS.CONTEXT_MISSING
          ? ASSUMPTION_EFFECTIVE_STATUS.UNKNOWN
          : evaluateEffectiveStatus(assumption, date);

      const evaluation = freezeObject({
        assumptionId: assumption.assumptionId,
        assumptionType: assumption.assumptionType,
        targetType: assumption.targetType,
        targetId: assumption.targetId,
        status: assumption.status,
        effectiveStatus,
        blocking: assumption.blocking,
        confidence: assumption.confidence,
        impactLevel: assumption.impactLevel,
        description: assumption.description,
        targetMatchStatus,
        confirmationOverdue:
          assumption.isConfirmationOverdue(date)
      });

      evaluations.push(evaluation);

      if (targetMatchStatus === TARGET_MATCH_STATUS.CONTEXT_MISSING) {
        contextMissingEvaluations.push(evaluation);
      }
    }

    const conflicts = buildConflictGroups(evaluations);
    const rejected = evaluations.filter(
      (evaluation) =>
        evaluation.effectiveStatus ===
        ASSUMPTION_EFFECTIVE_STATUS.REJECTED
    );
    const unresolved = evaluations.filter(
      (evaluation) =>
        evaluation.targetMatchStatus ===
          TARGET_MATCH_STATUS.CONTEXT_MISSING ||
        isUnresolvedEffectiveStatus(evaluation.effectiveStatus)
    );
    const effectiveConfirmed = evaluations.filter(
      (evaluation) =>
        evaluation.effectiveStatus ===
        ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED
    );

    const blockingRejected = rejected.filter(
      (evaluation) => evaluation.blocking
    );
    const blockingUnresolved = unresolved.filter(
      (evaluation) => evaluation.blocking
    );

    let status;

    if (conflicts.length > 0) {
      status = ASSUMPTION_RESOLUTION_STATUS.CONFLICT;
    } else if (blockingRejected.length > 0) {
      status = ASSUMPTION_RESOLUTION_STATUS.REJECTED;
    } else if (blockingUnresolved.length > 0) {
      status = ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED;
    } else if (evaluations.length === 0) {
      status = ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE;
    } else {
      status = ASSUMPTION_RESOLUTION_STATUS.SATISFIED;
    }

    return freezeObject({
      status,
      evaluationDate: date,
      evaluations,
      applicableAssumptionIds: evaluations.map(
        (evaluation) => evaluation.assumptionId
      ),
      effectiveConfirmedAssumptionIds: effectiveConfirmed.map(
        (evaluation) => evaluation.assumptionId
      ),
      unresolvedAssumptionIds: unresolved.map(
        (evaluation) => evaluation.assumptionId
      ),
      rejectedAssumptionIds: rejected.map(
        (evaluation) => evaluation.assumptionId
      ),
      blockingRejectedAssumptionIds: blockingRejected.map(
        (evaluation) => evaluation.assumptionId
      ),
      blockingUnresolvedAssumptionIds: blockingUnresolved.map(
        (evaluation) => evaluation.assumptionId
      ),
      contextMissingAssumptionIds: contextMissingEvaluations.map(
        (evaluation) => evaluation.assumptionId
      ),
      conflicts,
      hasBlockingRejected: blockingRejected.length > 0,
      hasBlockingUnresolved: blockingUnresolved.length > 0
    });
  }
}
