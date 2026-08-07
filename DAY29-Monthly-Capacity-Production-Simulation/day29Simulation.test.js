import { test, assertDeepEqual, assertEqual, assertTrue } from "./testRunner.js";
import { RunScenarioSimulation } from "./RunScenarioSimulation.js";
import { CompareSimulationScenarios } from "./CompareSimulationScenarios.js";
import { createMinimalData, scenarioFromData } from "./day29TestFixtures.js";

function run(options = {}, overrides = {}) { return new RunScenarioSimulation().execute(scenarioFromData(createMinimalData(options), overrides)); }
export function registerDay29SimulationTests() {
  test("D29-SIM-001", "Capacity内ならOrderを完了する", () => { const result = run({ orderQuantity: 40 }); assertEqual(result.simulation.orderResults[0].unprocessedQuantity, 0); });
  test("D29-SIM-002", "Capacity不足なら未処理量を返す", () => { const result = run({ orderQuantity: 100 }); assertEqual(result.simulation.orderResults[0].unprocessedQuantity, 20); });
  test("D29-SIM-003", "複数日へ繰越して処理する", () => { const data = createMinimalData({ orderQuantity: 120, dueDate: "2026-08-04" }); data.factoryCalendar.push({ factoryId: "F1", date: "2026-08-04", dayType: "OPERATING", plannedShiftIds: ["S1"] }); data.workerCalendar.push({ ...data.workerCalendar[0], date: "2026-08-04", startAt: "2026-08-04T08:00:00", endAt: "2026-08-04T16:00:00" }); data.assignments.push({ ...data.assignments[0], assignmentId: "A2", date: "2026-08-04", startAt: "2026-08-04T08:00:00", endAt: "2026-08-04T16:00:00" }); const result = new RunScenarioSimulation().execute(scenarioFromData(data)); assertEqual(result.simulation.orderResults[0].unprocessedQuantity, 0); });
  test("D29-SIM-004", "複数設備のCapacityを利用できる", () => { const result = run({ secondEquipment: true, orderQuantity: 120 }); assertEqual(result.simulation.orderResults[0].unprocessedQuantity, 0); });
  test("D29-SIM-005", "複数工程では前工程完了後に次工程を開始する", () => { const result = run({ secondEquipment: true, twoOperations: true, orderQuantity: 40 }); const ops = result.simulation.operationResults; assertEqual(ops.length, 2); assertTrue(ops[1].completionAt == null || ops[1].completionAt >= ops[0].completionAt); });
  test("D29-SIM-006", "納期超過を判定する", () => { const result = run({ orderQuantity: 40, dueDate: "2026-08-02" }); assertEqual(result.simulation.orderResults[0].dueDateMet, false); });
  test("D29-SIM-007", "Bottleneck設備を返す", () => { const result = run({ orderQuantity: 100 }); assertEqual(result.simulation.bottleneckEquipmentId, "E1"); });
  test("D29-SIM-008", "未処理量をScenario全体で集約する", () => { const result = run({ orderQuantity: 100 }); assertEqual(result.simulation.unprocessedQuantity, 20); });
  test("D29-SIM-009", "Scenario差分を比較する", () => { const base = run({ secondEquipment: true, conflict: true, orderQuantity: 120 }, { scenarioId: "BASE" }); const target = run({ secondEquipment: true, conflict: false, orderQuantity: 120 }, { scenarioId: "TARGET" }); const diff = new CompareSimulationScenarios().execute({ base, target }); assertTrue(diff.unprocessedQuantity < 0); });
  test("D29-SIM-010", "再計算しても元Scenario Dataを破壊しない", () => { const data = createMinimalData({ orderQuantity: 100 }); const before = structuredClone(data); const service = new RunScenarioSimulation(); service.execute(scenarioFromData(data)); service.execute(scenarioFromData(data)); assertDeepEqual(data, before); });
  test("D29-SIM-011", "使用Capacityと残Capacityを月間結果へ反映する", () => { const result = run({ orderQuantity: 40 }); const monthly = result.capacity.monthlyResults[0]; assertEqual(monthly.usedCapacity, 40); assertTrue(monthly.remainingCapacity >= 0); });
}
