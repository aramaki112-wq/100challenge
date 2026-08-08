import { deepFreeze } from "./Immutable.js";
import { HAND_PIECE_ORDER } from "./ShogiHand.js";
import { KEY_POSITION_REPLAY_ERROR_CODES, KeyPositionReplayError } from "./KeyPositionReplayErrors.js";

function invalid(message, context = {}) {
  throw new KeyPositionReplayError(
    KEY_POSITION_REPLAY_ERROR_CODES.KEY_POSITION_REPLAY_SNAPSHOT_INVALID,
    message,
    context
  );
}

export class HandSnapshot {
  constructor({ counts = {} } = {}) {
    if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
      invalid("Hand SnapshotのcountsはObjectである必要があります。");
    }
    const normalized = {};
    for (const type of HAND_PIECE_ORDER) {
      const count = Number(counts[type] ?? 0);
      if (!Number.isInteger(count) || count < 0 || count > 18) {
        invalid("Hand Snapshotの枚数が不正です。", { type, count });
      }
      normalized[type] = count;
    }
    this.counts = deepFreeze(normalized);
    deepFreeze(this);
  }

  static fromHand(hand) {
    if (!hand || typeof hand.count !== "function") {
      invalid("ShogiHandからHand Snapshotを作成できません。");
    }
    return new HandSnapshot({
      counts: Object.fromEntries(HAND_PIECE_ORDER.map((type) => [type, hand.count(type)]))
    });
  }

  static fromSnapshot(snapshot) {
    if (snapshot instanceof HandSnapshot) return snapshot;
    return new HandSnapshot(snapshot);
  }

  toSnapshot() {
    return deepFreeze({ counts: { ...this.counts } });
  }
}
