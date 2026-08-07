import { assertScenarioRepository } from "./ScenarioRepository.js";
import { SimulationScenario } from "./SimulationScenario.js";

export class ScenarioManagementService {
  constructor({ repository }) { this.repository = assertScenarioRepository(repository); }
  async list() { return this.repository.findAll(); }
  async get(scenarioId) { return this.repository.findById(scenarioId); }
  async save(scenario) { return this.repository.save(scenario); }
  async clone({ sourceScenarioId, scenarioId, name }) {
    const source = await this.repository.findById(sourceScenarioId);
    if (!source) throw new Error(`Scenario ${sourceScenarioId} was not found.`);
    const clone = new SimulationScenario(source).clone({ scenarioId, name });
    return this.repository.save(clone);
  }
  async replaceData({ scenarioId, data, name = null, month = null }) {
    const current = await this.repository.findById(scenarioId);
    if (!current) throw new Error(`Scenario ${scenarioId} was not found.`);
    return this.repository.save(new SimulationScenario({ ...current, name: name ?? current.name, month: month ?? current.month, data }));
  }
}
