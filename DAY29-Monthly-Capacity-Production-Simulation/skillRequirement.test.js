import { test, assertEqual } from "./testRunner.js";
import { Equipment } from "./Equipment.js";
import { Worker } from "./Worker.js";
import { evaluateSkillRequirement } from "./evaluateSkillRequirement.js";

export function registerSkillRequirementTests() {
  test("総人数がいてもINSPECTOR不足ならSkill Requirementは未充足", () => {
    const equipment = new Equipment({
      equipmentId: "E1",
      name: "E1",
      requiredWorkerCount: 3,
      requiredSkillRequirements: [
        { skillId: "OPERATOR", requiredCount: 1 },
        { skillId: "CRANE", requiredCount: 1 },
        { skillId: "INSPECTOR", requiredCount: 1 }
      ]
    });
    const workers = [
      new Worker({ workerId: "A", name: "A", skillIds: ["OPERATOR"] }),
      new Worker({ workerId: "B", name: "B", skillIds: ["OPERATOR"] }),
      new Worker({ workerId: "C", name: "C", skillIds: ["CRANE"] })
    ];
    const result = evaluateSkillRequirement({
      equipment,
      availableWorkers: workers
    });
    assertEqual(result.satisfied, false);
    assertEqual(result.reasons[0].skillId, "INSPECTOR");
  });
}
