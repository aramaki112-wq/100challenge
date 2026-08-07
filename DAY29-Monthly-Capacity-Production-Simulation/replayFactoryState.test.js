import { test, assertEqual } from "./testRunner.js";
import { createInitialFactoryState } from "./FactoryState.js";
import { EVENT_TYPES } from "./applyFactoryEvent.js";
import { replayFactoryState } from "./replayFactoryState.js";

export function registerReplayFactoryStateTests() {
  test("Future AssignmentをTarget Timeより早く適用しない", () => {
    const state = replayFactoryState({
      initialState: createInitialFactoryState(),
      targetTime: "2026-07-26T09:00:00",
      events: [{
        eventId: "E1",
        type: EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT,
        occurredAt: "2026-07-26T10:00:00",
        payload: {
          workerId: "W1",
          equipmentId: "EQ1"
        }
      }]
    });
    assertEqual(Boolean(state.workerAssignments.W1), false);
  });
}
