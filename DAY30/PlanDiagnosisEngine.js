import {
  CAPACITY_RULE_RESOLUTION_STATUS,
  CAPACITY_STATUS,
  ID_NAMESPACE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertArray,
  assertNonEmptyString,
  assertPlainObject,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertIdGenerator,
  generateId
} from "./IdGenerator.js";

import { assertDiagnosisScenario } from "./DiagnosisScenario.js";
import { assertCapacitySnapshot } from "./CapacitySnapshot.js";
import { assertPlannedOperation } from "./PlannedOperation.js";
import { OperationSortService } from "./OperationSortService.js";
import { CapacityRuleResolver } from "./CapacityRuleResolver.js";
import { RequiredTimeCalculator } from "./RequiredTimeCalculator.js";
import { CapacityLedgerFactory } from "./CapacityLedgerFactory.js";
import { CapacityAllocationService } from "./CapacityAllocationService.js";
import { ExecutableQuantityCalculator } from "./ExecutableQuantityCalculator.js";
import { AssumptionResolver } from "./AssumptionResolver.js";
import { RoutingDiagnosisService } from "./RoutingDiagnosisService.js";
import { ModelCoverageEvaluator } from "./ModelCoverageEvaluator.js";
import { OperationStatusDecider } from "./OperationStatusDecider.js";
import { OperationDiagnosisResult } from "./OperationDiagnosisResult.js";
import { DiagnosisSummary } from "./DiagnosisSummary.js";
import { DiagnosisResult } from "./DiagnosisResult.js";
import { assertDateTime } from "./DateTimeUtils.js";

function assertService(value, methodName, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value[methodName] !== "function"
  ) {
    throw createDomainError(
      ERROR_CODES.INVALID_DIAGNOSIS_ENGINE,
      `${label} must implement ${methodName}().`,
      { label, methodName }
    );
  }
  return value;
}

function createUniqueRecordMap(values, idField, label) {
  const records = assertArray(
    values,
    ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
    label
  );
  const map = new Map();

  records.forEach((value, index) => {
    const record = assertPlainObject(
      value,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      `${label}[${index}]`
    );
    const id = assertNonEmptyString(
      record[idField],
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
      `${label}[${index}].${idField}`
    );
    if (map.has(id)) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        `${label} contains duplicate ${idField}.`,
        { idField, id }
      );
    }
    map.set(id, record);
  });

  return map;
}

function normalizeOperationObjectMap(value, label) {
  return assertPlainObject(
    value,
    ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
    label
  );
}

function getArrayForOperation(map, operationId) {
  const value = map[operationId] ?? [];
  return assertArray(
    value,
    ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
    `${operationId}`
  );
}

function getObjectForOperation(map, operationId, fallback = {}) {
  const value = map[operationId] ?? fallback;
  return assertPlainObject(
    value,
    ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
    `${operationId}`
  );
}

/**
 * Orchestrates one deterministic plan diagnosis execution.
 *
 * It consumes immutable plan intent and a DAY29 Capacity Snapshot, then
 * creates immutable Operation results, Summary, and Diagnosis Result.
 * The engine does not persist entities and does not mutate PlannedOperation.
 */
export class PlanDiagnosisEngine {
  #idGenerator;
  #operationSortService;
  #capacityRuleResolver;
  #requiredTimeCalculator;
  #capacityLedgerFactory;
  #capacityAllocationService;
  #executableQuantityCalculator;
  #assumptionResolver;
  #routingDiagnosisService;
  #modelCoverageEvaluator;
  #operationStatusDecider;

