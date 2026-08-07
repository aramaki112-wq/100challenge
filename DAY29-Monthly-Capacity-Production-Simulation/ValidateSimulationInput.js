import { ValidationIssue } from "./ValidationIssue.js";
import { EffectivePeriod } from "./EffectivePeriod.js";
import { VALID_CAPACITY_BASES, VALID_CAPACITY_UNITS } from "./Day29Constants.js";
import { overlaps } from "./Day29DateTime.js";

function issue(values) { return new ValidationIssue(values).toPlainObject(); }
function duplicates(items, keyBuilder) {
  const seen = new Set(); const result = [];
  for (const item of items) { const key = keyBuilder(item); if (seen.has(key)) result.push(item); else seen.add(key); }
  return result;
}

export class ValidateSimulationInput {
  execute(data) {
    const issues = [];
    const factoryIds = new Set((data.factories ?? []).map((item) => item.factoryId));
    const processIds = new Set((data.processes ?? []).map((item) => item.processId));
    const equipmentIds = new Set((data.equipmentMasters ?? []).map((item) => item.equipmentId));
    const workerIds = new Set((data.workers ?? []).map((item) => item.workerId));
    const skillIds = new Set((data.skills ?? []).map((item) => item.skillId));
    const shiftIds = new Set((data.shifts ?? []).map((item) => item.shiftId));
    const routingIds = new Set((data.routings ?? []).map((item) => item.routingId));
    const equipmentById = new Map((data.equipmentMasters ?? []).map((item) => [item.equipmentId, item]));
    const workerCalendar = data.workerCalendar ?? [];
    const qualifications = data.workerSkillQualifications ?? [];

    for (const process of data.processes ?? []) if (!factoryIds.has(process.factoryId)) issues.push(issue({ code: "FACTORY_NOT_FOUND", targetType: "Process", targetId: process.processId, message: `Factory ${process.factoryId} does not exist.`, suggestion: "Factory IDを修正するかFactory Masterへ追加してください。" }));
    for (const equipment of data.equipmentMasters ?? []) {
      if (!factoryIds.has(equipment.factoryId)) issues.push(issue({ code: "FACTORY_NOT_FOUND", targetType: "Equipment", targetId: equipment.equipmentId, message: `Factory ${equipment.factoryId} does not exist.`, suggestion: "Factory IDを修正してください。" }));
      if (!processIds.has(equipment.processId)) issues.push(issue({ code: "PROCESS_NOT_FOUND", targetType: "Equipment", targetId: equipment.equipmentId, message: `Process ${equipment.processId} does not exist.`, suggestion: "Process Masterを登録してください。" }));
    }
    for (const requirement of data.equipmentRequirements ?? []) {
      if (!equipmentIds.has(requirement.equipmentId)) issues.push(issue({ code: "EQUIPMENT_NOT_FOUND", targetType: "EquipmentRequirement", targetId: requirement.equipmentId, message: "Equipment ID does not exist.", suggestion: "Equipment Masterを登録してください。" }));
      for (const role of requirement.roleRequirements ?? []) if (!skillIds.has(role.skillId)) issues.push(issue({ code: "SKILL_NOT_FOUND", targetType: "EquipmentRequirement", targetId: requirement.equipmentId, message: `Skill ${role.skillId} does not exist.`, suggestion: "Skill Masterを登録してください。" }));
    }
    for (const equipment of data.equipmentMasters ?? []) {
      if (!(data.equipmentRequirements ?? []).some((item) => item.equipmentId === equipment.equipmentId)) issues.push(issue({ severity: "WARNING", code: "REQUIRED_SKILL_NOT_SET", targetType: "Equipment", targetId: equipment.equipmentId, message: "Equipment requirement is not set.", suggestion: "必要人数とRole Skillを登録してください。" }));
      if (!(data.capacityRules ?? []).some((item) => item.equipmentId === equipment.equipmentId && item.active !== false)) issues.push(issue({ severity: "WARNING", code: "CAPACITY_RULE_NOT_SET", targetType: "Equipment", targetId: equipment.equipmentId, message: "Capacity Rule is not set.", suggestion: "Default Capacity Ruleを登録してください。" }));
    }
    for (const rule of data.capacityRules ?? []) {
      if (!equipmentIds.has(rule.equipmentId)) issues.push(issue({ code: "EQUIPMENT_NOT_FOUND", targetType: "CapacityRule", targetId: rule.capacityRuleId, message: `Equipment ${rule.equipmentId} does not exist.`, suggestion: "Equipment IDを修正してください。" }));
      if (!VALID_CAPACITY_UNITS.includes(rule.unit)) issues.push(issue({ code: "INVALID_CAPACITY_UNIT", targetType: "CapacityRule", targetId: rule.capacityRuleId, message: `Unit ${rule.unit} is invalid.`, suggestion: `使用可能単位: ${VALID_CAPACITY_UNITS.join(", ")}` }));
      if (!VALID_CAPACITY_BASES.includes(rule.basis)) issues.push(issue({ code: "INVALID_CAPACITY_BASIS", targetType: "CapacityRule", targetId: rule.capacityRuleId, message: `Basis ${rule.basis} is invalid.`, suggestion: `使用可能基準: ${VALID_CAPACITY_BASES.join(", ")}` }));
      try { new EffectivePeriod(rule.effectivePeriod); } catch { issues.push(issue({ code: "INVALID_EFFECTIVE_PERIOD", targetType: "CapacityRule", targetId: rule.capacityRuleId, message: "Effective period is invalid.", suggestion: "開始日を終了日以前にしてください。" })); }
    }
    const ruleGroups = new Map();
    for (const rule of data.capacityRules ?? []) { const key = `${rule.equipmentId}|${rule.priority}|${JSON.stringify(rule.conditions ?? {})}`; const group = ruleGroups.get(key) ?? []; group.push(rule); ruleGroups.set(key, group); }
    for (const group of ruleGroups.values()) for (let i=0;i<group.length;i+=1) for (let j=i+1;j<group.length;j+=1) { try { if (new EffectivePeriod(group[i].effectivePeriod).overlaps(new EffectivePeriod(group[j].effectivePeriod))) issues.push(issue({ code: "CAPACITY_RULE_CONFLICT", targetType: "CapacityRule", targetId: `${group[i].capacityRuleId},${group[j].capacityRuleId}`, message: "Same-priority rules overlap.", suggestion: "Priorityまたは有効期間を変更してください。" })); } catch {} }
    for (const qualification of qualifications) {
      if (!workerIds.has(qualification.workerId)) issues.push(issue({ code: "WORKER_NOT_FOUND", targetType: "WorkerSkillQualification", targetId: qualification.workerId, message: "Worker ID does not exist.", suggestion: "Worker Masterを登録してください。" }));
      if (!skillIds.has(qualification.skillId)) issues.push(issue({ code: "SKILL_NOT_FOUND", targetType: "WorkerSkillQualification", targetId: `${qualification.workerId}:${qualification.skillId}`, message: "Skill ID does not exist.", suggestion: "Skill Masterを登録してください。" }));
      try { new EffectivePeriod(qualification.effectivePeriod); } catch { issues.push(issue({ code: "INVALID_EFFECTIVE_PERIOD", targetType: "WorkerSkillQualification", targetId: `${qualification.workerId}:${qualification.skillId}`, message: "Qualification effective period is invalid.", suggestion: "Skill資格の開始日を終了日以前にしてください。" })); }
    }
    for (const entry of workerCalendar) {
      if (!workerIds.has(entry.workerId)) issues.push(issue({ code: "WORKER_NOT_FOUND", targetType: "WorkerCalendar", targetId: entry.workerId, date: entry.date, shiftId: entry.shiftId, message: "Worker ID does not exist.", suggestion: "Worker Masterを登録してください。" }));
      if (!factoryIds.has(entry.placementFactoryId)) issues.push(issue({ code: "FACTORY_NOT_FOUND", targetType: "WorkerCalendar", targetId: entry.workerId, date: entry.date, shiftId: entry.shiftId, message: "Placement factory does not exist.", suggestion: "配置工場を修正してください。" }));
      if (!shiftIds.has(entry.shiftId)) issues.push(issue({ code: "SHIFT_NOT_FOUND", targetType: "WorkerCalendar", targetId: entry.workerId, date: entry.date, shiftId: entry.shiftId, message: "Shift ID does not exist.", suggestion: "Shift Masterを登録してください。" }));
    }
    for (const entry of data.factoryCalendar ?? []) {
      if (!factoryIds.has(entry.factoryId)) issues.push(issue({ code: "FACTORY_NOT_FOUND", targetType: "FactoryCalendar", targetId: entry.factoryId, date: entry.date, message: "Factory ID does not exist.", suggestion: "Factory Masterを登録してください。" }));
      for (const shiftId of entry.plannedShiftIds ?? []) if (!shiftIds.has(shiftId)) issues.push(issue({ code: "SHIFT_NOT_FOUND", targetType: "FactoryCalendar", targetId: entry.factoryId, date: entry.date, shiftId, message: "Planned Shift ID does not exist.", suggestion: "Shift Masterまたは予定Shiftを修正してください。" }));
    }
    for (const entry of data.equipmentCalendar ?? []) {
      if (!equipmentIds.has(entry.equipmentId)) issues.push(issue({ code: "EQUIPMENT_NOT_FOUND", targetType: "EquipmentCalendar", targetId: entry.equipmentId, date: entry.date, shiftId: entry.shiftId, message: "Equipment ID does not exist.", suggestion: "Equipment Masterを登録してください。" }));
      if (!shiftIds.has(entry.shiftId)) issues.push(issue({ code: "SHIFT_NOT_FOUND", targetType: "EquipmentCalendar", targetId: entry.equipmentId, date: entry.date, shiftId: entry.shiftId, message: "Shift ID does not exist.", suggestion: "Shift Masterを登録してください。" }));
    }
    for (const duplicate of duplicates(data.factoryCalendar ?? [], (item) => `${item.factoryId}|${item.date}`)) issues.push(issue({ code: "CALENDAR_DUPLICATE", targetType: "FactoryCalendar", targetId: duplicate.factoryId, date: duplicate.date, message: "Factory calendar is duplicated.", suggestion: "同じ日付のEntryを一件へ統合してください。" }));
    for (const duplicate of duplicates(data.equipmentCalendar ?? [], (item) => `${item.equipmentId}|${item.date}|${item.shiftId}`)) issues.push(issue({ code: "CALENDAR_DUPLICATE", targetType: "EquipmentCalendar", targetId: duplicate.equipmentId, date: duplicate.date, shiftId: duplicate.shiftId, message: "Equipment calendar is duplicated.", suggestion: "Entryを一件へ統合してください。" }));
    for (const duplicate of duplicates(workerCalendar, (item) => `${item.workerId}|${item.date}|${item.shiftId}`)) issues.push(issue({ code: "WORKER_CALENDAR_DUPLICATE", targetType: "WorkerCalendar", targetId: duplicate.workerId, date: duplicate.date, shiftId: duplicate.shiftId, message: "Worker calendar is duplicated.", suggestion: "同じWorker・日付・Shiftの勤務Entryを一件へ統合してください。" }));
    for (let i=0;i<workerCalendar.length;i+=1) for (let j=i+1;j<workerCalendar.length;j+=1) if (workerCalendar[i].workerId === workerCalendar[j].workerId && workerCalendar[i].date === workerCalendar[j].date && overlaps(workerCalendar[i].startAt, workerCalendar[i].endAt, workerCalendar[j].startAt, workerCalendar[j].endAt)) issues.push(issue({ code: "WORKER_CALENDAR_OVERLAP", targetType: "WorkerCalendar", targetId: workerCalendar[i].workerId, date: workerCalendar[i].date, shiftId: `${workerCalendar[i].shiftId},${workerCalendar[j].shiftId}`, message: "Worker working periods overlap.", suggestion: "勤務時間またはShiftを修正してください。" }));
    for (const duplicate of duplicates(data.assignments ?? [], (item) => item.assignmentId)) issues.push(issue({ code: "ASSIGNMENT_DUPLICATE", targetType: "Assignment", targetId: duplicate.assignmentId, date: duplicate.date, shiftId: duplicate.shiftId, message: "Assignment ID is duplicated.", suggestion: "Assignment IDを変更してください。" }));
    for (const assignment of data.assignments ?? []) {
      if (!workerIds.has(assignment.workerId)) issues.push(issue({ code: "WORKER_NOT_FOUND", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: "Worker does not exist.", suggestion: "Worker IDを修正してください。" }));
      if (!equipmentIds.has(assignment.equipmentId)) issues.push(issue({ code: "EQUIPMENT_NOT_FOUND", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: "Equipment does not exist.", suggestion: "Equipment IDを修正してください。" }));
      if (assignment.roleSkillId !== "GENERAL" && !skillIds.has(assignment.roleSkillId)) issues.push(issue({ code: "SKILL_NOT_FOUND", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: "Role Skill does not exist.", suggestion: "Skill IDを修正してください。" }));
      const equipment = equipmentById.get(assignment.equipmentId);
      if (equipment && assignment.factoryId !== equipment.factoryId) issues.push(issue({ code: "CROSS_FACTORY_ASSIGNMENT", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: `Assignment factory ${assignment.factoryId} differs from equipment factory ${equipment.factoryId}.`, suggestion: "Assignmentの工場またはEquipmentを修正してください。" }));
      const calendars = workerCalendar.filter((entry) => entry.workerId === assignment.workerId && entry.date === assignment.date && entry.shiftId === assignment.shiftId);
      const withinWorkingTime = calendars.some((entry) => entry.startAt <= assignment.startAt && entry.endAt >= assignment.endAt && !["ABSENT", "PAID_LEAVE", "LEAVE", "SUPPORT_OUT"].includes(entry.status));
      if (!withinWorkingTime) issues.push(issue({ code: "OUTSIDE_WORKING_TIME_ASSIGNMENT", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: "Assignment is outside the worker working period.", suggestion: "勤務CalendarまたはAssignment時間を修正してください。" }));
      if (equipment && calendars.length > 0 && !calendars.some((entry) => entry.placementFactoryId === equipment.factoryId)) issues.push(issue({ code: "CROSS_FACTORY_ASSIGNMENT", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: "Worker placement factory differs from equipment factory.", suggestion: "応援受入を登録するか配置工場を修正してください。" }));
      if (assignment.roleSkillId !== "GENERAL" && skillIds.has(assignment.roleSkillId)) {
        const matching = qualifications.filter((item) => item.workerId === assignment.workerId && item.skillId === assignment.roleSkillId);
        const valid = matching.some((item) => { try { return new EffectivePeriod(item.effectivePeriod).contains(assignment.date); } catch { return false; } });
        if (!valid) issues.push(issue({ code: matching.length > 0 ? "SKILL_EXPIRED" : "SKILL_NOT_QUALIFIED", targetType: "Assignment", targetId: assignment.assignmentId, date: assignment.date, shiftId: assignment.shiftId, message: "Worker qualification is not valid on the assignment date.", suggestion: "Worker Skill資格の有効期間またはRole Skillを修正してください。" }));
      }
    }
    const assignments = data.assignments ?? [];
    for (let i=0;i<assignments.length;i+=1) for (let j=i+1;j<assignments.length;j+=1) if (assignments[i].workerId === assignments[j].workerId && assignments[i].date === assignments[j].date && overlaps(assignments[i].startAt, assignments[i].endAt, assignments[j].startAt, assignments[j].endAt) && assignments[i].equipmentId !== assignments[j].equipmentId) issues.push(issue({ severity: "WARNING", code: "ASSIGNMENT_CONFLICT", targetType: "Worker", targetId: assignments[i].workerId, date: assignments[i].date, shiftId: assignments[i].shiftId, message: `Worker is assigned to ${assignments[i].equipmentId} and ${assignments[j].equipmentId}.`, suggestion: "Priority結果を確認するかAssignment時間を分割してください。" }));
    for (const routing of data.routings ?? []) {
      for (const operation of routing.operations ?? []) {
        if (!processIds.has(operation.processId)) issues.push(issue({ code: "PROCESS_NOT_FOUND", targetType: "RoutingOperation", targetId: `${routing.routingId}:${operation.operationId}`, message: `Process ${operation.processId} does not exist.`, suggestion: "Process MasterまたはRoutingを修正してください。" }));
        if (!(operation.eligibleEquipmentIds ?? []).length) issues.push(issue({ code: "ELIGIBLE_EQUIPMENT_MISSING", targetType: "RoutingOperation", targetId: `${routing.routingId}:${operation.operationId}`, message: "Eligible equipment is not set.", suggestion: "使用可能Equipment IDを一件以上登録してください。" }));
        for (const equipmentId of operation.eligibleEquipmentIds ?? []) if (!equipmentIds.has(equipmentId)) issues.push(issue({ code: "EQUIPMENT_NOT_FOUND", targetType: "RoutingOperation", targetId: `${routing.routingId}:${operation.operationId}`, message: `Equipment ${equipmentId} does not exist.`, suggestion: "Equipment MasterまたはRoutingを修正してください。" }));
      }
    }
    for (const day of data.factoryCalendar ?? []) {
      if (!["OPERATING", "EXTRA_OPERATING"].includes(day.dayType)) continue;
      const plannedEquipment = (data.equipmentMasters ?? []).filter((equipment) => equipment.factoryId === day.factoryId && equipment.active !== false && equipment.usable !== false && equipment.planningTarget !== false);
      for (const shiftId of day.plannedShiftIds ?? []) for (const equipment of plannedEquipment) if (!(data.assignments ?? []).some((assignment) => assignment.date === day.date && assignment.shiftId === shiftId && assignment.equipmentId === equipment.equipmentId)) issues.push(issue({ severity: "WARNING", code: "PLANNED_EQUIPMENT_UNASSIGNED", targetType: "Equipment", targetId: equipment.equipmentId, date: day.date, shiftId, message: "Planned equipment has no assignment.", suggestion: "Assignmentを登録するか稼働予定を変更してください。" }));
    }
    for (const order of data.orders ?? []) {
      if (!routingIds.has(order.routingId)) issues.push(issue({ code: "ROUTING_NOT_FOUND", targetType: "Order", targetId: order.orderId, message: `Routing ${order.routingId} does not exist.`, suggestion: "Routingを登録してください。" }));
      if (!order.productGroup || !order.requiredQuantity || !order.dueDate) issues.push(issue({ code: "ORDER_INFORMATION_MISSING", targetType: "Order", targetId: order.orderId, message: "Required order information is missing.", suggestion: "Product Group、数量、納期を登録してください。" }));
    }
    return { issueCount: issues.length, errorCount: issues.filter((item) => item.severity === "ERROR").length, warningCount: issues.filter((item) => item.severity === "WARNING").length, issues };
  }
}
