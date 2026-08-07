import { test, assertEqual } from "./testRunner.js";
import { Equipment } from "./Equipment.js";
import { evaluateEquipmentAvailability } from "./evaluateEquipmentAvailability.js";

export function registerEquipmentAvailabilityTests() {
  test("人数とSkillの両方が満たされるとExecutableになる", () => {
    const equipment = new Equipment({
      equipmentId: "E1",
      name: "E1",
      requiredWorkerCount: 1,
      requiredSkillRequirements: []
    });
    const result = evaluateEquipmentAvailability({
      equipment,
      equipmentOperable: true,
      materialAvailable: true,
      workerRequirementEvaluation: {
        satisfied: true,
        reasons: []
      },
      skillRequirementEvaluation: {
        satisfied: true,
        reasons: []
      }
    });
    assertEqual(result.executable, true);
  });
}
