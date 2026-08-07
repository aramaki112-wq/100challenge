import {
  replayFactoryState
} from "./replayFactoryState.js";
import {
  evaluateWorkerAvailability
} from "./evaluateWorkerAvailability.js";
import {
  evaluateWorkerRequirement
} from "./WorkerRequirement.js";
import {
  evaluateSkillRequirement
} from "./evaluateSkillRequirement.js";
import {
  evaluateEquipmentAvailability
} from "./evaluateEquipmentAvailability.js";
import {
  createInitialFactoryState
} from "./FactoryState.js";

export class EvaluateFactoryAtTime {
  constructor({
    eventRepository,
    equipment = [],
    workers = [],
    initialFactoryState = createInitialFactoryState()
  }) {
    this.eventRepository = eventRepository;
    this.equipment = equipment;
    this.workers = workers;
    this.initialFactoryState = initialFactoryState;
  }

  async execute({
    targetTime,
    equipment = this.equipment,
    workers = this.workers,
    initialFactoryState = this.initialFactoryState
  }) {
    const events = await this.eventRepository.findAll();
    const factoryState = replayFactoryState({
      initialState: initialFactoryState,
      events,
      targetTime
    });

    const workerEvaluations = [];
    const equipmentEvaluations = equipment.map((item) => {
      const evaluationsForEquipment = workers.map((worker) => {
        const evaluation = evaluateWorkerAvailability({
          worker,
          equipmentId: item.equipmentId,
          factoryState,
          targetTime
        });
        workerEvaluations.push(evaluation);
        return { worker, evaluation };
      });

      const assignedWorkers = evaluationsForEquipment.filter(
        ({ evaluation }) => evaluation.assigned
      );
      const availableWorkers = evaluationsForEquipment
        .filter(({ evaluation }) => evaluation.available)
        .map(({ worker }) => worker);

      const workerRequirementEvaluation = evaluateWorkerRequirement({
        equipmentId: item.equipmentId,
        requiredWorkerCount: item.requiredWorkerCount,
        assignedWorkerCount: assignedWorkers.length,
        availableWorkerCount: availableWorkers.length
      });

      const skillRequirementEvaluation = evaluateSkillRequirement({
        equipment: item,
        availableWorkers
      });

      const equipmentOperable =
        factoryState.equipmentStates[item.equipmentId]?.operable ?? false;
      const materialAvailable =
        factoryState.materialStates[item.equipmentId]?.available ?? false;

      return evaluateEquipmentAvailability({
        equipment: item,
        equipmentOperable,
        materialAvailable,
        workerRequirementEvaluation,
        skillRequirementEvaluation
      });
    });

    return {
      targetTime,
      eventCount: events.length,
      factoryState,
      equipmentEvaluations,
      workerEvaluations
    };
  }
}
