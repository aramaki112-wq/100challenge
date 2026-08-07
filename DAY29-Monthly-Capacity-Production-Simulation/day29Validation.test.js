import { test, assertTrue } from "./testRunner.js";
import { ValidateSimulationInput } from "./ValidateSimulationInput.js";
import { createMinimalData } from "./day29TestFixtures.js";

function hasCode(data, code) {
  return new ValidateSimulationInput().execute(data).issues.some((item) => item.code === code);
}

export function registerDay29ValidationTests() {
  test("D29-VALID-001", "Worker勤務Calendar重複を検出する", () => {
    const data = createMinimalData();
    data.workerCalendar.push(structuredClone(data.workerCalendar[0]));
    assertTrue(hasCode(data, "WORKER_CALENDAR_DUPLICATE"));
  });

  test("D29-VALID-002", "工場を跨ぐ不正Assignmentを検出する", () => {
    const data = createMinimalData();
    data.assignments[0].factoryId = "F2";
    assertTrue(hasCode(data, "CROSS_FACTORY_ASSIGNMENT"));
  });

  test("D29-VALID-003", "勤務時間外Assignmentを検出する", () => {
    const data = createMinimalData();
    data.assignments[0].startAt = "2026-08-03T07:00:00";
    assertTrue(hasCode(data, "OUTSIDE_WORKING_TIME_ASSIGNMENT"));
  });

  test("D29-VALID-004", "Assignment日のSkill期限切れを検出する", () => {
    const data = createMinimalData({ skillEndDate: "2026-08-02" });
    assertTrue(hasCode(data, "SKILL_EXPIRED"));
  });

  test("D29-VALID-005", "稼働予定設備の未配置を検出する", () => {
    const data = createMinimalData();
    data.assignments = [];
    assertTrue(hasCode(data, "PLANNED_EQUIPMENT_UNASSIGNED"));
  });

  test("D29-VALID-006", "Routingの不存在Equipmentを検出する", () => {
    const data = createMinimalData();
    data.routings[0].operations[0].eligibleEquipmentIds = ["NO_EQUIPMENT"];
    assertTrue(hasCode(data, "EQUIPMENT_NOT_FOUND"));
  });
}
