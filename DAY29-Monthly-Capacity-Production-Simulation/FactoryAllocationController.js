export class FactoryAllocationController {
  constructor({
    evaluateFactoryAllocationAtTime,
    eventRepository,
    view,
    scenarios,
    findSkillName
  }) {
    this.evaluateFactoryAllocationAtTime = evaluateFactoryAllocationAtTime;
    this.eventRepository = eventRepository;
    this.view = view;
    this.scenarios = scenarios;
    this.findSkillName = findSkillName;
    this.currentScenario = null;
    this.currentPriorities = [];
  }

  async initialize() {
    const existingEvents = await this.eventRepository.findAll();
    const savedScenarioId = existingEvents[0]?.scenarioId;
    this.currentScenario = this.scenarios.find(
      (scenario) => scenario.scenarioId === savedScenarioId
    ) ?? this.scenarios[0];

    if (existingEvents.length === 0 || !savedScenarioId) {
      await this.#seedScenario(this.currentScenario);
    }

    this.currentPriorities = structuredClone(this.currentScenario.priorities);
    this.view.renderScenarioOptions(
      this.scenarios,
      this.currentScenario.scenarioId
    );
    this.view.renderScenarioDescription(this.currentScenario);
    this.view.renderPriorityControls(
      this.currentScenario.equipment,
      this.currentPriorities
    );
    this.view.setTargetTime(this.currentScenario.targetTime);

    this.view.bindEvaluate((targetTime) => this.evaluate(targetTime));
    this.view.bindScenarioChange((scenarioId) => this.changeScenario(scenarioId));
    this.view.bindPriorityChange((priorities) => this.changePriorities(priorities));
    this.view.bindReset(() => this.reset());

    await this.evaluate(this.currentScenario.targetTime);
  }

  async #seedScenario(scenario) {
    await this.eventRepository.clear();
    await this.eventRepository.saveAll(scenario.events);
  }

  async changeScenario(scenarioId) {
    const scenario = this.scenarios.find(
      (item) => item.scenarioId === scenarioId
    );
    if (!scenario) return;
    this.currentScenario = scenario;
    this.currentPriorities = structuredClone(scenario.priorities);
    await this.#seedScenario(scenario);
    this.view.renderScenarioDescription(scenario);
    this.view.renderPriorityControls(scenario.equipment, this.currentPriorities);
    this.view.setTargetTime(scenario.targetTime);
    await this.evaluate(scenario.targetTime);
  }

  async changePriorities(priorities) {
    this.currentPriorities = structuredClone(priorities);
    await this.evaluate(this.view.getTargetTime());
  }

  async evaluate(targetTime) {
    try {
      const result = await this.evaluateFactoryAllocationAtTime.execute({
        targetTime,
        equipment: this.currentScenario.equipment,
        workers: this.currentScenario.workers,
        initialFactoryState: this.currentScenario.initialFactoryState,
        priorities: this.currentPriorities
      });
      this.view.render(result, this.findSkillName);
    } catch (error) {
      this.view.renderError(error);
    }
  }

  async reset() {
    await this.#seedScenario(this.currentScenario);
    this.currentPriorities = structuredClone(this.currentScenario.priorities);
    this.view.renderPriorityControls(
      this.currentScenario.equipment,
      this.currentPriorities
    );
    this.view.setTargetTime(this.currentScenario.targetTime);
    await this.evaluate(this.currentScenario.targetTime);
  }
}
