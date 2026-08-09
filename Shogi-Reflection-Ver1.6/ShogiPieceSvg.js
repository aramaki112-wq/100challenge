function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function pieceLabelClass(label) {
  const normalized = String(label ?? "");
  const classes = [];
  if ([...normalized].length >= 2) classes.push("is-two-character");
  if (["成桂", "成香", "成銀"].includes(normalized)) classes.push(`is-${normalized}`);
  return classes;
}

export function shogiPieceSvg(piece, { className = "replay-piece" } = {}) {
  if (!piece) return "";
  const label = String(piece.label ?? "");
  const classes = [className, ...pieceLabelClass(label)];
  if (piece.rotated) classes.push("is-rotated");
  if (piece.promoted) classes.push("is-promoted");
  const promotionMark = piece.promoted
    ? '<path class="piece-promotion-mark" d="M28 24 H72" />'
    : "";
  return `<svg class="${classes.join(" ")}" viewBox="0 0 100 112" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" data-piece-label="${escapeHtml(label)}" data-piece-type="${escapeHtml(piece.type ?? "")}" data-promoted="${piece.promoted ? "true" : "false"}">
    <path class="piece-body" d="M50 5 Q52 5 54 6 L82 20 Q84 21 85 24 L94 101 Q94.4 104 91 104 L9 104 Q5.6 104 6 101 L15 24 Q16 21 18 20 L46 6 Q48 5 50 5 Z" />
    ${promotionMark}
    <text class="piece-label" x="50" y="68" text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text>
  </svg>`;
}

export function shogiPieceMarkup(piece, {
  svgClassName = "replay-piece",
  containerClassName = "piece-container"
} = {}) {
  if (!piece) return "";
  const label = String(piece.label ?? "");
  return `<span class="${escapeHtml(containerClassName)}" data-piece-container="true" data-piece-label="${escapeHtml(label)}">${shogiPieceSvg(piece, { className: svgClassName })}</span>`;
}
