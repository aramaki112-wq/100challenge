import { ApplicationError, ERROR_CODES } from "./errors.js";
import { dateKey } from "./Day29DateTime.js";

export class EffectivePeriod {
  constructor({ startDate = "0001-01-01", endDate = "9999-12-31" } = {}) {
    this.startDate = dateKey(startDate);
    this.endDate = dateKey(endDate);
    if (this.startDate > this.endDate) {
      throw new ApplicationError(ERROR_CODES.INVALID_EFFECTIVE_PERIOD, "startDate must be <= endDate.", {
        startDate: this.startDate,
        endDate: this.endDate
      });
    }
    Object.freeze(this);
  }

  contains(value) {
    const date = dateKey(value);
    return this.startDate <= date && date <= this.endDate;
  }

  overlaps(other) {
    const target = other instanceof EffectivePeriod ? other : new EffectivePeriod(other);
    return this.startDate <= target.endDate && target.startDate <= this.endDate;
  }

  toPlainObject() {
    return { startDate: this.startDate, endDate: this.endDate };
  }
}
