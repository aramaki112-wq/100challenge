import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPACITY_RATE_BASIS,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  ExecutableQuantityCalculator
} from "./ExecutableQuantityCalculator.js";

const calculator = new ExecutableQuantityCalculator();

function rule({
  capacityValue = 10,
  quantityUnit = QUANTITY_UNIT.PIECE,
  capacityBasis = CAPACITY_RATE_BASIS.HOUR,
  capacityMultiplier = 1
} = {}) {
  return {
    capacityRuleId: "CR-001",
    capacityValue,
    quantityUnit,
    capacityBasis,
    capacityMultiplier
  };
}

test("240分を10本／時間で割り当てた場合は40本実行可能", () => {
  const result = calculator.calculate({
    allocatedMinutes: 240,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(result.executableQuantity, 40);
  assert.equal(result.shortageQuantity, 20);
});

test("PIECEは実行可能能力の小数点以下を切り捨てる", () => {
  const result = calculator.calculate({
    allocatedMinutes: 235,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(result.rawExecutableQuantity, 39.166666666667);
  assert.equal(result.executableQuantity, 39);
});

test("LOTも小数点以下を切り捨てる", () => {
  const result = calculator.calculate({
    allocatedMinutes: 90,
    plannedQuantity: 4,
    quantityUnit: QUANTITY_UNIT.LOT,
    capacityRule: rule({
      capacityValue: 2,
      quantityUnit: QUANTITY_UNIT.LOT
    })
  });

  assert.equal(result.rawExecutableQuantity, 3);
  assert.equal(result.executableQuantity, 3);
  assert.equal(result.shortageQuantity, 1);
});

test("KILOGRAMは指定精度で安全側へ切り捨てる", () => {
  const result = calculator.calculate({
    allocatedMinutes: 1,
    plannedQuantity: 1,
    quantityUnit: QUANTITY_UNIT.KILOGRAM,
    capacityRule: rule({
      capacityValue: 1,
      quantityUnit: QUANTITY_UNIT.KILOGRAM
    }),
    quantityPrecision: 2
  });

  assert.equal(result.rawExecutableQuantity, 0.016666666667);
  assert.equal(result.executableQuantity, 0.01);
  assert.equal(result.shortageQuantity, 0.99);
});

test("割当時間が十分でも計画数量を超えない", () => {
  const result = calculator.calculate({
    allocatedMinutes: 600,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(result.rawExecutableQuantity, 100);
  assert.equal(result.executableQuantity, 60);
  assert.equal(result.shortageQuantity, 0);
});

test("割当0分なら実行可能数量0", () => {
  const result = calculator.calculate({
    allocatedMinutes: 0,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(result.executableQuantity, 0);
  assert.equal(result.shortageQuantity, 60);
});

test("Shift基準のCapacityから実行可能数量を計算する", () => {
  const result = calculator.calculate({
    allocatedMinutes: 210,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule({
      capacityValue: 60,
      capacityBasis: CAPACITY_RATE_BASIS.SHIFT
    }),
    standardShiftMinutes: 420
  });

  assert.equal(result.executableQuantity, 30);
});

test("数量単位不一致を拒否する", () => {
  assert.throws(
    () => calculator.calculate({
      allocatedMinutes: 240,
      plannedQuantity: 60,
      quantityUnit: QUANTITY_UNIT.PIECE,
      capacityRule: rule({
        quantityUnit: QUANTITY_UNIT.KILOGRAM
      })
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.CAPACITY_UNIT_MISMATCH
    )
  );
});

test("KILOGRAMの精度に負数を指定できない", () => {
  assert.throws(
    () => calculator.calculate({
      allocatedMinutes: 30,
      plannedQuantity: 10,
      quantityUnit: QUANTITY_UNIT.KILOGRAM,
      capacityRule: rule({
        quantityUnit: QUANTITY_UNIT.KILOGRAM
      }),
      quantityPrecision: -1
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_QUANTITY_PRECISION
    )
  );
});

test("計算結果を外部から変更できない", () => {
  const result = calculator.calculate({
    allocatedMinutes: 240,
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => {
    result.executableQuantity = 999;
  }, TypeError);
});
