export const ENGINE_ANALYSIS_PRESET = Object.freeze({
  FAST: "FAST",
  STANDARD: "STANDARD",
  DETAILED: "DETAILED"
});

const PRESETS = Object.freeze({
  FAST: Object.freeze({ preset: "FAST", maxDepth: 8, maxNodes: null, maxTimeMs: null, multiPv: 2 }),
  STANDARD: Object.freeze({ preset: "STANDARD", maxDepth: 12, maxNodes: null, maxTimeMs: null, multiPv: 3 }),
  DETAILED: Object.freeze({ preset: "DETAILED", maxDepth: 16, maxNodes: null, maxTimeMs: null, multiPv: 3 })
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
    multiPv
  });
}
