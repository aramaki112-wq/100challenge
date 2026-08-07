function runningCountsByPriority(solution, priorityLevels) {
  const counts = new Map(priorityLevels.map((priority) => [priority, 0]));
  for (const selected of solution.selectedEquipmentAllocations) {
    counts.set(selected.priority, (counts.get(selected.priority) ?? 0) + 1);
  }
  return priorityLevels.map((priority) => counts.get(priority) ?? 0);
}

function canonicalSignature(solution) {
  const equipmentPart = solution.selectedEquipmentAllocations
    .map((item) => item.equipmentId)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
  const allocationPart = solution.selectedEquipmentAllocations
    .flatMap((item) => item.allocations)
    .sort((a, b) => {
      const role = a.roleSlotId.localeCompare(b.roleSlotId);
      return role !== 0 ? role : a.workerId.localeCompare(b.workerId);
    })
    .map((item) => `${item.roleSlotId}:${item.workerId}`)
    .join(",");
  return `${equipmentPart}#${allocationPart}`;
}

export class FactoryAllocationPolicy {
  constructor({ priorityLevels }) {
    this.priorityLevels = [...priorityLevels].sort((a, b) => a - b);
  }

  compare(left, right) {
    if (!right) return 1;
    const leftCounts = runningCountsByPriority(left, this.priorityLevels);
    const rightCounts = runningCountsByPriority(right, this.priorityLevels);

    for (let index = 0; index < this.priorityLevels.length; index += 1) {
      if (leftCounts[index] !== rightCounts[index]) {
        return leftCounts[index] > rightCounts[index] ? 1 : -1;
      }
    }

    const leftSignature = canonicalSignature(left);
    const rightSignature = canonicalSignature(right);
    if (leftSignature === rightSignature) return 0;
    return leftSignature < rightSignature ? 1 : -1;
  }

  selectBetter(candidate, currentBest) {
    return this.compare(candidate, currentBest) > 0
      ? candidate
      : currentBest;
  }

  describeScore(solution) {
    return {
      priorityRunningCounts: Object.fromEntries(
        this.priorityLevels.map((priority, index) => [
          priority,
          runningCountsByPriority(solution, this.priorityLevels)[index]
        ])
      ),
      tieBreakSignature: canonicalSignature(solution)
    };
  }
}
