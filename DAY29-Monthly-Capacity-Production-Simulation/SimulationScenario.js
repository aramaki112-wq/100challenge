import { ERROR_CODES, assertNonEmptyString } from "./errors.js";

export class SimulationScenario {
  constructor({ scenarioId, name, baseScenarioId = null, month, data }) {
    this.scenarioId = assertNonEmptyString(scenarioId, ERROR_CODES.INVALID_SCENARIO, "scenarioId");
    this.name = assertNonEmptyString(name, ERROR_CODES.INVALID_SCENARIO, "scenario name");
    this.baseScenarioId = baseScenarioId == null ? null : String(baseScenarioId);
    this.month = assertNonEmptyString(month, ERROR_CODES.INVALID_TIME, "month");
    this.data = structuredClone(data ?? {});
    Object.freeze(this.data);
    Object.freeze(this);
  }
  clone({ scenarioId, name }) {
    return new SimulationScenario({ scenarioId, name, baseScenarioId: this.scenarioId, month: this.month, data: structuredClone(this.data) });
  }
  toPlainObject() { return { scenarioId: this.scenarioId, name: this.name, baseScenarioId: this.baseScenarioId, month: this.month, data: structuredClone(this.data) }; }
}
