const REASON_LABELS = Object.freeze({
  OPERABLE: "稼働可能", PARTIAL_OPERATION: "一部稼働", FACTORY_HOLIDAY: "工場休日",
  SHIFT_NOT_PLANNED: "Shift未計画", EQUIPMENT_STOPPED: "設備停止", EQUIPMENT_NOT_USABLE: "設備使用不可",
  MISSING_REQUIRED_SKILL_SETTING: "必要Skill未設定", MISSING_CAPACITY_RULE: "能力Rule未設定",
  WORKER_COUNT_SHORTAGE: "人数不足", SKILL_SHORTAGE: "Skill不足", ASSIGNMENT_CONFLICT: "配置競合",
  UNASSIGNED: "未配置", OUTSIDE_WORKING_TIME: "勤務時間外", SKILL_EXPIRED: "Skill期限切れ",
  CROSS_FACTORY_ASSIGNMENT: "工場不一致", CAPACITY_CONSUMED: "Capacity消化済み", OVERLOAD: "過負荷"
});

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function number(value, digits = 1) { return Number(value ?? 0).toLocaleString("ja-JP", { maximumFractionDigits: digits }); }
function hours(minutes) { return `${number((minutes ?? 0) / 60, 1)}h`; }
function reason(code) { return REASON_LABELS[code] ?? code ?? "―"; }
function option(value, label, selected = false) { return `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(label)}</option>`; }

export class Day29View {
  constructor({ documentRoot = document } = {}) {
    this.document = documentRoot;
    this.elements = Object.fromEntries([
      "scenarioSelect", "compareScenarioSelect", "monthInput", "factoryFilter", "processFilter", "equipmentFilter",
      "statusMessage", "dashboardSummary", "factorySummary", "monthlyCalendar", "monthlySummary", "dailyDetail",
      "simulationSummary", "orderResults", "scenarioComparison", "validationSummary", "validationTable",
      "factoryTable", "processTable", "skillTable", "workerTable", "shiftTable", "stopReasonTable", "routingTable",
      "equipmentTable", "ruleTable", "factoryCalendarTable", "workerCalendarTable", "equipmentCalendarTable", "assignmentTable",
      "importPreview", "importText", "importType", "importFormat"
    ].map((id) => [id, this.document.querySelector(`#${id}`)]));
    this.selectedDetail = null;
  }

