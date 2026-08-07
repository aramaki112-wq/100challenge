import { test, assertEqual, assertThrows, assertTrue } from "./testRunner.js";
import { Worker } from "./Worker.js";
import { Equipment } from "./Equipment.js";
import { buildEquipmentRoleSlots } from "./buildEquipmentRoleSlots.js";
import { findCompleteRoleSlotMatchings, findCompleteWorkerRoleMatchings } from "./findWorkerRoleMatching.js";

export function registerRoleSlotMatchingTests() {
  test("D27-ALLOC-019", "Skill RoleとGENERAL Roleを含む全必要人数をAllocationする", () => {
    const equipment = new Equipment({ equipmentId: "A", name: "A", requiredWorkerCount: 2, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }] });
    const slots = buildEquipmentRoleSlots(equipment);
    assertEqual(slots.length, 2);
    assertEqual(slots.filter(x => x.roleType === "GENERAL").length, 1);
    const workers = [
      new Worker({ workerId: "W1", name: "W1", skillIds: ["OPERATOR"] }),
      new Worker({ workerId: "W2", name: "W2", skillIds: [] })
    ];
    const matchings = findCompleteRoleSlotMatchings({ roleSlots: slots, availableWorkers: workers });
    assertEqual(matchings[0].length, 2);
    assertEqual(new Set(matchings[0].map(x => x.workerId)).size, 2);
  });

  test("D27-REG-007", "DAY26互換の完全Matching列挙APIを提供する", () => {
    const workers = [
      new Worker({ workerId: "W1", name: "W1", skillIds: ["OPERATOR", "CRANE"] }),
      new Worker({ workerId: "W2", name: "W2", skillIds: ["OPERATOR"] })
    ];
    const results = findCompleteWorkerRoleMatchings({ requirements: [{ skillId: "OPERATOR", requiredCount: 1 }, { skillId: "CRANE", requiredCount: 1 }], availableWorkers: workers });
    assertTrue(results.length >= 1);
    assertEqual(results[0].allocations.length, 2);
  });

  test("D27-ALLOC-012", "一人を複数Role Slotへ二重使用しない", () => {
    const equipment = new Equipment({ equipmentId: "A", name: "A", requiredWorkerCount: 2, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }, { skillId: "CRANE", requiredCount: 1 }] });
    const worker = new Worker({ workerId: "W1", name: "W1", skillIds: ["OPERATOR", "CRANE"] });
    const matchings = findCompleteRoleSlotMatchings({ roleSlots: buildEquipmentRoleSlots(equipment), availableWorkers: [worker] });
    assertEqual(matchings.length, 0);
  });
}
