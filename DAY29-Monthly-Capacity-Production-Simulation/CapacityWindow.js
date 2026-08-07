import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  TimeSlot
} from "./TimeSlot.js";
import {
  CapacityPeriod
} from "./CapacityPeriod.js";

export class CapacityWindow {
  constructor({ periods }) {
    if (!Array.isArray(periods) || periods.length === 0) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_CAPACITY_CALENDAR,
        "CapacityWindow requires one or more periods.",
        { periods }
      );
    }

    const normalized = periods.map((item) =>
      item instanceof CapacityPeriod ? item : new CapacityPeriod(item)
    );
    const signature = normalized[0].capacitySignature();

    for (let index = 1; index < normalized.length; index += 1) {
      const previous = normalized[index - 1];
      const current = normalized[index];
      if (previous.timeSlot.endTime !== current.timeSlot.startTime) {
        throw new ApplicationError(
          ERROR_CODES.INVALID_CAPACITY_CALENDAR,
          "CapacityWindow periods must be adjacent.",
          { previous: previous.timeSlot, current: current.timeSlot }
        );
      }
      if (current.capacitySignature() !== signature) {
        throw new ApplicationError(
          ERROR_CODES.INVALID_CAPACITY_CALENDAR,
          "CapacityWindow periods must have the same capacity signature.",
          { index }
        );
      }
    }

    this.periods = Object.freeze(normalized);
    this.timeSlot = new TimeSlot({
      startAt: normalized[0].timeSlot.startAt,
      endAt: normalized.at(-1).timeSlot.endAt
    });
    this.factoryCapacity = normalized[0].factoryCapacity;
    this.equipmentCapacities = normalized[0].equipmentCapacities;
    this.signature = signature;
    Object.freeze(this);
  }

  toPlainObject() {
    return {
      timeSlot: this.timeSlot.toPlainObject(),
      periodCount: this.periods.length,
      factoryState: this.factoryCapacity.state,
      factoryCapacityUnits: this.factoryCapacity.capacityUnits,
      allocatedWorkerCount: this.factoryCapacity.allocatedWorkerCount,
      equipmentCapacities: this.equipmentCapacities.map((item) =>
        item.toPlainObject()
      )
    };
  }
}
