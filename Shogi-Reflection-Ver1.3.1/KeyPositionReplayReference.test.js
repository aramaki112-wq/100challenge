import test from "node:test";
import assert from "node:assert/strict";
import { KeyPosition } from "./KeyPosition.js";
import { KeyPositionReplayReference } from "./KeyPositionReplayReference.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { ReplayPositionSnapshotFactory } from "./ReplayPositionSnapshotFactory.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";

const text = replayFixture("replay-basic.kif");
function reference() {
  const history = new PositionHistoryBuilder().build(new KifParser().parse({ text }));
  const service = new ShogiReplayApplicationService();
  service.load(history); service.jump(3);
  return KeyPositionReplayReference.create({
    sourceGameId: "REV-REF-001",
    sourceKifText: text,
    snapshot: new ReplayPositionSnapshotFactory().create({ replayState: service.getState() })
  });
}
function keyPosition(overrides = {}) {
  return new KeyPosition({
    keyPositionId: "KP-1", moveNumber: 3, moveText: "２二角成(88)", title: "角交換",
    fact: "角を取った。", interpretation: "攻めが続くと思った。", hypothesis: "守りを優先できた可能性がある。",
    replayReference: reference(), ...overrides
  });
}

test("KeyPositionとSnapshotを接続できる", () => assert.equal(keyPosition().replayReference.moveNumber, 3));
test("Snapshotなしの既存KeyPositionを扱える", () => assert.equal(keyPosition({ replayReference: null }).replayReference, null));
test("Source Game IDを保持できる", () => assert.equal(reference().sourceGameId, "REV-REF-001"));
test("Source KIF Fingerprintを保持できる", () => assert.match(reference().sourceKifFingerprint, /^FNV1A32-/));
test("Source KIF Moveを保持できる", () => assert.equal(reference().sourceKifMove.notation, "２二角成(88)"));
test("Snapshot Versionを保持できる", () => assert.equal(reference().snapshotVersion, 1));
test("Replay Warningなしを保持できる", () => assert.equal(reference().replayWarning, null));
test("同じSourceと一致判定できる", () => assert.equal(reference().matchesSource({ sourceGameId: "REV-REF-001", sourceKifText: text }), true));
test("異なるGame IDを不一致判定できる", () => assert.equal(reference().matchesSource({ sourceGameId: "OTHER", sourceKifText: text }), false));
test("異なるKIFを不一致判定できる", () => assert.equal(reference().matchesSource({ sourceGameId: "REV-REF-001", sourceKifText: `${text}\n#changed` }), false));
test("JSON SnapshotからReferenceを復元できる", () => assert.deepEqual(KeyPositionReplayReference.fromSnapshot(reference().toSnapshot()).toSnapshot(), reference().toSnapshot()));
test("不正Referenceを拒否できる", () => assert.throws(() => new KeyPositionReplayReference({ sourceGameId: "", sourceKifFingerprint: "x", snapshot: reference().snapshot })));
test("KeyPosition手数とSnapshot手数の不一致を拒否する", () => assert.throws(() => keyPosition({ moveNumber: 4 })));
test("旧Dataに新しい任意Fieldがなくても復元できる", () => {
  const old = { keyPositionId: "KP-OLD", moveNumber: 10, title: "旧局面", fact: "事実", interpretation: "解釈", hypothesis: "仮説" };
  const restored = new KeyPosition(old);
  assert.equal(restored.moveText, "");
  assert.equal(restored.replayReference, null);
});
