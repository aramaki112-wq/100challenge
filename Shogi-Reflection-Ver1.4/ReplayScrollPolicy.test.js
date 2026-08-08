import test from "node:test";
import assert from "node:assert/strict";
import { ReplayScrollPolicy } from "./ReplayScrollPolicy.js";

function rect(top, bottom) {
  return { top, bottom, height: bottom - top };
}

function fakeElement({ top, bottom, scrollTop = 0 } = {}) {
  return {
    scrollTop,
    getBoundingClientRect() { return rect(top, bottom); }
  };
}

test("現在手TargetはMove List Container内だけを要求する", () => {
  const policy = new ReplayScrollPolicy();
  assert.deepEqual(policy.createTarget("replay-move-42"), {
    currentMoveId: "replay-move-42",
    scope: "MOVE_LIST_CONTAINER",
    pageScroll: "NONE"
  });
});

test("現在手がContainer内に見えていればScrollしない", () => {
  const policy = new ReplayScrollPolicy({ edgePadding: 10 });
  assert.equal(policy.isItemVisible({
    containerRect: rect(100, 300),
    itemRect: rect(130, 170)
  }), true);
});

test("現在手がContainer下端より外ならContainer scrollTopだけを増やす", () => {
  const policy = new ReplayScrollPolicy({ edgePadding: 10 });
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 120 });
  const item = fakeElement({ top: 310, bottom: 350 });
  const result = policy.followCurrentMove({ container, item });
  assert.equal(result.status, "SCROLLED_WITHIN_MOVE_LIST");
  assert.equal(container.scrollTop, 180);
  assert.equal(result.pageScrollRequested, false);
});

test("現在手がContainer上端より外ならContainer scrollTopだけを減らす", () => {
  const policy = new ReplayScrollPolicy({ edgePadding: 10 });
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 120 });
  const item = fakeElement({ top: 70, bottom: 110 });
  const result = policy.followCurrentMove({ container, item });
  assert.equal(container.scrollTop, 80);
  assert.equal(result.pageScrollRequested, false);
});

test("次へ相当の追従はPage Scroll要求を生成しない", () => {
  const policy = new ReplayScrollPolicy();
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 0 });
  const item = fakeElement({ top: 310, bottom: 350 });
  assert.equal(policy.followCurrentMove({ container, item }).pageScrollRequested, false);
});

test("前へ相当の追従はPage Scroll要求を生成しない", () => {
  const policy = new ReplayScrollPolicy();
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 200 });
  const item = fakeElement({ top: 60, bottom: 100 });
  assert.equal(policy.followCurrentMove({ container, item }).pageScrollRequested, false);
});

test("最初へ相当の追従でもContainer外へのScroll要求を出さない", () => {
  const policy = new ReplayScrollPolicy();
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 800 });
  const item = fakeElement({ top: -700, bottom: -660 });
  const result = policy.followCurrentMove({ container, item });
  assert.equal(result.pageScrollRequested, false);
  assert.ok(container.scrollTop < 800);
});

test("最後へ相当の追従でもContainer外へのScroll要求を出さない", () => {
  const policy = new ReplayScrollPolicy();
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 0 });
  const item = fakeElement({ top: 1200, bottom: 1240 });
  const result = policy.followCurrentMove({ container, item });
  assert.equal(result.pageScrollRequested, false);
  assert.ok(container.scrollTop > 0);
});

test("Keyboard Navigation相当も同じContainer Policyを再利用できる", () => {
  const policy = new ReplayScrollPolicy();
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 40 });
  const item = fakeElement({ top: 150, bottom: 190 });
  const result = policy.followCurrentMove({ container, item });
  assert.equal(result.status, "VISIBLE");
  assert.equal(result.pageScrollRequested, false);
});

test("Scroll Containerが無い場合も例外化せずData変更を要求しない", () => {
  const result = new ReplayScrollPolicy().followCurrentMove({ container: null, item: null });
  assert.equal(result.status, "NO_CONTAINER");
  assert.equal(result.pageScrollRequested, false);
});

test("Current Move Itemが無い場合も例外化せずData変更を要求しない", () => {
  const container = fakeElement({ top: 100, bottom: 300, scrollTop: 20 });
  const result = new ReplayScrollPolicy().followCurrentMove({ container, item: null });
  assert.equal(result.status, "NO_ITEM");
  assert.equal(container.scrollTop, 20);
});
