import { CAPACITY_UNITS } from "./Day29Constants.js";
import { CompareSimulationScenarios } from "./CompareSimulationScenarios.js";
import { CsvDataAdapter } from "./CsvDataAdapter.js";
import { JsonDataAdapter } from "./JsonDataAdapter.js";
import { PreviewMasterImport } from "./PreviewMasterImport.js";
import { RunScenarioSimulation } from "./RunScenarioSimulation.js";
import { ScenarioManagementService } from "./ScenarioManagementService.js";
import { SimulationScenario } from "./SimulationScenario.js";

function upsertById(rows, idKey, next) {
  const index = rows.findIndex((item) => item[idKey] === next[idKey]);
  if (index >= 0) rows[index] = { ...rows[index], ...next };
  else rows.push(next);
  return index >= 0 ? "更新" : "追加";
}

function splitIds(value) {
  return String(value ?? "")
    .split(/[、,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export class Day29Controller {
  constructor({
    repository,
    view,
    sampleScenarioFactory,
    runScenarioSimulation = new RunScenarioSimulation(),
    compareSimulationScenarios = new CompareSimulationScenarios(),
    previewMasterImport = new PreviewMasterImport(),
    csvAdapter = new CsvDataAdapter(),
    jsonAdapter = new JsonDataAdapter()
  }) {
    this.repository = repository;
    this.scenarioService = new ScenarioManagementService({ repository });
    this.view = view;
    this.sampleScenarioFactory = sampleScenarioFactory;
    this.runScenarioSimulation = runScenarioSimulation;
    this.compareSimulationScenarios = compareSimulationScenarios;
    this.previewMasterImport = previewMasterImport;
    this.csvAdapter = csvAdapter;
    this.jsonAdapter = jsonAdapter;
    this.selectedScenarioId = null;
    this.filters = {};
    this.currentResult = null;
    this.currentComparison = null;
    this.currentImportPreview = null;
  }

  async initialize() {
    await this.seedIfEmpty();
    const scenarios = await this.scenarioService.list();
    this.selectedScenarioId = scenarios[0]?.scenarioId ?? null;
    this.view.bind({
      onSelectScenario: (id) => this.selectScenario(id),
      onCompare: () => this.compare(),
      onMonthChange: (month) => this.changeMonth(month),
      onFilterChange: (filters) => this.filter(filters),
      onRecalculate: () => this.recalculate(),
      onCloneScenario: () => this.cloneScenario(),
      onRestoreBase: () => this.restoreBase(),
      onResetSample: () => this.resetSample(),
      onAddFactory: (data) => this.addFactory(data),
      onAddProcess: (data) => this.addProcess(data),
      onAddSkill: (data) => this.addSkill(data),
      onAddWorker: (data) => this.addWorker(data),
      onAddShift: (data) => this.addShift(data),
      onAddStopReason: (data) => this.addStopReason(data),
      onAddRouting: (data) => this.addRouting(data),
      onAddEquipment: (data) => this.addEquipment(data),
      onAddCapacityRule: (data) => this.addCapacityRule(data),
      onDuplicateEquipment: (id) => this.duplicateEquipment(id),
      onToggleEquipment: (id) => this.toggleEquipment(id),
      onToggleMaster: (input) => this.toggleMaster(input),
      onUpsertFactoryCalendar: (data) => this.upsertFactoryCalendar(data),
      onUpsertEquipmentCalendar: (data) => this.upsertEquipmentCalendar(data),
      onUpsertWorkerCalendar: (data) => this.upsertWorkerCalendar(data),
      onAddAssignment: (data) => this.addAssignment(data),
      onAddOrder: (data) => this.addOrder(data),
      onPreviewImport: (input) => this.previewImport(input),
      onCommitImport: () => this.commitImport(),
      onExport: (input) => this.exportData(input)
    });
    await this.recalculate();
  }

  async seedIfEmpty() {
    if ((await this.scenarioService.list()).length > 0) return;
    for (const scenario of this.sampleScenarioFactory()) {
      await this.scenarioService.save(new SimulationScenario(scenario));
    }
  }

  async currentScenario() {
    return this.scenarioService.get(this.selectedScenarioId);
  }

  async saveData(data, message = "保存しました。") {
    const scenario = await this.currentScenario();
    await this.scenarioService.replaceData({ scenarioId: scenario.scenarioId, data });
    this.view.setStatus(message, "success");
    await this.recalculate();
  }

  async recalculate() {
    try {
      const scenario = await this.currentScenario();
      if (!scenario) return;
      this.currentResult = this.runScenarioSimulation.execute(scenario);
      const scenarios = await this.scenarioService.list();
      this.view.render({
        scenario,
        scenarios,
        result: this.currentResult,
        comparison: this.currentComparison,
        importPreview: this.currentImportPreview,
        filters: this.filters
      });
      this.view.setStatus(`再計算完了：${scenario.name}`, "success");
    } catch (error) {
      this.view.setStatus(`${error.code ?? "ERROR"}: ${error.message}`, "error");
      console.error(error);
    }
  }

  async selectScenario(id) {
    this.selectedScenarioId = id;
    this.currentComparison = null;
    this.currentImportPreview = null;
    await this.recalculate();
  }

  async filter(filters) {
    this.filters = filters;
    await this.recalculate();
  }

  async changeMonth(month) {
    const scenario = await this.currentScenario();
    await this.scenarioService.save(new SimulationScenario({ ...scenario, month }));
    await this.recalculate();
  }

  async cloneScenario() {
    const id = `SCENARIO_${Date.now()}`;
    await this.scenarioService.clone({
      sourceScenarioId: this.selectedScenarioId,
      scenarioId: id,
      name: `複製 ${new Date().toLocaleString("ja-JP")}`
    });
    this.selectedScenarioId = id;
    await this.recalculate();
  }

  async restoreBase() {
    const scenario = await this.currentScenario();
    if (!scenario.baseScenarioId) {
      this.view.setStatus("Base Scenario自身です。", "info");
      return;
    }
    const base = await this.scenarioService.get(scenario.baseScenarioId);
    await this.scenarioService.save(new SimulationScenario({ ...scenario, data: structuredClone(base.data) }));
    await this.recalculate();
  }

  async resetSample() {
    await this.repository.clear();
    await this.seedIfEmpty();
    this.selectedScenarioId = (await this.scenarioService.list())[0].scenarioId;
    this.currentComparison = null;
    await this.recalculate();
  }

  async compare() {
    const targetId = this.view.elements.compareScenarioSelect.value;
    if (!targetId || targetId === this.selectedScenarioId) {
      this.currentComparison = null;
      await this.recalculate();
      return;
    }
    const targetScenario = await this.scenarioService.get(targetId);
    const target = this.runScenarioSimulation.execute(targetScenario);
    this.currentComparison = this.compareSimulationScenarios.execute({ base: this.currentResult, target });
    await this.recalculate();
  }

  async addFactory(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const mode = upsertById(data.factories, "factoryId", {
      factoryId: form.factoryId,
      name: form.factoryName,
      displayOrder: Number(form.displayOrder || data.factories.length + 1),
      active: form.active !== "off",
      standardDailyMinutes: Number(form.standardDailyMinutes),
      note: form.note ?? ""
    });
    await this.saveData(data, `工場 ${form.factoryId} を${mode}しました。`);
  }

  async addProcess(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const mode = upsertById(data.processes, "processId", {
      processId: form.processId,
      factoryId: form.factoryId,
      name: form.processName,
      sequence: Number(form.sequence),
      active: form.active !== "off",
      note: form.note ?? ""
    });
    await this.saveData(data, `工程 ${form.processId} を${mode}しました。`);
  }

  async addSkill(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.skills ??= [];
    const mode = upsertById(data.skills, "skillId", {
      skillId: form.skillId,
      name: form.skillName,
      active: form.active !== "off",
      note: form.note ?? ""
    });
    await this.saveData(data, `Skill ${form.skillId} を${mode}しました。`);
  }

  async addWorker(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.workers ??= [];
    data.workerSkillQualifications ??= [];
    const mode = upsertById(data.workers, "workerId", {
      workerId: form.workerId,
      name: form.workerName,
      homeFactoryId: form.homeFactoryId,
      active: form.active !== "off",
      note: form.note ?? ""
    });
    if (form.skillId) {
      const next = {
        workerId: form.workerId,
        skillId: form.skillId,
        effectivePeriod: {
          startDate: form.qualificationStartDate || "2026-01-01",
          endDate: form.qualificationEndDate || "2099-12-31"
        }
      };
      const index = data.workerSkillQualifications.findIndex(
        (item) => item.workerId === next.workerId && item.skillId === next.skillId
      );
      if (index >= 0) data.workerSkillQualifications[index] = next;
      else data.workerSkillQualifications.push(next);
    }
    await this.saveData(data, `Worker ${form.workerId} を${mode}しました。`);
  }

  async addShift(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.shifts ??= [];
    const mode = upsertById(data.shifts, "shiftId", {
      shiftId: form.shiftId,
      factoryId: form.factoryId,
      name: form.shiftName,
      startTime: form.startTime,
      endTime: form.endTime,
      displayOrder: Number(form.displayOrder || 1),
      active: form.active !== "off"
    });
    await this.saveData(data, `Shift ${form.shiftId} を${mode}しました。`);
  }

  async addStopReason(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.stopReasons ??= [];
    const mode = upsertById(data.stopReasons, "stopReasonId", {
      stopReasonId: form.stopReasonId,
      name: form.stopReasonName,
      category: form.category || "OTHER",
      active: form.active !== "off",
      note: form.note ?? ""
    });
    await this.saveData(data, `停止理由 ${form.stopReasonId} を${mode}しました。`);
  }

  async addRouting(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.routings ??= [];
    let routing = data.routings.find((item) => item.routingId === form.routingId);
    const isNew = !routing;
    if (!routing) {
      routing = { routingId: form.routingId, productGroup: form.productGroup, operations: [], active: true };
      data.routings.push(routing);
    }
    routing.productGroup = form.productGroup;
    routing.active = form.active !== "off";
    const operation = {
      operationId: form.operationId,
      processId: form.processId,
      sequence: Number(form.sequence),
      eligibleEquipmentIds: splitIds(form.eligibleEquipmentIds)
    };
    const index = routing.operations.findIndex((item) => item.operationId === operation.operationId);
    if (index >= 0) routing.operations[index] = operation;
    else routing.operations.push(operation);
    routing.operations.sort((a, b) => a.sequence - b.sequence || a.operationId.localeCompare(b.operationId));
    await this.saveData(data, `Routing ${form.routingId} を${isNew ? "追加" : "更新"}しました。`);
  }

  async addEquipment(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.equipmentMasters ??= [];
    data.equipmentRequirements ??= [];
    const existing = data.equipmentMasters.find((item) => item.equipmentId === form.equipmentId);
    const mode = upsertById(data.equipmentMasters, "equipmentId", {
      equipmentId: form.equipmentId,
      factoryId: form.factoryId,
      processId: form.processId,
      name: form.equipmentName,
      equipmentType: form.equipmentType || "GENERAL",
      priority: Number(form.priority),
      planningTarget: true,
      usable: existing?.usable ?? true,
      defaultCapacityRuleId: existing?.defaultCapacityRuleId ?? null,
      capacityUnit: existing?.capacityUnit ?? CAPACITY_UNITS.PIECE,
      displayOrder: existing?.displayOrder ?? data.equipmentMasters.length + 1,
      effectivePeriod: {
        startDate: form.startDate || "2026-01-01",
        endDate: form.endDate || "2099-12-31"
      },
      active: existing?.active ?? true,
      note: form.note ?? ""
    });
    upsertById(data.equipmentRequirements, "equipmentId", {
      equipmentId: form.equipmentId,
      requiredWorkerCount: Number(form.requiredWorkerCount || 1),
      roleRequirements: [{
        skillId: form.skillId || data.skills[0]?.skillId || "GENERAL",
        requiredCount: Number(form.requiredWorkerCount || 1)
      }]
    });
    await this.saveData(data, `設備 ${form.equipmentId} を${mode}しました。`);
  }

  async duplicateEquipment(id) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const source = data.equipmentMasters.find((item) => item.equipmentId === id);
    if (!source) {
      this.view.setStatus(`Equipment ${id} が見つかりません。`, "error");
      return;
    }
    let suffix = 1;
    let newId = `${id}_COPY`;
    while (data.equipmentMasters.some((item) => item.equipmentId === newId)) {
      newId = `${id}_COPY_${suffix++}`;
    }
    const ruleMap = new Map();
    for (const rule of data.capacityRules.filter((item) => item.equipmentId === id)) {
      const newRuleId = `${newId}_${rule.capacityRuleId}`;
      ruleMap.set(rule.capacityRuleId, newRuleId);
      data.capacityRules.push({ ...structuredClone(rule), capacityRuleId: newRuleId, equipmentId: newId });
    }
    data.equipmentMasters.push({
      ...structuredClone(source),
      equipmentId: newId,
      name: `${source.name} 複製`,
      defaultCapacityRuleId: ruleMap.get(source.defaultCapacityRuleId) ?? null,
      displayOrder: data.equipmentMasters.length + 1
    });
    const requirement = data.equipmentRequirements.find((item) => item.equipmentId === id);
    if (requirement) data.equipmentRequirements.push({ ...structuredClone(requirement), equipmentId: newId });
    await this.saveData(data, `設備を ${newId} として複製しました。`);
  }

  async toggleEquipment(id) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const item = data.equipmentMasters.find((row) => row.equipmentId === id);
    if (!item) return;
    item.active = !item.active;
    item.usable = item.active;
    await this.saveData(data, `${id} を${item.active ? "有効" : "無効"}にしました。`);
  }

  async toggleMaster({ collection, idKey, id }) {
    const allowed = new Set(["factories", "processes", "workers", "skills", "shifts", "stopReasons", "routings"]);
    if (!allowed.has(collection)) return;
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const item = (data[collection] ?? []).find((row) => row[idKey] === id);
    if (!item) return;
    item.active = item.active === false;
    await this.saveData(data, `${id} を${item.active ? "有効" : "無効"}にしました。`);
  }

  async addCapacityRule(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const isDefault = form.isDefault === "on";
    const mode = upsertById(data.capacityRules, "capacityRuleId", {
      capacityRuleId: form.capacityRuleId,
      equipmentId: form.equipmentId,
      capacityValue: Number(form.capacityValue),
      unit: form.unit,
      basis: form.basis,
      effectivePeriod: {
        startDate: form.startDate || "2026-01-01",
        endDate: form.endDate || "2099-12-31"
      },
      priority: Number(form.priority),
      active: true,
      conditions: form.productGroup ? { productGroup: form.productGroup } : {},
      capacityMultiplier: Number(form.capacityMultiplier || 1),
      isDefault
    });
    if (isDefault) {
      const equipment = data.equipmentMasters.find((item) => item.equipmentId === form.equipmentId);
      if (equipment) equipment.defaultCapacityRuleId = form.capacityRuleId;
    }
    await this.saveData(data, `Capacity Rule ${form.capacityRuleId} を${mode}しました。`);
  }

  async upsertFactoryCalendar(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    data.factoryCalendar ??= [];
    const next = {
      factoryId: form.factoryId,
      date: form.date,
      dayType: form.dayType,
      plannedShiftIds: splitIds(form.plannedShiftIds),
      note: form.note ?? ""
    };
    const index = data.factoryCalendar.findIndex(
      (item) => item.factoryId === next.factoryId && item.date === next.date
    );
    if (index >= 0) data.factoryCalendar[index] = next;
    else data.factoryCalendar.push(next);
    await this.saveData(data, "工場Calendarを更新しました。");
  }

  async upsertEquipmentCalendar(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const next = {
      equipmentId: form.equipmentId,
      date: form.date,
      shiftId: form.shiftId,
      state: form.state,
      capacityMultiplier: Number(form.capacityMultiplier),
      stopReasonId: form.stopReasonId || null,
      note: form.note ?? ""
    };
    const index = data.equipmentCalendar.findIndex(
      (item) => item.equipmentId === next.equipmentId && item.date === next.date && item.shiftId === next.shiftId
    );
    if (index >= 0) data.equipmentCalendar[index] = next;
    else data.equipmentCalendar.push(next);
    await this.saveData(data, "設備Calendarを更新しました。");
  }

  async upsertWorkerCalendar(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const next = {
      workerId: form.workerId,
      date: form.date,
      shiftId: form.shiftId,
      status: form.status,
      placementFactoryId: form.placementFactoryId,
      startAt: `${form.date}T${form.startTime}:00`,
      endAt: `${form.date}T${form.endTime}:00`,
      note: form.note ?? ""
    };
    const index = data.workerCalendar.findIndex(
      (item) => item.workerId === next.workerId && item.date === next.date && item.shiftId === next.shiftId
    );
    if (index >= 0) data.workerCalendar[index] = next;
    else data.workerCalendar.push(next);
    await this.saveData(data, "Worker勤務Calendarを更新しました。");
  }

  async addAssignment(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const next = {
      assignmentId: form.assignmentId || `${form.date}_${form.shiftId}_${form.workerId}_${form.equipmentId}_${Date.now()}`,
      date: form.date,
      shiftId: form.shiftId,
      factoryId: form.factoryId,
      equipmentId: form.equipmentId,
      workerId: form.workerId,
      roleSkillId: form.roleSkillId,
      startAt: `${form.date}T${form.startTime}:00`,
      endAt: `${form.date}T${form.endTime}:00`
    };
    upsertById(data.assignments, "assignmentId", next);
    await this.saveData(data, "Assignmentを追加／更新しました。");
  }

  async addOrder(form) {
    const scenario = await this.currentScenario();
    const data = structuredClone(scenario.data);
    const routing = data.routings.find((item) => item.routingId === form.routingId);
    const next = {
      orderId: form.orderId,
      productId: form.productId || null,
      productGroup: routing?.productGroup ?? form.productGroup,
      requiredQuantity: Number(form.requiredQuantity),
      unit: form.unit,
      dueDate: form.dueDate,
      priority: Number(form.priority),
      routingId: form.routingId,
      initialWip: Number(form.initialWip || 0),
      scenarioId: scenario.scenarioId,
      attributes: { productGroup: routing?.productGroup ?? form.productGroup }
    };
    const mode = upsertById(data.orders, "orderId", next);
    await this.saveData(data, `Order ${form.orderId} を${mode}しました。`);
  }

  async previewImport({ type, format, text }) {
    try {
      const adapter = format === "CSV" ? this.csvAdapter : this.jsonAdapter;
      const rows = adapter.parse(text);
      const scenario = await this.currentScenario();
      this.currentImportPreview = this.previewMasterImport.execute({ type, rows, currentData: scenario.data });
      await this.recalculate();
    } catch (error) {
      this.view.setStatus(error.message, "error");
    }
  }

  async commitImport() {
    if (!this.currentImportPreview) return;
    const scenario = await this.currentScenario();
    const data = this.previewMasterImport.commit({ preview: this.currentImportPreview, currentData: scenario.data });
    this.currentImportPreview = null;
    await this.saveData(data, "ImportをCommitしました。");
  }

  async exportData({ type, format }) {
    const scenario = await this.currentScenario();
    const rows = scenario.data[type] ?? [];
    const adapter = format === "CSV" ? this.csvAdapter : this.jsonAdapter;
    const content = adapter.stringify(rows);
    this.view.download(
      `${type}.${format.toLowerCase()}`,
      content,
      format === "CSV" ? "text/csv;charset=utf-8" : "application/json"
    );
  }
}
