import { test, assertEqual, assertDeepEqual, assertIncludes } from "./testRunner.js";
import { factoryAllocationScenarios, findScenario } from "./sampleFactoryAllocationData.js";
import { evaluateScenario } from "./testSupport.js";

function stateById(result, id) {
  return result.equipmentResults.find((item) => item.equipmentId === id);
}

export function registerFactoryAllocationTests() {
  test("D27-ALLOC-001", "Scenario A：競合なしなら二設備を同時実行できる", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_A"));
    assertEqual(result.summary.runningEquipmentCount, 2);
    assertEqual(new Set(result.workerAllocations.map(x => x.workerId)).size, 2);
  });

  test("D27-ALLOC-002", "Scenario B：同じWorkerは高Priority設備だけへAllocationされる", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    assertEqual(stateById(result, "EQUIPMENT_A").executionState, "RUNNING");
    assertEqual(stateById(result, "EQUIPMENT_B").executionState, "BLOCKED");
    assertEqual(result.workerAllocations.length, 1);
    assertEqual(result.workerAllocations[0].workerId, "WORKER_E");
  });

  test("D27-ALLOC-003", "Scenario C：Priority変更で結果が逆転する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_C"));
    assertEqual(stateById(result, "EQUIPMENT_A").executionState, "BLOCKED");
    assertEqual(stateById(result, "EQUIPMENT_B").executionState, "RUNNING");
  });

  test("D27-ALLOC-004", "Scenario D：Factory全体探索がGreedy失敗を回避する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_D"));
    assertEqual(result.summary.runningEquipmentCount, 2);
    const compact = result.workerAllocations.map(x => `${x.workerId}:${x.equipmentId}`).sort();
    assertDeepEqual(compact, ["WORKER_E:EQUIPMENT_B", "WORKER_F:EQUIPMENT_A"]);
  });

  test("D27-ALLOC-005", "Scenario E：単体では両方実行可能でもFactory全体では一台だけ", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_E"));
    assertEqual(result.equipmentResults.every(x => x.individuallyExecutable), true);
    assertEqual(result.summary.runningEquipmentCount, 1);
  });

  test("D27-ALLOC-006", "Scenario F：人数は足りてもSkill不足を返す", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_F"));
    const equipment = result.equipmentResults[0];
    assertIncludes(equipment.blockedReasons, x => x.code === "SKILL_REQUIREMENT_SHORTAGE");
    assertEqual(equipment.blockedReasons.some(x => x.code === "WORKER_COUNT_SHORTAGE"), false);
  });

  test("D27-ALLOC-007", "Scenario G：Equipment停止ならWorkerをReservationしない", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_G"));
    assertIncludes(result.equipmentResults[0].blockedReasons, x => x.code === "EQUIPMENT_NOT_OPERABLE");
    assertEqual(result.workerAllocations.length, 0);
  });

  test("D27-ALLOC-008", "Scenario H：Material不足を反映する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_H"));
    assertIncludes(result.equipmentResults[0].blockedReasons, x => x.code === "MATERIAL_NOT_AVAILABLE");
  });

  test("D27-ALLOC-009/010", "Scenario I：Shift外・欠勤Workerを候補から除外する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_I"));
    assertEqual(result.summary.runningEquipmentCount, 0);
    assertEqual(result.equipmentResults.every(x => x.availableCandidateCount === 0), true);
    assertEqual(Object.keys(result.factoryState.workerAssignments).length, 2);
  });

  test("D27-ALLOC-011", "Factory Allocation ResultでWorker IDが重複しない", async () => {
    for (const scenario of factoryAllocationScenarios) {
      const result = await evaluateScenario(scenario);
      const ids = result.workerAllocations.map(x => x.workerId);
      assertEqual(new Set(ids).size, ids.length);
    }
  });

  test("D27-ALLOC-015/016", "RUNNINGは全人数充足しBLOCKEDは仮Allocationを返さない", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    for (const equipment of result.equipmentResults) {
      if (equipment.executionState === "RUNNING") {
        assertEqual(equipment.allocatedWorkerCount, equipment.requiredWorkerCount);
      } else {
        assertEqual(equipment.allocations.length, 0);
      }
    }
  });

  test("D27-ALLOC-017", "Available Candidate Countは固有Worker数である", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    assertEqual(result.equipmentResults[0].availableCandidateCount, 1);
    assertEqual(result.equipmentResults[1].availableCandidateCount, 1);
  });
}
