import { ApplicationError, ERROR_CODES } from "./errors.js";
import { SimulationScenario } from "./SimulationScenario.js";

export const DAY29_SCENARIO_STORAGE_KEY = "day29MonthlyCapacityScenarios";

function getStorage(storage) {
  const target = storage ?? globalThis.localStorage ?? globalThis.window?.localStorage;
  if (!target) throw new ApplicationError(ERROR_CODES.INVALID_ARGUMENT, "Storage adapter is required.");
  return target;
}

export class LocalStorageScenarioRepository {
  constructor({ storage, storageKey = DAY29_SCENARIO_STORAGE_KEY } = {}) { this.storage = getStorage(storage); this.storageKey = storageKey; }
  async findAll() {
    const raw = this.storage.getItem(this.storageKey);
    if (raw == null) return [];
    try { const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) throw new TypeError("Scenario storage must be an array."); return structuredClone(parsed); }
    catch (error) { throw new ApplicationError(ERROR_CODES.STORAGE_DATA_INVALID, "Saved DAY29 scenario data is invalid.", { cause: error.message }); }
  }
  async findById(scenarioId) { return (await this.findAll()).find((item) => item.scenarioId === scenarioId) ?? null; }
  async save(scenario) {
    const normalized = scenario instanceof SimulationScenario ? scenario : new SimulationScenario(scenario);
    const items = await this.findAll();
    const index = items.findIndex((item) => item.scenarioId === normalized.scenarioId);
    if (index >= 0) items[index] = normalized.toPlainObject(); else items.push(normalized.toPlainObject());
    this.storage.setItem(this.storageKey, JSON.stringify(items));
    return normalized.toPlainObject();
  }
  async remove(scenarioId) { const items = (await this.findAll()).filter((item) => item.scenarioId !== scenarioId); this.storage.setItem(this.storageKey, JSON.stringify(items)); }
  async clear() { this.storage.removeItem(this.storageKey); }
}
