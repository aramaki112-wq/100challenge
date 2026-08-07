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
  RequiredTimeCalculator
} from "./RequiredTimeCalculator.js";

const calculator = new RequiredTimeCalculator();

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

test("10本／時間で60本の必要時間は360分", () => {
  const result = calculator.calculate({
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(result.requiredMinutes, 360);
  assert.equal(result.rawRequiredMinutes, 360);
  assert.equal(result.basisMinutes, 60);
});

test("60本／Shift・標準420分で30本の必要時間は210分", () => {
  const result = calculator.calculate({
    plannedQuantity: 30,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule({
      capacityValue: 60,
      capacityBasis: CAPACITY_RATE_BASIS.SHIFT
    }),
    standardShiftMinutes: 420
  });

  assert.equal(result.requiredMinutes, 210);
  assert.equal(result.basisMinutes, 420);
});

test("120本／日・標準840分で60本の必要時間は420分", () => {
  const result = calculator.calculate({
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule({
      capacityValue: 120,
      capacityBasis: CAPACITY_RATE_BASIS.DAY
    }),
    standardDayMinutes: 840
  });

  assert.equal(result.requiredMinutes, 420);
  assert.equal(result.basisMinutes, 840);
});

test("能力倍率を有効能力へ反映する", () => {
  const result = calculator.calculate({
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule({
      capacityValue: 10,
      capacityMultiplier: 0.8
    })
  });

  assert.equal(result.effectiveCapacity, 8);
  assert.equal(result.requiredMinutes, 450);
});

test("必要時間は過少評価を防ぐため分単位で切り上げる", () => {
  const result = calculator.calculate({
    plannedQuantity: 1,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule({ capacityValue: 7 })
  });

  assert.equal(result.rawRequiredMinutes, 8.571428571429);
  assert.equal(result.requiredMinutes, 9);
});

test("数量単位とCapacity Rule単位が異なる場合は拒否する", () => {
  assert.throws(
    () => calculator.calculate({
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

test("Capacity値0を拒否する", () => {
  assert.throws(
    () => calculator.calculate({
      plannedQuantity: 60,
      quantityUnit: QUANTITY_UNIT.PIECE,
      capacityRule: rule({ capacityValue: 0 })
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_VALUE
    )
  );
});

test("Shift基準で標準Shift時間がない場合は拒否する", () => {
  assert.throws(
    () => calculator.calculate({
      plannedQuantity: 30,
      quantityUnit: QUANTITY_UNIT.PIECE,
      capacityRule: rule({
        capacityValue: 60,
        capacityBasis: CAPACITY_RATE_BASIS.SHIFT
      })
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_STANDARD_DURATION
    )
  );
});

test("計算結果を外部から変更できない", () => {
  const result = calculator.calculate({
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityRule: rule()
  });

  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => {
    result.requiredMinutes = 1;
  }, TypeError);
});
