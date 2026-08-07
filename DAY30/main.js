import { createBrowserDemoHarness } from "./BrowserDemoData.js";

const harness = createBrowserDemoHarness({
  document,
  storage: globalThis.localStorage,
  rootSelector: "#app"
});

harness.application.start({
  targetMonth: "2026-08",
  activeOnly: true,
  evaluationDate: "2026-08-03"
}).catch((error) => {
  console.error("DAY30 Browser application failed to start.", error);
});

// Browser Consoleで学習・確認しやすいよう、Demo Harnessを参照可能にする。
globalThis.DAY30_DEMO = harness;
