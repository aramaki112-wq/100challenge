import { test, assertEqual, assertDeepEqual } from "./testRunner.js";
import { Worker } from "./Worker.js";
import { Equipment } from "./Equipment.js";
import { EVENT_TYPES } from "./applyFactoryEvent.js";
import { createInitialFactoryState } from "./FactoryState.js";
import { evaluateScenario, MemoryEventRepository } from "./testSupport.js";
import { findScenario } from "./sampleFactoryAllocationData.js";

function makeScenario({ equipment, workers, priorities, assignments }) {
  const events = [];
  workers.forEach((worker, i) => events.push({ eventId: `S${i}`, type: EVENT_TYPES.WORKER_SHIFT_ASSIGNED, occurredAt: "2026-07-27T07:00:00", payload: { workerId: worker.workerId, startAt: "2026-07-27T08:00:00", endAt: "2026-07-27T17:00:00" } }));
  equipment.forEach((item, i) => {
    events.push({ eventId: `E${i}A`, type: EVENT_TYPES.EQUIPMENT_STATUS_CHANGED, occurredAt: "2026-07-27T07:01:00", payload: { equipmentId: item.equipmentId, operable: true } });
    events.push({ eventId: `E${i}B`, type: EVENT_TYPES.MATERIAL_STATUS_CHANGED, occurredAt: "2026-07-27T07:02:00", payload: { equipmentId: item.equipmentId, available: true } });
  });
  assignments.forEach((a, i) => events.push({ eventId: `A${i}`, type: EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, occurredAt: `2026-07-27T07:${10+i}:00`, payload: a }));
  return { targetTime: "2026-07-27T10:00:00", equipment, workers, priorities, events, initialFactoryState: createInitialFactoryState() };
}

export function registerFactoryAllocationPriorityTests() {
  test("D27-PRIORITY-001", "小さいPriority値を優先する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    assertEqual(result.equipmentResults.find(x => x.executionState === "RUNNING").priority, 1);
  });

  test("D27-PRIORITY-002", "高Priority一台を低Priority二台のために犠牲にしない", async () => {
    const workers = [
      new Worker({ workerId: "W1", name: "W1", skillIds: ["OP", "B", "C"] }),
      new Worker({ workerId: "W2", name: "W2", skillIds: ["B"] })
    ];
    const equipment = [
      new Equipment({ equipmentId: "A", name: "A", requiredWorkerCount: 2, requiredSkillRequirements: [{ skillId: "OP", requiredCount: 1 }] }),
      new Equipment({ equipmentId: "B", name: "B", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "B", requiredCount: 1 }] }),
      new Equipment({ equipmentId: "C", name: "C", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "C", requiredCount: 1 }] })
    ];
    const scenario = makeScenario({ equipment, workers, priorities: [{equipmentId:"A",value:1},{equipmentId:"B",value:2},{equipmentId:"C",value:2}], assignments: [
      {workerId:"W1",equipmentId:"A"},{workerId:"W2",equipmentId:"A"},
      {workerId:"W1",equipmentId:"B"},{workerId:"W2",equipmentId:"B"},
      {workerId:"W1",equipmentId:"C"}
    ]});
    const result = await evaluateScenario(scenario);
    assertEqual(result.equipmentResults.find(x => x.equipmentId === "A").executionState, "RUNNING");
  });

  test("D27-PRIORITY-003", "高Priorityを維持したまま後続設備数を最大化する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_D"));
    assertEqual(result.summary.runningEquipmentCount, 2);
  });

  test("D27-PRIORITY-005/006/008", "Stable Tie-breakで同じ入力から同じ結果を返す", async () => {
    const scenario = findScenario("SCENARIO_B");
    const override = [{equipmentId:"EQUIPMENT_A",value:1},{equipmentId:"EQUIPMENT_B",value:1}];
    const first = await evaluateScenario(scenario, override);
    const second = await evaluateScenario(scenario, override);
    assertEqual(first.equipmentResults.find(x => x.executionState === "RUNNING").equipmentId, "EQUIPMENT_A");
    assertDeepEqual(first.workerAllocations, second.workerAllocations);
  });

  test("D27-PRIORITY-007", "Tie-breakは実行台数最大化より後に適用する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_D"));
    assertEqual(result.summary.runningEquipmentCount, 2);
  });
}
