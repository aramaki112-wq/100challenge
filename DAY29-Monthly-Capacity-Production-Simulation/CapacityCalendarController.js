export class CapacityCalendarController {
  constructor({
    buildCapacityCalendar,
    eventRepository,
    view,
    scenarios
  }) {
    this.buildCapacityCalendar = buildCapacityCalendar;
    this.eventRepository = eventRepository;
    this.view = view;
    this.scenarios = scenarios;
    this.currentScenario = null;
  }

  async initialize() {
    const existingEvents = await this.eventRepository.findAll();
    const savedScenarioId = existingEvents[0]?.scenarioId;
    this.currentScenario = this.scenarios.find(
      (scenario) => scenario.scenarioId === savedScenarioId
    ) ?? this.scenarios[0];

    if (existingEvents.length === 0 || !savedScenarioId) {
      await this.#seed(this.currentScenario);
    }

    this.view.renderScenarioOptions(
      this.scenarios,
      this.currentScenario.scenarioId
    );
    this.view.renderScenario(this.currentScenario);
    this.view.bindBuild((conditions) => this.build(conditions));
    this.view.bindScenarioChange((scenarioId) => this.changeScenario(scenarioId));
    this.view.bindReset(() => this.reset());
    await this.build(this.view.getConditions());
  }

  async #seed(scenario) {
    await this.eventRepository.clear();
    await this.eventRepository.saveAll(scenario.events);
  }

  async changeScenario(scenarioId) {
    const scenario = this.scenarios.find(
      (item) => item.scenarioId === scenarioId
    );
    if (!scenario) return;
    this.currentScenario = scenario;
    await this.#seed(scenario);
    this.view.renderScenario(scenario);
    await this.build(this.view.getConditions());
  }

  async build(conditions) {
    try {
      const result = await this.buildCapacityCalendar.execute({
        ...conditions,
        equipment: this.currentScenario.equipment,
        workers: this.currentScenario.workers,
        initialFactoryState: this.currentScenario.initialFactoryState
      });
      this.view.render(result);
    } catch (error) {
      this.view.renderError(error);
    }
  }

  async reset() {
    await this.#seed(this.currentScenario);
    this.view.renderScenario(this.currentScenario);
    await this.build(this.view.getConditions());
  }
}
