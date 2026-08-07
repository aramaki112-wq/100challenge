import { EvaluateFactoryAtTime } from "./EvaluateFactoryAtTime.js";
import { EvaluateFactoryAllocationAtTime } from "./EvaluateFactoryAllocationAtTime.js";

export class MemoryEventRepository {
  constructor(events = []) { this.events = structuredClone(events); }
  async findAll() { return structuredClone(this.events); }
  async saveAll(events) { this.events = structuredClone(events); }
  async clear() { this.events = []; }
}

export class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

export async function evaluateScenario(scenario, priorityOverride = null, targetTime = null) {
  const repository = new MemoryEventRepository(scenario.events);
  const day26 = new EvaluateFactoryAtTime({ eventRepository: repository });
  const service = new EvaluateFactoryAllocationAtTime({
    evaluateFactoryAtTime: day26
  });
  return service.execute({
    targetTime: targetTime ?? scenario.targetTime,
    equipment: scenario.equipment,
    workers: scenario.workers,
    initialFactoryState: scenario.initialFactoryState,
    priorities: priorityOverride ?? scenario.priorities
  });
}
