import { CalculateMonthlyCapacity } from "./CalculateMonthlyCapacity.js";
import { RunProductionSimulation } from "./RunProductionSimulation.js";
import { ValidateSimulationInput } from "./ValidateSimulationInput.js";
import { SimulationScenario } from "./SimulationScenario.js";

function applySimulationUsage(capacity, simulation) {
  const result = structuredClone(capacity);
  const usageByShift = new Map();
  for (const allocation of simulation.allocations) {
    const key = `${allocation.date}|${allocation.shiftId}|${allocation.equipmentId}`;
    const current = usageByShift.get(key) ?? { quantity: 0, minutes: 0 };
    current.quantity += allocation.quantity;
    current.minutes += allocation.minutesUsed;
    usageByShift.set(key, current);
  }
  const unprocessedByProcess = new Map();
  for (const operation of simulation.operationResults) {
    unprocessedByProcess.set(operation.processId, (unprocessedByProcess.get(operation.processId) ?? 0) + operation.unprocessedQuantity);
  }
  for (const row of result.shiftResults) {
    const usage = usageByShift.get(`${row.date}|${row.shiftId}|${row.equipmentId}`) ?? { quantity: 0, minutes: 0 };
    row.usedCapacity = usage.quantity;
    row.usedCapacityMinutes = usage.minutes;
    row.remainingCapacityMinutes = Math.max(0, row.availableMinutes - usage.minutes);
    row.remainingCapacity = Math.max(0, row.availableCapacity - usage.quantity);
    row.unprocessedQuantity = unprocessedByProcess.get(row.processId) ?? 0;
  }
  for (const row of result.dailyResults) {
    const shifts = result.shiftResults.filter((item) => item.date === row.date && item.equipmentId === row.equipmentId);
    row.usedCapacity = shifts.reduce((sum, item) => sum + item.usedCapacity, 0);
    row.usedCapacityMinutes = shifts.reduce((sum, item) => sum + item.usedCapacityMinutes, 0);
    row.remainingCapacity = shifts.reduce((sum, item) => sum + item.remainingCapacity, 0);
    row.remainingCapacityMinutes = shifts.reduce((sum, item) => sum + item.remainingCapacityMinutes, 0);
    row.unprocessedQuantity = unprocessedByProcess.get(row.processId) ?? 0;
  }
  for (const row of result.monthlyResults) {
    const shifts = result.shiftResults.filter((item) => item.equipmentId === row.equipmentId);
    row.usedCapacity = shifts.reduce((sum, item) => sum + item.usedCapacity, 0);
    row.usedCapacityMinutes = shifts.reduce((sum, item) => sum + item.usedCapacityMinutes, 0);
    row.remainingCapacity = shifts.reduce((sum, item) => sum + item.remainingCapacity, 0);
    row.remainingCapacityMinutes = shifts.reduce((sum, item) => sum + item.remainingCapacityMinutes, 0);
    row.unprocessedQuantity = unprocessedByProcess.get(row.processId) ?? 0;
  }
  for (const row of result.factoryMonthlyResults ?? []) {
    const shifts = result.shiftResults.filter((item) => item.factoryId === row.factoryId);
    row.usedCapacity = shifts.reduce((sum, item) => sum + item.usedCapacity, 0);
    row.usedCapacityMinutes = shifts.reduce((sum, item) => sum + item.usedCapacityMinutes, 0);
    row.remainingCapacity = shifts.reduce((sum, item) => sum + item.remainingCapacity, 0);
    row.remainingCapacityMinutes = shifts.reduce((sum, item) => sum + item.remainingCapacityMinutes, 0);
  }
  return result;
}

export class RunScenarioSimulation {
  constructor({ calculateMonthlyCapacity = new CalculateMonthlyCapacity(), runProductionSimulation = new RunProductionSimulation(), validateSimulationInput = new ValidateSimulationInput() } = {}) {
    this.calculateMonthlyCapacity = calculateMonthlyCapacity;
    this.runProductionSimulation = runProductionSimulation;
    this.validateSimulationInput = validateSimulationInput;
  }
  execute(scenarioLike) {
    const scenario = scenarioLike instanceof SimulationScenario ? scenarioLike : new SimulationScenario(scenarioLike);
    const validation = this.validateSimulationInput.execute(scenario.data);
    const rawCapacity = this.calculateMonthlyCapacity.execute({ month: scenario.month, data: scenario.data });
    const simulation = this.runProductionSimulation.execute({ scenarioId: scenario.scenarioId, data: scenario.data, capacityResult: rawCapacity });
    const capacity = applySimulationUsage(rawCapacity, simulation);
    return { scenarioId: scenario.scenarioId, scenarioName: scenario.name, month: scenario.month, validation, capacity, simulation };
  }
}
