import {
  createWorkerReservation,
  canReserveWorker,
  reserveWorker,
  releaseWorker,
  reservationToArray
} from "./WorkerReservation.js";

function optionIsAvailable(option, reservation) {
  return option.allocations.every((allocation) =>
    canReserveWorker({ reservation, workerId: allocation.workerId })
  );
}

export function findFactoryWorkerAllocation({
  equipmentCandidates,
  allocationPolicy
}) {
  const candidates = [...equipmentCandidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.equipmentId.localeCompare(b.equipmentId);
  });
  const reservation = createWorkerReservation();
  let best = null;

  function search(index, selectedEquipmentAllocations) {
    if (index >= candidates.length) {
      const solution = {
        selectedEquipmentAllocations:
          selectedEquipmentAllocations.map((item) => ({
            ...item,
            allocations: item.allocations.map((allocation) => ({ ...allocation }))
          })),
        reservedWorkers: reservationToArray(reservation)
      };
      best = allocationPolicy.selectBetter(solution, best);
      return;
    }

    const candidate = candidates[index];

    if (candidate.individuallyExecutable) {
      for (const option of candidate.allocationOptions) {
        if (!optionIsAvailable(option, reservation)) continue;

        for (const allocation of option.allocations) {
          reserveWorker({ reservation, allocation });
        }
        selectedEquipmentAllocations.push({
          equipmentId: candidate.equipmentId,
          priority: candidate.priority,
          optionId: option.optionId,
          allocations: option.allocations.map((allocation) => ({ ...allocation }))
        });

        search(index + 1, selectedEquipmentAllocations);

        selectedEquipmentAllocations.pop();
        for (const allocation of option.allocations) {
          releaseWorker({ reservation, workerId: allocation.workerId });
        }
      }
    }

    search(index + 1, selectedEquipmentAllocations);
  }

  search(0, []);
  const selectedEquipmentIds = new Set(
    best.selectedEquipmentAllocations.map((item) => item.equipmentId)
  );

  return {
    ...best,
    runningEquipmentIds: [...selectedEquipmentIds]
      .sort((a, b) => a.localeCompare(b)),
    blockedEquipmentIds: candidates
      .filter((candidate) => !selectedEquipmentIds.has(candidate.equipmentId))
      .map((candidate) => candidate.equipmentId),
    score: allocationPolicy.describeScore(best)
  };
}
