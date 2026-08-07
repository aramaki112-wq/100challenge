import test from "node:test";
import assert from "node:assert/strict";

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
  hasErrorCode
} from "./DiagnosisErrors.js";

import { OperationStatusDecider } from "./OperationStatusDecider.js";

const decider = new OperationStatusDecider();

function assumptionResolution(status, overrides = {}) {
  return {
    status,
    hasBlockingRejected: status === ASSUMPTION_RESOLUTION_STATUS.REJECTED,
    hasBlockingUnresolved: status === ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED,
    ...overrides
  };
}

function decide(overrides = {}) {
  return decider.decide({
    capacityStatus: CAPACITY_STATUS.FEASIBLE,
    plannedQuantity: 60,
    executableQuantity: 60,
    assumptionResolution: assumptionResolution(
      ASSUMPTION_RESOLUTION_STATUS.SATISFIED
    ),
    routingStatus: ROUTING_STATUS.VALID,
    modelCoverageStatus: MODEL_COVERAGE_STATUS.MODELED,
    hasBlockingUnmodeledCondition: false,
    confirmedConstraints: [],
    ...overrides
  });
}

test("全条件が成立した場合はFEASIBLEになる", () => {
  const result = decide();

  assert.equal(result.status, DIAGNOSIS_STATUS.FEASIBLE);
  assert.equal(
    result.primaryReasonCode,
    OPERATION_STATUS_REASON.ALL_CONDITIONS_SATISFIED
  );
  assert.equal(result.shortageQuantity, 0);
});

