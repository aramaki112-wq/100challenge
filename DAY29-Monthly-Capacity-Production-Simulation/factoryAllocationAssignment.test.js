import { test, assertEqual, assertDeepEqual } from "./testRunner.js";
import {
  getWorkerAssignments,
  isWorkerAssignedToEquipment,
  addWorkerAssignment,
  removeWorkerAssignment,
  removeAllWorkerAssignments
} from "./WorkerAssignmentState.js";

export function registerAssignmentStateTests() {
  test("D27-ASSIGN-001", "一人のWorkerを複数EquipmentへAssignmentできる", () => {
    let state = {};
    state = addWorkerAssignment({ workerAssignments: state, workerId: "W1", equipmentId: "A", assignedAt: "T1" });
    state = addWorkerAssignment({ workerAssignments: state, workerId: "W1", equipmentId: "B", assignedAt: "T2" });
    assertEqual(getWorkerAssignments({ workerAssignments: state, workerId: "W1" }).length, 2);
  });

  test("D27-ASSIGN-002", "旧形式Assignmentを読み取れる", () => {
    const legacy = { W1: { equipmentId: "A", assignedAt: "T1" } };
    assertEqual(isWorkerAssignedToEquipment({ workerAssignments: legacy, workerId: "W1", equipmentId: "A" }), true);
  });

  test("D27-ASSIGN-003", "指定EquipmentだけUnassignする", () => {
    let state = {};
    state = addWorkerAssignment({ workerAssignments: state, workerId: "W1", equipmentId: "A", assignedAt: "T1" });
    state = addWorkerAssignment({ workerAssignments: state, workerId: "W1", equipmentId: "B", assignedAt: "T2" });
    state = removeWorkerAssignment({ workerAssignments: state, workerId: "W1", equipmentId: "A" });
    assertDeepEqual(getWorkerAssignments({ workerAssignments: state, workerId: "W1" }).map(x => x.equipmentId), ["B"]);
  });

  test("D27-ASSIGN-004", "旧形式Unassignとして全Assignmentを削除できる", () => {
    const result = removeAllWorkerAssignments({ workerAssignments: { W1: { A: { equipmentId: "A" } } }, workerId: "W1" });
    assertEqual(Boolean(result.W1), false);
  });
}
