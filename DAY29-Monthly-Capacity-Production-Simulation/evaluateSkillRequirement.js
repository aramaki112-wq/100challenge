import {
  findWorkerRoleMatching
} from "./findWorkerRoleMatching.js";

export function evaluateSkillRequirement({
  equipment,
  availableWorkers
}) {
  const requirements =
    equipment.getRequiredSkillComposition().getRequirements();

  if (requirements.length === 0) {
    return {
      equipmentId: equipment.equipmentId,
      requiredRoleSlotCount: 0,
      allocatedRoleSlotCount: 0,
      satisfied: true,
      requirements: [],
      allocations: [],
      reasons: []
    };
  }

  const matching = findWorkerRoleMatching({
    requirements,
    availableWorkers
  });

  const requirementResults = requirements.map((requirement) => {
    const availableCount = availableWorkers.filter((worker) =>
      worker.hasSkill(requirement.skillId)
    ).length;

    const allocatedCount = matching.allocations.filter(
      (allocation) => allocation.skillId === requirement.skillId
    ).length;

    const shortageCount = Math.max(
      requirement.requiredCount - allocatedCount,
      0
    );

    return {
      skillId: requirement.skillId,
      requiredCount: requirement.requiredCount,
      availableCount,
      allocatedCount,
      shortageCount,
      satisfied: shortageCount === 0
    };
  });

  const reasons = requirementResults
    .filter((result) => !result.satisfied)
    .map((result) => ({
      code: "SKILL_REQUIREMENT_SHORTAGE",
      equipmentId: equipment.equipmentId,
      skillId: result.skillId,
      requiredCount: result.requiredCount,
      availableCount: result.availableCount,
      allocatedCount: result.allocatedCount,
      shortageCount: result.shortageCount
    }));

  return {
    equipmentId: equipment.equipmentId,
    requiredRoleSlotCount:
      equipment.getRequiredSkillComposition().getRequiredRoleSlotCount(),
    allocatedRoleSlotCount: matching.allocations.length,
    satisfied: reasons.length === 0,
    requirements: requirementResults,
    allocations: matching.allocations,
    reasons
  };
}