  bind(handlers) {
    const on = (id, event, handler) => this.document.querySelector(`#${id}`)?.addEventListener(event, handler);
    on("scenarioSelect", "change", (event) => handlers.onSelectScenario(event.target.value));
    on("compareScenarioSelect", "change", () => handlers.onCompare());
    on("monthInput", "change", (event) => handlers.onMonthChange(event.target.value));
    on("factoryFilter", "change", () => handlers.onFilterChange(this.getFilters()));
    on("processFilter", "change", () => handlers.onFilterChange(this.getFilters()));
    on("equipmentFilter", "change", () => handlers.onFilterChange(this.getFilters()));
    on("recalculateButton", "click", () => handlers.onRecalculate());
    on("cloneScenarioButton", "click", () => handlers.onCloneScenario());
    on("restoreBaseButton", "click", () => handlers.onRestoreBase());
    on("resetSampleButton", "click", () => handlers.onResetSample());
    on("factoryForm", "submit", (event) => { event.preventDefault(); handlers.onAddFactory(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("processForm", "submit", (event) => { event.preventDefault(); handlers.onAddProcess(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("skillForm", "submit", (event) => { event.preventDefault(); handlers.onAddSkill(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("workerForm", "submit", (event) => { event.preventDefault(); handlers.onAddWorker(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("shiftForm", "submit", (event) => { event.preventDefault(); handlers.onAddShift(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("stopReasonForm", "submit", (event) => { event.preventDefault(); handlers.onAddStopReason(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("routingForm", "submit", (event) => { event.preventDefault(); handlers.onAddRouting(Object.fromEntries(new FormData(event.target))); });
    on("equipmentForm", "submit", (event) => { event.preventDefault(); handlers.onAddEquipment(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("capacityRuleForm", "submit", (event) => { event.preventDefault(); handlers.onAddCapacityRule(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("factoryCalendarForm", "submit", (event) => { event.preventDefault(); handlers.onUpsertFactoryCalendar(Object.fromEntries(new FormData(event.target))); });
    on("equipmentCalendarForm", "submit", (event) => { event.preventDefault(); handlers.onUpsertEquipmentCalendar(Object.fromEntries(new FormData(event.target))); });
    on("workerCalendarForm", "submit", (event) => { event.preventDefault(); handlers.onUpsertWorkerCalendar(Object.fromEntries(new FormData(event.target))); });
    on("assignmentForm", "submit", (event) => { event.preventDefault(); handlers.onAddAssignment(Object.fromEntries(new FormData(event.target))); });
    on("orderForm", "submit", (event) => { event.preventDefault(); handlers.onAddOrder(Object.fromEntries(new FormData(event.target))); event.target.reset(); });
    on("previewImportButton", "click", () => handlers.onPreviewImport({ type: this.elements.importType.value, format: this.elements.importFormat.value, text: this.elements.importText.value }));
    on("commitImportButton", "click", () => handlers.onCommitImport());
    on("exportButton", "click", () => handlers.onExport({ type: this.elements.importType.value, format: this.elements.importFormat.value }));
    this.document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]");
      if (!action) return;
      const { action: name, id, date, equipmentId, collection, idKey } = action.dataset;
      if (name === "duplicate-equipment") handlers.onDuplicateEquipment(id);
      if (name === "toggle-equipment") handlers.onToggleEquipment(id);
      if (name === "toggle-master") handlers.onToggleMaster({ collection, idKey, id });
      if (name === "calendar-detail") { this.selectedDetail = { date, equipmentId }; handlers.onFilterChange(this.getFilters()); }
    });
  }

  getFilters() {
    return {
      factoryId: this.elements.factoryFilter?.value ?? "",
      processId: this.elements.processFilter?.value ?? "",
      equipmentId: this.elements.equipmentFilter?.value ?? "",
      selectedDetail: this.selectedDetail
    };
  }

  setStatus(message, type = "info") {
    if (!this.elements.statusMessage) return;
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.dataset.type = type;
  }

  renderScenarioOptions(scenarios, selectedScenarioId) {
    this.elements.scenarioSelect.innerHTML = scenarios.map((item) => option(item.scenarioId, item.name, item.scenarioId === selectedScenarioId)).join("");
    this.elements.compareScenarioSelect.innerHTML = scenarios.map((item) => option(item.scenarioId, item.name, item.scenarioId !== selectedScenarioId && item.scenarioId === this.elements.compareScenarioSelect.value)).join("");
  }

  render({ scenario, scenarios, result, comparison = null, importPreview = null, filters = {} }) {
    this.renderScenarioOptions(scenarios, scenario.scenarioId);
    this.elements.monthInput.value = scenario.month;
    this.populateFilters(scenario.data, filters);
    this.populateFormOptions(scenario.data);
    this.renderDashboard(result);
    this.renderMasters(scenario.data);
    this.renderCalendars(scenario.data);
    this.renderMonthlyCalendar(result.capacity, scenario.data, filters);
    this.renderMonthlySummary(result.capacity, scenario.data, filters);
    this.renderDailyDetail(result.capacity, scenario.data, filters.selectedDetail);
    this.renderSimulation(result.simulation);
    this.renderValidation(result.validation);
    this.renderComparison(comparison);
    this.renderImportPreview(importPreview);
  }

  populateFilters(data, filters) {
    const factories = data.factories ?? [];
    const processes = (data.processes ?? []).filter((item) => !filters.factoryId || item.factoryId === filters.factoryId);
    const equipment = (data.equipmentMasters ?? []).filter((item) => (!filters.factoryId || item.factoryId === filters.factoryId) && (!filters.processId || item.processId === filters.processId));
    this.elements.factoryFilter.innerHTML = option("", "全工場") + factories.map((item) => option(item.factoryId, item.name, item.factoryId === filters.factoryId)).join("");
    this.elements.processFilter.innerHTML = option("", "全工程") + processes.map((item) => option(item.processId, item.name, item.processId === filters.processId)).join("");
    this.elements.equipmentFilter.innerHTML = option("", "全設備") + equipment.map((item) => option(item.equipmentId, item.name, item.equipmentId === filters.equipmentId)).join("");
  }

  populateFormOptions(data) {
    const set = (selector, rows, valueKey, labelKey) => {
      for (const element of this.document.querySelectorAll(selector)) {
        const current = element.value;
        element.innerHTML = rows.map((item) => option(item[valueKey], item[labelKey] ?? item[valueKey], item[valueKey] === current)).join("");
      }
    };
    set("[data-options='factory']", data.factories ?? [], "factoryId", "name");
    set("[data-options='process']", data.processes ?? [], "processId", "name");
    set("[data-options='equipment']", data.equipmentMasters ?? [], "equipmentId", "name");
    set("[data-options='worker']", data.workers ?? [], "workerId", "name");
    set("[data-options='skill']", [{ skillId: "GENERAL", name: "GENERAL" }, ...(data.skills ?? [])], "skillId", "name");
    set("[data-options='shift']", data.shifts ?? [], "shiftId", "name");
    set("[data-options='routing']", data.routings ?? [], "routingId", "routingId");
  }

  renderDashboard(result) {
    const simulation = result.simulation;
    const capacity = result.capacity;
    const totalMinutes = capacity.monthlyResults.reduce((sum, item) => sum + item.availableMinutes, 0);
    const plannedMinutes = capacity.monthlyResults.reduce((sum, item) => sum + item.plannedMinutes, 0);
    this.elements.dashboardSummary.innerHTML = [
      ["月間利用可能時間", hours(totalMinutes)], ["設備稼働成立率", plannedMinutes === 0 ? "0%" : `${number(totalMinutes / plannedMinutes * 100, 1)}%`],
      ["達成可能数量", number(simulation.achievedQuantity, 1)], ["未処理数量", number(simulation.unprocessedQuantity, 1)],
      ["Bottleneck設備", simulation.bottleneckEquipmentId ?? "―"], ["Bottleneck工程", simulation.bottleneckProcessId ?? "―"],
      ["納期達成率", `${number(simulation.dueDateAchievementRate * 100, 1)}%`], ["整合性Issue", String(result.validation.issueCount)]
    ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
    this.elements.factorySummary.innerHTML = `<table><thead><tr><th>工場</th><th>設備数</th><th>利用可能時間</th><th>使用時間</th><th>残時間</th><th>同時成立率</th></tr></thead><tbody>${(capacity.factoryMonthlyResults ?? []).map((row) => `<tr><td>${escapeHtml(row.factoryId)}</td><td>${row.equipmentCount}</td><td>${hours(row.availableEquipmentMinutes)}</td><td>${hours(row.usedCapacityMinutes)}</td><td>${hours(row.remainingCapacityMinutes)}</td><td>${number(row.simultaneousOperatingRate * 100, 1)}%</td></tr>`).join("")}</tbody></table>`;
  }

  renderMasters(data) {
    const toggleButton = (collection, idKey, id) => `<button class="table-button secondary" data-action="toggle-master" data-collection="${collection}" data-id-key="${idKey}" data-id="${escapeHtml(id)}">有効/無効</button>`;
    this.elements.factoryTable.innerHTML = `<table><thead><tr><th>ID</th><th>工場名</th><th>標準日時間</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.factories ?? []).map((item) => `<tr><td>${escapeHtml(item.factoryId)}</td><td>${escapeHtml(item.name)}</td><td>${hours(item.standardDailyMinutes)}</td><td>${item.active === false ? "無効" : "有効"}</td><td>${toggleButton("factories", "factoryId", item.factoryId)}</td></tr>`).join("")}</tbody></table>`;
    this.elements.processTable.innerHTML = `<table><thead><tr><th>ID</th><th>工場</th><th>工程名</th><th>順序</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.processes ?? []).map((item) => `<tr><td>${escapeHtml(item.processId)}</td><td>${escapeHtml(item.factoryId)}</td><td>${escapeHtml(item.name)}</td><td>${item.sequence}</td><td>${item.active === false ? "無効" : "有効"}</td><td>${toggleButton("processes", "processId", item.processId)}</td></tr>`).join("")}</tbody></table>`;
    this.elements.skillTable.innerHTML = `<table><thead><tr><th>Skill ID</th><th>Skill名</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.skills ?? []).map((item) => `<tr><td>${escapeHtml(item.skillId)}</td><td>${escapeHtml(item.name)}</td><td>${item.active === false ? "無効" : "有効"}</td><td>${toggleButton("skills", "skillId", item.skillId)}</td></tr>`).join("")}</tbody></table>`;
    this.elements.workerTable.innerHTML = `<table><thead><tr><th>Worker ID</th><th>Worker名</th><th>所属工場</th><th>Skill</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.workers ?? []).map((item) => { const skills = (data.workerSkillQualifications ?? []).filter((q) => q.workerId === item.workerId).map((q) => q.skillId).join(", "); return `<tr><td>${escapeHtml(item.workerId)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.homeFactoryId)}</td><td>${escapeHtml(skills || "―")}</td><td>${item.active === false ? "無効" : "有効"}</td><td>${toggleButton("workers", "workerId", item.workerId)}</td></tr>`; }).join("")}</tbody></table>`;
    this.elements.shiftTable.innerHTML = `<table><thead><tr><th>Shift ID</th><th>工場</th><th>名称</th><th>時間</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.shifts ?? []).map((item) => `<tr><td>${escapeHtml(item.shiftId)}</td><td>${escapeHtml(item.factoryId)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.startTime)}–${escapeHtml(item.endTime)}</td><td>${item.active === false ? "無効" : "有効"}</td><td>${toggleButton("shifts", "shiftId", item.shiftId)}</td></tr>`).join("")}</tbody></table>`;
    this.elements.stopReasonTable.innerHTML = `<table><thead><tr><th>ID</th><th>停止理由</th><th>区分</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.stopReasons ?? []).map((item) => `<tr><td>${escapeHtml(item.stopReasonId)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.category)}</td><td>${item.active === false ? "無効" : "有効"}</td><td>${toggleButton("stopReasons", "stopReasonId", item.stopReasonId)}</td></tr>`).join("")}</tbody></table>`;
    this.elements.routingTable.innerHTML = `<table><thead><tr><th>Routing</th><th>Product Group</th><th>Operation</th><th>工程</th><th>順序</th><th>設備候補</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.routings ?? []).flatMap((routing) => (routing.operations ?? []).map((operation, index) => `<tr><td>${index === 0 ? escapeHtml(routing.routingId) : ""}</td><td>${index === 0 ? escapeHtml(routing.productGroup) : ""}</td><td>${escapeHtml(operation.operationId)}</td><td>${escapeHtml(operation.processId)}</td><td>${operation.sequence}</td><td>${escapeHtml(operation.eligibleEquipmentIds.join(", "))}</td><td>${routing.active === false ? "無効" : "有効"}</td><td>${index === 0 ? toggleButton("routings", "routingId", routing.routingId) : ""}</td></tr>`)).join("")}</tbody></table>`;
    this.elements.equipmentTable.innerHTML = `<table><thead><tr><th>ID</th><th>工場</th><th>工程</th><th>設備名</th><th>Priority</th><th>必要人数/Skill</th><th>状態</th><th>操作</th></tr></thead><tbody>${(data.equipmentMasters ?? []).map((item) => { const requirement = (data.equipmentRequirements ?? []).find((row) => row.equipmentId === item.equipmentId); const roles = requirement?.roleRequirements?.map((row) => `${row.skillId}:${row.requiredCount}`).join(", ") ?? "未設定"; return `<tr><td>${escapeHtml(item.equipmentId)}</td><td>${escapeHtml(item.factoryId)}</td><td>${escapeHtml(item.processId)}</td><td>${escapeHtml(item.name)}</td><td>${item.priority}</td><td>${requirement?.requiredWorkerCount ?? 0} / ${escapeHtml(roles)}</td><td>${item.active && item.usable ? "使用可能" : "無効"}</td><td><button class="table-button" data-action="duplicate-equipment" data-id="${escapeHtml(item.equipmentId)}">複製</button><button class="table-button secondary" data-action="toggle-equipment" data-id="${escapeHtml(item.equipmentId)}">有効/無効</button></td></tr>`; }).join("")}</tbody></table>`;
    this.elements.ruleTable.innerHTML = `<table><thead><tr><th>Rule ID</th><th>設備</th><th>能力</th><th>単位/基準</th><th>条件</th><th>Priority</th><th>Default</th></tr></thead><tbody>${(data.capacityRules ?? []).map((item) => `<tr><td>${escapeHtml(item.capacityRuleId)}</td><td>${escapeHtml(item.equipmentId)}</td><td>${number(item.capacityValue, 2)}</td><td>${escapeHtml(item.unit)}/${escapeHtml(item.basis)}</td><td><code>${escapeHtml(JSON.stringify(item.conditions ?? {}))}</code></td><td>${item.priority}</td><td>${item.isDefault ? "Yes" : ""}</td></tr>`).join("")}</tbody></table>`;
  }

  renderCalendars(data) {
    this.elements.factoryCalendarTable.innerHTML = `<table><thead><tr><th>日付</th><th>工場</th><th>区分</th><th>予定Shift</th><th>備考</th></tr></thead><tbody>${(data.factoryCalendar ?? []).slice(-100).map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.factoryId)}</td><td>${escapeHtml(item.dayType)}</td><td>${escapeHtml((item.plannedShiftIds ?? []).join(", ") || "―")}</td><td>${escapeHtml(item.note ?? "")}</td></tr>`).join("")}</tbody></table>`;
    this.elements.workerCalendarTable.innerHTML = `<table><thead><tr><th>日付</th><th>Shift</th><th>Worker</th><th>状態</th><th>配置工場</th><th>時間</th></tr></thead><tbody>${(data.workerCalendar ?? []).slice(-80).map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.shiftId)}</td><td>${escapeHtml(item.workerId)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.placementFactoryId)}</td><td>${item.startAt.slice(11,16)}–${item.endAt.slice(11,16)}</td></tr>`).join("")}</tbody></table>`;
    this.elements.equipmentCalendarTable.innerHTML = `<table><thead><tr><th>日付</th><th>Shift</th><th>設備</th><th>状態</th><th>倍率</th><th>理由</th></tr></thead><tbody>${(data.equipmentCalendar ?? []).slice(-100).map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.shiftId)}</td><td>${escapeHtml(item.equipmentId)}</td><td>${escapeHtml(item.state)}</td><td>${number(item.capacityMultiplier, 2)}</td><td>${escapeHtml(item.stopReasonId ?? "―")}</td></tr>`).join("")}</tbody></table>`;
    this.elements.assignmentTable.innerHTML = `<table><thead><tr><th>日付</th><th>Shift</th><th>設備</th><th>Worker</th><th>Role Skill</th><th>時間</th></tr></thead><tbody>${(data.assignments ?? []).slice(-100).map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.shiftId)}</td><td>${escapeHtml(item.equipmentId)}</td><td>${escapeHtml(item.workerId)}</td><td>${escapeHtml(item.roleSkillId)}</td><td>${item.startAt.slice(11,16)}–${item.endAt.slice(11,16)}</td></tr>`).join("")}</tbody></table>`;
  }

  filteredEquipment(data, filters) {
    return (data.equipmentMasters ?? []).filter((item) => (!filters.factoryId || item.factoryId === filters.factoryId) && (!filters.processId || item.processId === filters.processId) && (!filters.equipmentId || item.equipmentId === filters.equipmentId));
  }

  renderMonthlyCalendar(capacity, data, filters) {
    const equipment = this.filteredEquipment(data, filters);
    const dates = [...new Set(capacity.dailyResults.map((item) => item.date))].sort();
    const map = new Map(capacity.dailyResults.map((item) => [`${item.equipmentId}|${item.date}`, item]));
    this.elements.monthlyCalendar.innerHTML = `<div class="calendar-scroll"><table class="calendar-table"><thead><tr><th class="sticky-col">設備</th>${dates.map((date) => `<th>${Number(date.slice(-2))}</th>`).join("")}<th>日数換算</th><th>月間Capacity</th></tr></thead><tbody>${equipment.map((item) => {
      const monthly = capacity.monthlyResults.find((row) => row.equipmentId === item.equipmentId);
      return `<tr><th class="sticky-col">${escapeHtml(item.name)}</th>${dates.map((date) => { const row = map.get(`${item.equipmentId}|${date}`); const state = row?.dailyState ?? "NONE"; const text = state === "FULL" ? "稼働" : state === "PARTIAL" ? "0.5" : reason(row?.reasonCode).slice(0, 2); return `<td><button class="calendar-cell state-${state.toLowerCase()}" data-action="calendar-detail" data-date="${date}" data-equipment-id="${escapeHtml(item.equipmentId)}" title="${escapeHtml(reason(row?.reasonCode))}">${escapeHtml(text)}</button></td>`; }).join("")}<td>${number(monthly?.operatingDayEquivalent, 2)}</td><td>${number(monthly?.availableCapacity, 1)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  renderMonthlySummary(capacity, data, filters) {
    const ids = new Set(this.filteredEquipment(data, filters).map((item) => item.equipmentId));
    this.elements.monthlySummary.innerHTML = `<table><thead><tr><th>設備</th><th>予定日</th><th>成立日</th><th>予定Shift</th><th>成立Shift</th><th>利用可能時間</th><th>日数換算</th><th>利用可能Capacity</th><th>使用Capacity</th><th>残Capacity</th><th>未処理</th><th>人数不足</th><th>Skill不足</th><th>競合</th><th>停止</th><th>成立率</th></tr></thead><tbody>${capacity.monthlyResults.filter((item) => ids.has(item.equipmentId)).map((item) => `<tr><td>${escapeHtml(item.equipmentId)}</td><td>${item.plannedOperatingDays}</td><td>${item.atLeastOneRunningDays}</td><td>${item.plannedShiftCount}</td><td>${item.availableShiftCount}</td><td>${hours(item.availableMinutes)}</td><td>${number(item.operatingDayEquivalent, 2)}</td><td>${number(item.availableCapacity, 1)}</td><td>${number(item.usedCapacity, 1)}</td><td>${number(item.remainingCapacity, 1)}</td><td>${number(item.unprocessedQuantity, 1)}</td><td>${item.workerShortageShiftCount}</td><td>${item.skillShortageShiftCount}</td><td>${item.assignmentConflictShiftCount}</td><td>${item.equipmentStopShiftCount}</td><td>${number(item.operatingSuccessRate * 100, 1)}%</td></tr>`).join("")}</tbody></table>`;
  }

  renderDailyDetail(capacity, data, selectedDetail) {
    const fallback = capacity.dailyResults.find((item) => item.availableMinutes < item.plannedMinutes) ?? capacity.dailyResults[0];
    const detail = selectedDetail ?? (fallback ? { date: fallback.date, equipmentId: fallback.equipmentId } : null);
    if (!detail) { this.elements.dailyDetail.innerHTML = "<p>詳細なし</p>"; return; }
    const daily = capacity.dailyResults.find((item) => item.date === detail.date && item.equipmentId === detail.equipmentId);
    const shifts = capacity.shiftResults.filter((item) => item.date === detail.date && item.equipmentId === detail.equipmentId);
    const equipment = (data.equipmentMasters ?? []).find((item) => item.equipmentId === detail.equipmentId);
    this.elements.dailyDetail.innerHTML = `<h3>${escapeHtml(equipment?.name ?? detail.equipmentId)} / ${detail.date}</h3><div class="summary-grid compact"><div><span>日別判定</span><strong>${escapeHtml(daily?.dailyState ?? "NONE")}</strong></div><div><span>利用可能時間</span><strong>${hours(daily?.availableMinutes)}</strong></div><div><span>日数換算</span><strong>${number(daily?.operatingDayEquivalent, 2)}</strong></div><div><span>主理由</span><strong>${escapeHtml(reason(daily?.reasonCode))}</strong></div></div><table><thead><tr><th>Shift</th><th>判定</th><th>予定時間</th><th>成立時間</th><th>Rule</th><th>倍率</th><th>Capacity</th><th>使用</th><th>残</th><th>理由</th><th>Worker</th></tr></thead><tbody>${shifts.map((item) => `<tr><td>${escapeHtml(item.shiftId)}</td><td>${escapeHtml(item.state)}</td><td>${hours(item.plannedMinutes)}</td><td>${hours(item.availableMinutes)}</td><td>${escapeHtml(item.appliedCapacityRuleId ?? "―")}</td><td>${number(item.capacityMultiplier, 2)}</td><td>${number(item.availableCapacity, 1)}</td><td>${number(item.usedCapacity, 1)}</td><td>${number(item.remainingCapacity, 1)}</td><td>${escapeHtml(reason(item.reasonCode))}</td><td>${escapeHtml([...new Set(item.allocations.map((a) => a.workerId))].join(", ") || "―")}</td></tr>`).join("")}</tbody></table>`;
  }

  renderSimulation(simulation) {
    this.elements.simulationSummary.innerHTML = `<div class="summary-grid compact"><div><span>達成量</span><strong>${number(simulation.achievedQuantity, 1)}</strong></div><div><span>未処理量</span><strong>${number(simulation.unprocessedQuantity, 1)}</strong></div><div><span>使用時間</span><strong>${hours(simulation.usedCapacityMinutes)}</strong></div><div><span>残時間</span><strong>${hours(simulation.remainingCapacityMinutes)}</strong></div><div><span>Bottleneck設備</span><strong>${escapeHtml(simulation.bottleneckEquipmentId ?? "―")}</strong></div><div><span>主制約</span><strong>${escapeHtml(reason(simulation.primaryConstraintReason))}</strong></div></div>`;
    this.elements.orderResults.innerHTML = `<table><thead><tr><th>Order</th><th>必要量</th><th>達成量</th><th>未処理</th><th>納期</th><th>完了見込み</th><th>納期内</th><th>理由</th></tr></thead><tbody>${simulation.orderResults.map((item) => `<tr><td>${escapeHtml(item.orderId)}</td><td>${number(item.requiredQuantity, 1)}</td><td>${number(item.achievedQuantity, 1)}</td><td>${number(item.unprocessedQuantity, 1)}</td><td>${item.dueDate}</td><td>${escapeHtml(item.completionAt ?? "―")}</td><td>${item.dueDateMet ? "達成" : "未達"}</td><td>${escapeHtml(reason(item.reasonCode))}</td></tr>`).join("")}</tbody></table>`;
  }

  renderValidation(validation) {
    this.elements.validationSummary.innerHTML = `<strong>${validation.errorCount} Error / ${validation.warningCount} Warning</strong>`;
    this.elements.validationTable.innerHTML = `<table><thead><tr><th>Severity</th><th>Code</th><th>対象</th><th>日付</th><th>Shift</th><th>原因</th><th>修正候補</th></tr></thead><tbody>${validation.issues.slice(0, 200).map((item) => `<tr><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.targetType)}:${escapeHtml(item.targetId)}</td><td>${escapeHtml(item.date ?? "―")}</td><td>${escapeHtml(item.shiftId ?? "―")}</td><td>${escapeHtml(item.message)}</td><td>${escapeHtml(item.suggestion)}</td></tr>`).join("")}</tbody></table>`;
  }

  renderComparison(comparison) {
    if (!comparison) { this.elements.scenarioComparison.innerHTML = "<p>比較対象Scenarioを選択してください。</p>"; return; }
    this.elements.scenarioComparison.innerHTML = `<div class="summary-grid compact"><div><span>達成量差</span><strong>${number(comparison.achievedQuantity, 1)}</strong></div><div><span>未処理量差</span><strong>${number(comparison.unprocessedQuantity, 1)}</strong></div><div><span>Bottleneck変更</span><strong>${comparison.bottleneckChanged ? "あり" : "なし"}</strong></div><div><span>比較</span><strong>${escapeHtml(comparison.baseScenarioId)} → ${escapeHtml(comparison.targetScenarioId)}</strong></div></div><table><thead><tr><th>設備</th><th>日数換算差</th><th>時間差</th><th>Capacity差</th><th>人数不足Shift差</th><th>Skill不足Shift差</th><th>競合Shift差</th></tr></thead><tbody>${comparison.equipmentDiffs.map((item) => `<tr><td>${escapeHtml(item.equipmentId)}</td><td>${number(item.operatingDayEquivalent, 2)}</td><td>${hours(item.availableMinutes)}</td><td>${number(item.availableCapacity, 1)}</td><td>${item.workerShortageShiftCount}</td><td>${item.skillShortageShiftCount}</td><td>${item.assignmentConflictShiftCount}</td></tr>`).join("")}</tbody></table>`;
  }

  renderImportPreview(preview) {
    if (!preview) { this.elements.importPreview.innerHTML = "<p>Import Fileを読み込む前にPreviewします。</p>"; return; }
    this.elements.importPreview.innerHTML = `<p><strong>追加 ${preview.addCount} / 更新 ${preview.updateCount} / 重複 ${preview.duplicateCount} / Error ${preview.errorCount}</strong></p><table><thead><tr><th>行</th><th>Status</th><th>ID</th><th>Error</th></tr></thead><tbody>${preview.results.map((item) => `<tr><td>${item.rowNumber ?? "―"}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.errors.join(" / "))}</td></tr>`).join("")}</tbody></table>`;
  }

  download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  }
}
