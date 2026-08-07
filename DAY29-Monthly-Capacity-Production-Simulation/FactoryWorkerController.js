export class FactoryWorkerController {
  constructor({
    evaluateFactoryAtTime,
    eventRepository,
    view,
    sampleEvents,
    scenarioTimes,
    findSkillName
  }) {
    this.evaluateFactoryAtTime = evaluateFactoryAtTime;
    this.eventRepository = eventRepository;
    this.view = view;
    this.sampleEvents = sampleEvents;
    this.scenarioTimes = scenarioTimes;
    this.findSkillName = findSkillName;
  }

  async initialize() {
    const existingEvents = await this.eventRepository.findAll();
    if (existingEvents.length === 0) {
      await this.eventRepository.saveAll(this.sampleEvents);
    }

    this.view.renderScenarios(this.scenarioTimes);
    this.view.bindEvaluate((targetTime) => this.evaluate(targetTime));
    this.view.bindScenario((targetTime) => this.evaluate(targetTime));
    this.view.bindReset(() => this.reset());

    await this.evaluate("2026-07-26T09:00");
  }

  async evaluate(targetTime) {
    try {
      const result = await this.evaluateFactoryAtTime.execute({
        targetTime
      });
      this.view.render(result, this.findSkillName);
    } catch (error) {
      this.view.renderError(error);
    }
  }

  async reset() {
    try {
      await this.eventRepository.clear();
      await this.eventRepository.saveAll(this.sampleEvents);
      this.view.targetTimeInput.value = "2026-07-26T09:00";
      await this.evaluate("2026-07-26T09:00");
    } catch (error) {
      this.view.renderError(error);
    }
  }
}
