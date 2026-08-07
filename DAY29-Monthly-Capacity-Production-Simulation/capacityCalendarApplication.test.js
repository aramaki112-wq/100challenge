import {
  test,
  assertEqual,
  assertTrue,
  assertIncludes
} from "./testRunner.js";
import { EvaluateFactoryAtTime } from "./EvaluateFactoryAtTime.js";
import { EvaluateFactoryAllocationAtTime } from "./EvaluateFactoryAllocationAtTime.js";
import { BuildCapacityCalendar } from "./BuildCapacityCalendar.js";
import { MemoryEventRepository } from "./testSupport.js";
import { findCapacityScenario } from "./sampleCapacityCalendarData.js";

async function build(scenarioId, overrides = {}) {
  const scenario = findCapacityScenario(scenarioId);
  const repository = new MemoryEventRepository(scenario.events);
  const evaluateFactoryAtTime = new EvaluateFactoryAtTime({
    eventRepository: repository
  });
  const service = new BuildCapacityCalendar({
    eventRepository: repository,
    evaluateFactoryAllocationAtTime: new EvaluateFactoryAllocationAtTime({
      evaluateFactoryAtTime
    })
  });
  return service.execute({
    startAt: scenario.startAt,
    endAt: scenario.endAt,
    intervalMinutes: scenario.intervalMinutes,
    equipment: scenario.equipment,
    workers: scenario.workers,
    initialFactoryState: scenario.initialFactoryState,
    priorities: scenario.priorities,
    ...overrides
  });
}

function periodAt(result, targetTime) {
  return result.capacityCalendar.periods.find((period) => {
    const start = new Date(period.timeSlot.startAt);
    const end = new Date(period.timeSlot.endAt);
    const target = new Date(targetTime);
    return start <= target && target < end;
  });
}

