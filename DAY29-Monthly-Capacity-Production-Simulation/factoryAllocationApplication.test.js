import { test, assertEqual, assertTrue } from "./testRunner.js";
import { EvaluateFactoryAtTime } from "./EvaluateFactoryAtTime.js";
import { EvaluateFactoryAllocationAtTime } from "./EvaluateFactoryAllocationAtTime.js";
import { findScenario } from "./sampleFactoryAllocationData.js";
import { MemoryEventRepository } from "./testSupport.js";

export function registerFactoryAllocationApplicationTests() {
  test("D27-APP-001", "Application ServiceはTarget Time時点を評価する", async () => {
    const scenario = findScenario("SCENARIO_A");
    const repository = new MemoryEventRepository(scenario.events);
    const service = new EvaluateFactoryAllocationAtTime({
      evaluateFactoryAtTime: new EvaluateFactoryAtTime({ eventRepository: repository })
    });
    const result = await service.execute({
      targetTime: scenario.targetTime,
      equipment: scenario.equipment,
      workers: scenario.workers,
      initialFactoryState: scenario.initialFactoryState,
      priorities: scenario.priorities
    });
    assertEqual(result.targetTime, scenario.targetTime);
  });

  test("D27-APP-002", "Priority Overrideを評価条件として使用しEventを変更しない", async () => {
    const scenario = findScenario("SCENARIO_B");
    const repository = new MemoryEventRepository(scenario.events);
    const service = new EvaluateFactoryAllocationAtTime({
      evaluateFactoryAtTime: new EvaluateFactoryAtTime({ eventRepository: repository })
    });
    const before = (await repository.findAll()).length;
    const result = await service.execute({
      targetTime: scenario.targetTime,
      equipment: scenario.equipment,
      workers: scenario.workers,
      initialFactoryState: scenario.initialFactoryState,
      priorities: [
        { equipmentId: "EQUIPMENT_A", value: 2 },
        { equipmentId: "EQUIPMENT_B", value: 1 }
      ]
    });
    assertEqual(result.equipmentResults.find(x => x.executionState === "RUNNING").equipmentId, "EQUIPMENT_B");
    assertEqual((await repository.findAll()).length, before);
  });

  test("D27-APP-003", "Repository ErrorをBLOCKEDへ変換せず上位へ返す", async () => {
    const scenario = findScenario("SCENARIO_A");
    const repository = { async findAll() { throw new Error("repository failed"); } };
    const service = new EvaluateFactoryAllocationAtTime({
      evaluateFactoryAtTime: new EvaluateFactoryAtTime({ eventRepository: repository })
    });
    let message = null;
    try {
      await service.execute({
        targetTime: scenario.targetTime,
        equipment: scenario.equipment,
        workers: scenario.workers,
        initialFactoryState: scenario.initialFactoryState,
        priorities: scenario.priorities
      });
    } catch (error) {
      message = error.message;
    }
    assertEqual(message, "repository failed");
  });

  test("D27-APP-004", "Application Resultへ日本語表示文を追加しない", async () => {
    const scenario = findScenario("SCENARIO_B");
    const repository = new MemoryEventRepository(scenario.events);
    const service = new EvaluateFactoryAllocationAtTime({
      evaluateFactoryAtTime: new EvaluateFactoryAtTime({ eventRepository: repository })
    });
    const result = await service.execute({
      targetTime: scenario.targetTime,
      equipment: scenario.equipment,
      workers: scenario.workers,
      initialFactoryState: scenario.initialFactoryState,
      priorities: scenario.priorities
    });
    assertTrue(!JSON.stringify(result).includes("両方で必要です"));
  });
}
