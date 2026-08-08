import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(root, "SOURCE_OF_TRUTH_V1_4_BASELINE_HASHES.json"), "utf8"));
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
    if (entry.name === "browser-verification-backup.json") continue;
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
const added = allFiles.filter((file) => !(file in baseline.files)).sort();

check("Ver.1.4 Source of Truth file count", baseline.fileCount === 250 && baselineFiles.length === 250, `${baseline.fileCount}/${baselineFiles.length}`);
check("No Ver.1.4 files deleted", deleted.length === 0, deleted.join(", "));
check("Temporary browser backup excluded", !exists("browser-verification-backup.json"));

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
  "Shogi Reflection Ver.1.4.1 Syntax Check",
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
  const pattern = /(?:from\s+|import\s*\()(["'])(\.\.?\/[^"']+)\1/g;
  for (const match of source.matchAll(pattern)) {
    const target = path.resolve(path.dirname(path.join(root, file)), match[2]);
    if (!fs.existsSync(target)) missingImports.push(`${file} -> ${match[2]}`);
  }
}
check("Missing Import = 0", missingImports.length === 0, missingImports.join(", "));

const required = [
  "ReflectionWorkflowStatus.js", "BrowserStepNavigation.js", "BrowserShogiReplayView.js",
  "BrowserGameReviewLibraryView.js", "GameReviewLibraryPresenter.js", "ShogiPieceSvg.js",
  "FixedBoardGridV141.test.js", "PieceLayoutV141.test.js", "SavedGameSummaryV141.test.js",
  "BOARD_FIXED_GRID_DESIGN.md", "SAVED_GAME_SUMMARY_DISPLAY_DESIGN.md", "Ver.1.4.1操作手順書.md",
  "USER_MANUAL.md", "Design Handbook.md", "Design Rules.md", "Review Checklist.md",
  "SOURCE_OF_TRUTH_AUDIT.md", "COMPLETION_REPORT.md", "LICENSE"
];
for (const file of required) check(`Required file: ${file}`, exists(file));

const packageJson = JSON.parse(read("package.json"));
check("package version", packageJson.version === "1.4.1", packageJson.version);
check("test script", packageJson.scripts?.test === "node --test");
check("check script", packageJson.scripts?.check === "node verify.mjs");

const html = read("index.html");
check("Ver.1.4.1 Japanese title", html.includes("Ver.1.4.1") && html.includes("固定Grid"));
check("Seven Step panels", (html.match(/data-step-panel=/g) ?? []).length === 7, String((html.match(/data-step-panel=/g) ?? []).length));
check("KIF Clear retained", html.includes("入力をクリア"));
check("Help explains fixed grid", html.includes("固定9×9") || html.includes("固定された9×9"));
check("Help explains saved summary", html.includes("対局日") && html.includes("戦型") && html.includes("KIF Header"));
check("Japanese workflow statuses", ["棋譜のみ", "振り返り中", "振り返り完了"].every((label) => read("ReflectionWorkflowStatus.js").includes(label)));

const review = read("GameReview.js");
const submit = read("SubmitGameReviewForm.js");
check("Save/Complete intents retained", submit.includes("SAVE_GAME") && submit.includes("COMPLETE_REFLECTION"));
check("3-5 KeyPosition rule retained", review.includes("keyPositions.length > 5") && review.includes("this.keyPositions.length >= 3"));
check("Observation Theme retained", review.includes('this.observationTheme !== ""'));
check("1-3 action rule retained", review.includes("actionRules.length > 3") && review.includes("this.actionRules.length >= 1"));

const css = read("style.css");
const piece = read("ShogiPieceSvg.js");
const replayView = read("BrowserShogiReplayView.js");
const formView = read("BrowserGameReviewFormView.js");
check("Replay/Snapshot explicit 9x9 rows and columns", /grid-template-columns\s*:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/.test(css) && /grid-template-rows\s*:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/.test(css));
check("Square geometry isolated", /\.replay-square,\s*\n\.snapshot-square/.test(css) && /contain\s*:\s*layout paint/.test(css) && /overflow\s*:\s*hidden/.test(css));
check("Piece Container CSS", css.includes(".replay-piece-container") && css.includes(".snapshot-piece-container"));
check("Replay uses Piece Container", replayView.includes("shogiPieceMarkup") && replayView.includes('containerClassName: "replay-piece-container"'));
check("Snapshot uses Piece Container", formView.includes("shogiPieceMarkup") && formView.includes('containerClassName: "snapshot-piece-container"'));
check("Real five-point piece polygon", piece.includes('points="50,5 84,22 94,104 6,104 16,22"'));
check("Two-character piece classes", piece.includes("is-two-character") && ["is-成桂", "is-成香", "is-成銀"].every((x) => css.includes(x)));
check("Promotion mark retained", piece.includes("piece-promotion-mark") && piece.includes("is-promoted"));
check("SVG visual overflow bounded", /max-width\s*:\s*100%/.test(css) && /max-height\s*:\s*100%/.test(css) && /overflow\s*:\s*hidden/.test(css));
check("Smartphone CSS retained", /@media \(max-width:\s*800px\)/.test(css));
check("48px Replay touch target retained", /replay-navigation[\s\S]*min-height\s*:\s*48px/.test(css));

const presenter = read("GameReviewLibraryPresenter.js");
const libraryView = read("BrowserGameReviewLibraryView.js");
check("Viewer summary avoids Replay construction", !presenter.includes("PositionHistory") && !presenter.includes("ShogiReplay"));
check("Viewer counts KIF without Replay", presenter.includes("countKifMoves"));
check("Raw KIF removed from storyExcerpt fallback", presenter.includes("storyExcerpt: excerpt(source.gameStory || source.decisionPattern)") && !presenter.includes("source.gameStory || source.decisionPattern || source.kifuText"));
check("Opening summary extracted", presenter.includes("extractOpeningName") && presenter.includes("openingNameLabel"));
check("Unknown opening is Japanese", presenter.includes('return "未設定"'));
check("Game date separated from timestamps", presenter.includes("displayGameDate") && presenter.includes("displayDateTime"));
check("Saved card has game-date label", libraryView.includes("対局日："));
check("Saved card has opening label", libraryView.includes("戦型："));
check("Saved card keeps opponent/result/moves/status", ["対戦相手：", "勝敗：", "手数：", "workflowStatusLabel"].every((x) => libraryView.includes(x)));

const corePreserved = [
  "GameReview.js", "GameReviewRepository.js", "InMemoryGameReviewRepository.js",
  "LocalStorageSnapshotStore.js", "GameReviewSnapshotService.js", "GameReviewSnapshotMapper.js",
  "PositionHistory.js", "ShogiReplayApplicationService.js", "ShogiReplayViewModel.js",
  "ReplayScrollPolicy.js", "ReplayPositionSnapshot.js", "ReplayPositionSnapshotFactory.js",
  "KeyPosition.js", "KeyPositionReplayReference.js", "AddCurrentPositionToKeyPosition.js",
  "ReflectionBackupController.js", "GameReviewMarkdownFormatter.js", "ObservationCardMarkdownFormatter.js",
  "BrowserStepNavigation.js", "LICENSE"
];
for (const core of corePreserved) {
  check(`${core} hash preserved`, exists(core) && baseline.files[core] === sha256(path.join(root, core)));
}

const replayPolicy = read("ReplayScrollPolicy.js");
check("ReplayScrollPolicy no page scrolling", !/window\.scroll(?:To|By)|scrollIntoView/.test(replayPolicy));
check("ReplayScrollPolicy internal list scroll retained", replayPolicy.includes("container.scrollTop = nextScrollTop"));
check("Backup remains schemaVersion 1", read("GameReviewSnapshotService.js").includes("SHOGI_REFLECTION_SCHEMA_VERSION = 1"));

const rules = read("Design Rules.md");
check("Design Rules continue ED -> EL", ["INTERLUDE-Rule-ED", "INTERLUDE-Rule-EE", "INTERLUDE-Rule-EL"].every((x) => rules.includes(x)));

const testResult = exists("TEST_RESULT.txt") ? read("TEST_RESULT.txt") : "";
check("Automated total recorded", /Total:\s*567/.test(testResult), testResult.match(/Total:\s*\d+/)?.[0] ?? "missing");
check("Automated passed recorded", /Passed:\s*567/.test(testResult));
check("Automated failed zero", /Failed:\s*0/.test(testResult));
const browserResult = exists("BROWSER_VERIFICATION_RESULT.txt") ? read("BROWSER_VERIFICATION_RESULT.txt") : "";
check("Browser total recorded", /Checks:\s*107/.test(browserResult), browserResult.match(/Checks:\s*\d+/)?.[0] ?? "missing");
check("Browser passed recorded", /Passed:\s*107/.test(browserResult));
check("Browser failed zero", /Failed:\s*0/.test(browserResult));
check("Browser saved summary verified", browserResult.includes("対局日：2026/08/02") && browserResult.includes("戦型：四間飛車"));
check("Browser fixed-grid promoted pieces verified", ["Fixed grid injected 成桂", "Fixed grid injected 成香", "Fixed grid injected 成銀", "Fixed grid injected 馬", "Fixed grid injected 龍"].every((x) => browserResult.includes(x)));
check("Browser snapshot fixed grid verified", browserResult.includes("Snapshot fixed grid geometry"));
check("Browser Replay Scroll regression verified", browserResult.includes("Long first 10 next page scroll stable") && browserResult.includes("Long Previous page scroll stable") && browserResult.includes("Keyboard page scroll stable") && browserResult.includes("Move list internal scroll follows"));
check("Browser Backup Restore verified", browserResult.includes("Backup Restore"));

const report = [
  "Shogi Reflection Ver.1.4.1 Static Verification",
  "Date: 2026-08-08",
  "",
  `Files: ${allFiles.length}`,
  `Ver.1.4 baseline files: ${baselineFiles.length}`,
  `Hash-identical Ver.1.4 files: ${unchanged.length}`,
  `Modified Ver.1.4 files: ${modified.length}`,
  `Added Ver.1.4.1 files: ${added.length}`,
  `Deleted Ver.1.4 files: ${deleted.length}`,
  `Syntax checked: ${jsFiles.length}`,
  `Missing imports: ${missingImports.length}`,
  `Passed checks: ${passes.length}`,
  `Failed checks: ${failures.length}`,
  "",
  "Modified Ver.1.4 files:", ...modified.map((x) => `- ${x}`),
  "", "Added Ver.1.4.1 files:", ...added.map((x) => `- ${x}`),
  "", "Deleted Ver.1.4 files:", ...(deleted.length ? deleted.map((x) => `- ${x}`) : ["- none"]),
  "", ...passes, ...failures, ""
].join("\n");
fs.writeFileSync(outputPath, report);
console.log(report.split("\n").slice(0, 13).join("\n"));
if (failures.length) process.exit(1);
