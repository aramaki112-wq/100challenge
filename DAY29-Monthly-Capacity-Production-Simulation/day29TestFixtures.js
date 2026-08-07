import { CAPACITY_BASES, CAPACITY_UNITS, FACTORY_DAY_TYPES, WORKER_CALENDAR_STATES } from "./Day29Constants.js";

export function createMinimalData({
  date = "2026-08-03", secondEquipment = false, conflict = false,
  workerStatus = WORKER_CALENDAR_STATES.PRESENT, workerStart = "08:00", workerEnd = "16:00",
  skillEndDate = "2099-12-31", equipmentStopped = false, equipmentMultiplier = 1,
  orderQuantity = 40, dueDate = "2026-08-03", twoOperations = false
} = {}) {
  const equipmentMasters = [
    { equipmentId: "E1", factoryId: "F1", processId: "P1", name: "Equipment 1", equipmentType: "GENERAL", priority: 1, planningTarget: true, usable: true, defaultCapacityRuleId: "R1", capacityUnit: CAPACITY_UNITS.PIECE, displayOrder: 1, effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" }, active: true }
  ];
  if (secondEquipment) equipmentMasters.push({ equipmentId: "E2", factoryId: "F1", processId: twoOperations ? "P2" : "P1", name: "Equipment 2", equipmentType: "GENERAL", priority: 2, planningTarget: true, usable: true, defaultCapacityRuleId: "R2", capacityUnit: CAPACITY_UNITS.PIECE, displayOrder: 2, effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" }, active: true });
  const data = {
    factories: [{ factoryId: "F1", name: "Factory 1", displayOrder: 1, active: true, standardDailyMinutes: 480, note: "" }],
    processes: [{ processId: "P1", factoryId: "F1", name: "Process 1", sequence: 1, active: true }, ...(twoOperations ? [{ processId: "P2", factoryId: "F1", name: "Process 2", sequence: 2, active: true }] : [])],
    equipmentMasters,
    skills: [{ skillId: "OP", name: "Operator" }, { skillId: "CRANE", name: "Crane" }],
    workers: [{ workerId: "W1", name: "Worker 1", homeFactoryId: "F1", active: true }, ...(secondEquipment && !conflict ? [{ workerId: "W2", name: "Worker 2", homeFactoryId: "F1", active: true }] : [])],
    workerSkillQualifications: [{ workerId: "W1", skillId: "OP", effectivePeriod: { startDate: "2026-01-01", endDate: skillEndDate } }, ...(secondEquipment && !conflict ? [{ workerId: "W2", skillId: "OP", effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" } }] : [])],
    equipmentRequirements: equipmentMasters.map((item) => ({ equipmentId: item.equipmentId, requiredWorkerCount: 1, roleRequirements: [{ skillId: "OP", requiredCount: 1 }] })),
    shifts: [{ shiftId: "S1", factoryId: "F1", name: "S1", startTime: "08:00", endTime: "16:00", displayOrder: 1, active: true }],
    capacityRules: equipmentMasters.flatMap((item, index) => [
      { capacityRuleId: `R${index + 1}`, equipmentId: item.equipmentId, capacityValue: 10, unit: CAPACITY_UNITS.PIECE, basis: CAPACITY_BASES.HOUR, effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" }, priority: 100, active: true, conditions: {}, capacityMultiplier: 1, isDefault: true },
      { capacityRuleId: `R${index + 1}_SPECIAL`, equipmentId: item.equipmentId, capacityValue: 5, unit: CAPACITY_UNITS.PIECE, basis: CAPACITY_BASES.HOUR, effectivePeriod: { startDate: "2026-01-01", endDate: "2099-12-31" }, priority: 1, active: true, conditions: { productGroup: "SPECIAL" }, capacityMultiplier: 1, isDefault: false }
    ]),
    stopReasons: [],
    factoryCalendar: [{ factoryId: "F1", date, dayType: FACTORY_DAY_TYPES.OPERATING, plannedShiftIds: ["S1"], note: "" }],
    equipmentCalendar: equipmentStopped ? [{ equipmentId: "E1", date, shiftId: "S1", state: "BREAKDOWN", capacityMultiplier: 0, stopReasonId: "BREAKDOWN" }] : equipmentMultiplier !== 1 ? [{ equipmentId: "E1", date, shiftId: "S1", state: "DEGRADED", capacityMultiplier: equipmentMultiplier }] : [],
    workerCalendar: [{ workerId: "W1", date, shiftId: "S1", status: workerStatus, placementFactoryId: "F1", startAt: `${date}T${workerStart}:00`, endAt: `${date}T${workerEnd}:00` }, ...(secondEquipment && !conflict ? [{ workerId: "W2", date, shiftId: "S1", status: WORKER_CALENDAR_STATES.PRESENT, placementFactoryId: "F1", startAt: `${date}T08:00:00`, endAt: `${date}T16:00:00` }] : [])],
    assignments: [{ assignmentId: "A1", date, shiftId: "S1", factoryId: "F1", equipmentId: "E1", workerId: "W1", roleSkillId: "OP", startAt: `${date}T08:00:00`, endAt: `${date}T16:00:00` }, ...(secondEquipment ? [{ assignmentId: "A2", date, shiftId: "S1", factoryId: "F1", equipmentId: "E2", workerId: conflict ? "W1" : "W2", roleSkillId: "OP", startAt: `${date}T08:00:00`, endAt: `${date}T16:00:00` }] : [])],
    routings: [{ routingId: "ROUTE1", productGroup: "STANDARD", operations: twoOperations ? [{ operationId: "OP1", processId: "P1", sequence: 1, eligibleEquipmentIds: ["E1"] }, { operationId: "OP2", processId: "P2", sequence: 2, eligibleEquipmentIds: ["E2"] }] : [{ operationId: "OP1", processId: "P1", sequence: 1, eligibleEquipmentIds: secondEquipment ? ["E1", "E2"] : ["E1"] }] }],
    orders: [{ orderId: "O1", productGroup: "STANDARD", requiredQuantity: orderQuantity, unit: CAPACITY_UNITS.PIECE, dueDate, priority: 1, routingId: "ROUTE1", initialWip: 0, attributes: { productGroup: "STANDARD" } }]
  };
  return data;
}

export function scenarioFromData(data, overrides = {}) { return { scenarioId: overrides.scenarioId ?? "TEST", name: overrides.name ?? "Test Scenario", baseScenarioId: null, month: overrides.month ?? "2026-08", data }; }
