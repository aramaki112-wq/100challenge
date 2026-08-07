import { test, assertEqual, assertTrue } from "./testRunner.js";
import { CalculateMonthlyCapacity } from "./CalculateMonthlyCapacity.js";
import { createMinimalData } from "./day29TestFixtures.js";
import { FACTORY_DAY_TYPES, REASON_CODES } from "./Day29Constants.js";

function calculate(options = {}) { const data = createMinimalData(options); return new CalculateMonthlyCapacity().execute({ month: "2026-08", data }); }
export function registerDay29CapacityTests() {
  test("D29-CAP-001", "工場休日は設備Capacity 0", () => { const data = createMinimalData(); data.factoryCalendar[0].dayType = FACTORY_DAY_TYPES.FACTORY_HOLIDAY; data.factoryCalendar[0].plannedShiftIds = []; const row = new CalculateMonthlyCapacity().execute({ month: "2026-08", data }).shiftResults.find((item) => item.date === "2026-08-03"); assertEqual(row.availableMinutes, 0); assertEqual(row.reasonCode, REASON_CODES.FACTORY_HOLIDAY); });
  test("D29-CAP-002", "設備停止はCapacity 0", () => { const row = calculate({ equipmentStopped: true }).shiftResults.find((item) => item.date === "2026-08-03"); assertEqual(row.availableCapacity, 0); assertEqual(row.reasonCode, REASON_CODES.EQUIPMENT_STOPPED); });
  test("D29-CAP-003", "能力低下倍率を日別Capacityへ反映する", () => { const row = calculate({ equipmentMultiplier: 0.5 }).shiftResults.find((item) => item.date === "2026-08-03"); assertEqual(row.availableCapacity, 40); });
  test("D29-CAP-004", "1Shiftのみ成立すると1日換算1.0になる", () => { const monthly = calculate().monthlyResults[0]; assertEqual(monthly.operatingDayEquivalent, 1); });
  test("D29-CAP-005", "一部勤務は時間比で日数換算する", () => { const monthly = calculate({ workerStart: "12:00" }).monthlyResults[0]; assertEqual(monthly.operatingDayEquivalent, 0.5); });
  test("D29-CAP-006", "複数設備が別Workerなら工場全体で同時成立する", () => { const result = calculate({ secondEquipment: true }); assertEqual(result.shiftResults.filter((item) => item.date === "2026-08-03" && item.availableMinutes > 0).length, 2); });
  test("D29-CAP-007", "設備単体候補があっても工場競合で一台不成立", () => { const result = calculate({ secondEquipment: true, conflict: true }); const rows = result.shiftResults.filter((item) => item.date === "2026-08-03"); assertEqual(rows.filter((item) => item.availableMinutes > 0).length, 1); });
  test("D29-CAP-008", "日別Capacityを算出する", () => { const daily = calculate().dailyResults.find((item) => item.date === "2026-08-03"); assertEqual(daily.availableCapacity, 80); });
  test("D29-CAP-009", "月間Capacityを日別から積み上げる", () => { const monthly = calculate().monthlyResults[0]; assertEqual(monthly.availableCapacity, 80); });
  test("D29-CAP-010", "稼働可能日数換算は時間を標準日時間で割る", () => { const monthly = calculate({ workerStart: "10:00" }).monthlyResults[0]; assertEqual(monthly.operatingDayEquivalent, 0.75); });
  test("D29-CAP-011", "Factory Capacity集計を生成する", () => { const result = calculate({ secondEquipment: true }); assertEqual(result.factoryMonthlyResults[0].equipmentCount, 2); assertTrue(result.factoryMonthlyResults[0].availableEquipmentMinutes > 0); });
}
