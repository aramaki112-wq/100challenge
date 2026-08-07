import {
  CAPACITY_EVENT_TYPES
} from "./CapacityEventTypes.js";

function event(type, occurredAt, payload) {
  return {
    eventId: `${type}:${occurredAt}:${JSON.stringify(payload)}`,
    type,
    occurredAt,
    payload
  };
}

function mapBy(items, key) {
  return new Map(items.map((item) => [item[key], item]));
}

export function deriveCapacityEvents(periods = []) {
  const events = [];

  periods.forEach((period, index) => {
    const occurredAt = period.timeSlot.startAt;
    const previous = index > 0 ? periods[index - 1] : null;
    const previousWorkers = mapBy(previous?.workerCapacities ?? [], "workerId");
    const previousEquipment = mapBy(previous?.equipmentCapacities ?? [], "equipmentId");

    for (const worker of period.workerCapacities) {
      const before = previousWorkers.get(worker.workerId);
      if (!before || before.available !== worker.available) {
        events.push(event(
          worker.available
            ? CAPACITY_EVENT_TYPES.WORKER_BECAME_AVAILABLE
            : CAPACITY_EVENT_TYPES.WORKER_BECAME_UNAVAILABLE,
          occurredAt,
          {
            workerId: worker.workerId,
            available: worker.available
          }
        ));
      }
      if (!before || before.withinShift !== worker.withinShift) {
        events.push(event(
          worker.withinShift
            ? CAPACITY_EVENT_TYPES.SHIFT_STARTED
            : CAPACITY_EVENT_TYPES.SHIFT_ENDED,
          occurredAt,
          {
            workerId: worker.workerId,
            withinShift: worker.withinShift
          }
        ));
      }
    }

    for (const equipment of period.equipmentCapacities) {
      const before = previousEquipment.get(equipment.equipmentId);
      if (!before || before.capacityUnits !== equipment.capacityUnits) {
        events.push(event(
          CAPACITY_EVENT_TYPES.EQUIPMENT_CAPACITY_CHANGED,
          occurredAt,
          {
            equipmentId: equipment.equipmentId,
            previousCapacityUnits: before?.capacityUnits ?? null,
            capacityUnits: equipment.capacityUnits,
            state: equipment.state
          }
        ));
      }
    }

    if (
      !previous ||
      previous.factoryCapacity.capacityUnits !== period.factoryCapacity.capacityUnits
    ) {
      const payload = {
        previousCapacityUnits: previous?.factoryCapacity.capacityUnits ?? null,
        capacityUnits: period.factoryCapacity.capacityUnits,
        state: period.factoryCapacity.state
      };
      events.push(event(
        CAPACITY_EVENT_TYPES.FACTORY_CAPACITY_CHANGED,
        occurredAt,
        payload
      ));
      events.push(event(
        CAPACITY_EVENT_TYPES.CAPACITY_CHANGED,
        occurredAt,
        payload
      ));
    }
  });

  return events;
}
