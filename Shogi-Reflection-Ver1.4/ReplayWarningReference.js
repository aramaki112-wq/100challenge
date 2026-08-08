import { deepFreeze } from "./Immutable.js";

export class ReplayWarningReference {
  constructor({ code, message, moveNumber = null, replayableUntil = 0 } = {}) {
    if (typeof code !== "string" || code.trim() === "") throw new TypeError("Replay Warning codeは必須です。");
    if (typeof message !== "string" || message.trim() === "") throw new TypeError("Replay Warning messageは必須です。");
    if (moveNumber !== null && (!Number.isInteger(moveNumber) || moveNumber < 0)) throw new TypeError("Replay Warning moveNumberが不正です。");
    if (!Number.isInteger(replayableUntil) || replayableUntil < 0) throw new TypeError("Replay Warning replayableUntilが不正です。");
    this.code = code.trim();
    this.message = message.trim();
    this.moveNumber = moveNumber;
    this.replayableUntil = replayableUntil;
    deepFreeze(this);
  }

  static fromReplayWarning(warning) {
    if (!warning) return null;
    return new ReplayWarningReference({
      code: warning.code ?? "SHOGI_REPLAY_WARNING",
      message: warning.userMessage ?? warning.message ?? "棋譜再現にWarningがあります。",
      moveNumber: Number.isInteger(warning.moveNumber) ? warning.moveNumber : null,
      replayableUntil: Number.isInteger(warning.replayableUntil) ? warning.replayableUntil : 0
    });
  }

  static fromSnapshot(snapshot) {
    if (!snapshot) return null;
    if (snapshot instanceof ReplayWarningReference) return snapshot;
    return new ReplayWarningReference(snapshot);
  }

  toSnapshot() {
    return deepFreeze({
      code: this.code,
      message: this.message,
      moveNumber: this.moveNumber,
      replayableUntil: this.replayableUntil
    });
  }
}
