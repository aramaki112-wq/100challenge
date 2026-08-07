export function evaluateEquipmentAvailability({
  equipment,
  equipmentOperable,
  materialAvailable,
  workerRequirementEvaluation,
  skillRequirementEvaluation
}) {
  const reasons = [];

  if (!equipmentOperable) {
    reasons.push({
      code: "EQUIPMENT_NOT_OPERABLE",
      equipmentId: equipment.equipmentId
    });
  }

  if (!materialAvailable) {
    reasons.push({
      code: "MATERIAL_SHORTAGE",
      equipmentId: equipment.equipmentId
    });
  }

  reasons.push(...workerRequirementEvaluation.reasons);
  reasons.push(...skillRequirementEvaluation.reasons);

  return {
    equipmentId: equipment.equipmentId,
    equipmentName: equipment.name,
    equipmentOperable,
    materialAvailable,
    workerRequirement: workerRequirementEvaluation,
    skillRequirement: skillRequirementEvaluation,
    executable:
      equipmentOperable &&
      materialAvailable &&
      workerRequirementEvaluation.satisfied &&
      skillRequirementEvaluation.satisfied,
    reasons
  };
}
