import {
  MARKDOWN_EXPORT_ERROR_CODES,
  MarkdownExportError
} from "./MarkdownExportErrors.js";

export function requireGameReviewSnapshot(snapshot) {
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new MarkdownExportError(
      MARKDOWN_EXPORT_ERROR_CODES.INVALID_GAME_REVIEW_SNAPSHOT,
      "GameReview Snapshotを指定してください。"
    );
  }
  const required = ["reviewId", "gameDate", "side", "result", "kifuText"];
  for (const field of required) {
    if (typeof snapshot[field] !== "string" || snapshot[field].trim() === "") {
      throw new MarkdownExportError(
        MARKDOWN_EXPORT_ERROR_CODES.INVALID_GAME_REVIEW_SNAPSHOT,
        `GameReview Snapshotの${field}が不正です。`,
        { field }
      );
    }
  }
  if (!Array.isArray(snapshot.keyPositions) || !Array.isArray(snapshot.actionRules)) {
    throw new MarkdownExportError(
      MARKDOWN_EXPORT_ERROR_CODES.INVALID_GAME_REVIEW_SNAPSHOT,
      "GameReview Snapshotの配列項目が不正です。"
    );
  }
  return snapshot;
}

export function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

export function markdownValue(value, fallback = "未記入") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function markdownList(items, { ordered = false, fallback = "未記入" } = {}) {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${markdownValue(item)}`).join("\n");
}

export function fencedText(value, language = "text") {
  const text = String(value ?? "");
  const fence = text.includes("```") ? "````" : "```";
  return `${fence}${language}\n${text}\n${fence}`;
}

export function uniqueNonEmpty(items, limit = Number.POSITIVE_INFINITY) {
  const seen = new Set();
  const result = [];
  for (const value of items) {
    const text = String(value ?? "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}
