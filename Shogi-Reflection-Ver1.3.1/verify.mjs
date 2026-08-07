import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(root, "SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json"), "utf8"));
const outputPath = path.join(root, "STATIC_VERIFICATION_RESULT.txt");
const syntaxOutputPath = path.join(root, "SYNTAX_CHECK_RESULT.txt");
const normalize = (value) => value.split(path.sep).join("/");
const sha256 = (filePath) => crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
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
check("Ver.1.3 Source of Truth file count", baseline.fileCount === 199, String(baseline.fileCount));
check("No Ver.1.3 files deleted", deleted.length === 0, deleted.join(", "));

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
  "Shogi Reflection Ver.1.3.1 Syntax Check",
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
check("Missing Import", missingImports.length === 0, missingImports.join(", "));

for (const file of [
  "BrowserKifClipboardAdapter.js", "KifPastedTextAdapter.js",
  "BrowserKifClipboardAdapter.test.js", "KifPastedTextAdapter.test.js",
  "Ver.1.3.1操作手順書.md", "SOURCE_OF_TRUTH_V1_3_BASELINE_HASHES.json"
]) check(`Required Ver.1.3.1 file: ${file}`, exists(file));

const packageJson = JSON.parse(read("package.json"));
check("package version", packageJson.version === "1.3.1", packageJson.version);
check("test script", packageJson.scripts?.test === "node --test");
check("check script", packageJson.scripts?.check === "node verify.mjs");

const html = read("index.html");
for (const id of ["kif-paste-text", "read-kif-clipboard", "preview-kif-paste", "kif-import-preview", "game-review-form"]) {
  check(`Markup #${id}`, new RegExp(`id=["']${id}["']`).test(html));
}
check("Ver.1.3.1 title", html.includes("将棋振り返りアプリ Ver.1.3.1"));

const main = read("main.js");
for (const token of ["BrowserKifClipboardAdapter", "KifPastedTextAdapter", "previewKifText", "selectText({ text, sourceFileName })"]) {
  check(`main paste connection: ${token}`, main.includes(token));
}
check("Existing file import retained", main.includes("previewKifFile"));
check("Existing key position connection retained", main.includes("KeyPositionReplayController"));
check("Existing Markdown export retained", main.includes("createObservationCardMarkdown") && main.includes("createGameReviewMarkdown"));

const testResult = read("TEST_RESULT.txt");
check("Automated total recorded", testResult.includes("Total: 471"));
check("Automated failed zero", testResult.includes("Failed: 0"));
const browserResult = read("BROWSER_VERIFICATION_RESULT.txt");
check("Browser total recorded", browserResult.includes("Total: 133"));
check("Browser failed zero", browserResult.includes("Failed: 0"));

const report = [
  "Shogi Reflection Ver.1.3.1 Static Verification",
  "Date: 2026-08-08",
  "",
  `Files: ${allFiles.length}`,
  `Ver.1.3 baseline files: ${baselineFiles.length}`,
  `Unchanged Ver.1.3 files: ${unchanged.length}`,
  `Modified Ver.1.3 files: ${modified.length}`,
  `Added Ver.1.3.1 files: ${added.length}`,
  `Deleted Ver.1.3 files: ${deleted.length}`,
  `Syntax checked: ${jsFiles.length}`,
  `Missing imports: ${missingImports.length}`,
  `Passed checks: ${passes.length}`,
  `Failed checks: ${failures.length}`,
  "",
  "Modified Ver.1.3 files:", ...modified.map((x) => `- ${x}`),
  "", "Added files:", ...added.map((x) => `- ${x}`),
  "", ...passes, ...failures, ""
].join("\n");
fs.writeFileSync(outputPath, report);
console.log(report.split("\n").slice(0, 13).join("\n"));
if (failures.length) process.exit(1);
