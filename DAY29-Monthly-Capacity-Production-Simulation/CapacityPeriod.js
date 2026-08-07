import {
  TimeSlot
} from "./TimeSlot.js";
import {
  WorkerCapacity
} from "./WorkerCapacity.js";
import {
  EquipmentCapacity
} from "./EquipmentCapacity.js";
import {
  FactoryCapacity
} from "./FactoryCapacity.js";

export class CapacityPeriod {
  constructor({
    timeSlot,
    workerCapacities = [],
    equipmentCapacities = [],
    factoryCapacity = null
  }) {
    const slot = timeSlot instanceof TimeSlot
      ? timeSlot
      : new TimeSlot(timeSlot);
    const normalizedWorkers = workerCapacities.map((item) =>
      item instanceof WorkerCapacity ? item : new WorkerCapacity(item)
    );
    const normalizedEquipment = equipmentCapacities.map((item) =>
      item instanceof EquipmentCapacity ? item : new EquipmentCapacity(item)
    );
    const normalizedFactory = factoryCapacity instanceof FactoryCapacity
      ? factoryCapacity
      : new FactoryCapacity({
          timeSlot: slot,
          equipmentCapacities: normalizedEquipment
        });

    this.timeSlot = slot;
    this.workerCapacities = Object.freeze(normalizedWorkers);
    this.equipmentCapacities = Object.freeze(normalizedEquipment);
    this.factoryCapacity = normalizedFactory;
    Object.freeze(this);
  }

  capacitySignature() {
    return JSON.stringify({
      factoryState: this.factoryCapacity.state,
      factoryUnits: this.factoryCapacity.capacityUnits,
      equipment: this.equipmentCapacities.map((item) => ({
        equipmentId: item.equipmentId,
        state: item.state,
        capacityUnits: item.capacityUnits,
        workerIds: item.allocations
          .map((allocation) => allocation.workerId)
          .sort((a, b) => a.localeCompare(b)),
        reasonCodes: item.reasons
          .map((reason) => reason.code)
          .sort((a, b) => String(a).localeCompare(String(b)))
      }))
    });
  }

  toPlainObject() {
    return {
      timeSlot: this.timeSlot.toPlainObject(),
      workerCapacities: this.workerCapacities.map((item) =>
        item.toPlainObject()
      ),
      equipmentCapacities: this.equipmentCapacities.map((item) =>
        item.toPlainObject()
      ),
      factoryCapacity: this.factoryCapacity.toPlainObject()
    };
  }
}
