import {
  ERROR_CODES,
  createDomainError
} from "./DiagnosisErrors.js";

const TARGET_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):([0-5]\d))$/;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function createInvalidDateError(code, label, value, format) {
  return createDomainError(
    code,
    `${label} must be a valid ${format}.`,
    {
      label,
      value,
      expectedFormat: format
    }
  );
}

/**
 * Gregorian calendar leap-year rule.
 *
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  if (!Number.isInteger(year)) {
    return false;
  }

  return year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Return the number of days in a Gregorian calendar month.
 *
 * @param {number} year
 * @param {number} month 1-12
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  if (!isIntegerInRange(year, 1, 9999)) {
    throw createDomainError(
      ERROR_CODES.INVALID_DATE,
      "year must be an integer between 1 and 9999.",
      { year }
    );
  }

  if (!isIntegerInRange(month, 1, 12)) {
    throw createDomainError(
      ERROR_CODES.INVALID_DATE,
      "month must be an integer between 1 and 12.",
      { month }
    );
  }

  const daysByMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];

  return daysByMonth[month - 1];
}

/**
 * Validate yyyy-mm without relying on JavaScript Date normalization.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidTargetMonth(value) {
  const normalized = normalizeString(value);

  if (typeof normalized !== "string") {
    return false;
  }

  const match = TARGET_MONTH_PATTERN.exec(normalized);

  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  return isIntegerInRange(year, 1, 9999) &&
    isIntegerInRange(month, 1, 12);
}

/**
 * @param {unknown} value
 * @param {string} code
 * @param {string} label
 * @returns {string}
 */
export function assertTargetMonth(
  value,
  code = ERROR_CODES.INVALID_TARGET_MONTH,
  label = "targetMonth"
) {
  const normalized = normalizeString(value);

  if (!isValidTargetMonth(normalized)) {
    throw createInvalidDateError(
      code,
      label,
      value,
      "yyyy-mm target month"
    );
  }

  return normalized;
}

/**
 * Validate yyyy-mm-dd strictly against the Gregorian calendar.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidDate(value) {
  const normalized = normalizeString(value);

  if (typeof normalized !== "string") {
    return false;
  }

  const match = DATE_PATTERN.exec(normalized);

  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !isIntegerInRange(year, 1, 9999) ||
    !isIntegerInRange(month, 1, 12)
  ) {
    return false;
  }

  return isIntegerInRange(
    day,
    1,
    getDaysInMonth(year, month)
  );
}

/**
 * @param {unknown} value
 * @param {string} code
 * @param {string} label
 * @returns {string}
 */
export function assertDate(
  value,
  code = ERROR_CODES.INVALID_DATE,
  label = "date"
) {
  const normalized = normalizeString(value);

  if (!isValidDate(normalized)) {
    throw createInvalidDateError(
      code,
      label,
      value,
      "yyyy-mm-dd calendar date"
    );
  }

  return normalized;
}

/**
 * Validate hh:mm using a 24-hour clock.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidTime(value) {
  const normalized = normalizeString(value);

  return typeof normalized === "string" &&
    TIME_PATTERN.test(normalized);
}

/**
 * @param {unknown} value
 * @param {string} code
 * @param {string} label
 * @returns {string}
 */
export function assertTime(
  value,
  code = ERROR_CODES.INVALID_TIME,
  label = "time"
) {
  const normalized = normalizeString(value);

  if (!isValidTime(normalized)) {
    throw createInvalidDateError(
      code,
      label,
      value,
      "hh:mm time"
    );
  }

  return normalized;
}

function parseTimeToMinutes(value) {
  const validTime = assertTime(value);
  const [hour, minute] = validTime.split(":").map(Number);

  return hour * 60 + minute;
}

function validateOffsetHour(hour, minute) {
  return hour >= 0 &&
    hour <= 14 &&
    minute >= 0 &&
    minute <= 59 &&
    !(hour === 14 && minute !== 0);
}

function createUtcMilliseconds({
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond
}) {
  const date = new Date(0);

  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);

  return date.getTime();
}

/**
 * Parse a strict ISO 8601 DateTime with an explicit timezone.
 * Seconds are required. Timezone must be Z or ±hh:mm.
 * Practical timezone offsets are limited to ±14:00.
 *
 * @param {unknown} value
 * @returns {null|Readonly<{
 *   value: string,
 *   epochMilliseconds: number,
 *   offsetMinutes: number
 * }>}
 */
