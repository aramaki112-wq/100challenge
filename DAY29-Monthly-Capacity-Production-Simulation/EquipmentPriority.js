import {
  ERROR_CODES,
  assertNonEmptyString,
  assertPositiveInteger
} from "./errors.js";

export class EquipmentPriority {
  constructor({ equipmentId, value }) {
    this.equipmentId = assertNonEmptyString(
      equipmentId,
      ERROR_CODES.INVALID_EQUIPMENT_ID,
      "equipmentId"
    );
    this.value = assertPositiveInteger(
      value,
      ERROR_CODES.INVALID_EQUIPMENT_PRIORITY,
      "priority"
    );
    Object.freeze(this);
  }

  toPlainObject() {
    return {
      equipmentId: this.equipmentId,
      value: this.value
    };
  }
}

export function normalizeEquipmentPriorities(priorities, equipment) {
  const supplied = new Map(
    (priorities ?? []).map((item) => {
      const priority = item instanceof EquipmentPriority
        ? item
        : new EquipmentPriority(item);
      return [priority.equipmentId, priority];
    })
  );

  return equipment.map((item, index) =>
    supplied.get(item.equipmentId) ?? new EquipmentPriority({
      equipmentId: item.equipmentId,
      value: index + 1
    })
  );
}
