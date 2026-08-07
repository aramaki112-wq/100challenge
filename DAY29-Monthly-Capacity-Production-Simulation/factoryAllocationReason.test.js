import { test, assertEqual, assertIncludes, assertTrue } from "./testRunner.js";
import { findScenario } from "./sampleFactoryAllocationData.js";
import { evaluateScenario } from "./testSupport.js";

export function registerFactoryAllocationReasonTests() {
  test("D27-REASON-001/002", "事前条件ReasonをWorker競合より優先する", async () => {
    for (const id of ["SCENARIO_G", "SCENARIO_H"]) {
      const result = await evaluateScenario(findScenario(id));
      assertEqual(result.equipmentResults[0].conflicts.length, 0);
    }
  });

  test("D27-REASON-003", "Worker Count不足とSkill不足を区別する", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_F"));
    assertIncludes(result.equipmentResults[0].blockedReasons, x => x.code === "SKILL_REQUIREMENT_SHORTAGE");
  });

  test("D27-REASON-004", "Worker競合Dataを返す", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    assertEqual(result.conflicts.length, 1);
    const conflict = result.conflicts[0];
    assertEqual(conflict.workerId, "WORKER_E");
    assertEqual(conflict.selectedEquipmentId, "EQUIPMENT_A");
  });

  test("D27-REASON-005", "Domain Resultに日本語表示文を含めない", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_B"));
    const json = JSON.stringify(result.conflicts);
    assertEqual(json.includes("両方で必要"), false);
  });

  test("D27-REASON-007", "RUNNING EquipmentはALLOCATION_COMPLETEを返す", async () => {
    const result = await evaluateScenario(findScenario("SCENARIO_A"));
    assertTrue(result.equipmentResults.every(x => x.reasons.some(r => r.code === "ALLOCATION_COMPLETE")));
  });
}
