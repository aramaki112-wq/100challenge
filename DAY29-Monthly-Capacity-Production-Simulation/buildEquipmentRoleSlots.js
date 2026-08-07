export const ROLE_TYPES = Object.freeze({
  SKILL: "SKILL",
  GENERAL: "GENERAL"
});

export function buildEquipmentRoleSlots(equipment) {
  const skillSlots = equipment
    .getRequiredSkillComposition()
    .getRequirements()
    .flatMap((requirement) =>
      Array.from({ length: requirement.requiredCount }, (_, slotIndex) => ({
        roleSlotId:
          `${equipment.equipmentId}:SKILL:${requirement.skillId}:${slotIndex}`,
        equipmentId: equipment.equipmentId,
        roleType: ROLE_TYPES.SKILL,
        skillId: requirement.skillId,
        slotIndex
      }))
    );

  const generalCount =
    equipment.requiredWorkerCount - skillSlots.length;

  const generalSlots = Array.from(
    { length: generalCount },
    (_, slotIndex) => ({
      roleSlotId: `${equipment.equipmentId}:GENERAL:${slotIndex}`,
      equipmentId: equipment.equipmentId,
      roleType: ROLE_TYPES.GENERAL,
      skillId: null,
      slotIndex
    })
  );

  return [...skillSlots, ...generalSlots];
}
