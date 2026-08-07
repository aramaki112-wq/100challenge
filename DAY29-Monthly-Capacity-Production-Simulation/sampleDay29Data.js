import { addDays, combineDateAndTime, monthDateKeys } from "./Day29DateTime.js";
import { CAPACITY_BASES, CAPACITY_UNITS, EQUIPMENT_CALENDAR_STATES, FACTORY_DAY_TYPES, WORKER_CALENDAR_STATES } from "./Day29Constants.js";

export const DAY29_SAMPLE_MONTH = "2026-08";

function isWeekday(date) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day !== 0 && day !== 6;
}

function buildBaseData() {
  const factories = [1, 2, 3, 4].map((number) => ({
    factoryId: `F${number}`,
    name: `第${number}工場`,
    displayOrder: number,
    active: true,
    standardDailyMinutes: 840,
    note: "DAY29 Sample Factory"
  }));
  const processes = factories.flatMap((factory, factoryIndex) => [
    { processId: `${factory.factoryId}_P_A`, factoryId: factory.factoryId, name: `${factory.name} 主工程A`, sequence: factoryIndex * 2 + 1, active: true },
    { processId: `${factory.factoryId}_P_B`, factoryId: factory.factoryId, name: `${factory.name} 主工程B`, sequence: factoryIndex * 2 + 2, active: true }
  ]);
  const equipmentMasters = factories.flatMap((factory, factoryIndex) => [
    {
      equipmentId: `${factory.factoryId}_EQ_A`, factoryId: factory.factoryId, processId: `${factory.factoryId}_P_A`,
      name: `${factory.name} 設備A`, equipmentType: "PRIMARY", priority: 1, planningTarget: true, usable: true,
      defaultCapacityRuleId: `${factory.factoryId}_EQ_A_DEFAULT`, capacityUnit: CAPACITY_UNITS.PIECE,
      displayOrder: factoryIndex * 2 + 1, effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" }, active: true
    },
    {
      equipmentId: `${factory.factoryId}_EQ_B`, factoryId: factory.factoryId, processId: `${factory.factoryId}_P_B`,
      name: `${factory.name} 設備B`, equipmentType: "SECONDARY", priority: 2, planningTarget: true, usable: true,
      defaultCapacityRuleId: `${factory.factoryId}_EQ_B_DEFAULT`, capacityUnit: CAPACITY_UNITS.PIECE,
      displayOrder: factoryIndex * 2 + 2, effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" }, active: true
    }
  ]);
  const skills = [{ skillId: "OPERATOR", name: "設備オペレーター" }];
  const workers = [
    { workerId: "W_F1_A", name: "第一工場 A担当", homeFactoryId: "F1", active: true },
    { workerId: "W_F2_A", name: "第二工場 A担当", homeFactoryId: "F2", active: true },
    { workerId: "W_F2_B", name: "第二工場 B担当", homeFactoryId: "F2", active: true },
    { workerId: "W_F3_A", name: "第三工場 A担当", homeFactoryId: "F3", active: true },
    { workerId: "W_F3_B", name: "第三工場 B担当", homeFactoryId: "F3", active: true },
    { workerId: "W_F4_A", name: "第四工場 A担当", homeFactoryId: "F4", active: true },
    { workerId: "W_SUPPORT", name: "第三工場から第四工場への応援", homeFactoryId: "F3", active: true }
  ];
  const workerSkillQualifications = workers.map((worker) => ({
    workerId: worker.workerId,
    skillId: "OPERATOR",
    effectivePeriod: { startDate: "2026-01-01", endDate: worker.workerId === "W_F3_B" ? "2026-08-18" : "2099-12-31" }
  }));
  const equipmentRequirements = equipmentMasters.map((equipment) => ({
    equipmentId: equipment.equipmentId,
    requiredWorkerCount: 1,
    roleRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }]
  }));
  const shifts = factories.flatMap((factory) => [
    { shiftId: `${factory.factoryId}_S1`, factoryId: factory.factoryId, name: "S1", startTime: "06:00", endTime: "13:00", displayOrder: 1, active: true },
    { shiftId: `${factory.factoryId}_S2`, factoryId: factory.factoryId, name: "S2", startTime: "13:00", endTime: "20:00", displayOrder: 2, active: true }
  ]);
  const capacityRules = equipmentMasters.flatMap((equipment) => [
    {
      capacityRuleId: `${equipment.equipmentId}_DEFAULT`, equipmentId: equipment.equipmentId,
      capacityValue: equipment.equipmentId.endsWith("_A") ? 10 : 8,
      unit: CAPACITY_UNITS.PIECE, basis: CAPACITY_BASES.HOUR,
      effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" },
      priority: 100, active: true, conditions: {}, capacityMultiplier: 1, isDefault: true
    },
    {
      capacityRuleId: `${equipment.equipmentId}_SPECIAL`, equipmentId: equipment.equipmentId,
      capacityValue: equipment.equipmentId.endsWith("_A") ? 7 : 5,
      unit: CAPACITY_UNITS.PIECE, basis: CAPACITY_BASES.HOUR,
      effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" },
      priority: 10, active: true, conditions: { productGroup: "SPECIAL" }, capacityMultiplier: 1, isDefault: false
    }
  ]);
  const stopReasons = [
    { stopReasonId: "BREAKDOWN", name: "設備故障", category: "FAILURE", active: true },
    { stopReasonId: "INSPECTION", name: "定期点検", category: "MAINTENANCE", active: true },
    { stopReasonId: "PLAN_STOP", name: "計画停止", category: "PLAN", active: true }
  ];
  const factoryCalendar = [];
  const equipmentCalendar = [];
  const workerCalendar = [];
  const assignments = [];
  const workerEquipment = {
    W_F1_A: ["F1_EQ_A", "F1_EQ_B"],
    W_F2_A: ["F2_EQ_A"],
    W_F2_B: ["F2_EQ_B"],
    W_F3_A: ["F3_EQ_A"],
    W_F3_B: ["F3_EQ_B"],
    W_F4_A: ["F4_EQ_A"],
    W_SUPPORT: ["F4_EQ_B"]
  };
  const workerPlacement = {
    W_F1_A: "F1", W_F2_A: "F2", W_F2_B: "F2", W_F3_A: "F3", W_F3_B: "F3", W_F4_A: "F4", W_SUPPORT: "F4"
  };
  for (const date of monthDateKeys(DAY29_SAMPLE_MONTH)) {
    const weekday = isWeekday(date);
    for (const factory of factories) {
      factoryCalendar.push({
        factoryId: factory.factoryId,
        date,
        dayType: weekday ? FACTORY_DAY_TYPES.OPERATING : FACTORY_DAY_TYPES.FACTORY_HOLIDAY,
        plannedShiftIds: weekday ? [`${factory.factoryId}_S1`, `${factory.factoryId}_S2`] : [],
        note: weekday ? "通常稼働" : "休日"
      });
    }
    if (!weekday) continue;
    for (const worker of workers) {
      const placementFactoryId = workerPlacement[worker.workerId];
      for (const suffix of ["S1", "S2"]) {
        const shiftId = `${placementFactoryId}_${suffix}`;
        const startTime = suffix === "S1" ? "06:00" : "13:00";
        const endTime = suffix === "S1" ? "13:00" : "20:00";
        const partial = worker.workerId === "W_SUPPORT" && date === "2026-08-12" && suffix === "S2";
        workerCalendar.push({
          workerId: worker.workerId,
          date,
          shiftId,
          status: worker.workerId === "W_SUPPORT" ? WORKER_CALENDAR_STATES.SUPPORT_IN : partial ? WORKER_CALENDAR_STATES.PARTIAL : WORKER_CALENDAR_STATES.PRESENT,
          placementFactoryId,
          startAt: combineDateAndTime(date, partial ? "15:00" : startTime),
          endAt: combineDateAndTime(date, endTime),
          note: worker.workerId === "W_SUPPORT" ? "所属F3、配置F4" : ""
        });
        for (const equipmentId of workerEquipment[worker.workerId]) {
          assignments.push({
            assignmentId: `${date}_${shiftId}_${worker.workerId}_${equipmentId}`,
            date,
            shiftId,
            factoryId: placementFactoryId,
            equipmentId,
            workerId: worker.workerId,
            roleSkillId: "OPERATOR",
            startAt: combineDateAndTime(date, startTime),
            endAt: combineDateAndTime(date, endTime)
          });
        }
      }
    }
  }
  equipmentCalendar.push({ equipmentId: "F3_EQ_A", date: "2026-08-10", shiftId: "F3_S1", state: EQUIPMENT_CALENDAR_STATES.DEGRADED, capacityMultiplier: 0.5, stopReasonId: null, note: "能力低下" });
  equipmentCalendar.push({ equipmentId: "F4_EQ_A", date: "2026-08-17", shiftId: "F4_S1", state: EQUIPMENT_CALENDAR_STATES.BREAKDOWN, capacityMultiplier: 0, stopReasonId: "BREAKDOWN", note: "設備故障" });
  const routings = [
    {
      routingId: "ROUTE_STANDARD", productGroup: "STANDARD",
      operations: [1, 2, 3, 4].map((number) => ({ operationId: `STD_OP${number}`, processId: `F${number}_P_A`, sequence: number, eligibleEquipmentIds: [`F${number}_EQ_A`] }))
    },
    {
      routingId: "ROUTE_SPECIAL", productGroup: "SPECIAL",
      operations: [1, 2, 3, 4].map((number) => ({ operationId: `SP_OP${number}`, processId: `F${number}_P_B`, sequence: number, eligibleEquipmentIds: [`F${number}_EQ_B`] }))
    }
  ];
  const orders = [
    { orderId: "ORDER_STD_001", productId: "STD-001", productGroup: "STANDARD", requiredQuantity: 1000, unit: CAPACITY_UNITS.PIECE, dueDate: "2026-08-26", priority: 1, routingId: "ROUTE_STANDARD", initialWip: 0, attributes: { productGroup: "STANDARD" } },
    { orderId: "ORDER_SP_001", productId: "SP-001", productGroup: "SPECIAL", requiredQuantity: 100, unit: CAPACITY_UNITS.PIECE, dueDate: "2026-08-24", priority: 2, routingId: "ROUTE_SPECIAL", initialWip: 0, attributes: { productGroup: "SPECIAL", difficultyClass: "HIGH" } }
  ];
  return { factories, processes, equipmentMasters, skills, workers, workerSkillQualifications, equipmentRequirements, shifts, capacityRules, stopReasons, factoryCalendar, equipmentCalendar, workerCalendar, assignments, routings, orders };
}

