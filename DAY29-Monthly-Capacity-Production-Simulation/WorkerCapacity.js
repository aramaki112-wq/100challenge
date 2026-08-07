import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  TimeSlot
} from "./TimeSlot.js";
import {
  WORKER_CAPACITY_STATES
} from "./CapacityReasonCodes.js";

const VALID_STATES = new Set(Object.values(WORKER_CAPACITY_STATES));

export class WorkerCapacity {
  constructor({
    workerId,
    timeSlot,
    withinShift,
    absent,
    available,
    assignedEquipmentIds = [],
    allocatedEquipmentId = null,
    allocatedRoleSlotId = null,
    reasons = []
  }) {
    if (typeof workerId !== "string" || workerId.trim() === "") {
      throw new ApplicationError(
        ERROR_CODES.INVALID_WORKER_ID,
        "workerId must be a non-empty string.",
        { workerId }
      );
    }
    if (!Array.isArray(assignedEquipmentIds)) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_ARGUMENT,
        "assignedEquipmentIds must be an array.",
        { assignedEquipmentIds }
      );
    }

    const slot = timeSlot instanceof TimeSlot
      ? timeSlot
      : new TimeSlot(timeSlot);
    const normalizedAssignments = [...new Set(assignedEquipmentIds)]
      .sort((a, b) => a.localeCompare(b));

    let state;
    if (!available) {
      state = WORKER_CAPACITY_STATES.UNAVAILABLE;
    } else if (allocatedEquipmentId) {
      state = WORKER_CAPACITY_STATES.CONTRIBUTING;
    } else if (normalizedAssignments.length === 0) {
      state = WORKER_CAPACITY_STATES.AVAILABLE_UNASSIGNED;
    } else {
      state = WORKER_CAPACITY_STATES.AVAILABLE_NOT_SELECTED;
    }

    if (!VALID_STATES.has(state)) {
      throw new ApplicationError(
        ERROR_CODES.INVALID_CAPACITY_STATE,
        "Worker capacity state is invalid.",
        { state }
      );
    }

    this.workerId = workerId.trim();
    this.timeSlot = slot;
    this.withinShift = Boolean(withinShift);
    this.absent = Boolean(absent);
    this.available = Boolean(available);
    this.assignedEquipmentIds = Object.freeze(normalizedAssignments);
    this.allocatedEquipmentId = allocatedEquipmentId;
    this.allocatedRoleSlotId = allocatedRoleSlotId;
    this.availableCapacityUnits = this.available ? 1 : 0;
    this.committedCapacityUnits = allocatedEquipmentId ? 1 : 0;
    this.state = state;
    this.reasons = Object.freeze(reasons.map((item) => Object.freeze({ ...item })));
    Object.freeze(this);
  }

  toPlainObject() {
    return {
      workerId: this.workerId,
      timeSlot: this.timeSlot.toPlainObject(),
      withinShift: this.withinShift,
      absent: this.absent,
      available: this.available,
      assignedEquipmentIds: [...this.assignedEquipmentIds],
      allocatedEquipmentId: this.allocatedEquipmentId,
      allocatedRoleSlotId: this.allocatedRoleSlotId,
      availableCapacityUnits: this.availableCapacityUnits,
      committedCapacityUnits: this.committedCapacityUnits,
      state: this.state,
      reasons: this.reasons.map((item) => ({ ...item }))
    };
  }
}
