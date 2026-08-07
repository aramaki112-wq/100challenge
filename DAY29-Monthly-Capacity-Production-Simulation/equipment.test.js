import { test, assertEqual, assertThrows } from "./testRunner.js";
import { ERROR_CODES } from "./errors.js";
import { Equipment } from "./Equipment.js";

export function registerEquipmentTests() {
  test("Skill合計がRequired Worker Countと等しければ生成できる", () => {
    const equipment = new Equipment({
      equipmentId: "E1",
      name: "E1",
      requiredWorkerCount: 2,
      requiredSkillRequirements: [
        { skillId: "OPERATOR", requiredCount: 1 },
        { skillId: "CRANE", requiredCount: 1 }
      ]
    });
    assertEqual(equipment.requiredWorkerCount, 2);
  });

  test("Skill合計がRequired Worker Countを超えたら拒否する", () => {
    assertThrows(
      () => new Equipment({
        equipmentId: "E1",
        name: "E1",
        requiredWorkerCount: 1,
        requiredSkillRequirements: [
          { skillId: "OPERATOR", requiredCount: 1 },
          { skillId: "CRANE", requiredCount: 1 }
        ]
      }),
      ERROR_CODES.REQUIRED_SKILL_COUNT_EXCEEDS_REQUIRED_WORKER_COUNT
    );
  });
}
