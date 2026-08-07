function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function textBlock(value, emptyText = "未記入") {
  const text = String(value ?? "").trim();
  return text ? `<p class="detail-text">${escapeHtml(text)}</p>` : `<p class="empty-text">${escapeHtml(emptyText)}</p>`;
}

function actionButtons(reviewId, { includeReplay = false } = {}) {
  const safeId = escapeHtml(reviewId);
  const replayButton = includeReplay
    ? `<button type="button" class="secondary-button compact-button" data-replay-review="${safeId}">棋譜を再現</button>`
    : "";
  return `<div class="review-actions">
    ${replayButton}
    <button type="button" class="secondary-button compact-button" data-edit-review="${safeId}">編集する</button>
    <button type="button" class="danger-button compact-button" data-delete-review="${safeId}">削除する</button>
  </div>`;
}

function exportButtons(reviewId, readyForNextGame) {
  const safeId = escapeHtml(reviewId);
  const cardDisabled = readyForNextGame ? "" : " disabled";
  const cardTitle = readyForNextGame
    ? "次局用Observation CardをPreviewします。"
    : "重要局面3〜5件、Observation Theme、実行Ruleが揃うと作成できます。";
  return `<div class="markdown-action-buttons" aria-label="Markdown成果物">
    <button type="button" class="secondary-button compact-button" data-preview-review-markdown="${safeId}">振り返り.md</button>
    <button type="button" class="primary-button compact-button" data-preview-observation-card="${safeId}" title="${escapeHtml(cardTitle)}"${cardDisabled}>次局用Observation Card.md</button>
  </div>`;
}

function missingGuidance(items = []) {
  const labels = {
    KEY_POSITIONS: "重要局面を3件以上記録する",
    OBSERVATION_THEME: "Observation Themeを1件決める",
    ACTION_RULES: "実行Ruleを1件以上決める"
  };
  if (!items.length) {
    return `<div class="reflection-guidance ready"><strong>Observation Cardを作成できます</strong><p>次局で観測するThemeと実行RuleをMarkdownへ変換できます。</p></div>`;
  }
  return `<div class="reflection-guidance"><strong>Observation Card作成まで残っている項目</strong><ul>${items.map((item) => `<li>${escapeHtml(labels[item] ?? item)}</li>`).join("")}</ul></div>`;
}

export class BrowserGameReviewLibraryView {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.list = this.#required("saved-review-list");
    this.detail = this.#required("saved-review-detail");
    this.library = this.#required("saved-review-library");
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要なElementがありません: #${id}`);
    return element;
  }

  renderList(viewModel) {
    if (viewModel.status === "EMPTY") {
      this.list.innerHTML = `<div class="library-empty"><strong>保存済み対局はありません</strong><p>最初の振り返りを入力して保存すると、ここから詳細表示・編集・削除できます。</p></div>`;
      return;
    }

    this.list.innerHTML = viewModel.items.map((item) => `
      <article class="review-list-card" data-review-card="${escapeHtml(item.reviewId)}">
        <button type="button" class="review-card-main" data-view-review="${escapeHtml(item.reviewId)}">
          <span class="review-card-date">${escapeHtml(item.displayDate)}</span>
          <strong>${escapeHtml(item.sideLabel)}・${escapeHtml(item.resultLabel)}</strong>
          <span>${escapeHtml(item.opponentLabel)}｜${escapeHtml(item.timeControlLabel)}</span>
          <span class="review-card-excerpt">${escapeHtml(item.storyExcerpt || "振り返り本文未記入")}</span>
          <span class="review-card-meta">重要局面 ${item.keyPositionCount}件・実行Rule ${item.actionRuleCount}件</span>
          <span class="readiness-badge" data-ready="${item.readyForNextGame}">${item.readyForNextGame ? "次局へ接続可能" : "振り返り途中"}</span>
        </button>
        ${actionButtons(item.reviewId)}
      </article>`).join("");
  }

  renderDetail(detail) {
    const keyPositions = detail.keyPositions.length
      ? detail.keyPositions.map((item) => `
        <article class="detail-key-position">
          <div class="detail-subheading"><span>重要局面 ${item.displayNumber}</span><strong>${escapeHtml(item.moveNumber)}手目｜${escapeHtml(item.title)}</strong></div>
          <dl class="detail-definition-grid">
            <div><dt>FACT</dt><dd>${escapeHtml(item.fact)}</dd></div>
            <div><dt>INTERPRETATION</dt><dd>${escapeHtml(item.interpretation)}</dd></div>
            <div><dt>HYPOTHESIS</dt><dd>${escapeHtml(item.hypothesis)}</dd></div>
          </dl>
          <div class="detail-two-columns">
            <section><h4>自分が考えていたこと</h4>${textBlock(item.myThought)}</section>
            <section><h4>相手の狙い</h4>${textBlock(item.opponentIntent)}</section>
            <section><h4>感情</h4>${textBlock(item.emotion)}</section>
            <section><h4>判断への影響</h4>${textBlock(item.decisionImpact)}</section>
          </div>
        </article>`).join("")
      : `<p class="empty-text">重要局面はまだ記録されていません。</p>`;

    const actionRules = detail.actionRules.length
      ? `<ol>${detail.actionRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ol>`
      : `<p class="empty-text">実行Ruleはまだありません。</p>`;

    this.detail.innerHTML = `
      <div class="detail-heading-row">
        <div><p class="eyebrow">SAVED REVIEW</p><h3>${escapeHtml(detail.displayDate)}の振り返り</h3><p>${escapeHtml(detail.sideLabel)}・${escapeHtml(detail.resultLabel)}｜${escapeHtml(detail.opponentLabel)}</p></div>
        ${actionButtons(detail.reviewId, { includeReplay: true })}
      </div>
      ${exportButtons(detail.reviewId, detail.readyForNextGame)}
      ${missingGuidance(detail.missingReflectionItems)}
      <section class="detail-section"><h4>対局の物語</h4>${textBlock(detail.gameStory)}</section>
      <section class="detail-section"><h4>棋譜Text</h4><pre>${escapeHtml(detail.kifuText)}</pre></section>
      <section class="detail-section"><h4>重要局面</h4>${keyPositions}</section>
      <section class="detail-two-columns">
        <section><h4>判断Pattern</h4>${textBlock(detail.decisionPattern)}</section>
        <section><h4>Observation Theme</h4>${textBlock(detail.observationTheme)}</section>
      </section>
      <section class="detail-section"><h4>次局の実行Rule</h4>${actionRules}</section>
      <section class="detail-section"><h4>自由Memo</h4>${textBlock(detail.note)}</section>
      <div class="detail-status" data-ready="${detail.readyForNextGame}">${detail.readyForNextGame ? "次局へ接続できる状態です" : "振り返り途中です"}</div>`;
  }

  clearDetail() {
    this.detail.innerHTML = `<div class="library-empty"><strong>対局を選択してください</strong><p>一覧のCardを押すと、棋譜・重要局面・Observation Theme・実行RuleとMarkdown出力を確認できます。</p></div>`;
  }
}
