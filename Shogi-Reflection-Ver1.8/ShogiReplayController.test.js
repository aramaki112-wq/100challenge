import test from "node:test";
import assert from "node:assert/strict";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayController } from "./ShogiReplayController.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";

class FakeReplayView {
  constructor() {
    this.models = [];
    this.errors = [];
    this.unavailable = [];
    this.pageScrollRequests = 0;
  }
  render(model) { this.models.push(model); }
  renderError(error) { this.errors.push(error); }
  showUnavailable(message) { this.unavailable.push(message); }
  scrollIntoView() { this.pageScrollRequests += 1; }
}

function setup() {
  const view = new FakeReplayView();
  const controller = new ShogiReplayController({
    parser: new KifParser(),
    historyBuilder: new PositionHistoryBuilder(),
    replayService: new ShogiReplayApplicationService(),
    viewModel: new ShogiReplayViewModel(),
    view
  });
  return { controller, view };
}

test("KIF Textを読み込み初期局面を描画する", () => {
  const { controller, view } = setup();
  const result = controller.loadKifText(replayFixture("replay-basic.kif"));
  assert.equal(result.status, "FULL");
  assert.equal(view.models.at(-1).currentMoveNumber, 0);
});

test("Ver.1.1 KifParserへObject引数で接続する", () => {
  const calls = [];
  const view = new FakeReplayView();
  const controller = new ShogiReplayController({
    parser: {
      parse(input) {
        calls.push(input);
        return new KifParser().parse(input);
      }
    },
    historyBuilder: new PositionHistoryBuilder(),
    replayService: new ShogiReplayApplicationService(),
    viewModel: new ShogiReplayViewModel(),
    view
  });
  controller.loadKifText(replayFixture("replay-basic.kif"));
  assert.equal(typeof calls[0], "object");
  assert.match(calls[0].text, /手合割：平手/);
});

test("次へ操作をViewへ反映する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.next();
  assert.equal(view.models.at(-1).currentMoveNumber, 1);
});

test("前へ操作をViewへ反映する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.next();
  controller.previous();
  assert.equal(view.models.at(-1).currentMoveNumber, 0);
});

test("最後へ操作をViewへ反映する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.last();
  assert.equal(view.models.at(-1).currentMoveNumber, 5);
});

test("最初へ操作をViewへ反映する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.last();
  controller.first();
  assert.equal(view.models.at(-1).currentMoveNumber, 0);
});

test("JumpをViewへ反映する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.jump(3);
  assert.equal(view.models.at(-1).currentMoveNumber, 3);
});

test("範囲外Jumpは利用者向けErrorへ変換する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  assert.equal(controller.jump(99), null);
  assert.equal(view.errors.at(-1).code, "SHOGI_REPLAY_JUMP_OUT_OF_RANGE");
});

test("盤面反転をViewへ反映する", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.toggleFlip();
  assert.equal(view.models.at(-1).flipped, true);
});

test("未対応手合割をReplay拒否として表示する", () => {
  const { controller, view } = setup();
  const result = controller.loadKifText(
    replayFixture("replay-unsupported-handicap.kif")
  );
  assert.equal(result.status, "REJECTED");
  assert.equal(view.errors.at(-1).code, "SHOGI_INITIAL_POSITION_UNSUPPORTED");
});

test("手合割HeaderなしをReplay拒否として表示する", () => {
  const { controller, view } = setup();
  const result = controller.loadKifText(
    replayFixture("replay-missing-handicap.kif")
  );
  assert.equal(result.status, "REJECTED");
  assert.equal(view.errors.at(-1).code, "SHOGI_INITIAL_POSITION_UNSUPPORTED");
});

test("途中失敗でも再現可能範囲を描画する", () => {
  const { controller, view } = setup();
  const result = controller.loadKifText(
    replayFixture("replay-partial-invalid.kif")
  );
  assert.equal(result.status, "PARTIAL");
  assert.equal(view.models.at(-1).maxMoveNumber, 2);
  assert.equal(view.models.at(-1).failure.moveNumber, 3);
});

test("棋譜Textなしは空盤を出さず理由を表示する", () => {
  const { controller, view } = setup();
  const result = controller.loadKifText("");
  assert.equal(result.status, "REJECTED");
  assert.equal(view.unavailable.length, 1);
  assert.match(view.unavailable[0], /棋譜Text/);
});

test("Parser Errorを低レベルErrorと利用者Messageへ分離する", () => {
  const { controller, view } = setup();
  controller.loadKifText("not kif");
  assert.equal(view.errors.length, 1);
  assert.equal(view.errors[0].code, "SHOGI_MOVE_PARSE_FAILED");
  assert.match(view.errors[0].message, /安全に読み取れません/);
});


test("Replay Navigation ControllerはPage Scrollを要求しない", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.next();
  controller.previous();
  controller.last();
  controller.first();
  controller.jump(3);
  controller.toggleFlip();
  assert.equal(view.pageScrollRequests, 0);
});

test("Replay Navigation ErrorでもPage Scrollや保存を要求しない", () => {
  const { controller, view } = setup();
  controller.loadKifText(replayFixture("replay-basic.kif"));
  controller.jump(999);
  assert.equal(view.pageScrollRequests, 0);
  assert.equal(view.errors.at(-1).code, "SHOGI_REPLAY_JUMP_OUT_OF_RANGE");
});
