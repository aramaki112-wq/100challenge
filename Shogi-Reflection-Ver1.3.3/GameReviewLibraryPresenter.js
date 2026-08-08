import { deepFreeze } from "./Immutable.js";

const SIDE_LABELS = Object.freeze({ SENTE: "先手", GOTE: "後手" });
const RESULT_LABELS = Object.freeze({ WIN: "勝ち", LOSS: "負け", DRAW: "引き分け", UNKNOWN: "未設定" });

function displayDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return String(isoDate ?? "");
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function excerpt(value, maxLength = 80) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

function requireSnapshot(snapshot) {
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("GameReview Snapshotを指定してください。");
  }
  return snapshot;
}

export class GameReviewLibraryPresenter {
  presentList(gameReviews = []) {
    if (!Array.isArray(gameReviews)) throw new TypeError("gameReviewsは配列で指定してください。");

    const items = [...gameReviews]
      .map((snapshot) => {
        const source = requireSnapshot(snapshot);
        return {
          reviewId: source.reviewId,
          gameDate: source.gameDate,
          displayDate: displayDate(source.gameDate),
          sideLabel: SIDE_LABELS[source.side] ?? source.side,
          resultLabel: RESULT_LABELS[source.result] ?? source.result,
          opponentLabel: source.opponentName || "対局相手未記入",
          timeControlLabel: source.timeControl || "持ち時間未記入",
          storyExcerpt: excerpt(source.gameStory || source.decisionPattern || source.kifuText),
          keyPositionCount: Array.isArray(source.keyPositions) ? source.keyPositions.length : 0,
          actionRuleCount: Array.isArray(source.actionRules) ? source.actionRules.length : 0,
          readyForNextGame: Boolean(source.readyForNextGame)
        };
      })
      .sort((left, right) => new Date(right.gameDate).getTime() - new Date(left.gameDate).getTime());

    return deepFreeze({ status: items.length ? "FOUND" : "EMPTY", count: items.length, items });
  }

  presentDetail(snapshot) {
    const source = requireSnapshot(snapshot);
    return deepFreeze({
      reviewId: source.reviewId,
      gameDate: source.gameDate,
      displayDate: displayDate(source.gameDate),
      sideLabel: SIDE_LABELS[source.side] ?? source.side,
      resultLabel: RESULT_LABELS[source.result] ?? source.result,
      opponentLabel: source.opponentName || "対局相手未記入",
      timeControlLabel: source.timeControl || "持ち時間未記入",
      kifuText: source.kifuText,
      gameStory: source.gameStory,
      keyPositions: (source.keyPositions ?? []).map((item, index) => ({ ...item, displayNumber: index + 1 })),
      decisionPattern: source.decisionPattern,
      observationTheme: source.observationTheme,
      actionRules: [...(source.actionRules ?? [])],
      note: source.note,
      readyForNextGame: Boolean(source.readyForNextGame),
      missingReflectionItems: [...(source.missingReflectionItems ?? [])]
    });
  }
}