export function registerCapacityCalendarApplicationTests() {
  test("D28-APP-001", "欠勤前は二設備が同時成立する", async () => {
    const result = await build("CAPACITY_A");
    assertEqual(
      periodAt(result, "2026-07-28T09:00:00").factoryCapacity.capacityUnits,
      2
    );
  });

  test("D28-APP-002", "欠勤中はSkill不足でFactory Capacityが1になる", async () => {
    const result = await build("CAPACITY_A");
    const period = periodAt(result, "2026-07-28T11:00:00");
    assertEqual(period.factoryCapacity.capacityUnits, 1);
    const equipmentB = period.equipmentCapacities.find(
      (item) => item.equipmentId === "EQUIPMENT_B"
    );
    assertEqual(equipmentB.capacityUnits, 0);
    assertIncludes(
      equipmentB.reasons,
      (reason) => reason.code === "WORKER_COUNT_SHORTAGE" || reason.code === "SKILL_SHORTAGE"
    );
  });

  test("D28-APP-003", "欠勤終了後にCapacityが回復する", async () => {
    const result = await build("CAPACITY_A");
    assertEqual(
      periodAt(result, "2026-07-28T14:00:00").factoryCapacity.capacityUnits,
      2
    );
  });

  test("D28-APP-004", "Capacity Windowは2→1→2の三つに統合される", async () => {
    const result = await build("CAPACITY_A");
    assertEqual(result.capacityCalendar.windows.length, 3);
    assertEqual(result.capacityCalendar.windows[0].factoryCapacityUnits, 2);
    assertEqual(result.capacityCalendar.windows[1].factoryCapacityUnits, 1);
    assertEqual(result.capacityCalendar.windows[2].factoryCapacityUnits, 2);
  });

  test("D28-APP-005", "同じWorkerを二設備へ同時Capacityとして数えない", async () => {
    const result = await build("CAPACITY_B");
    const period = periodAt(result, "2026-07-28T09:00:00");
    assertEqual(period.factoryCapacity.capacityUnits, 1);
    assertEqual(period.factoryCapacity.allocatedWorkerCount, 1);
    assertEqual(
      period.workerCapacities[0].committedCapacityUnits,
      1
    );
  });

  test("D28-APP-006", "Assignmentが二つでもAllocationは一つ", async () => {
    const result = await build("CAPACITY_B");
    const worker = periodAt(result, "2026-07-28T09:00:00").workerCapacities[0];
    assertEqual(worker.assignedEquipmentIds.length, 2);
    assertTrue(Boolean(worker.allocatedEquipmentId));
    assertEqual(worker.committedCapacityUnits, 1);
  });

  test("D28-APP-007", "Shift空白時間はCapacity不足になる", async () => {
    const result = await build("CAPACITY_C");
    const period = periodAt(result, "2026-07-28T12:30:00");
    assertEqual(period.factoryCapacity.capacityUnits, 1);
    assertEqual(
      period.workerCapacities.find((item) => item.workerId === "WORKER_C").available,
      false
    );
    assertEqual(
      period.workerCapacities.find((item) => item.workerId === "WORKER_F").available,
      false
    );
  });

  test("D28-APP-008", "交替WorkerのShift開始後にCapacityが回復する", async () => {
    const result = await build("CAPACITY_C");
    assertEqual(
      periodAt(result, "2026-07-28T13:30:00").factoryCapacity.capacityUnits,
      2
    );
  });

  test("D28-APP-009", "時間枠途中の設備停止でPeriodを分割する", async () => {
    const result = await build("CAPACITY_D");
    assertTrue(result.capacityCalendar.periods.some(
      (period) => period.timeSlot.endAt === "2026-07-28T10:30:00"
    ));
    assertTrue(result.capacityCalendar.periods.some(
      (period) => period.timeSlot.startAt === "2026-07-28T11:15:00"
    ));
  });

  test("D28-APP-010", "停止中だけEquipment Capacityが0になる", async () => {
    const result = await build("CAPACITY_D");
    const stopped = periodAt(result, "2026-07-28T10:45:00");
    const restarted = periodAt(result, "2026-07-28T11:30:00");
    assertEqual(
      stopped.equipmentCapacities.find((item) => item.equipmentId === "EQUIPMENT_B").capacityUnits,
      0
    );
    assertEqual(
      restarted.equipmentCapacities.find((item) => item.equipmentId === "EQUIPMENT_B").capacityUnits,
      1
    );
  });

  test("D28-APP-011", "Availability CalendarはAssignmentとは別に照会できる", async () => {
    const result = await build("CAPACITY_A");
    const entry = result.availabilityCalendar.entries.find((item) =>
      item.workerId === "WORKER_C" && item.timeSlot.startAt === "2026-07-28T10:00:00"
    );
    assertEqual(entry.available, false);
    assertEqual(entry.assignedEquipmentIds[0], "EQUIPMENT_B");
  });

  test("D28-APP-012", "Capacity ResultにProduction Quantityを含めない", async () => {
    const result = await build("CAPACITY_A");
    assertTrue(!JSON.stringify(result).includes("productionQuantity"));
    assertTrue(!JSON.stringify(result).includes("orderQuantity"));
  });

  test("D28-APP-013", "Repository EventをCapacity評価で追加変更しない", async () => {
    const scenario = findCapacityScenario("CAPACITY_A");
    const repository = new MemoryEventRepository(scenario.events);
    const before = await repository.findAll();
    const evaluateFactoryAtTime = new EvaluateFactoryAtTime({ eventRepository: repository });
    const service = new BuildCapacityCalendar({
      eventRepository: repository,
      evaluateFactoryAllocationAtTime: new EvaluateFactoryAllocationAtTime({ evaluateFactoryAtTime })
    });
    await service.execute({
      startAt: scenario.startAt,
      endAt: scenario.endAt,
      intervalMinutes: scenario.intervalMinutes,
      equipment: scenario.equipment,
      workers: scenario.workers,
      initialFactoryState: scenario.initialFactoryState,
      priorities: scenario.priorities
    });
    assertEqual(JSON.stringify(await repository.findAll()), JSON.stringify(before));
  });
}
