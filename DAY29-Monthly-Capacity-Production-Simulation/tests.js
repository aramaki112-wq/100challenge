import { runTests } from "./testRunner.js";
import { registerCoreTests } from "./registerCoreTests.js";
import { registerBrowserUiTests } from "./browserUi.test.js";
import { registerDay29BrowserUiTests } from "./day29BrowserUi.test.js";

registerCoreTests();
registerBrowserUiTests();
registerDay29BrowserUiTests();
const results = await runTests();
const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
const successRate = results.length === 0 ? 0 : Math.round((passed / results.length) * 100);

document.querySelector("#total").textContent = String(results.length);
document.querySelector("#passed").textContent = String(passed);
document.querySelector("#failed").textContent = String(failed);
document.querySelector("#successRate").textContent = `${successRate}%`;
document.querySelector("#results").innerHTML = results.map((result) => `
  <article class="test-result ${result.passed ? "passed" : "failed"}">
    <strong>${result.passed ? "PASS" : "FAIL"}</strong>
    <span>${result.id ? `${result.id} ` : ""}${result.name}</span>
    ${result.message ? `<pre>${result.message}</pre>` : ""}
  </article>
`).join("");
