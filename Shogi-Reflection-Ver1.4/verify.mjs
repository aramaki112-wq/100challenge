import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(root, "SOURCE_OF_TRUTH_V1_3_3_BASELINE_HASHES.json"), "utf8"));
const outputPath = path.join(root, "STATIC_VERIFICATION_RESULT.txt");
const syntaxOutputPath = path.join(root, "SYNTAX_CHECK_RESULT.txt");
const normalize = (value) => value.split(path.sep).join("/");
const sha256 = (filePath) => crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));

function listFiles(directory = root) {
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "__pycache__"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...listFiles(full));
    else rows.push(normalize(path.relative(root, full)));
  }
  return rows.sort();
}

const passes = [];
const failures = [];
function check(name, condition, detail = "") {
  const row = `${condition ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`;
  (condition ? passes : failures).push(row);
}

const allFiles = listFiles();
const baselineFiles = Object.keys(baseline.files).sort();
const current = new Set(allFiles);
const deleted = baselineFiles.filter((file) => !current.has(file));
const shared = baselineFiles.filter((file) => current.has(file));
const modified = shared.filter((file) => sha256(path.join(root, file)) !== baseline.files[file]).sort();
const unchanged = shared.filter((file) => sha256(path.join(root, file)) === baseline.files[file]).sort();
const added = allFiles.filter((file) => !baseline.files[file]).sort();

check("Ver.1.3.3 Source of Truth file count", baseline.fileCount === 229, String(baseline.fileCount));
check("No Ver.1.3.3 files deleted", deleted.length === 0, deleted.join(", "));

const jsFiles = allFiles.filter((file) => /\.(?:js|mjs)$/.test(file));
const syntaxRows = [];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
    syntaxRows.push(`PASS | ${file}`);
  } catch (error) {
    syntaxRows.push(`FAIL | ${file} | ${error.stderr?.toString().trim() ?? error.message}`);
  }
}
fs.writeFileSync(syntaxOutputPath, [
  "Shogi Reflection Ver.1.4 Syntax Check",
  "Date: 2026-08-08",
  `Files: ${jsFiles.length}`,
  "",
  ...syntaxRows,
  ""
].join("\n"));
check("All JavaScript syntax", syntaxRows.every((row) => row.startsWith("PASS")), String(jsFiles.length));

