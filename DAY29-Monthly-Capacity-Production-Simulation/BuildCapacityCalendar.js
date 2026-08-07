import {
  buildCapacityTimeSlots
} from "./buildCapacityTimeSlots.js";
import {
  replayFactoryState
} from "./replayFactoryState.js";
import {
  evaluateWorkerTemporalAvailability
} from "./evaluateWorkerTemporalAvailability.js";
import {
  WorkerCapacity
} from "./WorkerCapacity.js";
import {
  EquipmentCapacity
} from "./EquipmentCapacity.js";
import {
  FactoryCapacity
} from "./FactoryCapacity.js";
import {
  CapacityPeriod
} from "./CapacityPeriod.js";
import {
  AvailabilityCalendar
} from "./AvailabilityCalendar.js";
import {
  CapacityCalendar
} from "./CapacityCalendar.js";
import {
  deriveCapacityEvents
} from "./deriveCapacityEvents.js";

export class BuildCapacityCalendar {
  constructor({
    eventRepository,
    evaluateFactoryAllocationAtTime
  }) {
    this.eventRepository = eventRepository;
    this.evaluateFactoryAllocationAtTime = evaluateFactoryAllocationAtTime;
  }

  async execute({
    startAt,
    endAt,
    intervalMinutes = 120,
    equipment,
    workers,
    initialFactoryState,
    priorities
  }) {
    const events = await this.eventRepository.findAll();
    const timeSlots = buildCapacityTimeSlots({
      startAt,
      endAt,
      intervalMinutes,
      events
    });
    const periods = [];

    for (const timeSlot of timeSlots) {
      const allocationResult = await this.evaluateFactoryAllocationAtTime.execute({
        targetTime: timeSlot.startAt,
        equipment,
        workers,
        initialFactoryState,
        priorities
      });

      const factoryState = replayFactoryState({
        initialState: initialFactoryState,
        events,
        targetTime: timeSlot.startAt
      });
      const allocationByWorkerId = new Map(
        allocationResult.workerAllocations.map((item) => [item.workerId, item])
      );

      const workerCapacities = workers.map((worker) => {
        const availability = evaluateWorkerTemporalAvailability({
          worker,
          factoryState,
          targetTime: timeSlot.startAt
        });
        const allocation = allocationByWorkerId.get(worker.workerId) ?? null;
        return new WorkerCapacity({
          workerId: worker.workerId,
          timeSlot,
          ...availability,
          allocatedEquipmentId: allocation?.equipmentId ?? null,
          allocatedRoleSlotId: allocation?.roleSlotId ?? null,
          reasons: availability.reasons
        });
      });

      const equipmentCapacities = allocationResult.equipmentResults.map(
        (result) => new EquipmentCapacity({
          equipmentId: result.equipmentId,
          equipmentName: result.equipmentName,
          timeSlot,
          executionState: result.executionState,
          requiredWorkerCount: result.requiredWorkerCount,
          allocatedWorkerCount: result.allocatedWorkerCount,
          allocations: result.allocations,
          reasons: result.blockedReasons
        })
      );
      const factoryCapacity = new FactoryCapacity({
        timeSlot,
        equipmentCapacities
      });

      periods.push(new CapacityPeriod({
        timeSlot,
        workerCapacities,
        equipmentCapacities,
        factoryCapacity
      }));
    }

    const availabilityCalendar = new AvailabilityCalendar({
      entries: periods.flatMap((period) =>
        period.workerCapacities.map((capacity) => ({
          workerId: capacity.workerId,
          timeSlot: capacity.timeSlot,
          withinShift: capacity.withinShift,
          absent: capacity.absent,
          available: capacity.available,
          assignedEquipmentIds: capacity.assignedEquipmentIds
        }))
      )
    });
    const capacityCalendar = new CapacityCalendar({ periods });
    const capacityEvents = deriveCapacityEvents(periods);

    return {
      startAt: timeSlots[0]?.startAt ?? startAt,
      endAt: timeSlots.at(-1)?.endAt ?? endAt,
      intervalMinutes,
      sourceEventCount: events.length,
      availabilityCalendar: availabilityCalendar.toPlainObject(),
      capacityCalendar: capacityCalendar.toPlainObject(),
      capacityEvents
    };
  }
}
