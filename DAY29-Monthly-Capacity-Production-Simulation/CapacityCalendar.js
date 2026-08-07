import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  CapacityPeriod
} from "./CapacityPeriod.js";
import {
  CapacityWindow
} from "./CapacityWindow.js";

function buildWindows(periods) {
  if (periods.length === 0) return [];
  const groups = [[periods[0]]];
  for (let index = 1; index < periods.length; index += 1) {
    const current = periods[index];
    const group = groups.at(-1);
    const previous = group.at(-1);
    const mergeable =
      previous.timeSlot.endTime === current.timeSlot.startTime &&
      previous.capacitySignature() === current.capacitySignature();
    if (mergeable) group.push(current);
    else groups.push([current]);
  }
  return groups.map((group) => new CapacityWindow({ periods: group }));
}

export class CapacityCalendar {
  constructor({ periods = [] } = {}) {
    const normalized = periods.map((item) =>
      item instanceof CapacityPeriod ? item : new CapacityPeriod(item)
    ).sort((a, b) => a.timeSlot.startTime - b.timeSlot.startTime);

    for (let index = 1; index < normalized.length; index += 1) {
      if (normalized[index - 1].timeSlot.overlaps(normalized[index].timeSlot)) {
        throw new ApplicationError(
          ERROR_CODES.OVERLAPPING_TIME_SLOT,
          "CapacityCalendar periods must not overlap.",
          {
            previous: normalized[index - 1].timeSlot.toPlainObject(),
            current: normalized[index].timeSlot.toPlainObject()
          }
        );
      }
    }

    this.periods = Object.freeze(normalized);
    this.windows = Object.freeze(buildWindows(normalized));
    this.totalMinutes = normalized.reduce(
      (sum, period) => sum + period.timeSlot.durationMinutes,
      0
    );
    this.equipmentCapacityMinutes = normalized.reduce(
      (sum, period) =>
        sum + period.factoryCapacity.capacityUnits * period.timeSlot.durationMinutes,
      0
    );
    Object.freeze(this);
  }

  findPeriod(targetTime) {
    return this.periods.find((period) => period.timeSlot.contains(targetTime)) ?? null;
  }

  toPlainObject() {
    return {
      totalMinutes: this.totalMinutes,
      equipmentCapacityMinutes: this.equipmentCapacityMinutes,
      periodCount: this.periods.length,
      windowCount: this.windows.length,
      periods: this.periods.map((item) => item.toPlainObject()),
      windows: this.windows.map((item) => item.toPlainObject())
    };
  }
}
