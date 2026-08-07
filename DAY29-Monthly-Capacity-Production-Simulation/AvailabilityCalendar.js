import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  TimeSlot
} from "./TimeSlot.js";

export class AvailabilityCalendar {
  constructor({ entries = [] } = {}) {
    const normalized = entries.map((entry) => ({
      workerId: entry.workerId,
      timeSlot: entry.timeSlot instanceof TimeSlot
        ? entry.timeSlot
        : new TimeSlot(entry.timeSlot),
      withinShift: Boolean(entry.withinShift),
      absent: Boolean(entry.absent),
      available: Boolean(entry.available),
      assignedEquipmentIds: Object.freeze([
        ...(entry.assignedEquipmentIds ?? [])
      ])
    }));

    const byWorker = new Map();
    for (const entry of normalized) {
      const list = byWorker.get(entry.workerId) ?? [];
      list.push(entry);
      byWorker.set(entry.workerId, list);
    }

    for (const [workerId, list] of byWorker) {
      list.sort((a, b) => a.timeSlot.startTime - b.timeSlot.startTime);
      for (let index = 1; index < list.length; index += 1) {
        if (list[index - 1].timeSlot.overlaps(list[index].timeSlot)) {
          throw new ApplicationError(
            ERROR_CODES.OVERLAPPING_TIME_SLOT,
            "AvailabilityCalendar must not contain overlapping periods for the same worker.",
            { workerId }
          );
        }
      }
    }

    this.entries = Object.freeze(normalized.map((entry) => Object.freeze(entry)));
    Object.freeze(this);
  }

  findWorkerAvailability(workerId, targetTime) {
    const entry = this.entries.find((item) =>
      item.workerId === workerId && item.timeSlot.contains(targetTime)
    );
    return entry
      ? {
          workerId: entry.workerId,
          timeSlot: entry.timeSlot.toPlainObject(),
          withinShift: entry.withinShift,
          absent: entry.absent,
          available: entry.available,
          assignedEquipmentIds: [...entry.assignedEquipmentIds]
        }
      : null;
  }

  toPlainObject() {
    return {
      entries: this.entries.map((entry) => ({
        workerId: entry.workerId,
        timeSlot: entry.timeSlot.toPlainObject(),
        withinShift: entry.withinShift,
        absent: entry.absent,
        available: entry.available,
        assignedEquipmentIds: [...entry.assignedEquipmentIds]
      }))
    };
  }
}
