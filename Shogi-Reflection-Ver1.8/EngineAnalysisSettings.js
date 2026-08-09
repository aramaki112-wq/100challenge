export const ENGINE_ANALYSIS_PRESET = Object.freeze({
  FAST: "FAST",
  STANDARD: "STANDARD",
  DETAILED: "DETAILED"
});

// Smartphone-first conservative defaults. These values are safety-oriented starting points,
// not claims of optimal strength/performance. The UI intentionally does not expose them.
const PRESETS = Object.freeze({
  FAST: Object.freeze({ preset: "FAST", maxDepth: 2, maxNodes: 900, maxTimeMs: 80, multiPv: 2, threads: 1, hashMB: 16, maxPlies: 160 }),
  STANDARD: Object.freeze({ preset: "STANDARD", maxDepth: 2, maxNodes: 1600, maxTimeMs: 120, multiPv: 3, threads: 1, hashMB: 16, maxPlies: 200 }),
  DETAILED: Object.freeze({ preset: "DETAILED", maxDepth: 2, maxNodes: 3200, maxTimeMs: 220, multiPv: 3, threads: 1, hashMB: 24, maxPlies: 240 })
});

export function engineAnalysisSettings(value = ENGINE_ANALYSIS_PRESET.STANDARD) {
  if (typeof value === "string") {
    const preset = PRESETS[value];
    if (!preset) throw new TypeError("不明なEngine解析Presetです。");
    return { ...preset };
  }
  const multiPv = Number(value?.multiPv ?? 3);
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
    maxPlies: optionalPositiveInt(value?.maxPlies ?? 200, "maxPlies")
  });
}