export function createSampleScenarios() {
  const baseData = buildBaseData();
  const supportData = structuredClone(baseData);
  supportData.workers.push({ workerId: "W_F1_B", name: "第一工場 B追加要員", homeFactoryId: "F1", active: true });
  supportData.workerSkillQualifications.push({ workerId: "W_F1_B", skillId: "OPERATOR", effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" } });
  for (const date of monthDateKeys(DAY29_SAMPLE_MONTH).filter(isWeekday)) {
    for (const suffix of ["S1", "S2"]) {
      const shiftId = `F1_${suffix}`;
      const startTime = suffix === "S1" ? "06:00" : "13:00";
      const endTime = suffix === "S1" ? "13:00" : "20:00";
      supportData.workerCalendar.push({ workerId: "W_F1_B", date, shiftId, status: WORKER_CALENDAR_STATES.SUPPORT_IN, placementFactoryId: "F1", startAt: combineDateAndTime(date, startTime), endAt: combineDateAndTime(date, endTime), note: "追加要員Scenario" });
      supportData.assignments.push({ assignmentId: `${date}_${shiftId}_W_F1_B_F1_EQ_B`, date, shiftId, factoryId: "F1", equipmentId: "F1_EQ_B", workerId: "W_F1_B", roleSkillId: "OPERATOR", startAt: combineDateAndTime(date, startTime), endAt: combineDateAndTime(date, endTime) });
    }
  }
  return [
    { scenarioId: "BASE", name: "Base Scenario", baseScenarioId: null, month: DAY29_SAMPLE_MONTH, data: baseData },
    { scenarioId: "WORKER_ADDED", name: "Worker追加Scenario", baseScenarioId: "BASE", month: DAY29_SAMPLE_MONTH, data: supportData }
  ];
}
