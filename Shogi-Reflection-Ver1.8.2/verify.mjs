import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(root, "SOURCE_OF_TRUTH_V1_8_INTEGRATION_CANDIDATE_HASHES.json"), "utf8"));
const output = path.join(root, "STATIC_VERIFICATION_RESULT.txt");
const syntaxOutput = path.join(root, "SYNTAX_CHECK_RESULT.txt");
const norm = (v) => v.split(path.sep).join("/");
const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const exists = (f) => fs.existsSync(path.join(root, f));
function list(dir = root) {
  let result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    if (entry.name === "browser-verification-backup.json") continue;
    const full = path.join(dir, entry.name);
    result.push(...(entry.isDirectory() ? list(full) : [norm(path.relative(root, full))]));
  }
  return result.sort();
}

const pass = [], fail = [];
const check = (name, condition, detail = "") => (condition ? pass : fail).push(`${condition ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);
const files = list();
const baseFiles = Object.keys(baseline.files).sort();
const set = new Set(files);
const deleted = baseFiles.filter((f) => !set.has(f));
const shared = baseFiles.filter((f) => set.has(f));
const modified = shared.filter((f) => hash(path.join(root, f)) !== baseline.files[f]);
const unchanged = shared.filter((f) => hash(path.join(root, f)) === baseline.files[f]);
const added = files.filter((f) => !(f in baseline.files));

check("User-supplied Ver.1.8 Integration Candidate file count", baseline.baselineFileCount === 347 && baseFiles.length === 347, `${baseline.baselineFileCount}/${baseFiles.length}`);
check("No Baseline files deleted", deleted.length === 0, deleted.join(", "));
check("Application LICENSE hash preserved", baseline.files.LICENSE === hash(path.join(root, "LICENSE")), hash(path.join(root, "LICENSE")));

const js = files.filter((f) => /\.(?:js|mjs)$/.test(f));
const syntax = [];
for (const f of js) {
  try { execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" }); syntax.push(`PASS | ${f}`); }
  catch (error) { syntax.push(`FAIL | ${f} | ${error.stderr?.toString().trim() ?? error.message}`); }
}
fs.writeFileSync(syntaxOutput, ["Shogi Reflection Ver.1.8 Syntax Check", "Date: 2026-08-09", `Files: ${js.length}`, "", ...syntax, ""].join("\n"));
check("All JavaScript syntax", syntax.every((row) => row.startsWith("PASS")), String(js.length));

const missing = [];
for (const f of js) {
  for (const m of read(f).matchAll(/(?:from\s+|import\s*\()(["'])(\.\.?\/[^"']+)\1/g)) {
    const target = path.resolve(path.dirname(path.join(root, f)), m[2]);
    if (!fs.existsSync(target)) missing.push(`${f} -> ${m[2]}`);
  }
}
check("Missing Import = 0", missing.length === 0, missing.join(", "));

const required = [
  "AnalyzeGame.js", "ShogiEnginePort.js", "UsiEngineAdapter.js", "UsiInfoParser.js", "YaneuraOuEngineAdapter.js",
  "YaneuraOuWasmAdapter.js", "YaneuraOuWasmWorkerBootstrap.js", "FallbackShogiEngineAdapter.js",
  "ReflectionLocalEngineAdapter.js", "ReflectionLocalEngineWorker.js", "BrowserWorkerUsiTransport.js",
  "EvaluationNormalizer.js", "EngineCandidateSelector.js", "EngineAnalysisRepository.js", "BrowserEngineAnalysisView.js",
  "EngineEvaluationGraphModel.js", "EngineEvaluationGraphView.js", "EngineEvaluationGraphV182.test.js", "BadMoveDetectionV182.test.js",
  "AnalyzeGameEvaluationTimelineV182.test.js", "YaneuraOuWasmBootstrapV182.test.js",
  "Ver18FormalRequirements.test.js", "UsiProtocolV18.test.js", "RealEngineAdapterV18.test.js", "EngineWorkerV18.test.js", "EngineUiLayoutV18.test.js",
  "samples/piyo_20260617_170236.kif", "engine/yaneuraou/engine-manifest.json",
  "scripts/build-yaneuraou-wasm.sh", "scripts/finalize-yaneuraou-manifest.mjs", "scripts/real-yaneuraou-artifact-gate.mjs", "scripts/formal-completion-gate.mjs",
  "REAL_YANEURAOU_E2E_RESULT.json", "REAL_YANEURAOU_BROWSER_E2E_RESULT.txt", "real_yaneuraou_browser_verify.py", "ENGINE_LICENSE_GATE_RESULT.json",
  "Ver.1.8操作手順書.md", "ENGINE_INTEGRATION_DESIGN.md", "ENGINE_CANDIDATE_SELECTION_DESIGN.md", "ENGINE_EVALUATION_GRAPH_DESIGN.md", "ENGINE_LICENSE_AUDIT.md",
  "ENGINE_COMPONENT_DECISION.md", "ENGINE_BUILD_REPRODUCIBILITY.md", "DISTRIBUTION_LICENSE_CHECKLIST.md", "THIRD_PARTY_NOTICES.md", "ENGINE_SOURCE_DISTRIBUTION_PLAN.md",
  "SOURCE_OF_TRUTH_AUDIT.md", "COMPLETION_REPORT.md", "TEST_RESULT.txt", "BROWSER_VERIFICATION_RESULT.txt", "REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt",
  "VISUAL_VERIFICATION_RESULT.txt", "PERFORMANCE_RESULT.txt", "ENGINE_PERFORMANCE_RESULT.txt", "LICENSE"
];
for (const f of required) check(`Required file: ${f}`, exists(f));

const pkg = JSON.parse(read("package.json"));
check("package version", pkg.version === "1.8.2", pkg.version);
check("test script", pkg.scripts?.test === "node --test");
check("check script", pkg.scripts?.check === "node verify.mjs");
check("Real artifact gate script", pkg.scripts?.["test:real-yaneuraou-artifact"] === "node scripts/real-yaneuraou-artifact-gate.mjs");
check("Formal completion gate script", pkg.scripts?.["test:formal-gate"] === "node scripts/formal-completion-gate.mjs");

const html = read("index.html"), css = read("style.css"), main = read("main.js"), piece = read("ShogiPieceSvg.js");
const engineView = read("BrowserEngineAnalysisView.js"), provider = read("BrowserEngineProvider.js"), graphView = read("EngineEvaluationGraphView.js"), graphModel = read("EngineEvaluationGraphModel.js");
const analyze = read("AnalyzeGame.js"), selector = read("EngineCandidateSelector.js"), rules = read("Design Rules.md");
check("Seven Step panels", (html.match(/data-step-panel=/g) ?? []).length === 7);
const step3 = html.match(/data-step-panel="3"[\s\S]*?data-step-panel="4"/)?.[0] ?? "";
const engineIndex = step3.indexOf('id="engine-analysis-panel"');
const boardIndex = step3.indexOf('id="shogi-board"');
check("Engine Panel before Replay", engineIndex >= 0 && boardIndex > engineIndex, `${engineIndex}/${boardIndex}`);
check("Board Flip inside Replay Navigation", /class="replay-navigation"[\s\S]*id="replay-flip"/.test(step3));
check("Manual KeyPosition retained", html.includes('id="add-current-position"') && html.includes('id="add-key-position"'));
check("Fixed 9x9 geometry retained", /grid-template-columns\s*:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/.test(css) && /grid-template-rows\s*:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/.test(css));
check("390px Replay nav wrap", css.includes("@media (max-width:430px)") && css.includes("grid-template-columns:repeat(3,minmax(0,1fr))"));
check("Candidate board scroll offset", css.includes("scroll-margin-top") && css.includes(".replay-board-shell"));
check("Original SVG pieces retained", piece.includes("piece-label-stacked") && piece.includes("piece-face-highlight"));
check("No external piece image URL", !piece.match(/https?:\/\//));
check("No bundled webfont declaration", !css.includes("@font-face"));

for (const f of ["ReplayScrollPolicy.js", "GameReview.js", "GameReviewSnapshotService.js", "ShogiPieceSvg.js"]) {
  check(`${f} Baseline hash preserved`, baseline.files[f] === hash(path.join(root, f)));
}
check("Game backup schema remains 1", read("GameReviewSnapshotService.js").includes("SHOGI_REFLECTION_SCHEMA_VERSION = 1"));
check("Engine analysis schema remains v1 compatible", read("EngineAnalysisConstants.js").includes("ENGINE_ANALYSIS_SCHEMA_VERSION = 1"));

check("Engine Port isolated from USI", !/\b(position sfen|setoption|bestmove|score cp|score mate)\b/.test(analyze));
check("USI protocol stays Adapter", read("UsiEngineAdapter.js").includes("position sfen") && read("UsiEngineAdapter.js").includes("bestmove"));
check("YaneuraOu primary architecture present", provider.includes("YaneuraOuWasmAdapter") && provider.includes("engine-manifest.json") && provider.includes("FallbackShogiEngineAdapter"));
check("ReflectionLocal remains explicit fallback", provider.includes("ReflectionLocalEngineAdapter") && provider.includes("fallbackReason"));
check("No external KIF analysis upload in provider", !/WebSocket|XMLHttpRequest/.test(provider));
check("Main background cancel", main.includes("visibilitychange") && main.includes("document.hidden") && main.includes("cancelActiveAnalysis"));
check("Resource presets include threads/hash/maxPlies", read("EngineAnalysisSettings.js").includes("SMARTPHONE_SAFE") && read("EngineAnalysisSettings.js").includes("threads: 1") && read("EngineAnalysisSettings.js").includes("hashMB") && read("EngineAnalysisSettings.js").includes("maxPlies"));
check("Analysis enforces maxPlies", analyze.includes("Math.min(history.maxMoveNumber") && analyze.includes("analysisTruncated"));

check("Candidate does not auto-register", main.includes("data-engine-add-key-position") && !analyze.includes("KeyPosition"));
const cjump = main.match(/data-engine-replay-ply[\s\S]*?\n\s*return;/)?.[0] ?? "";
check("Candidate Jump uses existing Replay + intentional board scroll", cjump.includes("replayController.jump") && cjump.includes("replayView.scrollIntoView") && cjump.includes("ENGINE_CANDIDATE_JUMP") && !cjump.includes("navigateToStep"));
check("Candidate Add uses existing KeyPosition flow", main.includes("addCurrentReplayPositionToKeyPosition"));
check("Good and Bad group each max 5", selector.includes("ENGINE_CANDIDATE_GROUP") && selector.includes("Math.min(5") && selector.includes("goodCandidates") && selector.includes("badCandidates"));
check("Candidate UI says criteria-only", engineView.includes("基準を満たす候補のみ表示しています"));
check("Evaluation Graph rendered before candidates", step3.indexOf('id="engine-evaluation-graph"') >= 0 && step3.indexOf('id="engine-evaluation-graph"') < step3.indexOf('id="engine-analysis-candidates"'));
check("Graph uses SVG and existing Replay data targets", graphView.includes("<svg") && graphView.includes("data-engine-graph-replay-ply") && graphView.includes("data-engine-graph-key-position-ply"));
check("Graph keeps Mate separate from CP", graphModel.includes("MATE_FOR") && graphModel.includes("MATE_AGAINST") && graphModel.includes("UNKNOWN"));
check("Graph -> STEP4 exact card flow", main.includes("findKeyPositionIndexByMoveNumber") && main.includes('focusKeyPosition(index, { field: "fact" })'));
check("Bad Candidate shows best-vs-actual reference", engineView.includes("Engine推奨") && engineView.includes("実戦後評価") && engineView.includes("実戦手との差") && engineView.includes("読み筋"));
check("Progress completed/total UI", engineView.includes("${completed}/${total}局面") && engineView.includes("result.totalPositionsInGame"));
check("Sample KIF UI present", html.includes('id="load-sample-kif"') && main.includes("samples/piyo_20260617_170236.kif"));

const manifest = JSON.parse(read("engine/yaneuraou/engine-manifest.json"));
check("Pinned YaneuraOu release", manifest.engineVersion === "V9.00" && manifest.commitHash === "a5ee2786c0030edc7d4a1cdfe94b04dffec55493");
check("MATERIAL Level 1 selected", manifest.evaluationModel === "MATERIAL" && manifest.materialLevel === 1);
check("Unverified WASM cannot be silently enabled", manifest.available === true ? Boolean(manifest.jsSha256 && manifest.wasmSha256 && manifest.emscriptenVersion) : manifest.status === "NOT_BUILT_IN_CURRENT_VERIFICATION_ENVIRONMENT");

const audit = read("ENGINE_LICENSE_AUDIT.md");
check("License audit treats components separately", ["YaneuraOu Source", "WASM Build", "Evaluation", "Emscripten"].every((x) => audit.includes(x)));
check("Distribution readiness separated", audit.includes("Personal Use Readiness") && audit.includes("Public Distribution Readiness") && audit.includes("Commercial Distribution Readiness"));
check("Legal review gate documented", audit.includes("LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION"));
check("No unverified YaneuraOu WASM bundled", manifest.available || (!exists("engine/yaneuraou/yaneuraou.wasm") && !exists("engine/yaneuraou/yaneuraou.js")));
check("Third-party notice does not claim bundled binary", read("THIRD_PARTY_NOTICES.md").includes("NOT BUNDLED"));
check("Existing Application LICENSE unchanged documented", read("DISTRIBUTION_LICENSE_CHECKLIST.md").includes("Application LICENSE") && read("DISTRIBUTION_LICENSE_CHECKLIST.md").includes("unchanged"));
check("Design Rules Ver1.8 retained/extended", rules.includes("INTERLUDE-Rule-FH") && rules.includes("INTERLUDE-Rule-FT"));

const tr = exists("TEST_RESULT.txt") ? read("TEST_RESULT.txt") : "";
check("Automated tests failed zero", /Failed:\s*0/.test(tr));
const br = exists("BROWSER_VERIFICATION_RESULT.txt") ? read("BROWSER_VERIFICATION_RESULT.txt") : "";
check("Browser verification failed zero", /Failed:\s*0/.test(br));
const vr = exists("VISUAL_VERIFICATION_RESULT.txt") ? read("VISUAL_VERIFICATION_RESULT.txt") : "";
check("Visual verification failed zero", /Failed:\s*0/.test(vr));
const rr = exists("REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt") ? read("REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt") : "";
check("Real-engine gate status explicitly recorded", rr.includes("YaneuraOu WASM") && (rr.includes("NOT RUN") || /Failed:\s*0/.test(rr)));

const report = [
  "Shogi Reflection Ver.1.8 Static Verification",
  "Date: 2026-08-09",
  "Source of Truth: user-supplied Shogi-Reflection-Ver1.8-Integration-Candidate(1).zip",
  "",
  `Files: ${files.length}`,
  `Baseline files: ${baseFiles.length}`,
  `Hash-identical Baseline files: ${unchanged.length}`,
  `Modified Baseline files: ${modified.length}`,
  `Added files: ${added.length}`,
  `Deleted Baseline files: ${deleted.length}`,
  `Syntax checked: ${js.length}`,
  `Missing imports: ${missing.length}`,
  `Passed checks: ${pass.length}`,
  `Failed checks: ${fail.length}`,
  "",
  "Modified Baseline files:", ...modified.map((x) => `- ${x}`),
  "", "Added files:", ...added.map((x) => `- ${x}`),
  "", "Deleted Baseline files:", ...(deleted.length ? deleted.map((x) => `- ${x}`) : ["- none"]),
  "", ...pass, ...fail, ""
].join("\n");
fs.writeFileSync(output, report);
console.log(report.split("\n").slice(0, 15).join("\n"));
if (fail.length) process.exit(1);
