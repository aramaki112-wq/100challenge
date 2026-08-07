import { readdirSync, readFileSync, existsSync } from "node:fs";
import { extname, resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const files = readdirSync(root).filter((name) =>
  [".js", ".mjs", ".html", ".css", ".md", ".json"].includes(extname(name))
);
const javascriptFiles = files.filter((name) => [".js", ".mjs"].includes(extname(name)));

const syntaxResults = [];
for (const file of javascriptFiles) {
  execFileSync(process.execPath, ["--check", resolve(root, file)], {
    stdio: "pipe"
  });
  syntaxResults.push(file);
}

const missingImports = [];
let importCount = 0;
const importPattern = /(?:from\s+|import\s*)["'](\.\.?\/[^"']+)["']/g;
for (const file of javascriptFiles) {
  const source = readFileSync(resolve(root, file), "utf8");
  for (const match of source.matchAll(importPattern)) {
    importCount += 1;
    const target = resolve(dirname(resolve(root, file)), match[1]);
    if (!existsSync(target)) {
      missingImports.push({ file, importPath: match[1] });
    }
  }
}

const missingHtmlReferences = [];
let htmlReferenceCount = 0;
const htmlPattern = /(?:src|href)=["'](\.\/[^"'#?]+)["']/g;
for (const file of files.filter((name) => extname(name) === ".html")) {
  const source = readFileSync(resolve(root, file), "utf8");
  for (const match of source.matchAll(htmlPattern)) {
    htmlReferenceCount += 1;
    const target = resolve(dirname(resolve(root, file)), match[1]);
    if (!existsSync(target)) {
      missingHtmlReferences.push({ file, reference: match[1] });
    }
  }
}

const result = {
  javascriptFileCount: javascriptFiles.length,
  syntaxPassed: syntaxResults.length,
  importCount,
  missingImports,
  htmlReferenceCount,
  missingHtmlReferences
};

console.log(JSON.stringify(result, null, 2));

if (missingImports.length > 0 || missingHtmlReferences.length > 0) {
  process.exit(1);
}
