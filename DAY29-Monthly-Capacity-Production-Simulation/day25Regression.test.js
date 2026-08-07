import { test, assertEqual } from "./testRunner.js";
import { evaluateWorkerRequirement } from "./WorkerRequirement.js";

export function registerDay25RegressionTests() {
  test("AssignedではなくAvailable Worker Countで評価する", () => {
    const result = evaluateWorkerRequirement({
      equipmentId: "EQ1",
      requiredWorkerCount: 3,
      assignedWorkerCount: 3,
      availableWorkerCount: 2
    });
    assertEqual(result.satisfied, false);
    assertEqual(result.shortageWorkerCount, 1);
  });
}
