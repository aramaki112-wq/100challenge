import { ReplayScrollPolicy } from "./ReplayScrollPolicy.js";
import { shogiPieceSvg } from "./ShogiPieceSvg.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function moveListSignature(viewModel) {
  const moves = viewModel.moves
    .map((move) => `${move.moveNumber}:${move.notation}`)
    .join("\u001f");
  const termination = viewModel.termination
    ? `${viewModel.termination.moveNumber}:${viewModel.termination.notation}`
    : "";
  return `${moves}\u001e${termination}`;
}

function replayStatusLabel(status) {
  const labels = { READY: "再現可能", PARTIAL: "一部再現", EMPTY: "棋譜なし" };
  return labels[status] ?? String(status ?? "");
}

export class BrowserShogiReplayView {
  constructor({
    documentObject = document,
    scrollPolicy = new ReplayScrollPolicy()
  } = {}) {
    this.document = documentObject;
    this.scrollPolicy = scrollPolicy;
    this.panel = this.#required("shogi-replay-panel");
    this.board = this.#required("shogi-board");
    this.senteHand = this.#required("sente-hand");
    this.goteHand = this.#required("gote-hand");
    this.status = this.#required("replay-status");
    this.moveList = this.#required("replay-move-list");
    this.warning = this.#required("replay-warning");
    this.error = this.#required("replay-error");
    this.empty = this.#required("replay-empty");
    this.firstButton = this.#required("replay-first");
    this.previousButton = this.#required("replay-previous");
    this.nextButton = this.#required("replay-next");
    this.lastButton = this.#required("replay-last");
    this.range = this.#required("replay-jump");
    this.numberInput = this.#required("replay-jump-number");
    this.flipButton = this.#required("replay-flip");
    this.jumpButton = this.#required("replay-jump-button");
    this.addPositionButton = this.#required("add-current-position");
    this.addPositionReason = this.#required("add-current-position-reason");
    this.keyPositionCount = 0;
    this.lastMoveListSignature = "";
    this.lastCurrentMoveId = "";
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要なReplay Elementがありません: #${id}`);
    return element;
  }

  showUnavailable(message) {
    this.empty.hidden = false;
    this.empty.textContent = message;
    this.board.innerHTML = "";
    this.moveList.innerHTML = "";
    this.senteHand.innerHTML = "";
    this.goteHand.innerHTML = "";
    this.status.textContent = "";
    this.warning.hidden = true;
    this.error.hidden = true;
    this.lastMoveListSignature = "";
    this.lastCurrentMoveId = "";
    this.#setNavigationDisabled(true);
    this.#updateAddPositionState({ currentMoveNumber: 0 });
  }

  render(viewModel) {
    this.empty.hidden = true;
    this.error.hidden = true;
    this.error.textContent = "";
    this.board.classList.toggle("is-flipped", viewModel.flipped);
    this.board.setAttribute(
      "aria-label",
      `将棋盤 ${viewModel.currentMoveNumber}手目 ${viewModel.sideToMoveLabel}`
    );

    const fileLabels = viewModel.fileLabels
      .map((label) => `<span class="replay-file-label">${label}</span>`)
      .join("");

    const squares = viewModel.squares.map((square, index) => {
      const classes = ["replay-square"];
      if (square.isLastFrom) classes.push("is-last-from");
      if (square.isLastTo) classes.push("is-last-to");
      const piece = shogiPieceSvg(square.piece);
      const rank = index % 9 === 8
        ? `<span class="replay-rank-label" aria-hidden="true">${viewModel.rankLabels[Math.floor(index / 9)]}</span>`
        : "";
      return `<button type="button" class="${classes.join(" ")}" data-square="${square.key}" aria-label="${escapeHtml(square.ariaLabel)}">${piece}${rank}</button>`;
    }).join("");

    this.board.innerHTML = `
      <div class="replay-file-label-row" aria-hidden="true">${fileLabels}</div>
      <div class="replay-board-grid">${squares}</div>`;

    this.senteHand.innerHTML = this.#handHtml("先手の持ち駒", viewModel.senteHand);
    this.goteHand.innerHTML = this.#handHtml("後手の持ち駒", viewModel.goteHand);
    this.#placeHands(viewModel.flipped);

    this.status.innerHTML = `
      <strong aria-live="polite">${viewModel.currentMoveNumber}手目 / ${viewModel.maxMoveNumber}手</strong>
      <span>現在：${escapeHtml(viewModel.currentMoveText)}</span>
      <span>直前：${escapeHtml(viewModel.previousMoveText)}</span>
      <span>${escapeHtml(viewModel.sideToMoveLabel)}</span>
      <span class="replay-build-status" data-status="${viewModel.status}">${escapeHtml(replayStatusLabel(viewModel.status))}</span>`;

    this.#renderMoveList(viewModel);

    this.firstButton.disabled = !viewModel.canPrevious;
    this.previousButton.disabled = !viewModel.canPrevious;
    this.nextButton.disabled = !viewModel.canNext;
    this.lastButton.disabled = !viewModel.canNext;
    this.range.disabled = false;
    this.numberInput.disabled = false;
    this.range.max = String(viewModel.maxMoveNumber);
    this.numberInput.max = String(viewModel.maxMoveNumber);
    this.range.value = String(viewModel.currentMoveNumber);
    this.numberInput.value = String(viewModel.currentMoveNumber);
    this.flipButton.disabled = false;
    this.jumpButton.disabled = false;
    this.flipButton.setAttribute("aria-pressed", String(viewModel.flipped));
    this.#updateAddPositionState(viewModel);

    const warningLines = viewModel.warnings.map((item) =>
      `${item.code}: ${item.message}`
    );
    if (viewModel.failure) {
      warningLines.push(
        `${viewModel.failure.code}: ${viewModel.failure.message} ` +
        `（${viewModel.failure.moveNumber ?? "?"}手目、` +
        `${viewModel.failure.replayableUntil}手目まで再現可能）`
      );
    }
    this.warning.textContent = warningLines.join("\n");
    this.warning.hidden = warningLines.length === 0;
  }

