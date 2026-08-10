import test from "node:test";
import assert from "node:assert/strict";
import { assertShogiEnginePort } from "./ShogiEnginePort.js";

function validAdapter() { return { initialize(){}, analyzePosition(){}, cancelAnalysis(){}, getEngineInfo(){}, dispose(){} }; }
test("Valid Engine AdapterはPortとして受理する", () => { const adapter = validAdapter(); assert.equal(assertShogiEnginePort(adapter), adapter); });
test("Missing Adapterを拒否する", () => assert.throws(() => assertShogiEnginePort(null), /Engine Adapter/));
test("不足MethodのあるAdapterを拒否する", () => assert.throws(() => assertShogiEnginePort({ initialize(){} }), /analyzePosition/));
