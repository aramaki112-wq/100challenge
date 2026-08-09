import { deepFreeze } from "./Immutable.js";

function toLocalDateTimeValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("gameDateが不正です。");
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export class GameReviewEditMapper {
  toFormInput(snapshot = {}) {
    if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      throw new TypeError("GameReview Snapshotを指定してください。");
    }

    return deepFreeze({
      reviewId: snapshot.reviewId,
      gameDate: toLocalDateTimeValue(snapshot.gameDate),
      side: snapshot.side,
      result: snapshot.result,
      opponentName: snapshot.opponentName ?? "",
      senteName: snapshot.senteName ?? "",
      goteName: snapshot.goteName ?? "",
      timeControl: snapshot.timeControl ?? "",
      kifuText: snapshot.kifuText ?? "",
      gameStory: snapshot.gameStory ?? "",
      keyPositions: (snapshot.keyPositions ?? []).map((item) => ({
        ...item,
        replayReference: item.replayReference ? structuredClone(item.replayReference) : null
      })),
      decisionPattern: snapshot.decisionPattern ?? "",
      observationTheme: snapshot.observationTheme ?? "",
      actionRules: [...(snapshot.actionRules ?? [])],
      note: snapshot.note ?? "",
      workflowStatus: snapshot.workflowStatus,
      createdAt: snapshot.createdAt ?? null,
      updatedAt: snapshot.updatedAt ?? null
    });
  }
}
