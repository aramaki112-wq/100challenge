import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";

function parseTime(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_TIME,
      `${label} must be a valid date-time.`,
      { value }
    );
  }
  return date;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatLocalDateTime(value) {
  const date = value instanceof Date ? value : parseTime(value, "value");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds())
  ].join("");
}

export class TimeSlot {
  constructor({ startAt, endAt }) {
    const start = parseTime(startAt, "startAt");
    const end = parseTime(endAt, "endAt");

    if (start >= end) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_TIME_SLOT,
        "TimeSlot requires startAt to be earlier than endAt.",
        { startAt, endAt }
      );
    }

    this.startAt = formatLocalDateTime(start);
    this.endAt = formatLocalDateTime(end);
    this.startTime = start.getTime();
    this.endTime = end.getTime();
    this.durationMinutes = (this.endTime - this.startTime) / 60000;
    Object.freeze(this);
  }

  contains(value) {
    const time = parseTime(value, "value").getTime();
    return this.startTime <= time && time < this.endTime;
  }

  overlaps(other) {
    const slot = other instanceof TimeSlot ? other : new TimeSlot(other);
    return this.startTime < slot.endTime && slot.startTime < this.endTime;
  }

  isAdjacentTo(other) {
    const slot = other instanceof TimeSlot ? other : new TimeSlot(other);
    return this.endTime === slot.startTime || slot.endTime === this.startTime;
  }

  toPlainObject() {
    return {
      startAt: this.startAt,
      endAt: this.endAt,
      durationMinutes: this.durationMinutes
    };
  }
}
