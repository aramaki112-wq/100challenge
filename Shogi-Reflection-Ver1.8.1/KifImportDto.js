import { deepFreeze } from "./Immutable.js";

export class KifImportDto {
  constructor({
    sourceFileName = "",
    byteLength = null,
    encoding = null,
    playedAt = null,
    startedAt = null,
    endedAt = null,
    senteName = null,
    goteName = null,
    eventName = null,
    place = null,
    title = null,
    openingName = null,
    handicap = null,
    timeControl = null,
    consumedTime = null,
    winner = null,
    resultText = null,
    terminationReason = null,
    totalMoves = 0,
    moves = [],
    rawKifText = "",
    warnings = [],
    unmappedHeaders = {}
  } = {}) {
    this.sourceFormat = "KIF";
    this.sourceFileName = String(sourceFileName ?? "");
    this.byteLength = Number.isInteger(byteLength) ? byteLength : null;
    this.encoding = encoding ?? null;
    this.playedAt = playedAt ?? null;
    this.startedAt = startedAt ?? null;
    this.endedAt = endedAt ?? null;
    this.senteName = senteName ?? null;
    this.goteName = goteName ?? null;
    this.eventName = eventName ?? null;
    this.place = place ?? null;
    this.title = title ?? null;
    this.openingName = openingName ?? null;
    this.handicap = handicap ?? null;
    this.timeControl = timeControl ?? null;
    this.consumedTime = consumedTime ?? null;
    this.winner = winner ?? null;
    this.resultText = resultText ?? null;
    this.terminationReason = terminationReason ?? null;
    this.totalMoves = Number.isInteger(totalMoves) ? totalMoves : 0;
    this.moves = moves.map((move) => ({ ...move }));
    this.rawKifText = String(rawKifText ?? "");
    this.warnings = warnings.map((item) => ({
      ...item,
      context: { ...(item.context ?? {}) }
    }));
    this.unmappedHeaders = { ...unmappedHeaders };
    deepFreeze(this);
  }

  toObject() {
    return deepFreeze({
      sourceFormat: this.sourceFormat,
      sourceFileName: this.sourceFileName,
      byteLength: this.byteLength,
      encoding: this.encoding,
      playedAt: this.playedAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      senteName: this.senteName,
      goteName: this.goteName,
      eventName: this.eventName,
      place: this.place,
      title: this.title,
      openingName: this.openingName,
      handicap: this.handicap,
      timeControl: this.timeControl,
      consumedTime: this.consumedTime,
      winner: this.winner,
      resultText: this.resultText,
      terminationReason: this.terminationReason,
      totalMoves: this.totalMoves,
      moves: this.moves.map((move) => ({ ...move })),
      rawKifText: this.rawKifText,
      warnings: this.warnings.map((item) => ({
        ...item,
        context: { ...(item.context ?? {}) }
      })),
      unmappedHeaders: { ...this.unmappedHeaders }
    });
  }
}
