import { deepFreeze } from "./Immutable.js";

function display(value, fallback = "取得できませんでした") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function winnerLabel(winner, terminationReason) {
  if (winner === "SENTE") return "先手の勝ち";
  if (winner === "GOTE") return "後手の勝ち";
  if (["千日手", "持将棋"].includes(terminationReason)) return "引き分け";
  if (terminationReason === "中断") return "中断";
  return "取得できませんでした";
}

export class KifImportPreviewPresenter {
  present({ dto, compatibility } = {}) {
    const firstMove = dto.moves[0];
    const lastMove = dto.moves.at(-1);
    return deepFreeze({
      fileName: display(dto.sourceFileName),
      encoding: display(dto.encoding),
      playedAt: display(dto.playedAt),
      senteName: display(dto.senteName),
      goteName: display(dto.goteName),
      eventName: display(dto.eventName),
      place: display(dto.place),
      handicap: display(dto.handicap),
      timeControl: display(dto.timeControl),
      result: winnerLabel(dto.winner, dto.terminationReason),
      terminationReason: display(dto.terminationReason),
      totalMoves: dto.totalMoves,
      warningCount: dto.warnings.length,
      warnings: dto.warnings,
      summary: firstMove && lastMove
        ? `${firstMove.moveNumber}手目 ${firstMove.notation} から ${lastMove.moveNumber}手目 ${lastMove.notation} まで`
        : "指し手概要を作成できませんでした。",
      sourceCompatibility: compatibility?.source ?? "GENERIC_KIF",
      compatibilityNotes: compatibility?.notes ?? []
    });
  }
}
