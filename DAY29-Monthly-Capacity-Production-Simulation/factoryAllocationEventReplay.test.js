import { test, assertEqual } from "./testRunner.js";
import { Worker } from "./Worker.js";
import { Equipment } from "./Equipment.js";
import { EVENT_TYPES } from "./applyFactoryEvent.js";
import { createInitialFactoryState } from "./FactoryState.js";
import { evaluateScenario, MemoryEventRepository } from "./testSupport.js";
import { findScenario } from "./sampleFactoryAllocationData.js";

export function registerFactoryAllocationEventReplayTests() {
  test("D27-EVENT-001", "Target Timeより未来のEventを適用しない", async () => {
    const base = findScenario("SCENARIO_A");
    const future = { ...base, events: structuredClone(base.events) };
    future.events.push({ eventId: "FUTURE", type: EVENT_TYPES.WORKER_ABSENCE_STARTED, occurredAt: "2026-07-27T11:00:00", payload: { workerId: "WORKER_A", absenceId: "F" } });
    const result = await evaluateScenario(future, null, "2026-07-27T10:00:00");
    assertEqual(result.equipmentResults.find(x => x.equipmentId === "EQUIPMENT_A").executionState, "RUNNING");
  });

  test("D27-EVENT-002", "Target Timeと同時刻のEventを適用する", async () => {
    const original = findScenario("SCENARIO_G");
    const base = { ...original, events: structuredClone(original.events) };
    base.events.push({ eventId: "SAME", type: EVENT_TYPES.EQUIPMENT_STATUS_CHANGED, occurredAt: "2026-07-27T10:00:00", payload: { equipmentId: "EQUIPMENT_A", operable: true } });
    const result = await evaluateScenario(base);
    assertEqual(result.equipmentResults[0].executionState, "RUNNING");
  });

  test("D27-EVENT-003", "Target Time変更でAllocation結果が変わる", async () => {
    const original = findScenario("SCENARIO_A");
    const base = { ...original, events: structuredClone(original.events) };
    base.events.push({ eventId: "ABS", type: EVENT_TYPES.WORKER_ABSENCE_STARTED, occurredAt: "2026-07-27T11:00:00", payload: { workerId: "WORKER_A", absenceId: "ABS" } });
    const before = await evaluateScenario(base, null, "2026-07-27T10:00:00");
    const after = await evaluateScenario(base, null, "2026-07-27T12:00:00");
    assertEqual(before.summary.runningEquipmentCount, 2);
    assertEqual(after.summary.runningEquipmentCount, 1);
  });

  test("D27-EVENT-004/005", "AllocationとPriority OverrideをEvent Logへ追加しない", async () => {
    const scenario = findScenario("SCENARIO_B");
    const count = scenario.events.length;
    await evaluateScenario(scenario, [{equipmentId:"EQUIPMENT_A",value:2},{equipmentId:"EQUIPMENT_B",value:1}]);
    assertEqual(scenario.events.length, count);
  });
}
