export const STEP_DEFINITIONS = Object.freeze([
  Object.freeze({ number: 1, label: "棋譜登録" }),
  Object.freeze({ number: 2, label: "対局情報" }),
  Object.freeze({ number: 3, label: "棋譜再現" }),
  Object.freeze({ number: 4, label: "重要局面" }),
  Object.freeze({ number: 5, label: "振り返り" }),
  Object.freeze({ number: 6, label: "次局への接続" }),
  Object.freeze({ number: 7, label: "最終レポート" })
]);

export class BrowserStepNavigation {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.current = 1;
    this.status = this.#required("step-current-status");
    this.select = this.#required("step-menu");
    this.previous = this.#required("step-previous");
    this.next = this.#required("step-next");
    this.progress = this.#required("step-progress-bar");
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要なStep Navigation要素がありません: #${id}`);
    return element;
  }

  goTo(stepNumber, { focus = false } = {}) {
    const target = Math.max(1, Math.min(STEP_DEFINITIONS.length, Number(stepNumber) || 1));
    this.current = target;
    for (const panel of this.document.querySelectorAll("[data-step-panel]")) {
      panel.hidden = Number(panel.dataset.stepPanel) !== target;
    }
    const def = STEP_DEFINITIONS[target - 1];
    this.status.textContent = `STEP ${target} / ${STEP_DEFINITIONS.length}　${def.label}`;
    this.status.setAttribute("aria-label", `現在のステップ ${target}、${def.label}`);
    this.select.value = String(target);
    this.progress.value = target;
    this.previous.disabled = target === 1;
    this.next.disabled = target === STEP_DEFINITIONS.length;
    this.previous.textContent = target === 1 ? "前のStep" : `${STEP_DEFINITIONS[target - 2].label}へ`;
    this.next.textContent = target === STEP_DEFINITIONS.length ? "次のStep" : `${STEP_DEFINITIONS[target].label}へ`;
    if (focus) this.status.focus({ preventScroll: true });
    return def;
  }

  nextStep() { return this.goTo(this.current + 1, { focus: true }); }
  previousStep() { return this.goTo(this.current - 1, { focus: true }); }
}
