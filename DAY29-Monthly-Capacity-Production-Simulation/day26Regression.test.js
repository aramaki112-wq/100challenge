import { test, assertEqual } from "./testRunner.js";
import { Worker } from "./Worker.js";
import { findWorkerRoleMatching } from "./findWorkerRoleMatching.js";

export function registerDay26RegressionTests() {
  test("D27-REG-004", "DAY26：Multi-skilled Workerを複数Roleへ二重計上しない", () => {
    const result = findWorkerRoleMatching({
      requirements: [{skillId:"OPERATOR",requiredCount:1},{skillId:"CRANE",requiredCount:1}],
      availableWorkers: [new Worker({workerId:"W1",name:"W1",skillIds:["OPERATOR","CRANE"]})]
    });
    assertEqual(result.matched, false);
    assertEqual(result.allocations.length, 1);
  });

  test("D27-REG-005", "DAY26：Backtrackingで成立する組合せを発見する", () => {
    const result = findWorkerRoleMatching({
      requirements: [{skillId:"OPERATOR",requiredCount:1},{skillId:"CRANE",requiredCount:1}],
      availableWorkers: [
        new Worker({workerId:"W1",name:"W1",skillIds:["OPERATOR","CRANE"]}),
        new Worker({workerId:"W2",name:"W2",skillIds:["OPERATOR"]})
      ]
    });
    assertEqual(result.matched, true);
  });
}
