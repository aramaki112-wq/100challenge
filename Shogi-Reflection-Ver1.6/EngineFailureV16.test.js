import test from "node:test";
import assert from "node:assert/strict";
import { AnalyzeGame } from "./AnalyzeGame.js";
import { resolveBrowserEngine } from "./BrowserEngineProvider.js";
import { EngineAnalysisError, ENGINE_ERROR_CODES } from "./EngineErrors.js";
import { KifParser } from "./KifParser.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { replayFixture } from "./ReplayTestHelpers.js";
import { PIECE_OWNER } from "./ShogiPiece.js";

function history() {
  return new PositionHistoryBuilder().build(
    new KifParser().parse({ text: replayFixture("replay-basic.kif") })
  );
}

function adapter(overrides = {}) {
  return {
    async initialize() {},
    async analyzePosition() {
      return {
        evaluation: { type: "CP", centipawns: 0, perspective: "SENTE" },
        bestMove: "7g7f",
        candidateMoves: []
      };
    },
    async cancelAnalysis() {},
    getEngineInfo() {
      return {
        engineName: "Failure Test Engine",
        engineVersion: "1.0",
        evaluationModel: "test",
        evaluationModelVersion: "1.0"
      };
    },
    async dispose() {},
    ...overrides
  };
}

test("Engine initialization errorを上位へ伝播する", async () => {
  const engine = adapter({
    async initialize() {
      throw new EngineAnalysisError(ENGINE_ERROR_CODES.ENGINE_INITIALIZATION_FAILED);
    }
  });
  await assert.rejects(
    () => new AnalyzeGame({ engine }).execute({ gameId: "FAIL-INIT", history: history(), playerSide: PIECE_OWNER.SENTE }),
    (error) => error.code === ENGINE_ERROR_CODES.ENGINE_INITIALIZATION_FAILED
  );
});

test("Engine analysis errorを上位へ伝播する", async () => {
  const engine = adapter({
    async analyzePosition() {
      throw new EngineAnalysisError(ENGINE_ERROR_CODES.INVALID_RESPONSE);
    }
  });
  await assert.rejects(
    () => new AnalyzeGame({ engine }).execute({ gameId: "FAIL-ANALYZE", history: history(), playerSide: PIECE_OWNER.SENTE }),
    (error) => error.code === ENGINE_ERROR_CODES.INVALID_RESPONSE
  );
});

test("Engine未設定BrowserではENGINE_NOT_FOUNDとなり既存機能へ影響を与えない", async () => {
  const fakeWindow = {
    location: { href: "http://localhost:8000/" }
  };
  await assert.rejects(
    () => resolveBrowserEngine(fakeWindow),
    (error) => error.code === ENGINE_ERROR_CODES.ENGINE_NOT_FOUND && /手動の振り返り/.test(error.userMessage)
  );
});
