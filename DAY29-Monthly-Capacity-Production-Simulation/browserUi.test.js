import { test, assertTrue } from "./testRunner.js";
import { CapacityCalendarView } from "./CapacityCalendarView.js";

function createView(fixture) {
  fixture.innerHTML = `
    <select id="fScenario"></select>
    <p id="fDescription"></p>
    <input id="fStart">
    <input id="fEnd">
    <select id="fInterval"><option value="120">120</option></select>
    <div id="fPriority"></div>
    <div id="fSummary"></div>
    <div id="fWindow"></div>
    <div id="fPeriod"></div>
    <div id="fEvent"></div>
    <div id="fError"></div>`;
  return new CapacityCalendarView({
    scenarioSelect: fixture.querySelector("#fScenario"),
    scenarioDescription: fixture.querySelector("#fDescription"),
    startAtInput: fixture.querySelector("#fStart"),
    endAtInput: fixture.querySelector("#fEnd"),
    intervalInput: fixture.querySelector("#fInterval"),
    priorityContainer: fixture.querySelector("#fPriority"),
    summaryContainer: fixture.querySelector("#fSummary"),
    windowContainer: fixture.querySelector("#fWindow"),
    periodContainer: fixture.querySelector("#fPeriod"),
    eventContainer: fixture.querySelector("#fEvent"),
    errorContainer: fixture.querySelector("#fError")
  });
}

export function registerBrowserUiTests() {
  test("D28-UI-001", "Capacity WindowとPeriodをDOMへ表示する", () => {
    const fixture = document.querySelector("#uiFixture");
    const view = createView(fixture);
    view.render({
      sourceEventCount: 5,
      capacityEvents: [{
        type: "CAPACITY_CHANGED",
        occurredAt: "2026-07-28T10:00:00",
        payload: { capacityUnits: 1 }
      }],
      capacityCalendar: {
        periodCount: 1,
        windowCount: 1,
        totalMinutes: 120,
        equipmentCapacityMinutes: 120,
        windows: [{
          timeSlot: { startAt: "2026-07-28T08:00:00", endAt: "2026-07-28T10:00:00" },
          factoryState: "FULL",
          factoryCapacityUnits: 1,
          allocatedWorkerCount: 1,
          periodCount: 1,
          equipmentCapacities: [{
            equipmentName: "Equipment A",
            state: "AVAILABLE",
            capacityUnits: 1,
            staffingRatio: 1
          }]
        }],
        periods: [{
          timeSlot: { startAt: "2026-07-28T08:00:00", endAt: "2026-07-28T10:00:00", durationMinutes: 120 },
          factoryCapacity: { state: "FULL", capacityUnits: 1, totalEquipmentCount: 1 },
          equipmentCapacities: [{ equipmentName: "Equipment A", state: "AVAILABLE", capacityUnits: 1 }]
        }]
      }
    });
    assertTrue(fixture.textContent.includes("Window 1"));
    assertTrue(fixture.textContent.includes("Equipment A"));
    assertTrue(fixture.textContent.includes("CAPACITY_CHANGED"));
  });

  test("D28-UI-002", "Scenario条件とPriorityを取得できる", () => {
    const fixture = document.querySelector("#uiFixture");
    const view = createView(fixture);
    view.renderScenario({
      description: "test",
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T17:00:00",
      intervalMinutes: 120,
      equipment: [{ equipmentId: "A", name: "Equipment A" }],
      priorities: [{ equipmentId: "A", value: 1 }]
    });
    const conditions = view.getConditions();
    assertTrue(conditions.startAt.includes("2026-07-28T08:00"));
    assertTrue(conditions.priorities[0].equipmentId === "A");
  });
}
