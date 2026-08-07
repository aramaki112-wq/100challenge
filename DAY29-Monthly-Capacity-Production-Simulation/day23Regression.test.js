import { test, assertEqual } from "./testRunner.js";
import { EVENT_TYPES, applyFactoryEvent } from "./applyFactoryEvent.js";

export function registerDay23RegressionTests() {
  test("WIP Movedで元工程WIPを再度減らさない", () => {
    const state = {
      equipmentStates: {},
      materialStates: {},
      workerAssignments: {},
      workerShifts: {},
      workerAbsences: {},
      wipByProcess: { A: 7, B: 0 },
      completedBuffers: { A: 3 }
    };
    const moved = applyFactoryEvent(state, {
      eventId: "MOVE1",
      type: EVENT_TYPES.WIP_MOVED,
      occurredAt: "2026-07-26T09:00:00",
      payload: {
        fromProcessId: "A",
        toProcessId: "B",
        quantity: 3
      }
    });
    assertEqual(moved.wipByProcess.A, 7);
    assertEqual(moved.completedBuffers.A, 0);
    assertEqual(moved.wipByProcess.B, 3);
  });
}
