import test from "node:test";
import assert from "node:assert/strict";

import {
  Clock,
  assertClock,
  readClockNow
} from "./Clock.js";

import {
  FixedClock
} from "./FixedClock.js";

import {
  SystemClock
} from "./SystemClock.js";

import {
  ERROR_CODES,
  hasErrorCode,
  isApplicationError
} from "./DiagnosisErrors.js";

test(
  "Clock基底Classはnow未実装を明示的に拒否する",
  () => {
    const clock = new Clock();

    assert.throws(
      () => clock.now(),
      (error) =>
        isApplicationError(error) &&
        hasErrorCode(error, ERROR_CODES.INVALID_ARGUMENT)
    );
  }
);

test(
  "assertClockはnow Methodを持つClockを受け付ける",
  () => {
    const clock = new FixedClock(
      "2026-08-01T17:07:00+09:00"
    );

    assert.equal(assertClock(clock), clock);
  }
);

test(
  "assertClockはClock契約を満たさない値を拒否する",
  () => {
    for (const value of [null, {}, { now: "not-function" }]) {
      assert.throws(
        () => assertClock(value),
        (error) =>
          hasErrorCode(error, ERROR_CODES.INVALID_ARGUMENT)
      );
    }
  }
);

test(
  "FixedClockは指定したTimezone付きDateTimeを繰り返し返す",
  () => {
    const clock = new FixedClock(
      " 2026-08-01T17:07:00+09:00 "
    );

    assert.equal(
      clock.now(),
      "2026-08-01T17:07:00+09:00"
    );

    assert.equal(
      clock.now(),
      "2026-08-01T17:07:00+09:00"
    );

    assert.equal(Object.isFrozen(clock), true);
  }
);

test(
  "FixedClockはTimezoneのないDateTimeを拒否する",
  () => {
    assert.throws(
      () => new FixedClock("2026-08-01T17:07:00"),
      (error) =>
        hasErrorCode(error, ERROR_CODES.INVALID_DATE_TIME)
    );
  }
);

test(
  "readClockNowはClockの戻り値を正式DateTimeとして検証する",
  () => {
    assert.equal(
      readClockNow({
        now: () => "2026-08-01T08:07:00Z"
      }),
      "2026-08-01T08:07:00Z"
    );

    assert.throws(
      () => readClockNow({ now: () => "2026-08-01" }),
      (error) =>
        hasErrorCode(error, ERROR_CODES.INVALID_DATE_TIME)
    );
  }
);

test(
  "SystemClockはDateをUTC ISO 8601 DateTimeへ変換する",
  () => {
    const clock = new SystemClock({
      dateFactory: () =>
        new Date("2026-08-01T17:07:00+09:00")
    });

    assert.equal(
      clock.now(),
      "2026-08-01T08:07:00.000Z"
    );

    assert.equal(
      readClockNow(clock),
      "2026-08-01T08:07:00.000Z"
    );
  }
);

test(
  "SystemClockは不正なdateFactoryを拒否する",
  () => {
    assert.throws(
      () => new SystemClock({ dateFactory: "invalid" }),
      (error) =>
        hasErrorCode(error, ERROR_CODES.INVALID_ARGUMENT)
    );
  }
);

test(
  "SystemClockは有効なDate以外の戻り値を拒否する",
  () => {
    const invalidReturnClock = new SystemClock({
      dateFactory: () => "2026-08-01T08:07:00Z"
    });

    const invalidDateClock = new SystemClock({
      dateFactory: () => new Date("invalid")
    });

    assert.throws(
      () => invalidReturnClock.now(),
      (error) =>
        hasErrorCode(error, ERROR_CODES.INVALID_DATE_TIME)
    );

    assert.throws(
      () => invalidDateClock.now(),
      (error) =>
        hasErrorCode(error, ERROR_CODES.INVALID_DATE_TIME)
    );
  }
);

test(
  "SystemClockはdateFactoryの予期しないErrorをUNEXPECTED_ERRORとして保持する",
  () => {
    const cause = new Error("clock source failed");
    const clock = new SystemClock({
      dateFactory: () => {
        throw cause;
      }
    });

    assert.throws(
      () => clock.now(),
      (error) => {
        assert.equal(
          hasErrorCode(error, ERROR_CODES.UNEXPECTED_ERROR),
          true
        );

        assert.equal(error.cause, cause);

        return true;
      }
    );
  }
);
