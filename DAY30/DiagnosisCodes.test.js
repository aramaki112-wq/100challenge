import test from "node:test";
import assert from "node:assert/strict";

import {
  CODE_CATALOG,
  DIAGNOSIS_STATUS,
  ASSUMPTION_STATUS,
  PLAN_VERSION_STATUS,
  DIAGNOSIS_GRANULARITY,
  QUANTITY_UNIT,
  getCodeValues,
  isCodeValue,
  assertCodeMap
} from "./DiagnosisCodes.js";

test("正式なDiagnosis Statusを保持する", () => {
  assert.deepEqual(DIAGNOSIS_STATUS, {
    FEASIBLE: "FEASIBLE",
    PARTIALLY_FEASIBLE: "PARTIALLY_FEASIBLE",
    INFEASIBLE: "INFEASIBLE",
    UNKNOWN: "UNKNOWN"
  });
});

test("Assumption StatusとPlan Version Statusを区別して保持する", () => {
  assert.equal(ASSUMPTION_STATUS.EXPECTED, "EXPECTED");
  assert.equal(PLAN_VERSION_STATUS.APPROVED, "APPROVED");
  assert.equal("EXPECTED" in PLAN_VERSION_STATUS, false);
});

test("診断粒度はDAY・SHIFT・TIME・UNAVAILABLEを保持する", () => {
  assert.deepEqual(getCodeValues(DIAGNOSIS_GRANULARITY), [
    "DAY",
    "SHIFT",
    "TIME",
    "UNAVAILABLE"
  ]);
});

test("数量単位はPIECE・KILOGRAM・LOTに限定する", () => {
  assert.deepEqual(getCodeValues(QUANTITY_UNIT), [
    "PIECE",
    "KILOGRAM",
    "LOT"
  ]);
});

test("Code MapとCatalogは外部から変更できない", () => {
  assert.equal(Object.isFrozen(DIAGNOSIS_STATUS), true);
  assert.equal(Object.isFrozen(CODE_CATALOG), true);

  assert.throws(() => {
    DIAGNOSIS_STATUS.FEASIBLE = "MAYBE_FEASIBLE";
  }, TypeError);
});

test("すべてのCode MapでKeyとValueを一致させる", () => {
  for (const [catalogName, codeMap] of Object.entries(CODE_CATALOG)) {
    for (const [key, value] of Object.entries(codeMap)) {
      assert.equal(
        key,
        value,
        `${catalogName}.${key}のKeyとValueが一致していません。`
      );
    }
  }
});

test("一つのCode Map内に重複Valueを持たない", () => {
  for (const [catalogName, codeMap] of Object.entries(CODE_CATALOG)) {
    const values = Object.values(codeMap);
    const uniqueValues = new Set(values);

    assert.equal(
      uniqueValues.size,
      values.length,
      `${catalogName}に重複Codeがあります。`
    );
  }
});

test("isCodeValueで正式Codeを判定できる", () => {
  assert.equal(isCodeValue(DIAGNOSIS_STATUS, "INFEASIBLE"), true);
  assert.equal(isCodeValue(DIAGNOSIS_STATUS, "DIFFICULT"), false);
});

test("Code Map以外をHelperへ渡した場合は拒否する", () => {
  assert.throws(() => assertCodeMap(null), TypeError);
  assert.throws(() => getCodeValues([]), TypeError);
});
