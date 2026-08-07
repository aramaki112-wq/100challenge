import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  TimeSlot,
  formatLocalDateTime
} from "./TimeSlot.js";

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

function addBoundary(boundaries, value, startTime, endTime) {
  if (!value) return;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return;
  const time = date.getTime();
  if (startTime < time && time < endTime) boundaries.add(time);
}

export function buildCapacityTimeSlots({
  startAt,
  endAt,
  intervalMinutes,
  events = []
}) {
  const start = parseTime(startAt, "startAt");
  const end = parseTime(endAt, "endAt");
  if (start >= end) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_TIME_SLOT,
      "Calendar startAt must be earlier than endAt.",
      { startAt, endAt }
    );
  }
  if (!Number.isInteger(intervalMinutes) || intervalMinutes <= 0) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_INTERVAL_MINUTES,
      "intervalMinutes must be a positive integer.",
      { intervalMinutes }
    );
  }

  const startTime = start.getTime();
  const endTime = end.getTime();
  const boundaries = new Set([startTime, endTime]);
  const intervalMs = intervalMinutes * 60000;

  for (let time = startTime + intervalMs; time < endTime; time += intervalMs) {
    boundaries.add(time);
  }

  for (const event of events) {
    addBoundary(boundaries, event?.occurredAt, startTime, endTime);
    addBoundary(boundaries, event?.payload?.startAt, startTime, endTime);
    addBoundary(boundaries, event?.payload?.endAt, startTime, endTime);
  }

  const ordered = [...boundaries].sort((a, b) => a - b);
  return ordered.slice(0, -1).map((time, index) => new TimeSlot({
    startAt: formatLocalDateTime(new Date(time)),
    endAt: formatLocalDateTime(new Date(ordered[index + 1]))
  }));
}
