import { deepFreeze } from "./Immutable.js";
import { createReviewMarkdownNames } from "./GameReviewMarkdownNaming.js";
import {
  fencedText,
  markdownList,
  markdownValue,
  requireGameReviewSnapshot,
  yamlString
} from "./MarkdownFormatHelpers.js";

const SIDE_LABELS = Object.freeze({ SENTE: "先手", GOTE: "後手" });
const RESULT_LABELS = Object.freeze({ WIN: "勝ち", LOSS: "負け", DRAW: "引き分け", UNKNOWN: "未設定" });

function keyPositionMarkdown(item, index) {
  const replay = item.replayReference;
  const replayInfo = replay
    ? `- Replay Snapshot：あり（Version ${replay.snapshotVersion}）\n- 元KIF指し手：${markdownValue(replay.sourceKifMove?.rawLine ?? replay.sourceKifMove?.notation ?? replay.sourceKifMove)}\n- Replay Warning：${replay.replayWarning ? markdownValue(replay.replayWarning.message) : "なし"}`
    : "- Replay Snapshot：なし（Ver.1.2以前または手動入力）";
  return `## 重要局面${index + 1}｜${item.moveNumber}手目 ${markdownValue(item.title)}

### 指し手

${markdownValue(item.moveText)}

### Replay連携

${replayInfo}

### 局面情報

${markdownValue(item.boardState)}

### FACT

${markdownValue(item.fact)}

### INTERPRETATION

${markdownValue(item.interpretation)}

### HYPOTHESIS

${markdownValue(item.hypothesis)}

### 自分が考えていたこと

${markdownValue(item.myThought)}

### 相手の狙い

${markdownValue(item.opponentIntent)}

### 感情

${markdownValue(item.emotion)}

### 感情・判断が与えた影響

${markdownValue(item.decisionImpact)}

### 局面ごとの判断Pattern

${markdownValue(item.decisionPattern)}

### 学び

${markdownValue(item.learning)}`;
}

export class GameReviewMarkdownFormatter {
  format({ gameReview, exportedAt } = {}) {
    const source = requireGameReviewSnapshot(gameReview);
    const names = createReviewMarkdownNames(source);
    const sideLabel = SIDE_LABELS[source.side] ?? source.side;
    const resultLabel = RESULT_LABELS[source.result] ?? source.result;
    const keyPositions = source.keyPositions.length
      ? source.keyPositions.map(keyPositionMarkdown).join("\n\n---\n\n")
      : "重要局面はまだ記録されていません。";
    const exported = new Date(exportedAt);
    if (Number.isNaN(exported.getTime())) throw new TypeError("exportedAtは有効な日時で指定してください。");

    const markdownText = `---
title: ${yamlString(names.reviewNoteTitle)}
type: "shogi-game-review"
review_id: ${yamlString(source.reviewId)}
game_date: ${yamlString(source.gameDate)}
exported_at: ${yamlString(exported.toISOString())}
side: ${yamlString(sideLabel)}
result: ${yamlString(resultLabel)}
ready_for_next_game: ${Boolean(source.readyForNextGame)}
tags:
  - "将棋"
  - "対局振り返り"
  - "Shogi-Reflection"
---

# ${names.reviewNoteTitle}

> [!next] 次局用Observation Card
> [[${names.observationCardTitle}]]

## 対局基本情報

- 対局日時：${source.gameDate}
- 手番：${sideLabel}
- 結果：${resultLabel}
- 対局相手：${markdownValue(source.opponentName)}
- 持ち時間：${markdownValue(source.timeControl)}
- Review ID：\`${source.reviewId}\`

## 棋譜

${fencedText(source.kifuText, "text")}

## 対局の物語

${markdownValue(source.gameStory)}

# 重要局面

${keyPositions}

# 判断Pattern

${markdownValue(source.decisionPattern)}

# 次局のObservation Theme

${markdownValue(source.observationTheme)}

# 次局の実行Rule

${markdownList(source.actionRules, { ordered: true })}

# 自由Memo

${markdownValue(source.note)}

# 次局への接続状態

- 次局へ接続可能：${source.readyForNextGame ? "はい" : "いいえ"}
- 不足項目：${Array.isArray(source.missingReflectionItems) && source.missingReflectionItems.length ? source.missingReflectionItems.join(", ") : "なし"}
`;

    return deepFreeze({
      kind: "GAME_REVIEW_MARKDOWN",
      title: names.reviewNoteTitle,
      fileName: names.reviewFileName,
      markdownText,
      sourceReviewId: source.reviewId,
      linkedNoteTitle: names.observationCardTitle
    });
  }
}
