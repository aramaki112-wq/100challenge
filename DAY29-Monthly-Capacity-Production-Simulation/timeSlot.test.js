import {
  test,
  assertEqual,
  assertTrue,
  assertThrows
} from "./testRunner.js";
import { TimeSlot } from "./TimeSlot.js";
import { buildCapacityTimeSlots } from "./buildCapacityTimeSlots.js";
import { ERROR_CODES } from "./errors.js";

export function registerTimeSlotTests() {
  test("D28-TIME-001", "TimeSlotは開始を含み終了を含まない", () => {
    const slot = new TimeSlot({
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T10:00:00"
    });
    assertTrue(slot.contains("2026-07-28T08:00:00"));
    assertEqual(slot.contains("2026-07-28T10:00:00"), false);
  });

  test("D28-TIME-002", "隣接TimeSlotは重複しない", () => {
    const first = new TimeSlot({
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T10:00:00"
    });
    const second = new TimeSlot({
      startAt: "2026-07-28T10:00:00",
      endAt: "2026-07-28T12:00:00"
    });
    assertEqual(first.overlaps(second), false);
    assertTrue(first.isAdjacentTo(second));
  });

  test("D28-TIME-003", "開始と終了が同じTimeSlotを拒否する", () => {
    assertThrows(() => new TimeSlot({
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T08:00:00"
    }), ERROR_CODES.INVALID_TIME_SLOT);
  });

  test("D28-TIME-004", "不正な日時を拒否する", () => {
    assertThrows(() => new TimeSlot({
      startAt: "invalid",
      endAt: "2026-07-28T08:00:00"
    }), ERROR_CODES.INVALID_TIME);
  });

  test("D28-TIME-005", "Interval境界でCalendarを分割する", () => {
    const slots = buildCapacityTimeSlots({
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T13:00:00",
      intervalMinutes: 120,
      events: []
    });
    assertEqual(slots.length, 3);
    assertEqual(slots[2].durationMinutes, 60);
  });

  test("D28-TIME-006", "時間枠途中のEventを新しい境界にする", () => {
    const slots = buildCapacityTimeSlots({
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T12:00:00",
      intervalMinutes: 120,
      events: [{
        occurredAt: "2026-07-28T10:30:00",
        payload: {}
      }]
    });
    assertEqual(slots.length, 3);
    assertEqual(slots[1].endAt, "2026-07-28T10:30:00");
  });

  test("D28-TIME-007", "0分Intervalを拒否する", () => {
    assertThrows(() => buildCapacityTimeSlots({
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T12:00:00",
      intervalMinutes: 0,
      events: []
    }), ERROR_CODES.INVALID_INTERVAL_MINUTES);
  });
}