const missingImports = [];
for (const file of jsFiles) {
  const source = read(file);
  const pattern = /(?:from\s+|import\s*\()(["'])(\.\/[^"']+)\1/g;
  for (const match of source.matchAll(pattern)) {
    const target = path.resolve(path.dirname(path.join(root, file)), match[2]);
    if (!fs.existsSync(target)) missingImports.push(`${file} -> ${match[2]}`);
  }
}
check("Missing Import = 0", missingImports.length === 0, missingImports.join(", "));

const required = [
  "ReflectionWorkflowStatus.js", "WorkflowErrors.js", "BrowserStepNavigation.js",
  "BrowserApplicationView.js", "BrowserFinalReportView.js", "ShogiPieceSvg.js",
  "GameSaveWithoutReflectionV14.test.js", "ReflectionCompletionValidationV14.test.js",
  "SavedGameViewerV14.test.js", "StepNavigationV14.test.js", "BoardGraphicsV14.test.js",
  "HelpAndLifecycleCompatibilityV14.test.js", "STEP_UI_DESIGN.md", "GAME_SAVE_LIFECYCLE.md",
  "SAVED_GAME_VIEWER_DESIGN.md", "SHOGI_BOARD_GRAPHICS_GUIDELINE.md", "ASSET_LICENSE_POLICY.md",
  "USER_MANUAL.md", "Ver.1.4操作手順書.md", "SOURCE_OF_TRUTH_AUDIT.md", "COMPLETION_REPORT.md"
];
for (const file of required) check(`Required Ver.1.4 file: ${file}`, exists(file));

const packageJson = JSON.parse(read("package.json"));
check("package version", packageJson.version === "1.4.0", packageJson.version);
check("test script", packageJson.scripts?.test === "node --test");
check("check script", packageJson.scripts?.check === "node verify.mjs");

const html = read("index.html");
for (const id of [
  "workflow-view", "library-view", "help-view", "step-current-status", "step-menu",
  "save-game-and-exit", "save-reflection-draft", "complete-reflection", "saved-review-library",
  "final-report-preview", "nav-help", "kif-paste-text", "clear-kif-paste", "replay-next",
  "replay-previous", "replay-move-list", "shogi-board"
]) check(`Markup #${id}`, new RegExp(`id=["']${id}["']`).test(html));
check("Seven Step panels", (html.match(/data-step-panel=/g) ?? []).length === 7, String((html.match(/data-step-panel=/g) ?? []).length));
check("Japanese workflow statuses", ["棋譜のみ", "振り返り中", "振り返り完了"].every((label) => read("ReflectionWorkflowStatus.js").includes(label)));
check("Sente/Gote editable fields", html.includes('name="senteName"') && html.includes('name="goteName"'));
check("Context Help links", (html.match(/data-help-target=/g) ?? []).length >= 7);
check("Delete and Clear labels separated", html.includes("入力をクリア") && read("BrowserGameReviewLibraryView.js").includes("対局を削除") && read("main.js").includes("別操作です"));

const submit = read("SubmitGameReviewForm.js");
const review = read("GameReview.js");
check("Save/Complete intents separated", submit.includes("SAVE_GAME") && submit.includes("COMPLETE_REFLECTION"));
check("Completion status validation", review.includes("REFLECTION_NOT_READY_FOR_COMPLETION") && review.includes("isReadyForNextGame"));
check("3-5 KeyPosition rule retained", review.includes("keyPositions.length > 5") && review.includes("this.keyPositions.length >= 3"));
check("1-3 action rule retained", review.includes("actionRules.length > 3") && review.includes("this.actionRules.length >= 1"));
check("Observation Theme retained", review.includes('this.observationTheme !== ""'));

const presenter = read("GameReviewLibraryPresenter.js");
check("Viewer summary avoids PositionHistory", !presenter.includes("PositionHistory") && !presenter.includes("ShogiReplay"));
check("Viewer counts KIF without replay construction", presenter.includes("countKifMoves"));

const piece = read("ShogiPieceSvg.js");
const css = read("style.css");
check("Original SVG piece component", piece.includes("<polygon") && piece.includes("piece-label") && piece.includes("is-two-character"));
check("No external image URL in Piece component", !/https?:\/\//.test(piece) && !/<image\b/i.test(piece));
check("Promoted visual marker", piece.includes("piece-promotion-mark") && piece.includes("is-promoted"));
check("Smartphone CSS", /@media \(max-width:800px\)/.test(css));
check("48px Replay touch target", /replay-navigation[\s\S]*min-height\s*:\s*48px/.test(css));

for (const core of ["ReplayScrollPolicy.js", "PositionHistory.js", "ShogiReplayApplicationService.js", "AddCurrentPositionToKeyPosition.js", "ReplayPositionSnapshotFactory.js", "LocalStorageSnapshotStore.js", "LICENSE"]) {
  check(`${core} hash preserved`, baseline.files[core] === sha256(path.join(root, core)));
}
const replayPolicy = read("ReplayScrollPolicy.js");
check("ReplayScrollPolicy no page scrolling", !/window\.scroll(?:To|By)|scrollIntoView/.test(replayPolicy));
check("ReplayScrollPolicy internal scroll", replayPolicy.includes("container.scrollTop = nextScrollTop"));

const snapshotMapper = read("GameReviewSnapshotMapper.js");
check("Backup includes lifecycle fields", ["workflowStatus", "createdAt", "updatedAt"].every((x) => snapshotMapper.includes(x)));
check("Backup remains schemaVersion 1", read("GameReviewSnapshotService.js").includes("SHOGI_REFLECTION_SCHEMA_VERSION = 1"));
check("Legacy backup lifecycle fallback", review.includes("workflowStatus ?? inferred"));

const testResult = exists("TEST_RESULT.txt") ? read("TEST_RESULT.txt") : "";
check("Automated total recorded", /Total:\s*543/.test(testResult), testResult.match(/Total:\s*\d+/)?.[0] ?? "missing");
check("Automated failed zero", /Failed:\s*0/.test(testResult));
const browserResult = exists("BROWSER_VERIFICATION_RESULT.txt") ? read("BROWSER_VERIFICATION_RESULT.txt") : "";
check("Browser total recorded", /Checks:\s*86/.test(browserResult), browserResult.match(/Checks:\s*\d+/)?.[0] ?? "missing");
check("Browser failed zero", /Failed:\s*0/.test(browserResult));
check("Browser game-only save verified", browserResult.includes("Game-only persisted"));
check("Browser saved viewer verified", browserResult.includes("Saved detail opens"));
check("Browser board graphics verified", browserResult.includes("Promoted piece browser render 成桂") && browserResult.includes("Horse promoted SVG"));
check("Browser Backup Restore verified", browserResult.includes("Backup Restore"));
check("Browser Replay Scroll verified", browserResult.includes("Long Next page scroll stable") && browserResult.includes("Move list internal scroll follows"));

const report = [
  "Shogi Reflection Ver.1.4 Static Verification",
  "Date: 2026-08-08",
  "",
  `Files: ${allFiles.length}`,
  `Ver.1.3.3 baseline files: ${baselineFiles.length}`,
  `Unchanged Ver.1.3.3 files: ${unchanged.length}`,
  `Modified Ver.1.3.3 files: ${modified.length}`,
  `Added Ver.1.4 files: ${added.length}`,
  `Deleted Ver.1.3.3 files: ${deleted.length}`,
  `Syntax checked: ${jsFiles.length}`,
  `Missing imports: ${missingImports.length}`,
  `Passed checks: ${passes.length}`,
  `Failed checks: ${failures.length}`,
  "",
  "Modified Ver.1.3.3 files:", ...modified.map((x) => `- ${x}`),
  "", "Added Ver.1.4 files:", ...added.map((x) => `- ${x}`),
  "", ...passes, ...failures, ""
].join("\n");
fs.writeFileSync(outputPath, report);
console.log(report.split("\n").slice(0, 13).join("\n"));
if (failures.length) process.exit(1);
