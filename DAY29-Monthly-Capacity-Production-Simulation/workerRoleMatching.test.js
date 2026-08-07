import { test, assertEqual } from "./testRunner.js";
import { Worker } from "./Worker.js";
import { findWorkerRoleMatching } from "./findWorkerRoleMatching.js";

export function registerWorkerRoleMatchingTests() {
  test("一人の複数Skillを二つのRoleへ二重計上しない", () => {
    const worker = new Worker({
      workerId: "W1",
      name: "W1",
      skillIds: ["OPERATOR", "CRANE"]
    });
    const result = findWorkerRoleMatching({
      requirements: [
        { skillId: "OPERATOR", requiredCount: 1 },
        { skillId: "CRANE", requiredCount: 1 }
      ],
      availableWorkers: [worker]
    });
    assertEqual(result.matched, false);
    assertEqual(result.allocations.length, 1);
  });

  test("Backtrackingで正しい組合せを見つける", () => {
    const flexible = new Worker({
      workerId: "W1",
      name: "W1",
      skillIds: ["OPERATOR", "CRANE"]
    });
    const operator = new Worker({
      workerId: "W2",
      name: "W2",
      skillIds: ["OPERATOR"]
    });
    const result = findWorkerRoleMatching({
      requirements: [
        { skillId: "OPERATOR", requiredCount: 1 },
        { skillId: "CRANE", requiredCount: 1 }
      ],
      availableWorkers: [flexible, operator]
    });
    assertEqual(result.matched, true);
    assertEqual(result.allocations.length, 2);
  });
}
