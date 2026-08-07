import {
  test,
  assertEqual,
  assertTrue,
  assertThrows
} from "./testRunner.js";
import { TimeSlot } from "./TimeSlot.js";
import { WorkerCapacity } from "./WorkerCapacity.js";
import { EquipmentCapacity } from "./EquipmentCapacity.js";
import { FactoryCapacity } from "./FactoryCapacity.js";
import { CapacityPeriod } from "./CapacityPeriod.js";
import { CapacityCalendar } from "./CapacityCalendar.js";
import { AvailabilityCalendar } from "./AvailabilityCalendar.js";
import {
  WORKER_CAPACITY_STATES,
  FACTORY_CAPACITY_STATES
} from "./CapacityReasonCodes.js";
import { ERROR_CODES } from "./errors.js";

function slot(startAt = "2026-07-28T08:00:00", endAt = "2026-07-28T10:00:00") {
  return new TimeSlot({ startAt, endAt });
}

function equipmentCapacity({ id = "A", running = true, timeSlot = slot() } = {}) {
  return new EquipmentCapacity({
    equipmentId: id,
    equipmentName: id,
    timeSlot,
    executionState: running ? "RUNNING" : "BLOCKED",
    requiredWorkerCount: 1,
    allocatedWorkerCount: running ? 1 : 0,
    allocations: running ? [{ workerId: `W_${id}`, equipmentId: id }] : [],
    reasons: running ? [] : [{ code: "WORKER_COUNT_SHORTAGE" }]
  });
}

export function registerCapacityDomainTests() {
  test("D28-CAP-001", "Availableだが未AssignmentのWorker Capacityを区別する", () => {
    const capacity = new WorkerCapacity({
      workerId: "W1",
      timeSlot: slot(),
      withinShift: true,
      absent: false,
      available: true,
      assignedEquipmentIds: []
    });
    assertEqual(capacity.availableCapacityUnits, 1);
    assertEqual(capacity.committedCapacityUnits, 0);
    assertEqual(capacity.state, WORKER_CAPACITY_STATES.AVAILABLE_UNASSIGNED);
  });

  test("D28-CAP-002", "AllocationされたWorkerだけがCommitted Capacityを持つ", () => {
    const capacity = new WorkerCapacity({
      workerId: "W1",
      timeSlot: slot(),
      withinShift: true,
      absent: false,
      available: true,
      assignedEquipmentIds: ["A"],
      allocatedEquipmentId: "A",
      allocatedRoleSlotId: "A:ROLE:0"
    });
    assertEqual(capacity.committedCapacityUnits, 1);
    assertEqual(capacity.state, WORKER_CAPACITY_STATES.CONTRIBUTING);
  });

  test("D28-CAP-003", "Equipment Capacityは人数ではなく稼働可能単位を返す", () => {
    const capacity = equipmentCapacity();
    assertEqual(capacity.requiredWorkerCount, 1);
    assertEqual(capacity.capacityUnits, 1);
  });

  test("D28-CAP-004", "Skill不足EquipmentはCapacity 0", () => {
    const capacity = equipmentCapacity({ running: false });
    assertEqual(capacity.capacityUnits, 0);
    assertEqual(capacity.reasons[0].code, "WORKER_COUNT_SHORTAGE");
  });

  test("D28-CAP-005", "Factory Capacityは同時成立するEquipment数を集約する", () => {
    const capacity = new FactoryCapacity({
      timeSlot: slot(),
      equipmentCapacities: [
        equipmentCapacity({ id: "A" }),
        equipmentCapacity({ id: "B", running: false })
      ]
    });
    assertEqual(capacity.capacityUnits, 1);
    assertEqual(capacity.state, FACTORY_CAPACITY_STATES.PARTIAL);
  });

  test("D28-CAP-006", "全Equipmentが成立するとFactory FULL", () => {
    const capacity = new FactoryCapacity({
      timeSlot: slot(),
      equipmentCapacities: [
        equipmentCapacity({ id: "A" }),
        equipmentCapacity({ id: "B" })
      ]
    });
    assertEqual(capacity.state, FACTORY_CAPACITY_STATES.FULL);
  });

  test("D28-CAP-007", "Capacity Calendarは時間重複を拒否する", () => {
    const firstSlot = slot("2026-07-28T08:00:00", "2026-07-28T10:00:00");
    const secondSlot = slot("2026-07-28T09:00:00", "2026-07-28T11:00:00");
    const first = new CapacityPeriod({
      timeSlot: firstSlot,
      equipmentCapacities: [equipmentCapacity({ timeSlot: firstSlot })]
    });
    const second = new CapacityPeriod({
      timeSlot: secondSlot,
      equipmentCapacities: [equipmentCapacity({ timeSlot: secondSlot })]
    });
    assertThrows(() => new CapacityCalendar({
      periods: [first, second]
    }), ERROR_CODES.OVERLAPPING_TIME_SLOT);
  });

  test("D28-CAP-008", "同じCapacityの隣接PeriodをWindowへ統合する", () => {
    const firstSlot = slot("2026-07-28T08:00:00", "2026-07-28T10:00:00");
    const secondSlot = slot("2026-07-28T10:00:00", "2026-07-28T12:00:00");
    const periods = [firstSlot, secondSlot].map((timeSlot) => new CapacityPeriod({
      timeSlot,
      equipmentCapacities: [equipmentCapacity({ timeSlot })]
    }));
    const calendar = new CapacityCalendar({ periods });
    assertEqual(calendar.windows.length, 1);
    assertEqual(calendar.windows[0].timeSlot.durationMinutes, 240);
  });

  test("D28-CAP-009", "Availability Calendarも同一Workerの重複を拒否する", () => {
    assertThrows(() => new AvailabilityCalendar({
      entries: [
        { workerId: "W1", timeSlot: slot("2026-07-28T08:00:00", "2026-07-28T10:00:00"), available: true },
        { workerId: "W1", timeSlot: slot("2026-07-28T09:00:00", "2026-07-28T11:00:00"), available: true }
      ]
    }), ERROR_CODES.OVERLAPPING_TIME_SLOT);
  });

  test("D28-CAP-010", "Equipment Capacity Minutesを数量生産と分離して集計する", () => {
    const timeSlot = slot();
    const period = new CapacityPeriod({
      timeSlot,
      equipmentCapacities: [equipmentCapacity({ timeSlot })]
    });
    const calendar = new CapacityCalendar({ periods: [period] });
    assertEqual(calendar.equipmentCapacityMinutes, 120);
    assertTrue(!("productionQuantity" in calendar.toPlainObject()));
  });
}
