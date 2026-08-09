import test from "node:test";
import assert from "node:assert/strict";
import { ReviewIdGenerator } from "./ReviewIdGenerator.js";
import { FixedClock } from "./TestFixtures.js";

test("日時とSuffixから追跡可能なReview IDを生成する", () => {
  const generator = new ReviewIdGenerator({ clock: new FixedClock("2026-08-02T12:45:30.000Z"), random: () => 0.5 });
  assert.equal(generator.generate(), "REV-20260802-124530-8000");
});

test("生成されたReview IDは毎回新しいSuffixを利用できる", () => {
  const values = [0.1, 0.2];
  const generator = new ReviewIdGenerator({ clock: new FixedClock("2026-08-02T12:45:30.000Z"), random: () => values.shift() });
  assert.notEqual(generator.generate(), generator.generate());
});
