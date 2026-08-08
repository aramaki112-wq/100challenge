function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

export function shogiPieceSvg(piece, { className = "replay-piece" } = {}) {
  if (!piece) return "";
  const label = String(piece.label ?? "");
  const classes = [className];
  if (piece.rotated) classes.push("is-rotated");
  if (piece.promoted) classes.push("is-promoted");
  if ([...label].length >= 2) classes.push("is-two-character");
  const promotionMark = piece.promoted
    ? '<path class="piece-promotion-mark" d="M27 20 H73" />'
    : "";
  return `<svg class="${classes.join(" ")}" viewBox="0 0 100 112" aria-hidden="true" focusable="false" data-piece-label="${escapeHtml(label)}" data-piece-type="${escapeHtml(piece.type ?? "")}" data-promoted="${piece.promoted ? "true" : "false"}">
    <polygon class="piece-body" points="18,8 82,8 94,104 6,104" />
    ${promotionMark}
    <text class="piece-label" x="50" y="67" text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text>
  </svg>`;
}