export function parseDateTime(value) {
  const normalized = normalizeString(value);

  if (typeof normalized !== "string") {
    return null;
  }

  const match = DATE_TIME_PATTERN.exec(normalized);

  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = match[7] ?? "";
  const timezone = match[8];
  const offsetSign = match[9] ?? null;
  const offsetHour = match[10] === undefined ? 0 : Number(match[10]);
  const offsetMinute = match[11] === undefined ? 0 : Number(match[11]);

  if (!isValidDate(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  )) {
    return null;
  }

  if (
    !isIntegerInRange(hour, 0, 23) ||
    !isIntegerInRange(minute, 0, 59) ||
    !isIntegerInRange(second, 0, 59)
  ) {
    return null;
  }

  if (
    timezone !== "Z" &&
    !validateOffsetHour(offsetHour, offsetMinute)
  ) {
    return null;
  }

  const millisecond = Number(
    fraction.padEnd(3, "0").slice(0, 3) || "0"
  );

  let offsetMinutes = 0;

  if (timezone !== "Z") {
    const absoluteOffset = offsetHour * 60 + offsetMinute;
    offsetMinutes = offsetSign === "+"
      ? absoluteOffset
      : -absoluteOffset;
  }

  const localMilliseconds = createUtcMilliseconds({
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond
  });

  return Object.freeze({
    value: normalized,
    epochMilliseconds:
      localMilliseconds - offsetMinutes * 60_000,
    offsetMinutes
  });
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidDateTime(value) {
  return parseDateTime(value) !== null;
}

/**
 * @param {unknown} value
 * @param {string} code
 * @param {string} label
 * @returns {string}
 */
export function assertDateTime(
  value,
  code = ERROR_CODES.INVALID_DATE_TIME,
  label = "dateTime"
) {
  const parsed = parseDateTime(value);

  if (parsed === null) {
    throw createInvalidDateError(
      code,
      label,
      value,
      "ISO 8601 DateTime with timezone"
    );
  }

  return parsed.value;
}

function comparePrimitive(left, right) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

/**
 * Compare strict yyyy-mm-dd values.
 *
 * @returns {-1|0|1}
 */
export function compareDates(left, right) {
  return comparePrimitive(
    assertDate(left, ERROR_CODES.INVALID_DATE, "leftDate"),
    assertDate(right, ERROR_CODES.INVALID_DATE, "rightDate")
  );
}

/**
 * Compare strict hh:mm values.
 *
 * @returns {-1|0|1}
 */
export function compareTimes(left, right) {
  return comparePrimitive(
    parseTimeToMinutes(left),
    parseTimeToMinutes(right)
  );
}

/**
 * Compare actual instants, respecting timezone offsets.
 *
 * @returns {-1|0|1}
 */
export function compareDateTimes(left, right) {
  const parsedLeft = parseDateTime(left);
  const parsedRight = parseDateTime(right);

  if (parsedLeft === null) {
    throw createInvalidDateError(
      ERROR_CODES.INVALID_DATE_TIME,
      "leftDateTime",
      left,
      "ISO 8601 DateTime with timezone"
    );
  }

  if (parsedRight === null) {
    throw createInvalidDateError(
      ERROR_CODES.INVALID_DATE_TIME,
      "rightDateTime",
      right,
      "ISO 8601 DateTime with timezone"
    );
  }

  return comparePrimitive(
    parsedLeft.epochMilliseconds,
    parsedRight.epochMilliseconds
  );
}

/**
 * Confirm that a date belongs to a target month.
 *
 * @param {unknown} date
 * @param {unknown} targetMonth
 * @returns {boolean}
 */
export function isDateInTargetMonth(date, targetMonth) {
  const validDate = assertDate(
    date,
    ERROR_CODES.INVALID_DATE,
    "date"
  );
  const validTargetMonth = assertTargetMonth(
    targetMonth,
    ERROR_CODES.INVALID_TARGET_MONTH,
    "targetMonth"
  );

  return validDate.startsWith(`${validTargetMonth}-`);
}

/**
 * Validate an optional start/end time pair and calculate its duration.
 * Both values must be null or both must be present.
 *
 * @param {unknown} startTime
 * @param {unknown} endTime
 * @param {{ allowOvernight?: boolean }} options
 * @returns {Readonly<{
 *   startTime: null|string,
 *   endTime: null|string,
 *   overnight: boolean,
 *   durationMinutes: null|number
 * }>}
 */
export function assertOptionalTimeRange(
  startTime,
  endTime,
  { allowOvernight = false } = {}
) {
  const startMissing = startTime === null || startTime === undefined || startTime === "";
  const endMissing = endTime === null || endTime === undefined || endTime === "";

  if (startMissing && endMissing) {
    return Object.freeze({
      startTime: null,
      endTime: null,
      overnight: false,
      durationMinutes: null
    });
  }

  if (startMissing !== endMissing) {
    throw createDomainError(
      ERROR_CODES.INCOMPLETE_TIME_RANGE,
      "startTime and endTime must both be provided or both be omitted.",
      { startTime, endTime }
    );
  }

  const validStart = assertTime(
    startTime,
    ERROR_CODES.INVALID_TIME,
    "startTime"
  );
  const validEnd = assertTime(
    endTime,
    ERROR_CODES.INVALID_TIME,
    "endTime"
  );

  const startMinutes = parseTimeToMinutes(validStart);
  const endMinutes = parseTimeToMinutes(validEnd);

  if (startMinutes === endMinutes) {
    throw createDomainError(
      ERROR_CODES.INVALID_TIME_RANGE,
      "endTime must not be equal to startTime.",
      { startTime: validStart, endTime: validEnd, allowOvernight }
    );
  }

  const overnight = endMinutes < startMinutes;

  if (overnight && !allowOvernight) {
    throw createDomainError(
      ERROR_CODES.INVALID_TIME_RANGE,
      "endTime must be later than startTime unless overnight is allowed.",
      { startTime: validStart, endTime: validEnd, allowOvernight }
    );
  }

  const durationMinutes = overnight
    ? 1_440 - startMinutes + endMinutes
    : endMinutes - startMinutes;

  return Object.freeze({
    startTime: validStart,
    endTime: validEnd,
    overnight,
    durationMinutes
  });
}
