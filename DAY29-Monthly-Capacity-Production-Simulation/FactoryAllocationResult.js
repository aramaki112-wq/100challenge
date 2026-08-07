import {
  FACTORY_ALLOCATION_REASON_CODES as CODES,
  EQUIPMENT_EXECUTION_STATES as STATES
} from "./FactoryAllocationReasonCodes.js";

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deriveConflictData({ candidate, selectedByWorkerId, priorityByEquipmentId }) {
  const competing = [];
  for (const option of candidate.allocationOptions) {
    for (const allocation of option.allocations) {
      const selected = selectedByWorkerId.get(allocation.workerId);
      if (!selected || selected.equipmentId === candidate.equipmentId) continue;
      competing.push({
        workerId: allocation.workerId,
        selectedEquipmentId: selected.equipmentId,
        blockedEquipmentId: candidate.equipmentId,
        competingEquipmentIds: [
          selected.equipmentId,
          candidate.equipmentId
        ].sort((a, b) => a.localeCompare(b)),
        competingRoleSlotIds: [
          selected.roleSlotId,
          allocation.roleSlotId
        ].sort((a, b) => a.localeCompare(b)),
        decisionCode:
          priorityByEquipmentId.get(selected.equipmentId) < candidate.priority
            ? CODES.HIGHER_PRIORITY_EQUIPMENT_SELECTED
            : CODES.STABLE_TIE_BREAK_APPLIED
      });
    }
  }
  return uniqueBy(
    competing,
    (item) => `${item.workerId}:${item.selectedEquipmentId}:${item.blockedEquipmentId}`
  );
}

export function createFactoryAllocationResult({
  targetTime,
  eventCount,
  factoryState,
  workerEvaluations,
  equipmentCandidates,
  solution
}) {
  const selectedByEquipmentId = new Map(
    solution.selectedEquipmentAllocations.map((item) => [item.equipmentId, item])
  );
  const selectedByWorkerId = new Map(
    solution.selectedEquipmentAllocations
      .flatMap((item) => item.allocations)
      .map((allocation) => [allocation.workerId, allocation])
  );
  const priorityByEquipmentId = new Map(
    equipmentCandidates.map((candidate) => [candidate.equipmentId, candidate.priority])
  );
  const allConflicts = [];

  const equipmentResults = equipmentCandidates
    .map((candidate) => {
      const selected = selectedByEquipmentId.get(candidate.equipmentId);
      if (selected) {
        return {
          equipmentId: candidate.equipmentId,
          equipmentName: candidate.equipmentName,
          priority: candidate.priority,
          executionState: STATES.RUNNING,
          individuallyExecutable: candidate.individuallyExecutable,
          requiredWorkerCount: candidate.requiredWorkerCount,
          availableCandidateCount: candidate.availableCandidateCount,
          allocatedWorkerCount: selected.allocations.length,
          requiredSkills: candidate.requiredSkills,
          allocations: selected.allocations.map((item) => ({ ...item })),
          blockedReasons: [],
          reasons: [{
            code: CODES.ALLOCATION_COMPLETE,
            equipmentId: candidate.equipmentId
          }],
          conflicts: []
        };
      }

      if (!candidate.individuallyExecutable) {
        return {
          equipmentId: candidate.equipmentId,
          equipmentName: candidate.equipmentName,
          priority: candidate.priority,
          executionState: STATES.BLOCKED,
          individuallyExecutable: false,
          requiredWorkerCount: candidate.requiredWorkerCount,
          availableCandidateCount: candidate.availableCandidateCount,
          allocatedWorkerCount: 0,
          requiredSkills: candidate.requiredSkills,
          allocations: [],
          blockedReasons: candidate.preconditionReasons.map((item) => ({ ...item })),
          reasons: candidate.preconditionReasons.map((item) => ({ ...item })),
          conflicts: []
        };
      }

      const conflicts = deriveConflictData({
        candidate,
        selectedByWorkerId,
        priorityByEquipmentId
      });
      allConflicts.push(...conflicts);
      const blockedReasons = conflicts.length > 0
        ? conflicts.flatMap((conflict) => [
            {
              code: CODES.WORKER_RESERVED_BY_OTHER_EQUIPMENT,
              workerId: conflict.workerId,
              equipmentId: candidate.equipmentId,
              selectedEquipmentId: conflict.selectedEquipmentId
            },
            {
              code: conflict.decisionCode,
              equipmentId: candidate.equipmentId,
              selectedEquipmentId: conflict.selectedEquipmentId
            }
          ])
        : [{
            code: CODES.NO_GLOBAL_MATCHING,
            equipmentId: candidate.equipmentId
          }];

      return {
        equipmentId: candidate.equipmentId,
        equipmentName: candidate.equipmentName,
        priority: candidate.priority,
        executionState: STATES.BLOCKED,
        individuallyExecutable: true,
        requiredWorkerCount: candidate.requiredWorkerCount,
        availableCandidateCount: candidate.availableCandidateCount,
        allocatedWorkerCount: 0,
        requiredSkills: candidate.requiredSkills,
        allocations: [],
        blockedReasons: uniqueBy(
          blockedReasons,
          (item) => `${item.code}:${item.workerId ?? ""}:${item.selectedEquipmentId ?? ""}`
        ),
        reasons: blockedReasons,
        conflicts
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.equipmentId.localeCompare(b.equipmentId);
    });

  const workerAllocations = solution.selectedEquipmentAllocations
    .flatMap((item) => item.allocations)
    .sort((a, b) => a.workerId.localeCompare(b.workerId));

  return {
    targetTime,
    eventCount,
    allocationPolicy: {
      priorityDirection: "ASCENDING",
      comparisonOrder: [
        "PRIORITY_RUNNING_COUNT",
        "EQUIPMENT_ID",
        "ROLE_SLOT_ID",
        "WORKER_ID"
      ]
    },
    summary: {
      runningEquipmentCount: equipmentResults.filter(
        (item) => item.executionState === STATES.RUNNING
      ).length,
      blockedEquipmentCount: equipmentResults.filter(
        (item) => item.executionState === STATES.BLOCKED
      ).length,
      allocatedWorkerCount: workerAllocations.length
    },
    equipmentResults,
    workerAllocations,
    conflicts: uniqueBy(
      allConflicts,
      (item) => `${item.workerId}:${item.selectedEquipmentId}:${item.blockedEquipmentId}`
    ),
    factoryState,
    workerEvaluations,
    searchScore: solution.score
  };
}
