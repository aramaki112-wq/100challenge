export class CompareSimulationScenarios {
  execute({ base, target }) {
    const baseMonthly = new Map((base.capacity.monthlyResults ?? []).map((item) => [item.equipmentId, item]));
    const targetMonthly = new Map((target.capacity.monthlyResults ?? []).map((item) => [item.equipmentId, item]));
    const equipmentIds = [...new Set([...baseMonthly.keys(), ...targetMonthly.keys()])].sort();
    const equipmentDiffs = equipmentIds.map((equipmentId) => {
      const a = baseMonthly.get(equipmentId) ?? {};
      const b = targetMonthly.get(equipmentId) ?? {};
      return {
        equipmentId,
        operatingDayEquivalent: (b.operatingDayEquivalent ?? 0) - (a.operatingDayEquivalent ?? 0),
        availableMinutes: (b.availableMinutes ?? 0) - (a.availableMinutes ?? 0),
        availableCapacity: (b.availableCapacity ?? 0) - (a.availableCapacity ?? 0),
        workerShortageShiftCount: (b.workerShortageShiftCount ?? 0) - (a.workerShortageShiftCount ?? 0),
        skillShortageShiftCount: (b.skillShortageShiftCount ?? 0) - (a.skillShortageShiftCount ?? 0),
        assignmentConflictShiftCount: (b.assignmentConflictShiftCount ?? 0) - (a.assignmentConflictShiftCount ?? 0)
      };
    });
    return {
      baseScenarioId: base.scenarioId,
      targetScenarioId: target.scenarioId,
      equipmentDiffs,
      achievedQuantity: target.simulation.achievedQuantity - base.simulation.achievedQuantity,
      unprocessedQuantity: target.simulation.unprocessedQuantity - base.simulation.unprocessedQuantity,
      bottleneckChanged: base.simulation.bottleneckEquipmentId !== target.simulation.bottleneckEquipmentId || base.simulation.bottleneckProcessId !== target.simulation.bottleneckProcessId,
      baseBottleneck: { equipmentId: base.simulation.bottleneckEquipmentId, processId: base.simulation.bottleneckProcessId },
      targetBottleneck: { equipmentId: target.simulation.bottleneckEquipmentId, processId: target.simulation.bottleneckProcessId }
    };
  }
}
