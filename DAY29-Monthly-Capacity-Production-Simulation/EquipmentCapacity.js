import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  TimeSlot
} from "./TimeSlot.js";
import {
  EQUIPMENT_CAPACITY_STATES
} from "./CapacityReasonCodes.js";

export class EquipmentCapacity {
  constructor({
    equipmentId,
    equipmentName,
    timeSlot,
    executionState,
    requiredWorkerCount,
    allocatedWorkerCount,
    allocations = [],
    reasons = []
  }) {
    const slot = timeSlot instanceof TimeSlot
      ? timeSlot
      : new TimeSlot(timeSlot);

    if (!Number.isInteger(requiredWorkerCount) || requiredWorkerCount < 0) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_CAPACITY_VALUE,
        "requiredWorkerCount must be a non-negative integer.",
        { requiredWorkerCount }
      );
    }
    if (!Number.isInteger(allocatedWorkerCount) || allocatedWorkerCount < 0) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_CAPACITY_VALUE,
        "allocatedWorkerCount must be a non-negative integer.",
        { allocatedWorkerCount }
      );
    }

    const available = executionState === "RUNNING";
    this.equipmentId = equipmentId;
    this.equipmentName = equipmentName;
    this.timeSlot = slot;
    this.requiredWorkerCount = requiredWorkerCount;
    this.allocatedWorkerCount = allocatedWorkerCount;
    this.staffingRatio = requiredWorkerCount === 0
      ? 1
      : Math.min(allocatedWorkerCount / requiredWorkerCount, 1);
    this.capacityUnits = available ? 1 : 0;
    this.state = available
      ? EQUIPMENT_CAPACITY_STATES.AVAILABLE
      : EQUIPMENT_CAPACITY_STATES.BLOCKED;
    this.allocations = Object.freeze(
      allocations.map((item) => Object.freeze({ ...item }))
    );
    this.reasons = Object.freeze(
      reasons.map((item) => Object.freeze({ ...item }))
    );
    Object.freeze(this);
  }

  toPlainObject() {
    return {
      equipmentId: this.equipmentId,
      equipmentName: this.equipmentName,
      timeSlot: this.timeSlot.toPlainObject(),
      requiredWorkerCount: this.requiredWorkerCount,
      allocatedWorkerCount: this.allocatedWorkerCount,
      staffingRatio: this.staffingRatio,
      capacityUnits: this.capacityUnits,
      state: this.state,
      allocations: this.allocations.map((item) => ({ ...item })),
      reasons: this.reasons.map((item) => ({ ...item }))
    };
  }
}
