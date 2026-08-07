import { test, assertEqual, assertTrue } from "./testRunner.js";
import { findScenario } from "./sampleFactoryAllocationData.js";
import { evaluateScenario } from "./testSupport.js";

export function registerFactoryAllocationResultTests() {
  test("D27-NEXT-001/002", "ResultにTarget TimeとEquipment Execution Stateを含む", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_A"));
    assertEqual(result.targetTime, "2026-07-27T10:00:00");
    assertTrue(result.equipmentResults.every(x => ["RUNNING", "BLOCKED"].includes(x.executionState)));
  });

  test("D27-NEXT-003", "Allocated Worker・Equipment・Role Slotを返す", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_A"));
    assertTrue(result.workerAllocations.every(x => x.workerId && x.equipmentId && x.roleSlotId && x.roleType));
  });

  test("D27-NEXT-004", "Blocked Reasonを機械判定可能なCodeで返す", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    const blocked = result.equipmentResults.find(x => x.executionState === "BLOCKED");
    assertTrue(blocked.blockedReasons.every(x => typeof x.code === "string"));
  });

  test("D27-NEXT-005", "DAY27 Resultに生産数量・残業・納期を含めない", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_A"));
    const json = JSON.stringify(result);
    for (const word of ["productionQuantity", "overtimeHours", "dueDateSimulation", "jobDuration"]) {
      assertEqual(json.includes(word), false);
    }
  });

  test("D27-NEXT-006", "複数Target Time評価が元Scenario Stateを変更しない", async () => {
    const scenario = findScenario("SCENARIO_A");
    const before = JSON.stringify(scenario.events);
    await evaluateScenario(scenario, null, "2026-07-27T10:00:00");
    await evaluateScenario(scenario, null, "2026-07-27T11:00:00");
    assertEqual(JSON.stringify(scenario.events), before);
  });
}
