function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(value) {
  return String(value).replace("T", " ").slice(0, 16);
}

function percent(value) {
  return `${Math.round(Number(value) * 100)}%`;
}

const FACTORY_LABELS = {
  FULL: "FULL：全設備Capacity成立",
  PARTIAL: "PARTIAL：一部設備のみ成立",
  NONE: "NONE：成立設備なし"
};

const EQUIPMENT_LABELS = {
  AVAILABLE: "AVAILABLE",
  BLOCKED: "BLOCKED"
};

export class CapacityCalendarView {
  constructor({
    scenarioSelect,
    scenarioDescription,
    startAtInput,
    endAtInput,
    intervalInput,
    priorityContainer,
    summaryContainer,
    windowContainer,
    periodContainer,
    eventContainer,
    errorContainer
  }) {
    this.scenarioSelect = scenarioSelect;
    this.scenarioDescription = scenarioDescription;
    this.startAtInput = startAtInput;
    this.endAtInput = endAtInput;
    this.intervalInput = intervalInput;
    this.priorityContainer = priorityContainer;
    this.summaryContainer = summaryContainer;
    this.windowContainer = windowContainer;
    this.periodContainer = periodContainer;
    this.eventContainer = eventContainer;
    this.errorContainer = errorContainer;
  }

  renderScenarioOptions(scenarios, selectedId) {
    this.scenarioSelect.innerHTML = scenarios.map((scenario) => `
      <option value="${escapeHtml(scenario.scenarioId)}" ${scenario.scenarioId === selectedId ? "selected" : ""}>
        ${escapeHtml(scenario.label)}
      </option>
    `).join("");
  }

  renderScenario(scenario) {
    this.scenarioDescription.textContent = scenario.description;
    this.startAtInput.value = scenario.startAt.slice(0, 16);
    this.endAtInput.value = scenario.endAt.slice(0, 16);
    this.intervalInput.value = String(scenario.intervalMinutes);
    this.renderPriorityControls(scenario.equipment, scenario.priorities);
  }

  renderPriorityControls(equipment, priorities) {
    const values = new Map(priorities.map((item) => [item.equipmentId, item.value]));
    this.priorityContainer.innerHTML = equipment.map((item) => `
      <label>
        <span>${escapeHtml(item.name)}</span>
        <input
          class="priority-input"
          type="number"
          min="1"
          step="1"
          data-equipment-id="${escapeHtml(item.equipmentId)}"
          value="${escapeHtml(values.get(item.equipmentId))}">
      </label>
    `).join("");
  }

  getConditions() {
    return {
      startAt: this.startAtInput.value,
      endAt: this.endAtInput.value,
      intervalMinutes: Number(this.intervalInput.value),
      priorities: [...this.priorityContainer.querySelectorAll(".priority-input")]
        .map((input) => ({
          equipmentId: input.dataset.equipmentId,
          value: Number(input.value)
        }))
    };
  }

  bindBuild(handler) {
    document.querySelector("#buildButton")?.addEventListener("click", () => {
      handler(this.getConditions());
    });
  }

  bindScenarioChange(handler) {
    this.scenarioSelect.addEventListener("change", (event) => {
      handler(event.target.value);
    });
  }

  bindReset(handler) {
    document.querySelector("#resetButton")?.addEventListener("click", handler);
  }

  render(result) {
    this.errorContainer.hidden = true;
    const calendar = result.capacityCalendar;
    this.summaryContainer.innerHTML = `
      <div><span>Capacity Period</span><strong>${calendar.periodCount}</strong></div>
      <div><span>Capacity Window</span><strong>${calendar.windowCount}</strong></div>
      <div><span>対象時間</span><strong>${calendar.totalMinutes}分</strong></div>
      <div><span>設備Capacity時間</span><strong>${calendar.equipmentCapacityMinutes}設備・分</strong></div>
      <div><span>Source Event</span><strong>${result.sourceEventCount}</strong></div>
      <div><span>Derived Capacity Event</span><strong>${result.capacityEvents.length}</strong></div>
    `;

    this.windowContainer.innerHTML = calendar.windows.map((window, index) => `
      <article class="capacity-window state-${escapeHtml(window.factoryState.toLowerCase())}">
        <header>
          <div>
            <p class="window-number">Window ${index + 1}</p>
            <h3>${formatTime(window.timeSlot.startAt)} → ${formatTime(window.timeSlot.endAt)}</h3>
          </div>
          <span class="capacity-badge">${escapeHtml(FACTORY_LABELS[window.factoryState] ?? window.factoryState)}</span>
        </header>
        <div class="metric-grid">
          <div><span>Factory Capacity Units</span><strong>${window.factoryCapacityUnits}</strong></div>
          <div><span>Allocated Worker</span><strong>${window.allocatedWorkerCount}</strong></div>
          <div><span>統合Period数</span><strong>${window.periodCount}</strong></div>
        </div>
        <div class="equipment-capacity-grid">
          ${window.equipmentCapacities.map((item) => `
            <div class="equipment-capacity ${item.state.toLowerCase()}">
              <strong>${escapeHtml(item.equipmentName)}</strong>
              <span>${escapeHtml(EQUIPMENT_LABELS[item.state] ?? item.state)}</span>
              <small>Capacity ${item.capacityUnits} / Staffing ${percent(item.staffingRatio)}</small>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");

    this.periodContainer.innerHTML = calendar.periods.map((period) => `
      <article class="period-row">
        <div>
          <strong>${formatTime(period.timeSlot.startAt)} → ${formatTime(period.timeSlot.endAt)}</strong>
          <span>${period.timeSlot.durationMinutes}分</span>
        </div>
        <div>
          <strong>${escapeHtml(period.factoryCapacity.state)}</strong>
          <span>${period.factoryCapacity.capacityUnits} / ${period.factoryCapacity.totalEquipmentCount} 設備</span>
        </div>
        <div class="period-equipment-list">
          ${period.equipmentCapacities.map((item) => `
            <span class="mini-badge ${item.state.toLowerCase()}">
              ${escapeHtml(item.equipmentName)}：${item.capacityUnits}
            </span>
          `).join("")}
        </div>
      </article>
    `).join("");

    this.eventContainer.innerHTML = result.capacityEvents.map((item) => `
      <article class="event-row">
        <strong>${escapeHtml(item.type)}</strong>
        <span>${formatTime(item.occurredAt)}</span>
        <code>${escapeHtml(JSON.stringify(item.payload))}</code>
      </article>
    `).join("") || '<p class="empty-state">Capacity変化Eventはありません。</p>';
  }

  renderError(error) {
    this.errorContainer.hidden = false;
    this.errorContainer.innerHTML = `
      <strong>${escapeHtml(error.code ?? error.name ?? "ERROR")}</strong>
      <p>${escapeHtml(error.message)}</p>
    `;
  }
}
