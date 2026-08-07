import { test, assertEqual, assertTrue } from "./testRunner.js";
import { Day29View } from "./Day29View.js";
import { RunScenarioSimulation } from "./RunScenarioSimulation.js";
import { createMinimalData, scenarioFromData } from "./day29TestFixtures.js";

function createFixture() {
  const fixture = document.querySelector("#uiFixture");
  fixture.innerHTML = `
    <select id="scenarioSelect"></select><select id="compareScenarioSelect"></select><input id="monthInput">
    <select id="factoryFilter"></select><select id="processFilter"></select><select id="equipmentFilter"></select>
    <p id="statusMessage"></p><div id="dashboardSummary"></div><div id="factorySummary"></div>
    <div id="monthlyCalendar"></div><div id="monthlySummary"></div><div id="dailyDetail"></div>
    <div id="simulationSummary"></div><div id="orderResults"></div><div id="scenarioComparison"></div>
    <div id="validationSummary"></div><div id="validationTable"></div><div id="factoryTable"></div>
    <div id="processTable"></div><div id="skillTable"></div><div id="workerTable"></div><div id="shiftTable"></div>
    <div id="stopReasonTable"></div><div id="routingTable"></div><div id="equipmentTable"></div><div id="ruleTable"></div>
    <div id="factoryCalendarTable"></div><div id="workerCalendarTable"></div><div id="equipmentCalendarTable"></div><div id="assignmentTable"></div>
    <div id="importPreview"></div><textarea id="importText"></textarea>
    <select id="importType"><option value="equipmentMasters">equipment</option></select>
    <select id="importFormat"><option value="CSV">CSV</option></select>
    <button id="recalculateButton"></button><button id="cloneScenarioButton"></button><button id="restoreBaseButton"></button><button id="resetSampleButton"></button>
    <button id="previewImportButton"></button><button id="commitImportButton"></button><button id="exportButton"></button>
    <form id="factoryForm"><input name="factoryId" value="F2"><input name="factoryName" value="Factory 2"><input name="standardDailyMinutes" value="480"><button></button></form>
    <form id="processForm"><input name="processId" value="P2"><input name="factoryId" value="F1"><input name="processName" value="Process 2"><input name="sequence" value="2"><button></button></form>
    <form id="skillForm"><input name="skillId" value="OP2"><input name="skillName" value="Operator 2"><button></button></form>
    <form id="workerForm"><input name="workerId" value="W2"><input name="workerName" value="Worker 2"><input name="homeFactoryId" value="F1"><input name="skillId" value="OP"><input name="qualificationStartDate" value="2026-01-01"><input name="qualificationEndDate" value="2099-12-31"><button></button></form>
    <form id="shiftForm"><input name="shiftId" value="S2"><input name="factoryId" value="F1"><input name="shiftName" value="S2"><input name="startTime" value="16:00"><input name="endTime" value="23:00"><input name="displayOrder" value="2"><button></button></form>
    <form id="stopReasonForm"><input name="stopReasonId" value="REPAIR"><input name="stopReasonName" value="Repair"><input name="category" value="MAINTENANCE"><button></button></form>
    <form id="routingForm"><input name="routingId" value="ROUTE2"><input name="productGroup" value="SPECIAL"><input name="operationId" value="OP2"><input name="processId" value="P1"><input name="sequence" value="1"><input name="eligibleEquipmentIds" value="E1"><button></button></form>
    <form id="equipmentForm"><input name="equipmentId" value="E2"><input name="factoryId" value="F1"><input name="processId" value="P1"><input name="equipmentName" value="Equipment 2"><input name="priority" value="2"><input name="requiredWorkerCount" value="1"><input name="skillId" value="OP"><button></button></form>
    <form id="capacityRuleForm"><input name="capacityRuleId" value="R2"><input name="equipmentId" value="E1"><input name="capacityValue" value="10"><input name="unit" value="PIECE"><input name="basis" value="HOUR"><input name="priority" value="100"><button></button></form>
    <form id="factoryCalendarForm"><input name="factoryId" value="F1"><input name="date" value="2026-08-03"><input name="dayType" value="OPERATING"><input name="plannedShiftIds" value="S1"><button></button></form>
    <form id="equipmentCalendarForm"><input name="equipmentId" value="E1"><input name="date" value="2026-08-03"><input name="shiftId" value="S1"><input name="state" value="BREAKDOWN"><input name="capacityMultiplier" value="0"><button></button></form>
    <form id="workerCalendarForm"><input name="workerId" value="W1"><input name="date" value="2026-08-03"><input name="shiftId" value="S1"><input name="status" value="PRESENT"><input name="placementFactoryId" value="F1"><input name="startTime" value="08:00"><input name="endTime" value="16:00"><button></button></form>
    <form id="assignmentForm"><input name="assignmentId" value="A2"><input name="date" value="2026-08-03"><input name="shiftId" value="S1"><input name="factoryId" value="F1"><input name="equipmentId" value="E1"><input name="workerId" value="W1"><input name="roleSkillId" value="OP"><input name="startTime" value="08:00"><input name="endTime" value="16:00"><button></button></form>
    <form id="orderForm"><input name="orderId" value="O2"><input name="productGroup" value="STANDARD"><input name="requiredQuantity" value="10"><input name="unit" value="PIECE"><input name="dueDate" value="2026-08-03"><input name="priority" value="1"><input name="routingId" value="ROUTE1"><input name="initialWip" value="0"><button></button></form>
  `;
  return { fixture, view: new Day29View({ documentRoot: fixture }) };
}

