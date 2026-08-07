import { KeyPositionReplayViewModel } from "./KeyPositionReplayViewModel.js";

const MAX_KEY_POSITIONS = 5;
const MIN_VISIBLE_KEY_POSITIONS = 3;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function keyPositionMarkup(index, keyPositionId = `KP-${index + 1}`) {
  const number = index + 1;
  return `
    <article class="key-position-card" data-key-position data-key-position-index="${index}">
      <div class="card-heading-row">
        <div>
          <p class="eyebrow">KEY POSITION ${number}</p>
          <h3>重要局面 ${number}</h3>
          <p class="key-position-origin" data-replay-origin>手動入力または旧Data</p>
        </div>
        <button type="button" class="secondary-button compact-button" data-remove-key-position>この局面を削除</button>
      </div>
      <input type="hidden" data-field="keyPositionId" value="${escapeHtml(keyPositionId)}">
      <input type="hidden" data-field="replayReference" value="">
      <div class="field-grid three-columns key-position-auto-fields">
        <label>手数 <small>Replayから自動入力・編集可</small><input data-field="moveNumber" type="number" min="1" inputmode="numeric" placeholder="例：45"></label>
        <label>現在の指し手 <small>Replayから自動入力・編集可</small><input data-field="moveText" type="text" placeholder="例：７六歩(77)"></label>
        <label>局面Title <small>本人入力</small><input data-field="title" type="text" placeholder="例：攻めを急いだ局面"></label>
      </div>
      <details class="key-position-snapshot" data-snapshot-details hidden>
        <summary>局面Snapshotを表示</summary>
        <div data-snapshot-preview class="snapshot-preview" aria-live="polite"></div>
      </details>
      <label>盤面・局面Memo <small>Snapshotとは別の本人入力</small><textarea data-field="boardState" rows="2" placeholder="駒の配置や直前の流れを自分の言葉で記録"></textarea></label>
      <div class="observation-grid">
        <label class="fact-field"><span>FACT</span><small>自動生成されません</small><textarea data-field="fact" rows="3" placeholder="盤上で実際に起きたこと"></textarea></label>
        <label class="interpretation-field"><span>INTERPRETATION</span><small>自動生成されません</small><textarea data-field="interpretation" rows="3" placeholder="自分がどう受け取ったか"></textarea></label>
        <label class="hypothesis-field"><span>HYPOTHESIS</span><small>自動生成されません</small><textarea data-field="hypothesis" rows="3" placeholder="別の見方・次に確かめる可能性"></textarea></label>
      </div>
      <div class="field-grid two-columns">
        <label>自分が考えていたこと <textarea data-field="myThought" rows="3"></textarea></label>
        <label>相手の狙い <textarea data-field="opponentIntent" rows="3"></textarea></label>
        <label>感情 <input data-field="emotion" type="text" placeholder="例：焦り、安心、怖さ"></label>
        <label>感情が判断へ与えた影響 <textarea data-field="decisionImpact" rows="3"></textarea></label>
        <label>局面ごとの判断Pattern <textarea data-field="decisionPattern" rows="3"></textarea></label>
        <label>この局面からの学び <textarea data-field="learning" rows="3"></textarea></label>
      </div>
    </article>`;
}

function readField(container, fieldName) {
  return container.querySelector(`[data-field="${fieldName}"]`)?.value ?? "";
}

