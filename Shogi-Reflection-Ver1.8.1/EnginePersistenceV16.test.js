import test from "node:test";
import assert from "node:assert/strict";
import { EngineAnalysisRepository } from "./EngineAnalysisRepository.js";
import { EngineAnalysisSnapshotService } from "./EngineAnalysisSnapshotService.js";
import { EngineAnalysisPersistenceCoordinator } from "./EngineAnalysisPersistenceCoordinator.js";
import { LocalStorageEngineAnalysisStore } from "./LocalStorageEngineAnalysisStore.js";

class MemoryStorage { constructor(){this.m=new Map()} setItem(k,v){this.m.set(k,v)} getItem(k){return this.m.get(k)??null} removeItem(k){this.m.delete(k)} }
const result=(id,at)=>({gameId:"G",analysisId:id,analyzedAt:at,engine:{engineName:"E"}});
test("再解析は古い解析結果を破壊しない", () => { const r=new EngineAnalysisRepository(); r.save(result("A","1")); r.save(result("B","2")); assert.equal(r.findByGameId("G").length,2); assert.equal(r.findLatestByGameId("G").analysisId,"B"); });
test("Engine解析履歴はGameReviewとは別Storageへ保存復元する", () => { const r=new EngineAnalysisRepository(); r.save(result("A","1")); const storage=new MemoryStorage(); const c=new EngineAnalysisPersistenceCoordinator({snapshotService:new EngineAnalysisSnapshotService({repository:r}),store:new LocalStorageEngineAnalysisStore({storage})}); c.saveToBrowser(); const r2=new EngineAnalysisRepository(); new EngineAnalysisPersistenceCoordinator({snapshotService:new EngineAnalysisSnapshotService({repository:r2}),store:new LocalStorageEngineAnalysisStore({storage})}).loadFromBrowser(); assert.equal(r2.findLatestByGameId("G").analysisId,"A"); });
