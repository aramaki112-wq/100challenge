import test from "node:test";
import assert from "node:assert/strict";
import { EngineEvaluationGraphModel, ENGINE_GRAPH_POINT_KIND } from "./EngineEvaluationGraphModel.js";
import { EngineEvaluationGraphView } from "./EngineEvaluationGraphView.js";
import { ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { ENGINE_CANDIDATE_GROUP } from "./EngineCandidateSelector.js";

const cp = (centipawns) => ({ type: ENGINE_EVALUATION_TYPE.CP, centipawns, perspective: "VIEWER" });
const mate = (mateIn) => ({ type: ENGINE_EVALUATION_TYPE.MATE, mateIn, perspective: "VIEWER" });

test("Evaluation Graphはall plyを保持し本人視点CP/Mate/Unknownを分離する", () => {
  const model = new EngineEvaluationGraphModel({ cpClamp: 1000 }).create({
    evaluationTimeline: [
      { ply: 0, evaluation: cp(20) },
      { ply: 1, evaluation: cp(1600) },
      { ply: 2, evaluation: mate(3) },
      { ply: 3, evaluation: mate(-2) },
      { ply: 4, evaluation: { type: "UNKNOWN", perspective: "VIEWER" } }
    ]
  });
  assert.equal(model.points.length, 5);
  assert.equal(model.points[1].plotCp, 1000);
  assert.equal(model.points[2].kind, ENGINE_GRAPH_POINT_KIND.MATE_FOR);
  assert.equal(model.points[3].kind, ENGINE_GRAPH_POINT_KIND.MATE_AGAINST);
  assert.equal(model.points[4].kind, ENGINE_GRAPH_POINT_KIND.UNKNOWN);
  assert.equal(model.points[2].evaluation.mateIn, 3);
});

test("Evaluation GraphはGood/Bad/KeyPosition markerを同一plyへ重ねられる", () => {
  const model = new EngineEvaluationGraphModel().create({
    evaluationTimeline: [0, 1, 2, 3].map((ply) => ({ ply, evaluation: cp(ply * 10) })),
    goodCandidates: [{ ply: 1, candidateGroup: ENGINE_CANDIDATE_GROUP.GOOD }],
    badCandidates: [{ ply: 2, candidateGroup: ENGINE_CANDIDATE_GROUP.BAD }],
    keyPositions: [{ keyPositionId: "KP-1", moveNumber: "2" }]
  });
  assert.equal(model.points[1].candidateGroup, ENGINE_CANDIDATE_GROUP.GOOD);
  assert.equal(model.points[2].candidateGroup, ENGINE_CANDIDATE_GROUP.BAD);
  assert.equal(model.points[2].keyPosition.keyPositionId, "KP-1");
  assert.equal(model.keyPositionMarkerCount, 1);
});

test("Evaluation Graph ViewはCandidate→ReplayとKeyPosition→STEP4用data属性を出す", () => {
  const html = new EngineEvaluationGraphView().render({
    evaluationTimeline: [
      { ply: 0, evaluation: cp(0) },
      { ply: 1, evaluation: cp(-300) },
      { ply: 2, evaluation: mate(-3) }
    ],
    badCandidates: [{ ply: 1, candidateGroup: ENGINE_CANDIDATE_GROUP.BAD }],
    keyPositions: [{ keyPositionId: "KP-1", moveNumber: "2" }]
  });
  assert.match(html, /data-engine-graph-replay-ply="1"/);
  assert.match(html, /data-engine-graph-key-position-ply="2"/);
  assert.match(html, /data-key-position-index="0"/);
  assert.match(html, /Mate/);
  assert.doesNotMatch(html, /99999/);
});

test("Evaluation Graphは0手目の手動KeyPositionもMarker化できる", () => {
  const model = new EngineEvaluationGraphModel().create({
    evaluationTimeline: [{ ply: 0, evaluation: cp(0) }, { ply: 1, evaluation: cp(20) }],
    keyPositions: [{ keyPositionId: "KP-INITIAL", moveNumber: 0 }]
  });
  assert.equal(model.keyPositionMarkerCount, 1);
  assert.equal(model.points[0].keyPosition.keyPositionId, "KP-INITIAL");
  const html = new EngineEvaluationGraphView().render({
    evaluationTimeline: [{ ply: 0, evaluation: cp(0) }, { ply: 1, evaluation: cp(20) }],
    keyPositions: [{ keyPositionId: "KP-INITIAL", moveNumber: 0 }]
  });
  assert.match(html, /data-engine-graph-key-position-ply="0"/);
});

test("Mate/Unknownを跨いでCP線を直結しない", () => {
  const html = new EngineEvaluationGraphView().render({
    evaluationTimeline: [
      { ply: 0, evaluation: cp(0) },
      { ply: 1, evaluation: cp(50) },
      { ply: 2, evaluation: { type: "MATE", mateIn: 3, perspective: "VIEWER" } },
      { ply: 3, evaluation: cp(-100) },
      { ply: 4, evaluation: cp(-80) }
    ]
  });
  assert.equal((html.match(/<polyline class="engine-graph-line"/g) ?? []).length, 2);
});
