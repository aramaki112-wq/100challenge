import { test, assertEqual, assertTrue } from "./testRunner.js";
import { ResolveManualAssignments } from "./ResolveManualAssignments.js";
import { ShiftDefinition } from "./ShiftDefinition.js";
import { EquipmentMasterRecord } from "./EquipmentMasterRecord.js";
import { EquipmentRequirementDefinition } from "./EquipmentRequirementDefinition.js";
import { createMinimalData } from "./day29TestFixtures.js";
import { REASON_CODES, WORKER_CALENDAR_STATES } from "./Day29Constants.js";

function evaluate(options = {}) {
  const data = createMinimalData(options);
  const service = new ResolveManualAssignments();
  return service.execute({ date: "2026-08-03", shift: new ShiftDefinition(data.shifts[0]), equipmentMasters: data.equipmentMasters.map((item) => new EquipmentMasterRecord(item)), equipmentRequirements: data.equipmentRequirements.map((item) => new EquipmentRequirementDefinition(item)), workerCalendars: data.workerCalendar, assignments: data.assignments, qualifications: data.workerSkillQualifications });
}
function result(evaluation, equipmentId = "E1") { return evaluation.segments[0].equipmentResults.find((item) => item.equipmentId === equipmentId); }

export function registerDay29AssignmentTests() {
  test("D29-ASSIGN-001", "出勤WorkerのAssignmentが成立する", () => assertEqual(result(evaluate()).state, "RUNNING"));
  test("D29-ASSIGN-002", "欠勤WorkerはAssignment不成立", () => { const value = result(evaluate({ workerStatus: WORKER_CALENDAR_STATES.ABSENT })); assertEqual(value.state, "BLOCKED"); assertEqual(value.reasonCode, REASON_CODES.OUTSIDE_WORKING_TIME); });
  test("D29-ASSIGN-003", "遅刻はShiftを部分時間へ分割する", () => { const value = evaluate({ workerStatus: WORKER_CALENDAR_STATES.LATE, workerStart: "10:00" }); assertEqual(value.segments.length, 2); assertEqual(result(value).state, "BLOCKED"); assertEqual(result(value, "E1").reasonCode, REASON_CODES.OUTSIDE_WORKING_TIME); });
  test("D29-ASSIGN-004", "早退は後半を不成立にする", () => { const value = evaluate({ workerStatus: WORKER_CALENDAR_STATES.EARLY_LEAVE, workerEnd: "14:00" }); assertEqual(value.segments.length, 2); assertEqual(value.segments[1].equipmentResults[0].state, "BLOCKED"); });
  test("D29-ASSIGN-005", "応援受入Workerを配置工場で利用できる", () => { const value = result(evaluate({ workerStatus: WORKER_CALENDAR_STATES.SUPPORT_IN })); assertEqual(value.state, "RUNNING"); assertEqual(value.allocations[0].workerId, "W1"); });
  test("D29-ASSIGN-006", "有効Skillを保有するとRoleを満たす", () => assertEqual(result(evaluate()).allocations[0].allocatedRoleSkillId, "OP"));
  test("D29-ASSIGN-007", "Skill期限切れを検出する", () => { const value = result(evaluate({ skillEndDate: "2026-08-02" })); assertEqual(value.reasonCode, REASON_CODES.SKILL_SHORTAGE); assertTrue(value.diagnostic.invalidAssignments.some((item) => item.reasonCode === REASON_CODES.SKILL_EXPIRED)); });
  test("D29-ASSIGN-008", "設備間競合では高Priority設備を成立させる", () => { const value = evaluate({ secondEquipment: true, conflict: true }); assertEqual(result(value, "E1").state, "RUNNING"); assertEqual(result(value, "E2").reasonCode, REASON_CODES.ASSIGNMENT_CONFLICT); });
  test("D29-ASSIGN-009", "必要人数不足を検出する", () => { const data = createMinimalData(); data.equipmentRequirements[0] = { equipmentId: "E1", requiredWorkerCount: 2, roleRequirements: [{ skillId: "OP", requiredCount: 1 }] }; const value = new ResolveManualAssignments().execute({ date: "2026-08-03", shift: new ShiftDefinition(data.shifts[0]), equipmentMasters: data.equipmentMasters.map((item) => new EquipmentMasterRecord(item)), equipmentRequirements: data.equipmentRequirements.map((item) => new EquipmentRequirementDefinition(item)), workerCalendars: data.workerCalendar, assignments: data.assignments, qualifications: data.workerSkillQualifications }); assertEqual(result(value).reasonCode, REASON_CODES.WORKER_COUNT_SHORTAGE); });
  test("D29-ASSIGN-010", "Role別人数不足をSkill不足として区別する", () => { const data = createMinimalData(); data.equipmentRequirements[0] = { equipmentId: "E1", requiredWorkerCount: 1, roleRequirements: [{ skillId: "CRANE", requiredCount: 1 }] }; const value = new ResolveManualAssignments().execute({ date: "2026-08-03", shift: new ShiftDefinition(data.shifts[0]), equipmentMasters: data.equipmentMasters.map((item) => new EquipmentMasterRecord(item)), equipmentRequirements: data.equipmentRequirements.map((item) => new EquipmentRequirementDefinition(item)), workerCalendars: data.workerCalendar, assignments: data.assignments, qualifications: data.workerSkillQualifications }); assertEqual(result(value).reasonCode, REASON_CODES.SKILL_SHORTAGE); });
}
