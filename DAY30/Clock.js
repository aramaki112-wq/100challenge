import {
  ApplicationError,
  ERROR_CATEGORY,
  ERROR_CODES,
  isApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";

import {
  assertDateTime
} from "./DateTimeUtils.js";

/**
 * Current time provider Port.
 *
 * Domain and Application code must not call new Date() directly.
 * Concrete implementations must return a strict ISO 8601 DateTime
 * with an explicit timezone.
 */
export class Clock {
  now() {
    throw new ApplicationError(
      ERROR_CODES.INVALID_ARGUMENT,
      "Clock.now() must be implemented by a concrete Clock.",
      {
        category: ERROR_CATEGORY.APPLICATION,
        details: {
          contract: "Clock",
          method: "now"
        }
      }
    );
  }
}

/**
 * Validate a Clock Port without executing it.
 *
 * @param {unknown} clock
 * @returns {{ now: Function }}
 */
export function assertClock(clock) {
  const validClock =
    clock !== null &&
    (typeof clock === "object" || typeof clock === "function") &&
    typeof clock.now === "function";

  if (!validClock) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_ARGUMENT,
      "clock must implement now().",
      {
        category: ERROR_CATEGORY.APPLICATION,
        details: {
          contract: "Clock",
          requiredMethod: "now"
        }
      }
    );
  }

  return clock;
}

/**
 * Read and validate the current DateTime from a Clock Port.
 *
 * @param {unknown} clock
 * @returns {string}
 */
export function readClockNow(clock) {
  const validClock = assertClock(clock);

  let currentDateTime;

  try {
    currentDateTime = validClock.now();
  } catch (error) {
    if (isApplicationError(error)) {
      throw error;
    }

    throw wrapUnexpectedError(error, {
      component: "Clock",
      operation: "now"
    });
  }

  return assertDateTime(
    currentDateTime,
    ERROR_CODES.INVALID_DATE_TIME,
    "clock.now()"
  );
}
