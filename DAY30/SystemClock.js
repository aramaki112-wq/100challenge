import {
  Clock
} from "./Clock.js";

import {
  ApplicationError,
  ERROR_CATEGORY,
  ERROR_CODES,
  isApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";

/**
 * Production Clock backed by the host system time.
 *
 * DateTime is returned in UTC ISO 8601 form so that it always includes
 * an explicit timezone marker (Z).
 */
export class SystemClock extends Clock {
  #dateFactory;

  constructor({
    dateFactory = () => new Date()
  } = {}) {
    super();

    if (typeof dateFactory !== "function") {
      throw new ApplicationError(
        ERROR_CODES.INVALID_ARGUMENT,
        "dateFactory must be a function.",
        {
          category: ERROR_CATEGORY.APPLICATION,
          details: {
            valueType: typeof dateFactory
          }
        }
      );
    }

    this.#dateFactory = dateFactory;

    Object.freeze(this);
  }

  now() {
    let currentDate;

    try {
      currentDate = this.#dateFactory();
    } catch (error) {
      if (isApplicationError(error)) {
        throw error;
      }

      throw wrapUnexpectedError(error, {
        component: "SystemClock",
        operation: "dateFactory"
      });
    }

    if (
      !(currentDate instanceof Date) ||
      Number.isNaN(currentDate.getTime())
    ) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_DATE_TIME,
        "dateFactory must return a valid Date instance.",
        {
          category: ERROR_CATEGORY.APPLICATION,
          details: {
            returnedType:
              currentDate === null
                ? "null"
                : typeof currentDate
          }
        }
      );
    }

    return currentDate.toISOString();
  }
}
