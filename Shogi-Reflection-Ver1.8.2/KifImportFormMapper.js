import {
  GAME_RESULT,
  SHOGI_SIDE
} from "./GameReview.js";
import { deepFreeze } from "./Immutable.js";
import {
  createKifImportWarning,
  KIF_IMPORT_WARNING_CODES
} from "./KifImportErrors.js";

const IMPORT_METADATA_START = "<!-- KIF_IMPORT_METADATA_START -->";
const IMPORT_METADATA_END = "<!-- KIF_IMPORT_METADATA_END -->";

function cloneFormInput(input = {}) {
  return {
    ...input,
    keyPositions: Array.isArray(input.keyPositions)
      ? input.keyPositions.map((item) => ({ ...item }))
      : input.keyPositions,
    actionRules: Array.isArray(input.actionRules)
      ? [...input.actionRules]
      : input.actionRules
  };
}

function toDateTimeLocal(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : null;
}

function resultForPlayer(dto, side) {
  if (["千日手", "持将棋"].includes(dto.terminationReason)) {
    return GAME_RESULT.DRAW;
  }
  if (dto.winner === null) return GAME_RESULT.UNKNOWN;
  return dto.winner === side ? GAME_RESULT.WIN : GAME_RESULT.LOSS;
}

function factualMetadataLines(dto) {
  const fields = [
    ["Source File", dto.sourceFileName],
    ["Encoding", dto.encoding],
    ["棋戦", dto.eventName],
    ["場所", dto.place],
    ["表題", dto.title],
    ["戦型", dto.openingName],
    ["手合割", dto.handicap],
    ["開始日時", dto.startedAt],
    ["終了日時", dto.endedAt],
    ["消費時間", dto.consumedTime],
    ["終局理由", dto.terminationReason],
    ["総手数", Number.isInteger(dto.totalMoves) ? String(dto.totalMoves) : null]
  ];
  return fields
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `- ${label}: ${value}`);
}

function removePreviousImportMetadata(note) {
  const text = String(note ?? "");
  const pattern = new RegExp(
    `${IMPORT_METADATA_START}[\\s\\S]*?${IMPORT_METADATA_END}\\s*`,
    "g"
  );
  return text.replace(pattern, "").trim();
}

function mergeImportMetadata(note, dto) {
  const originalHumanNote = removePreviousImportMetadata(note);
  const metadata = [
    IMPORT_METADATA_START,
    "## KIF Import基本情報",
    ...factualMetadataLines(dto),
    IMPORT_METADATA_END
  ].join("\n");
  return [originalHumanNote, metadata].filter(Boolean).join("\n\n");
}

export class KifImportFormMapper {
  apply({ currentForm, dto, mySide } = {}) {
    const next = cloneFormInput(currentForm);
    const warnings = [...dto.warnings];
    const selectedSide = Object.values(SHOGI_SIDE).includes(mySide)
      ? mySide
      : next.side;

    if (!Object.values(SHOGI_SIDE).includes(selectedSide)) {
      warnings.push(createKifImportWarning(
        KIF_IMPORT_WARNING_CODES.PLAYER_SIDE_REQUIRED,
        "自分が先手か後手かを選択できなかったため、対局相手と自分基準の結果は自動入力していません。"
      ));
    } else {
      next.side = selectedSide;
      next.opponentName = selectedSide === SHOGI_SIDE.SENTE
        ? dto.goteName ?? next.opponentName ?? ""
        : dto.senteName ?? next.opponentName ?? "";
      next.result = resultForPlayer(dto, selectedSide);
      next.senteName = dto.senteName ?? next.senteName ?? "";
      next.goteName = dto.goteName ?? next.goteName ?? "";
    }

    const localGameDate = toDateTimeLocal(dto.playedAt ?? dto.startedAt);
    if (localGameDate) next.gameDate = localGameDate;
    if (dto.timeControl) next.timeControl = dto.timeControl;
    next.kifuText = dto.rawKifText;
    next.note = mergeImportMetadata(next.note, dto);

    return deepFreeze({
      form: next,
      warnings
    });
  }
}

export const KIF_IMPORT_METADATA_MARKERS = Object.freeze({
  start: IMPORT_METADATA_START,
  end: IMPORT_METADATA_END
});
