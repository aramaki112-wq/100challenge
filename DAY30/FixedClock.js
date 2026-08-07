import {
  Clock
} from "./Clock.js";

import {
  ERROR_CODES
} from "./DiagnosisErrors.js";

import {
  assertDateTime
} from "./DateTimeUtils.js";

/**
 * Deterministic Clock for automated tests and reproducible scenarios.
 */
export class FixedClock extends Clock {
  #fixedDateTime;

  constructor(fixedDateTime) {
    super();

    this.#fixedDateTime = assertDateTime(
      fixedDateTime,
      ERROR_CODES.INVALID_DATE_TIME,
      "fixedDateTime"
    );

    Object.freeze(this);
  }

  now() {
    return this.#fixedDateTime;
  }
}
