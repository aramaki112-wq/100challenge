function requireText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name}は必須です。`);
  }
  return value.trim();
}

export function toTokyoDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("有効な日時を指定してください。");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).reduce((result, item) => {
    result[item.type] = item.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function safeFilePart(value, fallback = "untitled") {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|#^\[\]\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-]+|[.\-]+$/g, "")
    .slice(0, 90);
  return normalized || fallback;
}

export function createReviewMarkdownNames({ reviewId, gameDate } = {}) {
  const id = safeFilePart(requireText(reviewId, "reviewId"), "review");
  const dateKey = toTokyoDateKey(gameDate);
  const reviewNoteTitle = `将棋対局振り返り-${dateKey}-${id}`;
  const observationCardTitle = `次局用Observation Card-${dateKey}-${id}`;
  return Object.freeze({
    dateKey,
    reviewNoteTitle,
    reviewFileName: `${reviewNoteTitle}.md`,
    observationCardTitle,
    observationCardFileName: `${observationCardTitle}.md`
  });
}
