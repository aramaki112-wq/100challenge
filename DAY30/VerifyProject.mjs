import { readdir, readFile, access, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const requiredRootFiles = [
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "challenge.md",
  "Design-Decisions.md",
  "index.html",
  "style.css",
  "main.js"
];
const requiredObsidianFiles = [
  "Explanation.md",
  "Thought Process.md",
  "Design Novel.md",
  "Design Handbook.md",
  "Design Rules.md",
  "Review Checklist.md",
  "Learning Roadmap.md"
].map((name) => path.join("Obsidian", name));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git"].includes(entry.name)) continue;
      files.push(...await listFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

const errors = [];
for (const file of [...requiredRootFiles, ...requiredObsidianFiles]) {
  try {
    const info = await stat(path.join(root, file));
    if (!info.isFile() || info.size === 0) errors.push(`Empty required file: ${file}`);
  } catch {
    errors.push(`Missing required file: ${file}`);
  }
}

const allFiles = await listFiles(root);
const jsFiles = allFiles.filter((file) => /\.(?:js|mjs)$/.test(file));
let syntaxPassed = 0;
let importCount = 0;

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    errors.push(`Syntax error: ${relative(file)}\n${result.stderr.trim()}`);
  } else {
    syntaxPassed += 1;
  }

  const source = await readFile(file, "utf8");
  const importPattern = /(?:from\s+|import\s*\()(["'])(\.\.?\/[^"']+)\1/g;
  for (const match of source.matchAll(importPattern)) {
    importCount += 1;
    const target = path.resolve(path.dirname(file), match[2]);
    const candidates = [target, `${target}.js`, `${target}.mjs`, path.join(target, "index.js")];
    let found = false;
    for (const candidate of candidates) {
      try { await access(candidate); found = true; break; } catch {}
    }
    if (!found) errors.push(`Missing import: ${relative(file)} -> ${match[2]}`);
  }
}

const html = await readFile(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("./") || !value.includes(":"));
for (const ref of refs) {
  try { await access(path.resolve(root, ref)); }
  catch { errors.push(`Missing HTML reference: ${ref}`); }
}

const handbook = await readFile(path.join(root, "Obsidian", "Design Handbook.md"), "utf8");
for (const heading of ["### 目的", "### 理由", "### コード", "### 設計者のひとこと", "### チェックポイント", "### 次へ進む条件"]) {
  if (!handbook.includes(heading)) errors.push(`Design Handbook missing heading: ${heading}`);
}

console.log(`JavaScript / MJS: ${jsFiles.length}`);
console.log(`Syntax Passed: ${syntaxPassed}`);
console.log(`Import Count: ${importCount}`);
console.log(`HTML Reference Count: ${refs.length}`);
console.log(`Required Formal Files: ${requiredRootFiles.length + requiredObsidianFiles.length}`);

if (errors.length > 0) {
  console.error("\nVerification errors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Missing Imports: 0");
  console.log("Missing HTML References: 0");
  console.log("Formal Artifacts: PASS");
}
