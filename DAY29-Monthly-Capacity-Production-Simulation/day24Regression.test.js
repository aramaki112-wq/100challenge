import { test, assertEqual } from "./testRunner.js";
import { Worker } from "./Worker.js";
import { evaluateWorkerAvailability } from "./evaluateWorkerAvailability.js";

export function registerDay24RegressionTests() {
  test("欠勤してもAssignmentは残るがAvailableではない", () => {
    const worker = new Worker({
      workerId: "W1",
      name: "W1",
      skillIds: []
    });
    const state = {
      workerAssignments: {
        W1: { equipmentId: "EQ1" }
      },
      workerShifts: {
        W1: {
          startAt: "2026-07-26T08:00:00",
          endAt: "2026-07-26T17:00:00"
        }
      },
      workerAbsences: {
        W1: [{
          startAt: "2026-07-26T09:00:00",
          endAt: null
        }]
      }
    };
    const result = evaluateWorkerAvailability({
      worker,
      equipmentId: "EQ1",
      factoryState: state,
      targetTime: "2026-07-26T10:00:00"
    });
    assertEqual(result.assigned, true);
    assertEqual(result.available, false);
  });
}
