import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CATEGORY,
  ERROR_CODES,
  ApplicationError,
  isApplicationError,
  hasErrorCode,
  createDomainError,
  createImportError,
  wrapUnexpectedError,
  assertNonEmptyString,
  assertBoolean,
  assertPositiveInteger,
  assertNonNegativeInteger,
  assertFiniteNumber,
  assertArray,
  assertPlainObject,
  assertCodeValue
} from "./DiagnosisErrors.js";

import {
  DIAGNOSIS_STATUS
} from "./DiagnosisCodes.js";

test("ERROR_CODESとERROR_CATEGORYは変更できない", () => {
  assert.equal(Object.isFrozen(ERROR_CODES), true);
  assert.equal(Object.isFrozen(ERROR_CATEGORY), true);

  assert.throws(() => {
    ERROR_CODES.INVALID_ARGUMENT = "CHANGED";
  }, TypeError);
});

test("ApplicationErrorはCode・Category・Detailsを保持する", () => {
  const error = new ApplicationError(
    ERROR_CODES.ENTITY_NOT_FOUND,
    "Entity was not found.",
    {
      category: ERROR_CATEGORY.APPLICATION,
      details: { entityId: "POP-0001" }
    }
  );

  assert.equal(error.name, "ApplicationError");
  assert.equal(error.code, ERROR_CODES.ENTITY_NOT_FOUND);
  assert.equal(error.category, ERROR_CATEGORY.APPLICATION);
  assert.deepEqual(error.details, { entityId: "POP-0001" });
  assert.equal(Object.isFrozen(error.details), true);
});

test("ApplicationErrorは原因Errorを保持できる", () => {
  const cause = new Error("Original failure");
  const error = createImportError(
    ERROR_CODES.IMPORT_TRANSACTION_FAILED,
    "Import transaction failed.",
    { importBatchId: "IMP-001" },
    cause
  );

  assert.equal(error.cause, cause);
  assert.equal(error.category, ERROR_CATEGORY.IMPORT);
});

test("isApplicationErrorとhasErrorCodeで想定Errorを識別できる", () => {
  const error = createDomainError(
    ERROR_CODES.INVALID_PLANNED_QUANTITY,
    "Quantity is invalid."
  );

  assert.equal(isApplicationError(error), true);
  assert.equal(isApplicationError(new Error("x")), false);
  assert.equal(hasErrorCode(error, ERROR_CODES.INVALID_PLANNED_QUANTITY), true);
  assert.equal(hasErrorCode(error, ERROR_CODES.INVALID_ARGUMENT), false);
});

test("toJSONは利用者表示・Log用の安全な構造を返す", () => {
  const error = createDomainError(
    ERROR_CODES.INVALID_PRIORITY,
    "Priority must be positive.",
    { value: 0 }
  );

  assert.deepEqual(error.toJSON(), {
    name: "ApplicationError",
    code: ERROR_CODES.INVALID_PRIORITY,
    category: ERROR_CATEGORY.DOMAIN,
    message: "Priority must be positive.",
    details: { value: 0 }
  });
});

test("未登録Error CodeをApplicationErrorへ渡すと拒否する", () => {
  assert.throws(
    () => new ApplicationError("UNKNOWN_CODE", "Message"),
    TypeError
  );
});

test("assertNonEmptyStringは前後空白を除いて返す", () => {
  assert.equal(assertNonEmptyString("  POP-0001  "), "POP-0001");

  assert.throws(
    () => assertNonEmptyString("   ", ERROR_CODES.INVALID_PLAN_ID, "planId"),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_PLAN_ID)
  );
});

test("数値・Boolean・Array・Plain Objectを厳密に検証する", () => {
  assert.equal(assertBoolean(false), false);
  assert.equal(assertPositiveInteger(1), 1);
  assert.equal(assertNonNegativeInteger(0), 0);
  assert.equal(assertFiniteNumber(1.5, undefined, "value", { min: 0 }), 1.5);
  assert.deepEqual(assertArray([]), []);
  assert.deepEqual(assertPlainObject({ a: 1 }), { a: 1 });

  assert.throws(() => assertBoolean(0), ApplicationError);
  assert.throws(() => assertPositiveInteger(0), ApplicationError);
  assert.throws(() => assertNonNegativeInteger(-1), ApplicationError);
  assert.throws(() => assertFiniteNumber(Number.NaN), ApplicationError);
  assert.throws(() => assertArray({}), ApplicationError);
  assert.throws(() => assertPlainObject([]), ApplicationError);
});

test("assertCodeValueは正式Codeだけを許可する", () => {
  assert.equal(
    assertCodeValue("INFEASIBLE", DIAGNOSIS_STATUS),
    "INFEASIBLE"
  );

  assert.throws(
    () => assertCodeValue("DIFFICULT", DIAGNOSIS_STATUS),
    (error) => {
      assert.equal(hasErrorCode(error, ERROR_CODES.INVALID_CODE_VALUE), true);
      assert.deepEqual(error.details.allowedValues, [
        "FEASIBLE",
        "PARTIALLY_FEASIBLE",
        "INFEASIBLE",
        "UNKNOWN"
      ]);
      return true;
    }
  );
});

test("想定外ErrorをUNEXPECTED_ERRORへ変換し、ApplicationErrorは二重変換しない", () => {
  const original = new Error("Broken adapter");
  const wrapped = wrapUnexpectedError(original, { adapter: "DAY29" });

  assert.equal(wrapped.code, ERROR_CODES.UNEXPECTED_ERROR);
  assert.equal(wrapped.category, ERROR_CATEGORY.UNEXPECTED);
  assert.equal(wrapped.cause, original);

  const domainError = createDomainError(
    ERROR_CODES.INVALID_ARGUMENT,
    "Invalid argument."
  );

  assert.equal(wrapUnexpectedError(domainError), domainError);
});

test("一つのError Code Map内に重複Valueを持たない", () => {
  const values = Object.values(ERROR_CODES);
  assert.equal(new Set(values).size, values.length);

  for (const [key, value] of Object.entries(ERROR_CODES)) {
    assert.equal(key, value);
  }
});
