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

function pieceLabelMarkup(label) {
  const characters = [...String(label ?? "")];
  if (characters.length === 2) {
    return `<text class="piece-label piece-label-stacked" x="50" text-anchor="middle" aria-hidden="true"><tspan x="50" y="48">${escapeHtml(characters[0])}</tspan><tspan x="50" y="77">${escapeHtml(characters[1])}</tspan></text>`;
  }
  return `<text class="piece-label" x="50" y="63" text-anchor="middle" dominant-baseline="middle" aria-hidden="true">${escapeHtml(label)}</text>`;
}

/**
 * Ver.1.7 original SVG piece.
 * - No external image/font asset.
 * - Same viewBox and fixed container contract as Ver.1.4.1/1.6.
 * - Geometry is presentation-only and never participates in board sizing.
 */
export function shogiPieceSvg(piece, { className = "replay-piece" } = {}) {
  if (!piece) return "";
  const label = String(piece.label ?? "");
  const classes = [className, ...pieceLabelClass(label)];
  if (piece.rotated) classes.push("is-rotated");
  if (piece.promoted) classes.push("is-promoted");
  return `<svg class="${classes.join(" ")}" viewBox="0 0 100 112" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" data-piece-label="${escapeHtml(label)}" data-piece-type="${escapeHtml(piece.type ?? "")}" data-promoted="${piece.promoted ? "true" : "false"}">
    <path class="piece-body" d="M50 5 C52 5 53.5 5.6 55.1 6.6 L81.2 21 C83.5 22.2 84.8 24.2 85.1 26.7 L93.2 99.2 C93.6 102.5 91.3 104.5 88.1 104.5 H11.9 C8.7 104.5 6.4 102.5 6.8 99.2 L14.9 26.7 C15.2 24.2 16.5 22.2 18.8 21 L44.9 6.6 C46.5 5.6 48 5 50 5 Z" />
    <path class="piece-face-highlight" d="M20.8 25.4 L46.6 11.3 C48.7 10.2 51.3 10.2 53.4 11.3 L79.2 25.4" />
    ${pieceLabelMarkup(label)}
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
