import { ApplicationError, ERROR_CODES } from "./errors.js";

export function parseDateTime(value, label = "dateTime") {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    throw new ApplicationError(ERROR_CODES.INVALID_TIME, `${label} is invalid.`, { value });
  }
  return time;
}

export function dateKey(value) {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new ApplicationError(ERROR_CODES.INVALID_TIME, "date is invalid.", { value });
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthDateKeys(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new ApplicationError(ERROR_CODES.INVALID_TIME, "month must be YYYY-MM.", { month });
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const result = [];
  const current = new Date(year, monthNumber - 1, 1);
  while (current.getMonth() === monthNumber - 1) {
    result.push(dateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export function combineDateAndTime(date, time) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

export function overlaps(startA, endA, startB, endB) {
  return parseDateTime(startA) < parseDateTime(endB) && parseDateTime(startB) < parseDateTime(endA);
}

export function intersectionMinutes(startA, endA, startB, endB) {
  const start = Math.max(parseDateTime(startA), parseDateTime(startB));
  const end = Math.min(parseDateTime(endA), parseDateTime(endB));
  return Math.max(0, (end - start) / 60000);
}

export function durationMinutes(startAt, endAt) {
  return Math.max(0, (parseDateTime(endAt) - parseDateTime(startAt)) / 60000);
}

export function addDays(date, days) {
  const value = new Date(`${dateKey(date)}T00:00:00`);
  value.setDate(value.getDate() + days);
  return dateKey(value);
}

export function formatLocalDateTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new ApplicationError(ERROR_CODES.INVALID_TIME, "dateTime is invalid.", { value });
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}
