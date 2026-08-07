import {
  TimeSlot
} from "./TimeSlot.js";
import {
  EquipmentCapacity
} from "./EquipmentCapacity.js";
import {
  FACTORY_CAPACITY_STATES
} from "./CapacityReasonCodes.js";

export class FactoryCapacity {
  constructor({ timeSlot, equipmentCapacities = [] }) {
    const slot = timeSlot instanceof TimeSlot
      ? timeSlot
      : new TimeSlot(timeSlot);
    const capacities = equipmentCapacities.map((item) =>
      item instanceof EquipmentCapacity ? item : new EquipmentCapacity(item)
    );
    const availableEquipmentCount = capacities.reduce(
      (sum, item) => sum + item.capacityUnits,
      0
    );
    const totalEquipmentCount = capacities.length;

    let state = FACTORY_CAPACITY_STATES.NONE;
    if (totalEquipmentCount > 0 && availableEquipmentCount === totalEquipmentCount) {
      state = FACTORY_CAPACITY_STATES.FULL;
    } else if (availableEquipmentCount > 0) {
      state = FACTORY_CAPACITY_STATES.PARTIAL;
    }

    this.timeSlot = slot;
    this.equipmentCapacities = Object.freeze(capacities);
    this.availableEquipmentCount = availableEquipmentCount;
    this.totalEquipmentCount = totalEquipmentCount;
    this.capacityUnits = availableEquipmentCount;
    this.capacityRatio = totalEquipmentCount === 0
      ? 0
      : availableEquipmentCount / totalEquipmentCount;
    this.allocatedWorkerCount = new Set(
      capacities.flatMap((item) => item.allocations.map((allocation) => allocation.workerId))
    ).size;
    this.state = state;
    Object.freeze(this);
  }

  toPlainObject() {
    return {
      timeSlot: this.timeSlot.toPlainObject(),
      availableEquipmentCount: this.availableEquipmentCount,
      totalEquipmentCount: this.totalEquipmentCount,
      capacityUnits: this.capacityUnits,
      capacityRatio: this.capacityRatio,
      allocatedWorkerCount: this.allocatedWorkerCount,
      state: this.state,
      equipmentCapacities: this.equipmentCapacities.map((item) =>
        item.toPlainObject()
      )
    };
  }
}
