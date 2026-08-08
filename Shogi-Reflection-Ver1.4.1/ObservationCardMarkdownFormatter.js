import { deepFreeze } from "./Immutable.js";
import { createReviewMarkdownNames } from "./GameReviewMarkdownNaming.js";
import {
  markdownList,
  markdownValue,
  requireGameReviewSnapshot,
  uniqueNonEmpty,
  yamlString
} from "./MarkdownFormatHelpers.js";
import {
  MARKDOWN_EXPORT_ERROR_CODES,
  MarkdownExportError
} from "./MarkdownExportErrors.js";

function collectWarningSignals(keyPositions) {
  const candidates = [];
  for (const item of keyPositions) {
    if (item.emotion) candidates.push(`感情の兆候：${item.emotion}`);
    if (item.decisionImpact) candidates.push(`判断の兆候：${item.decisionImpact}`);
    if (item.myThought) candidates.push(`思考の兆候：${item.myThought}`);
    if (item.interpretation) candidates.push(`解釈の兆候：${item.interpretation}`);
  }
  return uniqueNonEmpty(candidates, 5);
}

function collectFacts(keyPositions) {
  return uniqueNonEmpty(keyPositions.map((item) => `${item.moveNumber}手目：${item.fact}`), 5);
}

export class ObservationCardMarkdownFormatter {
  format({ gameReview, exportedAt } = {}) {
    const source = requireGameReviewSnapshot(gameReview);
    if (!source.readyForNextGame) {
      throw new MarkdownExportError(
        MARKDOWN_EXPORT_ERROR_CODES.OBSERVATION_CARD_NOT_READY,
        "次局用Observation Cardを作成する条件を満たしていません。",
        { missingReflectionItems: [...(source.missingReflectionItems ?? [])] }
      );
    }

    const names = createReviewMarkdownNames(source);
    const exported = new Date(exportedAt);
    if (Number.isNaN(exported.getTime())) throw new TypeError("exportedAtは有効な日時で指定してください。");
    const warningSignals = collectWarningSignals(source.keyPositions);
    const facts = collectFacts(source.keyPositions);

    const markdownText = `---
title: ${yamlString(names.observationCardTitle)}
type: "shogi-observation-card"
source_review_id: ${yamlString(source.reviewId)}
source_review_note: ${yamlString(names.reviewNoteTitle)}
game_date: ${yamlString(source.gameDate)}
created_at: ${yamlString(exported.toISOString())}
status: "未検証"
observation_theme: ${yamlString(source.observationTheme)}
decision_pattern: ${yamlString(source.decisionPattern)}
tags:
  - "将棋"
  - "Observation-Card"
  - "次局用"
---

# ${names.observationCardTitle}

> [!important] このCardの目的
> 前局の反省を読み返すだけで終わらせず、同じ判断Patternが起きる前の兆候に気づき、次局の具体的な行動へ変換する。

## 元になった振り返り

[[${names.reviewNoteTitle}]]

## 今回の判断Pattern

${markdownValue(source.decisionPattern)}

## ミスが起きる前の兆候候補

${markdownList(warningSignals, { fallback: "重要局面から明確な兆候を抽出できませんでした。元の振り返りを確認してください。" })}

## 兆候の根拠となったFACT

${markdownList(facts)}

## 次局のObservation Theme

> ${source.observationTheme}

## 次局で守る実行Rule

${markdownList(source.actionRules, { ordered: true })}

## 対局中の短縮確認

${source.actionRules.map((rule) => `- [ ] ${rule}`).join("\n")}

## 次局後の再発確認

- [ ] ミスの兆候に一度以上気づけた
- [ ] Observation Themeを対局中に思い出せた
- [ ] 実行Ruleを一度以上守れた
- [ ] 同じ判断Patternを途中で止められた
- [ ] 同じ判断Patternは再発しなかった
- [ ] 同じ判断Patternが再発した

## 守れた場面

未記入

## 守れなかった場面・再発した局面

未記入

## 再発した条件

未記入

## 次に修正するRule

未記入

## 次局後の結論

- Status：未検証
- このRuleを継続する／変更する／終了する：未記入
`;

    return deepFreeze({
      kind: "OBSERVATION_CARD_MARKDOWN",
      title: names.observationCardTitle,
      fileName: names.observationCardFileName,
      markdownText,
      sourceReviewId: source.reviewId,
      linkedNoteTitle: names.reviewNoteTitle,
      warningSignalCount: warningSignals.length
    });
  }
}
