import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMPTION_TYPE,
  CONDITION_COVERAGE_TYPE,
  MODEL_COVERAGE_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  ModelCoverageEvaluator
} from "./ModelCoverageEvaluator.js";

const evaluator = new ModelCoverageEvaluator();

function direct(conditionCode, overrides = {}) {
  return {
    conditionCode,
    description: `${conditionCode}を直接確認する`,
    coverageType: CONDITION_COVERAGE_TYPE.DIRECT_MODEL,
    blocking: true,
    modelElement: "CapacitySnapshot",
    ...overrides
  };
}

function assumption(conditionCode, overrides = {}) {
  return {
    conditionCode,
    description: `${conditionCode}をAssumptionで確認する`,
    coverageType: CONDITION_COVERAGE_TYPE.ASSUMPTION,
    blocking: true,
    assumptionType: ASSUMPTION_TYPE.MATERIAL_ARRIVAL,
    ...overrides
  };
}

function unmodeled(conditionCode, overrides = {}) {
  return {
    conditionCode,
    description: `${conditionCode}は現在Model外`,
    coverageType: CONDITION_COVERAGE_TYPE.UNMODELED,
    blocking: true,
    unmodeledReason: "現時点では入力Dataを取得できない",
    ...overrides
  };
}

test("必須条件がなければMODELEDとして扱う", () => {
  const result = evaluator.evaluate();

  assert.equal(result.status, MODEL_COVERAGE_STATUS.MODELED);
  assert.equal(result.totalConditionCount, 0);
  assert.equal(result.hasBlockingUnmodeledCondition, false);
});

test("すべて直接Model化されていればMODELEDになる", () => {
  const result = evaluator.evaluate({
    requiredConditions: [
      direct("EQUIPMENT_CAPACITY"),
      direct("WORKER_CAPACITY", { modelElement: "WorkerAssignment" })
    ]
  });

  assert.equal(result.status, MODEL_COVERAGE_STATUS.MODELED);
  assert.deepEqual(result.directlyModeledConditionCodes, [
    "EQUIPMENT_CAPACITY",
    "WORKER_CAPACITY"
  ]);
});

test("Assumption依存条件だけの場合はPARTIALLY_MODELEDになる", () => {
  const result = evaluator.evaluate({
    requiredConditions: [assumption("MATERIAL_ARRIVAL")]
  });

  assert.equal(
    result.status,
    MODEL_COVERAGE_STATUS.PARTIALLY_MODELED
  );
  assert.equal(result.hasAssumptionDependentCondition, true);
  assert.deepEqual(result.assumptionDependentConditionCodes, [
    "MATERIAL_ARRIVAL"
  ]);
});

test("直接ModelとAssumption依存が混在すればPARTIALLY_MODELEDになる", () => {
  const result = evaluator.evaluate({
    requiredConditions: [
      direct("CAPACITY"),
      assumption("QUALITY_RELEASE", {
        assumptionType: ASSUMPTION_TYPE.QUALITY_RELEASE
      })
    ]
  });

  assert.equal(
    result.status,
    MODEL_COVERAGE_STATUS.PARTIALLY_MODELED
  );
  assert.equal(result.directlyModeledConditionCount, 1);
  assert.equal(result.assumptionDependentConditionCount, 1);
});

test("すべてModel外ならUNMODELEDになる", () => {
  const result = evaluator.evaluate({
    requiredConditions: [
      unmodeled("SPECIAL_TOOLING"),
      unmodeled("EXTERNAL_PERMISSION", { blocking: false })
    ]
  });

  assert.equal(result.status, MODEL_COVERAGE_STATUS.UNMODELED);
  assert.equal(result.unmodeledConditionCount, 2);
});

test("直接ModelとModel外が混在すればPARTIALLY_MODELEDになる", () => {
  const result = evaluator.evaluate({
    requiredConditions: [
      direct("CAPACITY"),
      unmodeled("SPECIAL_TOOLING")
    ]
  });

  assert.equal(
    result.status,
    MODEL_COVERAGE_STATUS.PARTIALLY_MODELED
  );
  assert.equal(result.hasBlockingUnmodeledCondition, true);
  assert.deepEqual(result.blockingUnmodeledConditionCodes, [
    "SPECIAL_TOOLING"
  ]);
});

test("non-blockingのModel外条件は記録するがblockingにはしない", () => {
  const result = evaluator.evaluate({
    requiredConditions: [
      direct("CAPACITY"),
      unmodeled("OPTIONAL_OBSERVATION", { blocking: false })
    ]
  });

  assert.equal(result.unmodeledConditionCount, 1);
  assert.equal(result.hasBlockingUnmodeledCondition, false);
  assert.deepEqual(result.blockingUnmodeledConditionCodes, []);
});

test("Assumption依存条件には正式なAssumption Typeを必須とする", () => {
  assert.throws(
    () => evaluator.evaluate({
      requiredConditions: [{
        conditionCode: "MATERIAL",
        description: "材料到着を確認する",
        coverageType: CONDITION_COVERAGE_TYPE.ASSUMPTION,
        blocking: true
      }]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_MODEL_CONDITION
    )
  );
});

test("直接Model条件には参照Model要素を必須とする", () => {
  assert.throws(
    () => evaluator.evaluate({
      requiredConditions: [{
        conditionCode: "CAPACITY",
        description: "Capacityを確認する",
        coverageType: CONDITION_COVERAGE_TYPE.DIRECT_MODEL,
        blocking: true
      }]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_MODEL_CONDITION
    )
  );
});

test("Model外条件にはModel外である理由を必須とする", () => {
  assert.throws(
    () => evaluator.evaluate({
      requiredConditions: [{
        conditionCode: "UNKNOWN_TOOL",
        description: "特殊工具を確認する",
        coverageType: CONDITION_COVERAGE_TYPE.UNMODELED,
        blocking: true
      }]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_MODEL_CONDITION
    )
  );
});

test("重複conditionCodeをSource不整合として拒否する", () => {
  assert.throws(
    () => evaluator.evaluate({
      requiredConditions: [direct("CAPACITY"), direct("CAPACITY")]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("未登録Coverage Typeを拒否する", () => {
  assert.throws(
    () => evaluator.evaluate({
      requiredConditions: [{
        conditionCode: "CAPACITY",
        description: "Capacityを確認する",
        coverageType: "MAYBE",
        blocking: true
      }]
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_MODEL_CONDITION
    )
  );
});

test("結果・分類配列・Conditionを外部から変更できない", () => {
  const result = evaluator.evaluate({
    requiredConditions: [
      direct("CAPACITY"),
      assumption("MATERIAL")
    ]
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.conditions), true);
  assert.equal(Object.isFrozen(result.conditions[0]), true);
  assert.throws(() => result.conditions.push({}), TypeError);
});
