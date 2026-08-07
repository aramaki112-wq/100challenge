import test from "node:test";
import assert from "node:assert/strict";

import {
  NEXT_CHECK_PRIORITY,
  NEXT_CHECK_SOURCE_TYPE,
  NEXT_CHECK_STATUS,
  NEXT_CHECK_TYPE
} from "./DiagnosisCodes.js";

import { ERROR_CODES, hasErrorCode } from "./DiagnosisErrors.js";
import { NextCheck, assertNextCheck } from "./NextCheck.js";

function createCheck(overrides = {}) {
  return new NextCheck({
    nextCheckId: "NC-0001",
    plannedOperationId: "POP-0001",
    sourceType: NEXT_CHECK_SOURCE_TYPE.ASSUMPTION_FINDING,
    sourceId: "AF-0001",
    checkType: NEXT_CHECK_TYPE.CONFIRM_ASSUMPTION,
    priority: NEXT_CHECK_PRIORITY.HIGH,
    status: NEXT_CHECK_STATUS.OPEN,
    title: "材料到着を確認する",
    description: "仕入先へ到着予定日時を確認してください。",
    owner: "生産管理",
    dueDate: "2026-08-02",
    createdAt: "2026-08-01T21:00:00+09:00",
    ...overrides
  });
}

test("OPEN Next Checkを不変Objectとして生成できる", () => {
  const check = createCheck();
  assert.equal(check.isOpen(), true);
  assert.equal(Object.isFrozen(check), true);
});

test("期限当日はOverdueにしない", () => {
  const check = createCheck();
  assert.equal(check.isOverdue("2026-08-02"), false);
  assert.equal(check.isOverdue("2026-08-03"), true);
});

test("COMPLETEDには完了日時・完了者・結果が必要", () => {
  assert.throws(
    () => createCheck({ status: NEXT_CHECK_STATUS.COMPLETED }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_NEXT_CHECK_STATE)
  );
});

test("COMPLETEDを正式な完了情報付きで生成できる", () => {
  const check = createCheck({
    status: NEXT_CHECK_STATUS.COMPLETED,
    completedAt: "2026-08-02T10:00:00+09:00",
    completedBy: "担当A",
    result: "8月3日午前に到着予定と確認",
    evidence: "仕入先メール"
  });
  assert.equal(check.isOpen(), false);
  assert.equal(check.isOverdue("2026-08-10"), false);
});

test("完了日時が作成日時より前の場合は拒否する", () => {
  assert.throws(
    () => createCheck({
      status: NEXT_CHECK_STATUS.COMPLETED,
      completedAt: "2026-08-01T20:00:00+09:00",
      completedBy: "担当A",
      result: "確認済み"
    }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_NEXT_CHECK_STATE)
  );
});

test("OPENに完了情報を混在させない", () => {
  assert.throws(
    () => createCheck({ result: "確認済み" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_NEXT_CHECK_STATE)
  );
});

test("CANNOT_CONFIRMには理由が必要", () => {
  assert.throws(
    () => createCheck({ status: NEXT_CHECK_STATUS.CANNOT_CONFIRM }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_NEXT_CHECK_STATE)
  );
});

test("CANNOT_CONFIRMは理由を残して閉じられる", () => {
  const check = createCheck({
    status: NEXT_CHECK_STATUS.CANNOT_CONFIRM,
    result: "外部委託先から回答を得られない"
  });
  assert.equal(check.isOpen(), false);
});

test("正式でないCheck Typeを拒否する", () => {
  assert.throws(
    () => createCheck({ checkType: "CALL_SOMEONE" }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_NEXT_CHECK)
  );
});

test("Snapshotは変更できない", () => {
  const snapshot = createCheck().toSnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.throws(() => {
    snapshot.status = NEXT_CHECK_STATUS.COMPLETED;
  }, TypeError);
});

test("assertNextCheckは別Objectを拒否する", () => {
  assert.throws(
    () => assertNextCheck({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_NEXT_CHECK)
  );
});
