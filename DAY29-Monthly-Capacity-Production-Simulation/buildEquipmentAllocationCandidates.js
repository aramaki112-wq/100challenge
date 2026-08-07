import {
  findEquipmentAllocationOptions
} from "./findEquipmentAllocationOptions.js";
import {
  FACTORY_ALLOCATION_REASON_CODES as CODES
} from "./FactoryAllocationReasonCodes.js";

function translateReason(reason) {
  switch (reason.code) {
    case "MATERIAL_SHORTAGE":
      return {
        ...reason,
        code: CODES.MATERIAL_NOT_AVAILABLE
      };
    case "WORKER_SHORTAGE":
      return {
        ...reason,
        code: CODES.WORKER_COUNT_SHORTAGE
      };
    default:
      return { ...reason };
  }
}

export function buildEquipmentAllocationCandidates({
  equipment,
  equipmentEvaluations,
  workerEvaluations,
  workers,
  priorityByEquipmentId
}) {
  const workerById = new Map(workers.map((worker) => [worker.workerId, worker]));
  const evaluationByEquipmentId = new Map(
    equipmentEvaluations.map((evaluation) => [evaluation.equipmentId, evaluation])
  );

  return equipment.map((item) => {
    const evaluation = evaluationByEquipmentId.get(item.equipmentId);
    const availableWorkers = workerEvaluations
      .filter((workerEvaluation) =>
        workerEvaluation.equipmentId === item.equipmentId &&
        workerEvaluation.available
      )
      .map((workerEvaluation) => workerById.get(workerEvaluation.workerId))
      .filter(Boolean);

    const preconditionReasons = evaluation.reasons.map(translateReason);
    const allocationOptions = evaluation.executable
      ? findEquipmentAllocationOptions({
          equipment: item,
          availableWorkers
        })
      : [];

    return {
      equipmentId: item.equipmentId,
      equipmentName: item.name,
      priority: priorityByEquipmentId.get(item.equipmentId),
      equipment: item,
      individuallyExecutable: evaluation.executable,
      requiredWorkerCount: item.requiredWorkerCount,
      availableCandidateCount: availableWorkers.length,
      requiredSkills:
        item.getRequiredSkillComposition().toPlainObject(),
      availableWorkerIds: availableWorkers
        .map((worker) => worker.workerId)
        .sort((a, b) => a.localeCompare(b)),
      allocationOptions,
      preconditionReasons,
      day26Evaluation: evaluation
    };
  });
}