function handlers(overrides = {}) {
  const noop = () => {};
  return {
    onSelectScenario: noop, onCompare: noop, onMonthChange: noop, onFilterChange: noop,
    onRecalculate: noop, onCloneScenario: noop, onRestoreBase: noop, onResetSample: noop,
    onAddFactory: noop, onAddProcess: noop, onAddSkill: noop, onAddWorker: noop, onAddShift: noop,
    onAddStopReason: noop, onAddRouting: noop, onAddEquipment: noop, onAddCapacityRule: noop,
    onDuplicateEquipment: noop, onToggleEquipment: noop, onToggleMaster: noop, onUpsertFactoryCalendar: noop,
    onUpsertEquipmentCalendar: noop, onUpsertWorkerCalendar: noop, onAddAssignment: noop, onAddOrder: noop,
    onPreviewImport: noop, onCommitImport: noop, onExport: noop, ...overrides
  };
}

export function registerDay29BrowserUiTests() {
  test("D29-UI-001", "月間設備Calendar・月間集計・Simulation結果を画面表示する", () => {
    const { fixture, view } = createFixture();
    const scenario = scenarioFromData(createMinimalData());
    const result = new RunScenarioSimulation().execute(scenario);
    view.render({ scenario, scenarios: [scenario], result, filters: {} });
    assertTrue(fixture.textContent.includes("Equipment 1"));
    assertTrue(fixture.textContent.includes("O1"));
    assertTrue(fixture.textContent.includes("稼働"));
  });

  test("D29-UI-002", "工場追加Formを画面操作で取得する", () => {
    const { fixture, view } = createFixture(); let received = null;
    view.bind(handlers({ onAddFactory: (data) => { received = data; } }));
    fixture.querySelector("#factoryForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assertEqual(received.factoryId, "F2");
  });

  test("D29-UI-003", "設備Calendar変更Formを画面操作で取得する", () => {
    const { fixture, view } = createFixture(); let received = null;
    view.bind(handlers({ onUpsertEquipmentCalendar: (data) => { received = data; } }));
    fixture.querySelector("#equipmentCalendarForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assertEqual(received.state, "BREAKDOWN");
  });

  test("D29-UI-004", "Assignment変更Formを画面操作で取得する", () => {
    const { fixture, view } = createFixture(); let received = null;
    view.bind(handlers({ onAddAssignment: (data) => { received = data; } }));
    fixture.querySelector("#assignmentForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assertEqual(received.roleSkillId, "OP");
  });

  test("D29-UI-005", "再計算Buttonを画面操作で呼び出す", () => {
    const { fixture, view } = createFixture(); let count = 0;
    view.bind(handlers({ onRecalculate: () => { count += 1; } }));
    fixture.querySelector("#recalculateButton").click();
    assertEqual(count, 1);
  });

  test("D29-UI-006", "Scenario複製Buttonを画面操作で呼び出す", () => {
    const { fixture, view } = createFixture(); let count = 0;
    view.bind(handlers({ onCloneScenario: () => { count += 1; } }));
    fixture.querySelector("#cloneScenarioButton").click();
    assertEqual(count, 1);
  });

  test("D29-UI-007", "月間Calendar Cellから日別詳細へ遷移する", () => {
    const { fixture, view } = createFixture(); let filters = null;
    view.bind(handlers({ onFilterChange: (value) => { filters = value; } }));
    const scenario = scenarioFromData(createMinimalData());
    const result = new RunScenarioSimulation().execute(scenario);
    view.render({ scenario, scenarios: [scenario], result, filters: {} });
    fixture.querySelector("[data-action='calendar-detail']").click();
    assertEqual(filters.selectedDetail.equipmentId, "E1");
  });

  test("D29-UI-008", "工場Calendar変更Formを画面操作で取得する", () => {
    const { fixture, view } = createFixture(); let received = null;
    view.bind(handlers({ onUpsertFactoryCalendar: (data) => { received = data; } }));
    fixture.querySelector("#factoryCalendarForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assertEqual(received.dayType, "OPERATING");
  });

  test("D29-UI-009", "Worker Master Formを画面操作で取得する", () => {
    const { fixture, view } = createFixture(); let received = null;
    view.bind(handlers({ onAddWorker: (data) => { received = data; } }));
    fixture.querySelector("#workerForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    assertEqual(received.workerId, "W2");
  });
}
