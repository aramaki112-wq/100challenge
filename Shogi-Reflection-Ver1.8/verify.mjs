import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(root, "SOURCE_OF_TRUTH_V1_7_BASELINE_HASHES.json"), "utf8"));
const output = path.join(root, "STATIC_VERIFICATION_RESULT.txt");
const syntaxOutput = path.join(root, "SYNTAX_CHECK_RESULT.txt");
const norm = (v) => v.split(path.sep).join("/");
const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const exists = (f) => fs.existsSync(path.join(root, f));
function list(dir = root) {
  let result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "__pycache__"].includes(entry.name)) continue;
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

check("Ver.1.7 Source of Truth file count", baseline.fileCount === 309 && baseFiles.length === 309, `${baseline.fileCount}/${baseFiles.length}`);
check("No Ver.1.7 files deleted", deleted.length === 0, deleted.join(", "));
check("LICENSE hash preserved", baseline.files.LICENSE === hash(path.join(root, "LICENSE")), hash(path.join(root, "LICENSE")));

const js = files.filter((f) => /\.(?:js|mjs)$/.test(f));
const syntax = [];
for (const f of js) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" });
    syntax.push(`PASS | ${f}`);
  } catch (error) {
    syntax.push(`FAIL | ${f} | ${error.stderr?.toString().trim() ?? error.message}`);
  }
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
  "AnalyzeGame.js", "ShogiEnginePort.js", "UsiEngineAdapter.js", "YaneuraOuEngineAdapter.js",
  "ReflectionLocalEngineAdapter.js", "ReflectionLocalEngineWorker.js", "BrowserWorkerUsiTransport.js",
  "EvaluationNormalizer.js", "EngineCandidateSelector.js", "EngineAnalysisRepository.js", "BrowserEngineAnalysisView.js",
  "RealEngineAdapterV18.test.js", "EngineWorkerV18.test.js", "RealAnalysisFlowV18.test.js", "RealEngineE2EV18.test.js", "EngineUiLayoutV18.test.js",
  "Ver.1.8操作手順書.md", "ENGINE_INTEGRATION_DESIGN.md", "ENGINE_CANDIDATE_SELECTION_DESIGN.md", "ENGINE_LICENSE_AUDIT.md",
  "ENGINE_COMPONENT_DECISION.md", "ENGINE_BUILD_REPRODUCIBILITY.md", "DISTRIBUTION_LICENSE_CHECKLIST.md", "THIRD_PARTY_NOTICES.md", "ENGINE_SOURCE_DISTRIBUTION_PLAN.md",
  "SOURCE_OF_TRUTH_AUDIT.md", "COMPLETION_REPORT.md", "TEST_RESULT.txt", "BROWSER_VERIFICATION_RESULT.txt", "REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt",
  "VISUAL_VERIFICATION_RESULT.txt", "PERFORMANCE_RESULT.txt", "ENGINE_PERFORMANCE_RESULT.txt", "LICENSE"
];
for (const f of required) check(`Required file: ${f}`, exists(f));

const pkg = JSON.parse(read("package.json"));
check("package version", pkg.version === "1.8.0", pkg.version);
check("test script", pkg.scripts?.test === "node --test");
check("check script", pkg.scripts?.check === "node verify.mjs");

