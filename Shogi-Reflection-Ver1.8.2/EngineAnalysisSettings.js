export const ENGINE_ANALYSIS_PRESET = Object.freeze({
  SMARTPHONE_SAFE: "SMARTPHONE_SAFE",
  DESKTOP_BALANCED: "DESKTOP_BALANCED",
  // Backward-compatible preset names from the Baseline.
  FAST: "FAST",
  STANDARD: "STANDARD",
  DETAILED: "DETAILED"
});

// Conservative starting values, not measured claims of optimality. Smartphone Safe deliberately
// defaults to MultiPV=1: Best Move + a short PV are enough for the first comparison pass and avoid
// multiplying search cost on mobile. Physical iPhone feedback remains a release-gate follow-up.
const PRESETS = Object.freeze({
  SMARTPHONE_SAFE: Object.freeze({
    preset: "SMARTPHONE_SAFE", maxDepth: 6, maxNodes: 5000, maxTimeMs: 220,
    multiPv: 1, threads: 1, hashMB: 16, maxPlies: 160
  }),
  DESKTOP_BALANCED: Object.freeze({
    preset: "DESKTOP_BALANCED", maxDepth: 8, maxNodes: 20000, maxTimeMs: 650,
    multiPv: 2, threads: 1, hashMB: 32, maxPlies: 240
  }),
  FAST: Object.freeze({ preset: "FAST", maxDepth: 2, maxNodes: 900, maxTimeMs: 80, multiPv: 2, threads: 1, hashMB: 16, maxPlies: 160 }),
  STANDARD: Object.freeze({ preset: "STANDARD", maxDepth: 2, maxNodes: 1600, maxTimeMs: 120, multiPv: 3, threads: 1, hashMB: 16, maxPlies: 200 }),
  DETAILED: Object.freeze({ preset: "DETAILED", maxDepth: 2, maxNodes: 3200, maxTimeMs: 220, multiPv: 3, threads: 1, hashMB: 24, maxPlies: 240 })
});

export function engineAnalysisSettings(value = ENGINE_ANALYSIS_PRESET.SMARTPHONE_SAFE) {
  if (typeof value === "string") {
    const preset = PRESETS[value];
    if (!preset) throw new TypeError("不明なEngine解析Presetです。");
    return { ...preset };
  }
  const multiPv = Number(value?.multiPv ?? 1);
  if (!Number.isInteger(multiPv) || multiPv < 1 || multiPv > 10) {
    throw new TypeError("multiPvは1〜10の整数で指定してください。");
  }
  const optionalPositiveInt = (item, name) => {
    if (item === null || item === undefined || item === "") return null;
    const number = Number(item);
    if (!Number.isInteger(number) || number <= 0) throw new TypeError(`${name}は正の整数で指定してください。`);
    return number;
  };
  return Object.freeze({
    preset: String(value?.preset ?? "CUSTOM"),
    maxDepth: optionalPositiveInt(value?.maxDepth, "maxDepth"),
    maxNodes: optionalPositiveInt(value?.maxNodes, "maxNodes"),
    maxTimeMs: optionalPositiveInt(value?.maxTimeMs, "maxTimeMs"),
    multiPv,
    threads: optionalPositiveInt(value?.threads ?? 1, "threads"),
    hashMB: optionalPositiveInt(value?.hashMB ?? 16, "hashMB"),
    maxPlies: optionalPositiveInt(value?.maxPlies ?? 160, "maxPlies")
  });
}
