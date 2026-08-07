import {
  test,
  assertTrue,
  assertIncludes
} from "./testRunner.js";
import { EvaluateFactoryAtTime } from "./EvaluateFactoryAtTime.js";
import { EvaluateFactoryAllocationAtTime } from "./EvaluateFactoryAllocationAtTime.js";
import { BuildCapacityCalendar } from "./BuildCapacityCalendar.js";
import { MemoryEventRepository } from "./testSupport.js";
import { findCapacityScenario } from "./sampleCapacityCalendarData.js";
import { CAPACITY_EVENT_TYPES } from "./CapacityEventTypes.js";

async function resultForA() {
  const scenario = findCapacityScenario("CAPACITY_A");
  const repository = new MemoryEventRepository(scenario.events);
  const evaluateFactoryAtTime = new EvaluateFactoryAtTime({ eventRepository: repository });
  const service = new BuildCapacityCalendar({
    eventRepository: repository,
    evaluateFactoryAllocationAtTime: new EvaluateFactoryAllocationAtTime({ evaluateFactoryAtTime })
  });
  return service.execute({
    startAt: scenario.startAt,
    endAt: scenario.endAt,
    intervalMinutes: scenario.intervalMinutes,
    equipment: scenario.equipment,
    workers: scenario.workers,
    initialFactoryState: scenario.initialFactoryState,
    priorities: scenario.priorities
  });
}

export function registerCapacityEventTests() {
  test("D28-EVENT-001", "欠勤開始でWorkerBecameUnavailableを導出する", async () => {
    const result = await resultForA();
    assertIncludes(result.capacityEvents, (event) =>
      event.type === CAPACITY_EVENT_TYPES.WORKER_BECAME_UNAVAILABLE &&
      event.occurredAt === "2026-07-28T10:00:00" &&
      event.payload.workerId === "WORKER_C"
    );
  });

  test("D28-EVENT-002", "Capacity変化をEquipmentとFactoryの両方で導出する", async () => {
    const result = await resultForA();
    assertIncludes(result.capacityEvents, (event) =>
      event.type === CAPACITY_EVENT_TYPES.EQUIPMENT_CAPACITY_CHANGED &&
      event.occurredAt === "2026-07-28T10:00:00"
    );
    assertIncludes(result.capacityEvents, (event) =>
      event.type === CAPACITY_EVENT_TYPES.FACTORY_CAPACITY_CHANGED &&
      event.occurredAt === "2026-07-28T10:00:00"
    );
  });

  test("D28-EVENT-003", "Capacity EventはSource Event Logへ保存しない", async () => {
    const result = await resultForA();
    assertTrue(result.capacityEvents.length > 0);
    assertTrue(result.capacityEvents.every((event) =>
      event.type !== "WORKER_ABSENCE_STARTED"
    ));
  });
}
