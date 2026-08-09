import test from "node:test";
import assert from "node:assert/strict";
import { AddCurrentPositionToKeyPosition } from "./AddCurrentPositionToKeyPosition.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

function setup() {
  const kifuText = replayFixture("replay-capture-promote.kifu");
  const parsed = new KifParser().parse({ text: kifuText });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  return { kifuText, service, add: new AddCurrentPositionToKeyPosition() };
}

test("Engine Candidateも手動Replayも同じKeyPosition candidateへ変換される", () => {
  const { kifuText, service, add } = setup();
  const state = service.jump(3);
  const result = add.execute({ replayState: state, existingKeyPositions: [], sourceGameId: "G-1", sourceKifText: kifuText });
  assert.equal(result.status, "CANDIDATE_ADDED");
  assert.equal(result.candidate.moveNumber, 3);
  assert.equal(result.candidate.fact, "");
  assert.equal(result.candidate.interpretation, "");
  assert.equal(result.candidate.hypothesis, "");
  assert.equal(result.candidate.replayAdded, true);
});

test("Candidate由来でも同一手数Duplicate Ruleを回避しない", () => {
  const { kifuText, service, add } = setup();
  const state = service.jump(3);
  const first = add.execute({ replayState: state, existingKeyPositions: [], sourceGameId: "G-1", sourceKifText: kifuText });
  assert.throws(() => add.execute({ replayState: state, existingKeyPositions: [first.candidate], sourceGameId: "G-1", sourceKifText: kifuText }), /同じ手数/);
});

test("Candidate由来でも5件上限を回避しない", () => {
  const { kifuText, service, add } = setup();
  const existing = Array.from({ length: 5 }, (_, index) => ({ keyPositionId: `KP-${index+1}`, moveNumber: index + 10, title: `x${index}` }));
  assert.throws(() => add.execute({ replayState: service.jump(3), existingKeyPositions: existing, sourceGameId: "G-1", sourceKifText: kifuText }), /5件登録済み/);
});
