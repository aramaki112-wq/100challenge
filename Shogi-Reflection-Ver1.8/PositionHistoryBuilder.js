import { applyShogiMove } from "./ApplyShogiMove.js";
import { InitialShogiPositionFactory } from "./InitialShogiPositionFactory.js";
import { KifMoveNormalizer } from "./KifMoveNormalizer.js";
import {
  POSITION_HISTORY_STATUS,
  PositionHistory
} from "./PositionHistory.js";
import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError
} from "./ShogiReplayErrors.js";

function moveNumberOf(move) {
  return move?.moveNumber ?? move?.number ?? null;
}

function normalizeFailure(error, sourceMove, replayableUntil) {
  if (error instanceof ShogiReplayError) {
    return new ShogiReplayError(error.code, error.message, {
      moveNumber: error.moveNumber ?? moveNumberOf(sourceMove),
      moveText: error.moveText || sourceMove?.notation || "",
      replayableUntil,
      detail: error.detail,
      cause: error.cause
    });
  }
  return new ShogiReplayError(
    SHOGI_REPLAY_ERROR_CODES.SHOGI_POSITION_BUILD_FAILED,
    "Position History生成中に予期しないErrorが発生しました。",
    {
      moveNumber: moveNumberOf(sourceMove),
      moveText: sourceMove?.notation ?? "",
      replayableUntil,
      detail: { causeName: error?.name ?? "Error" },
      cause: error
    }
  );
}

function terminationFrom(parsed, appliedMoveCount) {
  if (parsed?.termination) return parsed.termination;
  if (!parsed?.terminationReason) return null;
  return Object.freeze({
    moveNumber: appliedMoveCount + 1,
    notation: parsed.terminationReason,
    resultText: parsed.resultText ?? null
  });
}

export class PositionHistoryBuilder {
  constructor({
    normalizer = new KifMoveNormalizer(),
    initialPositionFactory = new InitialShogiPositionFactory(),
    applyMove = applyShogiMove
  } = {}) {
    this.normalizer = normalizer;
    this.initialPositionFactory = initialPositionFactory;
    this.applyMove = applyMove;
  }

  build(parsedKif) {
    const moves = Array.isArray(parsedKif?.moves) ? parsedKif.moves : [];
    const warnings = Array.isArray(parsedKif?.warnings) ? parsedKif.warnings : [];
    const handicap = parsedKif?.handicap ?? parsedKif?.headers?.handicap ?? null;

    let initialPosition;
    try {
      initialPosition = this.initialPositionFactory.create({ handicap });
    } catch (error) {
      const failure = normalizeFailure(error, null, 0);
      return new PositionHistory({
        positions: [],
        moves: [],
        warnings,
        failure,
        status: POSITION_HISTORY_STATUS.REJECTED,
        termination: terminationFrom(parsedKif, 0),
        source: parsedKif
      });
    }

    const positions = [initialPosition];
    const normalizedMoves = [];
    let previousDestination = null;

    for (let index = 0; index < moves.length; index += 1) {
      const sourceMove = moves[index];
      const expectedMoveNumber = index + 1;
      if (moveNumberOf(sourceMove) !== expectedMoveNumber) {
        const failure = new ShogiReplayError(
          SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_NUMBER_INVALID,
          "指し手の手数が1から連続していません。",
          {
            moveNumber: moveNumberOf(sourceMove),
            moveText: sourceMove?.notation ?? "",
            replayableUntil: positions.length - 1,
            detail: { expectedMoveNumber }
          }
        );
        return new PositionHistory({
          positions,
          moves: normalizedMoves,
          warnings,
          failure,
          status: POSITION_HISTORY_STATUS.PARTIAL,
          termination: terminationFrom(parsedKif, normalizedMoves.length),
          source: parsedKif
        });
      }

      try {
        const normalizedMove = this.normalizer.normalize(sourceMove, {
          previousDestination
        });
        if (normalizedMove.kind !== "MOVE") {
          throw new ShogiReplayError(
            SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
            "KIF Parserのmovesへ終局行が混在しています。",
            {
              moveNumber: normalizedMove.moveNumber,
              moveText: normalizedMove.notation,
              replayableUntil: positions.length - 1
            }
          );
        }
        const nextPosition = this.applyMove(positions.at(-1), normalizedMove);
        positions.push(nextPosition);
        normalizedMoves.push(normalizedMove);
        previousDestination = normalizedMove.destination;
      } catch (error) {
        const failure = normalizeFailure(
          error,
          sourceMove,
          positions.length - 1
        );
        return new PositionHistory({
          positions,
          moves: normalizedMoves,
          warnings,
          failure,
          status: POSITION_HISTORY_STATUS.PARTIAL,
          termination: terminationFrom(parsedKif, normalizedMoves.length),
          source: parsedKif
        });
      }
    }

    return new PositionHistory({
      positions,
      moves: normalizedMoves,
      warnings,
      failure: null,
      status: POSITION_HISTORY_STATUS.FULL,
      termination: terminationFrom(parsedKif, normalizedMoves.length),
      source: parsedKif
    });
  }
}
