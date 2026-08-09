import test from "node:test";
import assert from "node:assert/strict";
import { BrowserStepNavigation, STEP_DEFINITIONS } from "./BrowserStepNavigation.js";

function element(extra = {}) {
  return {
    hidden: false, disabled: false, value: "", textContent: "", dataset: {}, attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    focus(options) { this.focusedWith = options; },
    ...extra
  };
}

function harness() {
  const ids = {
    "step-current-status": element(), "step-menu": element(), "step-previous": element(),
    "step-next": element(), "step-progress-bar": element()
  };
  const panels = Array.from({ length: 7 }, (_, index) => element({ dataset: { stepPanel: String(index + 1) } }));
  const doc = { getElementById: (id) => ids[id] ?? null, querySelectorAll: () => panels };
  return { nav: new BrowserStepNavigation({ documentObject: doc }), ids, panels };
}

test("Step定義は7段階で責務名を保持する", () => {
  assert.deepEqual(STEP_DEFINITIONS.map((item) => item.label), ["棋譜登録", "対局情報", "棋譜再現", "重要局面", "振り返り", "次局への接続", "最終レポート"]);
});

test("STEP1からSTEP2へ移動できる", () => {
  const { nav, panels } = harness();
  nav.goTo(1);
  nav.nextStep();
  assert.equal(nav.current, 2);
  assert.equal(panels[1].hidden, false);
  assert.equal(panels[0].hidden, true);
});

test("STEP2からSTEP3へ移動できる", () => {
  const { nav } = harness();
  nav.goTo(2);
  nav.nextStep();
  assert.equal(nav.current, 3);
});

test("前のStepへ戻れる", () => {
  const { nav } = harness();
  nav.goTo(4);
  nav.previousStep();
  assert.equal(nav.current, 3);
});

test("Step移動はDOM表示だけを変えForm Dataを持たない", () => {
  const source = BrowserStepNavigation.prototype.goTo.toString();
  assert.equal(source.includes("FormData"), false);
  assert.equal(source.includes("reset("), false);
});

test("現在Stepをaria-labelで読み上げられる", () => {
  const { nav, ids } = harness();
  nav.goTo(3);
  assert.match(ids["step-current-status"].attrs["aria-label"], /現在のステップ 3、棋譜再現/);
});
