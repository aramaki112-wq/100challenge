import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const html=fs.readFileSync(new URL("./index.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("./style.css",import.meta.url),"utf8");
const view=fs.readFileSync(new URL("./BrowserEngineAnalysisView.js",import.meta.url),"utf8");

test("STEP3 Engine PanelはReplay Boardより前に配置する",()=>{
  const engine=html.indexOf('id="engine-analysis-panel"');
  const board=html.indexOf('id="shogi-board"');
  assert.ok(engine>0 && board>engine);
});

test("盤面反転はReplay Navigation内に配置する",()=>{
  const navStart=html.indexOf('<div class="replay-navigation"');
  const navEnd=html.indexOf('</div>',navStart);
  const chunk=html.slice(navStart,navEnd);
  assert.match(chunk,/id="replay-flip"/);
  for(const id of ["replay-first","replay-previous","replay-next","replay-last"]) assert.match(chunk,new RegExp(`id="${id}"`));
});

test("390px前後でReplay NavigationはWrap可能で横scrollを要求しない",()=>{
  assert.match(css,/@media \(max-width:430px\)[\s\S]*grid-template-columns:repeat\(3/);
  assert.doesNotMatch(css,/\.replay-navigation[^}]*overflow-x\s*:\s*(?:auto|scroll)/);
});

test("Engine UIはINITIALIZING/CANCELLING/COMPLETED状態を明示できる",()=>{
  for(const status of ["INITIALIZING","CANCELLING","COMPLETED","FAILED","CANCELLED"]) assert.match(view,new RegExp(status));
});
