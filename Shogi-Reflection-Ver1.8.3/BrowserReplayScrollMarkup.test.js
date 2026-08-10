import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const view = readFileSync(new URL("./BrowserShogiReplayView.js", import.meta.url), "utf8");
const policy = readFileSync(new URL("./ReplayScrollPolicy.js", import.meta.url), "utf8");
const main = readFileSync(new URL("./main.js", import.meta.url), "utf8");
const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
const formView = readFileSync(new URL("./BrowserGameReviewFormView.js", import.meta.url), "utf8");

test("現在手追従にscrollIntoViewを使わずReplayScrollPolicyを使う", () => {
  assert.match(view, /ReplayScrollPolicy/);
  assert.match(view, /followCurrentMove/);
  assert.doesNotMatch(view, /querySelector\("\.is-current"\)\?\.scrollIntoView/);
});

test("ReplayScrollPolicyはwindow scrollを変更しない", () => {
  assert.doesNotMatch(policy, /window\.scrollTo|window\.scrollBy|scrollIntoView/);
  assert.match(policy, /container\.scrollTop = nextScrollTop/);
});

test("Move List JumpもPage全体を移動させない", () => {
  const block = main.match(/replay-move-list[\s\S]*?\n\}\);/)?.[0] ?? "";
  assert.match(block, /replayController\.jump/);
  assert.doesNotMatch(block, /scrollIntoView|window\.scrollTo|window\.scrollBy/);
});

test("Navigation Buttonは48px以上のTouch Targetを持つ", () => {
  assert.match(css, /replay-navigation[\s\S]*min-height:48px/);
});

test("390px相当ではNavigationをWrapし盤面直下で5操作を維持する", () => {
  assert.match(css, /@media \(max-width:430px\)[\s\S]*replay-navigation[\s\S]*repeat\(3,minmax\(0,1fr\)\)/);
});

test("重要局面追加成功FeedbackはReplayからFocusを奪わない", () => {
  assert.match(main, /現在局面を重要局面候補へ追加しました[\s\S]*focus: false/);
  assert.match(formView, /showFeedback\(\{ kind = "info", title, message, details = \[\], focus = true \}\)/);
});

test("重複局面FocusはpreventScrollで二重Scrollを避ける", () => {
  assert.match(formView, /focus\(\{ preventScroll: true \}\)/);
});
