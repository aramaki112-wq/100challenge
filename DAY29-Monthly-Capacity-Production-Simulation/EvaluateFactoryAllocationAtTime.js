import {
  normalizeEquipmentPriorities
} from "./EquipmentPriority.js";
import {
  buildEquipmentAllocationCandidates
} from "./buildEquipmentAllocationCandidates.js";
import {
  FactoryAllocationPolicy
} from "./FactoryAllocationPolicy.js";
import {
  findFactoryWorkerAllocation
} from "./findFactoryWorkerAllocation.js";
import {
  createFactoryAllocationResult
} from "./FactoryAllocationResult.js";

export class EvaluateFactoryAllocationAtTime {
  constructor({ evaluateFactoryAtTime }) {
    this.evaluateFactoryAtTime = evaluateFactoryAtTime;
  }

  async execute({
    targetTime,
    equipment,
    workers,
    initialFactoryState,
    priorities
  }) {
    const day26Result = await this.evaluateFactoryAtTime.execute({
      targetTime,
      equipment,
      workers,
      initialFactoryState
    });

    const normalizedPriorities = normalizeEquipmentPriorities(
      priorities,
      equipment
    );
    const priorityByEquipmentId = new Map(
      normalizedPriorities.map((priority) => [
        priority.equipmentId,
        priority.value
      ])
    );
    const equipmentCandidates = buildEquipmentAllocationCandidates({
      equipment,
      equipmentEvaluations: day26Result.equipmentEvaluations,
      workerEvaluations: day26Result.workerEvaluations,
      workers,
      priorityByEquipmentId
    });
    const priorityLevels = [...new Set(
      normalizedPriorities.map((priority) => priority.value)
    )].sort((a, b) => a - b);
    const allocationPolicy = new FactoryAllocationPolicy({ priorityLevels });
    const solution = findFactoryWorkerAllocation({
      equipmentCandidates,
      allocationPolicy
    });

    return createFactoryAllocationResult({
      targetTime,
      eventCount: day26Result.eventCount,
      factoryState: day26Result.factoryState,
      workerEvaluations: day26Result.workerEvaluations,
      equipmentCandidates,
      solution
    });
  }
}
