import { deepFreeze } from "./Immutable.js";
import { inferWorkflowStatus, workflowStatusView } from "./ReflectionWorkflowStatus.js";

const SIDE_LABELS = Object.freeze({ SENTE: "先手", GOTE: "後手" });
const RESULT_LABELS = Object.freeze({ WIN: "勝ち", LOSS: "負け", DRAW: "引き分け", UNKNOWN: "未設定" });

function displayDate(isoDate, empty = "記録なし") {
  if (!isoDate) return empty;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return String(isoDate ?? empty);
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

const KIF_TERMINATION_WORDS = /^(投了|中断|千日手|持将棋|詰み|切れ負け|反則勝ち|反則負け|入玉勝ち|不戦勝|不戦敗|最大手数)/;

export function countKifMoves(kifuText) {
  const lines = String(kifuText ?? "").split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+([^\s]+)/);
    if (!match || KIF_TERMINATION_WORDS.test(match[2])) continue;
    const n = Number(match[1]);
    if (Number.isInteger(n) && n > count) count = n;
  }
  return count;
}

export class GameReviewLibraryPresenter {
  presentList(gameReviews = []) {
    if (!Array.isArray(gameReviews)) throw new TypeError("gameReviewsは配列で指定してください。");

    const items = [...gameReviews]
      .map((snapshot) => {
        const source = requireSnapshot(snapshot);
        const workflow = workflowStatusView(source.workflowStatus ?? inferWorkflowStatus(source));
        return {
          reviewId: source.reviewId,
          gameDate: source.gameDate,
          displayDate: displayDate(source.gameDate),
          sideLabel: SIDE_LABELS[source.side] ?? source.side,
          resultLabel: RESULT_LABELS[source.result] ?? source.result,
          opponentLabel: source.opponentName || (source.side === "SENTE" ? source.goteName : source.senteName) || "対局相手未記入",
          timeControlLabel: source.timeControl || "対局種別未記入",
          storyExcerpt: excerpt(source.gameStory || source.decisionPattern || source.kifuText),
          keyPositionCount: Array.isArray(source.keyPositions) ? source.keyPositions.length : 0,
          actionRuleCount: Array.isArray(source.actionRules) ? source.actionRules.length : 0,
          moveCount: countKifMoves(source.kifuText),
          workflowStatus: workflow.value,
          workflowStatusLabel: workflow.label,
          createdAtLabel: displayDate(source.createdAt),
          updatedAtLabel: displayDate(source.updatedAt),
          readyForNextGame: Boolean(source.readyForNextGame),
          reflectionComplete: Boolean(source.reflectionComplete)
        };
      })
      .sort((left, right) => new Date(right.updatedAtLabel === "記録なし" ? right.gameDate : (gameReviews.find(x => x.reviewId === right.reviewId)?.updatedAt ?? right.gameDate)).getTime() - new Date(left.updatedAtLabel === "記録なし" ? left.gameDate : (gameReviews.find(x => x.reviewId === left.reviewId)?.updatedAt ?? left.gameDate)).getTime());

    return deepFreeze({ status: items.length ? "FOUND" : "EMPTY", count: items.length, items });
  }

  presentDetail(snapshot) {
    const source = requireSnapshot(snapshot);
    const workflow = workflowStatusView(source.workflowStatus ?? inferWorkflowStatus(source));
    return deepFreeze({
      reviewId: source.reviewId,
      gameDate: source.gameDate,
      displayDate: displayDate(source.gameDate),
      sideLabel: SIDE_LABELS[source.side] ?? source.side,
      resultLabel: RESULT_LABELS[source.result] ?? source.result,
      opponentLabel: source.opponentName || (source.side === "SENTE" ? source.goteName : source.senteName) || "対局相手未記入",
      timeControlLabel: source.timeControl || "対局種別未記入",
      senteName: source.senteName ?? "",
      goteName: source.goteName ?? "",
      moveCount: countKifMoves(source.kifuText),
      workflowStatus: workflow.value,
      workflowStatusLabel: workflow.label,
      createdAtLabel: displayDate(source.createdAt),
      updatedAtLabel: displayDate(source.updatedAt),
      kifuText: source.kifuText,
      gameStory: source.gameStory,
      keyPositions: (source.keyPositions ?? []).map((item, index) => ({ ...item, displayNumber: index + 1 })),
      decisionPattern: source.decisionPattern,
      observationTheme: source.observationTheme,
      actionRules: [...(source.actionRules ?? [])],
      note: source.note,
      readyForNextGame: Boolean(source.readyForNextGame),
      reflectionComplete: Boolean(source.reflectionComplete),
      missingReflectionItems: [...(source.missingReflectionItems ?? [])]
    });
  }
}