test("Capacityが一部成立ならPARTIALLY_FEASIBLEになる", () => {
  const result = decide({
    capacityStatus: CAPACITY_STATUS.PARTIALLY_FEASIBLE,
    executableQuantity: 40
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.PARTIALLY_FEASIBLE);
  assert.equal(result.shortageQuantity, 20);
  assert.equal(result.primaryReasonCode, OPERATION_STATUS_REASON.CAPACITY_PARTIAL);
});

test("Capacityが確認済み0ならINFEASIBLEになる", () => {
  const result = decide({
    capacityStatus: CAPACITY_STATUS.INFEASIBLE,
    executableQuantity: 0
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.INFEASIBLE);
  assert.equal(
    result.primaryReasonCode,
    OPERATION_STATUS_REASON.CAPACITY_INFEASIBLE
  );
});

test("Capacityが十分でもblocking Assumption REJECTEDならINFEASIBLEになる", () => {
  const result = decide({
    assumptionResolution: assumptionResolution(
      ASSUMPTION_RESOLUTION_STATUS.REJECTED
    )
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.INFEASIBLE);
  assert.equal(
    result.primaryReasonCode,
    OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_REJECTED
  );
});

test("blocking Assumption未確認ならCapacityが十分でもUNKNOWNになる", () => {
  const result = decide({
    assumptionResolution: assumptionResolution(
      ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED
    )
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.UNKNOWN);
  assert.equal(
    result.primaryReasonCode,
    OPERATION_STATUS_REASON.BLOCKING_ASSUMPTION_UNRESOLVED
  );
});

test("Assumption競合はUNKNOWNになる", () => {
  const result = decide({
    assumptionResolution: assumptionResolution(
      ASSUMPTION_RESOLUTION_STATUS.CONFLICT,
      {
        hasBlockingRejected: false,
        hasBlockingUnresolved: false
      }
    )
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.UNKNOWN);
  assert.equal(result.primaryReasonCode, OPERATION_STATUS_REASON.ASSUMPTION_CONFLICT);
});

test("Capacity一部成立でもblocking前提未確認なら総合StatusはUNKNOWNになる", () => {
  const result = decide({
    capacityStatus: CAPACITY_STATUS.PARTIALLY_FEASIBLE,
    executableQuantity: 40,
    assumptionResolution: assumptionResolution(
      ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED
    )
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.UNKNOWN);
  assert.equal(result.capacityStatus, CAPACITY_STATUS.PARTIALLY_FEASIBLE);
});

test("確認済みblocking制約があればCapacityが十分でもINFEASIBLEになる", () => {
  const result = decide({
    confirmedConstraints: [{
      code: "EQUIPMENT_STOPPED",
      confirmedStatus: FINDING_CONFIRMATION_STATUS.CONFIRMED,
      blocking: true,
      preventsExecution: true
    }]
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.INFEASIBLE);
  assert.deepEqual(result.confirmedBlockingConstraintCodes, ["EQUIPMENT_STOPPED"]);
});

test("Routing INVALIDはINFEASIBLEになる", () => {
  const result = decide({ routingStatus: ROUTING_STATUS.INVALID });

  assert.equal(result.status, DIAGNOSIS_STATUS.INFEASIBLE);
  assert.equal(result.primaryReasonCode, OPERATION_STATUS_REASON.ROUTING_INVALID);
});

test("Routing UNKNOWNはUNKNOWNになる", () => {
  const result = decide({ routingStatus: ROUTING_STATUS.UNKNOWN });

  assert.equal(result.status, DIAGNOSIS_STATUS.UNKNOWN);
  assert.equal(result.primaryReasonCode, OPERATION_STATUS_REASON.ROUTING_UNKNOWN);
});

test("必須未Model条件が残る場合はUNKNOWNになる", () => {
  const result = decide({
    modelCoverageStatus: MODEL_COVERAGE_STATUS.UNMODELED,
    hasBlockingUnmodeledCondition: true
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.UNKNOWN);
  assert.equal(
    result.primaryReasonCode,
    OPERATION_STATUS_REASON.MODEL_COVERAGE_UNKNOWN
  );
});

test("非blockingのModel外項目だけならFEASIBLEを妨げない", () => {
  const result = decide({
    modelCoverageStatus: MODEL_COVERAGE_STATUS.PARTIALLY_MODELED,
    hasBlockingUnmodeledCondition: false
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.FEASIBLE);
});

test("INFERRED制約はconfirmed physical impossibilityとして扱わない", () => {
  const result = decide({
    confirmedConstraints: [{
      code: "POSSIBLE_DELAY",
      confirmedStatus: FINDING_CONFIRMATION_STATUS.INFERRED,
      blocking: true,
      preventsExecution: true
    }]
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.FEASIBLE);
});

test("確定不成立と未確認が混在してもINFEASIBLEをUNKNOWNへ弱めない", () => {
  const result = decide({
    capacityStatus: CAPACITY_STATUS.INFEASIBLE,
    executableQuantity: 0,
    assumptionResolution: assumptionResolution(
      ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED
    )
  });

  assert.equal(result.status, DIAGNOSIS_STATUS.INFEASIBLE);
  assert.equal(
    result.primaryReasonCode,
    OPERATION_STATUS_REASON.CAPACITY_INFEASIBLE
  );
});

test("Capacity Statusと数量の矛盾を拒否する", () => {
  assert.throws(
    () => decide({
      capacityStatus: CAPACITY_STATUS.FEASIBLE,
      executableQuantity: 40
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION
    )
  );

  assert.throws(
    () => decide({
      capacityStatus: CAPACITY_STATUS.PARTIALLY_FEASIBLE,
      executableQuantity: 0
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_OPERATION_STATUS_DECISION
    )
  );
});

test("同じConfirmed Constraint Codeの重複を拒否する", () => {
  const constraint = {
    code: "EQUIPMENT_STOPPED",
    confirmedStatus: FINDING_CONFIRMATION_STATUS.CONFIRMED,
    blocking: true,
    preventsExecution: true
  };

  assert.throws(
    () => decide({ confirmedConstraints: [constraint, constraint] }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_CONFIRMED_CONSTRAINT)
  );
});

test("Decision Resultを外部から変更できない", () => {
  const result = decide();

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.confirmedBlockingConstraintCodes), true);
  assert.throws(() => {
    result.confirmedBlockingConstraintCodes.push("X");
  }, TypeError);
});
