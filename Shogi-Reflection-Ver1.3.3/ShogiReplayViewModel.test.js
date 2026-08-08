import test from "node:test";
import assert from "node:assert/strict";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";

function setup(fileName = "replay-basic.kif") {
  const parsed = new KifParser().parse({ text: replayFixture(fileName) });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  const viewModel = new ShogiReplayViewModel();
  return { history, service, viewModel };
}

test("Positionを81Squareの盤面表示Dataへ変換できる", () => {
  const { service, viewModel } = setup();
  assert.equal(viewModel.create(service.getState()).squares.length, 81);
});

test("標準表示は9一から開始する", () => {
  const { service, viewModel } = setup();
  assert.equal(viewModel.create(service.getState()).squares[0].key, "91");
});

test("後手駒を標準表示で回転表示する", () => {
  const { service, viewModel } = setup();
  const model = viewModel.create(service.getState());
  assert.equal(model.squares.find((item) => item.key === "51").piece.rotated, true);
  assert.equal(model.squares.find((item) => item.key === "59").piece.rotated, false);
});

test("成駒を表示できる", () => {
  const { service, viewModel } = setup();
  service.jump(3);
  const model = viewModel.create(service.getState());
  const promoted = model.squares.find((item) => item.key === "22").piece;
  assert.equal(promoted.label, "馬");
  assert.equal(promoted.promoted, true);
});

test("持ち駒枚数を表示できる", () => {
  const { service, viewModel } = setup();
  service.jump(3);
  const model = viewModel.create(service.getState());
  assert.equal(model.senteHand.find((item) => item.type === "BISHOP").count, 1);
});

test("現在手を強調するDataを作成できる", () => {
  const { service, viewModel } = setup();
  service.jump(3);
  const model = viewModel.create(service.getState());
  assert.equal(model.moves.find((item) => item.moveNumber === 3).current, true);
});

test("Button有効無効状態を作成できる", () => {
  const { service, viewModel } = setup();
  const first = viewModel.create(service.getState());
  assert.equal(first.canPrevious, false);
  assert.equal(first.canNext, true);
  service.last();
  const last = viewModel.create(service.getState());
  assert.equal(last.canPrevious, true);
  assert.equal(last.canNext, false);
});

test("現在手数・現在指し手・直前指し手を表示できる", () => {
  const { service, viewModel } = setup();
  service.jump(3);
  const model = viewModel.create(service.getState());
  assert.equal(model.currentMoveNumber, 3);
  assert.equal(model.currentMoveText, "２二角成(88)");
  assert.equal(model.previousMoveText, "３四歩(33)");
});

test("先手後手の手番表示を作成できる", () => {
  const { service, viewModel } = setup();
  assert.equal(viewModel.create(service.getState()).sideToMoveLabel, "先手番");
  service.next();
  assert.equal(viewModel.create(service.getState()).sideToMoveLabel, "後手番");
});

test("最終移動元と移動先を表示Dataへ含める", () => {
  const { service, viewModel } = setup();
  service.jump(1);
  const model = viewModel.create(service.getState());
  assert.equal(model.squares.find((item) => item.key === "77").isLastFrom, true);
  assert.equal(model.squares.find((item) => item.key === "76").isLastTo, true);
});

test("盤面反転で表示順だけを変える", () => {
  const { service, viewModel } = setup();
  const standard = viewModel.create(service.getState());
  service.toggleFlip();
  const flipped = viewModel.create(service.getState());
  assert.equal(standard.squares[0].key, "91");
  assert.equal(flipped.squares[0].key, "19");
  assert.equal(service.getState().position.board.pieceAt("59").label, "玉");
});

test("反転後は先手駒を回転表示する", () => {
  const { service, viewModel } = setup();
  service.toggleFlip();
  const model = viewModel.create(service.getState());
  assert.equal(model.squares.find((item) => item.key === "59").piece.rotated, true);
});

test("Parser Warningを表示Dataへ保持する", () => {
  const warningKif = [
    "手合割：平手",
    "先手：A",
    "後手：B",
    "1 ７六歩(77)"
  ].join("\n");
  const parsed = new KifParser().parse({ text: warningKif });
  const history = new PositionHistoryBuilder().build(parsed);
  const service = new ShogiReplayApplicationService();
  service.load(history);
  const model = new ShogiReplayViewModel().create(service.getState());
  assert.ok(model.warnings.length >= 1);
});

test("途中Replay失敗をWarning表示Dataへ保持する", () => {
  const { service, viewModel } = setup("replay-partial-invalid.kif");
  const model = viewModel.create(service.getState());
  assert.equal(model.status, "PARTIAL");
  assert.equal(model.failure.moveNumber, 3);
  assert.equal(model.failure.replayableUntil, 2);
});

test("Ver.1.3接続用のBoard・Hand・Source KIF Moveを取得できる", () => {
  const { service, viewModel } = setup();
  service.jump(1);
  const model = viewModel.create(service.getState());
  assert.equal(model.boardState, service.getState().position.board);
  assert.equal(model.handState, service.getState().position.hands);
  assert.equal(model.sourceKifMove.notation, "７六歩(77)");
});

test("Current Move IDを安定したDOM IDとして生成できる", () => {
  const { service, viewModel } = setup();
  service.jump(3);
  const model = viewModel.create(service.getState());
  assert.equal(model.currentMoveId, "replay-move-3");
  assert.equal(model.moves.find((item) => item.moveNumber === 3).id, "replay-move-3");
});

test("Current Move HighlightとMove List Scroll Targetを同じ手数へ向ける", () => {
  const { service, viewModel } = setup();
  service.jump(4);
  const model = viewModel.create(service.getState());
  assert.equal(model.moves.filter((item) => item.current).length, 1);
  assert.equal(model.moves.find((item) => item.current).id, model.moveListScrollTarget.currentMoveId);
});

test("Move List Scroll TargetはPage Scrollを要求しない", () => {
  const { service, viewModel } = setup();
  const model = viewModel.create(service.getState());
  assert.deepEqual(model.moveListScrollTarget, {
    currentMoveId: "replay-move-0",
    scope: "MOVE_LIST_CONTAINER",
    pageScroll: "NONE"
  });
});

test("盤面反転してもMove List Scroll Targetは変化しない", () => {
  const { service, viewModel } = setup();
  service.jump(3);
  const standard = viewModel.create(service.getState());
  service.toggleFlip();
  const flipped = viewModel.create(service.getState());
  assert.equal(standard.currentMoveId, flipped.currentMoveId);
  assert.deepEqual(standard.moveListScrollTarget, flipped.moveListScrollTarget);
});
