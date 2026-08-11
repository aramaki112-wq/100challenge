import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("./YaneuraOuWasmWorkerBootstrap.js", import.meta.url), "utf8");

test("WASM bootstrapはofficial wasm_pre.jsのmessage bridgeを利用する", () => {
  assert.match(source, /moduleInstance\.addMessageListener\(emit\)/);
  assert.match(source, /moduleInstance\.postMessage\(String\(command\)\)/);
  assert.doesNotMatch(source, /moduleInstance\.ccall\("usi_command"/);
});

test("WASM bootstrapはofficial bridge欠落を黙ってdirect ccall fallbackしない", () => {
  assert.match(source, /Official YaneuraOu wasm_pre\.js message bridge/);
  assert.doesNotMatch(source, /ccall\("usi_command"/);
});



test("WASM bootstrapはruntime directory内のgenerated glueを同一directoryから読む", () => {
  assert.match(source, /const GLUE_URL = "\.\/yaneuraou\.material\.js"/);
  assert.doesNotMatch(source, /locateFile\(/);
});


test("WASM bootstrapはofficial material export factoryを使用する", () => {
  assert.match(source, /self\.YaneuraOu_Material/);
  assert.doesNotMatch(source, /self\.name\.startsWith\("em-pthread"\)/);
});