  constructor({
    idGenerator,
    operationSortService = new OperationSortService(),
    capacityRuleResolver = new CapacityRuleResolver(),
    requiredTimeCalculator = new RequiredTimeCalculator(),
    capacityLedgerFactory = new CapacityLedgerFactory(),
    capacityAllocationService = null,
    executableQuantityCalculator = new ExecutableQuantityCalculator(),
    assumptionResolver = new AssumptionResolver(),
    routingDiagnosisService = new RoutingDiagnosisService(),
    modelCoverageEvaluator = new ModelCoverageEvaluator(),
    operationStatusDecider = new OperationStatusDecider()
  } = {}) {
    this.#idGenerator = assertIdGenerator(idGenerator);
    this.#operationSortService = assertService(
      operationSortService,
      "sort",
      "operationSortService"
    );
    this.#capacityRuleResolver = assertService(
      capacityRuleResolver,
      "resolve",
      "capacityRuleResolver"
    );
    this.#requiredTimeCalculator = assertService(
      requiredTimeCalculator,
      "calculate",
      "requiredTimeCalculator"
    );
    this.#capacityLedgerFactory = assertService(
      capacityLedgerFactory,
      "createFromSnapshot",
      "capacityLedgerFactory"
    );
    this.#capacityAllocationService = assertService(
      capacityAllocationService ?? new CapacityAllocationService({
        idGenerator: this.#idGenerator
      }),
      "allocate",
      "capacityAllocationService"
    );
    this.#executableQuantityCalculator = assertService(
      executableQuantityCalculator,
      "calculate",
      "executableQuantityCalculator"
    );
    this.#assumptionResolver = assertService(
      assumptionResolver,
      "resolve",
      "assumptionResolver"
    );
    this.#routingDiagnosisService = assertService(
      routingDiagnosisService,
      "diagnose",
      "routingDiagnosisService"
    );
    this.#modelCoverageEvaluator = assertService(
      modelCoverageEvaluator,
      "evaluate",
      "modelCoverageEvaluator"
    );
    this.#operationStatusDecider = assertService(
      operationStatusDecider,
      "decide",
      "operationStatusDecider"
    );

    Object.freeze(this);
  }

  diagnose({
    diagnosisScenario,
    capacitySnapshot,
    plannedOperations,
    productionPlanId,
    defaultFactoryId = null,
    factoryIdByOperation = {},
    equipments = [],
    orders = [],
    routingOperations = [],
    shifts = [],
    capacityRules = [],
    assumptions = [],
    scenarioAssumptionRelations = [],
    requiredConditionsByOperation = {},
    targetContextByOperation = {},
    confirmedConstraintsByOperation = {},
    constraintFindingsByOperation = {},
    assumptionFindingsByOperation = {},
    nextChecksByOperation = {},
    standardShiftMinutes = null,
    standardDayMinutes = null,
    quantityPrecision = null,
    diagnosisInputRevision,
    diagnosedAt
  } = {}) {
    const scenario = assertDiagnosisScenario(diagnosisScenario);
    const snapshot = assertCapacitySnapshot(capacitySnapshot);
    const executionTime = assertDateTime(
      diagnosedAt,
      ERROR_CODES.INVALID_DIAGNOSIS_ENGINE,
      "diagnosedAt"
    );
    const validProductionPlanId = assertNonEmptyString(
      productionPlanId,
      ERROR_CODES.INVALID_PLAN_ID,
      "productionPlanId"
    );

    if (!scenario.active || scenario.isArchived()) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Inactive or archived Diagnosis Scenario cannot be diagnosed.",
        { diagnosisScenarioId: scenario.diagnosisScenarioId }
      );
    }

    if (scenario.capacityScenarioId !== snapshot.capacityScenarioId) {
      throw createDomainError(
        ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
        "Diagnosis Scenario and Capacity Snapshot must reference the same Capacity Scenario.",
        {
          scenarioCapacityScenarioId: scenario.capacityScenarioId,
          snapshotCapacityScenarioId: snapshot.capacityScenarioId
        }
      );
    }

    const operations = assertArray(
      plannedOperations,
      ERROR_CODES.INVALID_DIAGNOSIS_ENGINE,
      "plannedOperations"
    ).map(assertPlannedOperation);

    if (operations.length === 0) {
      throw createDomainError(
        ERROR_CODES.INVALID_DIAGNOSIS_ENGINE,
        "plannedOperations must contain at least one operation.",
        {}
      );
    }

    for (const operation of operations) {
      if (operation.planVersionId !== scenario.planVersionId) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "Every Planned Operation must belong to the Scenario Plan Version.",
          {
            plannedOperationId: operation.plannedOperationId,
            operationPlanVersionId: operation.planVersionId,
            scenarioPlanVersionId: scenario.planVersionId
          }
        );
      }
    }

    const equipmentById = createUniqueRecordMap(
      equipments,
      "equipmentId",
      "equipments"
    );
    const orderById = createUniqueRecordMap(
      orders,
      "orderId",
      "orders"
    );

    const factoryMap = normalizeOperationObjectMap(
      factoryIdByOperation,
      "factoryIdByOperation"
    );
    const conditionMap = normalizeOperationObjectMap(
      requiredConditionsByOperation,
      "requiredConditionsByOperation"
    );
    const contextMap = normalizeOperationObjectMap(
      targetContextByOperation,
      "targetContextByOperation"
    );
    const constraintMap = normalizeOperationObjectMap(
      confirmedConstraintsByOperation,
      "confirmedConstraintsByOperation"
    );
    const constraintFindingMap = normalizeOperationObjectMap(
      constraintFindingsByOperation,
      "constraintFindingsByOperation"
    );
    const assumptionFindingMap = normalizeOperationObjectMap(
      assumptionFindingsByOperation,
      "assumptionFindingsByOperation"
    );
    const nextCheckMap = normalizeOperationObjectMap(
      nextChecksByOperation,
      "nextChecksByOperation"
    );

    const sortedOperations = this.#operationSortService.sort({
      plannedOperations: operations,
      orders,
      routingOperations
    });
    const ledgerRegistry = this.#capacityLedgerFactory.createFromSnapshot(
      snapshot
    );

    const operationResults = [];

    for (const operation of sortedOperations) {
      const factoryId = factoryMap[operation.plannedOperationId] ??
        defaultFactoryId;

      if (typeof factoryId !== "string" || factoryId.trim() === "") {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "A Factory ID is required for every Planned Operation.",
          { plannedOperationId: operation.plannedOperationId }
        );
      }

      const equipment = equipmentById.get(operation.equipmentId);
      if (!equipment) {
        throw createDomainError(
          ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT,
          "Equipment master record was not found.",
          {
            plannedOperationId: operation.plannedOperationId,
            equipmentId: operation.equipmentId
          }
        );
      }

      const order = orderById.get(operation.orderId) ?? null;
      const ruleResolution = this.#capacityRuleResolver.resolve({
        plannedOperation: operation,
        equipment,
        capacityRules,
        order
      });

      let capacityStatus = CAPACITY_STATUS.UNKNOWN;
      let capacityExecutableQuantity = 0;
      let requiredMinutes = null;
      let allocatedMinutes = null;

      if (
        ruleResolution.status ===
        CAPACITY_RULE_RESOLUTION_STATUS.RESOLVED
      ) {
        const requiredTime = this.#requiredTimeCalculator.calculate({
          plannedQuantity: operation.plannedQuantity,
          quantityUnit: operation.quantityUnit,
          capacityRule: ruleResolution.capacityRule,
          standardShiftMinutes,
          standardDayMinutes
        });
        requiredMinutes = requiredTime.requiredMinutes;

        const allocation = this.#capacityAllocationService.allocate({
          plannedOperation: operation,
          factoryId: factoryId.trim(),
          requiredMinutes,
          ledgerRegistry
        });
        capacityStatus = allocation.status;
        allocatedMinutes = allocation.allocatedMinutes;

        const executable = this.#executableQuantityCalculator.calculate({
          allocatedMinutes,
          plannedQuantity: operation.plannedQuantity,
          quantityUnit: operation.quantityUnit,
          capacityRule: ruleResolution.capacityRule,
          standardShiftMinutes,
          standardDayMinutes,
          quantityPrecision
        });
        capacityExecutableQuantity = executable.executableQuantity;
      }

      const assumptionResolution = this.#assumptionResolver.resolve({
        plannedOperation: operation,
        diagnosisScenario: scenario,
        assumptions,
        scenarioAssumptionRelations,
        evaluationDate: operation.plannedDate,
        targetContext: {
          productionPlanId: validProductionPlanId,
          factoryId: factoryId.trim(),
          ...getObjectForOperation(
            contextMap,
            operation.plannedOperationId,
            {}
          )
        }
      });

      const routingDiagnosis = this.#routingDiagnosisService.diagnose({
        plannedOperation: operation,
        plannedOperations: sortedOperations,
        routingOperations,
        shifts
      });

      const coverage = this.#modelCoverageEvaluator.evaluate({
        requiredConditions: getArrayForOperation(
          conditionMap,
          operation.plannedOperationId
        )
      });

      const decision = this.#operationStatusDecider.decide({
        capacityStatus,
        plannedQuantity: operation.plannedQuantity,
        executableQuantity: capacityExecutableQuantity,
        assumptionResolution,
        routingStatus: routingDiagnosis.status,
        modelCoverageStatus: coverage.status,
        hasBlockingUnmodeledCondition:
          coverage.hasBlockingUnmodeledCondition,
        confirmedConstraints: getArrayForOperation(
          constraintMap,
          operation.plannedOperationId
        )
      });

      operationResults.push(new OperationDiagnosisResult({
        operationDiagnosisResultId: generateId(
          this.#idGenerator,
          ID_NAMESPACE.OPERATION_DIAGNOSIS_RESULT
        ),
        diagnosisScenarioId: scenario.diagnosisScenarioId,
        planVersionId: scenario.planVersionId,
        plannedOperationId: operation.plannedOperationId,
        orderId: operation.orderId,
        routingOperationId: operation.routingOperationId,
        factoryId: factoryId.trim(),
        equipmentId: operation.equipmentId,
        plannedDate: operation.plannedDate,
        quantityUnit: operation.quantityUnit,
        plannedQuantity: operation.plannedQuantity,
        capacityExecutableQuantity,
        requiredMinutes,
        allocatedMinutes,
        status: decision.status,
        primaryReasonCode: decision.primaryReasonCode,
        capacityStatus: decision.capacityStatus,
        assumptionStatus: decision.assumptionStatus,
        routingStatus: decision.routingStatus,
        modelCoverageStatus: decision.modelCoverageStatus,
        hasBlockingUnmodeledCondition:
          decision.hasBlockingUnmodeledCondition,
        constraintFindings: getArrayForOperation(
          constraintFindingMap,
          operation.plannedOperationId
        ),
        assumptionFindings: getArrayForOperation(
          assumptionFindingMap,
          operation.plannedOperationId
        ),
        nextChecks: getArrayForOperation(
          nextCheckMap,
          operation.plannedOperationId
        ),
        diagnosedAt: executionTime
      }));
    }

    const summary = new DiagnosisSummary({
      diagnosisSummaryId: generateId(
        this.#idGenerator,
        ID_NAMESPACE.DIAGNOSIS_SUMMARY
      ),
      diagnosisScenarioId: scenario.diagnosisScenarioId,
      planVersionId: scenario.planVersionId,
      operationResults,
      generatedAt: executionTime
    });

    return new DiagnosisResult({
      diagnosisResultId: generateId(
        this.#idGenerator,
        ID_NAMESPACE.DIAGNOSIS_RESULT
      ),
      diagnosisScenarioId: scenario.diagnosisScenarioId,
      planVersionId: scenario.planVersionId,
      capacityScenarioId: snapshot.capacityScenarioId,
      targetMonth: snapshot.targetMonth,
      operationResults,
      summary,
      diagnosedAt: executionTime,
      capacitySnapshotGeneratedAt: snapshot.generatedAt,
      capacitySourceRevision: snapshot.sourceRevision,
      diagnosisInputRevision
    });
  }
}
