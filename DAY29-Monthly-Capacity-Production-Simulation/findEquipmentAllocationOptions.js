import {
  buildEquipmentRoleSlots
} from "./buildEquipmentRoleSlots.js";
import {
  findCompleteRoleSlotMatchings
} from "./findWorkerRoleMatching.js";

export function findEquipmentAllocationOptions({
  equipment,
  availableWorkers
}) {
  const roleSlots = buildEquipmentRoleSlots(equipment);
  return findCompleteRoleSlotMatchings({
    roleSlots,
    availableWorkers
  }).map((allocations, optionIndex) => ({
    optionId: `${equipment.equipmentId}:OPTION:${optionIndex}`,
    equipmentId: equipment.equipmentId,
    allocations: allocations.map((allocation) => ({ ...allocation }))
  }));
}
