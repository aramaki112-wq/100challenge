import {
  ASSUMPTION_RESOLUTION_STATUS,
  CAPACITY_STATUS,
  DIAGNOSIS_STATUS,
  MODEL_COVERAGE_STATUS,
  OPERATION_STATUS_REASON,
  QUANTITY_UNIT,
  ROUTING_STATUS
} from "./DiagnosisCodes.js";

import { OperationDiagnosisResult } from "./OperationDiagnosisResult.js";
import { DiagnosisSummary } from "./DiagnosisSummary.js";
import { DiagnosisResult } from "./DiagnosisResult.js";

export const VALIDITY_TEST_DIAGNOSED_AT =
  "2026-08-01T20:00:00+09:00";

export function createValidityTestDiagnosisResult(overrides = {}) {
  const operationResult = new OperationDiagnosisResult({
    operationDiagnosisResultId: "ODR-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    plannedOperationId: "POP-0001",
    orderId: "ORD-0001",
    routingOperationId: "ROP-0001",
    factoryId: "F-01",
    equipmentId: "EQ-01",
    plannedDate: "2026-08-03",
    quantityUnit: QUANTITY_UNIT.PIECE,
    plannedQuantity: 60,
    capacityExecutableQuantity: 60,
    requiredMinutes: 360,
    allocatedMinutes: 360,
    status: DIAGNOSIS_STATUS.FEASIBLE,
    primaryReasonCode:
      OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED,
    capacityStatus: CAPACITY_STATUS.FEASIBLE,
    assumptionStatus:
      ASSUMPTION_RESOLUTION_STATUS.NOT_APPLICABLE,
    routingStatus: ROUTING_STATUS.VALID,
    modelCoverageStatus: MODEL_COVERAGE_STATUS.MODELED,
    diagnosedAt: VALIDITY_TEST_DIAGNOSED_AT
  });

  const operationResults = [operationResult];
  const summary = new DiagnosisSummary({
    diagnosisSummaryId: "DS-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    operationResults,
    generatedAt: VALIDITY_TEST_DIAGNOSED_AT
  });

  return new DiagnosisResult({
    diagnosisResultId: "DR-0001",
    diagnosisScenarioId: "DGS-0001",
    planVersionId: "PV-0001",
    capacityScenarioId: "CS-0001",
    targetMonth: "2026-08",
    operationResults,
    summary,
    diagnosedAt: VALIDITY_TEST_DIAGNOSED_AT,
    capacitySnapshotGeneratedAt: "2026-08-01T19:00:00+09:00",
    capacitySourceRevision: {
      capacity: 3,
      calendar: 5,
      assignment: 2,
      capacityRule: 4
    },
    diagnosisInputRevision: {
      plan: 7,
      assumption: 2,
      routing: 4,
      modelCoverage: 1
    },
    ...overrides
  });
}

export function currentValiditySources(overrides = {}) {
  return {
    currentCapacitySourceRevision: {
      capacity: 3,
      calendar: 5,
      assignment: 2,
      capacityRule: 4
    },
    currentDiagnosisInputRevision: {
      plan: 7,
      assumption: 2,
      routing: 4,
      modelCoverage: 1
    },
    ...overrides
  };
}