function parseReplayReference(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function hasCardContent(card) {
  return [
    "moveNumber", "moveText", "title", "boardState", "fact", "interpretation",
    "hypothesis", "myThought", "opponentIntent", "emotion", "decisionImpact",
    "decisionPattern", "learning", "replayReference"
  ].some((field) => readField(card, field).trim() !== "");
}

function nextUnusedId(cards) {
  const used = new Set(cards.map((card) => readField(card, "keyPositionId")));
  for (let number = 1; number <= MAX_KEY_POSITIONS; number += 1) {
    if (!used.has(`KP-${number}`)) return `KP-${number}`;
  }
  return `KP-${Date.now()}`;
}

export class BrowserGameReviewFormView {
  constructor({
    documentObject = document,
    snapshotViewModel = new KeyPositionReplayViewModel()
  } = {}) {
    this.document = documentObject;
    this.snapshotViewModel = snapshotViewModel;
    this.form = this.#required("game-review-form");
    this.keyPositionList = this.#required("key-position-list");
    this.feedback = this.#required("form-feedback");
    this.savedCount = this.#required("saved-count");
    this.keyPositionList.addEventListener("toggle", (event) => {
      const details = event.target.closest?.("[data-snapshot-details]");
      if (details?.open) this.renderSnapshotPreview(details.closest("[data-key-position]"));
    }, true);
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要なElementがありません: #${id}`);
    return element;
  }

  initializeKeyPositions(count = MIN_VISIBLE_KEY_POSITIONS) {
    const safeCount = Math.max(MIN_VISIBLE_KEY_POSITIONS, Math.min(MAX_KEY_POSITIONS, count));
    this.keyPositionList.innerHTML = Array.from(
      { length: safeCount },
      (_, index) => keyPositionMarkup(index)
    ).join("");
    this.#updateAddButton();
  }

  addKeyPosition() {
    const cards = [...this.keyPositionList.querySelectorAll("[data-key-position]")];
    if (cards.length >= MAX_KEY_POSITIONS) return -1;
    const index = cards.length;
    this.keyPositionList.insertAdjacentHTML(
      "beforeend",
      keyPositionMarkup(index, nextUnusedId(cards))
    );
    this.#updateAddButton();
    return index;
  }

  addReplayCandidate(candidate) {
    let cards = [...this.keyPositionList.querySelectorAll("[data-key-position]")];
    let index = cards.findIndex((card) => !hasCardContent(card));
    if (index < 0) {
      index = this.addKeyPosition();
      cards = [...this.keyPositionList.querySelectorAll("[data-key-position]")];
    }
    if (index < 0 || !cards[index]) throw new Error("重要局面Cardを追加できません。");
    this.#fillCard(cards[index], candidate, { replayReferenceIsSaved: false });
    this.#renumberKeyPositions();
    this.#updateAddButton();
    return index;
  }

  removeKeyPosition(button) {
    const card = button.closest("[data-key-position]");
    if (!card) return;
    const cards = this.keyPositionList.querySelectorAll("[data-key-position]");
    if (cards.length <= MIN_VISIBLE_KEY_POSITIONS) {
      this.#clearCard(card);
    } else {
      card.remove();
    }
    this.#renumberKeyPositions();
    this.#updateAddButton();
  }

  #clearCard(card) {
    for (const element of card.querySelectorAll("[data-field]")) {
      if (element.dataset.field !== "keyPositionId") element.value = "";
    }
    card.querySelector("[data-replay-origin]").textContent = "手動入力または旧Data";
    const details = card.querySelector("[data-snapshot-details]");
    details.hidden = true;
    details.open = false;
    card.querySelector("[data-snapshot-preview]").innerHTML = "";
  }

  #fillCard(card, position, { replayReferenceIsSaved = false } = {}) {
    for (const [field, value] of Object.entries(position)) {
      const element = card.querySelector(`[data-field="${field}"]`);
      if (!element) continue;
      if (field === "replayReference") {
        element.value = value ? JSON.stringify(value) : "";
      } else if (field !== "replayAdded") {
        element.value = value ?? "";
      }
    }
    this.#updateCardOrigin(card, { replayReferenceIsSaved });
  }

  #updateCardOrigin(card, { replayReferenceIsSaved = false } = {}) {
    const reference = parseReplayReference(readField(card, "replayReference"));
    const origin = card.querySelector("[data-replay-origin]");
    const details = card.querySelector("[data-snapshot-details]");
    if (reference && typeof reference === "object") {
      const saveLabel = replayReferenceIsSaved ? "保存済み" : "未保存";
      origin.textContent = reference.replayWarning
        ? `Replayから追加 · Warningあり · ${saveLabel}`
        : `Replayから追加 · ${saveLabel}`;
      details.hidden = false;
    } else {
      origin.textContent = "手動入力または旧Data";
      details.hidden = true;
    }
  }

  #renumberKeyPositions() {
    [...this.keyPositionList.querySelectorAll("[data-key-position]")]
      .forEach((card, index) => {
        card.dataset.keyPositionIndex = String(index);
        card.querySelector(".eyebrow").textContent = `KEY POSITION ${index + 1}`;
        card.querySelector("h3").textContent = `重要局面 ${index + 1}`;
      });
  }

  #updateAddButton() {
    const addButton = this.document.getElementById("add-key-position");
    if (addButton) {
      const count = this.getMeaningfulKeyPositionCount();
      addButton.disabled = count >= MAX_KEY_POSITIONS;
      addButton.title = addButton.disabled ? "重要局面は最大5件です。" : "空の重要局面Cardを追加します。";
    }
  }

  getMeaningfulKeyPositionCount() {
    return [...this.keyPositionList.querySelectorAll("[data-key-position]")]
      .filter(hasCardContent).length;
  }

  readInput() {
    const data = new FormData(this.form);
    const keyPositions = [...this.keyPositionList.querySelectorAll("[data-key-position]")]
      .map((card) => ({
        keyPositionId: readField(card, "keyPositionId"),
        moveNumber: readField(card, "moveNumber"),
        moveText: readField(card, "moveText"),
        title: readField(card, "title"),
        boardState: readField(card, "boardState"),
        fact: readField(card, "fact"),
        interpretation: readField(card, "interpretation"),
        hypothesis: readField(card, "hypothesis"),
        myThought: readField(card, "myThought"),
        opponentIntent: readField(card, "opponentIntent"),
        emotion: readField(card, "emotion"),
        decisionImpact: readField(card, "decisionImpact"),
        decisionPattern: readField(card, "decisionPattern"),
        learning: readField(card, "learning"),
        replayReference: parseReplayReference(readField(card, "replayReference"))
      }));

    return {
      reviewId: data.get("reviewId"),
      gameDate: data.get("gameDate"),
      side: data.get("side"),
      result: data.get("result"),
      opponentName: data.get("opponentName"),
      timeControl: data.get("timeControl"),
      kifuText: data.get("kifuText"),
      gameStory: data.get("gameStory"),
      keyPositions,
      decisionPattern: data.get("decisionPattern"),
      observationTheme: data.get("observationTheme"),
      actionRules: [1, 2, 3].map((number) => data.get(`actionRule${number}`)),
      note: data.get("note")
    };
  }

  setReviewId(reviewId) {
    this.form.elements.reviewId.value = reviewId;
  }

  setDefaultDate(localDateTimeValue) {
    this.form.elements.gameDate.value = localDateTimeValue;
  }

  resetForNextReview({ reviewId, localDateTimeValue }) {
    this.form.reset();
    this.initializeKeyPositions();
    this.setReviewId(reviewId);
    this.setDefaultDate(localDateTimeValue);
    this.form.elements.side.value = "SENTE";
    this.form.elements.result.value = "UNKNOWN";
  }

  loadInput(input, { replayReferencesAreSaved = false } = {}) {
    this.form.reset();
    const positions = Array.isArray(input.keyPositions) ? input.keyPositions : [];
    this.initializeKeyPositions(Math.max(MIN_VISIBLE_KEY_POSITIONS, positions.length));

    const values = {
      reviewId: input.reviewId,
      gameDate: input.gameDate,
      side: input.side,
      result: input.result,
      opponentName: input.opponentName,
      timeControl: input.timeControl,
      kifuText: input.kifuText,
      gameStory: input.gameStory,
      decisionPattern: input.decisionPattern,
      observationTheme: input.observationTheme,
      note: input.note
    };

    for (const [name, value] of Object.entries(values)) {
      if (this.form.elements[name]) this.form.elements[name].value = value ?? "";
    }

    [1, 2, 3].forEach((number) => {
      this.form.elements[`actionRule${number}`].value = input.actionRules?.[number - 1] ?? "";
    });

    const cards = [...this.keyPositionList.querySelectorAll("[data-key-position]")];
    positions.forEach((position, index) => {
      const card = cards[index];
      if (card) this.#fillCard(card, position, { replayReferenceIsSaved: replayReferencesAreSaved });
    });
    this.#updateAddButton();
  }


  markReplayReferencesSaved() {
    for (const card of this.keyPositionList.querySelectorAll("[data-key-position]")) {
      const reference = parseReplayReference(readField(card, "replayReference"));
      if (reference && typeof reference === "object") {
        this.#updateCardOrigin(card, { replayReferenceIsSaved: true });
      }
    }
  }

  focusKeyPosition(index) {
    const card = this.keyPositionList.querySelector(`[data-key-position-index="${index}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.querySelector('[data-field="title"]')?.focus();
  }

  renderSnapshotPreview(card) {
    if (!card) return;
    const preview = card.querySelector("[data-snapshot-preview]");
    const reference = parseReplayReference(readField(card, "replayReference"));
    if (!reference || typeof reference !== "object") {
      preview.textContent = "Snapshotはありません。";
      return;
    }
    try {
      const model = this.snapshotViewModel.create(reference.snapshot);
      const squares = model.squares.map((square) => {
        const classes = ["snapshot-square"];
        if (square.isLastFrom) classes.push("is-last-from");
        if (square.isLastTo) classes.push("is-last-to");
        const piece = square.piece
          ? `<span class="snapshot-piece${square.piece.rotated ? " is-rotated" : ""}${square.piece.promoted ? " is-promoted" : ""}" aria-hidden="true">${escapeHtml(square.piece.label)}</span>`
          : "";
        return `<span class="${classes.join(" ")}" role="gridcell" aria-label="${escapeHtml(square.ariaLabel)}">${piece}</span>`;
      }).join("");
      const handText = (entries) => entries.length
        ? entries.map((item) => `${item.label}${item.count > 1 ? `×${item.count}` : ""}`).join(" ")
        : "なし";
      preview.innerHTML = `
        <div class="snapshot-meta">
          <strong>${model.moveNumber}手目 ${escapeHtml(model.currentMove)}</strong>
          <span>直前：${escapeHtml(model.previousMove)}</span>
          <span>${escapeHtml(model.sideToMoveLabel)}</span>
          <span>Snapshot Version ${model.snapshotVersion}</span>
        </div>
        ${model.warning ? `<p class="snapshot-warning" role="status">Warning：${escapeHtml(model.warning.message)}</p>` : ""}
        <div class="snapshot-hand">後手持ち駒：${escapeHtml(handText(model.goteHand))}</div>
        <div class="snapshot-board" role="grid" aria-label="${model.moveNumber}手目の局面Snapshot">${squares}</div>
        <div class="snapshot-hand">先手持ち駒：${escapeHtml(handText(model.senteHand))}</div>`;
    } catch (error) {
      preview.textContent = `Snapshotを表示できません: ${error.code ?? error.name}`;
    }
  }

  showFeedback({ kind = "info", title, message, details = [] }) {
    this.feedback.dataset.kind = kind;
    this.feedback.hidden = false;
    const detailList = details.length
      ? `<ul>${details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";
    this.feedback.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>${detailList}`;
    this.feedback.focus();
  }

  updateSavedCount(count) {
    this.savedCount.textContent = String(count);
  }
}