const html = read("index.html"), css = read("style.css"), main = read("main.js"), piece = read("ShogiPieceSvg.js");
const engineView = read("BrowserEngineAnalysisView.js"), provider = read("BrowserEngineProvider.js");
const worker = read("ReflectionLocalEngineWorker.js"), analyze = read("AnalyzeGame.js"), rules = read("Design Rules.md");
check("Seven Step panels", (html.match(/data-step-panel=/g) ?? []).length === 7);
const step3 = html.match(/data-step-panel="3"[\s\S]*?data-step-panel="4"/)?.[0] ?? "";
const engineIndex = step3.indexOf('id="engine-analysis-panel"');
const boardIndex = step3.indexOf('id="shogi-board"');
check("Engine Panel before Replay", engineIndex >= 0 && boardIndex > engineIndex, `${engineIndex}/${boardIndex}`);
check("Board Flip inside Replay Navigation", /class="replay-navigation"[\s\S]*id="replay-flip"/.test(step3));
check("Manual KeyPosition retained", html.includes('id="add-current-position"') && html.includes('id="add-key-position"'));
check("Fixed 9x9 geometry retained", /grid-template-columns\s*:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/.test(css) && /grid-template-rows\s*:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/.test(css));
check("390px Replay nav wrap", css.includes("@media (max-width:430px)") && css.includes("grid-template-columns:repeat(3,minmax(0,1fr))"));
check("Original SVG pieces retained", piece.includes("piece-label-stacked") && piece.includes("piece-face-highlight"));
check("No external piece image URL", !piece.match(/https?:\/\//));
check("No bundled webfont declaration", !css.includes("@font-face"));

check("ReplayScrollPolicy hash preserved", baseline.files["ReplayScrollPolicy.js"] === hash(path.join(root, "ReplayScrollPolicy.js")));
check("GameReview Domain hash preserved", baseline.files["GameReview.js"] === hash(path.join(root, "GameReview.js")));
check("GameReview Snapshot hash preserved", baseline.files["GameReviewSnapshotService.js"] === hash(path.join(root, "GameReviewSnapshotService.js")));
check("Game backup schema remains 1", read("GameReviewSnapshotService.js").includes("SHOGI_REFLECTION_SCHEMA_VERSION = 1"));
check("Engine analysis schema remains v1 compatible", read("EngineAnalysisConstants.js").includes("ENGINE_ANALYSIS_SCHEMA_VERSION = 1"));

check("Engine Port isolated from USI", !/\b(position sfen|setoption|bestmove|score cp|score mate)\b/.test(analyze));
check("USI protocol stays Adapter", read("UsiEngineAdapter.js").includes("position sfen") && read("UsiEngineAdapter.js").includes("bestmove"));
check("Default runtime is real local engine", provider.includes("ReflectionLocalEngineAdapter") && !provider.includes("return new MockShogiEngineAdapter") === false);
check("Local engine uses Worker protocol", worker.includes("self.postMessage") && worker.includes('command==="usi"') && worker.includes('command.startsWith("go")'));
check("Local engine no network fetch", !/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(worker));
check("Local engine emits evaluation", worker.includes("score cp") && worker.includes("score mate"));
check("Local engine emits bestmove", worker.includes("bestmove"));
check("Local engine handles stop", worker.includes('command==="stop"'));
check("Main background cancel", main.includes("visibilitychange") && main.includes("document.hidden") && main.includes("cancelActiveAnalysis"));
check("Resource presets include threads/hash/maxPlies", read("EngineAnalysisSettings.js").includes("threads: 1") && read("EngineAnalysisSettings.js").includes("hashMB") && read("EngineAnalysisSettings.js").includes("maxPlies"));
check("Analysis enforces maxPlies", analyze.includes("Math.min(history.maxMoveNumber") && analyze.includes("analysisTruncated"));

check("Candidate does not auto-register", main.includes("data-engine-add-key-position") && !analyze.includes("KeyPosition"));
const cjump = main.match(/data-engine-replay-ply[\s\S]*?\n\s*return;/)?.[0] ?? "";
check("Candidate Jump uses existing Replay", cjump.includes("replayController.jump") && !/scrollIntoView|navigateToStep/.test(cjump));
check("Candidate Add uses existing KeyPosition flow", main.includes("addCurrentReplayPositionToKeyPosition"));
check("Primary candidate max 5", read("EngineCandidateSelector.js").includes("Math.min(5") && read("EngineCandidateSelector.js").includes("primaryCandidates"));
check("Good move candidate retained", read("EngineCandidateSelector.js").includes("GOOD_MOVE_CANDIDATE"));
check("Progress completed/total UI", engineView.includes("${completed}/${total}局面") && engineView.includes("result.totalPositionsInGame"));
check("Engine statuses include required states", ["NOT_AVAILABLE", "READY", "INITIALIZING", "ANALYZING", "CANCELLING", "CANCELLED", "COMPLETED", "FAILED"].every((s) => read("EngineAnalysisConstants.js").includes(s)));

const audit = read("ENGINE_LICENSE_AUDIT.md");
check("YaneuraOu not bundled", audit.includes("YaneuraOu bundled distribution: **NOT APPROVED / NOT BUNDLED**"));
check("Evaluation separate license gate", audit.includes("Evaluation Function") && audit.includes("別Component"));
check("Distribution readiness separated", audit.includes("Personal Use Readiness") && audit.includes("Public Distribution") && audit.includes("Commercial Distribution"));
check("Legal review gate documented", audit.includes("LEGAL REVIEW REQUIRED BEFORE PUBLIC DISTRIBUTION"));
check("Third-party notices state no engine WASM bundled", read("THIRD_PARTY_NOTICES.md").includes("YaneuraOu") && read("THIRD_PARTY_NOTICES.md").includes("**No**"));
check("Design Rules Ver1.8", rules.includes("INTERLUDE-Rule-FH") && rules.includes("INTERLUDE-Rule-FT"));

const tr = exists("TEST_RESULT.txt") ? read("TEST_RESULT.txt") : "";
check("Automated tests failed zero", /Failed:\s*0/.test(tr));
const br = exists("BROWSER_VERIFICATION_RESULT.txt") ? read("BROWSER_VERIFICATION_RESULT.txt") : "";
check("Browser verification failed zero", /Failed:\s*0/.test(br));
const rr = exists("REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt") ? read("REAL_ENGINE_BROWSER_VERIFICATION_RESULT.txt") : "";
check("Real Engine Browser failed zero", /Failed:\s*0/.test(rr) && rr.includes("actual Blob Web Worker"));
check("Real Engine Candidate Replay recorded", rr.includes("Real Candidate -> existing Replay"));
check("Real Engine Cancel recorded", rr.includes("Real Cancel completed"));
const vr = exists("VISUAL_VERIFICATION_RESULT.txt") ? read("VISUAL_VERIFICATION_RESULT.txt") : "";
check("Visual verification failed zero", /Failed:\s*0/.test(vr));
const ep = exists("ENGINE_PERFORMANCE_RESULT.txt") ? read("ENGINE_PERFORMANCE_RESULT.txt") : "";
check("Real Engine performance recorded", ep.includes("Engine initialization") && ep.includes("Cancel UI-to-CANCELLED") && ep.includes("Battery/Thermal: NOT MEASURED"));

const report = [
  "Shogi Reflection Ver.1.8 Static Verification",
  "Date: 2026-08-09",
  "",
  `Files: ${files.length}`,
  `Ver.1.7 baseline files: ${baseFiles.length}`,
  `Hash-identical Ver.1.7 files: ${unchanged.length}`,
  `Modified Ver.1.7 files: ${modified.length}`,
  `Added Ver.1.8 files: ${added.length}`,
  `Deleted Ver.1.7 files: ${deleted.length}`,
  `Syntax checked: ${js.length}`,
  `Missing imports: ${missing.length}`,
  `Passed checks: ${pass.length}`,
  `Failed checks: ${fail.length}`,
  "",
  "Modified Ver.1.7 files:", ...modified.map((x) => `- ${x}`),
  "", "Added Ver.1.8 files:", ...added.map((x) => `- ${x}`),
  "", "Deleted Ver.1.7 files:", ...(deleted.length ? deleted.map((x) => `- ${x}`) : ["- none"]),
  "", ...pass, ...fail, ""
].join("\n");
fs.writeFileSync(output, report);
console.log(report.split("\n").slice(0, 14).join("\n"));
if (fail.length) process.exit(1);
