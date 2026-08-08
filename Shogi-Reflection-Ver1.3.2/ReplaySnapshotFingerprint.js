export function createKifFingerprint(kifuText) {
  const text = String(kifuText ?? "").replace(/\r\n/g, "\n").trim();
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `FNV1A32-${hash.toString(16).padStart(8, "0")}-${text.length}`;
}
