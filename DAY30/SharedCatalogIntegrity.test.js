import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as DiagnosisCodes from "./DiagnosisCodes.js";
import { ERROR_CODES } from "./DiagnosisErrors.js";
import {
  DEFAULT_ID_PREFIXES
} from "./SequentialIdGenerator.js";
import { ID_NAMESPACE } from "./DiagnosisCodes.js";

const ROOT = dirname(fileURLToPath(import.meta.url));

async function javaScriptFiles() {
  return (await readdir(ROOT))
    .filter((name) => name.endsWith(".js"))
    .map((name) => join(ROOT, name));
}

test("すべてのDiagnosisCodes named importが実在する", async () => {
  const missing = [];

  for (const file of await javaScriptFiles()) {
    const text = await readFile(file, "utf8");
    const expression = /import\s*\{([^}]+)\}\s*from\s*["']\.\/DiagnosisCodes\.js["']/gs;

    for (const match of text.matchAll(expression)) {
      const names = match[1]
        .split(",")
        .map((value) => value.trim().split(/\s+as\s+/)[0])
        .filter(Boolean);

      for (const name of names) {
        if (!(name in DiagnosisCodes)) {
          missing.push({ file, name });
        }
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("すべてのERROR_CODES参照がCatalogへ登録されている", async () => {
  const referenced = new Set();

  for (const file of await javaScriptFiles()) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/ERROR_CODES\.(\w+)/g)) {
      referenced.add(match[1]);
    }
  }

  const registered = new Set(Object.keys(ERROR_CODES));
  const missing = [...referenced]
    .filter((name) => !registered.has(name))
    .sort();

  assert.deepEqual(missing, []);
});

test("すべてのID Namespaceに一意なDefault Prefixがある", () => {
  const namespaces = Object.values(ID_NAMESPACE).sort();
  const configured = Object.keys(DEFAULT_ID_PREFIXES).sort();

  assert.deepEqual(configured, namespaces);
  assert.equal(
    new Set(Object.values(DEFAULT_ID_PREFIXES)).size,
    namespaces.length
  );
});
