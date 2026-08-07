import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMPTION_EFFECTIVE_STATUS,
  ASSUMPTION_IMPACT_LEVEL,
  ASSUMPTION_RESOLUTION_STATUS,
  ASSUMPTION_STATUS,
  ASSUMPTION_TARGET_TYPE,
  ASSUMPTION_TYPE
} from "./DiagnosisCodes.js";

import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";
import {
  AssumptionFinding,
  assertAssumptionFinding
} from "./AssumptionFinding.js";

function createFinding(overrides = {}) {
  return new AssumptionFinding({
    findingId: "AF-0001",
    plannedOperationId: "POP-0001",
    assumptionId: "ASM-0001",
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    targetType: ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION,
    targetId: "POP-0001",
    assumptionStatus: ASSUMPTION_STATUS.EXPECTED,
    effectiveStatus: ASSUMPTION_EFFECTIVE_STATUS.EXPECTED,
    resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.UNRESOLVED,
    blocking: true,
    impactLevel: ASSUMPTION_IMPACT_LEVEL.HIGH,
    description: "材料が計画日までに到着する見込みです。",
    evaluatedOn: "2026-08-03",
    owner: "生産管理",
    confirmationDueDate: "2026-08-02",
    recommendedAction: "材料到着日時を確認する",
    ...overrides
  });
}

test("未確認blocking AssumptionはNext Checkを必要とする", () => {
  const finding = createFinding();
  assert.equal(finding.requiresNextCheck(), true);
  assert.equal(finding.preventsExecution(), false);
  assert.equal(Object.isFrozen(finding), true);
});

test("確認済みAssumptionはSATISFIEDとして表せる", () => {
  const finding = createFinding({
    assumptionStatus: ASSUMPTION_STATUS.CONFIRMED,
    effectiveStatus: ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED,
    resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.SATISFIED
  });
  assert.equal(finding.requiresNextCheck(), false);
});

test("REJECTED blocking Assumptionは実行を妨げる", () => {
  const finding = createFinding({
    assumptionStatus: ASSUMPTION_STATUS.REJECTED,
    effectiveStatus: ASSUMPTION_EFFECTIVE_STATUS.REJECTED,
    resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.REJECTED,
    evidence: "仕入先から納入不可の回答"
  });
  assert.equal(finding.preventsExecution(), true);
});

test("SATISFIEDとEXPECTEDの矛盾を拒否する", () => {
  assert.throws(
    () => createFinding({ resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.SATISFIED }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_ASSUMPTION_FINDING)
  );
});

test("CONFLICTには関連Assumptionが必要", () => {
  assert.throws(
    () => createFinding({
      assumptionStatus: ASSUMPTION_STATUS.CONFIRMED,
      effectiveStatus: ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED,
      resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.CONFLICT
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_ASSUMPTION_FINDING)
  );
});

test("CONFLICTは関連Assumptionを重複なく保持する", () => {
  const finding = createFinding({
    assumptionStatus: ASSUMPTION_STATUS.CONFIRMED,
    effectiveStatus: ASSUMPTION_EFFECTIVE_STATUS.EFFECTIVE_CONFIRMED,
    resolutionStatus: ASSUMPTION_RESOLUTION_STATUS.CONFLICT,
    relatedAssumptionIds: ["ASM-0002", "ASM-0002", "ASM-0001"]
  });
  assert.deepEqual(finding.relatedAssumptionIds, ["ASM-0002"]);
  assert.equal(Object.isFrozen(finding.relatedAssumptionIds), true);
});

test("validFromがvalidToより後の場合は拒否する", () => {
  assert.throws(
    () => createFinding({ validFrom: "2026-08-05", validTo: "2026-08-04" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_ASSUMPTION_FINDING)
  );
});

test("blockingでない未確認Assumptionは必須Next Checkにしない", () => {
  const finding = createFinding({ blocking: false });
  assert.equal(finding.requiresNextCheck(), false);
});

test("Snapshot内の関連ID配列も変更できない", () => {
  const snapshot = createFinding().toSnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.relatedAssumptionIds), true);
});

test("assertAssumptionFindingは別Objectを拒否する", () => {
  assert.throws(
    () => assertAssumptionFinding({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_ASSUMPTION_FINDING)
  );
});
