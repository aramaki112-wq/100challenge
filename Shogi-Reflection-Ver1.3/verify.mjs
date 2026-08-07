import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(root, "SOURCE_OF_TRUTH_BASELINE_HASHES.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "VER1_3_CHANGE_MANIFEST.json"), "utf8"));
const outputPath = path.join(root, "STATIC_VERIFICATION_RESULT.txt");
const syntaxOutputPath = path.join(root, "SYNTAX_CHECK_RESULT.txt");

const normalize = (value) => value.split(path.sep).join("/");
const sha256 = (filePath) => crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
function listFiles(directory = root) {
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...listFiles(full));
    else rows.push(normalize(path.relative(root, full)));
  }
  return rows.sort();
}
function sameSet(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

const passes = [];
const failures = [];
function check(name, condition, detail = "") {
  const row = `${condition ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`;
  (condition ? passes : failures).push(row);
}

const allFiles = listFiles();
const baselineFiles = Object.keys(baseline.files).sort();
const currentSet = new Set(allFiles);
const baselineSet = new Set(baselineFiles);
const deleted = baselineFiles.filter((file) => !currentSet.has(file));
const added = allFiles.filter((file) => !baselineSet.has(file)).sort();
const modified = baselineFiles.filter((file) => exists(file) && sha256(path.join(root, file)) !== baseline.files[file]).sort();
const unchanged = baselineFiles.filter((file) => exists(file) && sha256(path.join(root, file)) === baseline.files[file]).sort();

check("Source archive", baseline.sourceArchive === "Shogi-Reflection-Ver1.2(2).zip", baseline.sourceArchive);
check("Ver.1.2 baseline file count", baseline.fileCount === 173, String(baseline.fileCount));
check("Deleted Ver.1.2 files", deleted.length === 0, deleted.join(", "));
check("Expected modified files", sameSet(modified, [...manifest.modifiedFiles].sort()), modified.join(", "));
check("Expected added files", sameSet(added, [...manifest.addedFiles].sort()), added.join(", "));
check("Expected deleted files", sameSet(deleted, [...manifest.deletedFiles].sort()), deleted.join(", "));
check("Unchanged baseline hash count", unchanged.length === manifest.unchangedFileCount, String(unchanged.length));

const jsFiles = allFiles.filter((file) => /\.(?:js|mjs)$/.test(file));
const syntaxRows = [];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
    syntaxRows.push(`PASS | ${file}`);
  } catch (error) {
    syntaxRows.push(`FAIL | ${file} | ${error.stderr?.toString().trim() ?? error.message}`);
    failures.push(`FAIL | Syntax: ${file}`);
  }
}
fs.writeFileSync(syntaxOutputPath, [
  "Shogi Reflection Ver.1.3 Syntax Check",
  "Date: 2026-08-02",
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
check("Missing Import", missingImports.length === 0, missingImports.join(", "));

const requiredFiles = [
  "ReplayPositionSnapshot.js", "BoardSnapshot.js", "HandSnapshot.js",
  "ShogiPositionSnapshot.js", "KeyPositionReplayReference.js",
  "ReplayPositionSnapshotFactory.js", "ReplayPositionSnapshotSerializer.js",
  "AddCurrentPositionToKeyPosition.js", "KeyPositionReplayController.js",
  "KeyPositionReplayViewModel.js", "KeyPositionReplayErrors.js",
  "ReplayPositionSnapshot.test.js", "KeyPositionReplayReference.test.js",
  "AddCurrentPositionToKeyPosition.test.js", "GameReviewReplayCompatibility.test.js",
  "KeyPositionReplayViewModel.test.js", "KeyPositionReplayIntegration.test.js",
  "BrowserKeyPositionReplayMarkup.test.js", "Ver.1.3操作手順書.md",
  "KEY_POSITION_REPLAY_CONNECTION.md", "SNAPSHOT_FORMAT.md",
  "SNAPSHOT_COMPATIBILITY_MATRIX.md", "SOURCE_OF_TRUTH_AUDIT.md",
  "COMPLETION_REPORT.md", "TEST_RESULT.txt", "BROWSER_VERIFICATION_RESULT.txt"
];
for (const file of requiredFiles) check(`Required file: ${file}`, exists(file));

const packageJson = JSON.parse(read("package.json"));
check("package version", packageJson.version === "1.3.0", packageJson.version);
check("test script", packageJson.scripts?.test === "node --test");
check("check script", packageJson.scripts?.check === "node verify.mjs");

const html = read("index.html");
for (const id of [
  "shogi-replay-panel", "shogi-board", "replay-status", "replay-move-list",
  "replay-warning", "replay-error", "add-current-position",
  "add-current-position-reason", "key-position-list", "game-review-form"
]) check(`Markup #${id}`, new RegExp(`id=["']${id}["']`).test(html));
check("Ver.1.3 title", html.includes("将棋振り返りアプリ Ver.1.3"));

const main = read("main.js");
for (const token of [
  "AddCurrentPositionToKeyPosition", "KeyPositionReplayController",
  "loadReplay(result.form.kifuText", "loadReplay(found.gameReview.kifuText",
  "formView.markReplayReferencesSaved"
]) check(`main connection: ${token}`, main.includes(token));
check("Add Service has no Repository dependency", !read("AddCurrentPositionToKeyPosition.js").includes("Repository"));
check("Snapshot Factory has no Browser dependency", !read("ReplayPositionSnapshotFactory.js").includes("document"));
check("GameReview has no Replay navigation dependency", !read("GameReview.js").includes("ShogiReplay"));
check("Browser View has no Snapshot Factory rule", !read("BrowserGameReviewFormView.js").includes("ReplayPositionSnapshotFactory"));
check("KifParser remains Replay-independent", !read("KifParser.js").includes("ReplayPositionSnapshot"));

const errorSource = read("KeyPositionReplayErrors.js");
for (const code of [
  "KEY_POSITION_REPLAY_NOT_AVAILABLE", "KEY_POSITION_REPLAY_MOVE_REQUIRED",
  "KEY_POSITION_REPLAY_SNAPSHOT_INVALID", "KEY_POSITION_REPLAY_DUPLICATE",
  "KEY_POSITION_LIMIT_REACHED", "KEY_POSITION_REPLAY_SOURCE_MISMATCH",
  "KEY_POSITION_REPLAY_REFERENCE_INVALID", "KEY_POSITION_SNAPSHOT_VERSION_UNSUPPORTED",
  "KEY_POSITION_REPLAY_ADD_FAILED"
]) check(`Replay connection error code ${code}`, errorSource.includes(code));
check("Replay connection error extends ApplicationError", errorSource.includes("extends ApplicationError"));

const rules = read("Design Rules.md");
for (const id of ["CO","CP","CQ","CR","CS","CT","CU","CV","CW","CX","CY","CZ"]) {
  check(`Design Rule ${id}`, rules.includes(`INTERLUDE-Rule-${id}`));
}
const handbook = read("Design Handbook.md");
check("Handbook four parts", (handbook.match(/^# 第[1-4]部/gm) ?? []).length === 4);
check("Handbook twelve steps", (handbook.match(/^## STEP/gm) ?? []).length === 12);
for (const label of [
  "### 1. 🎯 このSTEPの目的", "### 2. 🤔 なぜこの作業をするのか",
  "### 3. 💻 コードを書く", "### 4. 💡 設計者のひとこと",
  "### 5. ✅ チェックポイント", "### 6. ▶ 次へ進む条件"
]) check(`Handbook label ${label}`, handbook.split(label).length - 1 === 12);

const testResult = read("TEST_RESULT.txt");
check("Test total recorded", testResult.includes("Total: 458"));
check("Ver.1.2 tests recorded", testResult.includes("Ver.1.2 existing: 333"));
check("Ver.1.3 tests recorded", testResult.includes("Ver.1.3 added: 125"));
const browserResult = read("BROWSER_VERIFICATION_RESULT.txt");
check("Browser total recorded", browserResult.includes("Total: 116"));
check("Browser failed zero", browserResult.includes("Failed: 0"));

const report = [
  "Shogi Reflection Ver.1.3 Static Verification",
  "Date: 2026-08-02",
  "",
  `Files: ${allFiles.length}`,
  `Ver.1.2 baseline files: ${baselineFiles.length}`,
  `Unchanged baseline files: ${unchanged.length}`,
  `Modified baseline files: ${modified.length}`,
  `Added files: ${added.length}`,
  `Deleted baseline files: ${deleted.length}`,
  `Syntax checked: ${jsFiles.length}`,
  `Missing imports: ${missingImports.length}`,
  `Passed checks: ${passes.length}`,
  `Failed checks: ${failures.length}`,
  "",
  ...passes,
  ...failures,
  ""
].join("\n");
fs.writeFileSync(outputPath, report);
console.log(report.split("\n").slice(0, 13).join("\n"));
if (failures.length) process.exit(1);
