export class FactoryWorkerView {
  constructor({
    equipmentContainer,
    targetTimeInput,
    scenarioContainer,
    errorContainer,
    summaryContainer
  }) {
    this.equipmentContainer = equipmentContainer;
    this.targetTimeInput = targetTimeInput;
    this.scenarioContainer = scenarioContainer;
    this.errorContainer = errorContainer;
    this.summaryContainer = summaryContainer;
  }

  bindEvaluate(handler) {
    document
      .querySelector("#evaluateButton")
      .addEventListener("click", () =>
        handler(this.targetTimeInput.value)
      );
  }

  bindReset(handler) {
    document
      .querySelector("#resetButton")
      .addEventListener("click", handler);
  }

  bindScenario(handler) {
    this.scenarioContainer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-target-time]");
      if (!button) return;
      const value = button.dataset.targetTime;
      this.targetTimeInput.value = value;
      handler(value);
    });
  }

  renderScenarios(scenarios) {
    this.scenarioContainer.innerHTML = scenarios
      .map(
        (scenario) => `
          <button
            type="button"
            class="scenario-button"
            data-target-time="${scenario.value}"
          >
            ${scenario.label}
          </button>
        `
      )
      .join("");
  }

  render(result, findSkillName) {
    this.clearError();
    this.summaryContainer.textContent =
      `評価時刻: ${result.targetTime} / Event数: ${result.eventCount}`;

    this.equipmentContainer.innerHTML =
      result.equipmentEvaluations
        .map((evaluation) =>
          this.#renderEquipment(evaluation, findSkillName)
        )
        .join("");
  }

  renderError(error) {
    this.errorContainer.hidden = false;
    this.errorContainer.innerHTML = `
      <strong>エラー</strong>
      <div>${error.code ?? error.name ?? "UNKNOWN_ERROR"}</div>
      <div>${error.message}</div>
    `;
  }

  clearError() {
    this.errorContainer.hidden = true;
    this.errorContainer.textContent = "";
  }

  #renderEquipment(evaluation, findSkillName) {
    const statusClass = evaluation.executable
      ? "status-success"
      : "status-danger";

    const requirementRows =
      evaluation.skillRequirement.requirements.length === 0
        ? `<tr><td colspan="6">特定Skill要件なし</td></tr>`
        : evaluation.skillRequirement.requirements
            .map(
              (item) => `
                <tr>
                  <td>${findSkillName(item.skillId)}</td>
                  <td>${item.requiredCount}</td>
                  <td>${item.availableCount}</td>
                  <td>${item.allocatedCount}</td>
                  <td>${item.shortageCount}</td>
                  <td>${item.satisfied ? "Satisfied" : "Unsatisfied"}</td>
                </tr>
              `
            )
            .join("");

    const allocations =
      evaluation.skillRequirement.allocations.length === 0
        ? `<li>割当なし</li>`
        : evaluation.skillRequirement.allocations
            .map(
              (allocation) => `
                <li>
                  ${allocation.workerId}
                  →
                  ${findSkillName(allocation.skillId)}
                </li>
              `
            )
            .join("");

    const reasons =
      evaluation.reasons.length === 0
        ? `<li>阻害理由なし</li>`
        : evaluation.reasons
            .map(
              (reason) => `<li>${this.#formatReason(reason, findSkillName)}</li>`
            )
            .join("");

    return `
      <article class="equipment-card">
        <header class="equipment-header">
          <div>
            <h2>${evaluation.equipmentName}</h2>
            <p>${evaluation.equipmentId}</p>
          </div>
          <span class="status-badge ${statusClass}">
            ${evaluation.executable ? "Executable" : "Not Executable"}
          </span>
        </header>

        <div class="condition-grid">
          <div>
            <span>設備</span>
            <strong>${evaluation.equipmentOperable ? "Operable" : "Stopped"}</strong>
          </div>
          <div>
            <span>材料</span>
            <strong>${evaluation.materialAvailable ? "Available" : "Shortage"}</strong>
          </div>
        </div>

        <section>
          <h3>Worker Requirement</h3>
          <div class="metric-grid">
            <div><span>Required</span><strong>${evaluation.workerRequirement.requiredWorkerCount}</strong></div>
            <div><span>Assigned</span><strong>${evaluation.workerRequirement.assignedWorkerCount}</strong></div>
            <div><span>Available</span><strong>${evaluation.workerRequirement.availableWorkerCount}</strong></div>
            <div><span>Shortage</span><strong>${evaluation.workerRequirement.shortageWorkerCount}</strong></div>
          </div>
        </section>

        <section>
          <h3>Skill Requirement</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Req</th>
                  <th>Avl</th>
                  <th>Alc</th>
                  <th>Short</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${requirementRows}</tbody>
            </table>
          </div>
        </section>

        <div class="detail-grid">
          <section>
            <h3>Allocations</h3>
            <ul>${allocations}</ul>
          </section>
          <section>
            <h3>Reasons</h3>
            <ul>${reasons}</ul>
          </section>
        </div>
      </article>
    `;
  }

  #formatReason(reason, findSkillName) {
    switch (reason.code) {
      case "EQUIPMENT_NOT_OPERABLE":
        return "設備が稼働可能状態ではありません。";
      case "MATERIAL_SHORTAGE":
        return "材料が利用可能ではありません。";
      case "WORKER_SHORTAGE":
        return `作業者が${reason.shortageWorkerCount}人不足しています。`;
      case "SKILL_REQUIREMENT_SHORTAGE":
        return `${findSkillName(reason.skillId)}を担当できる作業者が${reason.shortageCount}人不足しています。`;
      default:
        return reason.code;
    }
  }
}
