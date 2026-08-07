import {
  test,
  assertEqual,
  assertDeepEqual
} from "./testRunner.js";
import { Worker } from "./Worker.js";
import { createInitialFactoryState } from "./FactoryState.js";
import { evaluateWorkerTemporalAvailability } from "./evaluateWorkerTemporalAvailability.js";

function worker() {
  return new Worker({
    workerId: "W1",
    name: "Worker 1",
    skillIds: ["OPERATOR"]
  });
}

function state() {
  return {
    ...createInitialFactoryState(),
    workerShifts: {
      W1: {
        startAt: "2026-07-28T08:00:00",
        endAt: "2026-07-28T17:00:00"
      }
    },
    workerAssignments: {
      W1: {
        A: { equipmentId: "A", assignedAt: "2026-07-28T07:00:00" }
      }
    }
  };
}

export function registerTemporalAvailabilityTests() {
  test("D28-AVAIL-001", "AvailabilityはAssignmentから独立して判定する", () => {
    const current = state();
    current.workerAssignments = {};
    const result = evaluateWorkerTemporalAvailability({
      worker: worker(),
      factoryState: current,
      targetTime: "2026-07-28T09:00:00"
    });
    assertEqual(result.available, true);
    assertDeepEqual(result.assignedEquipmentIds, []);
  });

  test("D28-AVAIL-002", "Shift開始時刻はAvailabilityに含む", () => {
    const result = evaluateWorkerTemporalAvailability({
      worker: worker(),
      factoryState: state(),
      targetTime: "2026-07-28T08:00:00"
    });
    assertEqual(result.available, true);
  });

  test("D28-AVAIL-003", "Shift終了時刻はAvailabilityに含まない", () => {
    const result = evaluateWorkerTemporalAvailability({
      worker: worker(),
      factoryState: state(),
      targetTime: "2026-07-28T17:00:00"
    });
    assertEqual(result.available, false);
  });

  test("D28-AVAIL-004", "Shift内でも欠勤中はUnavailable", () => {
    const current = state();
    current.workerAbsences.W1 = [{
      absenceId: "ABS",
      startAt: "2026-07-28T10:00:00",
      endAt: "2026-07-28T11:00:00"
    }];
    const result = evaluateWorkerTemporalAvailability({
      worker: worker(),
      factoryState: current,
      targetTime: "2026-07-28T10:30:00"
    });
    assertEqual(result.withinShift, true);
    assertEqual(result.absent, true);
    assertEqual(result.available, false);
  });

  test("D28-AVAIL-005", "Assignment一覧をAvailability Resultへ残す", () => {
    const result = evaluateWorkerTemporalAvailability({
      worker: worker(),
      factoryState: state(),
      targetTime: "2026-07-28T09:00:00"
    });
    assertDeepEqual(result.assignedEquipmentIds, ["A"]);
  });
}
