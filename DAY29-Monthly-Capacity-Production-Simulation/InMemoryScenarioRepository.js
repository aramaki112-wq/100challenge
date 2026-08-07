import { SimulationScenario } from "./SimulationScenario.js";

export class InMemoryScenarioRepository {
  constructor(scenarios = []) {
    this.items = new Map(scenarios.map((item) => {
      const scenario = item instanceof SimulationScenario ? item : new SimulationScenario(item);
      return [scenario.scenarioId, scenario.toPlainObject()];
    }));
  }
  async findAll() { return [...this.items.values()].map((item) => structuredClone(item)); }
  async findById(scenarioId) { return this.items.has(scenarioId) ? structuredClone(this.items.get(scenarioId)) : null; }
  async save(scenario) { const normalized = scenario instanceof SimulationScenario ? scenario : new SimulationScenario(scenario); this.items.set(normalized.scenarioId, normalized.toPlainObject()); return normalized.toPlainObject(); }
  async remove(scenarioId) { this.items.delete(scenarioId); }
  async clear() { this.items.clear(); }
}
