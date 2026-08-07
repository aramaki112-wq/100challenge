import { runTests } from "./testRunner.js";
import { registerCoreTests } from "./registerCoreTests.js";

registerCoreTests();
const results = await runTests();
for (const result of results) {
  const id = result.id ? `${result.id} ` : "";
  console.log(`${result.passed ? "PASS" : "FAIL"} ${id}${result.name}`);
  if (result.message) console.log(`  ${result.message}`);
}
const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
console.log(`\nTotal: ${results.length}, Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
