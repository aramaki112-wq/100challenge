export class FactoryAllocationView {
  constructor({
    scenarioSelect,
    scenarioDescription,
    targetTimeInput,
    priorityContainer,
    summaryContainer,
    equipmentContainer,
    allocationContainer,
    conflictContainer,
    errorContainer
  }) {
    this.scenarioSelect = scenarioSelect;
    this.scenarioDescription = scenarioDescription;
    this.targetTimeInput = targetTimeInput;
    this.priorityContainer = priorityContainer;
    this.summaryContainer = summaryContainer;
    this.equipmentContainer = equipmentContainer;
    this.allocationContainer = allocationContainer;
    this.conflictContainer = conflictContainer;
    this.errorContainer = errorContainer;
  }

  bindEvaluate(handler) {
    document.querySelector("#evaluateButton")
      .addEventListener("click", () => handler(this.getTargetTime()));
  }

  bindReset(handler) {
    document.querySelector("#resetButton")
      .addEventListener("click", handler);
  }

  bindScenarioChange(handler) {
    this.scenarioSelect.addEventListener("change", (event) =>
      handler(event.target.value)
    );
  }

  bindPriorityChange(handler) {
    document.querySelector("#applyPriorityButton")
      .addEventListener("click", () => handler(this.readPriorities()));
  }

  getTargetTime() {
    return this.targetTimeInput.value;
  }

  setTargetTime(value) {
    this.targetTimeInput.value = value.slice(0, 16);
  }

  renderScenarioOptions(scenarios, selectedScenarioId) {
    this.scenarioSelect.innerHTML = scenarios.map((scenario) => `
      <option
        value="${scenario.scenarioId}"
        ${scenario.scenarioId === selectedScenarioId ? "selected" : ""}
      >${scenario.label}</option>
    `).join("");
  }

  renderScenarioDescription(scenario) {
    this.scenarioDescription.textContent = scenario.description;
  }

  renderPriorityControls(equipment, priorities) {
    const priorityMap = new Map(
      priorities.map((priority) => [priority.equipmentId, priority.value])
    );
    this.priorityContainer.innerHTML = equipment.map((item) => `
      <label class="priority-field">
        <span>${item.name}</span>
        <input
          type="number"
          min="1"
          step="1"
          data-equipment-priority="${item.equipmentId}"
          value="${priorityMap.get(item.equipmentId) ?? 1}"
        >
      </label>
    `).join("");
  }

  readPriorities() {
    return [...this.priorityContainer.querySelectorAll(
      "[data-equipment-priority]"
    )].map((input) => ({
      equipmentId: input.dataset.equipmentPriority,
      value: Number(input.value)
    }));
  }

  render(result, findSkillName) {
    this.clearError();
    this.summaryContainer.innerHTML = `
      <div><span>評価時刻</span><strong>${result.targetTime}</strong></div>
      <div><span>稼働中（RUNNING）</span><strong>${result.summary.runningEquipmentCount}</strong></div>
      <div><span>停止（BLOCKED）</span><strong>${result.summary.blockedEquipmentCount}</strong></div>
      <div><span>配置済み作業者</span><strong>${result.summary.allocatedWorkerCount}</strong></div>
    `;
    this.equipmentContainer.innerHTML = result.equipmentResults
      .map((item) => this.renderEquipment(item, findSkillName))
      .join("");
    this.allocationContainer.innerHTML = result.workerAllocations.length === 0
      ? `<p class="empty-state">Allocationはありません。</p>`
      : result.workerAllocations.map((allocation) => `
          <article class="allocation-row">
            <strong>${allocation.workerId}</strong>
            <span>→</span>
            <strong>${allocation.equipmentId}</strong>
            <span>→</span>
            <strong>${allocation.roleType === "GENERAL"
              ? "一般作業（GENERAL）"
              : findSkillName(allocation.skillId)}</strong>
          </article>
        `).join("");
    this.conflictContainer.innerHTML = result.conflicts.length === 0
      ? `<p class="empty-state">Worker競合はありません。</p>`
      : result.conflicts.map((conflict) => `
          <article class="conflict-row">
            ${this.formatConflict(conflict)}
          </article>
        `).join("");
  }

  renderEquipment(item, findSkillName) {
    const requiredSkills = item.requiredSkills.length === 0
      ? "特定Skillなし"
      : item.requiredSkills
          .map((requirement) =>
            `${findSkillName(requirement.skillId)} × ${requirement.requiredCount}`
          )
          .join(" / ");
    const allocations = item.allocations.length === 0
      ? "なし"
      : item.allocations
          .map((allocation) =>
            `${allocation.workerId} → ${allocation.roleType === "GENERAL"
              ? "一般作業（GENERAL）"
              : findSkillName(allocation.skillId)}`
          )
          .join("<br>");
    const reasons = item.blockedReasons.length === 0
      ? "阻害理由なし"
      : item.blockedReasons
          .map((reason) => this.formatReason(reason, findSkillName))
          .join("<br>");
    return `
      <article class="equipment-card">
        <header class="equipment-header">
          <div>
            <p class="equipment-id">${item.equipmentId}</p>
            <h3>${item.equipmentName}</h3>
          </div>
          <span class="status-badge ${item.executionState === "RUNNING"
            ? "status-running"
            : "status-blocked"}">${item.executionState === "RUNNING" ? "稼働中（RUNNING）" : "停止（BLOCKED）"}</span>
        </header>
        <div class="metric-grid">
          <div><span>優先順位</span><strong>${item.priority}</strong></div>
          <div><span>必要人数</span><strong>${item.requiredWorkerCount}</strong></div>
          <div><span>候補人数</span><strong>${item.availableCandidateCount}</strong></div>
          <div><span>配置人数</span><strong>${item.allocatedWorkerCount}</strong></div>
        </div>
        <dl class="detail-list">
          <div><dt>単体評価</dt><dd>${item.individuallyExecutable ? "実行可能" : "実行不可"}</dd></div>
          <div><dt>必要Skill構成</dt><dd>${requiredSkills}</dd></div>
          <div><dt>配置作業者</dt><dd>${allocations}</dd></div>
          <div><dt>停止理由</dt><dd>${reasons}</dd></div>
        </dl>
      </article>
    `;
  }

  formatReason(reason, findSkillName) {
    switch (reason.code) {
      case "EQUIPMENT_NOT_OPERABLE":
        return "Equipmentが稼働可能状態ではありません。";
      case "MATERIAL_NOT_AVAILABLE":
        return "Materialが利用可能ではありません。";
      case "WORKER_COUNT_SHORTAGE":
        return `利用可能Workerが${reason.shortageWorkerCount ?? 1}人不足しています。`;
      case "SKILL_REQUIREMENT_SHORTAGE":
        return `${findSkillName(reason.skillId)}が${reason.shortageCount}人不足しています。`;
      case "WORKER_RESERVED_BY_OTHER_EQUIPMENT":
        return `${reason.workerId}は${reason.selectedEquipmentId}へReservationされています。`;
      case "HIGHER_PRIORITY_EQUIPMENT_SELECTED":
        return `高い優先順位（Priority）の${reason.selectedEquipmentId}が選択されました。`;
      case "STABLE_TIE_BREAK_APPLIED":
        return `同じ優先順位のため安定Tie-break（Stable Tie-break）で${reason.selectedEquipmentId}が選択されました。`;
      case "NO_GLOBAL_MATCHING":
        return "Factory全体で同時成立するMatchingがありません。";
      default:
        return reason.code;
    }
  }

  formatConflict(conflict) {
    const decision = conflict.decisionCode === "HIGHER_PRIORITY_EQUIPMENT_SELECTED"
      ? "優先順位（Priority）"
      : "安定Tie-break（Stable Tie-break）";
    return `${conflict.workerId}は${conflict.competingEquipmentIds.join("と")}の両方で必要です。${decision}により${conflict.selectedEquipmentId}へAllocationされました。`;
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
}
