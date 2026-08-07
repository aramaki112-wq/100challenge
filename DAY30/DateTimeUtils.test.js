import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  isLeapYear,
  getDaysInMonth,
  isValidTargetMonth,
  assertTargetMonth,
  isValidDate,
  assertDate,
  isValidTime,
  assertTime,
  parseDateTime,
  isValidDateTime,
  assertDateTime,
  compareDates,
  compareTimes,
  compareDateTimes,
  isDateInTargetMonth,
  assertOptionalTimeRange
} from "./DateTimeUtils.js";

test("Gregorian calendarの閏年を正しく判定する", () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2026), false);
  assert.equal(isLeapYear(1900), false);
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(2024.5), false);
});

test("月ごとの正しい日数を返す", () => {
  assert.equal(getDaysInMonth(2026, 1), 31);
  assert.equal(getDaysInMonth(2026, 2), 28);
  assert.equal(getDaysInMonth(2024, 2), 29);
  assert.equal(getDaysInMonth(2026, 4), 30);
});

test("getDaysInMonthは不正な年・月を拒否する", () => {
  assert.throws(
    () => getDaysInMonth(2026, 13),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DATE)
  );

  assert.throws(
    () => getDaysInMonth(0, 1),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DATE)
  );
});

test("targetMonthはyyyy-mmだけを許可する", () => {
  assert.equal(isValidTargetMonth("2026-08"), true);
  assert.equal(isValidTargetMonth(" 2026-08 "), true);
  assert.equal(isValidTargetMonth("2026-8"), false);
  assert.equal(isValidTargetMonth("2026-00"), false);
  assert.equal(isValidTargetMonth("2026-13"), false);
  assert.equal(isValidTargetMonth("0000-01"), false);
  assert.equal(assertTargetMonth(" 2026-08 "), "2026-08");
});

test("不正なtargetMonthはINVALID_TARGET_MONTHになる", () => {
  assert.throws(
    () => assertTargetMonth("2026/08"),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_TARGET_MONTH)
  );
});

test("dateは実在するyyyy-mm-ddだけを許可する", () => {
  assert.equal(isValidDate("2026-08-01"), true);
  assert.equal(isValidDate("2024-02-29"), true);
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2026-02-30"), false);
  assert.equal(isValidDate("2026-04-31"), false);
  assert.equal(isValidDate("2026-13-01"), false);
  assert.equal(isValidDate("2026-8-01"), false);
});

test("assertDateは前後空白を除き、不正日付をINVALID_DATEにする", () => {
  assert.equal(assertDate(" 2026-08-01 "), "2026-08-01");

  assert.throws(
    () => assertDate("2026-02-30"),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DATE)
  );
});

test("timeは24時間表記hh:mmだけを許可する", () => {
  assert.equal(isValidTime("00:00"), true);
  assert.equal(isValidTime("23:59"), true);
  assert.equal(isValidTime("24:00"), false);
  assert.equal(isValidTime("09:60"), false);
  assert.equal(isValidTime("9:00"), false);
  assert.equal(assertTime(" 06:30 "), "06:30");
});

test("DateTimeは秒とTimezoneを持つISO 8601だけを許可する", () => {
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00+09:00"),
    true
  );
  assert.equal(
    isValidDateTime("2026-07-31T20:00:00Z"),
    true
  );
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00.123456789+09:00"),
    true
  );
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00"),
    false
  );
  assert.equal(
    isValidDateTime("2026-02-30T05:00:00+09:00"),
    false
  );
  assert.equal(
    isValidDateTime("2026-08-01T05:00+09:00"),
    false
  );
});

test("DateTimeのTimezoneは実用範囲±14:00までとする", () => {
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00+14:00"),
    true
  );
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00-14:00"),
    true
  );
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00+14:01"),
    false
  );
  assert.equal(
    isValidDateTime("2026-08-01T05:00:00+15:00"),
    false
  );
});

test("parseDateTimeはTimezoneを考慮したEpochを返す", () => {
  const tokyo = parseDateTime(
    "2026-08-01T05:00:00+09:00"
  );
  const utc = parseDateTime(
    "2026-07-31T20:00:00Z"
  );

  assert.notEqual(tokyo, null);
  assert.notEqual(utc, null);
  assert.equal(tokyo.epochMilliseconds, utc.epochMilliseconds);
  assert.equal(tokyo.offsetMinutes, 540);
  assert.equal(Object.isFrozen(tokyo), true);
});

test("assertDateTimeはTimezoneなしをINVALID_DATE_TIMEにする", () => {
  assert.equal(
    assertDateTime(" 2026-08-01T05:00:00+09:00 "),
    "2026-08-01T05:00:00+09:00"
  );

  assert.throws(
    () => assertDateTime("2026-08-01T05:00:00"),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_DATE_TIME)
  );
});

test("dateとtimeを順序比較できる", () => {
  assert.equal(compareDates("2026-08-01", "2026-08-02"), -1);
  assert.equal(compareDates("2026-08-02", "2026-08-02"), 0);
  assert.equal(compareDates("2026-08-03", "2026-08-02"), 1);

  assert.equal(compareTimes("06:00", "14:00"), -1);
  assert.equal(compareTimes("14:00", "14:00"), 0);
  assert.equal(compareTimes("22:00", "14:00"), 1);
});

test("DateTime比較は表記上の時刻でなく実際の瞬間を比較する", () => {
  assert.equal(
    compareDateTimes(
      "2026-08-01T05:00:00+09:00",
      "2026-07-31T20:00:00Z"
    ),
    0
  );

  assert.equal(
    compareDateTimes(
      "2026-08-01T05:00:01+09:00",
      "2026-07-31T20:00:00Z"
    ),
    1
  );
});

test("dateがtargetMonth内か確認できる", () => {
  assert.equal(isDateInTargetMonth("2026-08-01", "2026-08"), true);
  assert.equal(isDateInTargetMonth("2026-07-31", "2026-08"), false);
});

test("開始・終了時刻が両方未入力なら未指定Rangeとして扱う", () => {
  assert.deepEqual(
    assertOptionalTimeRange(null, null),
    {
      startTime: null,
      endTime: null,
      overnight: false,
      durationMinutes: null
    }
  );
});

test("開始・終了の片方だけ入力されたRangeを拒否する", () => {
  assert.throws(
    () => assertOptionalTimeRange("06:00", null),
    (error) => hasErrorCode(error, ERROR_CODES.INCOMPLETE_TIME_RANGE)
  );

  assert.throws(
    () => assertOptionalTimeRange(null, "14:00"),
    (error) => hasErrorCode(error, ERROR_CODES.INCOMPLETE_TIME_RANGE)
  );
});

test("通常の時間範囲からDurationを計算する", () => {
  assert.deepEqual(
    assertOptionalTimeRange("06:00", "14:00"),
    {
      startTime: "06:00",
      endTime: "14:00",
      overnight: false,
      durationMinutes: 480
    }
  );
});

test("同一時刻は0分として扱わず不正Rangeにする", () => {
  assert.throws(
    () => assertOptionalTimeRange("06:00", "06:00"),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_TIME_RANGE)
  );
});

test("日またぎは明示的に許可された場合だけDurationを計算する", () => {
  assert.throws(
    () => assertOptionalTimeRange("22:00", "06:00"),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_TIME_RANGE)
  );

  assert.deepEqual(
    assertOptionalTimeRange(
      "22:00",
      "06:00",
      { allowOvernight: true }
    ),
    {
      startTime: "22:00",
      endTime: "06:00",
      overnight: true,
      durationMinutes: 480
    }
  );
});