  renderError(errorViewModel) {
    this.empty.hidden = true;
    const moveText = errorViewModel.moveNumber === null
      ? ""
      : `\n原因手数：${errorViewModel.moveNumber}手目 ${errorViewModel.moveText}`;
    const replayable = errorViewModel.replayableUntil > 0
      ? `\n再現可能な最終手数：${errorViewModel.replayableUntil}手目`
      : "";
    this.error.innerHTML = `
      <strong>${escapeHtml(errorViewModel.message)}</strong>
      <span>${escapeHtml(errorViewModel.code)}</span>
      <pre>${escapeHtml(`${errorViewModel.detail}${moveText}${replayable}`)}</pre>`;
    this.error.hidden = false;
  }

  setKeyPositionCount(count) {
    this.keyPositionCount = Number.isInteger(count) ? count : 0;
    const currentMoveNumber = Number(this.numberInput.value || 0);
    this.#updateAddPositionState({ currentMoveNumber });
  }

  showAddResult({ kind = "info", message }) {
    this.addPositionReason.dataset.kind = kind;
    this.addPositionReason.textContent = message;
    this.addPositionReason.setAttribute("role", kind === "error" ? "alert" : "status");
  }

  #renderMoveList(viewModel) {
    const signature = moveListSignature(viewModel);
    if (signature !== this.lastMoveListSignature) {
      this.moveList.innerHTML = [
        `<button id="replay-move-0" type="button" role="option" aria-selected="false" class="replay-move-row" data-jump="0">0　初期局面</button>`,
        ...viewModel.moves.map((move) =>
          `<button id="${move.id}" type="button" role="option" aria-selected="false" class="replay-move-row" data-jump="${move.moveNumber}">${move.moveNumber}　${escapeHtml(move.notation)}</button>`
        ),
        ...(viewModel.termination ? [
          `<div class="replay-move-row is-termination" role="note">${viewModel.termination.moveNumber}　${escapeHtml(viewModel.termination.notation)}（終局）</div>`
        ] : [])
      ].join("");
      this.lastMoveListSignature = signature;
      this.lastCurrentMoveId = "";
    }

    if (this.lastCurrentMoveId && this.lastCurrentMoveId !== viewModel.currentMoveId) {
      const previous = this.moveList.querySelector(`#${this.lastCurrentMoveId}`);
      previous?.classList.remove("is-current");
      previous?.removeAttribute("aria-current");
      previous?.setAttribute("aria-selected", "false");
    }

    const current = this.moveList.querySelector(`#${viewModel.currentMoveId}`);
    if (current) {
      current.classList.add("is-current");
      current.setAttribute("aria-current", "true");
      current.setAttribute("aria-selected", "true");
      this.scrollPolicy.followCurrentMove({ container: this.moveList, item: current });
    }
    this.lastCurrentMoveId = viewModel.currentMoveId;
  }

  #updateAddPositionState({ currentMoveNumber = 0 } = {}) {
    const atInitial = currentMoveNumber < 1;
    const atLimit = this.keyPositionCount >= 5;
    this.addPositionButton.disabled = atInitial || atLimit || this.numberInput.disabled;
    const reason = atLimit
      ? "重要局面は5件登録済みです。既存候補を削除すると追加できます。"
      : atInitial
        ? "0手目は追加対象外です。1手目以降へ移動してください。"
        : "追加しても保存はされません。入力フォームで本人入力を追記し、最後に保存してください。";
    this.addPositionButton.title = reason;
    if (
      atLimit ||
      atInitial ||
      !this.addPositionReason.dataset.kind ||
      this.addPositionReason.dataset.kind === "availability"
    ) {
      this.addPositionReason.dataset.kind = "availability";
      this.addPositionReason.textContent = reason;
    }
  }

  scrollIntoView({ behavior = "smooth" } = {}) {
    this.board.scrollIntoView({ behavior, block: "center" });
  }

  #setNavigationDisabled(disabled) {
    for (const element of [
      this.firstButton,
      this.previousButton,
      this.nextButton,
      this.lastButton,
      this.range,
      this.numberInput,
      this.flipButton,
      this.jumpButton
    ]) {
      element.disabled = disabled;
    }
  }

  #placeHands(flipped) {
    const boardShell = this.board.closest(".replay-board-shell");
    if (!boardShell) return;
    const top = flipped ? this.senteHand : this.goteHand;
    const bottom = flipped ? this.goteHand : this.senteHand;
    boardShell.prepend(top);
    boardShell.append(bottom);
  }

  #handHtml(title, entries) {
    const content = entries.length
      ? entries.map((item) =>
        `<span class="replay-hand-piece">${escapeHtml(item.label)}${item.count > 1 ? `×${item.count}` : ""}</span>`
      ).join("")
      : `<span class="replay-hand-empty">なし</span>`;
    return `<strong>${title}</strong><div>${content}</div>`;
  }
}
