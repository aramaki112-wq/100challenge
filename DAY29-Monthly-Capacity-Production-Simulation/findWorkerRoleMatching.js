import { ROLE_TYPES } from "./buildEquipmentRoleSlots.js";

function buildLegacyRoleSlots(requirements) {
  return requirements.flatMap((requirement) =>
    Array.from({ length: requirement.requiredCount }, (_, slotIndex) => ({
      roleSlotId: `${requirement.skillId}:${slotIndex}`,
      roleType: ROLE_TYPES.SKILL,
      skillId: requirement.skillId,
      slotIndex
    }))
  );
}

function workerCanFillSlot(worker, slot) {
  return slot.roleType === ROLE_TYPES.GENERAL || worker.hasSkill(slot.skillId);
}

function candidatesForSlot(slot, workers) {
  return workers
    .filter((worker) => workerCanFillSlot(worker, slot))
    .sort((a, b) => a.workerId.localeCompare(b.workerId));
}

function sortSlotsForSearch(roleSlots, workers) {
  return [...roleSlots].sort((a, b) => {
    const candidateDifference =
      candidatesForSlot(a, workers).length -
      candidatesForSlot(b, workers).length;
    if (candidateDifference !== 0) return candidateDifference;
    return a.roleSlotId.localeCompare(b.roleSlotId);
  });
}

function normalizeAllocation(worker, slot) {
  return {
    workerId: worker.workerId,
    roleSlotId: slot.roleSlotId,
    roleType: slot.roleType,
    skillId: slot.skillId,
    slotIndex: slot.slotIndex,
    ...(slot.equipmentId ? { equipmentId: slot.equipmentId } : {})
  };
}

function allocationSignature(allocations) {
  return [...allocations]
    .sort((a, b) => a.roleSlotId.localeCompare(b.roleSlotId))
    .map((allocation) =>
      `${allocation.roleSlotId}:${allocation.workerId}`
    )
    .join("|");
}

export function findCompleteRoleSlotMatchings({
  roleSlots,
  availableWorkers
}) {
  const workers = [...availableWorkers].sort((a, b) =>
    a.workerId.localeCompare(b.workerId)
  );
  const slots = sortSlotsForSearch(roleSlots, workers);
  const matchings = [];
  const signatures = new Set();

  function search(index, usedWorkerIds, allocations) {
    if (index >= slots.length) {
      const normalized = [...allocations].sort((a, b) =>
        a.roleSlotId.localeCompare(b.roleSlotId)
      );
      const signature = allocationSignature(normalized);
      if (!signatures.has(signature)) {
        signatures.add(signature);
        matchings.push(normalized.map((item) => ({ ...item })));
      }
      return;
    }

    const slot = slots[index];
    for (const worker of candidatesForSlot(slot, workers)) {
      if (usedWorkerIds.has(worker.workerId)) continue;
      usedWorkerIds.add(worker.workerId);
      allocations.push(normalizeAllocation(worker, slot));
      search(index + 1, usedWorkerIds, allocations);
      allocations.pop();
      usedWorkerIds.delete(worker.workerId);
    }
  }

  if (slots.length === 0) return [[]];
  search(0, new Set(), []);
  return matchings.sort((a, b) =>
    allocationSignature(a).localeCompare(allocationSignature(b))
  );
}

export function findCompleteWorkerRoleMatchings({
  requirements,
  availableWorkers
}) {
  const roleSlots = buildLegacyRoleSlots(requirements);
  return findCompleteRoleSlotMatchings({ roleSlots, availableWorkers })
    .map((allocations) => ({
      matched: true,
      allocations: allocations.map(({ roleSlotId, roleType, ...rest }) => rest),
      unmatchedRoleSlots: []
    }));
}

export function findWorkerRoleMatching({
  requirements,
  availableWorkers
}) {
  const workers = [...availableWorkers].sort((a, b) =>
    a.workerId.localeCompare(b.workerId)
  );
  const roleSlots = sortSlotsForSearch(
    buildLegacyRoleSlots(requirements),
    workers
  );
  let bestAllocations = [];
  let bestSignature = "";
  let fullSolution = null;

  function consider(allocations) {
    const normalized = [...allocations].sort((a, b) =>
      a.roleSlotId.localeCompare(b.roleSlotId)
    );
    const signature = allocationSignature(normalized);
    if (
      normalized.length > bestAllocations.length ||
      (normalized.length === bestAllocations.length &&
        (bestSignature === "" || signature < bestSignature))
    ) {
      bestAllocations = normalized.map((item) => ({ ...item }));
      bestSignature = signature;
    }
  }

  function search(index, usedWorkerIds, allocations) {
    consider(allocations);
    if (index >= roleSlots.length) {
      if (allocations.length === roleSlots.length && !fullSolution) {
        fullSolution = [...allocations].sort((a, b) =>
          a.roleSlotId.localeCompare(b.roleSlotId)
        );
      }
      return;
    }

    const slot = roleSlots[index];
    for (const worker of candidatesForSlot(slot, workers)) {
      if (usedWorkerIds.has(worker.workerId)) continue;
      usedWorkerIds.add(worker.workerId);
      allocations.push(normalizeAllocation(worker, slot));
      search(index + 1, usedWorkerIds, allocations);
      allocations.pop();
      usedWorkerIds.delete(worker.workerId);
    }

    search(index + 1, usedWorkerIds, allocations);
  }

  search(0, new Set(), []);
  const selected = fullSolution ?? bestAllocations;
  const allocatedKeys = new Set(selected.map((item) => item.roleSlotId));
  const unmatchedRoleSlots = roleSlots
    .filter((slot) => !allocatedKeys.has(slot.roleSlotId))
    .map(({ roleSlotId, roleType, ...slot }) => ({ ...slot }));

  return {
    matched: unmatchedRoleSlots.length === 0,
    allocations: selected.map(
      ({ roleSlotId, roleType, ...allocation }) => ({ ...allocation })
    ),
    unmatchedRoleSlots
  };
}
